import { useEffect, useState } from 'react';
import { useStore } from './useStore';
import { fetchRangeSchedule } from '../api/schedule';
import { isCancelError } from '../api/client';
import { formatDateRange } from '../utils/date';
import { BOOTSTRAP_RANGE_DAYS, BOOTSTRAP_TIMEOUT_MS } from '../config';

// Стабильный ключ от списка групп — чтобы useEffect не срабатывал
// на каждый новый массив с теми же значениями
const groupsKey = (groups) => groups.join('|');

/**
 * Загружает расписание на 14 дней вперёд для всех групп.
 * Возвращает true, когда данные готовы (или bootstrap завершился с ошибкой).
 *
 * Логика ready:
 * - Холодный старт (нет кэша ни для одной группы) → ready=false, показываем лоадер.
 * - Добавление/удаление группы при наличии кэша → ready остаётся true,
 *   расписание догружается в фоне без моргания лоадером.
 *
 * @param {Date} today — сегодняшняя дата (стабильная ссылка)
 */
export default function useBootstrap(today) {
  const groups = useStore((s) => s.groups);
  const [ready, setReady] = useState(false);

  const key = groupsKey(groups);
  const todayTs = today.getTime();

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      const {
        groups: currentGroups,
        needsUpdate,
        replaceCache,
        setGroupSchedule,
        scheduleCache,
      } = useStore.getState();

      // Групп нет — сразу готовы (App.jsx покажет SetGroupComponent)
      if (currentGroups.length === 0) {
        if (!cancelled) setReady(true);
        return;
      }

      // «Холодный старт» — ни для одной группы нет кэша.
      // Только в этом случае показываем лоадер.
      // В остальных сценариях (добавление/удаление группы) ready не трогаем.
      const hasAnyCache = currentGroups.some((g) => scheduleCache[g]);
      const isColdStart = !ready && !hasAnyCache;

      if (isColdStart && !cancelled) {
        setReady(false);
      }

      const dateParam = formatDateRange(today, BOOTSTRAP_RANGE_DAYS);
      const shouldReplaceAll = needsUpdate();

      try {
        const results = await Promise.all(
          currentGroups.map(async (number) => {
            const cached = scheduleCache[number];
            if (cached && !shouldReplaceAll) {
              return [number, cached];
            }

            const days = await fetchRangeSchedule(number, dateParam, {
              signal: controller.signal,
              timeout: BOOTSTRAP_TIMEOUT_MS,
            });
            return [number, days];
          })
        );

        if (cancelled) return;

        if (shouldReplaceAll) {
          replaceCache(Object.fromEntries(results));
        } else {
          for (const [number, days] of results) {
            setGroupSchedule(number, days);
          }
        }
      } catch (err) {
        if (isCancelError(err)) return;
        console.warn('Bootstrap: используем старый кэш.', err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [key, todayTs]);

  return ready;
}