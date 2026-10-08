#!/usr/bin/env python3
"""Собирает шарды в один schedule.json.

Особенности:
  - Падает, если пришло меньше шардов, чем ожидалось (защита от
    публикации частичного датасета).
  - Сравнивает результат с уже опубликованным schedule.json и НЕ пишет
    файл, если расписание не изменилось. Защищает от лишних коммитов
    и от лишних перезагрузок у клиента.
  - Все поля уже нормализованы в шардах (strip сделан в parse_schedule.py).
  - Пишет только { meta, groups } в ./work/schedule.json.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

WORK_DIR      = Path(os.environ.get("WORK_DIR", "work"))
SHARDS_DIR    = WORK_DIR / "shards"
OUT_FILE      = WORK_DIR / "schedule.json"
EXISTING_FILE = WORK_DIR / "existing" / "schedule.json"


def canonical_groups(groups: dict) -> str:
    """Стабильное строковое представление содержимого для сравнения.

    Сортируем группы по имени, ключи внутри — sort_keys=True.
    Это исключает ложные «изменения» из-за разного порядка ключей.
    """
    normalized = {g: groups[g] for g in sorted(groups)}
    return json.dumps(
        normalized, ensure_ascii=False, separators=(",", ":"), sort_keys=True,
    )


def main() -> int:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    SHARDS_DIR.mkdir(parents=True, exist_ok=True)

    shard_files = sorted(SHARDS_DIR.glob("schedule-part-*.json"))
    print(f"shard files found: {len(shard_files)}")

    if not shard_files:
        print("ERROR: no shard artifacts", file=sys.stderr)
        return 2

    groups: dict[str, list[dict]] = {}
    failures: dict[str, str] = {}
    total_shards: int | None = None

    for path in shard_files:
        data = json.loads(path.read_text(encoding="utf-8"))
        if total_shards is None:
            total_shards = data.get("totalShards")
        groups.update(data.get("groups", {}))
        failures.update(data.get("failures", {}))

    print(f"groups collected: {len(groups)}, failures: {len(failures)}, "
          f"totalShards(expected): {total_shards}")

    # Защита: не публикуем частичный датасет.
    if total_shards is not None and len(shard_files) != total_shards:
        print(
            f"ERROR: expected {total_shards} shard artifacts, "
            f"got {len(shard_files)}. Refusing to publish.",
            file=sys.stderr,
        )
        return 3

    if not groups:
        print("ERROR: no groups parsed", file=sys.stderr)
        return 4

    lessons_total = sum(len(v) for v in groups.values())

    new_canonical = canonical_groups(groups)
    new_hash = hashlib.sha256(new_canonical.encode("utf-8")).hexdigest()[:16]

    # Сравнение с уже опубликованным файлом.
    changed = True
    if EXISTING_FILE.exists():
        try:
            existing = json.loads(EXISTING_FILE.read_text(encoding="utf-8"))
            old_groups = existing.get("groups", {})
            old_hash = hashlib.sha256(
                canonical_groups(old_groups).encode("utf-8")
            ).hexdigest()[:16]
            if old_hash == new_hash:
                changed = False
            print(f"existing hash={old_hash}, new hash={new_hash}, "
                  f"changed={changed}")
        except Exception as e:
            print(f"WARN: cannot read existing schedule.json: {e!r}",
                  file=sys.stderr)

    # GitHub Actions output
    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")
            f.write(f"content_hash={new_hash}\n")
            f.write(f"groups_count={len(groups)}\n")
            f.write(f"lessons_count={lessons_total}\n")

    if not changed:
        print("schedule unchanged — nothing to write/push")
        return 0

    meta = {
        "contentHash": new_hash,
        "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "groupsCount": len(groups),
        "lessonsCount": lessons_total,
        "failuresCount": len(failures),
    }
    if failures:
        print(f"WARNING: {len(failures)} failures", file=sys.stderr)
        for name, err in list(failures.items())[:10]:
            print(f"   {name}: {err}", file=sys.stderr)

    out = {"meta": meta, "groups": groups}
    payload = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    OUT_FILE.write_text(payload, encoding="utf-8")

    print(f"schedule.json written: {OUT_FILE} "
          f"({len(payload) / 1024:.1f} KB, {len(groups)} groups, "
          f"{lessons_total} lessons)")
    return 0


if __name__ == "__main__":
    sys.exit(main())