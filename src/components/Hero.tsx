import React, { useRef, useEffect, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, type Variants, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

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
      className="relative group rounded-full overflow-hidden p-[2px] cursor-pointer sm:w-auto w-full"
    >
      {/* Animated gradient border */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,#6366f1_360deg)]"
      />
      {/* Extra blurred layer for the intense glow effect */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/2 left-1/2 h-[300%] w-[300%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,#ec4899_360deg)] opacity-50 blur-md"
      />
      <button className="relative z-10 w-full h-full rounded-full bg-slate-950 px-8 py-3 font-medium text-white transition-colors group-hover:bg-slate-900">
        {children}
      </button>
    </div>
  );
};

// ----------------------------------------------------------------------
// 3. Staggered Headline
// ----------------------------------------------------------------------
const StaggeredHeadline = ({ text }: { text: string }) => {
  const words = text.split(" ");
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.2 },
    },
  };
  
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 50, rotateX: -60 },
    show: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: { type: "spring", stiffness: 100, damping: 14 },
    },
  };

  return (
    <motion.h1
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ perspective: "1000px" }}
      className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white flex flex-wrap justify-center gap-x-4 gap-y-2 mt-6"
    >
      {words.map((word, i) => (
        <motion.span
          key={i}
          variants={itemVariants}
          className="inline-block origin-bottom drop-shadow-lg"
        >
          {word}
        </motion.span>
      ))}
    </motion.h1>
  );
};

// ----------------------------------------------------------------------
// 4. Glassmorphism Navigation Bar
// ----------------------------------------------------------------------
export const GlassNavBar = () => {
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
      className="fixed top-6 left-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl w-[90%] max-w-5xl"
    >
      <div className="font-bold text-white tracking-widest text-lg">
        JAZDOT<span className="text-blue-500">.</span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
        <a href="#work" className={`relative transition-colors ${activeSection === "work" ? "text-white" : "hover:text-white"}`}>
          Work
          {activeSection === "work" && (
            <motion.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-blue-500 rounded-full" />
          )}
        </a>
        <a href="#tools" className={`relative transition-colors ${activeSection === "tools" ? "text-white" : "hover:text-white"}`}>
          Tools
          {activeSection === "tools" && (
            <motion.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-blue-500 rounded-full" />
          )}
        </a>
        <a href="#about" className={`relative transition-colors ${activeSection === "about" ? "text-white" : "hover:text-white"}`}>
          About
          {activeSection === "about" && (
            <motion.span layoutId="navIndicator" className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 bg-blue-500 rounded-full" />
          )}
        </a>
      </div>
      <MagneticButton 
        onClick={() => window.location.href="mailto:riswanmp6@gmail.com"}
        className="hidden sm:block text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 !px-5 !py-2">
        Contact
      </MagneticButton>

      {/* Mobile Menu Toggle */}
      <button 
        className="md:hidden text-slate-300 hover:text-white transition-colors"
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
          className="fixed top-24 left-1/2 z-40 flex flex-col items-center gap-6 px-6 py-8 rounded-3xl bg-[#0f172a]/95 border border-white/10 backdrop-blur-xl shadow-2xl w-[90%] max-w-sm md:hidden"
        >
          <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-medium transition-colors ${activeSection === 'about' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>About</a>
          <a href="#work" onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-medium transition-colors ${activeSection === 'work' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Work</a>
          <a href="#tools" onClick={() => setIsMobileMenuOpen(false)} className={`text-lg font-medium transition-colors ${activeSection === 'tools' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>Tools</a>
          <button 
            onClick={() => {
              window.location.href="mailto:riswanmp6@gmail.com";
              setIsMobileMenuOpen(false);
            }}
            className="mt-2 px-8 py-3 w-full rounded-full font-medium bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors"
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
    <div className="absolute inset-0 overflow-hidden bg-slate-950 -z-10 flex items-center justify-center">
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
          className="w-[50vw] h-[50vw] md:w-[40vw] md:h-[40vw] rounded-full bg-blue-600/30 blur-[100px] mix-blend-screen"
        />
      </motion.div>
      <motion.div style={{ x: transformX2, y: transformY2 }} className="absolute bottom-1/4 right-1/4">
        <motion.div
          animate={{ x: ["20%", "-20%", "20%"], y: ["10%", "-10%", "10%"], scale: [1, 1.3, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="w-[60vw] h-[60vw] md:w-[50vw] md:h-[50vw] rounded-full bg-purple-600/20 blur-[120px] mix-blend-screen"
        />
      </motion.div>
      <motion.div style={{ x: transformX1, y: transformY2 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <motion.div
          animate={{ x: ["0%", "30%", "0%"], y: ["20%", "-20%", "20%"], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="w-[40vw] h-[40vw] md:w-[30vw] md:h-[30vw] rounded-full bg-teal-500/20 blur-[90px] mix-blend-screen"
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
          className="px-4 py-1.5 mb-6 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-sm font-medium text-slate-300 shadow-xl"
        >
          ✨ Available for new opportunities
        </motion.div>

        <StaggeredHeadline text="Network Engineer & Cloud DevOps" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.8 }}
          className="mt-8 mb-12 text-lg md:text-xl text-slate-400 max-w-2xl leading-relaxed"
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
            className="text-white hover:text-blue-400 w-full sm:w-auto group"
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