// Приводит сырые экзамены из exams.json к UI-формату.
// Сырые поля (короткие): s, t, a, b, p, ds.
// UI-поля: subject, time, room, building, teacher, dates.

const normalizeExam = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  return {
    subject: raw.s ?? raw.subject ?? 'Без названия',
    time: raw.t ?? raw.time ?? '00:00',
    room: raw.a ?? raw.room ?? '',
    building: raw.b ?? raw.building ?? '',
    teacher: raw.p ?? raw.teacher ?? '',
    dates: Array.isArray(raw.ds ?? raw.dates) ? (raw.ds ?? raw.dates) : [],
  };
};

/**
 * Возвращает массив экзаменов для указанной группы,
 * отсортированный по времени начала.
 *
 * @param {object} examsGroups — examsGroups из useStore
 * @param {string} group       — номер группы
 */
export const getExamsForGroup = (examsGroups, group) => {
  if (!group || !examsGroups) return [];
  const raw = examsGroups[group];
  if (!Array.isArray(raw)) return [];

  return raw
    .map(normalizeExam)
    .filter(Boolean)
    .sort((a, b) => a.time.localeCompare(b.time));
};