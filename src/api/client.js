import { REQUEST_TIMEOUT_MS } from '../config';

/** Проверяет, что ошибка — отмена запроса или его таймаут */
export const isCancelError = (err) =>
  err?.name === 'AbortError' || err?.name === 'TimeoutError';

/**
 * GET + JSON с поддержкой внешней отмены и таймаутом.
 * @param {string} url
 * @param {{ signal?: AbortSignal, timeout?: number }} options
 */
export const fetchJson = async (
  url,
  { signal, timeout = REQUEST_TIMEOUT_MS } = {}
) => {
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(new DOMException('timeout', 'TimeoutError')),
    timeout
  );
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
};