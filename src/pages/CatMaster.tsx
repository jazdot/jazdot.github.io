import React, { useState, useEffect, useRef, useMemo, Fragment } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, PenTool, Bot, Book, LogIn, LogOut, BrainCircuit, Trophy, Loader2, X, PlayCircle, Timer, Sun, Moon, Monitor, Volume2, VolumeX, Maximize, Minimize, Calculator, Menu, RadioTower } from 'lucide-react';
import { useCatStore } from './catStore';
import { paperLoaders } from '../data/cat_db';
import { auth, db, googleProvider, signInWithPopup, signOut, onAuthStateChanged, doc, setDoc, getDoc, collection, addDoc, updateDoc, onSnapshot } from './firebase';

import AnalyticsDashboard from '../components/cat-maester/AnalyticsDashboard';
import AdaptiveEngine from '../components/cat-maester/AdaptiveEngine';
import PracticeArena from '../components/cat-maester/PracticeArena';
import MockExamCenter from '../components/cat-maester/MockExamCenter';
import StudyHub from '../components/cat-maester/StudyHub';


// --- IndexedDB Helpers ---
const DB_NAME = 'CatMaesterDB';
const STORE_NAME = 'mockTests';
const FORMULA_STORE = 'formulas';
const GENERATED_Q_STORE = 'generatedQuestions';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 3);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FORMULA_STORE)) {
        db.createObjectStore(FORMULA_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(GENERATED_Q_STORE)) {
        db.createObjectStore(GENERATED_Q_STORE, { keyPath: ['subject', 'batchId'] });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const saveMockTest = async (test: any) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(test);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getMockTests = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};





const saveFormula = async (formula: any) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMULA_STORE, 'readwrite');
    tx.objectStore(FORMULA_STORE).put(formula);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
};

const getFormulas = async (): Promise<any[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMULA_STORE, 'readonly');
    const req = tx.objectStore(FORMULA_STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const deleteFormula = async (id: string) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FORMULA_STORE, 'readwrite');
    const req = tx.objectStore(FORMULA_STORE).delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};

// --- Real AI Generation via Gemini ---



const renderLatex = (text: string, highlightText?: string | null) => {
  if (!text) return '';
  
  let result = '';
  const processTextPart = (str: string) => {
    let textPart = str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Basic Markdown
    textPart = textPart.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-slate-900 dark:text-white">$1</strong>');
    textPart = textPart.replace(/\*(.*?)\*/g, '<em class="italic opacity-90">$1</em>');
    
    // Unwrapped Math symbols fallback (fixes missing symbols outside $ tags)
    textPart = textPart.replace(/\\sqrt\s*{([^}]+)}/g, '√$1');
    textPart = textPart.replace(/\\sqrt\s*(\d+)/g, '√$1');
    textPart = textPart.replace(/\\frac\s*{([^}]+)}\s*{([^}]+)}/g, '($1/$2)');
    textPart = textPart.replace(/\\pi/gi, 'π');
    textPart = textPart.replace(/\\alpha/gi, 'α');
    textPart = textPart.replace(/\\beta/gi, 'β');
    textPart = textPart.replace(/\\theta/gi, 'θ');
    textPart = textPart.replace(/\\Delta/g, 'Δ');
    textPart = textPart.replace(/\\times/gi, '×');
    textPart = textPart.replace(/\\div/gi, '÷');
    textPart = textPart.replace(/\\pm/gi, '±');
    textPart = textPart.replace(/\\sum/gi, '∑');
    textPart = textPart.replace(/\\infty/gi, '∞');
    textPart = textPart.replace(/\\approx/gi, '≈');
    textPart = textPart.replace(/\\cdot/gi, '·');
    textPart = textPart.replace(/\\circ/gi, '°');
    textPart = textPart.replace(/\\ge/g, '≥');
    textPart = textPart.replace(/\\le/g, '≤');
    textPart = textPart.replace(/\\neq/g, '≠');
    textPart = textPart.replace(/\^2/g, '²');
    textPart = textPart.replace(/\^3/g, '³');
    
    textPart = textPart.replace(/=>/g, '<strong class="text-[hsl(var(--accent))] mx-1">⇒</strong>');

    // Highlight "Correct Option" or "Answer" statements
    textPart = textPart.replace(/(The correct option is [A-D]\.?|(?:Therefore|Hence),? option [A-D] is the correct answer\.?|Option [A-D] is the correct answer\.?|(?:Therefore|Hence),? (?:[A-D]|\d+(?:\.\d+)?) is the correct answer\.?)/gi, (match) => {
      return `<br/><br/><span class="inline-block px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg font-bold shadow-sm">${match}</span>`;
    });

    // Elegant formatting for logic/math explanations (breaks down walls of text automatically)
    textPart = textPart.replace(/(^|\.\s+)(Given|Now|Also|Therefore|Hence|Thus|Step \d+:?|Case \d+:?),?\s+/gi, (match, p1, p2) => {
      const prefix = p1.includes('.') ? '.<br/><br/>' : ''; 
      const hasComma = match.includes(',');
      const capP2 = p2.charAt(0).toUpperCase() + p2.slice(1);
      return `${prefix}<strong class="text-[hsl(var(--accent))] opacity-90">${capP2}${hasComma ? ',' : ''}</strong> `;
    });

    textPart = textPart.replace(/\n/g, '<br/>');
    return textPart;
  };

  if (!(window as any).katex) {
    result = processTextPart(text);
  } else {
    const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
    result = parts.map(part => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        try { return (window as any).katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }); } catch(e) { return part; }
      } else if (part.startsWith('$') && part.endsWith('$')) {
        try { return (window as any).katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false }); } catch(e) { return part; }
      }
      return processTextPart(part);
    }).join('');
  }

  if (highlightText && highlightText.trim() !== '') {
    const escapedHighlight = highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const htmlEscapedHighlight = escapedHighlight.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const regex = new RegExp(`(${htmlEscapedHighlight})(?![^<]*>)`, 'gi');
    result = result.replace(regex, '<mark class="bg-yellow-300 dark:bg-yellow-500/40 text-inherit rounded px-1 shadow-sm transition-all duration-300">$1</mark>');
  }

  return result;
};

