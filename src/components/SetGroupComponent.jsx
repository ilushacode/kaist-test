import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { fetchGroups } from '../api/groups';
import { isCancelError } from '../api/client';
import Loader from './LoaderComponent';

const DEBOUNCE_MS = 250;
const MAX_RESULTS = 5;

export const SetGroupComponent = () => {
  const addGroup = useStore((s) => s.addGroup);
  const selectGroup = useStore((s) => s.selectGroup);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);

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

  const showResults = query.trim().length > 0;
  const hasItems = showResults && !loading && options.length > 0;
  const isEmpty = !hasItems;

  return (
    <div className="set_group theme_light">
      <div className="set_group__inner" ref={boxRef}>
        <h1 className="set_group__title">Выберите группу</h1>
        <p className="set_group__subtitle">Начните вводить номер</p>

        <form className="set_group__form" onSubmit={handleSubmit}>
          <div className="set_group__input-wrap">
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
                size={18}
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
            'set_group__results' +
            (isEmpty ? ' set_group__results--centered' : '')
          }
        >
          {!showResults && (
            <p className="set_group__results__placeholder">
              Начните вводить номер
            </p>
          )}

          {showResults && !loading && options.length === 0 && (
            <p className="set_group__results__placeholder">
              Ничего не найдено
            </p>
          )}

          {hasItems &&
            options.map((item) => (
              <p
                key={item._id}
                className="set_group__results__item"
                onClick={() => handlePick(item.group)}
              >
                {item.group}
              </p>
            ))}
        </div>
      </div>
    </div>
  );
};