import { Menu } from "lucide-react"
import { useStore } from "../hooks/useStore";


export const HeaderComponent = () => {

  const selectedGroup = useStore((s) => s.selectedGroup);

  return (
    <div className="header">
      <div className="header__left">
        <p className="header__left__title">Расписание</p>
        <p className="header__left__group">Группа №{selectedGroup}</p>
      </div>

      <div className="header__right">
        <Menu />
      </div>
    </div>
  )
}