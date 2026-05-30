import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, type Variants, AnimatePresence } from "framer-motion";
import { Menu, X, Sun, Moon } from "lucide-react";

// ----------------------------------------------------------------------
// 1. Magnetic Button (Secondary CTA)
// ----------------------------------------------------------------------
const MagneticButton = ({
  children,
  className = "",
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
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
    <motion.button
      ref={ref}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onClick={onClick}
      style={{ x: springX, y: springY }}
      className={`relative px-8 py-3 rounded-full font-medium transition-colors duration-300 ${className}`}
    >
      {children}
    </motion.button>
  );
};

// ----------------------------------------------------------------------
// 2. Glowing Button (Primary CTA)
// ----------------------------------------------------------------------
const GlowingButton = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <div 
      onClick={onClick}
      className="relative group rounded-full overflow-hidden p-[2px] cursor-pointer sm:w-auto w-full transition-transform hover:scale-105 active:scale-95 duration-300 shadow-xl"
    >
      {/* Animated gradient border */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2"
        style={{ backgroundImage: 'conic-gradient(from 0deg, transparent 0 340deg, var(--accent) 360deg)' }}
      />
      {/* Extra blurred layer for the intense glow effect */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 opacity-50 blur-md"
        style={{ backgroundImage: 'conic-gradient(from 0deg, transparent 0 340deg, var(--accent) 360deg)' }}
      />
      <button className="relative z-10 w-full h-full rounded-full px-8 py-3 font-medium transition-colors" style={{ backgroundColor: 'var(--page-bg)', color: 'var(--page-text)' }}>
        {children}
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
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tighter flex flex-wrap justify-center items-center mt-6 transition-colors duration-300"
      style={{ color: 'var(--page-text)' }}
    >
      {characters.map((char, i) => (
        <motion.span
          key={i}
          variants={charVariants}
          className="inline-block drop-shadow-lg"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
      <motion.span
        animate={{ opacity: [0, 1, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
        className="inline-block w-[4px] md:w-[6px] h-[1em] ml-2 md:ml-4 rounded-full"
        style={{ backgroundColor: 'var(--accent)' }}
      />
    </motion.h1>
  );
};

// ----------------------------------------------------------------------
// 4. Glassmorphism Navigation Bar
// ----------------------------------------------------------------------
export const GlassNavBar = ({ isDark, toggleTheme }: { isDark?: boolean; toggleTheme?: () => void }) => {
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["about", "work", "tools"];
      let current = "";
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Highlight the section if it is in the top half of the viewport
          if (rect.top <= window.innerHeight / 2) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll);
    // Call once to set initial state
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
    <motion.nav
      initial={{ y: -100, x: "-50%", opacity: 0 }}
      animate={{ y: 0, x: "-50%", opacity: 1 }}
      transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
      className="fixed top-6 left-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-xl shadow-2xl w-[90%] max-w-5xl transition-colors duration-300"
      style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)' }}
    >
      <div className="font-bold tracking-widest text-lg transition-colors duration-300" style={{ color: 'var(--page-text)' }}>
        JAZDOT<span className="text-blue-500">.</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <a href="#work" className="relative transition-colors" style={{ color: activeSection === "work" ? "var(--nav-text-hover)" : "var(--nav-text)" }}>
          Work
          {activeSection === "work" && (
            <motion.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-blue-500 rounded-full" />
          )}
        </a>
        <a href="#tools" className="relative transition-colors" style={{ color: activeSection === "tools" ? "var(--nav-text-hover)" : "var(--nav-text)" }}>
          Tools
          {activeSection === "tools" && (
            <motion.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-blue-500 rounded-full" />
          )}
        </a>
        <a href="#about" className="relative transition-colors" style={{ color: activeSection === "about" ? "var(--nav-text-hover)" : "var(--nav-text)" }}>
          About
          {activeSection === "about" && (
            <motion.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-blue-500 rounded-full" />
          )}
        </a>
      </div>
      <div className="flex items-center gap-4">
        {toggleTheme && (
          <button onClick={toggleTheme} className="transition-colors hover:text-blue-400" aria-label="Toggle Theme" style={{ color: 'var(--nav-text)' }}>
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        )}
        <MagneticButton 
          onClick={() => window.location.href="mailto:riswanmp6@gmail.com"}
          className="hidden sm:block text-sm !px-5 !py-2 transition-all duration-300 hover:scale-105 shadow-md"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--card-border)', color: 'var(--page-text)', borderWidth: '1px' }}>
          Contact
        </MagneticButton>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden transition-colors hover:text-blue-400"
        style={{ color: 'var(--nav-text)' }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle mobile menu"
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </motion.nav>

    {/* Mobile Menu Dropdown */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: "-50%" }}
          animate={{ opacity: 1, y: 0, x: "-50%" }}
          exit={{ opacity: 0, y: -20, x: "-50%" }}
          className="fixed top-24 left-1/2 z-40 flex flex-col items-center gap-6 px-6 py-8 rounded-3xl backdrop-blur-xl shadow-2xl w-[90%] max-w-sm md:hidden transition-colors duration-300"
          style={{ backgroundColor: 'var(--page-bg)', borderColor: 'var(--nav-border)' }}
        >
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium transition-colors" style={{ color: activeSection === 'about' ? 'var(--nav-text-hover)' : 'var(--nav-text)' }}>About</a>
          <a href="#work" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium transition-colors" style={{ color: activeSection === 'work' ? 'var(--nav-text-hover)' : 'var(--nav-text)' }}>Work</a>
          <a href="#tools" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium transition-colors" style={{ color: activeSection === 'tools' ? 'var(--nav-text-hover)' : 'var(--nav-text)' }}>Tools</a>
          <button 
            onClick={() => {
              window.location.href="mailto:riswanmp6@gmail.com";
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 px-8 py-3 w-full rounded-full font-medium transition-colors"
            style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)', color: 'var(--page-text)', borderWidth: '1px' }}
          >
            Contact
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};

// ----------------------------------------------------------------------
// 5. Aurora / Mesh Gradient Background
// ----------------------------------------------------------------------
const AuroraBackground = () => {
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

  return (
    <div className="absolute inset-0 overflow-hidden -z-10 flex items-center justify-center transition-colors duration-300" style={{ backgroundColor: 'var(--aurora-bg)' }}>
      {/* Subtle Noise Texture Overlay */}
      <div
        className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Animated Blobs */}
      <motion.div style={{ x: transformX1, y: transformY1 }} className="absolute top-1/4 left-1/4">
        <motion.div
          animate={{ x: ["-20%", "20%", "-20%"], y: ["-10%", "10%", "-10%"], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="w-[50vw] h-[50vw] md:w-[40vw] md:h-[40vw] rounded-full bg-blue-600/30 blur-[100px]"
          style={{ mixBlendMode: 'var(--aurora-blend)' as any, opacity: 'var(--aurora-opacity)' }}
        />
      </motion.div>
      <motion.div style={{ x: transformX2, y: transformY2 }} className="absolute bottom-1/4 right-1/4">
        <motion.div
          animate={{ x: ["20%", "-20%", "20%"], y: ["10%", "-10%", "10%"], scale: [1, 1.3, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="w-[60vw] h-[60vw] md:w-[50vw] md:h-[50vw] rounded-full bg-purple-600/20 blur-[120px]"
          style={{ mixBlendMode: 'var(--aurora-blend)' as any, opacity: 'var(--aurora-opacity)' }}
        />
      </motion.div>
      <motion.div style={{ x: transformX1, y: transformY2 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ x: ["0%", "30%", "0%"], y: ["20%", "-20%", "20%"], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="w-[40vw] h-[40vw] md:w-[30vw] md:h-[30vw] rounded-full bg-teal-500/20 blur-[90px]"
          style={{ mixBlendMode: 'var(--aurora-blend)' as any, opacity: 'var(--aurora-opacity)' }}
        />
      </motion.div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 6. Main Hero Component
// ----------------------------------------------------------------------
export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans">
      <AuroraBackground />

      <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center max-w-5xl mx-auto mt-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
          className="px-4 py-1.5 mb-6 rounded-full border backdrop-blur-md text-sm font-medium shadow-xl transition-colors duration-300"
          style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--nav-border)', color: 'var(--page-text)' }}
        >
          ✨ Available for new opportunities
        </motion.div>

        <TypewriterHeadline text="Network Engineer & Cloud DevOps" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.8 }}
          className="mt-8 mb-12 text-lg md:text-xl max-w-2xl leading-relaxed transition-colors duration-300"
          style={{ color: 'var(--nav-text)' }}
        >
          Results-oriented Network Engineer with hands-on experience in SDN, 5G/O-RAN, 
          and network automation. Specializing in Python, Terraform, and high-performance 
          cloud infrastructures.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 1 }}
          className="flex flex-col sm:flex-row items-center gap-6 w-full sm:w-auto"
        >
          <GlowingButton onClick={() => window.location.href="#work"}>View My Work</GlowingButton>
          <MagneticButton 
            onClick={() => window.location.href="#tools"}
            className="w-full sm:w-auto group transition-all duration-300 hover:scale-105 active:scale-95 border shadow-lg backdrop-blur-md"
            style={{ color: 'var(--page-text)', borderColor: 'var(--card-border)', backgroundColor: 'var(--card-bg)' }}
          >
            Explore Tools{" "}
            <span className="ml-1 transition-transform inline-block group-hover:translate-x-1">
              →
            </span>
          </MagneticButton>
        </motion.div>
      </div>
    </section>
  );
}