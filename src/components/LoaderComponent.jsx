import { Loader2 } from 'lucide-react';

/**
 * Минималистичный загрузчик.
 *
 * @param {number}  size   - размер иконки в px (по умолчанию 32)
 * @param {string}  color  - цвет (по умолчанию 'currentColor')
 * @param {number}  stroke - толщина линии (по умолчанию 2)
 * @param {string}  text   - подпись под спиннером (опционально)
 * @param {boolean} fullscreen - центрировать на весь экран
 * @param {string}  style  - доп. inline-стили
 */
export default function Loader({
  size = 32,
  color = 'currentColor',
  stroke = 2,
  text,
  fullscreen = false,
  style = {},
}) {
  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        ...style,
      }}
    >
      <Loader2
        size={size}
        color={color}
        strokeWidth={stroke}
        style={{ animation: 'loader-spin 1s linear infinite' }}
      />
      {text && (
        <span style={{ fontSize: 14, color, opacity: 0.8 }}>{text}</span>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.6)',
          zIndex: 9999,
        }}
      >
        {content}
      </div>
    );
  }

  return content;
}