import React, { useRef, useEffect, useState } from "react";
import { m, useMotionValue, useSpring, useTransform, AnimatePresence, useMotionTemplate } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";

// ----------------------------------------------------------------------
// 1. Magnetic Button (Contact in Navbar)
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

  const springConfig = { damping: 15, stiffness: 150, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - (left + width / 2)) * 0.25);
    y.set((e.clientY - (top + height / 2)) * 0.25);
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
// 2. Glassmorphism Navigation Bar
// ----------------------------------------------------------------------
export const GlassNavBar = ({
  isDark,
  toggleTheme,
  onContactClick,
}: {
  isDark?: boolean;
  toggleTheme?: () => void;
  onContactClick?: () => void;
}) => {
  const [activeSection, setActiveSection] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/tools") setActiveSection("tools");
    else if (location.pathname === "/about") setActiveSection("profile");
    else setActiveSection("home");
  }, [location]);

  const handleNav = (path: string) => {
    setIsMobileMenuOpen(false);
    if (location.pathname !== path) navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { label: "Home", path: "/", key: "home" },
    { label: "Profile", path: "/about", key: "profile" },
    { label: "Tools", path: "/tools", key: "tools" },
  ];

  return (
    <>
      <m.nav
        initial={{ y: -100, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.4 }}
        className="fixed top-6 left-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-xl shadow-lg w-[90%] max-w-5xl bg-white/70 dark:bg-slate-950/70 border border-slate-200/60 dark:border-white/8"
      >
        {/* Logo */}
        <div
          className="font-bold tracking-widest text-lg text-slate-900 dark:text-white cursor-pointer select-none"
          onClick={() => handleNav("/")}
        >
          JAZDOT<span className="text-slate-400 dark:text-slate-500">.</span>
        </div>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500 dark:text-slate-400">
          {navLinks.map((link) => (
            <button
              key={link.key}
              onClick={() => handleNav(link.path)}
              className={`relative transition-colors hover:text-slate-900 dark:hover:text-white ${
                activeSection === link.key ? "text-slate-900 dark:text-white" : ""
              }`}
            >
              {link.label}
              {activeSection === link.key && (
                <m.span
                  layoutId="navIndicator"
                  className="absolute -bottom-2 left-1/2 w-1 h-1 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-white"
                />
              )}
            </button>
          ))}
          {/* Blog — external link */}
          <a
            href="https://jazdot.github.io/blog"
            className="relative transition-colors hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400"
          >
            Blog
          </a>
        </div>

        {/* Right side: theme + contact */}
        <div className="flex items-center gap-3">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="text-slate-400 dark:text-slate-500 transition-colors hover:text-slate-700 dark:hover:text-slate-200"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
          <MagneticButton
            onClick={onContactClick}
            className="hidden sm:block text-sm !px-5 !py-2 bg-slate-900 dark:bg-white/8 border border-slate-700 dark:border-white/15 text-white hover:bg-slate-800 dark:hover:bg-white/15"
          >
            Contact
          </MagneticButton>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </m.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -16, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -16, x: "-50%" }}
            className="fixed top-24 left-1/2 z-40 flex flex-col items-center gap-5 px-6 py-7 rounded-2xl bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-white/8 backdrop-blur-xl shadow-xl w-[88%] max-w-sm md:hidden"
          >
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => handleNav(link.path)}
                className={`text-base font-medium transition-colors ${
                  activeSection === link.key
                    ? "text-slate-900 dark:text-white"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {link.label}
              </button>
            ))}
            <a
              href="https://jazdot.github.io/blog"
              className="text-base font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Blog
            </a>
            <button
              onClick={() => {
                if (onContactClick) onContactClick();
                setIsMobileMenuOpen(false);
              }}
              className="mt-1 px-8 py-2.5 w-full rounded-full text-sm font-medium bg-slate-900 dark:bg-white/8 border border-slate-700 dark:border-white/15 text-white hover:bg-slate-800 dark:hover:bg-white/15 transition-colors"
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
// 3. Aurora Background — subtle, lighter blobs
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

  const tx1 = useSpring(useTransform(mouseX, [-500, 500], [-60, 60]), { stiffness: 50, damping: 20 });
  const ty1 = useSpring(useTransform(mouseY, [-500, 500], [-60, 60]), { stiffness: 50, damping: 20 });
  const tx2 = useSpring(useTransform(mouseX, [-500, 500], [60, -60]), { stiffness: 50, damping: 20 });
  const ty2 = useSpring(useTransform(mouseY, [-500, 500], [60, -60]), { stiffness: 50, damping: 20 });

  const bgPosX = useSpring(useTransform(mouseX, [-500, 500], [-20, 20]), { stiffness: 50, damping: 20 });
  const bgPosY = useSpring(useTransform(mouseY, [-500, 500], [-20, 20]), { stiffness: 50, damping: 20 });
  const backgroundPosition = useMotionTemplate`${bgPosX}px ${bgPosY}px`;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--page-bg)] transition-colors duration-300">
      {/* Blob 1 — top-left, very faint blue */}
      <m.div style={{ x: tx1, y: ty1 }} className="absolute top-1/4 left-1/4">
        <m.div
          animate={{ x: ["-15%", "15%", "-15%"], y: ["-8%", "8%", "-8%"], scale: [1, 1.15, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="w-[28vw] h-[28vw] rounded-full bg-blue-500/8 dark:bg-blue-600/10 blur-[120px] will-change-transform transform-gpu"
        />
      </m.div>

      {/* Blob 2 — bottom-right, faint indigo */}
      <m.div style={{ x: tx2, y: ty2 }} className="absolute bottom-1/4 right-1/4">
        <m.div
          animate={{ x: ["15%", "-15%", "15%"], y: ["8%", "-8%", "8%"], scale: [1, 1.2, 1] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
          className="w-[32vw] h-[32vw] rounded-full bg-indigo-500/6 dark:bg-indigo-600/8 blur-[140px] will-change-transform transform-gpu"
        />
      </m.div>

      {/* Dot pattern overlay */}
      <m.div
        className="absolute inset-0 pointer-events-none bg-dot-pattern"
        style={{
          maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 20%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.4) 20%, transparent 75%)",
          backgroundPosition,
        }}
      />
    </div>
  );
};

// ----------------------------------------------------------------------
// 4. Minimal Identity Card (right column)
// ----------------------------------------------------------------------
function IdentityCard() {
  return (
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-5 p-7 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/8 backdrop-blur-md shadow-sm">
      {/* Photo */}
      <m.div
        whileHover={{ scale: 1.04 }}
        transition={{ type: "spring", stiffness: 300, damping: 18 }}
        className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200/60 dark:border-white/10 shadow-md cursor-pointer shrink-0"
      >
        <img src="/pp.jpeg" alt="Muhammed Riswan M. P." className="w-full h-full object-cover" loading="eager" />
      </m.div>

      {/* Name + role */}
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">Muhammed Riswan M. P.</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Network Engineer · Cloud DevOps</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tata Elxsi · Bengaluru</p>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-slate-200/40 dark:border-white/6" />

      {/* Links */}
      <div className="flex items-center gap-6 text-xs font-medium">
        <a
          href="https://linkedin.com/in/muhammedriswanmp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
        >
          LinkedIn
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8L8 2M8 2H4M8 2V6" />
          </svg>
        </a>
        <a
          href="https://github.com/jazdot"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors flex items-center gap-1"
        >
          GitHub
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 8L8 2M8 2H4M8 2V6" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 5. Main Hero Component
// ----------------------------------------------------------------------
export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-16 lg:py-0 overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mt-8 lg:mt-0">

        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col items-start">

          {/* Name */}
          <m.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
          >
            Muhammed Riswan{" "}
            <span className="text-slate-500 dark:text-slate-400">M. P.</span>
          </m.h1>

          {/* Bio */}
          <m.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.28 }}
            className="mt-5 text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg"
          >
            Senior Engineer at{" "}
            <span className="text-slate-700 dark:text-slate-300 font-medium">Tata Elxsi</span>
            {", "}working on 5G protocol integration with OpenAirInterface and Keysight Core. Previously researched autonomous UAV mesh networking at ICFOSS. MTech in Robotics &amp; Automation, CET Trivandrum.
          </m.p>

          {/* Focus Pillars */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-slate-200/60 dark:border-white/8 max-w-lg w-full"
          >
            {[
              { title: "5G & O-RAN", desc: "Protocol Stack Integration" },
              { title: "Cloud & DevOps", desc: "Automation & Infrastructure" },
              { title: "UAV Swarms", desc: "Mesh Network Research" },
            ].map((item) => (
              <div key={item.title} className="flex flex-col">
                <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                  {item.title}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                  {item.desc}
                </span>
              </div>
            ))}
          </m.div>
        </div>

        {/* Right column — minimal identity card */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="lg:col-span-5 flex items-center justify-center"
        >
          <IdentityCard />
        </m.div>

      </div>
    </section>
  );
}