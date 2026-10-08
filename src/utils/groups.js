/** Все группы кэша расписания, отсортированные по номеру */
export const listGroups = (scheduleGroups) =>
  Object.keys(scheduleGroups ?? {}).sort();

/** Подстрочный поиск группы по номеру (пустой запрос -> []) */
export const searchGroups = (scheduleGroups, query, limit = 0) => {
  const value = String(query ?? '').trim().toLowerCase();
  if (!value) return [];

  const found = listGroups(scheduleGroups).filter((group) =>
    group.toLowerCase().includes(value)
  );

  return limit > 0 ? found.slice(0, limit) : found;
};