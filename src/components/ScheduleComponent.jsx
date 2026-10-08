import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useSwipeable } from 'react-swipeable';
import { ScheduleLesson } from './ScheduleLessonComponent';
import { useStore } from '../hooks/useStore';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { fetchDaySchedule } from '../api/schedule';
import { isCancelError } from '../api/client';
import { formatDM, shiftDate } from '../utils/date';
import Loader from './LoaderComponent';
import '../styles/Schedule.css';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;

// Подписи под «Сегодня нет пар» — меняются при каждой смене дня
const EMPTY_SUBTITLES = [
  'Гусь тоже отдыхает',
  'Можно спать дальше',
  'Время пить чай',
  'Лектор тоже человек',
  'Пара ушла. Никто не видел',
  'Расписание решило взять выходной',
  'Учебники скучают по тебе',
  'Сходи погуляй, что ли',
  'Никто не придёт. Даже не жди',
  'Пар нет. Это не ошибка',
  'День для сериалов',
  'Профессор ушёл в запой',
  'Твоя кровать сегодня в приоритете',
  'Отдохни, ты заслужил',
  'Небо сегодня безоблачное. Совпадение?',
  'Аудитория свободна. Наслаждайся',
  'Можно ничего не делать. Официально',
  'Учиться — не сегодня',
  'Спина разгружается',
  'Прогуляй пару. Её всё равно нет',
  'Время стать немного счастливее',
  'Сегодня твой день. Пользуйся',
  'Всё идёт по плану. Плана нет',
  'Кофе ждёт тебя',
  'Никаких будильников',
  'Иди поешь нормально',
  'Свобода! (пока что)',
  'Пары отменили. Даже не спрашивай',
  'День для ничего',
  'Мозг в отпуске',
  'Дыши. Просто дыши',
  'Так даже лучше',
  'Ты и без пар неплох',
];

const variants = {
  enter: (dir) => ({
    x: dir > 0 ? '60%' : '-60%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir) => ({
    x: dir > 0 ? '-60%' : '60%',
    opacity: 0,
  }),
};

const transition = {
  type: 'spring',
  stiffness: 380,
  damping: 32,
  mass: 0.6,
};

export const ScheduleComponent = ({ selectedDate, onDateChange }) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const setGroupSchedule = useStore((s) => s.setGroupSchedule);

  const [direction, setDirection] = useState(0);
  const [renderedDate, setRenderedDate] = useState(selectedDate);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [emptySubtitleIndex, setEmptySubtitleIndex] = useState(0);

  const prevDateRef = useRef(selectedDate);
  const swipeBlockRef = useRef(false);

  usePrefetchImage(EMPTY_IMAGE_SRC);

  // Следим за сменой даты — определяем направление и обновляем renderedDate
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

  // Меняем подпись на новую при каждой смене дня
  useEffect(() => {
    setEmptySubtitleIndex((prev) => {
      if (EMPTY_SUBTITLES.length <= 1) return prev;
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * EMPTY_SUBTITLES.length);
      }
      return next;
    });
  }, [renderedDate]);

  // Загрузка занятий для отрисованной даты
  useEffect(() => {
    if (!selectedGroup) return;

    const key = formatDM(renderedDate);
    const cachedDays = useStore.getState().scheduleCache[selectedGroup];
    const cached = cachedDays?.[key];

    if (cached) {
      setLessons(cached);
      setError(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);
    setError(false);

    fetchDaySchedule(selectedGroup, key, { signal: controller.signal })
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
      .catch((err) => {
        if (cancelled || isCancelError(err)) return;
        console.error(err);
        setLessons([]);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedGroup, renderedDate, setGroupSchedule]);

  const animationKey = formatDM(renderedDate);

  // --- Свайп через react-swipeable ---
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (!onDateChange) return;
      swipeBlockRef.current = true;
      setTimeout(() => {
        swipeBlockRef.current = false;
      }, 400);
      onDateChange(shiftDate(renderedDate, 1));
    },
    onSwipedRight: () => {
      if (!onDateChange) return;
      swipeBlockRef.current = true;
      setTimeout(() => {
        swipeBlockRef.current = false;
      }, 400);
      onDateChange(shiftDate(renderedDate, -1));
    },
    delta: 50,
    swipeDuration: 700,
    trackMouse: true,
    preventScrollOnSwipe: false,
    touchEventOptions: { passive: true },
  });

  const handleClickCapture = (e) => {
    if (swipeBlockRef.current) {
      e.stopPropagation();
      e.preventDefault();
    }
  };

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="schedule schedule--centered">
          <Loader color={'#a8bcdd'} stroke={3} />
        </div>
      );
    }

    if (error && lessons.length === 0) {
      return (
        <div className="schedule">
          <div className="schedule--centered">
            <img
              src={EMPTY_IMAGE_SRC}
              alt="Гусь спит"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="schedule__empty-image"
            />
            <p className="schedule__empty-title">
              Не удалось загрузить расписание
            </p>
            <p className="schedule__empty-subtitle">
              Проверьте соединение и попробуйте позже
            </p>
          </div>
        </div>
      );
    }

    if (lessons.length === 0) {
      return (
        <div className="schedule">
          <div className="schedule--centered">
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
              {EMPTY_SUBTITLES[emptySubtitleIndex]}
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
  }, [loading, error, lessons, renderedDate, emptySubtitleIndex]);

  return (
    <div
      className="schedule-viewport"
      {...swipeHandlers}
      onClickCapture={handleClickCapture}
    >
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