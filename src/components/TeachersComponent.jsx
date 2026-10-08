import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { fetchTeachers } from '../api/teachers';
import { useStore } from '../hooks/useStore';
import { isCancelError } from '../api/client';
import Loader from './LoaderComponent';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import { capitalizeName } from '../utils/string';
import '../styles/Teachers.css';

const EMPTY_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_sleep.png`;
const ERROR_IMAGE_SRC = `${import.meta.env.BASE_URL}images/goose_error.png`;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 };
const CASCADE_STEP = 0.04;

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';

  const first = parts[0]?.[0] ?? '';
  const secondPart = parts[1] ?? '';
  const second = secondPart.includes('.')
    ? secondPart.split('.')[0]?.[0] ?? ''
    : secondPart[0] ?? '';

  return (first + second).toUpperCase() || '?';
}

export const TeachersComponent = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const selectedGroup = useStore((s) => s.selectedGroup);
  usePrefetchImage(EMPTY_IMAGE_SRC);
  usePrefetchImage(ERROR_IMAGE_SRC);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const result = await fetchTeachers(selectedGroup, {
          signal: controller.signal,
        });
        if (cancelled) return;
        setTeachers(result?.items ?? []);
      } catch (err) {
        if (cancelled || isCancelError(err)) return;
        console.error('teachers:', err);
        setTeachers([]);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [selectedGroup]);

  if (loading) {
    return (
      <div className="teachers__centred">
        <Loader color={'#a8bcdd'} stroke={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="teachers__centred">
        <img
          src={ERROR_IMAGE_SRC}
          alt="Гусь спит"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="schedule__empty-image"
        />
        <p className="schedule__empty-title">Произошла ошибка</p>
        <p className="schedule__empty-subtitle">
          Проверьте соединение или попробуйте позже
        </p>
      </div>
    );
  }

  if (teachers.length === 0) {
    return (
      <div className="teachers__centred">
        <p className="teachers__empty">Нет результатов</p>
      </div>
    );
  }

  return (
    <div className="teachers">
      {teachers.map((item, i) => (
        <motion.article
          key={item.teacher}
          className="teachers__item"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: i * CASCADE_STEP }}
        >
          <div className="teachers__avatar" aria-hidden="true">
            {getInitials(item.teacher)}
          </div>

          <div className="teachers__body">
            <h3 className="teachers__name">
              {capitalizeName(item.teacher)}
            </h3>

            {item.departments?.length > 0 && (
              <p className="teachers__department">
                {item.departments.join(' · ')}
              </p>
            )}

            {item.subjects?.length > 0 && (
              <p className="teachers__subjects">
                {item.subjects.join(' · ')}
              </p>
            )}
          </div>
        </motion.article>
      ))}
    </div>
  );
};