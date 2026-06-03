import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LayoutDashboard, PenTool, Bot, Book, LogIn, LogOut, BrainCircuit, UploadCloud, Trophy, Loader2, X, Edit2, Trash2, Search } from 'lucide-react';
import { useCatStore } from './catStore';

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

// --- Mock Practice Database ---
const MOCK_PRACTICE_DB = {
  QA: [
    { id: 'q1', text: 'If a, b, c and d are integers such that their sum is 46, then the minimum possible value of (a-b)² + (a-c)² + (a-d)² is:', options: ['0', '2', '3', '4'], correct: 1, explanation: 'The minimum value of squares is positive. If their sum is 46 (not divisible by 4), we must distribute the values as evenly as possible: 12, 11, 11, 12. The sum of differences squared is (12-11)² + (12-11)² + (12-12)² = 2.' },
    { id: 'q2', text: 'Let A, B, C be priced at Rs 120, 90, 150 respectively. A portfolio has 10 shares of A and 20 of B & C combined. Total value Rs 3300. Number of B shares is:', options: ['12', '15', '10', '8'], correct: 1, explanation: 'Let B shares be x, C shares be 20-x. Equation: 120(10) + 90x + 150(20-x) = 3300. Solving: 1200 + 3000 - 60x = 3300 => 60x = 900 => x = 15.' }
  ],
  VARC: [
    { id: 'v1', text: 'Arrange to form a coherent paragraph: 1. Developments both technological... 2. But I believe... 3. Legalising assisted dying... 4. Many people endorse... 5. Freedom is notoriously complex...', options: ['5, 1, 2, 3', '1, 4, 2, 3', '4, 1, 5, 2', '1, 3, 2, 5'], correct: 0, explanation: 'The philosophical discussion starts with sentence 5, setting the framework of freedom. Sentence 1 focuses on freedom over death, 2 builds on it, and 3 concludes with the legal step.' },
    { id: 'v2', text: 'Which word best captures the tone of an author who is gently mocking societal norms?', options: ['Sardonic', 'Satirical', 'Facetious', 'Derisive'], correct: 2, explanation: 'Facetious implies treating serious issues with deliberately inappropriate humor, which aligns with "gently mocking." Sardonic and Derisive are too harsh.' }
  ],
  DILR: [
    { id: 'd1', text: 'Four friends take turns moving around a 7-chair round table. The chairs occupied after Turn 6 are 4, 5, 6, 7. Who sat on chair 4 at Turn 3?', options: ['Aslam', 'Bashir', 'Chhavi', 'No one'], correct: 3, explanation: 'After tracing the paths and vacant chair constraints backward from turn 6, Chair 4 must be empty at turn 3 because it is only occupied on Turn 5.' }
  ]
};

// --- Flashcard Component ---
const Flashcard = ({ front, back, onEdit, onDelete }: { front: string, back: string, onEdit: () => void, onDelete: () => void }) => {
  const [flipped, setFlipped] = useState(false);
  return (
    <div className="relative w-full h-64 cursor-pointer group" style={{ perspective: '1000px' }} onClick={() => setFlipped(!flipped)}>
      <div className="absolute top-4 right-4 flex gap-2 z-10 md:opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-slate-500 hover:text-[hsl(var(--accent))] bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/10 transition-colors"><Edit2 size={16} /></button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-slate-500 hover:text-rose-500 bg-white/90 dark:bg-slate-800/90 rounded-lg backdrop-blur-md shadow-sm border border-slate-200/50 dark:border-white/10 transition-colors"><Trash2 size={16} /></button>
      </div>
      <m.div
        className="w-full h-full relative"
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-sm border border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-white/5 backdrop-blur-xl flex flex-col justify-center items-center p-6 text-center" style={{ backfaceVisibility: 'hidden' }}>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 whitespace-pre-line">{front}</h3>
        </div>
        {/* Back */}
        <div className="absolute inset-0 w-full h-full rounded-2xl shadow-sm bg-[hsl(var(--accent))] border-[hsl(var(--accent))] flex flex-col justify-center items-center p-6 text-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="text-lg font-medium text-white whitespace-pre-line">{back}</div>
        </div>
      </m.div>
    </div>
  );
};
// -------------------------

