import { useMemo, useState } from "react";
import "./App.css";
import { HeaderComponent } from "./components/HeaderComponent";
import { DayListComponent } from "./components/DayListComponent";
import { ScheduleComponent } from "./components/ScheduleComponent";
import { LoaderScreen } from "./screens/LoaderScreen";
import { SetGroupComponent } from "./components/SetGroupComponent";
import useBootstrap from "./hooks/useBootstrap";
import { useStore } from "./hooks/useStore";

function App() {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [selectedDate, setSelectedDate] = useState(today);

  const groups = useStore((s) => s.groups);
  const ready = useBootstrap(today);

  // 1. Пока bootstrap не отработал — лоадер
  if (!ready) return <LoaderScreen />;

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