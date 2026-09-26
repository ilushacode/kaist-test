import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Check, X } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { useModal } from '../providers/ModalProvider';
import Loader from '../components/LoaderComponent';
import { fetchGroups } from '../api/groups';
import { isCancelError } from '../api/client';

const DEBOUNCE_MS = 250;

export default function GroupsModal({ onSelect }) {
  const { closeModal } = useModal();

  const groups = useStore((s) => s.groups);
  const selectedGroup = useStore((s) => s.selectedGroup);
  const addGroup = useStore((s) => s.addGroup);
  const selectGroup = useStore((s) => s.selectGroup);
  const removeGroup = useStore((s) => s.removeGroup);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Быстрая проверка «уже добавлена»
  const groupsSet = useMemo(() => new Set(groups), [groups]);
  const canRemove = groups.length > 1;

  // Автодополнение с debounce
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setOptions([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const data = await fetchGroups(q, { signal: controller.signal });
        if (!cancelled) setOptions(data);
      } catch (err) {
        if (!isCancelError(err)) {
          console.error('groups autocomplete:', err);
          if (!cancelled) setOptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  // Добавление новой группы
  const handlePick = (group) => {
    if (groupsSet.has(group)) return; // защита
    addGroup(group);
    selectGroup(group);
    onSelect?.(group);
    setQuery('');
    setOptions([]);
    closeModal();
  };

  // Удаление группы прямо из результатов поиска
  const handleRemove = (e, group) => {
    e.stopPropagation();
    if (!canRemove) return;
    removeGroup(group);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    // Если есть первая опция из API и она не добавлена — добавляем
    if (options.length > 0 && !groupsSet.has(options[0].group)) {
      handlePick(options[0].group);
    } else if (!groupsSet.has(trimmed)) {
      handlePick(trimmed);
    }
  };

  const showResults = query.trim().length > 0;
  const hasItems = showResults && !loading && options.length > 0;
  const showManualAdd =
    showResults &&
    !loading &&
    options.length === 0 &&
    query.trim() &&
    !groupsSet.has(query.trim());

  return (
    <div className="groups_modal">
      <header className="groups_modal__header">
        <span className="groups_modal__label">Группа</span>
        <h2 className="groups_modal__title">Добавить в избранное</h2>
        {selectedGroup && (
          <p className="groups_modal__subtitle">
            Текущая: <span>{selectedGroup}</span>
          </p>
        )}
      </header>

      <form className="groups_modal__form" onSubmit={handleSubmit}>
        <div className="groups_modal__input-wrap">
          <Search
            size={16}
            strokeWidth={2}
            className="groups_modal__input-icon"
          />
          <input
            type="text"
            inputMode="numeric"
            className="groups_modal__input"
            placeholder="Номер группы"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          {loading && (
            <Loader
              size={14}
              color="var(--light-font-color)"
              style={{
                position: 'absolute',
                right: '0.9rem',
                top: '50%',
                transform: 'translateY(-50%)',
              }}
            />
          )}
        </div>
      </form>

      <div
        className={
          'groups_modal__results' +
          (!hasItems && !showManualAdd ? ' groups_modal__results--centered' : '')
        }
      >
        <AnimatePresence initial={false} mode="wait">
          {!showResults && (
            <motion.p
              key="placeholder-start"
              className="groups_modal__placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              Начните вводить номер группы
            </motion.p>
          )}

          {showResults && !loading && options.length === 0 && !showManualAdd && (
            <motion.p
              key="placeholder-empty"
              className="groups_modal__placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1 }}
            >
              Ничего не найдено
            </motion.p>
          )}
        </AnimatePresence>

        {hasItems &&
          options.map((item) => {
            const isAdded = groupsSet.has(item.group);
            const isActive = item.group === selectedGroup;

            return (
              <motion.button
                key={item._id}
                type="button"
                className={[
                  'groups_modal__item',
                  isAdded && 'groups_modal__item--added',
                  isActive && 'groups_modal__item--active',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => {
                  if (isAdded) {
                    // Тап по уже добавленной = переключиться на неё
                    selectGroup(item.group);
                    onSelect?.(item.group);
                    closeModal();
                  } else {
                    handlePick(item.group);
                  }
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.12 }}
                whileTap={{ scale: 0.985 }}
              >
                <span className="groups_modal__item__num">{item.group}</span>

                {/* Если группа уже в избранном — крестик. Иначе — плюс. */}
                {isAdded && canRemove ? (
                  <span
                    className="groups_modal__item__action groups_modal__item__action--remove"
                    onClick={(e) => handleRemove(e, item.group)}
                    role="button"
                    aria-label={`Удалить группу ${item.group}`}
                  >
                    <X size={15} strokeWidth={2.4} />
                  </span>
                ) : isAdded ? (
                  <span className="groups_modal__item__action groups_modal__item__action--check">
                    <Check size={15} strokeWidth={2.6} />
                  </span>
                ) : (
                  <span className="groups_modal__item__action groups_modal__item__action--add">
                    <Plus size={15} strokeWidth={2.4} />
                  </span>
                )}
              </motion.button>
            );
          })}

        {showManualAdd && (
          <motion.button
            key="manual-add"
            type="button"
            className="groups_modal__item groups_modal__item--manual"
            onClick={() => handlePick(query.trim())}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.12 }}
            whileTap={{ scale: 0.985 }}
          >
            <span className="groups_modal__item__num">
              Добавить «{query.trim()}»
            </span>
            <span className="groups_modal__item__action groups_modal__item__action--add">
              <Plus size={15} strokeWidth={2.4} />
            </span>
          </motion.button>
        )}
      </div>
    </div>
  );
}