import { useEffect, useState, Suspense, lazy } from 'react';
import { m, LazyMotion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { Cat, Gauge, Wrench } from 'lucide-react';
import Hero, { GlassNavBar, AuroraBackground } from './components/Hero';
import ToolModal from './components/ToolModal';

// Dynamically import components that are not immediately visible
const Portfolio = lazy(() => import('./Portfolio'));
const SpeedTestTool = lazy(() => import('./tools/SpeedTestTool'));

// Dynamically load Framer Motion's animation features
const loadFeatures = () => import('framer-motion').then(res => res.domAnimation);

export default function App() {
  // State to track the current color of the mouse glow
  const [glowColor, setGlowColor] = useState('rgba(120, 119, 198, 0.15)');

  // 1. Initialize motion values for X and Y coordinates
  const mouseX = useMotionValue(0);

  // State to manage the active tool modal
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const mouseY = useMotionValue(0);
  
  // State for Dynamic Theme
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // 2. Wrap them in a spring for a smooth, organic trailing effect
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
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
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <LazyMotion features={loadFeatures}>
    <div 
      className="relative min-h-screen overflow-x-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300"
    >
      {/* Background Mouse Tracking Glow */}
      <m.div
        animate={{
          background: `radial-gradient(circle, ${glowColor} 0%, rgba(0,0,0,0) 70%)`
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{
          x: glowX,
          y: glowY,
          position: 'fixed',
          top: 0,
          left: 0,
          width: '400px',
          height: '400px',
          borderRadius: '50%',
          pointerEvents: 'none', // Prevents the glow from blocking clicks on your tools
          zIndex: 0,
        }}
        className="hidden md:block" // Completely hide the glow on mobile devices
      />

      {/* Global Background */}
      <AuroraBackground />

      {/* Global Header */}
      <GlassNavBar isDark={isDark} toggleTheme={() => setIsDark(!isDark)} />

      {/* Hero Section */}
      <Hero />

      {/* Portfolio Sections */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Suspense fallback={<div className="flex justify-center items-center min-h-[50vh] text-slate-500">Loading portfolio...</div>}>
          <Portfolio />
        </Suspense>
      </div>

      {/* Main Content */}
      <div id="tools" style={{ position: 'relative', zIndex: 10, padding: '10vh 5vw', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', position: 'relative', display: 'inline-block' }}>
          Explore Tools
          <span style={{ position: 'absolute', bottom: '-8px', left: 0, width: '60px', height: '4px', background: 'var(--accent)', borderRadius: '2px' }}></span>
        </h2>

        {/* Tools Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))', gap: '2rem' }}>
          
          {/* Speed Test Tool Card */}
          <m.div
            onClick={() => setActiveTool('speedTest')}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
              setGlowColor('rgba(56, 189, 248, 0.25)');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--card-border)';
              setGlowColor('rgba(120, 119, 198, 0.15)');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ background: '#38bdf8', padding: '0.75rem', borderRadius: '12px' }}>
                <Gauge size={24} color="#fff" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>Network Speed Test</h2>
            </div>
            <p style={{ color: '#888', margin: 0, lineHeight: '1.5' }}>
              Measure your download speed with a quick and simple test.
            </p>
          </m.div>

          {/* Cat Master Tool Card */}
          <m.div 
            onClick={() => window.open('/cat_master/index.html', '_blank')}
            whileHover={{ y: -8, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ 
              background: 'var(--card-bg)', 
              border: '1px solid var(--card-border)',
              borderRadius: '16px',
              padding: '2rem',
              cursor: 'pointer',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(120, 119, 198, 0.5)';
              setGlowColor('rgba(120, 119, 198, 0.5)'); // Intensify the purple glow!
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--card-border)';
              setGlowColor('rgba(120, 119, 198, 0.15)'); // Reset back to default
            }}
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
          </m.div>

          {/* Placeholder for future tools */}
          <m.div 
            whileHover={{ y: -8, scale: 1.02 }}
            style={{ 
              background: 'var(--card-bg)', 
              border: '1px dashed var(--card-border)',
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
          </m.div>

        </div>
      </div>

      <ToolModal
        isOpen={activeTool !== null}
        onClose={() => setActiveTool(null)}
        title={
          activeTool === 'speedTest' ? 'Network Speed Test' : ''
        }
      >
        <Suspense fallback={<div className="flex justify-center items-center p-8 text-slate-500">Loading tool...</div>}>
          {activeTool === 'speedTest' && <SpeedTestTool />}
        </Suspense>
      </ToolModal>

      {/* Footer / Contact */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '4rem 5vw', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <a href="mailto:riswanmp6@gmail.com" style={{ color: '#888', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7877c6'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </a>
          <a href="https://linkedin.com/in/muhammedriswanmp" target="_blank" rel="noreferrer" style={{ color: '#888', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7877c6'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
          <a href="http://github.com/jazdot" target="_blank" rel="noreferrer" style={{ color: '#888', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7877c6'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
        </div>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} Muhammed Riswan M. P. All rights reserved.
        </p>
      </footer>
    </div>
    </LazyMotion>
  );
}
