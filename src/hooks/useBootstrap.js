import { useEffect, useState } from 'react';
import { useStore } from './useStore';
import { fetchScheduleData } from '../api/schedule';
import { fetchExamsData } from '../api/exams';
import { isCancelError } from '../api/client';
import { BOOTSTRAP_TIMEOUT_MS } from '../config';

/**
 * Загружает статические данные (schedule.json, exams.json), сравнивает
 * meta.contentHash с сохранённым и обновляет кэш только при изменениях.
 *
 * Логика ready:
 * - Кэш расписания есть → ready сразу true, обновление идёт в фоне.
 * - Кэша нет → ready false, пока не завершится загрузка
 *   (или не упадёт — тогда показываем экран ошибки).
 *
 * Повторный запуск: useStore.retryBootstrap() увеличивает bootstrapRetry,
 * что перезапускает эффект.
 */
export default function useBootstrap() {
  const [ready, setReady] = useState(false);
  const bootstrapRetry = useStore((s) => s.bootstrapRetry);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      const store = useStore.getState();
      const { scheduleGroups, scheduleHash, examsHash } = store;

      const hasScheduleCache = Object.keys(scheduleGroups).length > 0;
      if (hasScheduleCache) {
        setReady(true);
      } else {
        store.setScheduleLoading(true);
        store.setScheduleError(false);
      }

      const options = {
        signal: controller.signal,
        timeout: BOOTSTRAP_TIMEOUT_MS,
      };

      const [scheduleResult, examsResult] = await Promise.allSettled([
        fetchScheduleData(options),
        fetchExamsData(options),
      ]);

      if (cancelled) return;

      const s = useStore.getState();

      if (scheduleResult.status === 'fulfilled') {
        const { groups, contentHash, updatedAt } = scheduleResult.value;
        const hasFreshGroups = Object.keys(groups).length > 0;
        const isOutdated =
          !contentHash || contentHash !== scheduleHash || !hasScheduleCache;

        if (hasFreshGroups && isOutdated) {
          s.setScheduleCache({ groups, contentHash, updatedAt });
        } else {
          s.setScheduleError(false);
          s.setScheduleLoading(false);
        }
      } else {
        const reason = scheduleResult.reason;
        if (!isCancelError(reason)) {
          console.warn('Bootstrap: расписание недоступно.', reason);
        }
        if (!hasScheduleCache) {
          s.setScheduleError(true);
          s.setScheduleLoading(false);
        }
      }

      if (examsResult.status === 'fulfilled') {
        const { groups, contentHash, updatedAt } = examsResult.value;
        const hasFreshGroups = Object.keys(groups).length > 0;

        if (hasFreshGroups && (!contentHash || contentHash !== examsHash)) {
          s.setExamsCache({ groups, contentHash, updatedAt });
        }
      } else {
        const reason = examsResult.reason;
        if (!isCancelError(reason)) {
          console.warn('Bootstrap: экзамены недоступны.', reason);
        }
      }

      setReady(true);
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [bootstrapRetry]);

  return ready;
}