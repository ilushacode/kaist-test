export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://api.kaist.pro';

export const API_TIMEOUT_MS = 5000;
export const BOOTSTRAP_TIMEOUT_MS = 3000;
export const BOOTSTRAP_RANGE_DAYS = 14;
export const MIN_LOADER_MS = 1000;
export const SCHEDULE_CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 часа
export const DAY_LIST_WEEKS = 26;

export const TELEGRAM_CHANNEL = 'kaist_app';