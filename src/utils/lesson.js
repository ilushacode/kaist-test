
export const LESSON_TYPE_LABELS = {
  lec: 'Лекция',
  lab: 'Лабораторная работа',
  prac: 'Практическая работа',
};

export const getLessonTypeLabel = (type) =>
  LESSON_TYPE_LABELS[type] ?? 'Неизвестно';