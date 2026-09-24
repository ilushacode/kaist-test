// src/App.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import './App.css';
import { HeaderComponent } from './components/HeaderComponent';
import { DayListComponent } from './components/DayListComponent';
import { ScheduleComponent } from './components/ScheduleComponent';
import { LoaderScreen } from './screens/LoaderScreen';
import { InstallScreen } from './screens/InstallScreen';
import { SetGroupComponent } from './components/SetGroupComponent';
import useBootstrap from './hooks/useBootstrap';
import { useStore } from './hooks/useStore';
import { MIN_LOADER_MS } from './config';
import { isMobileDevice, isStandaloneMode } from './utils/pwa';

/**
 * Основное приложение. Вызывается ТОЛЬКО в PWA-режиме
 */
function ScheduleApp() {
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

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!ready || !minTimePassed) return <LoaderScreen />;
  if (groups.length === 0) return <SetGroupComponent />;

  return (
    <div className="container theme_light">
      <HeaderComponent />
      <DayListComponent
        today={today}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <ScheduleComponent selectedDate={selectedDate} />
    </div>
  );
}

/** Читает dev-override из URL. Возвращает null в production. */
function readDevOverrides() {
  if (!import.meta.env.DEV || typeof window === "undefined") return null;

  const params = new URLSearchParams(window.location.search);

  const device = params.get("device");   // "mobile" | "desktop" | null
  const os = params.get("os");           // "ios" | "android" | "other" | null
  const browser = params.get("browser"); // "safari" | "chrome" | ... | null
  const screen = params.get("screen");   // "install" | null

  return { device, os, browser, screen };
}

function App() {
  const overrides = readDevOverrides();

  // Принудительно показать InstallScreen в dev
  const forceInstall = overrides?.screen === "install";

  if (!forceInstall && isStandaloneMode()) return <ScheduleApp />;

  // Мобильность: override → автоопределение
  let isMobile = isMobileDevice();
  if (overrides?.device === "mobile") isMobile = true;
  if (overrides?.device === "desktop") isMobile = false;

  return (
    <InstallScreen
      isMobile={isMobile}
      osOverride={overrides?.os ?? null}
      browserOverride={overrides?.browser ?? null}
    />
  );
}

export default App;