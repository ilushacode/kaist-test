import { useEffect, useReducer } from 'react';
import { GraduationCap, School } from 'lucide-react';
import {
  addMinutes,
  isLessonNow,
  isLessonPast,
  stripLeadingZero,
} from '../utils/date';
import { capitalizeName, formatBuilding } from '../utils/string';
import { getLessonTypeLabel } from '../utils/lesson';

const TICK_INTERVAL_MS = 60_000;

export const ScheduleLesson = ({ lesson, date }) => {
  // Форсируем ре-рендер раз в минуту, чтобы обновить статус "сейчас/прошло"
  const [, tick] = useReducer((n) => n + 1, 0);

  useEffect(() => {
    const id = setInterval(tick, TICK_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const start = lesson.time;
  const end = addMinutes(lesson.time);

  const isActive = isLessonNow(date, start, end);
  const isFinished = isLessonPast(date, end);

  const contentClass = [
    'schedule_lesson__content',
    isActive && 'schedule_lesson__active',
    isFinished && 'schedule_lesson__past',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="schedule_lesson">
      <div className="schedule_lesson__times">
        <p className="schedule_lesson__times__start">{stripLeadingZero(start)}</p>
        <p className="schedule_lesson__times__end">{end}</p>
      </div>

      <div className="schedule_lesson__line">
        <div className="schedule_lesson__line__dot">
          <div
            className="schedule_lesson__line__dot__inner"
            style={{ display: isActive ? 'block' : 'none' }}
          />
        </div>
        <div className="schedule_lesson__line__line" />
      </div>

      <div className="schedule_lesson__content__wrapper">
        <div className={contentClass}>
          <p className="schedule_lesson__content__title">{lesson.subject}</p>
          <p className="schedule_lesson__content__type">
            {getLessonTypeLabel(lesson.type)}
          </p>

          <div className="schedule_lesson__content__meta">
            <span className="schedule_lesson__content__meta__icon">
              <GraduationCap size={22} />
            </span>
            <p className="schedule_lesson__content__meta__data">
              {capitalizeName(lesson.teacher)}
            </p>
          </div>

          <div
            className="schedule_lesson__content__meta"
            style={{ alignItems: 'center' }}
          >
            <span className="schedule_lesson__content__meta__icon">
              <School size={20} />
            </span>
            <p className="schedule_lesson__content__meta__data">
              {formatBuilding(lesson.building)} — {lesson.room}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};