import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { HeaderComponent } from "./components/HeaderComponent";
import { DayListComponent } from "./components/DayListComponent";
import { ScheduleComponent } from "./components/ScheduleComponent";
import { LoaderScreen } from "./screens/LoaderScreen";
import { SetGroupComponent } from "./components/SetGroupComponent";
import useBootstrap from "./hooks/useBootstrap";
import { useStore } from "./hooks/useStore";

const MIN_LOADER_MS = 1000;

function App() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);
  const [minTimePassed, setMinTimePassed] = useState(false);

  const groups = useStore((s) => s.groups);
  const ready = useBootstrap(today);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimePassed(true), MIN_LOADER_MS);
    return () => clearTimeout(timer);
  }, []);

  // 1. Пока bootstrap не отработал или не прошла минимальная задержка — лоадер
  if (!ready || !minTimePassed) return <LoaderScreen />;

  // 2. Групп нет — просим выбрать
  if (groups.length === 0) return <SetGroupComponent />;

  // 3. Основной экран
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

export default App;