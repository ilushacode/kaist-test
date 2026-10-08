#!/usr/bin/env python3
"""
Парсер расписания занятий КНИТУ-КАИ (один шард).

Особенности API портала:
  - HTTP/1.1 обязателен (на HTTP/2 сервер отвечает REFUSED_STREAM).
    aiohttp использует HTTP/1.1 — проблемы нет.
  - Content-Type ответа — text/html;charset=UTF-8, но тело — JSON.
    Поэтому resp.json() не используется, парсим text вручную.
  - programForm=4toto даёт объект по дням недели с полем dayNum,
    даже для заочников. Всегда используем именно это значение.
  - В строковых полях много паддинга пробелами — везде strip().

Результат шарда — компактный JSON:
  { "shard": N, "totalShards": M,
    "groups": { "<group>": [ <lesson>, ... ], ... },
    "failures": { "<group>": "<error repr>", ... } }
"""

from __future__ import annotations

import asyncio
import json
import os
import random
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
    """Выполняет запрос и парсит JSON из text/html ответа."""
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
                if not text.strip():
                    raise FetchError("empty response body")
                try:
                    return json.loads(text)
                except json.JSONDecodeError as e:
                    # битый JSON — ретраить бессмысленно
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


async def get_schedule_for_group(
    session: aiohttp.ClientSession, group_id: int
) -> dict | list:
    params = {**LIFERAY_PARAMS, "p_p_resource_id": "schedule"}
    data = {"groupId": str(group_id), "programForm": "4toto"}
    result = await fetch_json(session, "POST", BASE_URL, params=params, data=data)
    if result is None:
        return {}
    if not isinstance(result, (dict, list)):
        raise FetchError(f"unexpected schedule payload: {type(result).__name__}")
    return result


# ─────────────────────────── нормализация ───────────────────────────

def _s(value: Any) -> str:
    """Строка без паддинга пробелами (в ответах Лайфрея он повсюду)."""
    if value is None:
        return ""
    return " ".join(str(value).split())   # схлопывает и вед. и хвост. пробелы


def _parse_dates(raw: str) -> list[str]:
    """'02.09 09.09 16.09' -> ['02.09','09.09','16.09']."""
    return [d for d in raw.split() if d]


def normalize_lesson(raw: dict) -> dict:
    """Сырое занятие -> компактная схема."""
    lesson: dict[str, Any] = {
        "d":  _s(raw.get("dayNum")),
        "t":  _s(raw.get("dayTime")),
        "s":  _s(raw.get("disciplName")),
        "k":  _s(raw.get("disciplType")),
        "p":  _s(raw.get("prepodName")),
        "a":  _s(raw.get("audNum")),
        "b":  _s(raw.get("buildNum")),
        "u":  _s(raw.get("orgUnitName")),
        "ds": _parse_dates(_s(raw.get("dayDate"))),
    }
    return {k: v for k, v in lesson.items() if v not in ("", [], None)}


def normalize_schedule(raw: dict | list) -> list[dict]:
    """Ответ API -> плоский список занятий."""
    if isinstance(raw, list):
        items = raw
    elif isinstance(raw, dict):
        items = []
        for v in raw.values():
            if isinstance(v, list):
                items.extend(v)
    else:
        return []

    lessons = [normalize_lesson(x) for x in items if isinstance(x, dict)]

    # сортировка: день, время — детерминированный результат для сравнения
    lessons.sort(key=lambda x: (x.get("d", ""), x.get("t", ""),
                                x.get("s", ""), x.get("p", "")))
    return lessons


# ─────────────────────────── шард ───────────────────────────

async def process_shard(shard_index: int, total_shards: int, output_path: str) -> None:
    async with aiohttp.ClientSession() as session:
        print(f"[shard {shard_index}] fetching groups...")
        all_groups = await get_all_groups(session)
        print(f"[shard {shard_index}] total groups: {len(all_groups)}")

        # шардинг по стабильному id, а не по индексу
        my_groups = [
            g for g in all_groups
            if isinstance(g.get("id"), int) and (g["id"] % total_shards) == shard_index
        ]
        print(f"[shard {shard_index}] groups in shard: {len(my_groups)}")

        result: dict[str, list[dict]] = {}
        failures: dict[str, str] = {}

        for idx, group in enumerate(my_groups, 1):
            group_id = group["id"]
            group_name = _s(group.get("group"))
            try:
                raw = await get_schedule_for_group(session, group_id)
                result[group_name] = normalize_schedule(raw)
                print(f"  [{idx}/{len(my_groups)}] {group_name}: ok "
                      f"({len(result[group_name])} lessons)")
            except Exception as e:
                failures[group_name] = repr(e)
                print(f"  [{idx}/{len(my_groups)}] {group_name}: FAIL {e!r}",
                      file=sys.stderr)

            if idx < len(my_groups):
                await asyncio.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

        payload = {
            "shard": shard_index,
            "totalShards": total_shards,
            "groups": result,
            "failures": failures,
        }
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))

        print(f"[shard {shard_index}] saved {len(result)} groups, "
              f"{len(failures)} failures -> {output_path}")

        if failures:
            print(f"[shard {shard_index}] WARNING: {len(failures)} failures",
                  file=sys.stderr)


def main() -> None:
    shard_index = int(os.environ["SHARD_INDEX"])
    total_shards = int(os.environ["TOTAL_SHARDS"])
    output_dir = os.environ.get(
        "OUTPUT_DIR", os.path.dirname(os.path.abspath(__file__))
    )
    output_path = os.path.join(output_dir, f"schedule-part-{shard_index}.json")

    print(f"start shard {shard_index}/{total_shards} -> {output_path}")
    asyncio.run(process_shard(shard_index, total_shards, output_path))


if __name__ == "__main__":
    main()