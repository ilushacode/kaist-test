import {
  User,
  UserGroup,
  GraduationCap,
  Send,
  BookOpenText,
  ChevronRight,
} from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import GroupsModal from './GroupsModal';
import { TELEGRAM_CHANNEL } from '../config';
import { useNavigate } from 'react-router-dom';

const SoonBadge = () => (
  <span
    style={{
      backgroundColor: '#dde1ef',
      padding: '.2rem .5rem',
      borderRadius: '.5rem',
    }}
  >
    Скоро
  </span>
);

export default function MenuModal({ closeModal }) {
  const { openModal } = useModal();
  const selectedGroup = useStore((s) => s.selectedGroup);
  const navigate = useNavigate()

  const sections = [
    [
      {
        icon: User,
        color: '#306fce',
        title: 'Изменить группу',
        right: <span>{selectedGroup}</span>,
        callback: () => openModal(GroupsModal, { selectedGroup }),
        keepOn: true,
      },
    ],
    [
      {
        icon: UserGroup,
        color: '#db960c',
        title: 'Одногруппники',
        callback: () => navigate('/students'),
      },
      {
        icon: BookOpenText,
        color: '#0cdb39',
        title: 'Экзамены',
        right: <SoonBadge />,
      },
      {
        icon: GraduationCap,
        color: '#ac2eeb',
        title: 'Преподаватели',
        right: <SoonBadge />,
      },
    ],
    [
      {
        icon: Send,
        color: '#0088CC',
        title: 'Telegram',
        callback: () => {
          window.open(
            `https://t.me/${TELEGRAM_CHANNEL}`,
            '_blank',
            'noopener,noreferrer'
          );
        },
      },
    ],
  ];

  const handleClick = (item) => {
    if (!item.callback) return;
    item.callback();
    if (!item.keepOn) closeModal();
  };

  return (
    <div className="menu-modal">
      {sections.map((section, si) => (
        <div key={si} className="menu-modal__section">
          {section.map((item, ii) => {
            const Icon = item.icon;
            const isClickable = Boolean(item.callback);

            return (
              <div
                key={ii}
                className={
                  'menu-modal__item' +
                  (isClickable ? ' menu-modal__item--clickable' : '')
                }
                onClick={() => handleClick(item)}
              >
                <div
                  className="menu-modal__icon"
                  style={{ background: item.color }}
                >
                  {Icon && <Icon size={18} color="#fff" strokeWidth={2.2} />}
                </div>

                <div className="menu-modal__title">{item.title}</div>

                {item.right && (
                  <div className="menu-modal__right">{item.right}</div>
                )}

                {isClickable && (
                  <ChevronRight
                    className="menu-modal__chevron"
                    size={18}
                    strokeWidth={2.5}
                  />
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}