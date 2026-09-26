import { useEffect, useReducer } from 'react';
import { School } from 'lucide-react';
import {
  addMinutes,
  isLessonNow,
  isLessonPast,
  stripLeadingZero,
} from '../utils/date';
import { formatBuilding } from '../utils/string';
import { getLessonTypeLabel } from '../utils/lesson';
import { useModal } from '../providers/ModalProvider';
import LessonModal from '../modals/LessonModal';

const TICK_INTERVAL_MS = 60_000;

export const ScheduleLesson = ({ lesson, date }) => {
  const [, tick] = useReducer((n) => n + 1, 0);
  const { openModal } = useModal();

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

  const handleLessonClick = () => {
    openModal(LessonModal, { lesson, date });
  };

  return (
    <div className="schedule_lesson" onClick={handleLessonClick}>
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
          <span className="schedule_lesson__content__type">
            {getLessonTypeLabel(lesson.type)}
          </span>

          <h3 className="schedule_lesson__content__title">
            {lesson.subject}
          </h3>

          <div className="schedule_lesson__content__meta">
            <span className="schedule_lesson__content__meta__icon">
              <School size={14} strokeWidth={1.6} />
            </span>
            <span className="schedule_lesson__content__meta__text">
              {formatBuilding(lesson.building)} — {lesson.room}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};