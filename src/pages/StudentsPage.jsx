import { motion } from 'motion/react';
import { HeaderComponent } from "../components/HeaderComponent";
import { StudentsComponent } from "../components/StudentsComponent";

export function StudentsPage({ today, selectedDate, setSelectedDate }) {
  return (
    <motion.div
      className="schedule-page-wrapper"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <HeaderComponent title={"Студенты"} backButton />
      <StudentsComponent />
    </motion.div>
  );
}