export default function CatMaster() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  
  // Zustand Global State
  const { user, progress, login, logout, addResult } = useCatStore();
  
  // Mock State
  const [mockPhase, setMockPhase] = useState<'upload' | 'loading' | 'test' | 'result'>('upload');
  const [currentTest, setCurrentTest] = useState<any>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [savedTests, setSavedTests] = useState<any[]>([]);
  const [formulas, setFormulas] = useState<any[]>([]);
  const [isAddingFormula, setIsAddingFormula] = useState(false);
  const [newFormula, setNewFormula] = useState({ front: '', back: '' });
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  const [practiceSubject, setPracticeSubject] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<string, number>>({});
  const [formulaSearch, setFormulaSearch] = useState('');

  useEffect(() => {
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
    if (activeTab === 'formula') {
      const loadFormulas = async () => {
        try {
          let f = await getFormulas();
          if (f.length === 0) { // Seed default flashcards if DB is empty
            const defaultF = [
              { id: '1', front: 'Basic Proportionality Theorem\n(Geometry)', back: 'If a line is drawn parallel to one side of a triangle and it intersects the other two sides at two distinct points, then it divides the two sides in the same ratio.' },
              { id: '2', front: 'Logarithm Power Rule\n(Algebra)', back: 'log_a(x^n) = n × log_a(x)' },
              { id: '3', front: 'Compound Interest\n(Quant)', back: 'A = P(1 + R/100)^N' }
            ];
            for (let df of defaultF) await saveFormula(df);
            f = defaultF;
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMockPhase('loading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('count', '15'); // Request exactly 15 questions from the Edge AI

      // Secure Serverless Edge API Call
      const res = await fetch('https://cat-master-ai.jazdot.workers.dev', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('AI processing failed');
      
      const data = await res.json();
      
      const testObj = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        questions: data
      };
      
      // Persist generated test offline in IndexedDB
      await saveMockTest(testObj);
      
      setCurrentTest(testObj);
      setMockPhase('test');
    } catch (error) {
      console.error(error);
      setMockPhase('upload');
      alert('Failed to generate mock test. Ensure the Cloudflare worker is deployed and running.');
    }
  };

  const handleSubmitMock = () => {
    let score = 0;
    if (currentTest) {
      currentTest.questions.forEach((q: any, idx: number) => {
        if (selectedAnswers[idx] === q.correct) score++;
      });
    }
    
    setMockPhase('result');
    addResult(currentTest?.questions?.length || 0, score);
  };

  // Zero-dependency SVG Donut Chart Calculation
  const accuracy = progress.totalAttempted > 0 ? Math.round((progress.correct / progress.totalAttempted) * 100) : 0;

  const filteredFormulas = formulas.filter(f => f.front.toLowerCase().includes(formulaSearch.toLowerCase()) || f.back.toLowerCase().includes(formulaSearch.toLowerCase()));

  return (
    <m.div 
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[1000] flex bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 overflow-hidden font-sans"
    >
      {/* Sidebar */}
      <nav className="w-20 md:w-64 bg-white/60 dark:bg-white/5 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/10 flex flex-col justify-between shrink-0">
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
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-y-auto">
        <header className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border-b border-slate-200/50 dark:border-white/10 p-4 sticky top-0 z-10 flex justify-between items-center px-6">
          <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
          <div className="flex items-center gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-md py-2 px-4 rounded-full border border-slate-200/50 dark:border-white/10">
            <div className="text-sm font-medium"><span className="text-slate-500">Accuracy: </span><span className="text-[hsl(var(--accent))] font-bold">{accuracy}%</span></div>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <div className="text-sm font-medium"><span className="text-slate-500">Tests: </span><span className="text-[hsl(var(--accent))] font-bold">{progress.testsCompleted}</span></div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto w-full">
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
                  <h3 className="text-lg font-bold mb-4">Quick Stats</h3>
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
            </div>
          )}

          {activeTab === 'mock' && (
            <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
              {mockPhase === 'upload' && (
                <div className="flex flex-col md:flex-row w-full h-full flex-1">
                  <div className="p-8 flex flex-col items-center justify-center flex-1 text-center md:border-r border-slate-200/50 dark:border-white/10">
                    <div className="w-20 h-20 bg-[hsl(var(--accent))]/10 rounded-full flex items-center justify-center mb-6"><BrainCircuit size={40} className="text-[hsl(var(--accent))]" /></div>
                    <h2 className="text-2xl font-bold mb-2">AI Mock Test Generation</h2>
                    <p className="text-slate-500 max-w-md mb-8">Upload a CAT paper. Our AI will extract 15 questions and generate an interactive test instantly.</p>
                    <label className="cursor-pointer border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-[hsl(var(--accent))] bg-white/40 dark:bg-white/5 rounded-xl p-8 transition-colors w-full max-w-md flex flex-col items-center">
                      <UploadCloud size={32} className="text-slate-400 mb-3" />
                      <span className="font-medium">Select File or Drag & Drop</span>
                      <input type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileUpload} />
                    </label>
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
                            <button onClick={() => { setCurrentTest(test); setSelectedAnswers({}); setMockPhase('test'); }} className="text-sm font-bold text-white bg-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/90 px-4 py-2 rounded-lg shadow-md active:scale-95 transition-all">Retake</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {mockPhase === 'loading' && (
                <div className="flex flex-col items-center justify-center flex-1 p-12">
                  <Loader2 size={48} className="text-[hsl(var(--accent))] animate-spin mb-6" />
                  <h3 className="text-xl font-bold">Analyzing Document...</h3>
                  <p className="text-slate-500">Gemini AI is extracting questions and formulating layout.</p>
                </div>
              )}
              {mockPhase === 'test' && currentTest && (
                <div className="flex flex-col flex-1 p-6 md:p-12">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">Mock Test Active</h3>
                    <div className="font-mono text-[hsl(var(--accent))] font-bold text-xl">40:00</div>
                  </div>
                  
                  <div className="space-y-6 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                    {currentTest.questions.map((q: any, idx: number) => (
                      <div key={idx} className="bg-white/40 dark:bg-white/5 p-6 rounded-xl border border-slate-200/50 dark:border-white/10">
                        <p className="font-medium mb-4">{idx + 1}. {q.text}</p>
                        <div className="space-y-3">
                          {q.options.map((opt: string, oIdx: number) => (
                            <label key={oIdx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedAnswers[idx] === oIdx ? 'border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10' : 'border-slate-200/50 dark:border-white/10 hover:border-[hsl(var(--accent))]/50'}`}>
                              <input type="radio" name={`q-${idx}`} checked={selectedAnswers[idx] === oIdx} onChange={() => setSelectedAnswers(prev => ({ ...prev, [idx]: oIdx }))} className="hidden" />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedAnswers[idx] === oIdx ? 'border-[hsl(var(--accent))]' : 'border-slate-400'}`}>
                                {selectedAnswers[idx] === oIdx && <div className="w-2 h-2 rounded-full bg-[hsl(var(--accent))]"></div>}
                              </div>
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex justify-end">
                    <button onClick={handleSubmitMock} className="bg-[hsl(var(--accent))] text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:scale-105 active:scale-95 transition-all">Submit Test</button>
                  </div>
                </div>
              )}
              {mockPhase === 'result' && (
                <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
                  <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 rounded-full flex items-center justify-center mb-6"><Trophy size={48} /></div>
                  <h2 className="text-3xl font-black mb-2">Test Completed</h2>
                  <p className="text-slate-500 mb-8">Results synced to dashboard and saved offline to IndexedDB.</p>
                  <button onClick={() => { setMockPhase('upload'); setCurrentTest(null); setSelectedAnswers({}); }} className="border px-6 py-2 rounded-lg font-medium hover:bg-white/5 transition-all">Take Another Test</button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'practice' && (
            <div className="flex flex-col flex-1">
              <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                {(['QA', 'VARC', 'DILR'] as const).map(subj => (
                  <button key={subj} onClick={() => setPracticeSubject(subj)} className={`px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm ${practiceSubject === subj ? 'bg-[hsl(var(--accent))] text-white shadow-[hsl(var(--accent))]/30' : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/10'}`}>{subj} Training</button>
                ))}
              </div>
              <div className="space-y-6">
                {MOCK_PRACTICE_DB[practiceSubject].map((q, idx) => (
                  <div key={q.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-xl p-6 shadow-sm">
                    <p className="font-medium mb-6 text-lg">{idx + 1}. {q.text}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {q.options.map((opt, oIdx) => {
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
                            <input type="radio" name={`pq-${q.id}`} disabled={isAnswered} className="sr-only" onChange={() => { setPracticeAnswers(prev => ({ ...prev, [q.id]: oIdx })); addResult(1, oIdx === q.correct ? 1 : 0); }} />
                            <div className={`border-2 rounded-xl p-4 transition-colors ${borderClass} ${bgClass}`}>{opt}</div>
                          </label>
                        );
                      })}
                    </div>
                    <AnimatePresence>
                      {practiceAnswers[q.id] !== undefined && (
                        <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden mt-6">
                          <div className="p-5 bg-[hsl(var(--accent))]/5 dark:bg-[hsl(var(--accent))]/10 rounded-xl border border-[hsl(var(--accent))]/20">
                            <div className="font-bold flex items-center gap-2 mb-2 text-[hsl(var(--accent))]"><Book size={18} /> Coach's Explanation</div>
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
                  <p className="text-slate-500">Click a card to reveal the formula, or add your own to the IndexedDB offline database.</p>
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

              <AnimatePresence>
                {isAddingFormula && (
                  <m.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-8 overflow-hidden">
                    <div className="bg-white/40 dark:bg-white/5 p-6 rounded-2xl border border-slate-200/50 dark:border-white/10 flex flex-col md:flex-row gap-4 mt-2">
                      <input type="text" placeholder="Front (e.g. Area of a Circle)" value={newFormula.front} onChange={e => setNewFormula({...newFormula, front: e.target.value})} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
                      <input type="text" placeholder="Back (e.g. π * r²)" value={newFormula.back} onChange={e => setNewFormula({...newFormula, back: e.target.value})} className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-[hsl(var(--accent))] transition-colors" />
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
                   <Flashcard key={f.id} front={f.front} back={f.back} onEdit={() => {
                     setEditingFormulaId(f.id);
                     setNewFormula({ front: f.front, back: f.back });
                     setIsAddingFormula(true);
                   }} onDelete={async () => {
                     if (confirm('Are you sure you want to delete this flashcard?')) {
                       await deleteFormula(f.id);
                       setFormulas(formulas.filter(form => form.id !== f.id));
                     }
                   }} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

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