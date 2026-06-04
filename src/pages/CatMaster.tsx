import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, PenTool, Bot, Book, LogIn, LogOut, BrainCircuit, Trophy, Loader2, X, Edit2, Trash2, Search, PlayCircle, Timer, Bookmark, Sun, Moon, Monitor, Share2, Volume2, VolumeX } from 'lucide-react';
import { useCatStore } from './catStore';
import { paperLoaders, getPracticeQuestionsBySection, getAllQuestions, type Question } from '../data/cat_db';

// --- IndexedDB Helpers ---
const DB_NAME = 'CatMasterDB';
const STORE_NAME = 'mockTests';
const FORMULA_STORE = 'formulas';

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(FORMULA_STORE)) {
        db.createObjectStore(FORMULA_STORE, { keyPath: 'id' });
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

// --- Latex Helper ---
const renderLatex = (text: string) => {
  if (!text) return '';
  if (!(window as any).katex) return text.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$)/g);
  return parts.map(part => {
    if (part.startsWith('$$') && part.endsWith('$$')) {
      try { return (window as any).katex.renderToString(part.slice(2, -2), { displayMode: true, throwOnError: false }); } catch(e) { return part; }
    } else if (part.startsWith('$') && part.endsWith('$')) {
      try { return (window as any).katex.renderToString(part.slice(1, -1), { displayMode: false, throwOnError: false }); } catch(e) { return part; }
    }
    return part.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
  }).join('');
};

