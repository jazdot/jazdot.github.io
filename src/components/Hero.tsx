import React, { useRef, useEffect, useState } from "react";
import { m, useMotionValue, useSpring, useTransform, type Variants, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";

// ----------------------------------------------------------------------
// 1. Magnetic Button (Secondary CTA)
// ----------------------------------------------------------------------
const MagneticButton = ({
  children,
  className = "",
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Spring physics for a natural, snappy magnetic pull
  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;

    x.set(distanceX * 0.25);
    y.set(distanceY * 0.25);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.button
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{ x: springX, y: springY, ...style }}
      className={`relative px-8 py-3 rounded-full font-medium transition-colors duration-300 ${className}`}
    >
      {children}
    </m.button>
  );
};

// ----------------------------------------------------------------------
// 2. Glowing Button (Primary CTA)
// ----------------------------------------------------------------------
const GlowingButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <div
      onClick={onClick}
      className="relative group cursor-pointer sm:w-auto w-full transition-transform hover:scale-105 active:scale-95 duration-300"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-md opacity-60 group-hover:opacity-100 transition duration-500 group-hover:duration-200"></div>
      <button className="relative w-full h-full rounded-full px-8 py-3 font-bold text-white bg-slate-900/80 border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden backdrop-blur-sm">
        <span className="relative z-10">{children}</span>
        {/* Glossy overlay */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 transition duration-500"></div>
      </button>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. Typewriter Headline
// ----------------------------------------------------------------------
const TypewriterHeadline = ({ text }: { text: string }) => {
  const characters = text.split("");
  
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05, delayChildren: 0.2 },
    },
  };
  
  const charVariants: Variants = {
    hidden: { opacity: 0, display: "none" },
    show: { opacity: 1, display: "inline-block" },
  };

  return (
    <m.h1
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter text-center mt-6 text-slate-900 dark:text-white"
    >
      {characters.map((char, i) => (
        <m.span
          key={i}
          variants={charVariants}
          style={{ display: "inline-block", whiteSpace: "pre" }}
        >
          {char}
        </m.span>
      ))}
      <m.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        style={{ display: "inline-block", width: "4px", height: "1em", marginLeft: "12px", borderRadius: "4px", backgroundColor: "var(--accent)" }}
      />
    </m.h1>
  );
};

