#!/usr/bin/env python3
"""
Парсер расписания занятий КНИТУ-КАИ.

Обходит все группы, закреплённые за данным шардом, и сохраняет результат
в файл schedule-part-{shard}.json в корне репозитория.

Особенности API портала:
  - HTTP/1.1 обязателен: на HTTP/2 сервер отвечает REFUSED_STREAM.
    aiohttp использует HTTP/1.1 и проблемы не видит.
  - Content-Type ответа — text/html;charset=UTF-8, но тело — JSON.
    Поэтому resp.json() не используется, парсим text вручную.
  - programForm=4toto даёт объект по дням недели с полем dayNum,
    даже для заочников. Всегда используем именно это значение.
"""

import asyncio
import json
import os
import random
import sys

import aiohttp

# ─────────────────────────────────────────────────────────────
# Конфигурация
# ─────────────────────────────────────────────────────────────

BASE_URL = "https://kai.ru/web/studentu/raspisanie1"

# Общие параметры Liferay (обязательны для всех эндпоинтов портала)
LIFERAY_PARAMS = {
    "p_p_id": "pubStudentSchedule_WAR_publicStudentSchedule10",
    "p_p_lifecycle": "2",
    "p_p_state": "normal",
    "p_p_mode": "view",
    "p_p_cacheability": "cacheLevelPage",
    "p_p_col_id": "column-1",
    "p_p_col_count": "1",
}

# Ротация User-Agent — маскировка под разных пользователей
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

# Пауза между запросами внутри одного джоба (секунды)
MIN_DELAY = 1.5
MAX_DELAY = 3.0

# Сколько попыток на один запрос
MAX_RETRIES = 3


# ─────────────────────────────────────────────────────────────
# HTTP-обёртки
# ─────────────────────────────────────────────────────────────

async def fetch_json(
    session: aiohttp.ClientSession,
    method: str,
    url: str,
    params: dict | None = None,
    data: dict | None = None,
) -> dict | list:
    """
    Выполняет запрос и парсит JSON из text/html ответа.
    API портала отдаёт Content-Type: text/html, но тело — JSON.
    """
    headers = {**HEADERS_BASE, "User-Agent": random.choice(USER_AGENTS)}

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with session.request(
                method, url, params=params, data=data, headers=headers
            ) as resp:
                if resp.status != 200:
                    raise RuntimeError(f"HTTP {resp.status}")

                text = await resp.text()
                if not text.strip():
                    return {}

                return json.loads(text)

        except Exception as e:
            if attempt == MAX_RETRIES:
                raise
            delay = (2 ** attempt) + random.uniform(0, 1)
            print(
                f"    Попытка {attempt} не удалась: {e}. Ждём {delay:.1f}с...",
                file=sys.stderr,
            )
            await asyncio.sleep(delay)

    return {}


async def get_all_groups(session: aiohttp.ClientSession) -> list[dict]:
    """
    Получает весь справочник групп одним запросом.
    Пустой query отдаёт все 909 групп (~55 КБ).
    """
    params = {**LIFERAY_PARAMS, "p_p_resource_id": "getGroupsURL", "query": ""}
    data = await fetch_json(session, "GET", BASE_URL, params=params)
    if not isinstance(data, list):
        raise RuntimeError(f"Ожидался список групп, получено: {type(data)}")
    return data


async def get_schedule_for_group(
    session: aiohttp.ClientSession, group_id: int, group_name: str
) -> dict:
    """
    Получает расписание одной группы.
    Всегда использует programForm=4toto — это даёт объект по дням
    с полем dayNum, даже для заочников.
    """
    params = {**LIFERAY_PARAMS, "p_p_resource_id": "schedule"}
    data = {"groupId": str(group_id), "programForm": "4toto"}

    result = await fetch_json(session, "POST", BASE_URL, params=params, data=data)

    if not result:
        return {}

    return result


# ─────────────────────────────────────────────────────────────
# Основная логика шарда
# ─────────────────────────────────────────────────────────────

async def process_shard(shard_index: int, total_shards: int, output_path: str):
    """
    Обрабатывает группы, закреплённые за данным шардом.
    Группа с индексом i попадает в шард (i % total_shards).
    """
    async with aiohttp.ClientSession() as session:
        print(f"[shard {shard_index}] Получаем справочник групп...")
        all_groups = await get_all_groups(session)
        print(f"[shard {shard_index}] Всего групп: {len(all_groups)}")

        # Фильтруем группы для этого шарда
        my_groups = [
            g for i, g in enumerate(all_groups) if i % total_shards == shard_index
        ]
        print(f"[shard {shard_index}] Групп в шарде: {len(my_groups)}")

        result: dict[str, dict] = {}

        for idx, group in enumerate(my_groups):
            group_id = group["id"]
            group_name = group["group"]

            try:
                schedule = await get_schedule_for_group(
                    session, group_id, group_name
                )
                result[group_name] = schedule
                print(f"  [{idx + 1}/{len(my_groups)}] {group_name}: ок")

            except Exception as e:
                # При ошибке сохраняем пустое расписание, чтобы не терять группу
                print(
                    f"  [{idx + 1}/{len(my_groups)}] {group_name}: ошибка — {e}",
                    file=sys.stderr,
                )
                result[group_name] = {}

            # Пауза между запросами (кроме последнего)
            if idx < len(my_groups) - 1:
                delay = random.uniform(MIN_DELAY, MAX_DELAY)
                await asyncio.sleep(delay)

        # Сохраняем результат шарда
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(
                result,
                f,
                ensure_ascii=False,
                separators=(",", ":"),
            )

        print(f"[shard {shard_index}] Сохранено {len(result)} групп в {output_path}")


# ─────────────────────────────────────────────────────────────
# Точка входа
# ─────────────────────────────────────────────────────────────

def main():
    shard_index = int(os.environ["SHARD_INDEX"])
    total_shards = int(os.environ["TOTAL_SHARDS"])

    # OUTPUT_DIR задаётся в workflow как github.workspace (корень репозитория).
    # Если переменной нет (локальный запуск) — пишем рядом со скриптом.
    output_dir = os.environ.get(
        "OUTPUT_DIR", os.path.dirname(os.path.abspath(__file__))
    )
    output_path = os.path.join(output_dir, f"schedule-part-{shard_index}.json")

    print(f"Запуск шарда {shard_index}/{total_shards}")
    print(f"Результат будет записан в: {output_path}")

    asyncio.run(process_shard(shard_index, total_shards, output_path))


if __name__ == "__main__":
    main()