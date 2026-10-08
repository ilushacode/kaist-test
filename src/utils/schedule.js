import { compareDay, formatDM, getMondayOfWeek } from './date';
import { getLessonType } from './lesson';

const WEEK_MS = 1000 * 60 * 60 * 24 * 7;
const EVEN_WEEK = 'чет';
const ODD_WEEK = 'нечет';

/** Начало учебного года: 1 сентября, а для весенних дат — 1 февраля */
export const getSemesterStart = (date) => {
  const year = date.getFullYear();
  const autumnEnd = new Date(year, 11, 31);

  if (compareDay(date, autumnEnd) <= 0) {
    return new Date(year, 8, 1);
  }

  return new Date(year + 1, 1, 1);
};

/** true, если неделя (по её понедельнику) чётная относительно начала семестра */
export const isEvenWeek = (date) => {
  const startMonday = getMondayOfWeek(getSemesterStart(date));
  const monday = getMondayOfWeek(date);
  const diff = Math.round((monday.getTime() - startMonday.getTime()) / WEEK_MS);
  return Math.abs(diff) % 2 === 0;
};

/** Date -> "ДД.ММ.ГГГГ" */
const toFullDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
};

/** Совпадает ли день недели занятия ('1'..'6') с датой */
const isSameWeekday = (lesson, date) =>
  !lesson?.d || lesson.d === String(date.getDay());

/**
 * true, если сырое занятие проходит в указанный день.
 * Без ds — только по дню недели, иначе по конкретной дате или чётности недели.
 */
export const isLessonOnDate = (lesson, date) => {
  const ds = lesson?.ds ?? [];

  if (ds.length === 0) return isSameWeekday(lesson, date);
  if (ds.includes(formatDM(date)) || ds.includes(toFullDate(date))) return true;

  const parity = isEvenWeek(date) ? EVEN_WEEK : ODD_WEEK;
  return ds.includes(parity) && isSameWeekday(lesson, date);
};

/** Сырое занятие -> модель для UI */
export const mapLesson = (lesson) => ({
  time: lesson?.t ?? '',
  subject: lesson?.s ?? '',
  type: getLessonType(lesson?.k),
  building: lesson?.b ?? '',
  room: lesson?.a ?? '',
  teacher: lesson?.p ?? '',
  department: lesson?.u ?? '',
  dates: (lesson?.ds ?? []).filter((value) => /\d/.test(value)),
});

/** Занятия группы на дату, отсортированные по времени */
export const getLessonsForDate = (lessons, date) => {
  if (!Array.isArray(lessons) || !(date instanceof Date)) return [];

  return lessons
    .filter((lesson) => isLessonOnDate(lesson, date))
    .map(mapLesson)
    .sort((a, b) => a.time.localeCompare(b.time));
};