import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Wrench, ChevronLeft, ChevronRight, RotateCcw, BookOpen, X } from 'lucide-react';

const DB_NAME = 'CatMasterDB';
const FORMULA_STORE = 'formulas';

const saveFlashcard = (front: string, back: string) => {
  try {
    const request = indexedDB.open(DB_NAME, 2);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('mockTests')) db.createObjectStore('mockTests', { keyPath: 'id' });
      if (!db.objectStoreNames.contains(FORMULA_STORE)) db.createObjectStore(FORMULA_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(FORMULA_STORE)) {
        const tx = db.transaction(FORMULA_STORE, 'readwrite');
        tx.objectStore(FORMULA_STORE).put({
          id: `vocab_${Date.now()}`,
          front, back, topic: 'Vocabulary', isOfficial: false, reps: 0, interval: 1, ease: 2.5
        });
      }
    };
  } catch (e) { console.error("Failed to save flashcard", e); }
};

export default function ContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [toast, setToast] = useState<{ visible: boolean, title: string, message: string, word?: string, definition?: string, x?: number, y?: number, saved?: boolean } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Fallback to native menu if user clicks on an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
        return;
      }

      e.preventDefault();
      
      let x = e.clientX;
      let y = e.clientY;
      
      const text = window.getSelection()?.toString().trim() || '';
      setSelectedText(text);

      // Boundary checking so the menu doesn't bleed off the screen
      if (window.innerWidth - x < 220) x -= 220;
      if (window.innerHeight - y < 250) y -= 250;

      setPosition({ x, y });
      setIsOpen(true);
    };

    const handleClick = () => setIsOpen(false);
    const handleScroll = () => setIsOpen(false);

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('click', handleClick);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const fetchMeaning = async (word: string) => {
    setIsOpen(false);
    const toastW = 320;
    const toastH = 220;
    let tX = position.x + 10;
    let tY = position.y + 10;
    
    // Ensure the toast stays within window bounds
    if (tX + toastW > window.innerWidth) tX = Math.max(10, window.innerWidth - toastW - 20);
    if (tY + toastH > window.innerHeight) tY = Math.max(10, window.innerHeight - toastH - 20);

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('Word not found');
      
      const data = await response.json();
      const definition = data[0]?.meanings[0]?.definitions[0]?.definition;
      
      if (definition) {
        setToast({ visible: true, title: word.length > 25 ? word.substring(0, 25) + '...' : word, message: definition, word, definition, x: tX, y: tY });
      } else {
        setToast({ visible: true, title: 'Not Found', message: `Could not find a definition for "${word}".`, x: tX, y: tY });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      setToast({ visible: true, title: 'Error', message: `Could not find the meaning for "${word}".`, x: tX, y: tY });
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <m.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
          style={{ top: position.y, left: position.x }}
          className="fixed z-[100000] min-w-[220px] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl rounded-xl p-1.5 text-sm text-slate-700 dark:text-slate-300 origin-top-left"
        >
          <div className="flex items-center gap-1 p-1 border-b border-black/5 dark:border-white/5 mb-1">
            <button onClick={() => window.history.back()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors flex-1 flex justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white" title="Back"><ChevronLeft size={16} /></button>
            <button onClick={() => window.history.forward()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors flex-1 flex justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white" title="Forward"><ChevronRight size={16} /></button>
            <button onClick={() => window.location.reload()} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-md transition-colors flex-1 flex justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white" title="Reload"><RotateCcw size={16} /></button>
          </div>
          
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Jazdot Platform</div>
          
          <button onClick={() => navigate('/about')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-left font-medium">
            <User size={16} />
            <span>Profile</span>
          </button>
          
          <button onClick={() => navigate('/tools')} className="w-full flex items-center gap-3 px-3 py-2 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-left font-medium">
            <Wrench size={16} />
            <span>Engineering Tools</span>
          </button>
          
          {selectedText && (
            <button onClick={() => fetchMeaning(selectedText)} className="w-full flex items-center gap-3 px-3 py-2 mt-1 border-t border-black/5 dark:border-white/5 pt-3 hover:bg-accent/10 hover:text-accent rounded-lg transition-colors text-left font-medium overflow-hidden">
              <BookOpen size={16} className="shrink-0" />
              <span className="truncate">Meaning: "{selectedText.length > 15 ? selectedText.substring(0, 15) + '...' : selectedText}"</span>
            </button>
          )}
        </m.div>
      )}
    </AnimatePresence>

    <AnimatePresence>
      {toast?.visible && (
        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          style={{ top: toast.y, left: toast.x }}
          className={`fixed z-[100001] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border rounded-2xl p-4 md:p-5 w-[320px] max-w-[90vw] text-slate-700 dark:text-slate-300 transition-all duration-300 ${toast.saved ? 'shadow-[0_0_30px_-5px_rgba(16,185,129,0.5)] border-emerald-500/50' : 'shadow-2xl border-slate-200/50 dark:border-white/10'}`}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white capitalize">{toast.title}</h3>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={18} /></button>
          </div>
          <p className="text-sm mb-4 leading-relaxed max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>{toast.message}</p>
          {toast.word && toast.definition && (
             <button 
               onClick={() => {
                  saveFlashcard(toast.word!, toast.definition!);
                  setToast({ ...toast, message: 'Saved to Flashcards successfully!', word: undefined, definition: undefined, saved: true });
                  setTimeout(() => setToast(null), 2000);
               }}
               className="w-full bg-[hsl(var(--accent))] text-white py-2.5 rounded-xl font-bold shadow-md hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
             >
               <BookOpen size={18} /> Save as Flashcard
             </button>
          )}
        </m.div>
      )}
    </AnimatePresence>
    </>
  );
}