// ----------------------------------------------------------------------
// 4. Glassmorphism Navigation Bar
// ----------------------------------------------------------------------
export const GlassNavBar = ({ isDark, toggleTheme }: { isDark?: boolean; toggleTheme?: () => void }) => {
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/tools') {
      setActiveSection('tools');
    } else if (location.pathname === '/about') {
      setActiveSection('profile');
    } else {
      setActiveSection('home');
    }
  }, [location]);

  const handleNav = (path: string) => {
    setIsMobileMenuOpen(false);
    
    if (location.pathname !== path) {
      navigate(path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
    <m.nav
      initial={{ y: -100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
      className="fixed top-6 left-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-xl shadow-2xl w-[90%] max-w-5xl bg-white/60 dark:bg-white/5 border border-slate-200/50 dark:border-white/10"
    >
      <div className="font-bold tracking-widest text-lg text-slate-900 dark:text-white cursor-pointer" onClick={() => handleNav('/')}>
        JAZDOT<span style={{ color: "var(--accent)" }}>.</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-300">
        <button onClick={() => handleNav('/')} className={`relative transition-colors hover:text-slate-900 dark:hover:text-white ${activeSection === "home" ? "text-slate-900 dark:text-white" : ""}`}>
          Home
          {activeSection === "home" && (
            <m.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-accent" />
          )}
        </button>
        <button onClick={() => handleNav('/about')} className={`relative transition-colors hover:text-slate-900 dark:hover:text-white ${activeSection === "profile" ? "text-slate-900 dark:text-white" : ""}`}>
          Profile
          {activeSection === "profile" && (
            <m.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-accent" />
          )}
        </button>
        <button onClick={() => handleNav('/tools')} className={`relative transition-colors hover:text-slate-900 dark:hover:text-white ${activeSection === "tools" ? "text-slate-900 dark:text-white" : ""}`}>
          Tools
          {activeSection === "tools" && (
            <m.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-accent" />
          )}
        </button>
      </div>
      <div className="flex items-center gap-4">
        {toggleTheme && (
          <button onClick={toggleTheme} className="text-slate-500 dark:text-slate-300 transition-colors hover:text-accent dark:hover:text-accent" aria-label="Toggle Theme">
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <MagneticButton 
          onClick={() => window.location.href="mailto:riswanmp6@gmail.com"}
          className="hidden sm:block text-sm !px-5 !py-2 bg-slate-900 dark:bg-white/10 border border-transparent dark:border-white/20 text-white hover:bg-slate-800 dark:hover:bg-white/20">
          Contact
        </MagneticButton>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </m.nav>

    {/* Mobile Menu Dropdown */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <m.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed top-24 left-1/2 z-40 flex flex-col items-center gap-6 px-6 py-8 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-white/10 backdrop-blur-xl shadow-2xl w-[90%] max-w-sm md:hidden"
        >
          <button onClick={() => handleNav('/')} className={`text-lg font-medium transition-colors ${activeSection === 'home' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Home</button>
          <button onClick={() => handleNav('/about')} className={`text-lg font-medium transition-colors ${activeSection === 'profile' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Profile</button>
          <button onClick={() => handleNav('/tools')} className={`text-lg font-medium transition-colors ${activeSection === 'tools' ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}>Tools</button>
          <button 
            onClick={() => {
              window.location.href="mailto:riswanmp6@gmail.com";
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 px-8 py-3 w-full rounded-full font-medium bg-slate-900 dark:bg-white/10 border border-transparent dark:border-white/20 text-white hover:bg-slate-800 dark:hover:bg-white/20 transition-colors"
          >
            Contact
          </button>
        </m.div>
      )}
    </AnimatePresence>
    </>
  );
};

// ----------------------------------------------------------------------
// 5. Aurora / Mesh Gradient Background
// ----------------------------------------------------------------------
export const AuroraBackground = () => {
  const mouseX = useMotionValue(typeof window !== "undefined" ? window.innerWidth / 2 : 0);
  const mouseY = useMotionValue(typeof window !== "undefined" ? window.innerHeight / 2 : 0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const transformX1 = useSpring(useTransform(mouseX, [-500, 500], [-50, 50]), { stiffness: 50, damping: 20 });
  const transformY1 = useSpring(useTransform(mouseY, [-500, 500], [-50, 50]), { stiffness: 50, damping: 20 });
  const transformX2 = useSpring(useTransform(mouseX, [-500, 500], [50, -50]), { stiffness: 50, damping: 20 });
  const transformY2 = useSpring(useTransform(mouseY, [-500, 500], [50, -50]), { stiffness: 50, damping: 20 });

  // State to smoothly shift the aurora colors on click
  const [hue, setHue] = useState(0);
  useEffect(() => {
    const handleClick = () => setHue(h => h + 45); // Shift the color wheel by 45 degrees
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  return (
    <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden bg-[var(--page-bg)] transition-colors duration-300" style={{ filter: `hue-rotate(${hue}deg)` }}>

      {/* Animated Blobs */}
      <m.div style={{ x: transformX1, y: transformY1 }} className="absolute top-1/4 left-1/4">
        <m.div
          animate={{ x: ["-20%", "20%", "-20%"], y: ["-10%", "10%", "-10%"], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[50vw] h-[50vw] md:w-[40vw] md:h-[40vw] rounded-full bg-blue-600/30 blur-[100px] mix-blend-screen dark:mix-blend-color-dodge"
        />
      </m.div>
      <m.div style={{ x: transformX2, y: transformY2 }} className="absolute bottom-1/4 right-1/4">
        <m.div
          animate={{ x: ["20%", "-20%", "20%"], y: ["10%", "-10%", "10%"], scale: [1, 1.3, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="w-[60vw] h-[60vw] md:w-[50vw] md:h-[50vw] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen dark:mix-blend-color-dodge"
        />
      </m.div>
      <m.div style={{ x: transformX1, y: transformY2 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <m.div
          animate={{ x: ["0%", "30%", "0%"], y: ["20%", "-20%", "20%"], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="w-[40vw] h-[40vw] md:w-[30vw] md:h-[30vw] rounded-full bg-teal-500/20 blur-[90px] mix-blend-screen dark:mix-blend-color-dodge"
        />
      </m.div>

      {/* Subtle Noise Texture Overlay */}
      <div
        style={{
          position: "absolute", inset: 0, zIndex: 0, opacity: 0.04, pointerEvents: "none", mixBlendMode: "overlay",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Subtle Dot Pattern Overlay (Very Top) */}
      <div 
        className="absolute inset-0 pointer-events-none bg-dot-pattern"
        style={{
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
        }}
      ></div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 6. Main Hero Component
// ----------------------------------------------------------------------
export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center font-sans">

      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto mt-20">
        <m.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
          className="px-4 py-1.5 mb-6 rounded-full border backdrop-blur-md text-sm font-medium shadow-xl bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-900 dark:text-white"
        >
          ✨ Available for new opportunities
        </m.div>

        <TypewriterHeadline text="Welcome Explorer!" />

        <m.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.8 }}
          className="mt-8 mb-12 text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed"
        >
          I'm a Results-oriented Network Engineer with hands-on experience in MLOps, SDN, 5G/O-RAN, 
          and network automation. Specializing in Python, Terraform, and high-performance 
          cloud infrastructures.
        </m.p>

        {/* CTAs */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 1 }}
          className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
        >
          <div className="w-full sm:w-auto" onClick={() => navigate('/about')}>
            <GlowingButton>View Profile</GlowingButton>
          </div>
          <MagneticButton 
            className="w-full sm:w-auto group text-black dark:text-white hover:text-blue-400"
            onClick={() => navigate('/tools')}
          >
            Explore Tools{" "}<span className="ml-1 transition-transform inline-block group-hover:translate-x-1">→</span>
          </MagneticButton>
        </m.div>
      </div>
    </section>
  );
}