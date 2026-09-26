import { motion } from 'motion/react';
import { DayListComponent } from "../components/DayListComponent";
import { HeaderComponent } from "../components/HeaderComponent";
import { ScheduleComponent } from "../components/ScheduleComponent";

export function SchedulePage({ today, selectedDate, setSelectedDate }) {
  return (
    <motion.div
      className="schedule-page-wrapper"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <HeaderComponent title={"Расписание"} />
      <DayListComponent
        today={today}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <ScheduleComponent selectedDate={selectedDate} onDateChange={setSelectedDate} />
      {/* <InstallBanner /> */}
    </motion.div>
  );
}