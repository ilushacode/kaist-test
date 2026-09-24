import { useEffect, useState } from 'react';

/**
 * Предзагружает картинку в кэш браузера.
 * Возвращает src, который можно передать в <img>.
 * После первой загрузки картинка берётся из кэша.
 */
export const usePrefetchImage = (src) => {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!src) return;

    let cancelled = false;
    const img = new Image();
    img.decoding = 'async';
    img.loading = 'eager';

    const handleLoad = () => {
      if (!cancelled) setReady(true);
    };

    img.addEventListener('load', handleLoad);
    img.src = src;

    // Если картинка уже в кэше — load сработает мгновенно
    if (img.complete) handleLoad();

    return () => {
      cancelled = true;
      img.removeEventListener('load', handleLoad);
    };
  }, [src]);

  return ready;
};