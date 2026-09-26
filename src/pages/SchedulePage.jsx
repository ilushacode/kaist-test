import { DayListComponent } from "../components/DayListComponent";
import { HeaderComponent } from "../components/HeaderComponent";
import { InstallBanner } from "../components/InstallBannerComponent";
import { ScheduleComponent } from "../components/ScheduleComponent";

export function SchedulePage({ today, selectedDate, setSelectedDate }) {
  return (
    <>
      <HeaderComponent title={"Расписание"} />
      <DayListComponent
        today={today}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
      />
      <ScheduleComponent selectedDate={selectedDate} onDateChange={setSelectedDate} />
      {/* <InstallBanner /> */}
    </>
  );
}