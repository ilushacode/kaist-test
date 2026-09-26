// src/App.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import './App.css';
import { LoaderScreen } from './screens/LoaderScreen';
import { SetGroupComponent } from './components/SetGroupComponent';
import useBootstrap from './hooks/useBootstrap';
import { useStore } from './hooks/useStore';
import { MIN_LOADER_MS } from './config';
import { SchedulePage } from './pages/SchedulePage';
import { StudentsPage } from './pages/StudentsPage';
import { InstallBanner } from './components/InstallBannerComponent';
import { compareDay, getMondayOfWeek, shiftDate } from './utils/date';

function getSemesterRange(today) {
  const year = today.getFullYear();
  const autumnStart = new Date(year, 8, 1);
  const autumnEnd = new Date(year, 11, 31);
  if (compareDay(today, autumnEnd) <= 0) {
    return { start: autumnStart, end: autumnEnd };
  }
  const springStart = new Date(year + 1, 1, 1);
  const springEnd = new Date(year + 1, 4, 31);
  return { start: springStart, end: springEnd };
}

function App() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(today);
  const [minTimePassed, setMinTimePassed] = useState(false);

  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const ready = useBootstrap(today);

  const prevGroupRef = useRef(selectedGroup);
  useEffect(() => {
    if (prevGroupRef.current !== selectedGroup) {
      prevGroupRef.current = selectedGroup;
      setSelectedDate(today);
    }
  }, [selectedGroup, today]);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  const { start: semesterStart, end: semesterEnd } = useMemo(
    () => getSemesterRange(today),
    [today]
  );

  const currentMonday = useMemo(
    () => getMondayOfWeek(selectedDate),
    [selectedDate]
  );

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

  if (!ready || !minTimePassed) {
    return <LoaderScreen />;
  }

  if (groups.length === 0) {
    return <SetGroupComponent />;
  }

  return (
    <div className="container theme_light">
      <AnimatePresence mode="wait" initial={false}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <SchedulePage
                today={today}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onPrevWeek={handlePrevWeek}
                onNextWeek={handleNextWeek}
                canPrev={canPrev}
                canNext={canNext}
              />
            }
          />
          <Route path="/students" element={<StudentsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>

      <InstallBanner />
    </div>
  );
}

export default App;