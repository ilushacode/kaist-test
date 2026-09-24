import { Menu } from "lucide-react"
import { useStore } from "../hooks/useStore";
import { useModal } from '../providers/ModalProvider';
import MenuModal from "../modals/MenuModal";


export const HeaderComponent = () => {

  const selectedGroup = useStore((s) => s.selectedGroup);
  const { openModal } = useModal()

  const handleOpenMenu = () => {
    openModal(MenuModal, {});
  };

  return (
    <div className="header">
      <div className="header__left">
        <p className="header__left__title">Расписание</p>
        <p className="header__left__group">Группа №{selectedGroup}</p>
      </div>

      <div className="header__right" onClick={handleOpenMenu}>
        <Menu />
      </div>
    </div>
  )
}