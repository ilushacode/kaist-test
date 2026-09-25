import { useEffect, useState } from 'react';

const DEFAULT_PAGE = 'schedule';
const PAGE_CHANGE_EVENT = 'app:pagechange';

function readPage() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return hash || DEFAULT_PAGE;
}

export function usePage() {
  const [page, setPage] = useState(readPage);

  useEffect(() => {
    const sync = () => setPage(readPage());

    window.addEventListener('hashchange', sync);
    window.addEventListener(PAGE_CHANGE_EVENT, sync);

    return () => {
      window.removeEventListener('hashchange', sync);
      window.removeEventListener(PAGE_CHANGE_EVENT, sync);
    };
  }, []);

  const navigate = (next) => {
    // На главной хэш не нужен — стираем его без перезагрузки
    if (!next || next === DEFAULT_PAGE) {
      if (window.location.hash) {
        history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
        // replaceState не шлёт hashchange — рассылаем своё событие,
        // чтобы все экземпляры usePage синхронно перечитали URL
        window.dispatchEvent(new Event(PAGE_CHANGE_EVENT));
      }
      return;
    }

    // Для остальных страниц — обычная смена хэша,
    // браузер сам вызовет hashchange
    window.location.hash = `/${next}`;
  };

  return [page, navigate];
}