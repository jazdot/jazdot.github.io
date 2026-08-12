import React, { useRef, useEffect, useState } from "react";
import { m, useMotionValue, useSpring, AnimatePresence, useMotionTemplate } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon } from "lucide-react";

// Route preloader helpers for instantaneous page switching
const preloadRoute = (path: string) => {
  if (path === "/about") {
    import("../Portfolio");
  } else if (path === "/tools") {
    import("../pages/Tools");
  } else if (path === "/blog" || path.includes("blog")) {
    const existing = document.querySelector('link[href="https://jazdot.github.io/blog"]');
    if (!existing) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = "https://jazdot.github.io/blog";
      document.head.appendChild(link);
    }
  }
};

// ----------------------------------------------------------------------
// 1. Snappy Magnetic Button
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

  // Fast, responsive spring physics
  const springConfig = { damping: 20, stiffness: 350, mass: 0.1 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    x.set((e.clientX - (left + width / 2)) * 0.2);
    y.set((e.clientY - (top + height / 2)) * 0.2);
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
      whileTap={{ scale: 0.96 }}
      style={{ x: springX, y: springY, ...style }}
      className={`relative px-8 py-3 rounded-full font-medium transition-colors duration-200 cursor-pointer ${className}`}
    >
      {children}
    </m.button>
  );
};

// ----------------------------------------------------------------------
// 2. Glassmorphism Navigation Bar with Preloading & Snappy Springs
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
        initial={{ y: -80, x: "-50%", opacity: 0 }}
        animate={{ y: 0, x: "-50%", opacity: 1 }}
        transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.1 }}
        className="fixed top-6 left-1/2 z-50 flex items-center justify-between px-6 py-3 rounded-full backdrop-blur-xl shadow-lg w-[90%] max-w-5xl bg-white/70 dark:bg-slate-950/70 border border-slate-200/60 dark:border-white/8 gpu-layer"
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
              onMouseEnter={() => preloadRoute(link.path)}
              onFocus={() => preloadRoute(link.path)}
              className={`relative transition-colors duration-150 hover:text-slate-900 dark:hover:text-white cursor-pointer ${
                activeSection === link.key ? "text-slate-900 dark:text-white" : ""
              }`}
            >
              {link.label}
              {activeSection === link.key && (
                <m.span
                  layoutId="navIndicator"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                  className="absolute -bottom-2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 rounded-full bg-slate-900 dark:bg-white"
                />
              )}
            </button>
          ))}
          {/* Blog — external link with prefetching */}
          <a
            href="https://jazdot.github.io/blog"
            onMouseEnter={() => preloadRoute("/blog")}
            onFocus={() => preloadRoute("/blog")}
            className="relative transition-colors duration-150 hover:text-slate-900 dark:hover:text-white text-slate-500 dark:text-slate-400"
          >
            Blog
          </a>
        </div>

        {/* Right side: theme + contact */}
        <div className="flex items-center gap-3">
          {toggleTheme && (
            <button
              onClick={toggleTheme}
              className="text-slate-400 dark:text-slate-500 transition-colors duration-150 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer p-1.5 rounded-full hover:bg-slate-200/50 dark:hover:bg-white/10"
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
          className="md:hidden text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer p-1"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </m.nav>

      {/* Mobile menu with fast spring transition */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <m.div
            initial={{ opacity: 0, y: -12, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -12, x: "-50%" }}
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
            className="fixed top-24 left-1/2 z-40 flex flex-col items-center gap-5 px-6 py-7 rounded-2xl bg-white/95 dark:bg-slate-950/95 border border-slate-200 dark:border-white/8 backdrop-blur-xl shadow-xl w-[88%] max-w-sm md:hidden gpu-layer"
          >
            {navLinks.map((link) => (
              <button
                key={link.key}
                onClick={() => handleNav(link.path)}
                onMouseEnter={() => preloadRoute(link.path)}
                className={`text-base font-medium transition-colors cursor-pointer ${
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
              onMouseEnter={() => preloadRoute("/blog")}
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
              className="mt-1 px-8 py-2.5 w-full rounded-full text-sm font-medium bg-slate-900 dark:bg-white/8 border border-slate-700 dark:border-white/15 text-white hover:bg-slate-800 dark:hover:bg-white/15 transition-colors cursor-pointer"
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
// 3. Aurora Background — GPU-accelerated CSS with lightweight passive parallax
// ----------------------------------------------------------------------
export const AuroraBackground = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    let animationFrameId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        mouseX.set((e.clientX - window.innerWidth / 2) * 0.04);
        mouseY.set((e.clientY - window.innerHeight / 2) * 0.04);
      });
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  const bgPosX = useSpring(mouseX, { stiffness: 200, damping: 30 });
  const bgPosY = useSpring(mouseY, { stiffness: 200, damping: 30 });
  const backgroundPosition = useMotionTemplate`${bgPosX}px ${bgPosY}px`;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[var(--page-bg)] transition-colors duration-250 pointer-events-none">
      {/* Blob 1 — GPU-accelerated CSS keyframe */}
      <div className="absolute top-1/4 left-1/4">
        <div className="w-[32vw] h-[32vw] rounded-full bg-blue-500/8 dark:bg-blue-600/10 blur-[90px] aurora-blob-1 gpu-layer" />
      </div>

      {/* Blob 2 — GPU-accelerated CSS keyframe */}
      <div className="absolute bottom-1/4 right-1/4">
        <div className="w-[36vw] h-[36vw] rounded-full bg-indigo-500/6 dark:bg-indigo-600/8 blur-[100px] aurora-blob-2 gpu-layer" />
      </div>

      {/* Dot pattern overlay with passive parallax */}
      <m.div
        className="absolute inset-0 pointer-events-none bg-dot-pattern gpu-layer"
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
    <div className="w-full max-w-xs mx-auto flex flex-col items-center gap-5 p-7 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-white/8 backdrop-blur-md shadow-sm gpu-layer">
      {/* Photo */}
      <m.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="w-20 h-20 rounded-full overflow-hidden border-2 border-slate-200/60 dark:border-white/10 shadow-md cursor-pointer shrink-0"
      >
        <img src="/pp.jpeg" alt="Muhammed Riswan M. P." className="w-full h-full object-cover" loading="eager" width="80" height="80" />
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
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1"
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
          className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors duration-150 flex items-center gap-1"
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
// 5. Main Hero Component with Snappy Springs
// ----------------------------------------------------------------------
export default function Hero() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-16 lg:py-0 overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center mt-8 lg:mt-0">

        {/* Left column */}
        <div className="lg:col-span-7 flex flex-col items-start">

          {/* Name */}
          <m.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.1]"
          >
            Muhammed Riswan{" "}
            <span className="text-slate-500 dark:text-slate-400">M. P.</span>
          </m.h1>

          {/* Bio */}
          <m.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.12 }}
            className="mt-5 text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg"
          >
            Senior Engineer at{" "}
            <span className="text-slate-700 dark:text-slate-300 font-medium">Tata Elxsi</span>
            {", "}working on 5G protocol integration with OpenAirInterface and Keysight Core. Previously researched autonomous UAV mesh networking at ICFOSS. MTech in Robotics &amp; Automation, CET Trivandrum.
          </m.p>

          {/* Focus Pillars */}
          <m.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.2 }}
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
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 28, delay: 0.18 }}
          className="lg:col-span-5 flex items-center justify-center"
        >
          <IdentityCard />
        </m.div>

      </div>
    </section>
  );
}