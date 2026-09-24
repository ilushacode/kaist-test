import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';

const ModalContext = createContext(null);

export function ModalProvider({ children }) {
  const [modal, setModal] = useState(null);

  const openModal = useCallback((ModalComponent, props = {}) => {
    setModal({ ModalComponent, props, key: Date.now() });
  }, []);

  const closeModal = useCallback(() => {
    setModal(null);
  }, []);

  const value = useMemo(
    () => ({ openModal, closeModal }),
    [openModal, closeModal]
  );

  const handleBackdropClick = useCallback(() => {
    closeModal();
  }, [closeModal]);

  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  const handleDragEnd = useCallback(
    (event, info) => {
      const shouldClose = info.offset.y > 120 || info.velocity.y > 500;
      if (shouldClose) closeModal();
    },
    [closeModal]
  );

  return (
    <ModalContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {modal && (
          <motion.div
            key={modal.key}
            className="modal-backdrop theme_light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            onClick={handleBackdropClick}
          >
            <motion.div
              className="modal-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
                mass: 0.8,
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.6 }}
              onDragEnd={handleDragEnd}
              onClick={stopPropagation}
            >
              <div className="modal-sheet__drag-handle" />

              <modal.ModalComponent
                {...modal.props}
                closeModal={closeModal}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return ctx;
}