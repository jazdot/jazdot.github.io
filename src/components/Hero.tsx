import React, { useRef, useEffect, useState, useCallback } from "react";
import { m, useMotionValue, useSpring, useTransform, type Variants, AnimatePresence, useMotionTemplate } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Sun, Moon, Cpu, RadioTower, Smartphone, Server, Play, Layers } from "lucide-react";

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
const TypewriterTextEffect = ({ 
  text, 
  className = "", 
  showCursor = true,
  delay = 0.1 
}: { 
  text: string; 
  className?: string; 
  showCursor?: boolean;
  delay?: number;
}) => {
  const characters = text.split("");
  
  const containerVariants: Variants = {
    hidden: { opacity: 1 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.01, delayChildren: delay },
    },
  };
  
  const charVariants: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  };

  return (
    <m.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className={className}
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
      {showCursor && (
        <m.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          className="inline-block w-[2px] h-[1em] ml-1 bg-accent rounded"
        />
      )}
    </m.div>
  );
};

// ----------------------------------------------------------------------
// 4. Glassmorphism Navigation Bar
// ----------------------------------------------------------------------
export const GlassNavBar = ({ isDark, toggleTheme, onContactClick }: { isDark?: boolean; toggleTheme?: () => void; onContactClick?: () => void }) => {
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
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">JAZDOT</span><span style={{ color: "var(--accent)" }}>.</span>
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
          onClick={onContactClick}
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
              if (onContactClick) onContactClick();
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

  const transformX1 = useSpring(useTransform(mouseX, [-500, 500], [-80, 80]), { stiffness: 50, damping: 20 });
  const transformY1 = useSpring(useTransform(mouseY, [-500, 500], [-80, 80]), { stiffness: 50, damping: 20 });
  const transformX2 = useSpring(useTransform(mouseX, [-500, 500], [80, -80]), { stiffness: 50, damping: 20 });
  const transformY2 = useSpring(useTransform(mouseY, [-500, 500], [80, -80]), { stiffness: 50, damping: 20 });

  // Subtle Parallax mapping for the dots
  const bgPosX = useSpring(useTransform(mouseX, [-500, 500], [-30, 30]), { stiffness: 50, damping: 20 });
  const bgPosY = useSpring(useTransform(mouseY, [-500, 500], [-30, 30]), { stiffness: 50, damping: 20 });
  const backgroundPosition = useMotionTemplate`${bgPosX}px ${bgPosY}px`;

  // State to smoothly shift the aurora colors on click, strictly keeping to the blue and green spectrum
  const safeHues = [0, 315, 330, 345];
  const [hueIndex, setHueIndex] = useState(0);
  
  useEffect(() => {
    const handleClick = () => setHueIndex(prev => (prev + 1) % safeHues.length);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const hue = safeHues[hueIndex];

  return (
    <div className="fixed inset-0 -z-10 flex items-center justify-center overflow-hidden bg-[var(--page-bg)] transition-colors duration-300" style={{ filter: `hue-rotate(${hue}deg)` }}>

      {/* Animated Blobs */}
      <m.div style={{ x: transformX1, y: transformY1 }} className="absolute top-1/4 left-1/4">
        <m.div
          animate={{ x: ["-20%", "20%", "-20%"], y: ["-10%", "10%", "-10%"], scale: [1, 1.2, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="w-[30vw] h-[30vw] md:w-[25vw] md:h-[25vw] rounded-full bg-blue-500/15 dark:bg-blue-600/15 blur-[100px] mix-blend-multiply dark:mix-blend-color-dodge will-change-transform transform-gpu"
        />
      </m.div>
      <m.div style={{ x: transformX2, y: transformY2 }} className="absolute bottom-1/4 right-1/4">
        <m.div
          animate={{ x: ["20%", "-20%", "20%"], y: ["10%", "-10%", "10%"], scale: [1, 1.3, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          className="w-[40vw] h-[40vw] md:w-[35vw] md:h-[35vw] rounded-full bg-cyan-500/10 dark:bg-cyan-600/10 blur-[120px] mix-blend-multiply dark:mix-blend-color-dodge will-change-transform transform-gpu"
        />
      </m.div>
      <m.div style={{ x: transformX1, y: transformY2 }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <m.div
          animate={{ x: ["0%", "30%", "0%"], y: ["20%", "-20%", "20%"], scale: [1, 1.1, 1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          className="w-[25vw] h-[25vw] md:w-[20vw] md:h-[20vw] rounded-full bg-teal-400/10 dark:bg-teal-500/10 blur-[90px] mix-blend-multiply dark:mix-blend-color-dodge will-change-transform transform-gpu"
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
      <m.div 
        className="absolute inset-0 pointer-events-none bg-dot-pattern z-10"
        style={{
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 30%, transparent 80%)',
          backgroundPosition: backgroundPosition
        }}
      ></m.div>
    </div>
  );
};

// ----------------------------------------------------------------------
// 6. Network Telemetry Console (Right Column Component)
// ----------------------------------------------------------------------
interface NetworkNode {
  id: string;
  label: string;
  ip: string;
  status: 'online' | 'standby' | 'alert';
  latency: string;
  x: number; // percentage width
  y: number; // percentage height
  icon: React.ComponentType<any>;
  details: string;
}

const nodes5G: NetworkNode[] = [
  { id: 'core', label: '5G Core', ip: '10.0.1.5', status: 'online', latency: '1.2ms', x: 50, y: 15, icon: Server, details: 'Keysight Core Emulator' },
  { id: 'cu', label: 'O-RAN CU', ip: '10.0.2.10', status: 'online', latency: '2.5ms', x: 50, y: 45, icon: Cpu, details: 'OpenAirInterface CU' },
  { id: 'du', label: 'O-RAN DU', ip: '10.0.3.15', status: 'online', latency: '4.8ms', x: 22, y: 68, icon: Layers, details: 'F1 Interface Link' },
  { id: 'ru', label: 'gNodeB RU', ip: '10.0.3.20', status: 'online', latency: '3.1ms', x: 78, y: 68, icon: RadioTower, details: 'Keysight RU Signal' },
  { id: 'ue', label: 'User Device', ip: '192.168.1.100', status: 'online', latency: '8.4ms', x: 50, y: 88, icon: Smartphone, details: 'Edge Client Device' },
];

const nodesUAV: NetworkNode[] = [
  { id: 'ground', label: 'Ground Station', ip: '10.10.1.1', status: 'online', latency: '1.5ms', x: 50, y: 15, icon: Server, details: 'Base Telemetry Control' },
  { id: 'uav1', label: 'UAV-01 (Leader)', ip: '10.10.2.1', status: 'online', latency: '3.8ms', x: 50, y: 45, icon: Cpu, details: 'Decentralized Router Node' },
  { id: 'uav2', label: 'UAV-02', ip: '10.10.2.2', status: 'online', latency: '6.4ms', x: 22, y: 68, icon: RadioTower, details: 'Mesh Relay Node' },
  { id: 'uav3', label: 'UAV-03', ip: '10.10.2.3', status: 'online', latency: '5.2ms', x: 78, y: 68, icon: RadioTower, details: 'Mesh Relay Node' },
  { id: 'edge', label: 'Mobile Edge', ip: '192.168.10.5', status: 'online', latency: '9.1ms', x: 50, y: 88, icon: Smartphone, details: 'Search & Rescue UAV' },
];

const links5G = [
  { from: 'core', to: 'cu', dashed: false },
  { from: 'cu', to: 'du', dashed: false },
  { from: 'cu', to: 'ru', dashed: false },
  { from: 'du', to: 'ue', dashed: true },
  { from: 'ru', to: 'ue', dashed: true },
];

const linksUAV = [
  { from: 'ground', to: 'uav1', dashed: false },
  { from: 'uav1', to: 'uav2', dashed: false },
  { from: 'uav1', to: 'uav3', dashed: false },
  { from: 'uav2', to: 'edge', dashed: true },
  { from: 'uav3', to: 'edge', dashed: true },
  { from: 'uav2', to: 'uav3', dashed: true }, // Mesh bridge
];

export function NetworkTelemetryConsole() {
  const [activeTab, setActiveTab] = useState<'5g' | 'uav'>('5g');
  const [logs, setLogs] = useState<string[]>([]);
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [pingPath, setPingPath] = useState<{ x: number; y: number }[] | null>(null);
  const [sweepingNodeId, setSweepingNodeId] = useState<string | null>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    setLogs(prev => {
      const next = [...prev, `[${time}] ${msg}`];
      if (next.length > 50) next.shift(); // Keep logs lean
      return next;
    });
  }, []);

  // Initialize startup logs
  useEffect(() => {
    setLogs([]);
    const initLogs = activeTab === '5g' 
      ? [
          'INIT: Initializing 5G/O-RAN network topology...',
          'SCTP: Resolving N2/N3 endpoint 10.0.1.5:38412...',
          'STATUS: gNodeB CU/DU stack is ONLINE.',
          'NMS: Telemetry tracking active (OSPF/BGP up).',
        ]
      : [
          'INIT: UAV Swarm Mesh network routing loaded...',
          'ROUTING: Loading OLSR mesh network daemon...',
          'MESH: UAV-01 designated swarm leader node.',
          'STATUS: Decentralized ground station link secured.',
        ];
    
    initLogs.forEach((l, i) => {
      setTimeout(() => {
        addLog(l);
      }, i * 200);
    });
  }, [activeTab, addLog]);

  // Periodic simulated log feed
  useEffect(() => {
    const idleLogs = activeTab === '5g' 
      ? [
          'AMF: Periodic Registration Update from UE-100.',
          'SDN: Flow statistics updated. Path 1: 184.2 Mbps.',
          'F1: DU/CU message latency optimized (-2.4ms).',
          'MLOps: Edge model update dispatched to gNodeB-RU.',
          'NMS: Server health check passed. CPU 14%, RAM 38%.',
        ]
      : [
          'MESH: Routing metric improved (UAV-02 -> UAV-03).',
          'UAV-02: Battery level 82% (nominal), RSSI -64dBm.',
          'TELEMETRY: GPS coordinates synced across swarm.',
          'MLOps: UAV edge node pipeline validated successfully.',
          'MESH: Dynamic topology change recalculated (3.1ms).',
        ];

    const interval = setInterval(() => {
      if (sweepingNodeId) return; // Pause idle logs during sweep
      const randomMsg = idleLogs[Math.floor(Math.random() * idleLogs.length)];
      addLog(randomMsg);
    }, 7000);

    return () => clearInterval(interval);
  }, [activeTab, sweepingNodeId, addLog]);

  // Auto-scroll terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleNodeClick = (node: NetworkNode) => {
    if (pingPath || sweepingNodeId) return;

    addLog(`USER: ping -c 2 ${node.ip}`);

    const nodesList = activeTab === '5g' ? nodes5G : nodesUAV;
    const sourceNode = nodesList[0];
    const path: { x: number; y: number }[] = [];

    // Path tracing: Source -> CU/UAV1 -> Target Node
    path.push({ x: sourceNode.x, y: sourceNode.y });

    if (node.id !== sourceNode.id) {
      const transitNode = nodesList[1];
      path.push({ x: transitNode.x, y: transitNode.y });
      if (node.id !== transitNode.id) {
        path.push({ x: node.x, y: node.y });
      }
    }

    setPingPath(path);

    setTimeout(() => {
      addLog(`REPLY: 64 bytes from ${node.ip}: seq=1 rtt=${node.latency}`);
    }, 400);

    setTimeout(() => {
      const adjustedRtt = (parseFloat(node.latency) - 0.3).toFixed(1) + 'ms';
      addLog(`REPLY: 64 bytes from ${node.ip}: seq=2 rtt=${adjustedRtt}`);
      addLog(`PING: 2 packets transmitted, 2 received, 0% packet loss.`);
    }, 850);
  };

  const runDiagnostics = () => {
    if (pingPath || sweepingNodeId) return;

    const currentNodes = activeTab === '5g' ? nodes5G : nodesUAV;
    addLog(`DIAG: Initiating network diagnostic sweep...`);

    let delay = 100;
    currentNodes.forEach((node) => {
      setTimeout(() => {
        setSweepingNodeId(node.id);
        addLog(`CHECK: Verifying node: ${node.label} [${node.ip}]...`);
      }, delay);

      delay += 600;

      setTimeout(() => {
        addLog(`STATUS: ${node.label} is online. Response time: ${node.latency}`);
      }, delay);

      delay += 300;
    });

    setTimeout(() => {
      setSweepingNodeId(null);
      addLog(`DIAG: Network validation completed. All nodes operational (100% up).`);
    }, delay + 100);
  };

  const currentNodes = activeTab === '5g' ? nodes5G : nodesUAV;
  const currentLinks = activeTab === '5g' ? links5G : linksUAV;

  return (
    <div className="w-full relative flex flex-col min-h-[480px] bg-slate-900/50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-white/10 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden text-slate-100">
      
      {/* Console Tab Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
          <span className="font-mono text-xs text-slate-400 ml-2 select-none">system_monitor.sh</span>
        </div>
        
        {/* Tab Buttons */}
        <div className="flex gap-2">
          <button 
            onClick={() => { if (!pingPath && !sweepingNodeId) setActiveTab('5g'); }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${activeTab === '5g' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            5G O-RAN
          </button>
          <button 
            onClick={() => { if (!pingPath && !sweepingNodeId) setActiveTab('uav'); }}
            className={`px-3 py-1 text-xs font-mono font-bold rounded-md transition-colors ${activeTab === 'uav' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
          >
            UAV Swarm
          </button>
        </div>
      </div>

      {/* Network Node Graph Canvas */}
      <div className="flex-1 relative min-h-[280px] p-6 flex items-center justify-center select-none overflow-hidden bg-slate-950/20">
        
        {/* SVG Links */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <defs>
            <linearGradient id="link-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.1" />
            </linearGradient>
          </defs>
          
          {currentLinks.map((link, idx) => {
            const fromNode = currentNodes.find(n => n.id === link.from);
            const toNode = currentNodes.find(n => n.id === link.to);
            if (!fromNode || !toNode) return null;
            
            const isHighlighted = activeNode === fromNode.id || activeNode === toNode.id;
            return (
              <line
                key={idx}
                x1={`${fromNode.x}%`}
                y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`}
                y2={`${toNode.y}%`}
                strokeWidth={isHighlighted ? "2.5" : "1.5"}
                style={{
                  stroke: isHighlighted 
                    ? (activeTab === '5g' ? '#3b82f6' : '#a855f7') 
                    : 'rgba(148, 163, 184, 0.15)',
                  strokeDasharray: link.dashed ? '5, 5' : 'none',
                  transition: 'stroke 0.3s ease, stroke-width 0.3s ease'
                }}
              />
            );
          })}
        </svg>

        {/* Animated Packet Pulse */}
        {pingPath && (
          <m.div
            className={`absolute w-3.5 h-3.5 rounded-full blur-[1px] pointer-events-none z-10 ${activeTab === '5g' ? 'bg-blue-400 shadow-[0_0_10px_#3b82f6]' : 'bg-purple-400 shadow-[0_0_10px_#a855f7]'}`}
            style={{ x: '-50%', y: '-50%' }}
            animate={{
              left: pingPath.map(p => `${p.x}%`),
              top: pingPath.map(p => `${p.y}%`),
            }}
            transition={{
              duration: pingPath.length * 0.35,
              ease: "easeInOut",
            }}
            onAnimationComplete={() => setPingPath(null)}
          />
        )}

        {/* Interactive Nodes */}
        {currentNodes.map((node) => {
          const NodeIcon = node.icon;
          const isSwept = sweepingNodeId === node.id;
          const isHovered = activeNode === node.id;
          
          return (
            <div
              key={node.id}
              className="absolute group z-10"
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              {/* Hover Tooltip Card */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-44 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3 shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 text-left font-sans">
                <div className="text-xs font-bold text-slate-100">{node.label}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1">{node.ip}</div>
                <div className="text-[10px] text-slate-400 font-mono">RTT: {node.latency}</div>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[9px] font-semibold text-emerald-400 uppercase tracking-wide">Operational</span>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 italic border-t border-slate-800 pt-1">{node.details}</div>
              </div>

              {/* Node Outer Ring & Button */}
              <button
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setActiveNode(node.id)}
                onMouseLeave={() => setActiveNode(null)}
                aria-label={`Inspect ${node.label}`}
                className={`relative flex items-center justify-center w-11 h-11 rounded-full border transition-all duration-300 bg-slate-900 border-slate-800 ${isHovered ? 'scale-110 shadow-lg' : ''} ${
                  isSwept 
                    ? 'border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                    : isHovered 
                      ? (activeTab === '5g' ? 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.3)]' : 'border-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.3)]') 
                      : ''
                }`}
              >
                {/* Ping Pulse */}
                {isSwept && (
                  <span className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></span>
                )}
                
                <NodeIcon 
                  size={18} 
                  className={`transition-colors duration-300 ${
                    isSwept 
                      ? 'text-emerald-400' 
                      : isHovered 
                        ? (activeTab === '5g' ? 'text-blue-400' : 'text-purple-400') 
                        : 'text-slate-400'
                  }`} 
                />
              </button>

              {/* Minimal text label */}
              <span className="absolute top-[115%] left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold font-mono tracking-wider text-slate-400/80 group-hover:text-slate-200 transition-colors pointer-events-none">
                {node.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Console Logs Terminal Footer */}
      <div className="bg-slate-950/90 border-t border-slate-900 p-4 font-mono text-[11px] leading-relaxed flex flex-col justify-between h-36">
        <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800 pr-2">
          {logs.map((log, i) => {
            let textColor = 'text-slate-300';
            if (log.includes('USER:')) textColor = 'text-amber-400';
            else if (log.includes('REPLY:')) textColor = 'text-sky-400';
            else if (log.includes('STATUS:') || log.includes('INIT:')) textColor = 'text-emerald-400';
            else if (log.includes('CHECK:')) textColor = 'text-purple-400/80';
            else if (log.includes('DIAG:')) textColor = 'text-purple-400 font-bold';

            return (
              <div key={i} className={`${textColor} border-l-2 border-transparent pl-1.5`}>
                {log}
              </div>
            );
          })}
          <div ref={logsEndRef} />
        </div>

        {/* Console Action Bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-900/60 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Telemetry Feed: Sync OK
          </span>
          <button 
            onClick={runDiagnostics}
            disabled={!!pingPath || !!sweepingNodeId}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800/80 hover:border-slate-700 text-slate-300 active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none font-bold"
          >
            <Play size={10} /> Run Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// 7. Main Hero Component
// ----------------------------------------------------------------------
const SHOW_OPPORTUNITIES_BADGE = true;

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center pt-24 pb-12 lg:py-0 overflow-hidden font-sans">
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center mt-12 md:mt-16 lg:mt-8">
        
        {/* Left Column: Headline and Profile */}
        <div className="lg:col-span-7 flex flex-col text-left items-start">
          {SHOW_OPPORTUNITIES_BADGE && (
            <m.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -2, scale: 1.03, transition: { type: "spring", stiffness: 400, damping: 10 } }}
              transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full border backdrop-blur-md text-xs font-semibold shadow-lg bg-white/40 dark:bg-white/5 border-black/10 dark:border-white/10 text-slate-900 dark:text-white cursor-default select-none"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Available for new opportunities</span>
            </m.div>
          )}

          <div className="font-mono text-sm md:text-base font-bold text-slate-500 dark:text-slate-400 tracking-wider">
            <TypewriterTextEffect text="~/muhammed-riswan-mp" showCursor={true} delay={0.3} />
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mt-4 text-slate-900 dark:text-white leading-[1.1]">
            Designing Resilient <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Networks</span>.
            <br />
            Automating <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 dark:from-purple-400 dark:to-pink-400">Edge Systems</span>.
          </h1>

          <p className="mt-6 text-base md:text-lg text-slate-700 dark:text-slate-300 leading-relaxed max-w-xl">
            Specializing in 5G/O-RAN integration, autonomous UAV mesh networking, and automated cloud infrastructures. I bridge the gap between telecom protocols and scalable DevOps pipelines using Python, Terraform, and Kubernetes.
          </p>

          {/* CTAs */}
          <m.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mt-8 z-10"
          >
            <div className="w-full sm:w-auto" onClick={() => navigate('/about')}>
              <GlowingButton>View Profile</GlowingButton>
            </div>
            <MagneticButton 
              className="w-full sm:w-auto group text-slate-900 dark:text-white hover:text-blue-500 dark:hover:text-blue-400 border border-slate-200 dark:border-white/10 bg-white/20 dark:bg-white/5 backdrop-blur-sm shadow-sm"
              onClick={() => navigate('/tools')}
            >
              Explore Tools{" "}<span className="ml-1 transition-transform inline-block group-hover:translate-x-1">→</span>
            </MagneticButton>
          </m.div>

          {/* Impact Stats Grid */}
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="grid grid-cols-3 gap-3 md:gap-4 mt-12 pt-8 border-t border-slate-200/50 dark:border-white/10 max-w-xl w-full"
          >
            <div className="flex flex-col p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 backdrop-blur-sm shadow-sm">
              <span className="text-xl md:text-2xl font-extrabold text-blue-500 dark:text-blue-400 font-mono">99.9%</span>
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-1">O-RAN Adherence</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 backdrop-blur-sm shadow-sm">
              <span className="text-xl md:text-2xl font-extrabold text-purple-500 dark:text-purple-400 font-mono">-15ms</span>
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-1">Routing Latency</span>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-white/30 dark:bg-white/5 border border-slate-200/40 dark:border-white/5 backdrop-blur-sm shadow-sm">
              <span className="text-xl md:text-2xl font-extrabold text-pink-500 dark:text-pink-400 font-mono">-40%</span>
              <span className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase mt-1">Config Errors</span>
            </div>
          </m.div>
        </div>

        {/* Right Column: Interactive Network Telemetry Widget */}
        <m.div 
          initial={{ opacity: 0, x: 50, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.5 }}
          className="lg:col-span-5 w-full flex items-center justify-center z-10"
        >
          <NetworkTelemetryConsole />
        </m.div>

      </div>
    </section>
  );
}