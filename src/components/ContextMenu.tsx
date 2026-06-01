import { useState, useEffect, useRef } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Wrench, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

export default function ContextMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
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

  return (
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
        </m.div>
      )}
    </AnimatePresence>
  );
}