#!/usr/bin/env python3
"""
Собирает шарды экзаменов в один exams.json.
"""

from __future__ import annotations

import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

WORK_DIR      = Path(os.environ.get("WORK_DIR", "work"))
SHARDS_DIR    = WORK_DIR / "shards-exams"
OUT_FILE      = WORK_DIR / "exams.json"
EXISTING_FILE = WORK_DIR / "existing" / "exams.json"


def canonical_groups(groups: dict) -> str:
    normalized = {g: groups[g] for g in sorted(groups)}
    return json.dumps(
        normalized, ensure_ascii=False, separators=(",", ":"), sort_keys=True,
    )


def main() -> int:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    SHARDS_DIR.mkdir(parents=True, exist_ok=True)

    shard_files = sorted(SHARDS_DIR.glob("exams-part-*.json"))
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

    exams_total = sum(len(v) for v in groups.values())
    groups_with_exams = sum(1 for v in groups.values() if v)

    new_canonical = canonical_groups(groups)
    new_hash = hashlib.sha256(new_canonical.encode("utf-8")).hexdigest()[:16]

    # Сравнение с опубликованным.
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
            print(f"WARN: cannot read existing exams.json: {e!r}",
                  file=sys.stderr)

    gh_output = os.environ.get("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"changed={'true' if changed else 'false'}\n")
            f.write(f"content_hash={new_hash}\n")
            f.write(f"groups_count={len(groups)}\n")
            f.write(f"groups_with_exams={groups_with_exams}\n")
            f.write(f"exams_count={exams_total}\n")

    if not changed:
        print("exams unchanged — nothing to write/push")
        return 0

    meta = {
        "contentHash": new_hash,
        "updatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "groupsCount": len(groups),
        "groupsWithExams": groups_with_exams,
        "examsCount": exams_total,
        "failuresCount": len(failures),
    }
    if failures:
        print(f"WARNING: {len(failures)} failures", file=sys.stderr)
        for name, err in list(failures.items())[:10]:
            print(f"   {name}: {err}", file=sys.stderr)

    out = {"meta": meta, "groups": groups}
    payload = json.dumps(out, ensure_ascii=False, separators=(",", ":"))
    OUT_FILE.write_text(payload, encoding="utf-8")

    print(f"exams.json written: {OUT_FILE} "
          f"({len(payload) / 1024:.1f} KB, {len(groups)} groups, "
          f"{exams_total} exams, {groups_with_exams} groups with exams)")
    return 0


if __name__ == "__main__":
    sys.exit(main())