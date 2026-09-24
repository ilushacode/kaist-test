import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef, useState, useMemo, useEffect } from "react";

const DAY_NAMES = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

// Отступы в пикселях (синхронизированы с rem из CSS)
const GAP = 8;           // 0.5rem
const EDGE_PADDING = 16; // 1rem

export const DayListComponent = () => {
  const parentRef = useRef(null);

  // Сегодняшняя дата без времени — стабильная ссылка на весь жизненный цикл
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);

  // Понедельник текущей недели
  const startOfWeek = useMemo(() => {
    const d = new Date(today);
    const day = d.getDay(); // 0 = ВС, 1 = ПН, ...
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  }, [today]);

  // 26 недель по 7 дней
  const weeks = useMemo(() => {
    return Array.from({ length: 26 }, (_, w) => {
      return Array.from({ length: 7 }, (_, d) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + w * 7 + d);
        return date;
      });
    });
  }, [startOfWeek]);

  const virtualizer = useVirtualizer({
    count: weeks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => parentRef.current?.clientWidth ?? window.innerWidth,
    horizontal: true,
    overscan: 2,
    getItemKey: (index) => weeks[index][0].toISOString(),
  });

  // Пересчёт размера при изменении окна
  useEffect(() => {
    const onResize = () => virtualizer.measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [virtualizer]);

  // Скролл к текущей неделе при монтировании
  useEffect(() => {
    virtualizer.scrollToIndex(0, { align: "start" });
  }, []);

  return (
    <div
      className="day_list"
      ref={parentRef}
      style={{
        height: "60px",
        width: "100vw",
        overflow: "auto",
        boxSizing: "border-box",
        scrollbarWidth: "none",
        scrollSnapType: "x mandatory",
        overscrollBehaviorX: "contain",
      }}
    >
      <div
        className="day_list__inner"
        style={{
          width: `${virtualizer.getTotalSize()}px`,
          height: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const week = weeks[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: `${virtualItem.size}px`,
                height: "100%",
                transform: `translateX(${virtualItem.start}px)`,
                boxSizing: "border-box",
                padding: `0 ${EDGE_PADDING}px`,
                scrollSnapAlign: "start",
                scrollSnapStop: "always",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
                  gap: `${GAP}px`,
                  height: "100%",
                }}
              >
                {week.map((date) => {
                  const isSelected =
                    selectedDate?.toDateString() === date.toDateString();
                  const isPast = date < today;

                  const dayOfWeek = DAY_NAMES[date.getDay()];
                  const day = String(date.getDate()).padStart(2, "0");

                  return (
                    <div
                      key={date.toISOString()}
                      onClick={() => {
                        if (isPast) return;
                        setSelectedDate(date);
                      }}
                      className={`day_list__item ${
                        isSelected ? "day_list__item__active" : ""
                      } ${isPast ? "day_list__item__disabled" : ""}`}
                    >
                      <span className="day_list__item__day">{dayOfWeek}</span>
                      <span className="day_list__item__date">{day}</span>
                      <span className="day_list__item__dot"></span>
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