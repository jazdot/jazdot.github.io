import { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Cat, Wrench } from 'lucide-react';

export default function App() {
  // 1. Initialize motion values for X and Y coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 2. Wrap them in a spring for a smooth, organic trailing effect
  const springConfig = { stiffness: 300, damping: 28, mass: 0.5 };
  const springX = useSpring(mouseX, springConfig);
  const springY = useSpring(mouseY, springConfig);

  // Offset the values so the center of the glow is exactly on the cursor
  const glowX = useTransform(springX, (value) => value - 200);
  const glowY = useTransform(springY, (value) => value - 200);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div 
      style={{ 
        position: 'relative', 
        minHeight: '100vh', 
        backgroundColor: '#0a0a0a', 
        color: '#ffffff',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif'
      }}
    >
      {/* Background Mouse Tracking Glow */}
      <motion.div
        style={{
          x: glowX,
          y: glowY,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(120, 119, 198, 0.15) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none', // Prevents the glow from blocking clicks on your tools
          zIndex: 0,
        }}
      />

      {/* Main Content */}
      <div style={{ position: 'relative', zIndex: 10, padding: '10vh 5vw', maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ marginBottom: '4rem' }}
        >
          <h1 style={{ fontSize: '4rem', margin: '0 0 1rem 0', fontWeight: 800, letterSpacing: '-0.05em' }}>
            jazdot.
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#a3a3a3', maxWidth: '600px', lineHeight: '1.6' }}>
            A collection of my tools, experiments, and creative coding projects. 
            Built for performance and beautifully designed.
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
          
          {/* Cat Master Tool Card */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.3s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(120, 119, 198, 0.5)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#7877c6', padding: '0.75rem', borderRadius: '12px' }}>
                <Cat size={24} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>cat_master</h2>
            </div>
            <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>
              The ultimate feline management toolkit. Access statistics, feeding schedules, and monitoring.
            </p>
          </motion.div>

          {/* Placeholder for future tools */}
          <motion.div 
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ 
              background: 'rgba(255, 255, 255, 0.02)', 
              border: '1px dashed rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '2rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              opacity: 0.6
            }}
          >
            <Wrench size={32} color="#888" style={{ marginBottom: '1rem' }} />
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#888' }}>More tools incoming...</h2>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
