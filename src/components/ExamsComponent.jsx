import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Calendar, GraduationCap, School } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { getExamsForGroup } from '../utils/exams';
import { capitalizeName, formatBuilding } from '../utils/string';
import { stripLeadingZero, isPastDay, isTodayDay } from '../utils/date';
import Loader from './LoaderComponent';
import '../styles/Exams.css';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;
const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 };
const CASCADE_STEP = 0.05;

export const ExamsComponent = () => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const examsGroups = useStore((s) => s.examsGroups);
  const scheduleError = useStore((s) => s.scheduleError);
  const scheduleLoading = useStore((s) => s.scheduleLoading);
  const retryBootstrap = useStore((s) => s.retryBootstrap);

  usePrefetchImage(EMPTY_IMAGE_SRC);
  usePrefetchImage(ERROR_IMAGE_SRC);

  const exams = useMemo(
    () => getExamsForGroup(examsGroups, selectedGroup),
    [examsGroups, selectedGroup]
  );

  // Холодный старт: данных ещё нет, идёт первичная загрузка
  if (scheduleLoading && exams.length === 0 && !scheduleError) {
    return (
      <div className="exams__centred">
        <Loader color={'#a8bcdd'} stroke={3} />
      </div>
    );
  }

  // Ошибка загрузки и нет кэша
  if (scheduleError && exams.length === 0) {
    return (
      <div className="exams__centred">
        <img
          src={ERROR_IMAGE_SRC}
          alt="Гусь спит"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="exams__empty-image"
        />
        <p className="exams__empty-title">Произошла ошибка</p>
        <p className="exams__empty-subtitle">
          Проверьте соединение или попробуйте позже
        </p>
        <button
          type="button"
          className="teachers__retry"
          onClick={retryBootstrap}
        >
          Повторить
        </button>
      </div>
    );
  }

  // Экзаменов нет — показываем гуся
  if (exams.length === 0) {
    return (
      <div className="exams__centred">
        <img
          src={EMPTY_IMAGE_SRC}
          alt="Гусь спит"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="exams__empty-image"
        />
        <p className="exams__empty-title">Экзаменов пока нет</p>
        <p className="exams__empty-subtitle">
          Отдыхай, пока можешь
        </p>
      </div>
    );
  }

  return (
    <div className="exams">
      {exams.map((exam, i) => (
        <motion.article
          key={`${exam.subject}-${exam.time}-${i}`}
          className="exams__item"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: i * CASCADE_STEP }}
        >
          <header className="exams__header">
            <span className="exams__time">
              <Calendar size={14} strokeWidth={2} />
              {stripLeadingZero(exam.time)}
            </span>

            {exam.dates.length > 0 && (
              <div className="exams__dates">
                {exam.dates.map((date, di) => (
                  <span
                    key={`d-${di}`}
                    className={[
                      'exams__date',
                      isPastDay(date) && 'exams__date--past',
                      isTodayDay(date) && 'exams__date--today',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {date}
                  </span>
                ))}
              </div>
            )}
          </header>

          <h3 className="exams__title">{exam.subject}</h3>

          <div className="exams__meta">
            {exam.teacher && (
              <span className="exams__meta__row">
                <GraduationCap size={14} strokeWidth={1.6} />
                <span className="exams__meta__text">
                  {capitalizeName(exam.teacher)}
                </span>
              </span>
            )}

            {(exam.building || exam.room) && (
              <span className="exams__meta__row">
                <School size={14} strokeWidth={1.6} />
                <span className="exams__meta__text">
                  {exam.building ? formatBuilding(exam.building) : ''}
                  {exam.building && exam.room ? ' — ' : ''}
                  {exam.room}
                </span>
              </span>
            )}
          </div>
        </motion.article>
      ))}
    </div>
  );
};