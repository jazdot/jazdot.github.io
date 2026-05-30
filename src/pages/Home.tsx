import { m } from 'framer-motion';
import Hero from '../components/Hero';
import SEO from '../components/SEO';

export default function Home() {
  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{ position: 'relative', zIndex: 10 }}
    >
      <SEO 
        title="Muhammed Riswan M. P. | Network Engineer & Cloud DevOps" 
        description="Results-oriented Network Engineer with hands-on experience in SDN, 5G/O-RAN, and network automation. Specializing in Python, Terraform, and high-performance cloud infrastructures."
      />
      {/* Hero Section */}
      <Hero />
    </m.div>
  );
}