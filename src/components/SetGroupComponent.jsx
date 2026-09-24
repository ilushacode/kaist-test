import { useEffect, useRef, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { fetchGroups } from '../api/groups';
import { isCancelError } from '../api/client';

const DEBOUNCE_MS = 250;

export const SetGroupComponent = () => {
  const addGroup = useStore((s) => s.addGroup);
  const selectGroup = useStore((s) => s.selectGroup);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const boxRef = useRef(null);

  // Автодополнение с debounce
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const data = await fetchGroups(q, { signal: controller.signal });
        if (!cancelled) {
          setOptions(data);
          setOpen(true);
        }
      } catch (err) {
        if (!isCancelError(err)) {
          console.error('groups autocomplete:', err);
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

  // Закрытие по клику вне
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const handlePick = (groupNumber) => {
    addGroup(groupNumber);
    selectGroup(groupNumber);
    setQuery('');
    setOptions([]);
    setOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (options.length > 0) {
      handlePick(options[0].group);
    } else if (query.trim()) {
      handlePick(query.trim());
    }
  };

  return (
    <div className="set_group theme_light">
      <div className="set_group__inner" ref={boxRef}>
        <h1 className="set_group__title">Выберите группу</h1>
        <p className="set_group__subtitle">Начните вводить номер</p>

        <form className="set_group__form" onSubmit={handleSubmit}>
          <input
            className="set_group__input"
            type="text"
            inputMode="numeric"
            placeholder="Номер группы"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => options.length > 0 && setOpen(true)}
            autoFocus
          />

          {open && options.length > 0 && (
            <ul className="set_group__dropdown">
              {options.map((item) => (
                <li
                  key={item._id}
                  className="set_group__option"
                  onClick={() => handlePick(item.group)}
                >
                  {item.group}
                </li>
              ))}
            </ul>
          )}

          {open && !loading && query.trim() && options.length === 0 && (
            <div className="set_group__empty">Ничего не найдено</div>
          )}
        </form>
      </div>
    </div>
  );
};