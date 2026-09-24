import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { useStore } from "../hooks/useStore";

const API_URL = "https://api-kaist.duodev.space/groups";

export const SetGroupComponent = () => {
  const addGroup = useStore((s) => s.addGroup);
  const selectGroup = useStore((s) => s.selectGroup);

  const [query, setQuery] = useState("");
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
        const { data } = await axios.get(API_URL, {
          params: { query: q },
          signal: controller.signal,
        });
        if (!cancelled) {
          setOptions(data ?? []);
          setOpen(true);
        }
      } catch (err) {
        if (!axios.isCancel?.(err) && err.name !== "CanceledError") {
          console.error("groups autocomplete:", err);
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

  // Закрытие по клику вне
  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const handlePick = (item) => {
    // number — строка вида "1301" (то, что вы используете как ключ)
    addGroup(item.group, item.group);
    selectGroup(item.group);
    setQuery("");
    setOptions([]);
    setOpen(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Если пользователь ввёл номер вручную и не выбрал из списка —
    // берём первую подходящую опцию или используем сырой ввод
    if (options.length > 0) {
      handlePick(options[0]);
    } else if (query.trim()) {
      addGroup(query.trim(), query.trim());
      selectGroup(query.trim());
      setQuery("");
      setOpen(false);
    }
  };

  return (
    <div className="set_group theme_light">
      <div className="set_group__inner" ref={boxRef}>
        <h1 className="set_group__title">Выберите группу</h1>
        <p className="set_group__subtitle">
          Начните вводить номер
        </p>

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
                  onClick={() => handlePick(item)}
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