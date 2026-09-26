import { motion } from 'motion/react';
import { Rocket } from 'lucide-react';
import { usePrefetchImage } from '../hooks/usePrefetchImage';
import '../styles/Hello.css';

const HELLO_IMAGE_SRC = '/images/goose_hello.png';

const SPRING = { type: 'spring', stiffness: 500, damping: 38, mass: 0.6 };

const CASCADE_START = 0.05;
const CASCADE_STEP = 0.08;

const cascade = (i) => ({
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { ...SPRING, delay: CASCADE_START + CASCADE_STEP * i },
});

export const HelloComponent = ({ onContinue }) => {
  usePrefetchImage(HELLO_IMAGE_SRC);

  const handleStart = () => {
    onContinue?.();
  };

  return (
    <div className="hello">
      <motion.div className="hello__image-wrap" {...cascade(0)}>
        <img
          src={HELLO_IMAGE_SRC}
          alt="Гусь приветствует"
          className="hello__image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </motion.div>

      <motion.h1 className="hello__title" {...cascade(1)}>
        Привет!
      </motion.h1>

      <motion.p className="hello__subtitle" {...cascade(2)}>
        Это КАИСТ — быстрое расписание для студентов КНИТУ-КАИ. Никаких лишних кнопок, только твои пары.
      </motion.p>

      <motion.button
        type="button"
        className="hello__action"
        onClick={handleStart}
        whileTap={{ scale: 0.96 }}
        transition={SPRING}
        {...cascade(3)}
      >
        <span>Поехали!</span>
        <Rocket size={18} strokeWidth={2} />
      </motion.button>
    </div>
  );
};