// --- Pinch Zoom Image Component ---
const PinchZoomImage = ({ src, alt }: { src: string, alt: string }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const startDist = useRef<number | null>(null);
  const startScale = useRef<number>(1);
  const lastPan = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      startDist.current = dist;
      startScale.current = scale;
      lastPan.current = null;
    } else if (e.touches.length === 1 && scale > 1) {
      e.stopPropagation();
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && startDist.current !== null) {
      e.stopPropagation();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.max(1, Math.min(startScale.current * (dist / startDist.current), 5));
      setScale(newScale);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    } else if (e.touches.length === 1 && scale > 1 && lastPan.current) {
      e.stopPropagation();
      const deltaX = e.touches[0].clientX - lastPan.current.x;
      const deltaY = e.touches[0].clientY - lastPan.current.y;
      setPosition(prev => ({ x: prev.x + deltaX / scale, y: prev.y + deltaY / scale }));
      lastPan.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchEnd = () => {
    startDist.current = null;
    lastPan.current = null;
    if (scale <= 1) {
        setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div className="relative w-full flex justify-center my-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50" style={{ touchAction: scale > 1 ? 'none' : 'pan-x pan-y', overflow: 'hidden' }}>
      <img 
        src={src} 
        alt={alt} 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={() => { setScale(scale > 1 ? 1 : 2); setPosition({ x: 0, y: 0 }); }}
        style={{ 
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`, 
          transition: startDist.current || lastPan.current ? 'none' : 'transform 0.2s ease-out',
          transformOrigin: 'center'
        }}
        className="max-w-full object-contain cursor-zoom-in"
      />
      {scale > 1 && (
        <button 
          onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); }}
          className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-10"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

// --- Render Context Helper ---
const renderTable = (lines: string[], key: number, highlightText?: string | null) => {
  let isHeader = true;
  return (
    <div key={`tbl_${key}`} className="overflow-x-auto my-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm w-full">
      <table className="w-full text-sm text-left border-collapse bg-white dark:bg-slate-900">
        <tbody>
          {lines.map((line, idx) => {
            // Check if it's the markdown separator row (e.g. |---|---|)
            if (line.match(/^\|[\s\-:|]+\|$/)) {
              isHeader = false;
              return null;
            }
            // Extract cell content, slicing off the start and end pipes
            const cells = line.split('|').slice(1, -1);
            return (
              <tr key={idx} className="border-b last:border-b-0 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                {cells.map((cell, cIdx) => (
                  isHeader ? (
                    <th key={cIdx} className="border-r last:border-r-0 border-slate-200 dark:border-slate-700 px-4 py-3 bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      <span dangerouslySetInnerHTML={{ __html: renderLatex(cell.trim(), highlightText) }} />
                    </th>
                  ) : (
                    <td key={cIdx} className="border-r last:border-r-0 border-slate-200 dark:border-slate-700 px-4 py-3 text-slate-600 dark:text-slate-400 align-top">
                      <span dangerouslySetInnerHTML={{ __html: renderLatex(cell.trim(), highlightText) }} />
                    </td>
                  )
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

const renderContextWithImages = (text: string, highlightText?: string | null) => {
  if (!text) return null;
  const parts = text.split(/(!\[.*?\]\(.*?\))/g);
  return parts.map((part, i) => {
    const imgMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
    if (imgMatch) {
      return <PinchZoomImage key={`img_${i}`} alt={imgMatch[1]} src={imgMatch[2]} />;
    }
    
    const lines = part.split('\n');
    const blocks: React.ReactNode[] = [];
    let currentText = '';
    let tableLines: string[] = [];
    let inTable = false;

    const flushText = () => {
      if (currentText) {
        blocks.push(<span key={`txt_${blocks.length}`} dangerouslySetInnerHTML={{ __html: renderLatex(currentText, highlightText) }} />);
        currentText = '';
      }
    };

    for (let j = 0; j < lines.length; j++) {
      const line = lines[j].trim();
      if (line.startsWith('|') && line.endsWith('|')) {
        if (!inTable) {
          flushText();
          inTable = true;
        }
        tableLines.push(line);
      } else {
        if (inTable) {
          blocks.push(renderTable(tableLines, blocks.length, highlightText));
          tableLines = [];
          inTable = false;
        }
        currentText += lines[j] + (j === lines.length - 1 ? '' : '\n');
      }
    }
    
    if (inTable) {
      blocks.push(renderTable(tableLines, blocks.length, highlightText));
    }
    flushText();

    return <Fragment key={`frag_${i}`}>{blocks}</Fragment>;
  });
};


// -------------------------

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[7000] flex items-center justify-center">
      <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-slate-500 mb-6 text-sm">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="px-4 py-2 flex-1 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">{cancelText}</button>
          <button onClick={onConfirm} className={`px-4 py-2 flex-1 font-bold text-white transition-all rounded-xl ${isDestructive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[hsl(var(--accent))] hover:opacity-90'}`}>{confirmText}</button>
        </div>
      </m.div>
    </div>
  );
};

const ActivationModal = ({ isOpen, onClose, onActivate, error }: { isOpen: boolean, onClose: () => void, onActivate: (key: string) => void, error: string }) => {
  const [key, setKey] = useState('');
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[8000] flex items-center justify-center">
      <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-sm w-full mx-4">
        <h3 className="text-xl font-bold mb-2">Activation Required</h3>
        <p className="text-slate-500 mb-6 text-sm">You've completed your first free mock test. Please enter an activation key to unlock more tests.</p>
        <input 
          type="text" 
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Enter activation key"
          className={`w-full bg-white dark:bg-slate-800 border-2 rounded-xl px-4 py-3 mb-2 focus:outline-none transition-colors ${error ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-[hsl(var(--accent))]'}`}
        />
        {error && <p className="text-rose-500 text-xs mb-4">{error}</p>}
        <div className="flex gap-3 mt-2">
          <button onClick={onClose} className="px-4 py-2 flex-1 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
          <button onClick={() => onActivate(key)} className="px-4 py-2 flex-1 font-bold text-white rounded-xl bg-[hsl(var(--accent))] hover:opacity-90 transition-all">Activate</button>
        </div>
      </m.div>
    </div>
  );
};

export default function CatMaester() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(true);
  const [paperList, setPaperList] = useState<{id: string, title: string}[]>([]);
  
  // Zustand Global State
  const { user, progress, login, logout, addResult, addTopicResult, clearHistory, setWholeProgress, setActivated } = useCatStore();
  
  // Mock State
  const [mockPhase, setMockPhase] = useState<'select' | 'lobby' | 'confirm' | 'test' | 'result' | 'review'>('select');
  const [timeLeft, setTimeLeft] = useState(7200);
  const [activeSection, setActiveSection] = useState<string>('');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [markedForReview, setMarkedForReview] = useState<Record<number, boolean>>({});
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [sectionTimes, setSectionTimes] = useState<Record<string, number>>({});
  const [reviewFilter, setReviewFilter] = useState<'all' | 'correct' | 'incorrect' | 'unanswered'>('all');
  const [taggedQuestions, setTaggedQuestions] = useState<Record<string, string>>({});
  const [showSubmitSummary, setShowSubmitSummary] = useState(false);
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [lastTestResult, setLastTestResult] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number | string>>({});
  const [savedTests, setSavedTests] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [expandedPassageContext, setExpandedPassageContext] = useState<string | null>(null);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showDesktopPalette, setShowDesktopPalette] = useState(true);
  const [showClearHistoryConfirmationModal, setShowClearHistoryConfirmationModal] = useState(false);
  const [passageWidth, setPassageWidth] = useState(50);
  const isDragging = useRef(false);
  const [pendingUnfinishedTest, setPendingUnfinishedTest] = useState<any>(null);
  const [formulaToDelete, setFormulaToDelete] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('cat-maester-theme') as 'light' | 'dark' | 'system') || 'system'
  );
  const [questionRatings, setQuestionRatings] = useState<Record<string, number>>(() => {
    try { const saved = localStorage.getItem('cat-maester-question-ratings'); return saved ? JSON.parse(saved) : {}; } 
    catch { return {}; }
  });
  const [, setKatexLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [isExamMode, setIsExamMode] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  const [liveChallengeId, setLiveChallengeId] = useState<string | null>(null);
  const [liveChallengeData, setLiveChallengeData] = useState<any>(null);



  const handleCalcClick = (val: string) => {
    if (val === 'C') setCalcExpr('');
    else if (val === '=') {
      try {
        const result = new Function('return ' + calcExpr)();
        setCalcExpr(String(Math.round(result * 10000) / 10000));
      } catch {
        setCalcExpr('Error');
      }
    } else if (val === 'sqrt') {
      try {
        const result = Math.sqrt(new Function('return ' + calcExpr)());
        setCalcExpr(String(Math.round(result * 10000) / 10000));
      } catch {
        setCalcExpr('Error');
      }
    } else {
      if (calcExpr === 'Error') setCalcExpr(val);
      else setCalcExpr(prev => prev + val);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!!document.fullscreenElement) {
        setIsSidebarCollapsed(true);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Mobile Edge-Swipe Gestures for Sidebar & Question Palette
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      if (deltaY > 50) return; // Ignore primarily vertical swipes
      
      if (touchStartX < 30 && deltaX > 50) {
        setIsSidebarCollapsed(false); // Swipe right from left edge
      }
      if (touchStartX > window.innerWidth - 30 && deltaX < -50) {
        if (activeTab === 'mock' && (mockPhase === 'test' || mockPhase === 'review')) setShowMobilePalette(true);
        else setIsSidebarCollapsed(true); // Swipe left from right edge
      }
    };
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => { window.removeEventListener('touchstart', handleTouchStart); window.removeEventListener('touchend', handleTouchEnd); };
  }, [activeTab, mockPhase]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error("Error attempting to enable full-screen mode:", err.message));
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging.current) return;
      let clientX = 0;
      if ('touches' in e) clientX = e.touches[0].clientX;
      else clientX = e.clientX;
      
      const newWidth = (clientX / window.innerWidth) * 100;
      setPassageWidth(Math.max(20, Math.min(newWidth, 80)));
    };
    const handleMouseUp = () => {
      if (isDragging.current) {
        isDragging.current = false;
        document.body.classList.remove('select-none');
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleMouseMove);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const handleDragStart = (e?: any) => {
    if (e && e.preventDefault) e.preventDefault();
    isDragging.current = true;
    document.body.classList.add('select-none');
    window.getSelection()?.removeAllRanges();
  };

  useEffect(() => {
    if ((window as any).katex) { setKatexLoaded(true); return; }
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js';
    script.onload = () => setKatexLoaded(true);
    document.head.appendChild(script);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css';
    document.head.appendChild(link);
  }, []);




  const audioCtxRef = useRef<any>(null);
  const playTickSound = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.05;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.1);
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  useEffect(() => {
    // Try to resume an unfinished test from localStorage
    try {
      const savedStateJSON = localStorage.getItem('cat-maester-active-test');
      if (savedStateJSON) {
        if (window.confirm('An unfinished mock test was found. Would you like to resume?')) {
          const savedState = JSON.parse(savedStateJSON);
          setCurrentTest(savedState.currentTest);
          setSelectedAnswers(savedState.selectedAnswers || {});
          setMarkedForReview(savedState.markedForReview || {});
          setTimeLeft(savedState.timeLeft || 7200);
          setActiveSection(savedState.activeSection || '');
          setActiveQuestionIdx(savedState.activeQuestionIdx || 0);
          setSectionTimes(savedState.sectionTimes || {});
          setIsExamMode(savedState.isExamMode || false);
          setIsPaused(true);
          setMockPhase('test');
        } else {
          localStorage.removeItem('cat-maester-active-test');
        }
      }
    } catch (e) {
      console.error("Failed to load saved test state", e);
      localStorage.removeItem('cat-maester-active-test');
    }

    const loadSavedTests = async () => {
      try {
        const tests = await getMockTests();
        setSavedTests(tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error("Failed to load tests", e);
      }
    };
    loadSavedTests();
  }, [mockPhase]); // Refresh list when phase changes



  useEffect(() => {
    let timer: any;
    if (mockPhase === 'test' && timeLeft > 0 && !isPaused) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          const nextTime = prev - 1;
          if (nextTime > 0 && nextTime <= 300 && isSoundEnabled) playTickSound();
          return nextTime;
        });
        setSectionTimes(prev => ({
          ...prev,
          [activeSection]: (prev[activeSection] || 0) + 1
        }));
      }, 1000);
    } else if (timeLeft <= 0 && mockPhase === 'test' && !isPaused) {
      if (isExamMode && currentTest) {
        const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
        const currIdx = sections.indexOf(activeSection);
        if (currIdx < sections.length - 1) {
          setActiveSection(sections[currIdx + 1]);
          setActiveQuestionIdx(0);
          setTimeLeft(2400);
        } else {
          handleSubmitMock();
        }
      } else {
        handleSubmitMock();
      }
    }
    return () => clearInterval(timer);
  }, [mockPhase, timeLeft, activeSection, isPaused, isSoundEnabled, isExamMode, currentTest]);

  useEffect(() => {
    if (mockPhase === 'test' && currentTest) {
      if (timeLeft % 5 !== 0) return; // Optimize by saving only every 5 seconds
      const activeTestData = {
        currentTest,
        selectedAnswers,
        markedForReview,
        timeLeft,
        activeSection,
        activeQuestionIdx,
        sectionTimes,
        isExamMode
      };
      localStorage.setItem('cat-maester-active-test', JSON.stringify(activeTestData));
    } else if (mockPhase !== 'test') {
      localStorage.removeItem('cat-maester-active-test');
    }
  }, [mockPhase, currentTest, selectedAnswers, markedForReview, timeLeft, activeSection, activeQuestionIdx, sectionTimes]);





  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateTheme = () => {
      if (theme === 'dark' || (theme === 'system' && mediaQuery.matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    updateTheme();
    localStorage.setItem('cat-maester-theme', theme);

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  // Memoize questions mapping and filtering to optimize re-renders during test/review
  const allQuestionsMapped = useMemo(() => {
    return currentTest?.questions?.map((q: any, i: number) => ({ ...q, originalIndex: i })) || [];
  }, [currentTest]);

  const activeSectionQuestions = useMemo(() => {
    return allQuestionsMapped.filter((q: any) => q.section === activeSection);
  }, [allQuestionsMapped, activeSection]);

  const filteredReviewQuestions = useMemo(() => {
    if (mockPhase !== 'review') return [];
    return activeSectionQuestions.filter((q: any) => {
      if (reviewFilter === 'all') return true;
      const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
      if (reviewFilter === 'unanswered') return !isAnswered;
      if (!isAnswered) return false;
      let isCorrect = false;
      if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
      else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
      if (reviewFilter === 'correct') return isCorrect;
      if (reviewFilter === 'incorrect') return !isCorrect;
      return true;
    });
  }, [mockPhase, activeSectionQuestions, reviewFilter, selectedAnswers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      // Global shortcut to clear all progress and saved tests
      if (e.ctrlKey && e.shiftKey && (e.key === 'Backspace' || e.key === 'Delete')) {
        e.preventDefault();
        setShowClearHistoryConfirmationModal(true);
      }

      // Shortcut to instantly reset current mock test (Alt + R)
      if (activeTab === 'mock' && mockPhase === 'test') {
        if (e.altKey && e.key.toLowerCase() === 'r') {
          e.preventDefault();
          if (window.confirm("Are you sure you want to instantly clear all progress and saved answers for this test?")) {
            setSelectedAnswers({});
            setMarkedForReview({});
            setSectionTimes({});
            const sections = Array.from(new Set(currentTest?.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
            setActiveSection(sections[0] || '');
            setActiveQuestionIdx(0);
            setTimeLeft(isExamMode ? 2400 : 7200);
          }
        }

        const q = activeSectionQuestions[activeQuestionIdx];
        if (q && q.type === 'MCQ' && ['1', '2', '3', '4'].includes(e.key)) {
          e.preventDefault();
          const optIdx = parseInt(e.key) - 1;
          if (q.options && optIdx < q.options.length) {
            setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: optIdx }));
          }
        }
      }

      if (activeTab === 'mock' && (mockPhase === 'test' || mockPhase === 'review')) {
         if (e.key === 'ArrowRight') {
             e.preventDefault();
             const maxIdx = mockPhase === 'test' ? activeSectionQuestions.length - 1 : filteredReviewQuestions.length - 1;
             if (activeQuestionIdx < maxIdx) setActiveQuestionIdx(prev => prev + 1);
         } else if (e.key === 'ArrowLeft') {
             e.preventDefault();
             if (activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
         }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, mockPhase, currentTest, isExamMode, activeQuestionIdx, activeSectionQuestions, filteredReviewQuestions.length]);

  useEffect(() => {
    if (activeTab === 'formula') {
      const loadFormulas = async () => {
        try {
          let f = await getFormulas();
          if (!f.some(form => form.isOfficial)) { // Seed official flashcards from formulas.json
            const formulasRaw = (await import('../data/formulas.json')).default || await import('../data/formulas.json');
            const defaultF: any[] = [];
            let idCounter = 1;
            if (formulasRaw && formulasRaw.topics) {
              formulasRaw.topics.forEach((topic: any) => {
                topic.flashcards?.forEach((card: any) => {
                  defaultF.push({
                    id: `official_${idCounter++}`,
                    front: card.question,
                    back: card.answer,
                    topic: topic.topic_name,
                    isOfficial: true,
                    reps: 0,
                    interval: 1,
                    ease: 2.5
                  });
                });
              });
              for (let df of defaultF) await saveFormula(df);
              f = await getFormulas();
            }
          }
          setFormulas(f);
        } catch (e) { console.error("Failed to load formulas", e); }
      };
      loadFormulas();
    }
  }, [activeTab]);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthOpen(false);
    } catch (error: any) {
      console.error("Authentication failed", error);
      alert(`Failed to sign in: ${error?.message || 'Unknown error'}\n\nTip: Make sure Google Sign-In is enabled in your Firebase console, and your current domain (e.g., localhost or jazdot.github.io) is added to the "Authorized Domains" list under Authentication Settings.`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    logout();
    if (window.innerWidth < 768) {
      setIsSidebarCollapsed(true);
    }
  };

  // Listen for Firebase Auth changes and Cloud Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setIsCloudSyncing(true);
        login(firebaseUser.displayName || 'Aspirant', firebaseUser.uid, firebaseUser.photoURL || undefined);
        
        // Fetch from Cloud
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            if (data.progress) setWholeProgress(data.progress);
            if (data.questionRatings) {
              setQuestionRatings(data.questionRatings);
              localStorage.setItem('cat-maester-question-ratings', JSON.stringify(data.questionRatings));
            }

            if (data.formulas) {
              for (const f of data.formulas) {
                await saveFormula(f);
              }
              const updatedF = await getFormulas();
              setFormulas(updatedF);
            }
          }
        } catch (e) {
          console.error("Failed to load cloud data", e);
        } finally {
          setIsCloudSyncing(false);
        }
      } else {
        setIsCloudSyncing(false);
      }
    });
    return () => unsubscribe();
  }, [login, setWholeProgress]);

  // Auto-sync to cloud when data changes (debounced)
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    
    const syncToCloud = async () => {
      try {
        await setDoc(doc(db, 'users', uid), {
          displayName: user.name,
          photoURL: user.photoURL || null,
          progress,
          questionRatings,
          formulas,
          lastSynced: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error("Failed to sync to cloud", e);
      }
    };

    const timeoutId = setTimeout(syncToCloud, 5000);
    return () => clearTimeout(timeoutId);
  }, [progress, questionRatings, formulas, user?.uid, user?.name, user?.photoURL]);



  const handleTagTopic = (q: any, topic: string) => {
    if (!topic.trim()) return;
    const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
    let isCorrect = false;
    if (isAnswered) {
      if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
      else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
    }

    addTopicResult(topic.trim(), isCorrect, q.id);
    setTaggedQuestions(prev => ({ ...prev, [q.id]: topic.trim() }));
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const challengeId = params.get('challenge');
    const liveChallengeIdParam = params.get('live_challenge');
    if (challengeId && paperLoaders[challengeId]) {
      setActiveTab('mock');
      handleStartPastPaper(challengeId);
      window.history.replaceState({}, '', location.pathname);
    } else if (liveChallengeIdParam) {
      setActiveTab('mock');
      setLiveChallengeId(liveChallengeIdParam);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]);

  useEffect(() => {
    if (!liveChallengeId) return;
    const unsub = onSnapshot(doc(db, 'challenges', liveChallengeId), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setLiveChallengeData(data);
        
        if (data.status === 'active' && mockPhase === 'lobby') {
           const loader = paperLoaders[data.paperId];
           if (loader) {
             const paper = await loader();
             const testObj = {
               id: paper.id + '_' + Date.now().toString(),
               date: new Date().toISOString(),
               title: paper.title || paper.id || 'Live Challenge',
               questions: paper.questions || []
             };
             setCurrentTest(testObj);
             setTimeLeft(isExamMode ? 2400 : 7200);
             const sections = Array.from(new Set(testObj.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
             setActiveSection(sections[0] || '');
             setActiveQuestionIdx(0);
             setLastTestResult(null);
             setSelectedAnswers({});
             setMarkedForReview({});
             setSectionTimes({});
             setReviewFilter('all');
             setTaggedQuestions({});
             setIsPaused(false);
             setMockPhase('test');
           }
        }
      }
    });
    return () => unsub();
  }, [liveChallengeId, mockPhase, isExamMode]);

  useEffect(() => {
    if (liveChallengeId && mockPhase !== 'test' && mockPhase !== 'review' && mockPhase !== 'result') {
      setMockPhase('lobby');
      if (user && liveChallengeData) {
         if (!liveChallengeData.challenger && liveChallengeData.host.uid !== user.uid) {
           updateDoc(doc(db, 'challenges', liveChallengeId), {
             challenger: { uid: user.uid, name: user.name, photoURL: user.photoURL || null, score: 0, accuracy: 0, progress: 0 }
           }).catch(console.error);
         }
      }
    }
  }, [liveChallengeId, user, liveChallengeData, mockPhase]);

  useEffect(() => {
    if (mockPhase === 'test' && liveChallengeId && user && currentTest) {
      const timeoutId = setTimeout(() => {
        let score = 0;
        let answeredCount = 0;
        let correctCount = 0;
        currentTest.questions?.forEach((q: any, idx: number) => {
           const answer = selectedAnswers[idx];
           if (answer !== undefined && String(answer).trim() !== '') {
             answeredCount++;
             let isCorrect = false;
             if (q.type === 'MCQ') {
               if (answer === q.correct) { score += 3; isCorrect = true; }
               else { score -= 1; }
             } else {
               if (String(answer).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()) { score += 3; isCorrect = true; }
             }
             if (isCorrect) correctCount++;
           }
        });
        
        const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
        const progressPct = Math.round((answeredCount / currentTest.questions.length) * 100);
        
        const role = liveChallengeData?.host?.uid === user.uid ? 'host' : 'challenger';
        updateDoc(doc(db, 'challenges', liveChallengeId), {
          [`${role}.score`]: score,
          [`${role}.accuracy`]: accuracy,
          [`${role}.progress`]: progressPct
        }).catch(e => console.error("Live challenge update failed", e));
      }, 3000);
      return () => clearTimeout(timeoutId);
    }
  }, [selectedAnswers]);

  const handleStartPastPaper = async (paperId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }

    const loader = paperLoaders[paperId];
    if (!loader) return;
    
    const paper = await loader();

    
    const testObj = {
      id: paper.id + '_' + Date.now().toString(),
      date: new Date().toISOString(),
      title: paper.title || paper.id || 'Mock Test',
      questions: paper.questions || []
    };
    
    await saveMockTest(testObj);
    setCurrentTest(testObj);
    setMockPhase('confirm');
  };

  const handleCreateLiveChallenge = async (paperId: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    try {
      const docRef = await addDoc(collection(db, 'challenges'), {
        paperId,
        status: 'waiting',
        host: { uid: user.uid, name: user.name, photoURL: user.photoURL || null, score: 0, accuracy: 0, progress: 0 },
        challenger: null,
        createdAt: new Date().toISOString()
      });
      setLiveChallengeId(docRef.id);
      setMockPhase('lobby');
      const url = new URL(window.location.href);
      url.searchParams.set('live_challenge', docRef.id);
      navigator.clipboard.writeText(url.toString());
      alert('Live Challenge URL copied to clipboard! Send it to your friend to join.');
    } catch (e) {
      console.error(e);
      alert('Failed to create live challenge.');
    }
  };

  useEffect(() => {
    if (activeTab === 'mock') {
      const papers = Object.keys(paperLoaders).map(id => ({
        id,
        title: id.replace(/_/g, ' ')
      }));
      setPaperList(papers);
    }
  }, [activeTab]);

  const startConfirmedTest = () => {
    if (progress.testsCompleted >= 1 && !progress.isActivated) {
      setShowActivationModal(true);
      return;
    }

    setTimeLeft(isExamMode ? 2400 : 7200);
    const sections = Array.from(new Set(currentTest?.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
    setActiveSection(sections[0] || '');
    setActiveQuestionIdx(0);
    setLastTestResult(null);
    setSelectedAnswers({});
    setMarkedForReview({});
    setSectionTimes({});
    setReviewFilter('all');
    setTaggedQuestions({});
    setIsPaused(false);
    setMockPhase('test');
  };

  const handleSubmitMock = async () => {
    let score = 0;
    let answeredCount = 0;
    let correctCount = 0;
    const sectionStats: Record<string, { correct: number, attempted: number, total: number, score: number }> = {};
    const testTopicStats: Record<string, { correct: number, attempted: number, total: number, score: number }> = {};

    const inferTopic = (q: any) => {
      if (taggedQuestions[q.id]) return taggedQuestions[q.id];
      for (const [topic, stat] of Object.entries(progress.topicStats || {})) {
        if (stat.questionIds?.includes(q.id)) return topic;
      }
      const text = (q.text + ' ' + (q.explanation || '') + ' ' + (q.context || '')).toLowerCase();
      if (q.section === 'VARC') {
        if (q.context) return 'Reading Comprehension';
        if (text.includes('jumbled') || text.includes('sequence') || text.includes('properly sequenced')) return 'Parajumbles';
        if (text.includes('summar') || text.includes('essence')) return 'Paragraph Summary';
        if (text.includes('odd one out') || text.includes('odd sentence')) return 'Odd One Out';
        return 'Verbal Ability';
      }
      if (q.section === 'DILR' || q.section === 'LRDI') {
        if (text.includes('arrangement') || text.includes('seated') || text.includes('row')) return 'Arrangements';
        if (text.includes('graph') || text.includes('table') || text.includes('chart') || text.includes('average')) return 'Data Interpretation';
        if (text.includes('tournament') || text.includes('match') || text.includes('player')) return 'Games & Tournaments';
        if (text.includes('venn') || text.includes('diagram')) return 'Venn Diagrams';
        return 'Logical Reasoning';
      }
      if (q.section === 'QA' || q.section === 'Quant') {
        if (text.includes('triangle') || text.includes('circle') || text.includes('radius') || text.includes('area') || text.includes('geometry')) return 'Geometry';
        if (text.includes('equation') || text.includes('roots') || text.includes('x^2') || text.includes('polynomial')) return 'Algebra';
        if (text.includes('profit') || text.includes('discount') || text.includes('interest') || text.includes('sell')) return 'Commercial Math';
        if (text.includes('speed') || text.includes('time') || text.includes('distance') || text.includes('km') || text.includes('train')) return 'Time, Speed & Distance';
        if (text.includes('log') || text.includes('logarithm')) return 'Logarithms';
        if (text.includes('probability') || text.includes('ways') || text.includes('arrange') || text.includes('chosen')) return 'Combinatorics';
        if (text.includes('ratio') || text.includes('proportion')) return 'Ratio & Proportion';
        return 'Arithmetic';
      }
      return 'General';
    };

    if (currentTest) {
      currentTest.questions?.forEach((q: any, idx: number) => {
        const sec = q.section;
        if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, attempted: 0, total: 0, score: 0 };
        sectionStats[sec].total++;

        const topic = inferTopic(q);
        if (!testTopicStats[topic]) testTopicStats[topic] = { correct: 0, attempted: 0, total: 0, score: 0 };
        testTopicStats[topic].total++;

        const answer = selectedAnswers[idx];
        if (answer !== undefined && String(answer).trim() !== '') {
          answeredCount++;
          sectionStats[sec].attempted++;
          testTopicStats[topic].attempted++;

          let isCorrect = false;
          let qScore = 0;
          if (q.type === 'MCQ') {
            if (answer === q.correct) { qScore = 3; isCorrect = true; }
            else { qScore = -1; }
          } else {
            if (String(answer).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()) { qScore = 3; isCorrect = true; }
          }
          
          score += qScore;
          sectionStats[sec].score += qScore;
          testTopicStats[topic].score += qScore;

          if (isCorrect) {
            correctCount++;
            sectionStats[sec].correct++;
            testTopicStats[topic].correct++;
          } else {
            const front = `[Auto-Generated]\n\nQ: ${q.text}`;
            const correctAnsStr = q.type === 'MCQ' ? q.options?.[q.correct as number] : q.tita_answer;
            const back = `Correct Answer: ${correctAnsStr}\n\nExplanation:\n${q.explanation}`;
            saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
          }
        }
      });

      const totalQuestions = currentTest.questions?.length || 0;
      const incorrectCount = answeredCount - correctCount;
      const unansweredCount = totalQuestions - answeredCount;
      const accuracy = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
      const timeTaken = Object.values(sectionTimes).reduce((sum, t) => sum + t, 0);

      setLastTestResult({
        score,
        total: totalQuestions,
        answered: answeredCount,
        correct: correctCount,
        incorrect: incorrectCount,
        unanswered: unansweredCount,
        accuracy,
        sectionTimes,
        sectionStats,
        testTopicStats
      });

      setMockPhase('result');
      addResult(answeredCount, correctCount);

      // Wire up API call for global percentiles
      try {
        const response = await fetch('/api/submit-test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            test_id: currentTest.id,
            user_id: user?.name || 'Anonymous',
            score: score,
            total_time: timeTaken
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          setLastTestResult((prev: any) => prev ? {
             ...prev, 
             percentile: data.percentile, 
             averagePeerTime: data.average_peer_time 
          } : prev);
        }
      } catch (err) {
        console.error("Failed to sync mock test results", err);
      }
    }
  };


  // Zero-dependency SVG Donut Chart Calculation
  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.correct / progress.totalAttempted) * 100) : 0;





  const hideNavigation = isFullscreen && activeTab === 'mock' && (mockPhase === 'test' || mockPhase === 'review');
  const testReviewClasses = hideNavigation 
    ? 'rounded-none border-none h-[100dvh] bg-[#f8fafc] dark:bg-[#020617]' 
    : 'fixed inset-0 z-[5000] md:relative md:inset-auto md:z-auto md:rounded-2xl h-[100dvh] md:h-[calc(100vh-12rem)] md:min-h-[600px] bg-[#f8fafc] dark:bg-[#020617] md:bg-white/60 md:dark:bg-white/5';

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[1000] flex text-slate-900 dark:text-slate-100 overflow-hidden font-sans bg-[#f8fafc] dark:bg-[#020617]"
    >
      {/* Sidebar */}
        {!hideNavigation && (
          <>
            {/* Mobile Overlay */}
            <div 
              className={`md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[6000] transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'}`}
              onClick={() => setIsSidebarCollapsed(true)} 
            />
            
            <nav className={`fixed md:relative top-0 left-0 h-[100dvh] md:h-auto z-[6001] md:z-auto bg-white/95 dark:bg-slate-900/95 md:bg-white/60 md:dark:bg-white/5 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/10 flex flex-col justify-between shrink-0 print:hidden transition-all duration-300 ${isSidebarCollapsed ? '-translate-x-full md:translate-x-0 md:w-20' : 'translate-x-0 w-64'}`}>
              <div>
                <div className={`p-4 ${isSidebarCollapsed ? 'md:p-4' : 'md:p-6'}`}>
                  <div className={`flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'justify-between'} mb-6`}>
                    <button onClick={() => navigate('/tools')} className={`flex items-center gap-2 text-slate-500 hover:text-[hsl(var(--accent))] transition-colors text-xs font-bold tracking-widest uppercase ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                      <ArrowLeft size={16} /> <span>Back to Tools</span>
                    </button>
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="hidden md:block text-slate-500 hover:text-[hsl(var(--accent))] transition-colors p-2" title="Toggle Sidebar">
                      <Menu size={18} />
                    </button>
                    <button onClick={() => setIsSidebarCollapsed(true)} className="md:hidden text-slate-500 hover:text-[hsl(var(--accent))] transition-colors p-2">
                      <X size={20} />
                    </button>
                  </div>
                  <div className={`flex items-center ${isSidebarCollapsed ? 'md:justify-center' : 'gap-3'}`}>
                    <div className="bg-[hsl(var(--accent))] text-white p-2 rounded-xl shadow-lg shadow-[hsl(var(--accent))]/30 shrink-0">
                      <Book size={24} />
                    </div>
                    <div className={`font-bold tracking-widest text-lg cursor-default whitespace-nowrap overflow-hidden transition-all ${isSidebarCollapsed ? 'md:w-0 md:opacity-0' : 'w-auto opacity-100'}`}>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">CAT Maester</span>
                      <span style={{ color: 'hsl(var(--accent))' }}>.</span> 
                    </div>
                  </div>
                </div>
                
                <div className="px-3 mt-4 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard & Analytics' },
              { id: 'practice', icon: PenTool, label: 'Practice Arena' },
              { id: 'mock', icon: Bot, label: 'Mock Exam Center' },
              { id: 'formula', icon: Book, label: 'Study Hub & Formulas' }
            ].map((item) => (
              <button key={item.id} onClick={() => { setActiveTab(item.id); if(window.innerWidth < 768) setIsSidebarCollapsed(true); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5'} ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
                <item.icon size={20} className="shrink-0" />
                <span className={`whitespace-nowrap ${isSidebarCollapsed ? 'md:hidden' : ''}`}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col shrink-0">
          <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-4">
            {user ? (
              <div className="flex flex-col gap-3">
                <div className={`flex items-center gap-3 px-3 py-2 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10 ${isSidebarCollapsed ? 'md:justify-center' : ''}`}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full shadow-sm shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white font-bold shrink-0">{user.name.charAt(0)}</div>
                  )}
                  <div className={`flex-1 truncate transition-all ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                    <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Cloud Synced
                    </p>
                  </div>
                </div>
                <button onClick={handleLogout} className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 hover:text-rose-500 transition-colors ${isSidebarCollapsed ? '' : 'md:justify-start'}`}>
                  <LogOut size={20} className="shrink-0" />
                  <span className={`font-medium ${isSidebarCollapsed ? 'md:hidden' : ''}`}>Log Out</span>
                </button>
              </div>
            ) : (
              <button onClick={() => {
                setIsAuthOpen(true);
                if (window.innerWidth < 768) {
                  setIsSidebarCollapsed(true);
                }
              }} className={`w-full flex items-center justify-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-[hsl(var(--accent))]/10 hover:text-[hsl(var(--accent))] transition-colors ${isSidebarCollapsed ? '' : 'md:justify-start'}`}>
                <LogIn size={20} className="shrink-0" />
                <span className={`font-medium ${isSidebarCollapsed ? 'md:hidden' : ''}`}>Sign In to Sync</span>
              </button>
            )}
          </div>
          <div className="p-2 md:p-4 border-t border-slate-200/50 dark:border-white/10">
            <div className={`flex items-center justify-around gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg ${isSidebarCollapsed ? 'md:flex-col' : 'flex-row'}`}>
              <button onClick={() => setTheme('light')} title="Light Mode" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Sun size={16} /></button>
              <button onClick={() => setTheme('system')} title="System Preference" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Monitor size={16} /></button>
              <button onClick={() => setTheme('dark')} title="Dark Mode" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Moon size={16} /></button>
            </div>
          </div>
        </div>
      </nav>
          </>
        )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
          {!hideNavigation && (
            <header className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 p-3 md:p-4 sticky top-0 z-10 flex justify-between items-center px-4 md:px-6 print:hidden">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarCollapsed(false)} className="text-slate-500 hover:text-[hsl(var(--accent))] transition-colors md:hidden" title="Open Menu">
              <Menu size={24} />
            </button>
            {isSidebarCollapsed && (
              <button onClick={() => setIsSidebarCollapsed(false)} className="hidden md:block text-slate-500 hover:text-[hsl(var(--accent))] transition-colors" title="Expand Sidebar">
                <Menu size={24} />
              </button>
            )}
            <h2 className="text-xl md:text-2xl font-bold capitalize">{activeTab}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md py-1.5 md:py-2 px-3 md:px-4 rounded-full border border-slate-200/50 dark:border-white/10">
            <div className="text-xs md:text-sm font-medium"><span className="text-slate-500 hidden sm:inline">Accuracy: </span><span className="text-[hsl(var(--accent))] font-bold">{accuracy}%</span></div>
            <div className="w-px h-3 md:h-4 bg-slate-300 dark:bg-slate-600"></div>
            <div className="text-xs md:text-sm font-medium"><span className="text-slate-500 hidden sm:inline">Tests: </span><span className="text-[hsl(var(--accent))] font-bold">{progress.testsCompleted}</span></div>
          </div>
            </header>
          )}

          <div className={`${hideNavigation ? 'p-0 md:p-0' : 'p-4 md:p-8 lg:px-12'} mx-auto w-full flex-1 flex flex-col ${hideNavigation ? 'max-w-full' : 'max-w-[1920px]'}`}>
          <style>{`
            @media (min-width: 1024px) {
              .passage-container { width: ${passageWidth}% !important; flex: none !important; }
              .question-container { width: calc(${100 - passageWidth}% - 1rem) !important; flex: none !important; }
            }
          `}</style>
          {activeTab === 'dashboard' && (
            <div className="space-y-12">
              <AnalyticsDashboard />
              <div className="pt-8 border-t border-slate-200/50 dark:border-white/10">
                <AdaptiveEngine />
              </div>
            </div>
          )}


          {activeTab === 'mock' && (
              <div className={`bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-sm overflow-hidden flex flex-col flex-1 ${mockPhase === 'test' || mockPhase === 'review' ? testReviewClasses : 'rounded-2xl min-h-[600px] lg:h-[calc(100vh-12rem)]'}`}>
              {mockPhase === 'select' && (
                <div className="flex flex-col md:flex-row w-full h-full flex-1">
                  <div className="p-8 flex flex-col flex-1 border-b md:border-b-0 md:border-r border-slate-200/50 dark:border-white/10">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit size={24} className="text-[hsl(var(--accent))]" /> Official Past Papers</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {paperList.map((paper) => (
                        <div key={paper.id} className="p-5 bg-white/60 dark:bg-white/5 rounded-xl border border-slate-200/50 dark:border-white/10 flex flex-col justify-between shadow-sm hover:border-[hsl(var(--accent))]/50 hover:shadow-md transition-all group">
                          <div className="mb-4">
                        <h4 className="font-bold text-lg">{paper.title || paper.id || 'Unnamed Paper'}</h4>
                        <p className="text-slate-500 text-sm">Past Paper</p>
                          </div>
                          <div className="flex flex-col gap-2">
                            <button onClick={() => handleStartPastPaper(paper.id)} className="w-full flex items-center justify-center gap-2 bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] hover:text-white px-4 py-2 rounded-lg font-bold transition-colors">
                              <PlayCircle size={18} /> Start Test
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleCreateLiveChallenge(paper.id); }} className="w-full flex items-center justify-center gap-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors">
                              <RadioTower size={18} /> Live Challenge
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {savedTests.length > 0 && (
                    <div className="p-8 flex flex-col flex-1 bg-black/5 dark:bg-white/5">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2"><Book size={24} className="text-[hsl(var(--accent))]" /> Saved Offline Tests</h3>
                        <button 
                          onClick={async () => {
                            if(window.confirm('Instantly clear all saved offline tests and their progress?')) {
                               try {
                                 const db = await initDB();
                                 const tx = db.transaction(STORE_NAME, 'readwrite');
                                 tx.objectStore(STORE_NAME).clear();
                                 setSavedTests([]);
                               } catch(e) {}
                            }
                          }}
                          className="text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors border border-rose-500/20 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg"
                        >
                          Clear All
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto pr-2 space-y-3" style={{ maxHeight: '350px', scrollbarWidth: 'thin' }}>
                        {savedTests.map(test => (
                          <div key={test.id} className="p-4 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-slate-200/50 dark:border-white/10 flex justify-between items-center shadow-sm hover:border-[hsl(var(--accent))]/50 transition-colors">
                            <div>
                              <div className="font-bold text-sm">Mock Test ({test.questions?.length || 0} Qs)</div>
                              <div className="text-xs text-slate-500 mt-0.5">{new Date(test.date).toLocaleString()}</div>
                            </div>
                            <button onClick={() => { setCurrentTest(test); setSelectedAnswers({}); setMockPhase('confirm'); }} className="text-sm font-bold text-white bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 px-4 py-2 rounded-lg shadow-md active:scale-95 transition-all">Retake</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {mockPhase === 'lobby' && (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center bg-white/60 dark:bg-white/5 backdrop-blur-xl">
                  <h2 className="text-3xl font-black mb-2 flex items-center gap-3"><RadioTower className="text-purple-500 animate-pulse" size={32} /> Live Challenge Lobby</h2>
                  <p className="text-slate-500 mb-8 max-w-lg">
                    Waiting for players to join. Share the challenge URL with your friend!
                  </p>
              
                  {liveChallengeData && (
                    <div className="flex items-center gap-12 mb-12">
                      <div className="flex flex-col items-center gap-3">
                        {liveChallengeData.host.photoURL ? (
                          <img src={liveChallengeData.host.photoURL} className="w-20 h-20 rounded-full shadow-lg border-4 border-[hsl(var(--accent))]" />
                        ) : (
                           <div className="w-20 h-20 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-[hsl(var(--accent))]">{liveChallengeData.host.name.charAt(0)}</div>
                        )}
                        <div className="font-bold text-lg">{liveChallengeData.host.name}</div>
                        <span className="text-xs font-bold uppercase tracking-widest text-[hsl(var(--accent))]">Host</span>
                      </div>
              
                      <div className="text-4xl font-black text-slate-300 dark:text-slate-700 italic">VS</div>
              
                      <div className="flex flex-col items-center gap-3">
                        {liveChallengeData.challenger ? (
                           <>
                              {liveChallengeData.challenger.photoURL ? (
                                <img src={liveChallengeData.challenger.photoURL} className="w-20 h-20 rounded-full shadow-lg border-4 border-purple-500" />
                              ) : (
                                 <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg border-4 border-purple-500">{liveChallengeData.challenger.name.charAt(0)}</div>
                              )}
                              <div className="font-bold text-lg">{liveChallengeData.challenger.name}</div>
                              <span className="text-xs font-bold uppercase tracking-widest text-purple-500">Challenger</span>
                           </>
                        ) : (
                          <>
                             <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 border-4 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center animate-pulse">
                                <Loader2 size={24} className="text-slate-400 animate-spin" />
                             </div>
                             <div className="font-bold text-lg text-slate-400">Waiting...</div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
              
                  {liveChallengeData?.host.uid === user?.uid ? (
                    <button 
                      disabled={!liveChallengeData?.challenger}
                      onClick={() => {
                         updateDoc(doc(db, 'challenges', liveChallengeId!), { status: 'active' });
                      }} 
                      className="px-8 py-3 font-bold text-white rounded-xl shadow-lg bg-[hsl(var(--accent))] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Start Match
                    </button>
                  ) : (
                    <div className="px-8 py-3 font-bold text-slate-500 rounded-xl bg-slate-100 dark:bg-slate-800">
                      Waiting for Host to start...
                    </div>
                  )}
                  
                  {!user && (
                    <button onClick={() => setIsAuthOpen(true)} className="mt-4 text-sm font-bold text-[hsl(var(--accent))] hover:underline">
                      Sign in to join
                    </button>
                  )}
                </div>
              )}
              {mockPhase === 'confirm' && currentTest && (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                   <h2 className="text-3xl font-black mb-4">{currentTest.title}</h2>
                   <p className="text-slate-500 mb-8 max-w-lg">
                     You are about to start this mock test. The test contains {currentTest.questions?.length || 0} questions and you will have {isExamMode ? '40 minutes per section' : '120 minutes'} to complete it. Ensure you have a stable connection and are ready to begin.
                   </p>
                   <label className="flex items-center gap-2 cursor-pointer text-sm font-bold bg-white dark:bg-slate-800 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-[hsl(var(--accent))]/50 mb-8">
                     <input type="checkbox" checked={isExamMode} onChange={e => setIsExamMode(e.target.checked)} className="w-4 h-4 text-[hsl(var(--accent))] rounded border-slate-300 focus:ring-[hsl(var(--accent))]" />
                     Strict Sectional Timing (40 min / section)
                   </label>
                   <div className="flex gap-4">
                     <button onClick={() => setMockPhase('select')} className="py-3 px-6 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                     <button onClick={startConfirmedTest} className="py-3 px-8 font-bold text-white rounded-xl shadow-lg bg-[hsl(var(--accent))] hover:scale-105 active:scale-95 transition-all">Begin Test</button>
                   </div>
                </div>
              )}
              {mockPhase === 'test' && currentTest && (
                <div className="flex flex-col flex-1 h-full bg-slate-50/50 dark:bg-slate-900/50 relative">
                  <AnimatePresence>
                    {mockPhase === 'test' && liveChallengeId && liveChallengeData && (
                      <m.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="absolute top-20 left-4 md:left-auto md:right-4 z-[5000] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 w-64 pointer-events-none"
                      >
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                          <span className="flex items-center gap-1.5"><RadioTower size={14} className="text-rose-500 animate-pulse" /> Live Match</span>
                        </div>
                        
                        <div className={`flex justify-between items-center ${liveChallengeData.host.score >= (liveChallengeData.challenger?.score || 0) ? 'opacity-100' : 'opacity-60'}`}>
                          <div className="flex items-center gap-2">
                            {liveChallengeData.host.photoURL ? <img src={liveChallengeData.host.photoURL} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-[hsl(var(--accent))] flex items-center justify-center text-white text-[10px] font-bold">{liveChallengeData.host.name.charAt(0)}</div>}
                            <span className="text-sm font-bold truncate max-w-[80px]">{liveChallengeData.host.name}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-black leading-none">{liveChallengeData.host.score}</div>
                            <div className="text-[10px] text-slate-500 font-bold">{liveChallengeData.host.accuracy}% Acc</div>
                          </div>
                        </div>
                        
                        {liveChallengeData.challenger && (
                          <div className={`flex justify-between items-center ${liveChallengeData.challenger.score >= liveChallengeData.host.score ? 'opacity-100' : 'opacity-60'}`}>
                            <div className="flex items-center gap-2">
                              {liveChallengeData.challenger.photoURL ? <img src={liveChallengeData.challenger.photoURL} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">{liveChallengeData.challenger.name.charAt(0)}</div>}
                              <span className="text-sm font-bold truncate max-w-[80px]">{liveChallengeData.challenger.name}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-black leading-none">{liveChallengeData.challenger.score}</div>
                              <div className="text-[10px] text-slate-500 font-bold">{liveChallengeData.challenger.accuracy}% Acc</div>
                            </div>
                          </div>
                        )}
                      </m.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {showCalculator && (
                      <m.div
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute top-20 right-4 md:right-20 z-[6000] w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col"
                        style={{ touchAction: "none" }}
                      >
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 p-3 flex justify-between items-center cursor-move border-b border-slate-200/50 dark:border-white/10">
                          <span className="font-bold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-300"><Calculator size={16} /> Calculator</span>
                          <button onClick={() => setShowCalculator(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X size={16} /></button>
                        </div>
                        <div className="p-4">
                          <div className="bg-white dark:bg-slate-950 p-3 rounded-xl text-right font-mono text-xl mb-4 overflow-x-auto min-h-[3.5rem] flex items-center justify-end border border-slate-200/50 dark:border-white/5 shadow-inner">
                            {calcExpr || '0'}
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','=','+'].map(btn => (
                              <button key={btn} onClick={() => handleCalcClick(btn)} className={`p-3 rounded-xl font-bold text-lg transition-colors shadow-sm active:scale-95 ${btn === '=' ? 'bg-[hsl(var(--accent))] text-white hover:opacity-90' : ['/','*','-','+'].includes(btn) ? 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:bg-slate-600 text-[hsl(var(--accent))]' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                                {btn}
                              </button>
                            ))}
                            <button onClick={() => handleCalcClick('C')} className="col-span-2 p-2 rounded-xl font-bold bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 shadow-sm active:scale-95 transition-colors">Clear</button>
                            <button onClick={() => handleCalcClick('sqrt')} className="p-2 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[hsl(var(--accent))] shadow-sm active:scale-95 transition-colors">√</button>
                            <button onClick={() => setCalcExpr(prev => prev.slice(0, -1))} className="p-2 rounded-xl font-bold bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-[hsl(var(--accent))] shadow-sm active:scale-95 transition-colors">⌫</button>
                          </div>
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {isPaused && (
                      <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl flex flex-col items-center justify-center text-center p-6">
                        <Timer size={48} className="text-[hsl(var(--accent))] mb-4 opacity-50" />
                        <h2 className="text-3xl font-black mb-2">Test Paused</h2>
                        <p className="text-slate-500 mb-8 max-w-md">Your timer has been stopped. The questions are hidden to maintain fairness. You can resume whenever you're ready.</p>
                        <button onClick={() => setIsPaused(false)} className="px-8 py-3 rounded-xl font-bold bg-[hsl(var(--accent))] text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Resume Test</button>
                      </m.div>
                    )}
                  </AnimatePresence>
                  <div className={`flex justify-between items-center ${isFullscreen ? 'p-2 md:p-3' : 'p-4'} border-b border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0`}>
                    <h3 className={`${isFullscreen ? 'text-base' : 'text-lg'} font-bold truncate pr-2 md:pr-4`}>{currentTest.title || 'Mock Test Active'}</h3>
                    <div className="flex items-center gap-1.5 md:gap-4">
                      <button onClick={() => setShowMobilePalette(!showMobilePalette)} className="md:hidden bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex shrink-0 items-center justify-center" title="Question Palette">
                        <LayoutDashboard size={18} />
                      </button>
                      <button onClick={() => setShowDesktopPalette(!showDesktopPalette)} className="hidden md:block bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        {showDesktopPalette ? 'Hide Palette' : 'Show Palette'}
                      </button>
                      <button onClick={toggleFullscreen} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex shrink-0 items-center justify-center" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </button>
                      <button onClick={() => setShowCalculator(!showCalculator)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex shrink-0 items-center justify-center" title="Calculator">
                        <Calculator size={18} />
                      </button>
                      <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex shrink-0 items-center justify-center" title={isSoundEnabled ? "Mute Timer" : "Unmute Timer"}>
                        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                      </button>
                      <button onClick={() => {
                        if (window.confirm('Are you sure you want to instantly clear all progress and saved answers for this test?')) {
                          setSelectedAnswers({});
                          setMarkedForReview({});
                          setSectionTimes({});
                          const sections = Array.from(new Set(currentTest?.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                          setActiveSection(sections[0] || '');
                          setActiveQuestionIdx(0);
                          setTimeLeft(isExamMode ? 2400 : 7200);
                        }
                      }} className="bg-rose-500/10 text-rose-500 border border-rose-500/20 hover:bg-rose-500 hover:text-white px-3 py-1.5 rounded-lg font-bold shadow-sm active:scale-95 transition-all text-sm hidden lg:block" title="Reset Test (Alt+R)">Reset</button>
                      <button onClick={() => setIsPaused(true)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm hidden lg:block">Pause</button>
                      <div className={`font-mono bg-slate-100 dark:bg-slate-800 px-1.5 md:px-3 py-1.5 rounded-lg font-bold text-xs md:text-lg flex items-center gap-1 md:gap-2 shrink-0 ${timeLeft < 300 ? 'text-rose-500' : 'text-[hsl(var(--accent))]'}`}>
                         <Timer size={16} className="md:w-[18px] md:h-[18px]" /> {formatTime(timeLeft)}
                      </div>
                      <button onClick={() => setShowSubmitSummary(true)} className="bg-[hsl(var(--accent))] text-white px-2.5 md:px-5 py-1.5 md:py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-xs md:text-base shrink-0">Submit</button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 shrink-0">
                    <m.div 
                      className="h-full bg-[hsl(var(--accent))] transition-all"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.round((Object.values(selectedAnswers).filter(v => v !== undefined && String(v).trim() !== '').length / (currentTest.questions?.length || 1)) * 100)}%` }}
                    />
                  </div>
                  
                  <div className="flex bg-white/40 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 shrink-0 px-2 overflow-x-auto scrollbar-hide">
                     {Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))).map((sec: any) => (
                       <button 
                         key={sec} 
                         onClick={() => { 
                           if (!isExamMode) {
                             setActiveSection(sec); 
                             setActiveQuestionIdx(0); 
                           }
                         }}
                         className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeSection === sec ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'} ${(isExamMode && activeSection !== sec) ? 'opacity-50 cursor-not-allowed' : ''}`}
                         disabled={isExamMode && activeSection !== sec}
                       >
                         {sec}
                       </button>
                     ))}
                  </div>

                  <div className="flex flex-1 overflow-hidden relative">
                     <div 
                       className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6" 
                       style={{ scrollbarWidth: 'thin' }}
                       onTouchStart={(e) => { setTouchEndX(null); setTouchStartX(e.targetTouches[0].clientX); }}
                       onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
                       onTouchEnd={() => {
                         if (touchStartX === null || touchEndX === null) return;
                         const distance = touchStartX - touchEndX;
                         if (distance > 50 && activeQuestionIdx < activeSectionQuestions.length - 1) setActiveQuestionIdx(prev => prev + 1);
                         if (distance < -50 && activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                         setTouchStartX(null); setTouchEndX(null);
                       }}
                     >
                        {(() => {
                           const q = activeSectionQuestions[activeQuestionIdx];
                           if (!q) return <div className="p-8 text-center text-slate-500">No questions in this section.</div>;

                           return (
                             <div className={`mx-auto w-full pb-8 ${q.context ? 'max-w-full flex flex-col lg:flex-row lg:gap-0 gap-6 h-full' : 'max-w-5xl flex flex-col'}`}>
                                {q.context && (
                                  <>
                                    <div 
                                      onDoubleClick={() => setExpandedPassageContext(expandedPassageContext === q.context ? null : (q.context || null))}
                                      className={`passage-container flex-1 lg:flex-none p-5 md:p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm md:text-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-loose overflow-y-auto ${expandedPassageContext === q.context ? 'fixed inset-2 md:inset-10 z-[9999] shadow-2xl !max-h-none !max-w-none' : 'max-h-[40vh] lg:max-h-[calc(100vh-200px)]'}`} 
                                      style={expandedPassageContext !== q.context ? (isFullscreen ? { maxHeight: 'calc(100vh - 130px)' } : {}) : {}}
                                    >
                                      {expandedPassageContext === q.context && (
                                        <div className="sticky top-0 flex justify-between items-center mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur py-3 px-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 border-b border-slate-200 dark:border-slate-700 z-10">
                                           <span className="font-bold text-[hsl(var(--accent))] flex items-center gap-2"><Maximize size={18}/> Reading Mode</span>
                                           <button onClick={() => setExpandedPassageContext(null)} className="text-slate-500 hover:text-rose-500 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><Minimize size={16}/> Close</button>
                                        </div>
                                      )}
                                      {!expandedPassageContext && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 lg:hidden flex items-center gap-1"><Maximize size={12}/> Double tap passage to expand</div>}
                                      {q.difficulty && q.id.startsWith('gen_') && (
                                        <div className="mb-4 flex items-center gap-2">
                                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                                            q.difficulty === 'Hard' ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                            q.difficulty === 'Easy' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                            'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                          }`}>
                                            Difficulty: {q.difficulty}
                                          </span>
                                        </div>
                                      )}
                                    {renderContextWithImages(q.context)}
                                  </div>
                                    <div 
                                      className="hidden lg:flex w-4 shrink-0 cursor-col-resize items-center justify-center group select-none outline-none"
                                      onMouseDown={handleDragStart}
                                      onTouchStart={handleDragStart}
                                    >
                                      <div className="w-1 h-12 bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 rounded-full transition-colors"></div>
                                    </div>
                                  </>
                                )}
                                <div className={`question-container flex-1 ${q.context ? 'lg:flex-none overflow-y-auto pr-2 pb-16 md:pb-0' : ''} flex flex-col`} style={q.context ? (isFullscreen ? { maxHeight: 'calc(100vh - 130px)' } : {}) : {}}>
                                  <div className="bg-white/60 dark:bg-white/5 p-5 md:p-6 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm mb-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="font-bold text-base md:text-lg">Question {activeQuestionIdx + 1} <span className="text-slate-400 text-xs md:text-sm font-normal">of {activeSectionQuestions.length}</span></p>
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                                  </div>
                                  <div className="font-medium mb-6 text-sm md:text-lg leading-relaxed text-slate-800 dark:text-slate-200">{renderContextWithImages(q.text)}</div>
                                  <div className="space-y-3">
                                    {q.type === 'MCQ' ? q.options?.map((opt: string, oIdx: number) => (
                                      <label key={oIdx} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAnswers[q.originalIndex] === oIdx ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5 shadow-sm' : 'border-slate-200 dark:border-slate-700 hover:border-[hsl(var(--accent))]/50 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                                        <input type="radio" name={`q-${q.originalIndex}`} checked={selectedAnswers[q.originalIndex] === oIdx} onChange={() => setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: oIdx }))} className="hidden" />
                                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAnswers[q.originalIndex] === oIdx ? 'border-[hsl(var(--accent))]' : 'border-slate-400'}`}>
                                          {selectedAnswers[q.originalIndex] === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))]"></div>}
                                        </div>
                                        <span className="text-sm md:text-base leading-relaxed">{renderContextWithImages(opt)}</span>
                                      </label>
                                    )) : (
                                      <input 
                                        type="text" 
                                        value={(selectedAnswers[q.originalIndex] as string) || ''} 
                                        onChange={(e) => setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: e.target.value }))} 
                                        className="w-full bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-lg focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" 
                                        placeholder="Type your answer here..." 
                                      />
                                    )}
                                  </div>
                                </div>
                                
                                {q.context && activeSectionQuestions[activeQuestionIdx + 1]?.context !== q.context && (
                                  <div className="w-full flex justify-center items-center gap-3 pb-6 opacity-40 select-none">
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                  </div>
                                )}

                                  <div className="mt-auto shrink-0 flex flex-col sm:flex-row justify-between gap-3 md:gap-4 pb-8 md:pb-0">
                                   <button 
                                     disabled={activeQuestionIdx === 0} 
                                     onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                     className="w-full sm:w-auto py-3 px-4 md:px-6 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all order-2 sm:order-1 text-sm md:text-base"
                                   >
                                     Previous
                                   </button>
                                   <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-4 order-1 sm:order-2 w-full sm:w-auto">
                                     <button 
                                       disabled={selectedAnswers[q.originalIndex] === undefined || selectedAnswers[q.originalIndex] === ''}
                                       onClick={() => setSelectedAnswers(prev => {
                                         const next = { ...prev };
                                         delete next[q.originalIndex];
                                         return next;
                                       })}
                                       className="px-2 md:px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-500 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-xs md:text-base"
                                     >
                                       Clear
                                     </button>
                                     <button 
                                       onClick={() => setMarkedForReview(prev => ({...prev, [q.originalIndex]: !prev[q.originalIndex]}))}
                                       className={`px-2 md:px-6 py-3 rounded-xl font-bold border-2 transition-all text-xs md:text-base ${markedForReview[q.originalIndex] ? 'border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-500 text-slate-600 dark:text-slate-400'}`}
                                     >
                                       Review
                                     </button>
                                     <button 
                                       disabled={activeQuestionIdx === activeSectionQuestions.length - 1} 
                                       onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                       className="col-span-2 sm:col-auto px-4 md:px-6 py-3 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                                     >
                                       Save & Next
                                     </button>
                                   </div>
                                  </div>
                                </div>
                             </div>
                           );
                        })()}
                     </div>

                     {/* Mobile Palette Overlay */}
                     {showMobilePalette && (
                       <div className="md:hidden absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowMobilePalette(false)}></div>
                     )}

                     <div className={`w-64 shrink-0 border-l border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-white/5 flex-col ${showMobilePalette ? 'flex absolute right-0 inset-y-0 z-[5000] shadow-2xl' : (showDesktopPalette ? 'hidden md:flex' : 'hidden md:hidden')}`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 font-bold flex justify-between items-center">
                          <span>Question Palette</span>
                          <button onClick={() => setShowMobilePalette(false)} className="md:hidden text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                           <div className="grid grid-cols-4 gap-2">
                             {(() => {
                                return activeSectionQuestions.map((q: any, idx: number) => {
                                  const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                                  const isMarked = markedForReview[q.originalIndex];
                                  const isCurrent = activeQuestionIdx === idx;
                                  
                                  let btnClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                                  if (isMarked) {
                                     if (isAnswered) {
                                        btnClass = 'bg-purple-500 border-purple-600 text-white relative overflow-hidden';
                                     } else {
                                        btnClass = 'bg-purple-500 border-purple-600 text-white';
                                     }
                                  } else if (isAnswered) {
                                     btnClass = 'bg-emerald-500 border-emerald-600 text-white';
                                  }
                                  if (isCurrent) {
                                     btnClass += ' ring-2 ring-[hsl(var(--accent))] ring-offset-2 dark:ring-offset-slate-900';
                                  }

                                  return (
                                    <button 
                                      key={idx}
                                      onClick={() => {
                                        setActiveQuestionIdx(idx);
                                        setShowMobilePalette(false);
                                      }}
                                      className={`aspect-square rounded-lg border flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${btnClass}`}
                                    >
                                      {idx + 1}
                                      {isMarked && isAnswered && (
                                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-tl-md"></div>
                                      )}
                                    </button>
                                  )
                                });
                             })()}
                           </div>
                        </div>
                        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-3 text-xs font-medium">
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600"></div> Answered</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div> Not Answered</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-purple-500 border border-purple-600"></div> Marked for Review</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-purple-500 border border-purple-600 relative overflow-hidden"><div className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-400 rounded-tl-sm"></div></div> Answered & Marked</div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
              {mockPhase === 'result' && lastTestResult && (
                <div className="flex flex-col items-center justify-center flex-1 p-8 md:p-12">
                  <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-2xl bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-lg p-8 text-center">
                    <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6 mx-auto"><Trophy size={48} /></div>
                    <h2 className="text-3xl font-black mb-2">Test Completed!</h2>
                    <p className="text-slate-500 mb-8">Here's a summary of your performance for this session.</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left mb-8 text-slate-800 dark:text-slate-200">
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Score</div><div className="text-3xl font-black">{lastTestResult.score} <span className="text-lg font-bold text-slate-400">/ {lastTestResult.total * 3}</span></div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Accuracy</div><div className="text-3xl font-black text-[hsl(var(--accent))]">{lastTestResult.accuracy}%</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Percentile</div><div className="text-3xl font-black text-blue-500">{lastTestResult.percentile ? `${lastTestResult.percentile} PR` : <Loader2 size={24} className="animate-spin mt-1" />}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Avg Peer Time</div><div className="text-3xl font-black text-indigo-500">{lastTestResult.averagePeerTime ? formatTime(lastTestResult.averagePeerTime) : <Loader2 size={24} className="animate-spin mt-1" />}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Answered</div><div className="text-3xl font-black">{lastTestResult.answered}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Correct</div><div className="text-3xl font-black text-emerald-500">{lastTestResult.correct}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Incorrect</div><div className="text-3xl font-black text-rose-500">{lastTestResult.incorrect}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Unanswered</div><div className="text-3xl font-black text-slate-500">{lastTestResult.unanswered}</div></div>
                    </div>
                    
                    <div className="mb-8 bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 text-left">
                      <h3 className="font-bold mb-4">Section Analysis</h3>
                      <div className="flex flex-col md:flex-row gap-8 items-center">
                        {(() => {
                          const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                          const totalTime = sections.reduce((sum, sec) => sum + (lastTestResult.sectionTimes?.[sec] || 0), 0);
                          const secColors = ['#10b981', '#a855f7', '#3b82f6', '#f43f5e', '#f59e0b'];
                          let cumulativePercent = 0;
                          const conicStops = totalTime > 0 ? sections.map((sec, i) => {
                            const time = lastTestResult.sectionTimes?.[sec] || 0;
                            const pct = (time / totalTime) * 100;
                            const color = hoveredSection && hoveredSection !== sec ? secColors[i % secColors.length] + '40' : secColors[i % secColors.length];
                            const stop = `${color} ${cumulativePercent}% ${cumulativePercent + pct}%`;
                            cumulativePercent += pct;
                            return stop;
                          }).join(', ') : '#cbd5e1 0% 100%';

                          return (
                            <>
                              <div className="w-48 h-48 shrink-0 rounded-full shadow-md relative flex items-center justify-center transition-all duration-500" style={{ background: `conic-gradient(${conicStops})` }}>
                                <div className="w-32 h-32 bg-[#f8fafc] dark:bg-[#020617] rounded-full flex flex-col items-center justify-center shadow-inner z-10 transition-colors">
                                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Time</span>
                                  <span className="font-mono font-black text-lg">{formatTime(totalTime)}</span>
                                </div>
                              </div>
                              <div className="space-y-2 flex-1 w-full">
                                {sections.map((sec: any, i: number) => {
                                  const time = lastTestResult.sectionTimes?.[sec] || 0;
                                  const qCount = currentTest.questions?.filter((q: any) => q.section === sec).length || 1;
                                  const avg = Math.round(time / qCount);
                                  const color = secColors[i % secColors.length];
                                  return (
                                    <div 
                                      key={sec} 
                                      onMouseEnter={() => setHoveredSection(sec)}
                                      onMouseLeave={() => setHoveredSection(null)}
                                      className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-xl transition-all cursor-default ${hoveredSection === sec ? 'bg-white/60 dark:bg-white/10 shadow-sm scale-[1.02]' : hoveredSection ? 'opacity-40' : 'hover:bg-white/40 dark:hover:bg-white/5'}`}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }}></div>
                                        <span className="font-bold text-slate-700 dark:text-slate-300">{sec}</span>
                                      </div>
                                      <div className="flex flex-wrap items-center gap-4 text-sm mt-2 sm:mt-0">
                                         <span className="text-slate-500">Total: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatTime(time)}</span></span>
                                         <span className="text-slate-500">Avg/Q: <span className="font-mono font-bold text-[hsl(var(--accent))]">{formatTime(avg)}</span></span>
                                         {lastTestResult.sectionStats?.[sec] && (
                                           <>
                                             <span className="text-slate-500 hidden xl:inline">Score: <span className="font-mono font-bold text-emerald-500">{lastTestResult.sectionStats[sec].score > 0 ? `+${lastTestResult.sectionStats[sec].score}` : lastTestResult.sectionStats[sec].score}</span></span>
                                             <span className="text-slate-500">Acc: <span className="font-mono font-bold text-blue-500">{lastTestResult.sectionStats[sec].attempted > 0 ? Math.round((lastTestResult.sectionStats[sec].correct / lastTestResult.sectionStats[sec].attempted) * 100) : 0}%</span></span>
                                           </>
                                         )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>

                    {lastTestResult.testTopicStats && Object.keys(lastTestResult.testTopicStats).length > 0 && (
                      <div className="mb-8 bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 text-left">
                        <h3 className="font-bold mb-4">Detailed Topic Analysis</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(lastTestResult.testTopicStats)
                            .sort(([, a]: any, [, b]: any) => b.score - a.score)
                            .map(([topic, stat]: any) => {
                               const acc = stat.attempted > 0 ? Math.round((stat.correct / stat.attempted) * 100) : 0;
                               return (
                                 <div key={topic} className="bg-white/60 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 hover:border-[hsl(var(--accent))]/50 transition-colors">
                                   <div className="flex justify-between items-start mb-3">
                                     <span className="font-bold text-slate-700 dark:text-slate-300 pr-2">{topic}</span>
                                     <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 ${acc < 50 && stat.attempted > 0 ? 'text-rose-500' : acc < 80 && stat.attempted > 0 ? 'text-yellow-500' : stat.attempted > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                                       {stat.attempted > 0 ? `${acc}% Acc` : 'Skipped'}
                                     </span>
                                   </div>
                                   <div className="flex justify-between text-sm text-slate-500">
                                     <span>Score: <strong className={stat.score > 0 ? 'text-emerald-500' : stat.score < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}>{stat.score > 0 ? `+${stat.score}` : stat.score}</strong></span>
                                     <span>Attempted: <strong>{stat.attempted}/{stat.total}</strong></span>
                                   </div>
                                 </div>
                               )
                            })}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                      <button onClick={() => { 
                        setMockPhase('select'); 
                        setCurrentTest(null); 
                        setSelectedAnswers({}); 
                        setLastTestResult(null); 
                        setMarkedForReview({});
                        setLiveChallengeId(null);
                        setLiveChallengeData(null);
                      }} className="border px-8 py-3 rounded-xl font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                        Back to Mock Tests
                      </button>
                      <button onClick={() => { 
                        setMockPhase('review'); 
                        const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                        setActiveSection(sections[0] || '');
                        setActiveQuestionIdx(0);
                        setReviewFilter('all');
                      }} className="border px-8 py-3 rounded-xl font-bold bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] border-[hsl(var(--accent))]/30 hover:bg-[hsl(var(--accent))] hover:text-white transition-all">
                        Review Answers
                      </button>
                      <button onClick={() => { 
                        setMockPhase('review'); 
                        const sections = Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))) as string[];
                        setActiveSection(sections[0] || '');
                        setActiveQuestionIdx(0);
                        setReviewFilter('incorrect');
                      }} className="border px-8 py-3 rounded-xl font-bold bg-rose-500/10 text-rose-500 border-rose-500/30 hover:bg-rose-500 hover:text-white transition-all">
                        Review Incorrect
                      </button>
                    </div>
                  </m.div>
                </div>
              )}
              
              {mockPhase === 'review' && currentTest && (
                <div className="flex flex-col flex-1 h-full bg-slate-50/50 dark:bg-slate-900/50">
                  <div className={`flex justify-between items-center ${isFullscreen ? 'p-2 md:p-3' : 'p-3 md:p-4'} border-b border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0 gap-2`}>
                    <h3 className={`${isFullscreen ? 'text-sm md:text-base' : 'text-base md:text-lg'} font-bold truncate flex-1 min-w-[80px] pr-2 md:pr-4`}>{currentTest.title || 'Mock Test Active'}</h3>
                    <div className="flex items-center gap-1.5 md:gap-4 overflow-x-auto scrollbar-hide shrink-0 max-w-[65%] md:max-w-none pl-2">
                      <button onClick={() => setShowMobilePalette(!showMobilePalette)} className="md:hidden bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all flex shrink-0 items-center justify-center" title="Question Palette">
                        <LayoutDashboard size={18} />
                      </button>
                      <button onClick={() => setShowDesktopPalette(!showDesktopPalette)} className="hidden md:block bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm shadow-md hover:opacity-90 active:scale-95 transition-all whitespace-nowrap">
                        {showDesktopPalette ? 'Hide Palette' : 'Show Palette'}
                      </button>
                      <button onClick={toggleFullscreen} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all flex shrink-0 items-center justify-center" title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
                        {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                      </button>
                      <select 
                        value={reviewFilter} 
                        onChange={(e) => { setReviewFilter(e.target.value as any); setActiveQuestionIdx(0); }}
                        className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium focus:outline-none focus:border-[hsl(var(--accent))] shrink-0 max-w-[120px] md:max-w-none truncate"
                      >
                        <option value="all">All Questions</option>
                        <option value="correct">Correct Only</option>
                        <option value="incorrect">Incorrect Only</option>
                        <option value="unanswered">Unanswered Only</option>
                      </select>
                      <button onClick={() => setMockPhase('result')} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2.5 md:px-5 py-1.5 md:py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-xs md:text-base whitespace-nowrap shrink-0">Back <span className="hidden md:inline">to Results</span></button>
                    </div>
                  </div>
                  
                  <div className="flex bg-white/40 dark:bg-white/5 border-b border-slate-200/50 dark:border-white/10 shrink-0 px-2 overflow-x-auto scrollbar-hide">
                     {Array.from(new Set(currentTest.questions?.map((q: any) => q.section).filter(Boolean))).map((sec: any) => (
                       <button 
                         key={sec} 
                         onClick={() => { setActiveSection(sec); setActiveQuestionIdx(0); }}
                         className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${activeSection === sec ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                       >
                         {sec}
                       </button>
                     ))}
                  </div>

                  <div className="flex flex-1 overflow-hidden relative">
                     <div 
                       className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6" 
                       style={{ scrollbarWidth: 'thin' }}
                       onTouchStart={(e) => { setTouchEndX(null); setTouchStartX(e.targetTouches[0].clientX); }}
                       onTouchMove={(e) => setTouchEndX(e.targetTouches[0].clientX)}
                       onTouchEnd={() => {
                         if (touchStartX === null || touchEndX === null) return;
                         const distance = touchStartX - touchEndX;
                         if (distance > 50 && activeQuestionIdx < filteredReviewQuestions.length - 1) setActiveQuestionIdx(prev => prev + 1);
                         if (distance < -50 && activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                         setTouchStartX(null); setTouchEndX(null);
                       }}
                     >
                        {(() => {
                           const q = filteredReviewQuestions[activeQuestionIdx];
                           if (!q) return <div className="p-8 text-center text-slate-500">No questions match the current filter in this section.</div>;

                           return (
                             <div className={`mx-auto w-full pb-8 ${q.context ? 'max-w-full flex flex-col lg:flex-row lg:gap-0 gap-6 h-full' : 'max-w-5xl flex flex-col'}`}>
                                {q.context && (
                                  <>
                                    <div 
                                      onDoubleClick={() => setExpandedPassageContext(expandedPassageContext === q.context ? null : (q.context || null))}
                                      className={`passage-container flex-1 lg:flex-none p-5 md:p-8 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm md:text-lg text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-loose overflow-y-auto ${expandedPassageContext === q.context ? 'fixed inset-2 md:inset-10 z-[9999] shadow-2xl !max-h-none !max-w-none' : 'max-h-[40vh] lg:max-h-[calc(100vh-200px)]'}`} 
                                      style={expandedPassageContext !== q.context ? (isFullscreen ? { maxHeight: 'calc(100vh - 130px)' } : {}) : {}}
                                    >
                                      {expandedPassageContext === q.context && (
                                        <div className="sticky top-0 flex justify-between items-center mb-6 bg-white/95 dark:bg-slate-800/95 backdrop-blur py-3 px-4 -mx-6 -mt-6 md:-mx-8 md:-mt-8 border-b border-slate-200 dark:border-slate-700 z-10">
                                           <span className="font-bold text-[hsl(var(--accent))] flex items-center gap-2"><Maximize size={18}/> Reading Mode</span>
                                           <button onClick={() => setExpandedPassageContext(null)} className="text-slate-500 hover:text-rose-500 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg flex items-center gap-2 text-sm font-bold transition-colors"><Minimize size={16}/> Close</button>
                                        </div>
                                      )}
                                      {!expandedPassageContext && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 lg:hidden flex items-center gap-1"><Maximize size={12}/> Double tap passage to expand</div>}
                                      {q.difficulty && q.id.startsWith('gen_') && (
                                        <div className="mb-4 flex items-center gap-2">
                                          <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-lg border ${
                                            q.difficulty === 'Hard' ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' : 
                                            q.difficulty === 'Easy' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : 
                                            'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
                                          }`}>
                                            Difficulty: {q.difficulty}
                                          </span>
                                        </div>
                                      )}
                                      {renderContextWithImages(q.context)}
                                    </div>
                                    <div 
                                      className="hidden lg:flex w-4 shrink-0 cursor-col-resize items-center justify-center group select-none outline-none"
                                      onMouseDown={handleDragStart}
                                      onTouchStart={handleDragStart}
                                    >
                                      <div className="w-1 h-12 bg-slate-300 dark:bg-slate-600 group-hover:bg-slate-400 dark:group-hover:bg-slate-500 rounded-full transition-colors"></div>
                                    </div>
                                  </>
                                )}
                                <div className={`question-container flex-1 ${q.context ? 'lg:flex-none overflow-y-auto pr-2 pb-16 md:pb-0' : ''} flex flex-col`} style={q.context ? (isFullscreen ? { maxHeight: 'calc(100vh - 130px)' } : {}) : {}}>
                                  <div className="bg-white/60 dark:bg-white/5 p-5 md:p-6 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm mb-6">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="font-bold text-base md:text-lg">Question {activeQuestionIdx + 1} <span className="text-slate-400 text-xs md:text-sm font-normal">of {filteredReviewQuestions.length}</span></p>
                                    <span className="text-[10px] md:text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                                  </div>
                                  <div className="font-medium mb-6 text-sm md:text-lg leading-relaxed text-slate-800 dark:text-slate-200">{renderContextWithImages(q.text)}</div>
                                  <div className="space-y-3">
                                    {q.type === 'MCQ' ? q.options?.map((opt: string, oIdx: number) => {
                                      const isSelected = selectedAnswers[q.originalIndex] === oIdx;
                                      const isCorrect = q.correct === oIdx;
                                      let borderClass = 'border-slate-200 dark:border-slate-700';
                                      let bgClass = '';
                                      if (isCorrect) {
                                        borderClass = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
                                      } else if (isSelected && !isCorrect) {
                                        borderClass = 'border-rose-500 bg-rose-50 dark:bg-rose-900/20';
                                      } else if (!isSelected && !isCorrect) {
                                        borderClass = 'border-slate-200 dark:border-slate-700 opacity-50 hover:opacity-100';
                                      }

                                      return (
                                        <div key={oIdx} className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-xl border-2 text-sm md:text-base transition-all ${borderClass} ${bgClass}`}>
                                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? (isCorrect ? 'border-emerald-500' : 'border-rose-500') : (isCorrect ? 'border-emerald-500' : 'border-slate-400')}`}>
                                            {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>}
                                          </div>
                                          <span className="text-sm md:text-base leading-relaxed">{renderContextWithImages(opt)}</span>
                                          {isCorrect && <span className="ml-auto text-emerald-500 font-bold text-sm hidden sm:inline">Correct</span>}
                                          {isSelected && !isCorrect && <span className="ml-auto text-rose-500 font-bold text-sm hidden sm:inline">Your Answer</span>}
                                        </div>
                                      )
                                    }) : (
                                      <div>
                                        <input 
                                          type="text" 
                                          disabled
                                          value={(selectedAnswers[q.originalIndex] as string) || ''} 
                                          className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-lg focus:outline-none transition-colors" 
                                          placeholder="Not answered" 
                                        />
                                        <div className={`mt-3 font-bold ${String(selectedAnswers[q.originalIndex] || '').trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase() ? 'text-emerald-500' : 'text-rose-500'}`}>
                                           Correct Answer: {q.tita_answer}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                  {q.context && filteredReviewQuestions[activeQuestionIdx + 1]?.context !== q.context && (
                                    <div className="w-full flex justify-center items-center gap-3 pb-6 opacity-40 select-none">
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></div>
                                    </div>
                                  )}

                                  <div className="mt-auto shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4 pb-8 md:pb-0">
                                   <div className="flex items-center gap-2 w-full sm:w-auto">
                                     {taggedQuestions[q.id] ? (
                                       <div className="bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] px-4 py-2 rounded-lg font-bold text-sm border border-[hsl(var(--accent))]/20">
                                         Flagged as: {taggedQuestions[q.id]}
                                       </div>
                                     ) : (
                                       <>
                                         <input 
                                           type="text" 
                                           placeholder="Flag topic (e.g. Algebra)" 
                                           className="flex-1 sm:w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
                                           onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleTagTopic(q, e.currentTarget.value);
                                           }}
                                         />
                                         <button 
                                            onClick={(e) => {
                                              const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                              handleTagTopic(q, input.value);
                                            }}
                                            className="bg-[hsl(var(--accent))] text-white px-4 py-2 rounded-lg font-bold text-sm hover:opacity-90 transition-colors"
                                         >
                                           Flag
                                         </button>
                                       </>
                                     )}
                                   </div>
                                   <div className="flex gap-3 md:gap-4 w-full sm:w-auto">
                                     <button 
                                       disabled={activeQuestionIdx === 0} 
                                       onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                       className="flex-1 sm:flex-none py-2.5 px-6 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                                     >
                                       Previous
                                     </button>
                                     <button 
                                       disabled={activeQuestionIdx === filteredReviewQuestions.length - 1} 
                                       onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                       className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
                                     >
                                       Next
                                     </button>
                                   </div>
                                  </div>
                                </div>
                             </div>
                           );
                        })()}
                     </div>

                     {/* Mobile Palette Overlay */}
                     {showMobilePalette && (
                       <div className="md:hidden absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-40" onClick={() => setShowMobilePalette(false)}></div>
                     )}

                     <div className={`w-64 shrink-0 border-l border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-white/5 flex-col ${showMobilePalette ? 'flex absolute right-0 inset-y-0 z-[5000] shadow-2xl' : 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 font-bold flex justify-between items-center">
                          <span>Question Palette</span>
                          <button onClick={() => setShowMobilePalette(false)} className="md:hidden text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                           <div className="grid grid-cols-4 gap-2">
                             {(() => {
                                return filteredReviewQuestions.map((q: any, idx: number) => {
                                  const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                                  let isCorrect = false;
                                  if (isAnswered) {
                                    if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
                                    else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                                  }
                                  const isCurrent = activeQuestionIdx === idx;
                                  
                                  let btnClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400';
                                  if (isAnswered) {
                                     btnClass = isCorrect ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-rose-500 border-rose-600 text-white';
                                  }
                                  if (isCurrent) {
                                     btnClass += ' ring-2 ring-[hsl(var(--accent))] ring-offset-2 dark:ring-offset-slate-900';
                                  }

                                  return (
                                    <button 
                                      key={idx}
                                      onClick={() => {
                                        setActiveQuestionIdx(idx);
                                        setShowMobilePalette(false);
                                      }}
                                      className={`aspect-square rounded-lg border flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${btnClass}`}
                                    >
                                      {activeSectionQuestions.findIndex((sq: any) => sq.originalIndex === q.originalIndex) + 1}
                                    </button>
                                  )
                                });
                             })()}
                           </div>
                        </div>
                        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-3 text-xs font-medium">
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-600"></div> Correct</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-rose-500 border border-rose-600"></div> Incorrect</div>
                           <div className="flex items-center gap-3"><div className="w-4 h-4 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"></div> Not Answered</div>
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'mock' && (
            <MockExamCenter />
          )}

          {activeTab === 'practice' && (
            <PracticeArena />
          )}

          {activeTab === 'formula' && (
            <StudyHub />
          )}


        </div>
      </main>

      {/* Submit Summary Modal */}
      <AnimatePresence>
        {showSubmitSummary && currentTest && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[7000] flex items-center justify-center">
            <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-6 md:p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Submit Test</h3>
                <button onClick={() => setShowSubmitSummary(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Total Questions:</span>
                  <span className="font-bold text-lg">{currentTest.questions?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><div className="w-3 h-3 rounded bg-emerald-500"></div> Answered:</span>
                  <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{currentTest.questions?.filter((q: any) => selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '').length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><div className="w-3 h-3 rounded bg-purple-500"></div> Marked for Review:</span>
                  <span className="font-bold text-lg text-purple-600 dark:text-purple-400">{currentTest.questions?.filter((q: any) => markedForReview[q.originalIndex]).length || 0}</span>
                </div>
                <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-3 text-slate-600 dark:text-slate-400 font-medium"><div className="w-3 h-3 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600"></div> Not Answered:</span>
                  <span className="font-bold text-lg">{currentTest.questions?.filter((q: any) => selectedAnswers[q.originalIndex] === undefined || selectedAnswers[q.originalIndex] === '').length || 0}</span>
                </div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setShowSubmitSummary(false)} className="py-3 flex-1 font-bold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Resume</button>
                <button onClick={() => { setShowSubmitSummary(false); handleSubmitMock(); }} className="py-3 flex-1 font-bold text-white rounded-xl shadow-lg bg-[hsl(var(--accent))] hover:scale-105 active:scale-95 transition-all">Confirm Submit</button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[7000] flex items-center justify-center">
            <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Sign In</h3>
                <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <p className="text-slate-500 mb-8 leading-relaxed">Sign in to securely sync your CAT prep progress, Elo ratings, and custom flashcards across all your devices.</p>
              <button onClick={handleAuth} disabled={isAuthenticating} className="w-full flex items-center justify-center gap-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm font-bold">
                {isAuthenticating ? <Loader2 className="animate-spin" /> : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
              <div className="mt-6 text-center text-xs text-slate-500">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Cloud Sync Loading Overlay */}
      <AnimatePresence>
        {isCloudSyncing && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[9000] flex items-center justify-center">
            <div className="flex flex-col items-center text-center p-8 bg-white/10 dark:bg-slate-900/50 rounded-3xl border border-white/20 shadow-2xl">
              <Loader2 size={48} className="animate-spin text-[hsl(var(--accent))] mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Syncing Cloud Data</h3>
              <p className="text-slate-300 text-sm max-w-xs">Please wait while we securely retrieve your progress and configurations...</p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <ConfirmationModal 
        isOpen={!!pendingUnfinishedTest}
        title="Unfinished Test Found"
        message="You have an unfinished mock test saved locally. Would you like to resume it where you left off?"
        confirmText="Resume Test"
        cancelText="Discard"
        onConfirm={() => {
          setCurrentTest(pendingUnfinishedTest.currentTest);
          setSelectedAnswers(pendingUnfinishedTest.selectedAnswers || {});
          setMarkedForReview(pendingUnfinishedTest.markedForReview || {});
          setTimeLeft(pendingUnfinishedTest.timeLeft || 7200);
          setActiveSection(pendingUnfinishedTest.activeSection || '');
          setActiveQuestionIdx(pendingUnfinishedTest.activeQuestionIdx || 0);
          setSectionTimes(pendingUnfinishedTest.sectionTimes || {});
          setPendingUnfinishedTest(null);
          setIsPaused(true);
          setMockPhase('test');
        }}
        onCancel={() => {
          localStorage.removeItem('cat-maester-active-test');
          setPendingUnfinishedTest(null);
        }}
      />

      <ConfirmationModal 
        isOpen={showClearHistoryConfirmationModal}
        title="Clear All Progress & Saved Tests"
        message="Are you sure you want to clear your entire progress history, including all saved offline tests and unfinished attempts? This action cannot be undone."
        confirmText="Clear Everything"
        isDestructive={true}
        onConfirm={async () => { 
          clearHistory(); 
          localStorage.removeItem('cat-maester-active-test');
          setPendingUnfinishedTest(null);
          try {
            const db = await initDB();
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            setSavedTests([]);
          } catch(e) {}
          setShowClearHistoryConfirmationModal(false); 
        }}
        onCancel={() => setShowClearHistoryConfirmationModal(false)}
      />

      <ConfirmationModal 
        isOpen={!!formulaToDelete}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard?"
        confirmText="Delete"
        isDestructive={true}
        onConfirm={async () => {
          if (formulaToDelete) {
            await deleteFormula(formulaToDelete);
            setFormulas(formulas.filter(form => form.id !== formulaToDelete));
            setFormulaToDelete(null);
          }
        }}
        onCancel={() => setFormulaToDelete(null)}
      />

      <ActivationModal
        isOpen={showActivationModal}
        error={activationError}
        onClose={() => {
          setShowActivationModal(false);
          setActivationError('');
        }}
        onActivate={(key) => {
          if (key === 'p@ssw0rd') {
            setActivated();
            setActivationError('');
            setShowActivationModal(false);
          } else {
            setActivationError('Invalid activation key. Please try again.');
          }
        }}
      />
    </m.div>
  );
}