// --- Flashcard Component ---
const Flashcard = ({ formula, onEdit, onDelete, onUpdate }: { formula: any, onEdit: () => void, onDelete: () => void, onUpdate: (f: any) => void }) => {
  const [flipped, setFlipped] = useState(false);
  
  const handleRate = (e: React.MouseEvent, performance: number) => {
    e.stopPropagation();
    let { reps = 0, interval = 1, ease = 2.5 } = formula;
    if (performance >= 3) {
      if (reps === 0) interval = 1;
      else if (reps === 1) interval = 6;
      else interval = Math.round(interval * ease);
      reps += 1;
      ease = ease + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
    } else {
      reps = 0;
      interval = 1;
      ease = Math.max(1.3, ease - 0.2);
    }
    const nextReview = Date.now() + interval * 86400000;
    onUpdate({ ...formula, reps, interval, ease, nextReview, lastPerformance: performance });
    setFlipped(false);
  };

  const isDue = !formula.nextReview || formula.nextReview <= Date.now();
  const mastery = formula.reps > 4 ? 'Mastered' : formula.reps > 0 ? 'Learning' : 'New';

  return (
    <div className="relative w-full h-64 cursor-pointer group" style={{ perspective: '1000px' }} onClick={() => setFlipped(!flipped)}>
      <div className="absolute top-4 right-4 flex gap-2 z-10 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-500 hover:text-[hsl(var(--accent))] bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/10 transition-colors"><Edit2 size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-500 hover:text-rose-500 bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/10 transition-colors"><Trash2 size={16} /></button>
      </div>
      <div className="absolute top-4 left-4 z-10 flex gap-2">
         <span className={`text-xs font-bold px-2 py-1 rounded ${mastery === 'Mastered' ? 'bg-emerald-500/20 text-emerald-500' : mastery === 'Learning' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-rose-500/20 text-rose-500'}`}>{mastery}</span>
         {isDue && <span className="text-xs font-bold px-2 py-1 rounded bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]">Due</span>}
         {formula.isOfficial && <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">Official</span>}
      </div>
      <m.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl flex flex-col justify-center items-center p-6 text-center" style={{ backfaceVisibility: 'hidden' }}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: renderLatex(formula.front) }} />
          {formula.topic && <div className="absolute bottom-5 text-xs font-bold text-slate-400 uppercase tracking-wider">{formula.topic}</div>}
        </div>
        {/* Back */}
        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-sm bg-[hsl(var(--accent))] border-[hsl(var(--accent))] flex flex-col justify-between items-center p-6 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="flex-1 flex items-center justify-center text-lg font-medium text-white" dangerouslySetInnerHTML={{ __html: renderLatex(formula.back) }} />
          <div className="flex gap-2 w-full mt-4">
             <button onClick={(e) => handleRate(e, 1)} className="flex-1 bg-rose-500/20 hover:bg-rose-500/40 text-white py-2 rounded-lg text-sm font-bold transition-colors">Hard</button>
             <button onClick={(e) => handleRate(e, 3)} className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/40 text-white py-2 rounded-lg text-sm font-bold transition-colors">Good</button>
             <button onClick={(e) => handleRate(e, 5)} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 text-white py-2 rounded-lg text-sm font-bold transition-colors">Easy</button>
          </div>
        </div>
      </m.div>
    </div>
  );
};
// -------------------------

export default function CatMaster() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [paperList, setPaperList] = useState<{id: string, title: string}[]>([]);
  
  // Zustand Global State
  const { user, progress, login, logout, addResult, addTopicResult, toggleBookmark, clearHistory, updateSkillRating } = useCatStore();
  
  // Mock State
  const [mockPhase, setMockPhase] = useState<'select' | 'confirm' | 'test' | 'result' | 'review'>('select');
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
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [newFormula, setNewFormula] = useState({ front: '', back: '' });
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [practiceSubject, setPracticeSubject] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceFilterTopic, setPracticeFilterTopic] = useState<string | null>(null);
  const [practiceFilterBookmark, setPracticeFilterBookmark] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number | string>>({});
  const [formulaSearch, setFormulaSearch] = useState('');
  const [formulaTopicFilter, setFormulaTopicFilter] = useState('All');
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [qotd, setQotd] = useState<Question | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('cat-master-theme') as 'light' | 'dark' | 'system') || 'system'
  );
  const [isAdaptive, setIsAdaptive] = useState(false);
  const [questionRatings, setQuestionRatings] = useState<Record<string, number>>(() => {
    try { const saved = localStorage.getItem('cat-master-question-ratings'); return saved ? JSON.parse(saved) : {}; } 
    catch { return {}; }
  });
  const [, setKatexLoaded] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

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
      const savedStateJSON = localStorage.getItem('cat-master-active-test');
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
          setIsPaused(true);
          setMockPhase('test');
        } else {
          localStorage.removeItem('cat-master-active-test');
        }
      }
    } catch (e) {
      console.error("Failed to load saved test state", e);
      localStorage.removeItem('cat-master-active-test');
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

  const updateQuestionRating = (questionId: string, userRating: number, isCorrect: boolean) => {
    const questionRating = questionRatings[questionId] || 1200;
    const K = 32;
    const expectedScoreForUser = 1 / (1 + Math.pow(10, (questionRating - userRating) / 400));
    const actualScoreForUser = isCorrect ? 1 : 0;
    
    const ratingChange = K * (actualScoreForUser - expectedScoreForUser);
    const newQuestionRating = Math.round(questionRating - ratingChange);
    
    setQuestionRatings(prev => {
      const newRatings = { ...prev, [questionId]: newQuestionRating };
      localStorage.setItem('cat-master-question-ratings', JSON.stringify(newRatings));
      return newRatings;
    });
  };

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
      // Auto-submit triggers when timer expires, evaluating the exact final score using the latest render scope's answers
      handleSubmitMock();
    }
    return () => clearInterval(timer);
  }, [mockPhase, timeLeft, activeSection, isPaused, isSoundEnabled]);

  useEffect(() => {
    if (mockPhase === 'test' && currentTest) {
      const activeTestData = {
        currentTest,
        selectedAnswers,
        markedForReview,
        timeLeft,
        activeSection,
        activeQuestionIdx,
        sectionTimes,
      };
      localStorage.setItem('cat-master-active-test', JSON.stringify(activeTestData));
    } else if (mockPhase !== 'test') {
      localStorage.removeItem('cat-master-active-test');
    }
  }, [mockPhase, currentTest, selectedAnswers, markedForReview, timeLeft, activeSection, activeQuestionIdx, sectionTimes]);

  useEffect(() => {
    const fetchPracticeQuestions = async () => {
      if (practiceFilterTopic) {
        const allQs = await getAllQuestions();
        const topicQIds = progress.topicStats?.[practiceFilterTopic]?.questionIds || [];
        setPracticeQuestions(allQs.filter(q => topicQIds.includes(q.id)));
      } else if (practiceFilterBookmark) {
        const allQs = await getAllQuestions();
        const bookmarkedIds = progress.bookmarkedQuestions || [];
        setPracticeQuestions(allQs.filter(q => bookmarkedIds.includes(q.id)));
      } else if (isAdaptive) {
        const allQs = await getAllQuestions();
        const subjectQs = allQs.filter(q => q.section === practiceSubject);
        const userRating = progress.skillRatings?.[practiceSubject] || 1200;
        const ratedQs = subjectQs.map(q => ({
          ...q,
          rating: questionRatings[q.id] || 1200,
        }));

        ratedQs.sort((a, b) => Math.abs(a.rating - userRating) - Math.abs(b.rating - userRating));

        const selectedQs = ratedQs.slice(0, 20).sort(() => 0.5 - Math.random());
        setPracticeQuestions(selectedQs);
      } else {
        const questions = await getPracticeQuestionsBySection(practiceSubject);
        setPracticeQuestions(questions.slice(0, 20));
      }
      setPracticeAnswers({});
    };
    if (activeTab === 'practice') {
      fetchPracticeQuestions();
    }
  }, [activeTab, practiceSubject, practiceFilterTopic, practiceFilterBookmark, progress.topicStats, progress.bookmarkedQuestions, isAdaptive, progress.skillRatings, questionRatings]);

  useEffect(() => {
    const fetchQotd = async () => {
      const allQs = await getAllQuestions();
      if (allQs.length > 0) {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const randomIdx = seed % allQs.length;
        setQotd(allQs[randomIdx]);
      }
    };
    fetchQotd();
  }, []);

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
    localStorage.setItem('cat-master-theme', theme);

    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeTab === 'practice') {
        const activeTag = document.activeElement?.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        
        if (e.key === '1') {
          setPracticeSubject('QA'); setPracticeFilterTopic(null); setPracticeFilterBookmark(false);
        } else if (e.key === '2') {
          setPracticeSubject('VARC'); setPracticeFilterTopic(null); setPracticeFilterBookmark(false);
        } else if (e.key === '3') {
          setPracticeSubject('DILR'); setPracticeFilterTopic(null); setPracticeFilterBookmark(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

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

  const handleAuth = () => {
    setIsAuthenticating(true);
    setTimeout(() => {
      login('Aspirant');
      setIsAuthenticating(false);
      setIsAuthOpen(false);
    }, 1500);
  };

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

  const handleStartPastPaper = async (paperId: string) => {
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

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const challengeId = params.get('challenge');
    if (challengeId && paperLoaders[challengeId]) {
      setActiveTab('mock');
      handleStartPastPaper(challengeId);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search]); 

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
    setTimeLeft(7200);
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
    if (currentTest) {
      currentTest.questions?.forEach((q: any, idx: number) => {
        const answer = selectedAnswers[idx];
        if (answer !== undefined && String(answer).trim() !== '') {
          answeredCount++;
          let isCorrect = false;
          if (q.type === 'MCQ') {
            if (answer === q.correct) { score++; isCorrect = true; }
          } else {
            if (String(answer).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase()) { score++; isCorrect = true; }
          }
          
          if (!isCorrect) {
            const front = `[Auto-Generated]\n\nQ: ${q.text}`;
            const correctAnsStr = q.type === 'MCQ' ? q.options?.[q.correct as number] : q.tita_answer;
            const back = `Correct Answer: ${correctAnsStr}\n\nExplanation:\n${q.explanation}`;
            saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
          }
        }
      });

      const totalQuestions = currentTest.questions?.length || 0;
      const incorrectCount = answeredCount - score;
      const unansweredCount = totalQuestions - answeredCount;
      const accuracy = answeredCount > 0 ? Math.round((score / answeredCount) * 100) : 0;
      const timeTaken = 7200 - timeLeft;

      setLastTestResult({
        score,
        total: totalQuestions,
        answered: answeredCount,
        correct: score,
        incorrect: incorrectCount,
        unanswered: unansweredCount,
        accuracy,
        sectionTimes,
      });

      setMockPhase('result');
      addResult(answeredCount, score);

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

  const formulaTopics = ['All', 'Custom (Mine)', ...Array.from(new Set(formulas.filter(f => f.isOfficial).map(f => f.topic)))];

  const filteredFormulas = formulas.filter(f => {
    const matchesSearch = f.front.toLowerCase().includes(formulaSearch.toLowerCase()) || f.back.toLowerCase().includes(formulaSearch.toLowerCase());
    if (!matchesSearch) return false;
    if (formulaTopicFilter === 'All') return true;
    if (formulaTopicFilter === 'Custom (Mine)') return !f.isOfficial;
    return f.topic === formulaTopicFilter;
  });

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[1000] flex bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden font-sans"
    >
      {/* Sidebar */}
      <nav className="w-20 md:w-64 bg-white/60 dark:bg-white/5 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/10 flex flex-col justify-between shrink-0 print:hidden">
        <div>
          <div className="p-4 md:p-6">
            <button onClick={() => navigate('/tools')} className="flex items-center gap-2 text-slate-500 hover:text-[hsl(var(--accent))] transition-colors mb-6 text-[10px] md:text-xs font-bold tracking-widest uppercase">
              <ArrowLeft size={16} /> <span className="hidden md:inline">Back to Tools</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-[hsl(var(--accent))] text-white p-2 rounded-xl shadow-lg shadow-[hsl(var(--accent))]/30">
                <Book size={24} />
              </div>
              <div className="font-bold tracking-widest text-lg hidden md:block cursor-default">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">JAZDOT</span>
                <span style={{ color: 'hsl(var(--accent))' }}>.</span> <span className="text-slate-800 dark:text-white text-sm ml-1">CAT</span>
              </div>
            </div>
          </div>
          
          <div className="px-3 mt-4 space-y-2">
            {[
              { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
              { id: 'practice', icon: PenTool, label: 'Practice Subjects' },
              { id: 'mock', icon: Bot, label: 'AI Mock Tests' },
              { id: 'formula', icon: Book, label: 'Formula Hub' }
            ].map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${activeTab === item.id ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] font-semibold' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5'}`}>
                <item.icon size={20} />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-200/50 dark:border-white/10 space-y-4">
          <button onClick={() => user ? logout() : setIsAuthOpen(true)} className="w-full flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors">
            {user ? <LogOut size={20} /> : <LogIn size={20} />}
            <span className="hidden md:inline font-medium">{user ? 'Log Out' : 'Log In'}</span>
          </button>
        </div>
        <div className="p-2 md:p-4 border-t border-slate-200/50 dark:border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-around gap-1 md:gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button onClick={() => setTheme('light')} title="Light Mode" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Sun size={16} /></button>
            <button onClick={() => setTheme('system')} title="System Preference" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Monitor size={16} /></button>
            <button onClick={() => setTheme('dark')} title="Dark Mode" className={`p-2 rounded-md text-sm font-medium transition-colors ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow-sm text-[hsl(var(--accent))]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}><Moon size={16} /></button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 p-4 sticky top-0 z-10 flex justify-between items-center px-6 print:hidden">
          <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md py-2 px-4 rounded-full border border-slate-200/50 dark:border-white/10">
            <div className="text-sm font-medium"><span className="text-slate-500">Accuracy: </span><span className="text-[hsl(var(--accent))] font-bold">{accuracy}%</span></div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <div className="text-sm font-medium"><span className="text-slate-500">Tests: </span><span className="text-[hsl(var(--accent))] font-bold">{progress.testsCompleted}</span></div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full flex-1 flex flex-col">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 flex flex-col items-center shadow-sm">
                  <h3 className="text-lg font-bold mb-4 w-full text-left">Performance Overview</h3>
                  {/* Zero Dependency SVG Donut Chart */}
                  <svg viewBox="0 0 36 36" className="w-40 h-40 circular-chart text-emerald-500 drop-shadow-md">
                    <path className="text-rose-500 stroke-current stroke-[3]" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="stroke-current stroke-[3] transition-all duration-1000 ease-out" fill="none" strokeDasharray={`${accuracy}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  </svg>
                  <div className="mt-6 flex gap-6 text-sm font-bold">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Correct</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> Incorrect</span>
                  </div>
                </div>
                
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">Quick Stats</h3>
                    <button onClick={() => { if(confirm('Are you sure you want to clear your entire history?')) clearHistory(); }} className="text-xs font-bold text-rose-500 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors border border-rose-500/20">Clear History</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 h-[calc(100%-2rem)]">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center shadow-inner"><div className="text-slate-500 mb-2 text-sm font-medium uppercase tracking-wider">Attempted</div><div className="text-4xl font-black">{progress.totalAttempted}</div></div>
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/5 flex flex-col justify-center shadow-inner"><div className="text-slate-500 mb-2 text-sm font-medium uppercase tracking-wider">Correct</div><div className="text-4xl font-black text-emerald-500">{progress.correct}</div></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Subject Mastery</h3>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold opacity-80">Quantitative Ability (QA)</span><span className="text-[hsl(var(--accent))] font-bold">75%</span></div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: '75%' }} transition={{ duration: 1, delay: 0.2 }} className="bg-[hsl(var(--accent))] h-full rounded-full shadow-[0_0_10px_hsl(var(--accent))]"></m.div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold opacity-80">Verbal Ability (VARC)</span><span className="text-purple-500 font-bold">60%</span></div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: '60%' }} transition={{ duration: 1, delay: 0.3 }} className="bg-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]"></m.div></div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2"><span className="font-bold opacity-80">Data Interpretation (DILR)</span><span className="text-emerald-500 font-bold">85%</span></div>
                      <div className="w-full bg-black/10 dark:bg-white/10 rounded-full h-2.5 overflow-hidden"><m.div initial={{ width: 0 }} animate={{ width: '85%' }} transition={{ duration: 1, delay: 0.4 }} className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"></m.div></div>
                    </div>
                  </div>
                </div>
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-6">Recent Activity</h3>
                  <div className="space-y-5">
                    <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div><div className="flex-1"><p className="text-sm font-bold">Mock Test 4</p><p className="text-slate-500 text-xs mt-0.5">Score: 42/45</p></div><span className="text-xs font-mono text-slate-400">2h ago</span></div>
                    <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))] shadow-[0_0_8px_hsl(var(--accent))]"></div><div className="flex-1"><p className="text-sm font-bold">QA Practice</p><p className="text-slate-500 text-xs mt-0.5">15 questions</p></div><span className="text-xs font-mono text-slate-400">1d ago</span></div>
                    <div className="flex items-center gap-4"><div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></div><div className="flex-1"><p className="text-sm font-bold">DILR Mock</p><p className="text-slate-500 text-xs mt-0.5">Score: 28/30</p></div><span className="text-xs font-mono text-slate-400">2d ago</span></div>
                  </div>
                </div>
              </div>

              {qotd && (
                <div className="mt-6 bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-[hsl(var(--accent))]/30 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--accent))]/10 rounded-bl-full pointer-events-none"></div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><BrainCircuit className="text-[hsl(var(--accent))]" size={20} /> Question of the Day</h3>
                  <div className="mb-4 flex gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{qotd.section}</span>
                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{qotd.type}</span>
                  </div>
                  <p className="font-medium text-lg mb-6 max-w-4xl">{qotd.text}</p>
                  <button onClick={() => {
                    setPracticeSubject((qotd.section as 'QA' | 'VARC' | 'DILR') || 'QA');
                    setPracticeFilterTopic(null);
                    setPracticeFilterBookmark(false);
                    setActiveTab('practice');
                  }} className="text-sm font-bold bg-[hsl(var(--accent))] text-white px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-all">
                    Solve in Practice Mode
                  </button>
                </div>
              )}

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Progress Over Time (Accuracy %)</h3>
                  {progress.history && progress.history.length > 0 ? (
                    <div className="h-40 flex items-end gap-2 w-full mt-4">
                      {progress.history.slice(-30).map((h, i) => {
                        const acc = h.attempted > 0 ? Math.round((h.correct / h.attempted) * 100) : 0;
                        return (
                          <div key={i} className="flex-1 bg-[hsl(var(--accent))]/40 hover:bg-[hsl(var(--accent))]/80 rounded-t-md relative group transition-all" style={{ height: `${Math.max(acc, 5)}%` }}>
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-lg">
                               {acc}% ({new Date(h.date).toLocaleDateString()})
                             </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-slate-500">Take some tests to see your progress!</div>
                  )}
                </div>
                
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                  <h3 className="text-lg font-bold mb-4">Topic Performance</h3>
                  {progress.topicStats && Object.keys(progress.topicStats).length > 0 ? (
                    <div className="space-y-4 max-h-40 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                      {Object.entries(progress.topicStats)
                        .map(([topic, stat]) => ({ topic, acc: Math.round((stat.correct / stat.attempted) * 100) }))
                        .sort((a, b) => a.acc - b.acc)
                        .map(t => (
                          <div 
                            key={t.topic}
                            className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -mx-2 rounded-lg transition-colors group"
                            onClick={() => {
                              setPracticeFilterTopic(t.topic);
                              setActiveTab('practice');
                            }}
                          >
                            <div className="flex justify-between text-sm mb-1"><span className="font-medium text-slate-700 dark:text-slate-300 group-hover:text-[hsl(var(--accent))] transition-colors">{t.topic}</span><span className={`font-bold ${t.acc < 50 ? 'text-rose-500' : t.acc < 80 ? 'text-yellow-500' : 'text-emerald-500'}`}>{t.acc}%</span></div>
                            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <m.div initial={{ width: 0 }} animate={{ width: `${t.acc}%` }} className={`h-full rounded-full ${t.acc < 50 ? 'bg-rose-500' : t.acc < 80 ? 'bg-yellow-500' : 'bg-emerald-500'}`}></m.div>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-center text-slate-500 px-4 text-sm">Flag questions to specific topics during review to identify your weak areas here!</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mock' && (
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col flex-1 min-h-[600px] lg:h-[calc(100vh-12rem)]">
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
                            <button onClick={(e) => { e.stopPropagation(); const url = new URL(window.location.href); url.searchParams.set('challenge', paper.id); navigator.clipboard.writeText(url.toString()); alert('Challenge URL copied to clipboard!'); }} className="w-full flex items-center justify-center gap-2 bg-purple-500/10 text-purple-500 hover:bg-purple-500 hover:text-white px-4 py-2 rounded-lg font-bold transition-colors">
                              <Share2 size={18} /> Challenge Friend
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {savedTests.length > 0 && (
                    <div className="p-8 flex flex-col flex-1 bg-black/5 dark:bg-white/5">
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Book size={24} className="text-[hsl(var(--accent))]" /> Saved Offline Tests</h3>
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
              {mockPhase === 'confirm' && currentTest && (
                <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
                   <h2 className="text-3xl font-black mb-4">{currentTest.title}</h2>
                   <p className="text-slate-500 mb-8 max-w-lg">
                     You are about to start this mock test. The test contains {currentTest.questions?.length || 0} questions and you will have 120 minutes to complete it. Ensure you have a stable connection and are ready to begin.
                   </p>
                   <div className="flex gap-4">
                     <button onClick={() => setMockPhase('select')} className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                     <button onClick={startConfirmedTest} className="px-8 py-3 rounded-xl font-bold bg-[hsl(var(--accent))] text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Begin Test</button>
                   </div>
                </div>
              )}
              {mockPhase === 'test' && currentTest && (
                <div className="flex flex-col flex-1 h-full bg-slate-50/50 dark:bg-slate-900/50 relative">
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
                  <div className="flex justify-between items-center p-4 border-b border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0">
                    <h3 className="text-lg font-bold truncate pr-4">{currentTest.title || 'Mock Test Active'}</h3>
                    <div className="flex items-center gap-2 md:gap-4">
                      <button onClick={() => setShowMobilePalette(!showMobilePalette)} className="md:hidden bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm">Palette</button>
                      <button onClick={() => setIsSoundEnabled(!isSoundEnabled)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 p-2 rounded-lg shadow-md hover:opacity-90 active:scale-95 transition-all hidden sm:block" title={isSoundEnabled ? "Mute Timer" : "Unmute Timer"}>
                        {isSoundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                      </button>
                      <button onClick={() => setIsPaused(true)} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm hidden lg:block">Pause</button>
                      <div className={`font-mono bg-slate-100 dark:bg-slate-800 px-2 md:px-3 py-1.5 rounded-lg font-bold text-sm md:text-lg flex items-center gap-1 md:gap-2 ${timeLeft < 300 ? 'text-rose-500' : 'text-[hsl(var(--accent))]'}`}>
                         <Timer size={18} /> {formatTime(timeLeft)}
                      </div>
                      <button onClick={() => setShowSubmitSummary(true)} className="bg-[hsl(var(--accent))] text-white px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm md:text-base">Submit</button>
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
                         const sectionQuestionsLength = currentTest.questions?.filter((q: any) => q.section === activeSection).length || 0;
                         if (distance > 50 && activeQuestionIdx < sectionQuestionsLength - 1) setActiveQuestionIdx(prev => prev + 1);
                         if (distance < -50 && activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                         setTouchStartX(null); setTouchEndX(null);
                       }}
                     >
                        {(() => {
                           const sectionQuestions = currentTest.questions?.map((q: any, i: number) => ({...q, originalIndex: i})).filter((q: any) => q.section === activeSection) || [];
                           const q = sectionQuestions[activeQuestionIdx];
                           if (!q) return <div className="p-8 text-center text-slate-500">No questions in this section.</div>;

                           return (
                             <div className="max-w-4xl mx-auto w-full pb-8">
                                {q.context && (
                                  <div className="mb-6 p-5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {q.context}
                                  </div>
                                )}
                                <div className="bg-white/60 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="font-bold text-lg">Question {activeQuestionIdx + 1} <span className="text-slate-400 text-sm font-normal">of {sectionQuestions.length}</span></p>
                                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                                  </div>
                                  <p className="font-medium mb-6 text-lg">{q.text}</p>
                                  <div className="space-y-3">
                                    {q.type === 'MCQ' ? q.options?.map((opt: string, oIdx: number) => (
                                      <label key={oIdx} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAnswers[q.originalIndex] === oIdx ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5' : 'border-slate-200 dark:border-slate-700 hover:border-[hsl(var(--accent))]/50'}`}>
                                        <input type="radio" name={`q-${q.originalIndex}`} checked={selectedAnswers[q.originalIndex] === oIdx} onChange={() => setSelectedAnswers(prev => ({ ...prev, [q.originalIndex]: oIdx }))} className="hidden" />
                                        <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedAnswers[q.originalIndex] === oIdx ? 'border-[hsl(var(--accent))]' : 'border-slate-400'}`}>
                                          {selectedAnswers[q.originalIndex] === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--accent))]"></div>}
                                        </div>
                                        <span className="text-base">{opt}</span>
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
                                
                                <div className="mt-6 flex flex-col sm:flex-row justify-between gap-4">
                                   <button 
                                     disabled={activeQuestionIdx === 0} 
                                     onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                     className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all order-2 sm:order-1"
                                   >
                                     Previous
                                   </button>
                                   <div className="flex flex-wrap gap-3 sm:gap-4 order-1 sm:order-2 justify-end">
                                     <button 
                                       disabled={selectedAnswers[q.originalIndex] === undefined || selectedAnswers[q.originalIndex] === ''}
                                       onClick={() => setSelectedAnswers(prev => {
                                         const next = { ...prev };
                                         delete next[q.originalIndex];
                                         return next;
                                       })}
                                       className="px-6 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-900/20 hover:text-rose-500 hover:border-rose-500 text-slate-600 dark:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                     >
                                       Clear Response
                                     </button>
                                     <button 
                                       onClick={() => setMarkedForReview(prev => ({...prev, [q.originalIndex]: !prev[q.originalIndex]}))}
                                       className={`px-6 py-3 rounded-xl font-bold border-2 transition-all ${markedForReview[q.originalIndex] ? 'border-purple-500 text-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-500 text-slate-600 dark:text-slate-400'}`}
                                     >
                                       {markedForReview[q.originalIndex] ? 'Unmark Review' : 'Mark for Review'}
                                     </button>
                                     <button 
                                       disabled={activeQuestionIdx === sectionQuestions.length - 1} 
                                       onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                       className="px-6 py-3 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                     >
                                       Save & Next
                                     </button>
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

                     <div className={`w-64 shrink-0 border-l border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-white/5 flex-col ${showMobilePalette ? 'flex absolute right-0 inset-y-0 z-50 shadow-2xl' : 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 font-bold flex justify-between items-center">
                          <span>Question Palette</span>
                          <button onClick={() => setShowMobilePalette(false)} className="md:hidden text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                           <div className="grid grid-cols-4 gap-2">
                             {(() => {
                                const sectionQuestions = currentTest.questions?.map((q: any, i: number) => ({...q, originalIndex: i})).filter((q: any) => q.section === activeSection) || [];
                                return sectionQuestions.map((q: any, idx: number) => {
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
                                      onClick={() => setActiveQuestionIdx(idx)}
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
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Score</div><div className="text-3xl font-black">{lastTestResult.score} <span className="text-lg font-bold text-slate-400">/ {lastTestResult.total}</span></div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Accuracy</div><div className="text-3xl font-black text-[hsl(var(--accent))]">{lastTestResult.accuracy}%</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Percentile</div><div className="text-3xl font-black text-blue-500">{lastTestResult.percentile ? `${lastTestResult.percentile} PR` : <Loader2 size={24} className="animate-spin mt-1" />}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Avg Peer Time</div><div className="text-3xl font-black text-indigo-500">{lastTestResult.averagePeerTime ? formatTime(lastTestResult.averagePeerTime) : <Loader2 size={24} className="animate-spin mt-1" />}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Answered</div><div className="text-3xl font-black">{lastTestResult.answered}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Correct</div><div className="text-3xl font-black text-emerald-500">{lastTestResult.correct}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Incorrect</div><div className="text-3xl font-black text-rose-500">{lastTestResult.incorrect}</div></div>
                      <div className="bg-white/40 dark:bg-white/5 p-4 rounded-xl border border-slate-200/50 dark:border-white/10"><div className="text-slate-500 text-sm font-medium">Unanswered</div><div className="text-3xl font-black text-slate-500">{lastTestResult.unanswered}</div></div>
                    </div>
                    
                    <div className="mb-8 bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 text-left">
                      <h3 className="font-bold mb-4">Section Time Analysis</h3>
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
                                      <div className="flex items-center gap-4 text-sm mt-2 sm:mt-0">
                                         <span className="text-slate-500">Total: <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{formatTime(time)}</span></span>
                                         <span className="text-slate-500">Avg/Q: <span className="font-mono font-bold text-[hsl(var(--accent))]">{formatTime(avg)}</span></span>
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

                    <div className="flex flex-wrap justify-center gap-4 mt-8">
                      <button onClick={() => { 
                        setMockPhase('select'); 
                        setCurrentTest(null); 
                        setSelectedAnswers({}); 
                        setLastTestResult(null); 
                        setMarkedForReview({});
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
                  <div className="flex justify-between items-center p-4 border-b border-slate-200/50 dark:border-white/10 bg-white/60 dark:bg-white/5 backdrop-blur-xl shrink-0">
                    <h3 className="text-lg font-bold truncate pr-4">{currentTest.title} - Review</h3>
                    <div className="flex items-center gap-2 md:gap-4">
                      <button onClick={() => setShowMobilePalette(!showMobilePalette)} className="md:hidden bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg font-bold text-sm">Palette</button>
                      <select 
                        value={reviewFilter} 
                        onChange={(e) => { setReviewFilter(e.target.value as any); setActiveQuestionIdx(0); }}
                        className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:border-[hsl(var(--accent))]"
                      >
                        <option value="all">All Questions</option>
                        <option value="correct">Correct Only</option>
                        <option value="incorrect">Incorrect Only</option>
                        <option value="unanswered">Unanswered Only</option>
                      </select>
                      <button onClick={() => setMockPhase('result')} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 md:px-5 py-1.5 md:py-2 rounded-lg font-bold shadow-md hover:opacity-90 active:scale-95 transition-all text-sm md:text-base whitespace-nowrap">Back <span className="hidden md:inline">to Results</span></button>
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
                         const sectionQuestionsAll = currentTest.questions?.map((q: any, i: number) => ({...q, originalIndex: i})).filter((q: any) => q.section === activeSection) || [];
                         const sectionQuestionsLength = sectionQuestionsAll.filter((q: any) => {
                           if (reviewFilter === 'all') return true;
                           const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                           if (reviewFilter === 'unanswered') return !isAnswered;
                           if (!isAnswered) return false;
                           let isCorrect = false;
                           if (isAnswered) {
                             if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
                             else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                           }
                           if (reviewFilter === 'correct') return isCorrect;
                           if (reviewFilter === 'incorrect') return !isCorrect;
                           return true;
                         }).length;
                         if (distance > 50 && activeQuestionIdx < sectionQuestionsLength - 1) setActiveQuestionIdx(prev => prev + 1);
                         if (distance < -50 && activeQuestionIdx > 0) setActiveQuestionIdx(prev => prev - 1);
                         setTouchStartX(null); setTouchEndX(null);
                       }}
                     >
                        {(() => {
                           const sectionQuestionsAll = currentTest.questions?.map((q: any, i: number) => ({...q, originalIndex: i})).filter((q: any) => q.section === activeSection) || [];
                           const sectionQuestions = sectionQuestionsAll.filter((q: any) => {
                             if (reviewFilter === 'all') return true;
                             const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                             if (reviewFilter === 'unanswered') return !isAnswered;
                             if (!isAnswered) return false;
                             let isCorrect = false;
                             if (isAnswered) {
                               if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
                               else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                             }
                             if (reviewFilter === 'correct') return isCorrect;
                             if (reviewFilter === 'incorrect') return !isCorrect;
                             return true;
                           });
                           const q = sectionQuestions[activeQuestionIdx];
                           if (!q) return <div className="p-8 text-center text-slate-500">No questions match the current filter in this section.</div>;

                           return (
                             <div className="max-w-4xl mx-auto w-full pb-8">
                                {q.context && (
                                  <div className="mb-6 p-5 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                                    {q.context}
                                  </div>
                                )}
                                <div className="bg-white/60 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10 shadow-sm">
                                  <div className="flex justify-between items-start mb-4">
                                    <p className="font-bold text-lg">Question {activeQuestionIdx + 1} <span className="text-slate-400 text-sm font-normal">of {sectionQuestions.length}</span></p>
                                    <span className="text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-500">{q.type}</span>
                                  </div>
                                  <p className="font-medium mb-6 text-lg">{q.text}</p>
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
                                        borderClass = 'border-slate-200 dark:border-slate-700 opacity-50';
                                      }

                                      return (
                                        <div key={oIdx} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${borderClass} ${bgClass}`}>
                                          <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? (isCorrect ? 'border-emerald-500' : 'border-rose-500') : (isCorrect ? 'border-emerald-500' : 'border-slate-400')}`}>
                                            {isSelected && <div className={`w-2.5 h-2.5 rounded-full ${isCorrect ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>}
                                          </div>
                                          <span className="text-base">{opt}</span>
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
                                
                                <div className="mt-6 p-6 bg-[hsl(var(--accent))]/5 dark:bg-[hsl(var(--accent))]/10 rounded-xl border border-[hsl(var(--accent))]/20">
                                  <div className="font-bold flex items-center gap-2 mb-3 text-[hsl(var(--accent))]"><Book size={18} /> Explanation</div>
                                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                                </div>

                                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                                   <div className="flex gap-4 w-full sm:w-auto">
                                     <button 
                                       disabled={activeQuestionIdx === 0} 
                                       onClick={() => setActiveQuestionIdx(prev => prev - 1)}
                                       className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                     >
                                       Previous
                                     </button>
                                     <button 
                                       disabled={activeQuestionIdx === sectionQuestions.length - 1} 
                                       onClick={() => setActiveQuestionIdx(prev => prev + 1)}
                                       className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                     >
                                       Next
                                     </button>
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

                     <div className={`w-64 shrink-0 border-l border-slate-200/50 dark:border-white/10 bg-white dark:bg-slate-900 md:bg-white/40 md:dark:bg-white/5 flex-col ${showMobilePalette ? 'flex absolute right-0 inset-y-0 z-50 shadow-2xl' : 'hidden md:flex'}`}>
                        <div className="p-4 border-b border-slate-200/50 dark:border-white/10 font-bold flex justify-between items-center">
                          <span>Question Palette</span>
                          <button onClick={() => setShowMobilePalette(false)} className="md:hidden text-slate-500"><X size={20} /></button>
                        </div>
                        <div className="p-4 flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                           <div className="grid grid-cols-4 gap-2">
                             {(() => {
                                const sectionQuestionsAll = currentTest.questions?.map((q: any, i: number) => ({...q, originalIndex: i})).filter((q: any) => q.section === activeSection) || [];
                                const sectionQuestions = sectionQuestionsAll.filter((q: any) => {
                                  if (reviewFilter === 'all') return true;
                                  const isAnswered = selectedAnswers[q.originalIndex] !== undefined && selectedAnswers[q.originalIndex] !== '';
                                  if (reviewFilter === 'unanswered') return !isAnswered;
                                  if (!isAnswered) return false;
                                  let isCorrect = false;
                                  if (isAnswered) {
                                    if (q.type === 'MCQ') isCorrect = selectedAnswers[q.originalIndex] === q.correct;
                                    else isCorrect = String(selectedAnswers[q.originalIndex]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                                  }
                                  if (reviewFilter === 'correct') return isCorrect;
                                  if (reviewFilter === 'incorrect') return !isCorrect;
                                  return true;
                                });
                                return sectionQuestions.map((q: any, idx: number) => {
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
                                      onClick={() => setActiveQuestionIdx(idx)}
                                      className={`aspect-square rounded-lg border flex items-center justify-center font-bold text-sm transition-all hover:scale-105 ${btnClass}`}
                                    >
                                      {sectionQuestionsAll.findIndex((sq: any) => sq.originalIndex === q.originalIndex) + 1}
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

          {activeTab === 'practice' && (
            <div className="flex flex-col flex-1">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {(['QA', 'VARC', 'DILR'] as const).map((subj, i) => (
                    <button key={subj} onClick={() => { setPracticeSubject(subj); setPracticeFilterTopic(null); setPracticeFilterBookmark(false); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm whitespace-nowrap ${practiceSubject === subj && !practiceFilterTopic && !practiceFilterBookmark ? 'bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10'}`}>
                      {subj} Training <span className="opacity-50 text-xs ml-1 font-normal hidden sm:inline">[{i + 1}]</span>
                    </button>
                  ))}
                  {practiceFilterTopic && (
                    <button className="px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30 border border-[hsl(var(--accent))]">
                      {practiceFilterTopic} Focus
                    </button>
                  )}
                  <button onClick={() => { setPracticeFilterTopic(null); setPracticeFilterBookmark(true); }} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${practiceFilterBookmark && !practiceFilterTopic ? 'bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10'}`}>
                    Bookmarks ({progress.bookmarkedQuestions?.length || 0})
                  </button>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-sm font-medium whitespace-nowrap">
                  <input type="checkbox" checked={isAdaptive} onChange={(e) => setIsAdaptive(e.target.checked)} className="w-4 h-4 rounded text-[hsl(var(--accent))] bg-slate-100 border-slate-300 focus:ring-[hsl(var(--accent))] dark:bg-slate-700 dark:border-slate-600" />
                  <span className={isAdaptive ? 'text-[hsl(var(--accent))] font-bold' : 'text-slate-600 dark:text-slate-400'}>Adaptive Difficulty</span>
                </label>
              </div>
              <div className="space-y-6">
                {practiceQuestions.length === 0 && (practiceFilterTopic || practiceFilterBookmark || isAdaptive) && (
                  <div className="text-center py-16 text-slate-500">
                    <BrainCircuit size={48} className="mx-auto mb-4 opacity-20" />
                    <p>No questions found {practiceFilterTopic ? `for topic "${practiceFilterTopic}"` : practiceFilterBookmark ? 'in your bookmarks' : 'for this skill level'}.</p>
                  </div>
                )}
                {practiceQuestions?.map((q, idx) => (
                  <div key={q.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-xl p-6 shadow-sm">
                    {q.context && (
                      <div className="mb-4 p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto">
                        {q.context}
                      </div>
                    )}
                    <div className="flex justify-between items-start mb-6 gap-4">
                      <p className="font-medium text-lg">{idx + 1}. {q.text}</p>
                      <button 
                        onClick={() => toggleBookmark(q.id)}
                        className={`p-2 shrink-0 rounded-lg transition-colors ${progress.bookmarkedQuestions?.includes(q.id) ? 'bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))]' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title="Bookmark Question"
                      >
                        <Bookmark size={20} fill={progress.bookmarkedQuestions?.includes(q.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {q.type === 'MCQ' ? q.options?.map((opt, oIdx) => {
                        const isAnswered = practiceAnswers[q.id] !== undefined;
                        const isSelected = practiceAnswers[q.id] === oIdx;
                        const isCorrect = q.correct === oIdx;
                        let borderClass = 'border-slate-200/50 dark:border-white/10 hover:border-[hsl(var(--accent))]/50';
                        let bgClass = 'bg-white/40 dark:bg-white/5';
                        
                        if (isAnswered) {
                          if (isCorrect) borderClass = 'border-emerald-500', bgClass = 'bg-emerald-500/10 dark:bg-emerald-500/20';
                          else if (isSelected) borderClass = 'border-rose-500', bgClass = 'bg-rose-500/10 dark:bg-rose-500/20';
                          else borderClass = 'border-slate-200/50 dark:border-white/10 opacity-50';
                        }

                        return (
                          <label key={oIdx} className="relative cursor-pointer">
                            <input type="radio" name={`pq-${q.id}`} disabled={isAnswered} className="sr-only" onChange={() => {
                              const userRating = progress.skillRatings?.[practiceSubject] || 1200;
                              const isCorrect = oIdx === q.correct;

                              setPracticeAnswers(prev => ({ ...prev, [q.id]: oIdx }));
                              updateSkillRating(practiceSubject, questionRatings[q.id] || 1200, isCorrect);
                              updateQuestionRating(q.id, userRating, isCorrect);
                              addResult(1, isCorrect ? 1 : 0);
                              if (!isCorrect) {
                                const front = `[Auto-Generated]\n\nQ: ${q.text}`;
                                const back = `Correct Answer: ${q.options?.[q.correct as number]}\\n\\nExplanation:\\n${q.explanation}`;
                                saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
                              }
                            }} />
                            <div className={`border-2 rounded-xl p-4 transition-colors ${borderClass} ${bgClass}`}>{opt}</div>
                          </label>
                        );
                      }) : (
                        <div className="sm:col-span-2">
                           <input 
                              type="text" 
                              disabled={practiceAnswers[q.id] !== undefined} 
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = e.currentTarget.value;
                                    const userRating = progress.skillRatings?.[practiceSubject] || 1200;
                                    setPracticeAnswers(prev => ({ ...prev, [q.id]: val }));
                                    const isCorrect = String(val).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase();
                                    
                                    updateSkillRating(practiceSubject, questionRatings[q.id] || 1200, isCorrect);
                                    updateQuestionRating(q.id, userRating, isCorrect);
                                    addResult(1, isCorrect ? 1 : 0);
                                    if (!isCorrect) {
                                      const front = `[Auto-Generated]\n\nQ: ${q.text}`;
                                      const back = `Correct Answer: ${q.tita_answer}\\n\\nExplanation:\\n${q.explanation}`;
                                      saveFormula({ id: `auto_${q.id}`, front, back }).catch(console.error);
                                    }
                                }
                              }} 
                              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors disabled:opacity-50" 
                              placeholder="Type your answer and press Enter..." 
                           />
                           {practiceAnswers[q.id] !== undefined && (
                             <div className={`mt-2 text-sm font-bold ${String(practiceAnswers[q.id]).trim().toLowerCase() === String(q.tita_answer).trim().toLowerCase() ? 'text-emerald-500' : 'text-rose-500'}`}>
                               Your Answer: {practiceAnswers[q.id]} | Correct: {q.tita_answer}
                             </div>
                           )}
                        </div>
                      )}
                    </div>
                    <AnimatePresence>
                      {practiceAnswers[q.id] !== undefined && (
                        <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mt-6">
                          <div className="p-5 bg-[hsl(var(--accent))]/5 dark:bg-[hsl(var(--accent))]/10 rounded-xl border border-[hsl(var(--accent))]/20">
                            <div className="font-bold flex items-center gap-2 mb-2 text-[hsl(var(--accent))]"><Book size={18} /> Coach&apos;s Explanation</div>
                            <p className="text-sm leading-relaxed">{q.explanation}</p>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'formula' && (
            <div className="flex flex-col flex-1">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Interactive Formula Hub</h3>
                  <p className="text-slate-500">Master the official CAT formulas or add your own custom flashcards to IndexedDB.</p>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search formulas..." value={formulaSearch} onChange={e => setFormulaSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/10 rounded-xl focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                  </div>
                  <button onClick={() => { setIsAddingFormula(!isAddingFormula); if (isAddingFormula) { setEditingFormulaId(null); setNewFormula({ front: '', back: '' }); } }} className="bg-[hsl(var(--accent))] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all whitespace-nowrap">
                    {isAddingFormula ? 'Cancel' : '+ Add'}
                  </button>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
                {formulaTopics.map((topic: any) => (
                  <button 
                    key={topic} 
                    onClick={() => setFormulaTopicFilter(topic)} 
                    className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap text-sm transition-colors ${formulaTopicFilter === topic ? 'bg-[hsl(var(--accent))] text-white' : 'bg-white/60 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {isAddingFormula && (
                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 flex flex-col md:flex-row gap-4 mt-2">
                      <input type="text" placeholder="Front (e.g. Area of a Circle: $A = \pi r^2$)" value={newFormula.front} onChange={e => setNewFormula({...newFormula, front: e.target.value})} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                      <input type="text" placeholder="Back (e.g. $A = \pi r^2$)" value={newFormula.back} onChange={e => setNewFormula({...newFormula, back: e.target.value})} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                      <button onClick={async () => {
                        if(!newFormula.front || !newFormula.back) return;
                        const f = { id: editingFormulaId || Date.now().toString(), front: newFormula.front, back: newFormula.back };
                        await saveFormula(f);
                        if (editingFormulaId) {
                          setFormulas(formulas.map(form => form.id === editingFormulaId ? f : form));
                          setEditingFormulaId(null);
                        } else {
                          setFormulas([...formulas, f]);
                        }
                        setNewFormula({ front: '', back: '' });
                        setIsAddingFormula(false);
                      }} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-8 py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all">
                        {editingFormulaId ? 'Update Offline' : 'Save Offline'}
                      </button>
                    </div>
                  </m.div>
                )}
              </AnimatePresence>

              {filteredFormulas.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <Book size={48} className="mx-auto mb-4 opacity-20" />
                  <p>No formulas found matching "{formulaSearch}"</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
                  {filteredFormulas.map((f) => (
                   <Flashcard key={f.id} formula={f} onEdit={() => {
                     setEditingFormulaId(f.id);
                     setNewFormula({ front: f.front, back: f.back });
                     setIsAddingFormula(true);
                   }} onDelete={async () => {
                     if (confirm('Are you sure you want to delete this flashcard?')) {
                       await deleteFormula(f.id);
                       setFormulas(formulas.filter(form => form.id !== f.id));
                     }
                   }} onUpdate={async (updated) => {
                     await saveFormula(updated);
                     setFormulas(formulas.map(form => form.id === updated.id ? updated : form));
                   }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Submit Summary Modal */}
      <AnimatePresence>
        {showSubmitSummary && currentTest && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center">
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
                <button onClick={() => setShowSubmitSummary(false)} className="flex-1 py-3 rounded-xl font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Resume</button>
                <button onClick={() => { setShowSubmitSummary(false); handleSubmitMock(); }} className="flex-1 py-3 rounded-xl font-bold bg-[hsl(var(--accent))] text-white shadow-lg hover:scale-105 active:scale-95 transition-all">Confirm Submit</button>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AnimatePresence>
        {isAuthOpen && (
          <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[2000] flex items-center justify-center">
            <m.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-2xl shadow-2xl border border-white/10 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">Sign In</h3>
                <button onClick={() => setIsAuthOpen(false)} className="text-slate-400 hover:text-slate-600"><X /></button>
              </div>
              <p className="text-slate-500 mb-6">Sign in to sync your CAT prep progress.</p>
              <button onClick={handleAuth} disabled={isAuthenticating} className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl hover:bg-slate-800 transition font-medium">
                {isAuthenticating ? <Loader2 className="animate-spin" /> : 'Continue'}
              </button>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>
    </m.div>
  );
}