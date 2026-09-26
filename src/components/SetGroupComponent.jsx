import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ArrowRight } from 'lucide-react';
import { useStore } from '../hooks/useStore';
import { fetchGroups } from '../api/groups';
import { isCancelError } from '../api/client';
import Loader from './LoaderComponent';
import '../styles/SetGroup.css';

const DEBOUNCE_MS = 250;
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

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);

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
        if (!cancelled) setOptions(data.slice(0, MAX_RESULTS));
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

  const handlePick = (groupNumber) => {
    addGroup(groupNumber);
    selectGroup(groupNumber);
    setQuery('');
    setOptions([]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (options.length > 0) {
      handlePick(options[0].group);
    } else if (query.trim()) {
      handlePick(query.trim());
    }
  };

  const trimmedQuery = query.trim();
  const showResults = trimmedQuery.length > 0;
  const hasItems = showResults && !loading && options.length > 0;
  const showManualAdd =
    showResults && !loading && options.length === 0 && trimmedQuery.length > 0;

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

            {loading && (
              <Loader
                size={16}
                color="var(--light-font-color)"
                style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
            )}
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

            {showResults && !loading && options.length === 0 && !showManualAdd && (
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
                key={item._id}
                type="button"
                className="set_group__item"
                onClick={() => handlePick(item.group)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SOFT_SPRING, delay: 0.03 * i }}
                whileTap={{ scale: 0.98 }}
              >
                <span className="set_group__item__num">{item.group}</span>
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