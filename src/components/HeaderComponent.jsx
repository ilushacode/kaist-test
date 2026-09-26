import { Menu, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import MenuModal from '../modals/MenuModal';
import { useNavigate } from 'react-router-dom';

export const HeaderComponent = ({ title, backButton }) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const { openModal } = useModal();
  const navigate = useNavigate()

  const handleRightClick = () => {
    if (backButton) return navigate('/')
    openModal(MenuModal);
  };

  return (
    <div className="header">
      <div className="header__left">
        <p className="header__left__title">{title}</p>
        <p className="header__left__group">Группа №{selectedGroup}</p>
      </div>

      <div className="header__right" onClick={handleRightClick}>
        {backButton ? (
          <X />
        ) : (
          <Menu />
        )}
      </div>
    </div>
  );
};