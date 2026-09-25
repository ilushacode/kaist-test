import { DayListComponent } from "../components/DayListComponent";
import { HeaderComponent } from "../components/HeaderComponent";
import { ScheduleComponent } from "../components/ScheduleComponent";
import { StudentsComponent } from "../components/StudentsComponent";

export function StudentsPage({ today, selectedDate, setSelectedDate }) {
  return (
    <>
      <HeaderComponent title={"Студенты"} backButton />
      <StudentsComponent />
    </>
  );
}