import { SCHEDULE_URL } from '../config';
import { fetchJson } from './client';

/** Загружает schedule.json: сырые группы + версия контента. */
export const fetchScheduleData = async (options = {}) => {
  const data = await fetchJson(SCHEDULE_URL, options);
  return {
    groups: data?.groups ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};