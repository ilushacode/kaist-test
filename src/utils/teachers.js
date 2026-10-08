const add = (map, teacher, department, subject) => {
  const name = (teacher ?? '').trim();
  if (!name) return;

  const entry =
    map.get(name) ??
    { teacher: name, departments: new Set(), subjects: new Set() };

  if (department) entry.departments.add(department);
  if (subject) entry.subjects.add(subject);

  map.set(name, entry);
};

const toSortedList = (values) =>
  [...values].sort((a, b) => a.localeCompare(b, 'ru'));

/**
 * Преподаватели группы из кэша расписания и экзаменов.
 * Уникализирует по ФИО, кафедры и дисциплины сортирует.
 */
export const collectTeachers = (group, scheduleGroups, examsGroups) => {
  const map = new Map();

  for (const lesson of scheduleGroups?.[group] ?? []) {
    add(map, lesson.p, lesson.u, lesson.s);
  }

  for (const exam of examsGroups?.[group] ?? []) {
    add(map, exam.p, null, exam.s);
  }

  return [...map.values()]
    .map((entry) => ({
      teacher: entry.teacher,
      departments: toSortedList(entry.departments),
      subjects: toSortedList(entry.subjects),
    }))
    .sort((a, b) => a.teacher.localeCompare(b.teacher, 'ru'));
};