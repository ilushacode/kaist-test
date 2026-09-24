import { useEffect, useState } from "react";
import axios from "axios";
import { ScheduleLesson } from "./ScheduleLessonComponent";
import { useStore } from "../hooks/useStore";

// Date -> "DD.MM"
function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  return `${day}.${month}`;
}

export const ScheduleComponent = ({ selectedDate }) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const setGroupSchedule = useStore((s) => s.setGroupSchedule);
  const cachedDays = useStore((s) => s.scheduleCache[selectedGroup]);

  const dateKey = formatDate(selectedDate);

  // Что показываем: кэш, если он есть, иначе локальный стейт после запроса
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedGroup) return;

    // 1. Если в кэше уже есть этот день — берём оттуда, сеть не трогаем
    const cached = cachedDays?.[dateKey];
    if (cached) {
      setLessons(cached);
      setLoading(false);
      return;
    }

    // 2. Иначе грузим с сервера
    let cancelled = false;
    setLoading(true);

    axios
      .get("https://api-kaist.duodev.space/schedule/day", {
        params: { group: selectedGroup, date: dateKey },
      })
      .then((response) => {
        if (cancelled) return;
        const items = response.data.items ?? [];
        setLessons(items);

        // Кладём в кэш: сохраняем весь известный days + добавляем новый день.
        // setGroupSchedule заменяет объект целиком, поэтому объединяем вручную.
        setGroupSchedule(selectedGroup, {
          ...(cachedDays ?? {}),
          [dateKey]: items,
        });
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setLessons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedGroup, dateKey, cachedDays, setGroupSchedule]);

  if (loading) {
    return (
      <div
        className="schedule"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <p>Загрузка...</p>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div
        className="schedule"
        style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div>
          <p style={{ fontSize: "1.7rem", fontWeight: "500", textAlign: "center" }}>
            Нет пар
          </p>
          <p
            style={{
              fontSize: "1.1rem",
              textAlign: "center",
              color: "var(--light-font-color)",
              marginTop: ".5rem",
            }}
          >
            Отличный повод отдохнуть!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule">
      {lessons.map((lesson, i) => (
        <div key={i}>
          <ScheduleLesson date={selectedDate} lesson={lesson} />
        </div>
      ))}
    </div>
  );
};