import { Menu, X, Users } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import MenuModal from '../modals/MenuModal';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css'

const SPRING = { type: 'spring', stiffness: 700, damping: 42, mass: 0.6 };

export const HeaderComponent = ({ title, backButton }) => {
  const selectedGroup = useStore((s) => s.selectedGroup);
  const { openModal } = useModal();
  const navigate = useNavigate();

  const handleRightClick = () => {
    if (backButton) return navigate('/');
    openModal(MenuModal);
  };

  const Icon = backButton ? X : Menu;

  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{title}</h1>

        {selectedGroup && (
          <div className="header__group">
            <Users size={14} strokeWidth={2.2} />
            <span className="header__group__num">{selectedGroup}</span>
          </div>
        )}
      </div>

      <motion.button
        type="button"
        className="header__action"
        onClick={handleRightClick}
        aria-label={backButton ? 'Закрыть' : 'Открыть меню'}
        whileTap={{ scale: 0.9 }}
        transition={SPRING}
      >
        <Icon size={20} strokeWidth={1.8} />
      </motion.button>
    </header>
  );
};