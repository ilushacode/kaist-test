import { EXAMS_URL } from '../config';
import { fetchJson } from './client';

/** Загружает exams.json: сырые группы + версия контента. */
export const fetchExamsData = async (options = {}) => {
  const data = await fetchJson(EXAMS_URL, options);
  return {
    groups: data?.groups ?? {},
    contentHash: data?.meta?.contentHash ?? null,
    updatedAt: data?.meta?.updatedAt ?? null,
  };
};