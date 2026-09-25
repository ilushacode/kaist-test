// src/screens/InstallScreen.jsx
import { useEffect, useMemo, useState } from "react";
import "../Install.css";

/**
 * Определяет ОС и браузер (только мобильные сценарии).
 *
 * @param {string|null} osOverride      — принудительная ОС ("ios" | "android" | "other")
 * @param {string|null} browserOverride — принудительный браузер ("safari" | "chrome" | ...)
 */
function detectPlatform(osOverride = null, browserOverride = null) {
  if (typeof navigator === "undefined") {
    return {
      os: osOverride ?? "other",
      browser: browserOverride ?? "other",
      isInstallable: false,
    };
  }

  const ua = navigator.userAgent || "";
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  let os = isIOS ? "ios" : /Android/i.test(ua) ? "android" : "other";

  let browser = "other";
  if (/CriOS/i.test(ua)) browser = "chrome";
  else if (/FxiOS/i.test(ua)) browser = "firefox";
  else if (/EdgiOS/i.test(ua)) browser = "edge";
  else if (/YaBrowser/i.test(ua)) browser = "yandex";
  else if (/OPiOS|OPR|Opera/i.test(ua)) browser = "opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "samsung";
  else if (/Edg\//i.test(ua)) browser = "edge";
  else if (/Firefox|FxiOS/i.test(ua)) browser = "firefox";
  else if (/Chrome/i.test(ua) && !/Edg|OPR|SamsungBrowser|YaBrowser/i.test(ua)) browser = "chrome";
  else if (/Safari/i.test(ua)) browser = "safari";

  // Переопределение из URL (работает только в dev)
  if (osOverride) os = osOverride;
  if (browserOverride) browser = browserOverride;

  /**
   * Ключевая логика: PWA ставится только в «родной» браузер платформы.
   *
   *  iOS      → только Safari
   *  Android  → только Chrome
   *  Desktop  → сюда не попадаем (InstallScreen для десктопа — только гайд)
   *
   *  Всё остальное — ярлык или ничего.
   */
  const isInstallable =
    (os === "ios" && browser === "safari") ||
    (os === "android" && browser === "chrome");

  return { os, browser, isInstallable };
}

/**
 * Возвращает массив шагов установки для конкретной платформы.
 * Всегда возвращает хотя бы fallback-инструкцию.
 */
function getInstallSteps(os, browser) {
  if (os === "ios") {
    if (browser === "safari") {
      return [
        "Нажмите «Поделиться» ⎋ внизу экрана",
        'Выберите «На экран "Домой"»',
        "Нажмите «Добавить»",
      ];
    }
    return [
      "Откройте эту страницу в Safari",
      "Нажмите «Поделиться» ⎋",
      'Выберите «На экран "Домой"»',
      "Нажмите «Добавить»",
    ];
  }

  if (os === "android") {
    if (browser === "chrome") {
      return [
        "Откройте меню браузера ⋮",
        "Выберите «Установить приложение»",
        "Подтвердите установку",
      ];
    }
    return [
      "Откройте эту страницу в Chrome",
      "Меню ⋮ → «Установить приложение»",
      "Подтвердите установку",
    ];
  }

  // Fallback: ОС не распознана
  return [
    "Откройте меню браузера",
    "Выберите «Установить приложение» или «Добавить на главный экран»",
    "Подтвердите установку",
  ];
}

export const InstallScreen = ({
  isMobile,
  osOverride = null,
  browserOverride = null,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);

  const platform = useMemo(
    () => detectPlatform(osOverride, browserOverride),
    [osOverride, browserOverride]
  );

  /**
   * beforeinstallprompt приходит в Chrome и Yandex/Opera/Samsung.
   * Но нативный prompt корректно работает ТОЛЬКО в «родном» браузере
   * (Chrome на Android / Safari на iOS). В остальных — браузер создаст
   * ярлык, а не PWA. Поэтому слушаем событие всегда, но используем
   * его, только если platform.isInstallable === true.
   */
  useEffect(() => {
    if (!isMobile) return;

    const onBeforeInstall = (e) => {
      e.preventDefault();
      // Если браузер неродной — не сохраняем событие.
      // Иначе пользователь увидит кнопку, ведущую к ярлыку.
      if (!platform.isInstallable) return;
      setDeferredPrompt(e);
    };

    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, [isMobile, platform.isInstallable]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    if (outcome === "accepted") setInstalled(true);
  };

  const steps = useMemo(
    () => getInstallSteps(platform.os, platform.browser),
    [platform]
  );

  /**
   * Кнопку показываем ТОЛЬКО когда:
   *  1. Мы в мобильной раскладке,
   *  2. Браузер — родной для PWA (Chrome на Android, Safari на iOS),
   *  3. Браузер реально прислал beforeinstallprompt.
   *
   * Иначе — только гайд.
   */
  const showInstallButton =
    isMobile && platform.isInstallable && Boolean(deferredPrompt);

  const url = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="install theme_light">
      <div className="install__blob install__blob--1" aria-hidden="true" />
      <div className="install__blob install__blob--2" aria-hidden="true" />
      <div className="install__blob install__blob--3" aria-hidden="true" />

      <div className="install__card">
        <div className="install__content">
          {/* ---------- ЛЕВАЯ КОЛОНКА ---------- */}
          <div className="install__content__left">
            <span className="install__badge">Расписание КАИ</span>

            <h1 className="install__content__left__title">
              Все пары — <br />
              в твоём телефоне
            </h1>

            <p className="install__content__left__subtitle">
              Пары, преподаватели, аудитории и экзамены под рукой.
              Работает оффлайн и открывается с иконки на рабочем столе.
            </p>

            {/* ----- ДЕСКТОП ----- */}
            {!isMobile && (
              <div className="install__guide">
                <p className="install__guide__title">
                  Открой эту страницу на телефоне
                </p>
                <p className="install__guide__content">
                  Приложение работает только на мобильных устройствах.
                  Наведи камеру на QR-код.
                </p>

                <div className="install__qr">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      url
                    )}`}
                    alt="QR-код для открытия на телефоне"
                    width={220}
                    height={220}
                    className="install__qr__image"
                  />
                </div>
              </div>
            )}

            {/* ----- МОБИЛЬНЫЙ ----- */}
            {isMobile && (
              <div className="install__guide">
                <p className="install__guide__title">Как установить?</p>

                {installed ? (
                  <div className="install__done">
                    <span className="install__done__icon">✓</span>
                    <p className="install__done__text">
                      Приложение установлено. Откройте его с рабочего стола.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Кнопка — только если браузер родной и событие пришло */}
                    {showInstallButton && (
                      <div className="install__button__container">
                        <button
                          type="button"
                          className="install__button"
                          onClick={handleInstall}
                        >
                          Установить приложение
                        </button>
                        <p className="install__button__or">или</p>
                      </div>
                    )}

                    {/* Шаги — всегда (пока не установлено) */}
                    <ol className="install__steps">
                      {steps.map((step, i) => (
                        <li key={i} className="install__steps__item">
                          <span className="install__steps__num">{i + 1}</span>
                          <span className="install__steps__text">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </>
                )}
              </div>
            )}
          </div>

          {/* ---------- ПРАВАЯ КОЛОНКА ---------- */}
          <div className="install__content__right">
            <div className="install__mockup">
              <div className="install__mockup__glow" aria-hidden="true" />
              <img
                src="/images/phone_app.png"
                alt="Экран приложения"
                className="install__mockup__image"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};