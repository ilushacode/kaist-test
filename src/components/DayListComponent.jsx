import { useVirtualizer } from '@tanstack/react-virtual';
import { useEffect, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { compareDay, getMondayOfWeek } from '../utils/date';

const DAY_NAMES = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const GAP = 8;
const EDGE_PADDING = 16;

function getSemesterRange(today) {
  const year = today.getFullYear();
  const autumnStart = new Date(year, 8, 1);
  const autumnEnd = new Date(year, 11, 31);

  if (compareDay(today, autumnEnd) <= 0) {
    return { start: autumnStart, end: autumnEnd };
  }

  const springStart = new Date(year + 1, 1, 1);
  const springEnd = new Date(year + 1, 4, 31);
  return { start: springStart, end: springEnd };
}

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

export const DayListComponent = ({
  today,
  selectedDate,
  setSelectedDate,
  onPrevWeek,
  onNextWeek,
  canPrev = true,
  canNext = true,
}) => {
  const parentRef = useRef(null);

  const { weeks } = useMemo(() => {
    const { start, end } = getSemesterRange(today);
    return { weeks: buildWeeks(start, end) };
  }, [today]);

  const virtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => parentRef.current?.clientWidth ?? 320,
    horizontal: true,
    overscan: 3,
    getItemKey: (index) => weeks[index]?.[0]?.toISOString() ?? index,
  });

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const raf = requestAnimationFrame(() => virtualizer.measure());
    const ro = new ResizeObserver(() => virtualizer.measure());
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [virtualizer]);

  useEffect(() => {
    if (!selectedDate) return;
    if (weeks.length === 0) return;

    const targetMonday = getMondayOfWeek(selectedDate);
    const weekIndex = weeks.findIndex((week) =>
      week.some((date) => compareDay(date, targetMonday) === 0)
    );
    if (weekIndex < 0) return;

    const el = parentRef.current;
    const prevSnap = el?.style.scrollSnapType;
    if (el) el.style.scrollSnapType = 'none';

    virtualizer.scrollToIndex(weekIndex, { align: 'start' });

    const restore = () => {
      if (el) el.style.scrollSnapType = prevSnap || 'x mandatory';
    };
    const timeout = setTimeout(restore, 350);

    return () => {
      clearTimeout(timeout);
      restore();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, weeks]);

  const showNav = Boolean(onPrevWeek && onNextWeek);

  return (
    <div className="day_list-wrapper">
      {showNav && (
        <button
          type="button"
          className="day_list__nav day_list__nav--prev"
          onClick={onPrevWeek}
          disabled={!canPrev}
          aria-label="Предыдущая неделя"
        >
          <ChevronLeft size={18} strokeWidth={2.4} />
        </button>
      )}

      <div
        className="day_list"
        ref={parentRef}
        style={{
          height: '60px',
          width: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
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
            if (!week) return null;

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

      {showNav && (
        <button
          type="button"
          className="day_list__nav day_list__nav--next"
          onClick={onNextWeek}
          disabled={!canNext}
          aria-label="Следующая неделя"
        >
          <ChevronRight size={18} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
};