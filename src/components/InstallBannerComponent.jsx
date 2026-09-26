// src/components/InstallBanner.jsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { X, Download, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { isStandaloneMode } from '../utils/pwa';
import '../styles/InstallBanner.css';

const DISMISS_KEY = 'install-banner-dismissed-until';
const INSTALLED_KEY = 'install-banner-installed';

/** Сколько миллисекунд баннер скрыт после закрытия. */
const DISMISS_DURATION_MS = 10 * 60 * 1000; // 10 минут

/** Определяет ОС и браузер. */
function detectPlatform() {
  if (typeof navigator === 'undefined') {
    return { os: 'other', browser: 'other' };
  }

  const ua = navigator.userAgent || '';
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  const os = isIOS ? 'ios' : /Android/i.test(ua) ? 'android' : 'desktop';

  let browser = 'other';
  if (/CriOS/i.test(ua)) browser = 'chrome';
  else if (/FxiOS/i.test(ua)) browser = 'firefox';
  else if (/EdgiOS/i.test(ua)) browser = 'edge';
  else if (/YaBrowser/i.test(ua)) browser = 'yandex';
  else if (/OPiOS|OPR|Opera/i.test(ua)) browser = 'opera';
  else if (/SamsungBrowser/i.test(ua)) browser = 'samsung';
  else if (/Edg\//i.test(ua)) browser = 'edge';
  else if (/Firefox|FxiOS/i.test(ua)) browser = 'firefox';
  else if (/Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser|YaBrowser/i.test(ua)) browser = 'chrome';
  else if (/Safari/i.test(ua)) browser = 'safari';

  return { os, browser };
}

function canInstallOn({ os, browser }) {
  if (os === 'ios') return browser === 'safari';
  if (os === 'android') return browser === 'chrome';
  if (os === 'desktop') return browser === 'chrome' || browser === 'edge';
  return false;
}

function getInstallSteps({ os, browser }) {
  if (os === 'ios') {
    if (browser === 'safari') {
      return [
        'Нажмите «Поделиться» внизу экрана',
        'Выберите «На экран "Домой"»',
        'Нажмите «Добавить»',
      ];
    }
    return [
      'Откройте сайт в Safari',
      'Нажмите «Поделиться»',
      '«На экран "Домой"» → «Добавить»',
    ];
  }

  if (os === 'android') {
    if (browser === 'chrome') {
      return [
        'Меню браузера ⋮',
        '«Установить приложение»',
        'Подтвердите установку',
      ];
    }
    return [
      'Откройте сайт в Chrome',
      'Меню ⋮ → «Установить приложение»',
      'Подтвердите установку',
    ];
  }

  if (os === 'desktop') {
    if (browser === 'chrome' || browser === 'edge') {
      return [
        'Нажмите иконку установки в адресной строке',
        'Подтвердите установку',
      ];
    }
    return [
      'Откройте сайт в Chrome или Edge',
      'Нажмите иконку установки в адресной строке',
    ];
  }

  return [
    'Откройте меню браузера',
    'Выберите «Установить приложение»',
  ];
}

/** Сколько миллисекунд осталось до повторного показа баннера. 0 — показать сейчас. */
function getDismissRemainingMs() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return 0;
    const until = Number(raw);
    if (!Number.isFinite(until)) return 0;
    return Math.max(0, until - Date.now());
  } catch {
    return 0;
  }
}

/** Показывать ли баннер прямо сейчас. */
function shouldShowBanner() {
  if (isStandaloneMode()) return false;

  try {
    if (localStorage.getItem(INSTALLED_KEY) === '1') return false;
  } catch {
    // приватный режим — localStorage недоступен
  }

  return getDismissRemainingMs() === 0;
}

export const InstallBanner = () => {
  const [visible, setVisible] = useState(() => shouldShowBanner());
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [expanded, setExpanded] = useState(false);

  // Ссылка на таймер, чтобы очистить при размонтировании
  const showTimerRef = useRef(null);

  const platform = useMemo(() => detectPlatform(), []);
  const installSupported = useMemo(() => canInstallOn(platform), [platform]);
  const steps = useMemo(() => getInstallSteps(platform), [platform]);

  // При монтировании: если баннер скрыт таймаутом — запланировать повтор
  useEffect(() => {
    if (visible) return;

    const remaining = getDismissRemainingMs();
    if (remaining <= 0) {
      // Баннер скрыт по другой причине (installed / standalone) — не трогаем
      if (!isStandaloneMode()) {
        try {
          if (localStorage.getItem(INSTALLED_KEY) === '1') return;
        } catch {}
      }
      return;
    }

    // Через remaining мс баннер снова покажется — без перезагрузки страницы
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, remaining);

    return () => {
      if (showTimerRef.current) {
        clearTimeout(showTimerRef.current);
        showTimerRef.current = null;
      }
    };
  }, [visible]);

  // beforeinstallprompt / appinstalled
  useEffect(() => {
    if (!visible) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      try { localStorage.setItem(INSTALLED_KEY, '1'); } catch {}
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [visible]);

  const showInstallButton = Boolean(deferredPrompt);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === 'accepted') {
      try { localStorage.setItem(INSTALLED_KEY, '1'); } catch {}
      setVisible(false);
    }
  };

  const handleBannerClick = () => {
    if (!showInstallButton) setExpanded((v) => !v);
  };

  /** Закрытие с таймаутом: скрываем и назначаем время возврата. */
  const handleDismiss = (e) => {
    e?.stopPropagation();

    const until = Date.now() + DISMISS_DURATION_MS;
    try { localStorage.setItem(DISMISS_KEY, String(until)); } catch {}

    setVisible(false);

    // Планируем показ через DISMISS_DURATION_MS, чтобы пользователь
    // не ждал перезагрузки страницы
    if (showTimerRef.current) clearTimeout(showTimerRef.current);
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
    }, DISMISS_DURATION_MS);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="install-banner"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
        >
          <div
            className={
              'install-banner__row' +
              (!showInstallButton ? ' install-banner__row--clickable' : '')
            }
            onClick={handleBannerClick}
          >
            <div className="install-banner__icon">
              <Download size={20} strokeWidth={2.4} />
            </div>

            <div className="install-banner__content">
              <p className="install-banner__title">Установите приложение</p>
              <p className="install-banner__subtitle">
                Быстрый доступ с рабочего стола и работа офлайн
              </p>
            </div>

            {showInstallButton && (
              <button
                type="button"
                className="install-banner__action"
                onClick={(e) => {
                  e.stopPropagation();
                  handleInstall();
                }}
              >
                Установить
              </button>
            )}

            {!showInstallButton && (
              <motion.span
                className="install-banner__chevron"
                animate={{ rotate: expanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown size={18} />
              </motion.span>
            )}

            <button
              type="button"
              className="install-banner__close"
              onClick={handleDismiss}
              aria-label="Закрыть на 10 минут"
              title="Скрыть на 10 минут"
            >
              <X size={18} />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {expanded && !showInstallButton && (
              <motion.div
                key="guide"
                className="install-banner__guide"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {installSupported ? (
                  <>
                    <p className="install-banner__guide__title">
                      Как установить
                    </p>
                    <ol className="install-banner__guide__steps">
                      {steps.map((step, i) => (
                        <li key={i} className="install-banner__guide__step">
                          <span className="install-banner__guide__num">
                            {i + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                ) : (
                  <p className="install-banner__guide__fallback">
                    Установка недоступна в этом браузере. Откройте сайт в
                    Chrome (Android) или Safari (iOS).
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};