#!/usr/bin/env python3
"""
Парсер расписания экзаменов КНИТУ-КАИ (один шард).
"""

from __future__ import annotations

import asyncio
import json
import os
import random
import re
import sys
from typing import Any

import aiohttp

# ─────────────────────────── конфиг ───────────────────────────

BASE_URL = "https://kai.ru/web/studentu/raspisanie1"

LIFERAY_PARAMS = {
    "p_p_id": "pubStudentSchedule_WAR_publicStudentSchedule10",
    "p_p_lifecycle": "2",
    "p_p_state": "normal",
    "p_p_mode": "view",
    "p_p_cacheability": "cacheLevelPage",
    "p_p_col_id": "column-1",
    "p_p_col_count": "1",
}

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 "
    "(KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) "
    "Gecko/20100101 Firefox/127.0",
]

HEADERS_BASE = {
    "Accept": "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
    "Referer": "https://kai.ru/web/studentu/raspisanie1",
    "X-Requested-With": "XMLHttpRequest",
}

MIN_DELAY = 1.0
MAX_DELAY = 2.5
MAX_RETRIES = 3
REQUEST_TIMEOUT = aiohttp.ClientTimeout(total=30, connect=10, sock_read=20)

GROUP_NAME_RE = re.compile(r"^\d{4}$")

# examDate: одна дата, с годом или без. Не проверено эмпирически (§1.3),
# поэтому регекс терпимый — не падаем, если формат окажется иным.
EXAM_DATE_RE = re.compile(r"(\d{2}\.\d{2}(?:\.\d{4})?)")


# ─────────────────────────── HTTP ───────────────────────────

class FetchError(RuntimeError):
    pass


async def fetch_json(
    session: aiohttp.ClientSession,
    method: str,
    url: str,
    params: dict | None = None,
    data: dict | None = None,
) -> Any:
    """Запрос + ручной json.loads (Content-Type = text/html)."""
    headers = {**HEADERS_BASE, "User-Agent": random.choice(USER_AGENTS)}
    last_exc: Exception | None = None

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.request(
                method, url, params=params, data=data, headers=headers,
                timeout=REQUEST_TIMEOUT,
            ) as resp:
                if resp.status != 200:
                    raise FetchError(f"HTTP {resp.status}")
                text = await resp.text()
                # Пустое тело для этого эндпоинта не встречается — но
                # подстрахуемся: трактуем как [].
                if not text.strip():
                    return []
                try:
                    return json.loads(text)
                except json.JSONDecodeError as e:
                    raise FetchError(f"invalid JSON: {e}") from e

        except (aiohttp.ClientError, asyncio.TimeoutError) as e:
            last_exc = e
        except FetchError as e:
            if "invalid JSON" in str(e):
                raise
            last_exc = e

        if attempt < MAX_RETRIES:
            delay = (2 ** attempt) + random.uniform(0, 1)
            print(f"    retry {attempt}: {last_exc!r}, sleep {delay:.1f}s",
                  file=sys.stderr)
            await asyncio.sleep(delay)

    raise FetchError(f"all retries failed: {last_exc!r}")


async def get_all_groups(session: aiohttp.ClientSession) -> list[dict]:
    params = {**LIFERAY_PARAMS, "p_p_resource_id": "getGroupsURL", "query": ""}
    data = await fetch_json(session, "GET", BASE_URL, params=params)
    if not isinstance(data, list):
        raise FetchError(f"expected list of groups, got {type(data).__name__}")
    return data


async def get_exams_for_group(
    session: aiohttp.ClientSession, group_id: int
) -> list:
    """POST groupId=<id> БЕЗ programForm (см. §1.3)."""
    params = {**LIFERAY_PARAMS, "p_p_resource_id": "examSchedule"}
    data = {"groupId": str(group_id)}
    result = await fetch_json(session, "POST", BASE_URL, params=params, data=data)
    if result is None:
        return []
    if not isinstance(result, list):
        # Теоретически может прийти {} — тогда это пусто.
        if isinstance(result, dict):
            return []
        raise FetchError(f"unexpected exam payload: {type(result).__name__}")
    return result


