import { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { m, LazyMotion, useMotionValue, useSpring, useTransform, AnimatePresence, useScroll } from 'framer-motion';
import { GlassNavBar, AuroraBackground } from './components/Hero';
import Home from './pages/Home';
import Tools from './pages/Tools';
import Loader from './components/Loader';
import ToolModal from './components/ToolModal';
import ContactForm from './components/ContactForm';
import GitHubProjects from './components/GitHubProjects';
import NotFound from './pages/NotFound';

// Dynamically import the Profile page
const Portfolio = lazy(() => import('./Portfolio'));

// Dynamically load Framer Motion's animation features
const loadFeatures = () => import('framer-motion').then(res => res.domAnimation);

// Extracted routes component to allow useLocation for page transitions
const AnimatedRoutes = ({ setGlowColor }: { setGlowColor: (color: string) => void }) => {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={
          <Suspense fallback={<Loader text="Loading profile..." className="min-h-[60vh]" />}>
            <Portfolio />
          </Suspense>
        } />
        <Route path="/tools" element={<Tools setGlowColor={setGlowColor} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  // State to track the current color of the mouse glow
  const [glowColor, setGlowColor] = useState('rgba(120, 119, 198, 0.15)');

  // 1. Initialize motion values for X and Y coordinates
  const mouseX = useMotionValue(0);

  const mouseY = useMotionValue(0);

  // Contact Modal State
  const [isContactOpen, setIsContactOpen] = useState(false);

  // GitHub Modal State
  const [isGitHubOpen, setIsGitHubOpen] = useState(false);

  // Scroll Progress Tracking
  const { scrollYProgress } = useScroll();

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
    
    // Let the glow follow touches on mobile as well!
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        mouseX.set(e.touches[0].clientX);
        mouseY.set(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [mouseX, mouseY]);

  return (
    <LazyMotion features={loadFeatures}>
    <div 
      className="relative z-0 min-h-screen overflow-x-hidden font-sans text-slate-900 dark:text-slate-100 transition-colors duration-300"
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
      />

      {/* Global Scroll Progress Bar */}
      <m.div
        style={{
          scaleX: scrollYProgress,
          transformOrigin: '0%',
          position: 'fixed',
          top: 0, left: 0, right: 0, height: '3px',
          background: 'hsl(var(--accent))',
          zIndex: 9999
        }}
      />

      {/* Global Background */}
      <AuroraBackground />

      <Router>
        <GlassNavBar isDark={isDark} toggleTheme={() => setIsDark(!isDark)} onContactClick={() => setIsContactOpen(true)} />
        
        <AnimatedRoutes setGlowColor={setGlowColor} />
      </Router>

      {/* Footer / Contact */}
      <footer style={{ position: 'relative', zIndex: 10, padding: '4rem 5vw', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsContactOpen(true); }} aria-label="Email Me" style={{ color: '#888', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7877c6'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
          </a>
          <a href="https://linkedin.com/in/muhammedriswanmp" target="_blank" rel="noreferrer" aria-label="LinkedIn Profile" style={{ color: '#888', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7877c6'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
          <a href="#" onClick={(e) => { e.preventDefault(); setIsGitHubOpen(true); }} aria-label="GitHub Profile" style={{ color: '#888', transition: 'color 0.3s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#7877c6'} onMouseLeave={(e) => e.currentTarget.style.color = '#888'}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
          </a>
        </div>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} Muhammed Riswan M. P. All rights reserved.
        </p>
      </footer>

      {/* Global Contact Modal */}
      <ToolModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} title="Get in Touch">
        <ContactForm />
      </ToolModal>

      {/* Global GitHub Modal */}
      <ToolModal isOpen={isGitHubOpen} onClose={() => setIsGitHubOpen(false)} title="Open Source Contributions">
        <GitHubProjects />
      </ToolModal>
    </div>
    </LazyMotion>
  );
}
