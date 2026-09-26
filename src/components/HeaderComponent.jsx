import { Menu, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import MenuModal from '../modals/MenuModal';
import { useNavigate } from 'react-router-dom';
import '../styles/Header.css';

const SPRING = { type: 'spring', stiffness: 700, damping: 42, mass: 0.6 };

// Анимация смены текста заголовка
const TITLE_TRANSITION = { duration: 0.18, ease: [0.4, 0, 0.2, 1] };

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
        <AnimatePresence mode="wait" initial={false}>
          <motion.h1
            key={title}
            className="header__title"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={TITLE_TRANSITION}
          >
            {title}
          </motion.h1>
        </AnimatePresence>

        {selectedGroup && (
          <motion.div
            className="header__group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Users size={14} strokeWidth={2.2} />
            <span className="header__group__num">{selectedGroup}</span>
          </motion.div>
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