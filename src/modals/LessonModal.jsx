import { useEffect, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import Loader from '../components/LoaderComponent';
import { fetchGroups } from '../api/groups';
import { isCancelError } from '../api/client';
import { addMinutes, formatDayMonth, isPastDay, isTodayDay, stripLeadingZero } from '../utils/date';
import { capitalizeName, formatBuilding } from '../utils/string';
import { getLessonTypeLabel } from '../utils/lesson';
import { GraduationCap } from 'lucide-react';


export default function LessonModal({ lesson, date }) {
  const { closeModal } = useModal();
  // const { lesson } = data;

  useEffect(() => {
    console.log(lesson)
  }, [])

  return (
    <div className="lesson_modal">
      <p className='lesson_modal__title'>{ lesson.subject }</p>
      <p className="lesson__modal__type">{ getLessonTypeLabel(lesson.type) }</p>
      <div className="lesson_modal__subtitle">
        {/* <p className="lesson_modal__subtitle__times">{ stripLeadingZero(lesson.time) } — { addMinutes(lesson.time, 90) }</p> */}
      </div>

      <div className="lesson_modal__today">
        <p className="lesson_modal__today__times">{ stripLeadingZero(lesson.time) } — { addMinutes(lesson.time, 90) }</p>
        <p className="lesson_modal__today__place">{ formatBuilding(lesson.building) } — { lesson.room }</p>
      </div>

      <div className="lesson_modal__dates">
        <p className="lesson_modal__dates__title">Даты занятий</p>
        <div className="lesson_modal__dates__content">
          {lesson.dates.map((date, i) => (
            <p
            className={`lesson_modal__dates__content__item ${isPastDay(date) ? 'lesson_modal__dates__content__item__past' : ''} ${isTodayDay(date) ? 'lesson_modal__dates__content__item__today' : ''}`}
            key={`dates_${i}`}>
              { date }
            </p>
          ))}
        </div>
      </div>

      <div className="lesson_modal__teacher">
        <p className="lesson_modal__teacher__title">Преподаватель</p>
        <div className="lesson_modal__teacher__content">
          <span className='lesson_modal__teacher__content__icon'><GraduationCap size={26} strokeWidth={1.5} /></span>
          <p className="lesson_modal__teacher__content__name">{ capitalizeName(lesson.teacher) }</p>
        </div>
      </div>
    </div>
  );
}