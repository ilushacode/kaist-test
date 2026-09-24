/**
 * Определяет, запущено ли приложение в PWA-режиме
 * (standalone / fullscreen / minimal-ui / iOS standalone).
 *
 * В режиме разработки (npm run dev) всегда возвращает true —
 * чтобы приложение можно было разрабатывать в обычном браузере
 * без установки PWA. Реальная проверка работает только в
 * production-сборке (npm run build / preview / хостинг).
 */

export const isStandaloneMode = () => {
  // Dev-режим: пропускаем проверку, приложение работает штатно
  if (import.meta.env.DEV) return true;

  if (typeof window === 'undefined') return false;

  const displayModes = ['standalone', 'fullscreen', 'minimal-ui'];
  const matchesDisplayMode = displayModes.some((mode) =>
    window.matchMedia?.(`(display-mode: ${mode})`).matches
  );

  // iOS Safari: navigator.standalone
  const iosStandalone = window.navigator?.standalone === true;

  return matchesDisplayMode || iosStandalone;
};


/**
 * true — если устройство мобильное (iOS / Android / iPadOS).
 * Десктоп сюда не попадает.
 */
export const isMobileDevice = () => {
  if (typeof navigator === "undefined") return false;

  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  return isIOS || /Android/i.test(ua);
};