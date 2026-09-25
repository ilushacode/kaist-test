import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';
import { compareDay, getMondayOfWeek } from '../utils/date';

const DAY_NAMES = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

// Отступы в пикселях (синхронизированы с rem из CSS)
const GAP = 8;           // 0.5rem
const EDGE_PADDING = 16; // 1rem

/**
 * Определяет границы текущего семестра.
 * До 31 декабря включительно — осенний семестр текущего года,
 * иначе — весенний семестр следующего календарного года.
 */
function getSemesterRange(today) {
  const year = today.getFullYear();

  const autumnStart = new Date(year, 8, 1);   // 1 сентября
  const autumnEnd = new Date(year, 11, 31);   // 31 декабря

  if (compareDay(today, autumnEnd) <= 0) {
    return { start: autumnStart, end: autumnEnd };
  }

  const springStart = new Date(year + 1, 1, 1);  // 1 февраля
  const springEnd = new Date(year + 1, 4, 31);   // 31 мая
  return { start: springStart, end: springEnd };
}

/**
 * Нарезает диапазон [start; end] на недели, начиная с понедельника
 * недели, содержащей start, до недели, содержащей end.
 * Дни вне семестра отбрасываются — первая и последняя недели
 * могут быть неполными.
 */
function buildWeeks(start, end) {
  const firstMonday = getMondayOfWeek(start);
  const weeks = [];

  const cursor = new Date(firstMonday);
  cursor.setHours(0, 0, 0, 0);

  while (compareDay(cursor, end) <= 0) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(cursor);
      date.setDate(cursor.getDate() + d);
      date.setHours(0, 0, 0, 0);

      if (compareDay(date, start) >= 0 && compareDay(date, end) <= 0) {
        week.push(date);
      }
    }
    weeks.push(week);
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

export const DayListComponent = ({ today, selectedDate, setSelectedDate }) => {
  const parentRef = useRef(null);

  // Границы текущего семестра и нарезка на недели
  const { weeks } = useMemo(() => {
    const { start, end } = getSemesterRange(today);
    return { weeks: buildWeeks(start, end) };
  }, [today]);

  const virtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => parentRef.current?.clientWidth ?? window.innerWidth,
    horizontal: true,
    overscan: 2,
    getItemKey: (index) => weeks[index][0]?.toISOString() ?? index,
  });

  // Пересчёт размера при изменении окна
  useEffect(() => {
    const onResize = () => virtualizer.measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [virtualizer]);

  // Плавный автоскролл к неделе, содержащей выбранную дату.
  // На время анимации snap отключается, иначе браузер дёргает scrollLeft.
  useEffect(() => {
    if (!selectedDate) return;

    const targetMonday = getMondayOfWeek(selectedDate);
    const weekIndex = weeks.findIndex((week) =>
      week.some((date) => compareDay(date, targetMonday) === 0)
    );
    if (weekIndex < 0) return;

    const el = parentRef.current;
    if (!el) return;

    // Каждая неделя занимает ровно ширину контейнера,
    // значит начало i-й недели = i * clientWidth
    const itemSize = el.clientWidth;
    const targetLeft = weekIndex * itemSize;
    const startLeft = el.scrollLeft;
    const delta = targetLeft - startLeft;

    if (Math.abs(delta) < 1) return;

    const prevSnap = el.style.scrollSnapType;
    el.style.scrollSnapType = 'none';

    const DURATION = 320;
    const startTime = performance.now();
    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    let rafId;

    const finish = () => {
      el.style.scrollSnapType = prevSnap || 'x mandatory';
    };

    const step = (now) => {
      const t = Math.min(1, (now - startTime) / DURATION);
      el.scrollLeft = startLeft + delta * easeOutCubic(t);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        finish();
      }
    };

    rafId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(rafId);
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, weeks]);

  return (
    <div
      className="day_list"
      ref={parentRef}
      style={{
        height: '60px',
        width: '100vw',
        overflow: 'auto',
        boxSizing: 'border-box',
        scrollbarWidth: 'none',
        touchAction: 'pan-x',
        scrollSnapType: 'x mandatory',
      }}
    >
      <div
        className="day_list__inner"
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          height: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const week = weeks[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: `${virtualItem.size}px`,
                height: '100%',
                transform: `translateX(${virtualItem.start}px)`,
                boxSizing: 'border-box',
                padding: `0 ${EDGE_PADDING}px`,
                scrollSnapAlign: 'start',
                scrollSnapStop: 'always',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
                  gap: `${GAP}px`,
                  height: '100%',
                }}
              >
                {week.map((date) => {
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  const isPast = compareDay(date, today) < 0;

                  const dayOfWeek = DAY_NAMES[date.getDay()];
                  const day = String(date.getDate()).padStart(2, '0');
                  const month = String(date.getMonth() + 1).padStart(2, '0');

                  const className = [
                    'day_list__item',
                    isSelected && 'day_list__item__active',
                    !isSelected && isPast && 'day_list__item__disabled',
                  ]
                    .filter(Boolean)
                    .join(' ');

                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => setSelectedDate(date)}
                      className={className}
                    >
                      <span className="day_list__item__day">{dayOfWeek}</span>
                      <span className="day_list__item__date">
                        {day}
                        <span>{month}</span>
                      </span>
                      <span className="day_list__item__dot" />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};