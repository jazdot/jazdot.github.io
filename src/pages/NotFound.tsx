import { m } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-[80vh] flex flex-col items-center justify-center p-6 mt-16 relative z-10"
    >
      <SEO title="404 - Destination Unreachable | JAZDOT" description="The requested route could not be found in the routing table." />
      
      <div className="w-full max-w-2xl bg-[#0c0c0c] rounded-xl overflow-hidden shadow-2xl border border-white/10 font-mono text-emerald-400 p-6 flex flex-col gap-4">
        {/* Terminal Header */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="ml-2 text-slate-400 text-xs">root@jazdot:~</span>
        </div>
        
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <span className="text-red-500 font-bold">[ERROR]</span> 404_NOT_FOUND
        </m.div>
        
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Destination Host Unreachable. The routing table does not contain a path to the specified URL.
        </m.div>

        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-slate-400 mt-4"
        >
          Please check your connection or return to the base directory.
        </m.div>
        
        <m.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-6 flex items-center gap-2"
        >
          <span className="text-pink-500 font-bold">jazdot@ubuntu</span>
          <span className="text-slate-500">~</span>
          <span className="text-slate-300">$</span>
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center text-emerald-400 hover:text-white transition-colors group outline-none ml-1"
          >
            cd /home
            <m.span 
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-2 h-4 bg-emerald-400 ml-1 align-middle group-hover:bg-white"
            />
          </button>
        </m.div>
      </div>
    </m.div>
  );
}