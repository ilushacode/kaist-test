// src/App.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { LoaderScreen } from './screens/LoaderScreen';
import { SetGroupComponent } from './components/SetGroupComponent';
import useBootstrap from './hooks/useBootstrap';
import { useStore } from './hooks/useStore';
import { MIN_LOADER_MS } from './config';
import { SchedulePage } from './pages/SchedulePage';
import { StudentsPage } from './pages/StudentsPage';
import { InstallBanner } from './components/InstallBannerComponent';
import { PhoneFrame } from './components/PhoneFrameComponent';
import { compareDay, getMondayOfWeek, shiftDate } from './utils/date';

/**
 * Границы семестра — те же, что в DayListComponent.
 * Держим синхронно, чтобы не давать листать за пределы учебного года.
 */
function getSemesterRange(today) {
  const year = today.getFullYear();

  const autumnStart = new Date(year, 8, 1);   // 1 сентября
  const autumnEnd = new Date(year, 11, 31);   // 31 декабря

  if (compareDay(today, autumnEnd) <= 0) {
    return { start: autumnStart, end: autumnEnd };
  }

  const springStart = new Date(year + 1, 1, 1);  // 1 февраля
  const springEnd = new Date(year + 1, 4, 31);   // 31 мая
  return { start: springStart, end: springEnd };
}

function App() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [minTimePassed, setMinTimePassed] = useState(false);

  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const ready = useBootstrap(today);

  // Сброс даты при смене группы
  const prevGroupRef = useRef(selectedGroup);
  useEffect(() => {
    if (prevGroupRef.current !== selectedGroup) {
      prevGroupRef.current = selectedGroup;
      setSelectedDate(today);
    }
  }, [selectedGroup, today]);

  // Минимальная задержка лоадера, чтобы не мигало
  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  // Границы семестра
  const { start: semesterStart, end: semesterEnd } = useMemo(
    () => getSemesterRange(today),
    [today]
  );

  // Понедельник текущей недели выбранной даты
  const currentMonday = useMemo(
    () => getMondayOfWeek(selectedDate),
    [selectedDate]
  );

  // Можно ли листнуть на неделю назад/вперёд
  const canPrev = compareDay(shiftDate(currentMonday, -7), semesterStart) >= 0;
  const canNext = compareDay(shiftDate(currentMonday, 7), semesterEnd) <= 0;

  const handlePrevWeek = () => {
    if (!canPrev) return;
    setSelectedDate(shiftDate(currentMonday, -7));
  };

  const handleNextWeek = () => {
    if (!canNext) return;
    setSelectedDate(shiftDate(currentMonday, 7));
  };

  // 1. Bootstrap ещё не готов или не прошла минимальная задержка
  if (!ready || !minTimePassed) {
    return <LoaderScreen />;
  }

  // 2. Bootstrap готов, но групп нет — просим выбрать
  if (groups.length === 0) {
    return <SetGroupComponent />;
  }

  // 3. Основной экран с роутингом
  return (
    <div className="container theme_light">
      <Routes>
        <Route
          path="/"
          element={
            <SchedulePage
              today={today}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          }
        />
        <Route path="/students" element={<StudentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <InstallBanner />
    </div>
  );
}

export default App;