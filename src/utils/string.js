/**
 * Делает первую букву каждого слова заглавной, остальные — строчными.
 * Сохраняет инициалы: "иванов и.и." -> "Иванов И.И."
 */
export const capitalizeName = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      // Сохраняем точки в инициалах: "и.и." -> "И.И."
      return word
        .split('.')
        .map((part) =>
          part ? part.charAt(0).toUpperCase() + part.slice(1) : part
        )
        .join('.');
    })
    .join(' ');
};

/** "301" -> "Здание 301", "Корпус А" -> "Корпус А" */
export const formatBuilding = (raw) => {
  const trimmed = raw?.trim() ?? '';
  if (/^\d+$/.test(trimmed)) {
    return `Здание ${trimmed}`;
  }
  return trimmed;
};