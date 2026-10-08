import { useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { searchGroups } from '../utils/groups';
import '../styles/SetGroup.css';

const MAX_RESULTS = 5;

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 };
const SOFT_SPRING = { type: 'spring', stiffness: 400, damping: 34, mass: 0.6 };

const CASCADE_START = 0.05;
const CASCADE_STEP = 0.08;

const cascade = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...SPRING, delay: CASCADE_START + CASCADE_STEP * i },
});

export const SetGroupComponent = () => {
  const addGroup = useStore((s) => s.addGroup);
  const selectGroup = useStore((s) => s.selectGroup);
  const scheduleGroups = useStore((s) => s.scheduleGroups);

  const [query, setQuery] = useState('');

  const boxRef = useRef(null);

  // Подсказки — по ключам групп из кэша расписания, без запросов к серверу
  const options = useMemo(
    () => searchGroups(scheduleGroups, query, MAX_RESULTS),
    [scheduleGroups, query]
  );

  const handlePick = (groupNumber) => {
    addGroup(groupNumber);
    selectGroup(groupNumber);
    setQuery('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (options.length > 0) {
      handlePick(options[0]);
    } else if (query.trim()) {
      handlePick(query.trim());
    }
  };

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0;
  const hasItems = showResults && options.length > 0;
  const showManualAdd =
    showResults && options.length === 0 && trimmedQuery.length > 0;

  return (
    <div className="set_group theme_light">
      <div className="set_group__inner" ref={boxRef}>
        <motion.h1 className="set_group__title" {...cascade(0)}>
          Выберите группу
        </motion.h1>

        <motion.p className="set_group__subtitle" {...cascade(1)}>
          Начните вводить номер — мы подскажем
        </motion.p>

        <motion.form
          className="set_group__form"
          onSubmit={handleSubmit}
          {...cascade(2)}
        >
          <div className="set_group__input-wrap">
            <Search
              size={18}
              strokeWidth={2}
              className="set_group__input-icon"
            />

            <input
              className="set_group__input"
              type="text"
              inputMode="numeric"
              placeholder="Номер группы"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
        </motion.form>

        <motion.div className="set_group__results" {...cascade(3)}>
          <AnimatePresence mode="wait" initial={false}>
            {!showResults && (
              <motion.p
                key="hint"
                className="set_group__placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                Например, 3439 или 4191
              </motion.p>
            )}

            {showResults && options.length === 0 && !showManualAdd && (
              <motion.p
                key="empty"
                className="set_group__placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                Ничего не найдено
              </motion.p>
            )}
          </AnimatePresence>

          {hasItems &&
            options.map((item, i) => (
              <motion.button
                key={item}
                type="button"
                className="set_group__item"
                onClick={() => handlePick(item)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SOFT_SPRING, delay: 0.03 * i }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="set_group__item__num">{item}</span>
                <span className="set_group__item__arrow">
                  <ArrowRight size={16} strokeWidth={2.4} />
                </span>
              </motion.button>
            ))}

          {showManualAdd && (
            <motion.button
              key="manual"
              type="button"
              className="set_group__item set_group__item--manual"
              onClick={() => handlePick(trimmedQuery)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={SOFT_SPRING}
              whileTap={{ scale: 0.98 }}
            >
              <span className="set_group__item__num">
                Добавить «{trimmedQuery}»
              </span>
              <span className="set_group__item__arrow">
                <ArrowRight size={16} strokeWidth={2.4} />
              </span>
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
};