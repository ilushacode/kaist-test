import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserGroup,
  GraduationCap,
  Send,
  BookOpenText,
  ChevronRight,
  Plus,
  X,
  Check,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import GroupsModal from './GroupsModal';
import { TELEGRAM_CHANNEL } from '../config';
import { useNavigate } from 'react-router-dom';
import '../styles/MenuModal.css';

const SoonBadge = () => <span className="menu-modal__badge">Скоро</span>;

const SPRING = { type: 'spring', stiffness: 700, damping: 42, mass: 0.6 };
const SOFT_SPRING = { type: 'spring', stiffness: 500, damping: 36, mass: 0.6 };

// Каскад синхронизирован с открытием модалки (~250мс)
const CASCADE_START = 0.08;
const CASCADE_STEP = 0.04;

const cascade = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { ...SOFT_SPRING, delay: CASCADE_START + CASCADE_STEP * i },
});

export default function MenuModal({ closeModal }) {
  const { openModal } = useModal();
  const navigate = useNavigate();

  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const selectGroup = useStore((s) => s.selectGroup);
  const addGroup = useStore((s) => s.addGroup);
  const removeGroup = useStore((s) => s.removeGroup);

  const [groupsOpen, setGroupsOpen] = useState(false);

  const canRemove = groups.length > 1;

  const handleSelectGroup = (group) => {
    selectGroup(group);
    setGroupsOpen(false);
  };

  const handleRemoveGroup = (e, group) => {
    e.stopPropagation();
    if (!canRemove) return;
    removeGroup(group);
  };

  const handleAddGroup = () => {
    setGroupsOpen(false);
    openModal(GroupsModal, {
      onSelect: (group) => {
        addGroup(group);
        selectGroup(group);
      },
    });
  };

  const sections = [
    [
      { icon: UserGroup, color: '#db960c', title: 'Одногруппники', callback: () => navigate('/students') },
      { icon: GraduationCap, color: '#ac2eeb', title: 'Преподаватели', callback: () => navigate('/teachers') },
      { icon: BookOpenText, color: '#0cdb39', title: 'Экзамены', right: <SoonBadge /> },
    ],
    [
      {
        icon: Send,
        color: '#0088CC',
        title: 'Telegram',
        callback: () => {
          window.open(`https://t.me/${TELEGRAM_CHANNEL}`, '_blank', 'noopener,noreferrer');
        },
      },
    ],
  ];

  // Плоский индекс по всем секциям — без «дыр» и без x10
  let runningIndex = 0;
  const flatSections = sections.map((section) =>
    section.map((item) => ({ ...item, globalIndex: runningIndex++ }))
  );

  const handleClick = (item) => {
    if (!item.callback) return;
    item.callback();
    if (!item.keepOn) closeModal();
  };

  return (
    <div className="menu-modal">
      {/* Блок групп — идёт в общем каскаде первым (индекс 0) */}
      <motion.div className="menu-modal__group" {...cascade(0)}>
        <motion.button
          type="button"
          className={`menu-modal__group__row ${groupsOpen ? 'menu-modal__group__row--open' : ''}`}
          onClick={() => setGroupsOpen((v) => !v)}
          disabled={!selectedGroup}
          whileTap={{ scale: 0.98 }}
          transition={SPRING}
        >
          <span className="menu-modal__group__label">Группа</span>
          <motion.span
            key={selectedGroup}
            className="menu-modal__group__value"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={SPRING}
          >
            {selectedGroup ?? '—'}
          </motion.span>

          <motion.span
            className="menu-modal__group__chevron"
            animate={{ rotate: groupsOpen ? 90 : 0 }}
            transition={SPRING}
          >
            <ChevronRight size={16} strokeWidth={2.4} />
          </motion.span>
        </motion.button>

        <AnimatePresence initial={false}>
          {groupsOpen && (
            <motion.div
              className="menu-modal__group__dropdown"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={SOFT_SPRING}
              style={{ overflow: 'hidden' }}
            >
              <div className="menu-modal__group__dropdown-inner">
                <AnimatePresence initial={false}>
                  {groups.map((group) => {
                    const isActive = group === selectedGroup;
                    return (
                      <motion.div
                        key={group}
                        layout
                        className={`menu-modal__group__item ${
                          isActive ? 'menu-modal__group__item--active' : ''
                        }`}
                        onClick={() => handleSelectGroup(group)}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{
                          opacity: 0,
                          height: 0,
                          marginTop: 0,
                          marginBottom: 0,
                        }}
                        transition={{
                          ...SPRING,
                          delay: 0,
                          opacity: { duration: 0.15 },
                          height: { duration: 0.2 },
                        }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="menu-modal__group__item__check">
                          <AnimatePresence>
                            {isActive && (
                              <motion.span
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={SPRING}
                                style={{ display: 'flex' }}
                              >
                                <Check size={14} strokeWidth={2.6} />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </span>
                        <span className="menu-modal__group__item__num">{group}</span>

                        {canRemove && (
                          <motion.button
                            type="button"
                            className="menu-modal__group__item__remove"
                            onClick={(e) => handleRemoveGroup(e, group)}
                            aria-label={`Удалить группу ${group}`}
                            whileTap={{ scale: 0.85 }}
                            transition={SPRING}
                          >
                            <X size={14} strokeWidth={2.4} />
                          </motion.button>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                <motion.button
                  type="button"
                  className="menu-modal__group__add"
                  onClick={handleAddGroup}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING, delay: 0.015 * groups.length }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus size={15} strokeWidth={2.4} />
                  <span>Добавить группу</span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Секции — каскад продолжается без пауз */}
      {flatSections.map((section, si) => (
        <div key={si} className="menu-modal__section">
          {section.map((item) => {
            const Icon = item.icon;
            const isClickable = Boolean(item.callback);

            return (
              <motion.div
                key={item.title}
                className={'menu-modal__item' + (isClickable ? ' menu-modal__item--clickable' : '')}
                onClick={() => handleClick(item)}
                {...cascade(item.globalIndex + 1)}
                whileTap={isClickable ? { scale: 0.98 } : undefined}
              >
                <motion.span
                  className="menu-modal__icon"
                  style={{
                    background: `linear-gradient(135deg, ${item.color} 0%, ${shade(item.color, -18)} 100%)`,
                    boxShadow: `0 4px 12px -4px ${item.color}80`,
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={SPRING}
                >
                  {Icon && <Icon size={16} color="#fff" strokeWidth={2.2} />}
                </motion.span>

                <span className="menu-modal__title">{item.title}</span>

                {item.right && <span className="menu-modal__right">{item.right}</span>}

                {isClickable && (
                  <motion.span
                    className="menu-modal__chevron"
                    animate={{ x: 0 }}
                    whileTap={{ x: 2 }}
                  >
                    <ChevronRight size={16} strokeWidth={2.4} />
                  </motion.span>
                )}
              </motion.div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function shade(hex, delta) {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = (num >> 16) + delta;
  let g = ((num >> 8) & 0x00ff) + delta;
  let b = (num & 0x0000ff) + delta;
  r = Math.max(0, Math.min(255, r));
  g = Math.max(0, Math.min(255, g));
  b = Math.max(0, Math.min(255, b));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}