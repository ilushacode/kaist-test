import { Menu } from "lucide-react"


export const HeaderComponent = () => {
  return (
    <div className="header">
      <div className="header__left">
        <p className="header__left__title">Расписание</p>
        <p className="header__left__group">Группа 3339</p>
      </div>

      <div className="header__right">
        <Menu />
      </div>
    </div>
  )
}