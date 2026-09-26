import { GraduationCap } from 'lucide-react';
import { useModal } from '../providers/ModalProvider';
import { addMinutes, isPastDay, isTodayDay, stripLeadingZero } from '../utils/date';
import { capitalizeName, formatBuilding } from '../utils/string';
import { getLessonTypeLabel } from '../utils/lesson';
import '../styles/LessonModal.css';

export default function LessonModal({ lesson }) {
  const { closeModal } = useModal();

  return (
    <div className="lesson_modal">
      {/* Шапка: тип, заголовок, время + место */}
      <header className="lesson_modal__header">
        <span className="lesson_modal__type">
          {getLessonTypeLabel(lesson.type)}
        </span>
        <h2 className="lesson_modal__title">{lesson.subject}</h2>

        <div className="lesson_modal__meta">
          <span className="lesson_modal__meta__time">
            {stripLeadingZero(lesson.time)} — {addMinutes(lesson.time, 90)}
          </span>
          <span className="lesson_modal__meta__sep" aria-hidden="true" />
          <span className="lesson_modal__meta__place">
            {formatBuilding(lesson.building)} · {lesson.room}
          </span>
        </div>
      </header>

      {/* Даты */}
      <section className="lesson_modal__section">
        <h3 className="lesson_modal__section__label">Даты занятий</h3>
        <div className="lesson_modal__dates">
          {lesson.dates.map((date, i) => (
            <span
              key={`dates_${i}`}
              className={[
                'lesson_modal__date',
                isPastDay(date) && 'lesson_modal__date--past',
                isTodayDay(date) && 'lesson_modal__date--today',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {date}
            </span>
          ))}
        </div>
      </section>

      {/* Преподаватель */}
      <section className="lesson_modal__section">
        <h3 className="lesson_modal__section__label">Преподаватель</h3>
        <div className="lesson_modal__teacher">
          <GraduationCap
            size={20}
            strokeWidth={1.6}
            className="lesson_modal__teacher__icon"
          />
          <span className="lesson_modal__teacher__name">
            {capitalizeName(lesson.teacher)}
          </span>
        </div>
      </section>
    </div>
  );
}