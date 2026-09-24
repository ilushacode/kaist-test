import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ScheduleLesson } from './ScheduleLessonComponent';
import { useStore } from '../hooks/useStore';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { fetchDaySchedule } from '../api/schedule';
import { isCancelError } from '../api/client';
import { formatDM } from '../utils/date';

const EMPTY_IMAGE_SRC = '/images/goose_sleep.png';

const variants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%' }),
  center: { x: 0 },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%' }),
};

const transition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.28,
};

export const ScheduleComponent = ({ selectedDate }) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const setGroupSchedule = useStore((s) => s.setGroupSchedule);

  const [direction, setDirection] = useState(0);
  const [renderedDate, setRenderedDate] = useState(selectedDate);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  const prevDateRef = useRef(selectedDate);

  // Предзагружаем картинку пустого расписания один раз
  usePrefetchImage(EMPTY_IMAGE_SRC);

  // Следим за сменой даты: запоминаем направление и "текущую" дату
  useEffect(() => {
    const prev = new Date(prevDateRef.current);
    prev.setHours(0, 0, 0, 0);
    const next = new Date(selectedDate);
    next.setHours(0, 0, 0, 0);

    if (next.getTime() !== prev.getTime()) {
      setDirection(next > prev ? 1 : -1);
      setRenderedDate(selectedDate);
      prevDateRef.current = selectedDate;
    }
  }, [selectedDate]);

  // Загрузка занятий для отрисованной даты
  useEffect(() => {
    if (!selectedGroup) return;

    const key = formatDM(renderedDate);
    // Берём актуальный кэш из store без подписки на изменения
    const cachedDays = useStore.getState().scheduleCache[selectedGroup];
    const cached = cachedDays?.[key];

    if (cached) {
      setLessons(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchDaySchedule(selectedGroup, key, {
      signal: AbortSignal.timeout?.(8000),
    })
      .then((items) => {
        if (cancelled) return;
        setLessons(items);

        const currentCache =
          useStore.getState().scheduleCache[selectedGroup] ?? {};
        setGroupSchedule(selectedGroup, {
          ...currentCache,
          [key]: items,
        });
      })
      .catch((error) => {
        if (cancelled || isCancelError(error)) return;
        console.error(error);
        setLessons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, renderedDate, setGroupSchedule]);

  const animationKey = formatDM(renderedDate);

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
            <img
              src={EMPTY_IMAGE_SRC}
              alt="Гусь спит"
              loading="eager"
              decoding="async"
              fetchPriority="high"
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
          <div key={`${lesson.subject}-${lesson.time}-${i}`}>
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