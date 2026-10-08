import { GROUP_FINDER_URL } from '../config';
import { fetchJson } from './client';

const PAGE_LIMIT = 100; // максимум, который отдаёт API за раз
const MAX_PAGES = 10;   // предохранитель от бесконечного цикла

/**
 * Одногруппники: GET .../students/search?q=<group>&limit=100&offset=0
 *
 * API ищет по подстроке, поэтому после ответа дополнительно
 * фильтруем по точному совпадению группы — иначе в списке
 * окажутся студенты из соседних групп с похожим номером.
 *
 * @param {string} group — номер группы ("3439")
 * @param {{ signal?: AbortSignal, timeout?: number }} options
 * @returns {Promise<Array<{ student_id: number|string, student: string, group: string, leader: boolean }>>}
 */
export const fetchStudents = async (group, options = {}) => {
  const normalized = String(group ?? '').trim();
  if (!normalized) return [];

  const collected = [];
  let offset = 0;

  for (let page = 0; page < MAX_PAGES; page++) {
    const url =
      `${GROUP_FINDER_URL}?q=${encodeURIComponent(normalized)}` +
      `&limit=${PAGE_LIMIT}&offset=${offset}`;

    const data = await fetchJson(url, options);
    const items = Array.isArray(data?.items) ? data.items : [];

    for (const item of items) {
      if (String(item?.group ?? '').trim() === normalized) {
        collected.push(item);
      }
    }

    // Если сервер вернул меньше страницы — дальше идти незачем
    if (items.length < PAGE_LIMIT) break;

    offset += PAGE_LIMIT;
  }

  return collected;
};