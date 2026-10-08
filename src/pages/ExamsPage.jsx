import { motion } from 'motion/react';
import { HeaderComponent } from '../components/HeaderComponent';
import { ExamsComponent } from '../components/ExamsComponent';

export function ExamsPage() {
  return (
    <motion.div
      className="exams-page-wrapper"
      style={{ flex: 1 }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
    >
      <HeaderComponent title={'Экзамены'} backButton />
      <ExamsComponent />
    </motion.div>
  );
}