import { Star } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchStudents } from "../api/students";
import { useStore } from "../hooks/useStore";
import { isCancelError } from "../api/client";
import Loader from "./LoaderComponent";
import { usePrefetchImage } from "../hooks/usePrefetchImage";
import '../styles/Students.css'

const EMPTY_IMAGE_SRC = '/images/goose_sleep.png';

export const StudentsComponent = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const selectedGroup = useStore((s) => s.selectedGroup);
  usePrefetchImage(EMPTY_IMAGE_SRC);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(false);
      try {
        const result = await fetchStudents(selectedGroup);
        if (cancelled) return;
        setStudents(result);
      } catch (err) {
        if (cancelled || isCancelError(err)) return;
        console.error("students:", err);
        setStudents([]);
        setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [selectedGroup]);

  return (
    <div className="students">
      {loading ? (
        <div className="students__centred">
          <Loader color={'#a8bcdd'} stroke={3} />
        </div>
      ) : error ? (
        <div className="students__centred">
          <div>
            <img
              src={EMPTY_IMAGE_SRC}
              alt="Гусь спит"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="schedule__empty-image"
            />
            <p className="schedule__empty-title">
              Не удалось выполнить запрос
            </p>
            <p className="schedule__empty-subtitle">
              Проверьте соединение или попробуйте позже
            </p>
          </div>
        </div>
      ) : students.length > 0 ? (
        students.map((student, i) => (
          <div className="students__item" key={student.id ?? i}>
            <div className="students__item__left">
              <p className="students__item__left__num">{i + 1}.</p>
            </div>
            <div className="students__item__content">
              <p className="students__item__content__name">{student.student}</p>
            </div>
            <div className="students__item__right">
              {student.leader && <Star strokeWidth={3} />}
            </div>
          </div>
        ))
      ) : (
        <div className="students__centred">
          <p className="students__empty">Нет результатов</p>
        </div>
      )}
    </div>
  );
};