import { m } from 'framer-motion';
import Hero from '../components/Hero';

export default function Home() {
  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ position: 'relative', zIndex: 10 }}
    >
      {/* Hero Section */}
      <Hero />
    </m.div>
  );
}