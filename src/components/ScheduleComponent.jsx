import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { AnimatePresence, motion } from "motion/react";
import { ScheduleLesson } from "./ScheduleLessonComponent";
import { useStore } from "../hooks/useStore";
import { Image } from "@capri-js/image";

// Date -> "DD.MM"
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

const variants = {
  enter: (dir) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: 0 },
  exit: (dir) => ({ x: dir > 0 ? "-100%" : "100%" }),
};

const transition = {
  type: "tween",
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.28,
};

export const ScheduleComponent = ({ selectedDate }) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const setGroupSchedule = useStore((s) => s.setGroupSchedule);
  const cachedDays = useStore((s) => s.scheduleCache[selectedGroup]);

  const dateKey = formatDate(selectedDate);

  // Направление анимации: 1 — вперёд (влево), -1 — назад (вправо)
  const [direction, setDirection] = useState(0);
  const [renderedDate, setRenderedDate] = useState(selectedDate);

  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Следим за сменой даты: запоминаем направление и запоминаем "текущую" дату
  useEffect(() => {
    const prev = new Date(renderedDate);
    prev.setHours(0, 0, 0, 0);
    const next = new Date(selectedDate);
    next.setHours(0, 0, 0, 0);

    if (next.getTime() !== prev.getTime()) {
      setDirection(next > prev ? 1 : -1);
      setRenderedDate(selectedDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  // Загрузка занятий для текущей (отрисованной) даты
  useEffect(() => {
    if (!selectedGroup) return;

    const key = formatDate(renderedDate);
    const cached = cachedDays?.[key];

    if (cached) {
      setLessons(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    axios
      .get("https://api-kaist.duodev.space/schedule/day", {
        params: { group: selectedGroup, date: key },
      })
      .then((response) => {
        if (cancelled) return;
        const items = response.data.items ?? [];
        setLessons(items);

        setGroupSchedule(selectedGroup, {
          ...(cachedDays ?? {}),
          [key]: items,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setLessons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, renderedDate, cachedDays, setGroupSchedule]);

  const animationKey = formatDate(renderedDate);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="schedule schedule--centered">
          <p>Загрузка...</p>
        </div>
      );
    }

    if (lessons.length === 0) {
      return (
        <div className="schedule schedule--centered">
          <div>
            <Image
              src="/images/goose_sleep.png"
              alt="Гусь спит"
              sizes="90vw"
              loading="lazy"
              className="schedule__empty-image"
            />
            <p className="schedule__empty-title">Сегодня нет пар</p>
            <p className="schedule__empty-subtitle">
              Отличный повод отдохнуть!
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="schedule">
        {lessons.map((lesson, i) => (
          <div key={i}>
            <ScheduleLesson date={renderedDate} lesson={lesson} />
          </div>
        ))}
      </div>
    );
  }, [loading, lessons, renderedDate]);

  return (
    <div className="schedule-viewport">
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={animationKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transition}
          className="schedule-page"
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};