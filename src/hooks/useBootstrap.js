import { useEffect, useState } from "react";
import axios from "axios";
import { useStore } from "./useStore";

const TIMEOUT_MS = 3000;
const API_URL = "https://api-kaist.duodev.space/schedule/range";
const RANGE_DAYS = 14;

// Date -> "DD.MM"
const formatDM = (date) => {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}.${m}`;
};

// Строит "01.09-14.09" на основе старта и количества дней (включительно)
const formatRange = (startDate, days = RANGE_DAYS) => {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + days - 1); // 14 дней включая старт

  return `${formatDM(start)}-${formatDM(end)}`;
};

// Стабильный ключ от списка групп — чтобы useEffect не срабатывал
// на каждый новый массив с теми же значениями
const groupsKey = (groups) => groups.join("|");

export default function useBootstrap(today) {
  const groups = useStore((s) => s.groups);
  const [ready, setReady] = useState(false);

  const key = groupsKey(groups);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    // Сбрасываем ready при каждом новом наборе групп.
    // Пока новый range не приедет — App покажет LoaderScreen,
    // а ScheduleComponent не будет дёргать /schedule/day.
    setReady(false);

    (async () => {
      const {
        groups,
        needsUpdate,
        replaceCache,
        setGroupSchedule,
      } = useStore.getState();

      if (groups.length === 0) {
        if (!cancelled) setReady(true);
        return;
      }

      const dateParam = formatRange(today); // "24.09-07.10"

      try {
        const results = await Promise.all(
          groups.map(async (number) => {
            const cached = useStore.getState().scheduleCache[number];
            if (cached && !needsUpdate()) {
              return [number, cached];
            }

            const { data } = await axios.get(API_URL, {
              params: { group: number, dates: dateParam },
              signal: controller.signal,
              timeout: TIMEOUT_MS,
            });
            return [number, data.days ?? {}];
          })
        );

        if (cancelled) return;

        if (needsUpdate()) {
          replaceCache(Object.fromEntries(results));
        } else {
          for (const [number, days] of results) {
            setGroupSchedule(number, days);
          }
        }
      } catch (err) {
        if (axios.isCancel?.(err) || err.name === "CanceledError") return;
        console.warn("Bootstrap: используем старый кэш.", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [key, today]);

  return ready;
}