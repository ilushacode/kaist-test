import { useEffect, useState } from "react";
import { GraduationCap, School } from "lucide-react";

const stripLeadingZero = (time) => {
  const [hours, minutes] = time.split(":");
  return `${Number(hours)}:${minutes}`;
};

const addMinutes = (time, minutesToAdd = 90) => {
  const [hours, minutes] = time.split(":").map(Number);
  const total = hours * 60 + minutes + minutesToAdd;
  const newHours = Math.floor(total / 60) % 24;
  const newMinutes = total % 60;
  return `${newHours}:${String(newMinutes).padStart(2, "0")}`;
};

/** Сравнивает две даты по календарному дню: -1 / 0 / 1 */
const compareDay = (a, b) => {
  const ay = a.getFullYear();
  const am = a.getMonth();
  const ad = a.getDate();
  const by = b.getFullYear();
  const bm = b.getMonth();
  const bd = b.getDate();

  if (ay !== by) return ay < by ? -1 : 1;
  if (am !== bm) return am < bm ? -1 : 1;
  if (ad !== bd) return ad < bd ? -1 : 1;
  return 0;
};

/** true, если пара идёт прямо сейчас: сегодня и start <= now <= end */
const isNow = (lessonDate, start, end) => {
  if (!(lessonDate instanceof Date)) return false;

  const now = new Date();
  if (compareDay(lessonDate, now) !== 0) return false;

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const current = now.getHours() * 60 + now.getMinutes();
  return current >= toMinutes(start) && current <= toMinutes(end);
};

/** true, если пара уже закончилась: дата в прошлом, либо сегодня и now > end */
const isPast = (lessonDate, end) => {
  if (!(lessonDate instanceof Date)) return false;

  const now = new Date();
  const cmp = compareDay(lessonDate, now);
  if (cmp < 0) return true;
  if (cmp > 0) return false;

  const [h, m] = end.split(":").map(Number);
  const current = now.getHours() * 60 + now.getMinutes();
  return current > h * 60 + m;
};

const typeBadge = (type) => {
  if (type === "lec") return <span>Лекция</span>;
  if (type === "lab") return <span>Лабораторная работа</span>;
  if (type === "prac") return <span>Практическая работа</span>;
  return <p>Неизвестно</p>;
};

function formatBuilding(raw) {
  const trimmed = raw?.trim() ?? "";
  if (/^\d+$/.test(trimmed)) {
    return `Здание ${trimmed}`;
  }
  return trimmed;
}

export const ScheduleLesson = ({ lesson, date }) => {
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const start = lesson.time;
  const end = addMinutes(lesson.time);

  const isActive = isNow(date, start, end);
  const isFinished = isPast(date, end);

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
            style={{ display: isActive ? "block" : "none" }}
          />
        </div>
        <div className="schedule_lesson__line__line" />
      </div>

      <div className="schedule_lesson__content__wrapper">
        <div
          className={`schedule_lesson__content ${
            isActive ? "schedule_lesson__active" : ""
          } ${isFinished ? "schedule_lesson__past" : ""}`}
        >
          <p className="schedule_lesson__content__title">{lesson.subject}</p>
          <p className="schedule_lesson__content__type">{typeBadge(lesson.type)}</p>

          <div className="schedule_lesson__content__meta">
            <span className="schedule_lesson__content__meta__icon">
              <GraduationCap size={22} />
            </span>
            <p className="schedule_lesson__content__meta__data">
              {lesson.teacher}
            </p>
          </div>
          <div
            className="schedule_lesson__content__meta"
            style={{ alignItems: "center" }}
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