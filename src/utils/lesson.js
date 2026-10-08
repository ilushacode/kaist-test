
export const LESSON_TYPE_LABELS = {
  lec: 'Лекция',
  lab: 'Лабораторная работа',
  prac: 'Практическая работа',
};

const LESSON_TYPES_BY_K = {
  'лек': 'lec',
  'пр': 'prac',
  'л.р.': 'lab',
};

export const getLessonType = (k) => LESSON_TYPES_BY_K[k] ?? k ?? '';

export const getLessonTypeLabel = (type) =>
  LESSON_TYPE_LABELS[type] ?? 'Неизвестно';