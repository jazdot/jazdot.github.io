import { useEffect, useState, Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { m, LazyMotion, useMotionValue, useSpring, useTransform, AnimatePresence, useScroll, MotionConfig } from 'framer-motion';
import { GlassNavBar, AuroraBackground } from './components/Hero';
import Home from './pages/Home';
import Loader from './components/Loader';
import ToolModal from './components/ToolModal';
import PWAReloadPrompt from './components/PWAReloadPrompt';

// Dynamically import non-critical pages and modals (Code Splitting)
const Portfolio = lazy(() => import('./Portfolio'));
const Tools = lazy(() => import('./pages/Tools'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const GitHubProjects = lazy(() => import('./components/GitHubProjects'));

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
        <Route path="/tools" element={
          <Suspense fallback={<Loader text="Loading tools..." className="min-h-[60vh]" />}>
            <Tools setGlowColor={setGlowColor} />
          </Suspense>
        } />
        <Route path="*" element={
          <Suspense fallback={<Loader text="Loading..." className="min-h-[60vh]" />}>
            <NotFound />
          </Suspense>
        } />
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

  // Synthesized Web Audio API Theme Switch Sound
  const playThemeSound = (isTurningDark: boolean) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      const now = ctx.currentTime;
      if (isTurningDark) {
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15); // Pitch bends down
      } else {
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15); // Pitch bends up
      }
      
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      // Silently fail if browser blocks autoplay
    }
  };

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    playThemeSound(newTheme);
  };

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
    <MotionConfig reducedMotion="user">
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
        <GlassNavBar isDark={isDark} toggleTheme={handleThemeToggle} onContactClick={() => setIsContactOpen(true)} />
        
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
        <Suspense fallback={<Loader text="Loading form..." className="p-8" />}>
          {isContactOpen && <ContactForm />}
        </Suspense>
      </ToolModal>

      {/* Global GitHub Modal */}
      <ToolModal isOpen={isGitHubOpen} onClose={() => setIsGitHubOpen(false)} title="Open Source Contributions">
        <Suspense fallback={<Loader text="Loading projects..." className="p-8" />}>
          {isGitHubOpen && <GitHubProjects />}
        </Suspense>
      </ToolModal>

      {/* Global PWA Update Notification */}
      <PWAReloadPrompt />
    </div>
    </MotionConfig>
    </LazyMotion>
  );
}
