import { useStore } from '../hooks/useStore';

/**
 * Полный сброс приложения.
 * Доступна в консоли как window.__resetApp().
 */
export async function resetApp({ reload = true } = {}) {
  await useStore.getState().resetAll();
  console.log('%c[dev] App fully reset', 'color:#e11d48;font-weight:bold');

  if (reload) {
    // Жёсткая перезагрузка без кэша — гарантирует чистое состояние
    window.location.reload();
  }
}

// Регистрируем в dev-режиме
if (import.meta.env.DEV) {
  window.__resetApp = resetApp;
}