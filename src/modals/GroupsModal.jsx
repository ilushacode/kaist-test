import { useEffect, useState } from 'react';
import axios from 'axios';
import { useStore } from '../hooks/useStore';
import Loader from '../components/LoaderComponent';
import { useModal } from '../providers/ModalProvider';

const API_URL = 'https://api-kaist.duodev.space/groups';

export default function GroupsModal() {
  const { closeModal } = useModal()

  const selectedGroup = useStore((s) => s.selectedGroup);
  const setSingleGroup = useStore((s) => s.setSingleGroup);

  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

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
        const { data } = await axios.get(API_URL, {
          params: { query: q },
          signal: controller.signal,
        });
        if (!cancelled) {
          setOptions(data ?? []);
        }
      } catch (err) {
        if (!axios.isCancel?.(err) && err.name !== 'CanceledError') {
          console.error('groups autocomplete:', err);
          if (!cancelled) setOptions([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const handlePick = (group) => {
    setSingleGroup(group);
    setQuery('');
    setOptions([]);
    closeModal()
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
    <div className="groups_modal">
      <p className="groups_modal__title">Изменить группу</p>

      <div className="groups_modal__form">
        <p className="groups_modal__form__hint">Введите новый номер группы</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            inputMode="numeric"
            className="groups_modal__form__input"
            placeholder={selectedGroup ?? 'Номер группы'}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </form>
      </div>

      <div
        className={
          'groups_modal__results' +
          (isEmpty ? ' groups_modal__results--centered' : '')
        }
      >
        {!showResults && (
          <p className="groups_modal__results__placeholder">
            Начните вводить номер
          </p>
        )}

        {showResults && loading && (
          <div className="groups_modal__results__placeholder">
            <Loader />
          </div>
        )}

        {showResults && !loading && options.length === 0 && (
          <p className="groups_modal__results__placeholder">
            Ничего не найдено
          </p>
        )}

        {hasItems &&
          options.map((item) => (
            <p
              key={item._id}
              className="groups_modal__results__item"
              onClick={() => handlePick(item.group)}
            >
              {item.group}
            </p>
          ))}
      </div>
    </div>
  );
}