# ─────────────────────────── нормализация ───────────────────────────

def _s(value: Any) -> str:
    """Убирает паддинг пробелами и \xa0."""
    if value is None:
        return ""
    return " ".join(str(value).split())


def _extract_date(raw: str) -> str:
    """'15.09.2026' -> '15.09.2026'; '15.09' -> '15.09'; мусор -> ''."""
    if not raw:
        return ""
    m = EXAM_DATE_RE.search(raw)
    return m.group(1) if m else ""


def normalize_exam(raw: dict) -> dict:
    """
    Сырое занятие -> компактная схема.

    Ключи:
      dt — examDate (нормализованная дата)
      tm — examTime
      s  — disciplName
      k  — disciplNum (не уникален, но полезен для диагностики)
      p  — prepodName
      a  — audNum
      b  — buildNum
      l  — prepodLogin
    """
    exam: dict[str, Any] = {
        "dt": _extract_date(_s(raw.get("examDate"))),
        "tm": _s(raw.get("examTime")),
        "s":  _s(raw.get("disciplName")),
        "k":  _s(raw.get("disciplNum")),
        "p":  _s(raw.get("prepodName")),
        "a":  _s(raw.get("audNum")),
        "b":  _s(raw.get("buildNum")),
        "l":  _s(raw.get("prepodLogin")),
    }
    return {k: v for k, v in exam.items() if v not in ("", None)}


def normalize_exams(raw: list) -> list[dict]:
    """Плоский массив API -> нормализованный список."""
    if not isinstance(raw, list):
        return []
    exams = [normalize_exam(x) for x in raw if isinstance(x, dict)]

    # Детерминированный порядок — чтобы сравнение «изменилось / нет»
    # не ловило ложные диффы из-за перемешивания.
    exams.sort(key=lambda x: (
        x.get("dt", ""), x.get("tm", ""), x.get("s", ""), x.get("p", ""),
    ))
    return exams


# ─────────────────────────── шард ───────────────────────────

async def process_shard(shard_index: int, total_shards: int, output_path: str) -> None:
    async with aiohttp.ClientSession() as session:
        print(f"[shard {shard_index}] fetching groups...")
        all_groups = await get_all_groups(session)
        print(f"[shard {shard_index}] total groups: {len(all_groups)}")

        my_groups = [
            g for g in all_groups
            if isinstance(g.get("id"), int)
            and GROUP_NAME_RE.match(_s(g.get("group")))
            and (g["id"] % total_shards) == shard_index
        ]
        print(f"[shard {shard_index}] groups in shard: {len(my_groups)}")

        result: dict[str, list[dict]] = {}
        failures: dict[str, str] = {}

        for idx, group in enumerate(my_groups, 1):
            group_id = group["id"]
            group_name = _s(group.get("group"))
            try:
                raw = await get_exams_for_group(session, group_id)
                result[group_name] = normalize_exams(raw)
                print(f"  [{idx}/{len(my_groups)}] {group_name}: ok "
                      f"({len(result[group_name])} exams)")
            except Exception as e:
                failures[group_name] = repr(e)
                print(f"  [{idx}/{len(my_groups)}] {group_name}: FAIL {e!r}",
                      file=sys.stderr)

            if idx < len(my_groups):
                await asyncio.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

        payload = {
            "shard": shard_index,
            "totalShards": total_shards,
            "kind": "exams",
            "groups": result,
            "failures": failures,
        }
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

        print(f"[shard {shard_index}] saved {len(result)} groups, "
              f"{len(failures)} failures -> {output_path}")


def main() -> None:
    shard_index = int(os.environ["SHARD_INDEX"])
    total_shards = int(os.environ["TOTAL_SHARDS"])

    output_dir = os.environ.get("WORK_DIR", "work")
    os.makedirs(output_dir, exist_ok=True)
    output_path = os.path.join(output_dir, f"exams-part-{shard_index}.json")

    print(f"start shard {shard_index}/{total_shards} -> {output_path}")
    asyncio.run(process_shard(shard_index, total_shards, output_path))


if __name__ == "__main__":
    main()