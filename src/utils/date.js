const MONTHS_GENITIVE = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** Сбрасывает время до 00:00:00.000 */
export const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

/** Сравнивает две даты по календарному дню: -1 / 0 / 1 */
export const compareDay = (a, b) => {
  const ay = a.getFullYear();
  const am = a.getMonth();
  const ad = a.getDate();
  const by = b.getFullYear();
  const bm = b.getMonth();
  const bd = b.getDate();

  if (ay !== by) return ay < by ? -1 : 1;
  if (am !== bm) return am < bm ? -1 : 1;
  if (ad !== bd) return ad < bd ? -1 : 1;
  return 0;
};

/** Date -> "DD.MM" */
export const formatDM = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

/** Date -> "YYYY-MM-DD" */
export const formatISO = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Date -> "DD.MM" */
export const formatDayMonth = (date) => {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_GENITIVE[d.getMonth()]}`;
};

/** Сдвигает дату на days дней, сбрасывает время */
export const shiftDate = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
};


/** Понедельник недели, в которую попадает date */
export const getMondayOfWeek = (date) => {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = ВС
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
};

/** "HH:MM" -> минуты от начала суток */
export const parseTimeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/** Прибавляет минуты к "HH:MM", возвращает "H:MM" */
export const addMinutes = (time, minutesToAdd = 90) => {
  const total = parseTimeToMinutes(time) + minutesToAdd;
  const hours = Math.floor(total / 60) % 24;
  const minutes = total % 60;
  return `${hours}:${String(minutes).padStart(2, '0')}`;
};

/** Убирает ведущий ноль у часов: "09:30" -> "9:30" */
export const stripLeadingZero = (time) => {
  const [hours, minutes] = time.split(':');
  return `${Number(hours)}:${minutes}`;
};

/** true, если сейчас идёт пара: сегодня и start <= now <= end */
export const isLessonNow = (lessonDate, start, end) => {
  if (!(lessonDate instanceof Date)) return false;

  const now = new Date();
  if (compareDay(lessonDate, now) !== 0) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  return (
    current >= parseTimeToMinutes(start) &&
    current <= parseTimeToMinutes(end)
  );
};

/** true, если пара уже закончилась */
export const isLessonPast = (lessonDate, end) => {
  if (!(lessonDate instanceof Date)) return false;

  const now = new Date();
  const cmp = compareDay(lessonDate, now);
  if (cmp < 0) return true;
  if (cmp > 0) return false;

  const current = now.getHours() * 60 + now.getMinutes();
  return current > parseTimeToMinutes(end);
};

/** true, если день из строки "DD.MM" уже прошёл (по календарному дню) */
export const isPastDay = (value) => {
  const now = new Date();
  const [day, month] = value.split('.').map(Number);
  const date = startOfDay(new Date(now.getFullYear(), month - 1, day));
  return compareDay(date, now) < 0;
};

/** true, если день из строки "DD.MM" — сегодня */
export const isTodayDay = (value) => {
  const now = new Date();
  const [day, month] = value.split('.').map(Number);
  const date = startOfDay(new Date(now.getFullYear(), month - 1, day));
  return compareDay(date, now) === 0;
};

/** Сегодняшняя дата как "YYYY-MM-DD" */
export const todayStamp = () => formatISO(new Date());