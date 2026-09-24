import { GraduationCap, School } from "lucide-react"

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

const isCurrentTimeInRange = (start, end) => {
  const toMinutes = (time) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const startMin = toMinutes(start);
  const endMin = toMinutes(end);

  return current >= startMin && current <= endMin;
};

const typeBadge = (type) => {
  if (type === "lec") return <span>Лекция</span>;
  if (type === "lab") return <span>Лабораторная работа</span>;
  if (type === "prac") return <span>Практическая работа</span>;
  return <p>Неизвестно</p>;
};

export const ScheduleLesson = ({ lesson }) => {
  const start = lesson.time;
  const end = addMinutes(lesson.time);
  const isActive = isCurrentTimeInRange(start, end);

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

      <div
        className={`schedule_lesson__content ${
          isActive ? "schedule_lesson__active" : ""
        }`}
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
            {lesson.building} * {lesson.room}
          </p>
        </div>
      </div>
    </div>
  );
};