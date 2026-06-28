import { useState } from 'react';

import { BrainCircuit, RefreshCw, XCircle, AlertOctagon, TrendingUp, Compass, Loader2 } from 'lucide-react';
import { generateCatQuestions } from '../../cat-engine/ai-service';
import type { CATQuestion } from '../../cat-engine/types';

export default function AdaptiveEngine() {
  // const { progress } = useCatStore(); // Removed unused variable
  const [isSimulating, setIsSimulating] = useState(false);
  const [skipTrainingActive, setSkipTrainingActive] = useState(false);
  const [skipQuestions, setSkipQuestions] = useState<CATQuestion[]>([]);
  
  // Basic toggles for Adaptive features
  const [autoScale, setAutoScale] = useState(true);
  const [spacedRep, setSpacedRep] = useState(true);

  // Skip Training logic
  const handleStartSkipTraining = async () => {
    setIsSimulating(true);
    try {
      // Fetch 5 Hard questions mixed with 5 Easy questions. The goal is to quickly skip the hard ones.
      const hardQs = await generateCatQuestions('QA', 'Algebra', 'Quadratic Equations', 'Hard', 'MCQ', 3);
      const easyQs = await generateCatQuestions('QA', 'Arithmetic', 'Time Speed Distance', 'Easy', 'MCQ', 3);
      
      const mixed = [...hardQs, ...easyQs].sort(() => Math.random() - 0.5);
      setSkipQuestions(mixed);
      setSkipTrainingActive(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate training questions. Please try again.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Adaptive Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-6 text-indigo-500">
            <BrainCircuit size={20} /> Adaptive Intelligence Core
          </h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><TrendingUp size={16}/> Auto-Scale Difficulty</h4>
                <p className="text-xs text-slate-500 mt-1">Automatically adjusts question difficulty based on your rolling ELO rating.</p>
              </div>
              <button 
                onClick={() => setAutoScale(!autoScale)}
                className={`w-12 h-6 rounded-full transition-colors relative ${autoScale ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${autoScale ? 'left-7' : 'left-1'}`}/>
              </button>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><RefreshCw size={16}/> Spaced Repetition (Weak Topics)</h4>
                <p className="text-xs text-slate-500 mt-1">Re-queues incorrectly solved concepts automatically in future practice sessions.</p>
              </div>
              <button 
                onClick={() => setSpacedRep(!spacedRep)}
                className={`w-12 h-6 rounded-full transition-colors relative ${spacedRep ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${spacedRep ? 'left-7' : 'left-1'}`}/>
              </button>
            </div>
          </div>
        </div>

        {/* Training Modes */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
           <h3 className="font-bold text-lg flex items-center gap-2 mb-6 text-emerald-500">
            <Compass size={20} /> Specialized Training
          </h3>

          <div className="space-y-4">
            <div className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><XCircle size={16} className="text-emerald-500"/> Question Skip Trainer</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 mb-4">
                Train your brain to identify time-sinks within 20 seconds. 
                You will be presented with a mix of very easy and impossibly hard questions. Your goal is strictly to SKIP the hard ones instantly.
              </p>
              <button 
                onClick={handleStartSkipTraining}
                disabled={isSimulating}
                className="w-full bg-emerald-500 text-white font-bold py-2 rounded-lg hover:bg-emerald-600 transition-colors flex justify-center items-center gap-2"
              >
                {isSimulating ? <Loader2 className="animate-spin" size={16} /> : 'Start Skip Training'}
              </button>
            </div>
            
            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl opacity-70">
              <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2"><AlertOctagon size={16}/> Section Strategy Simulator</h4>
              <p className="text-xs text-slate-500 mt-2 mb-4">
                Simulate different attempt orders (e.g., RC first vs VA first) to see impact on your final score based on historical data.
              </p>
              <button disabled className="w-full bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold py-2 rounded-lg cursor-not-allowed">
                Coming Soon
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Skip Training Active View */}
      {skipTrainingActive && skipQuestions.length > 0 && (
        <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-white">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-emerald-400">Skip Training Session</h3>
            <button onClick={() => setSkipTrainingActive(false)} className="text-slate-400 hover:text-white"><XCircle /></button>
          </div>
          <p className="text-sm text-slate-300 mb-6">Read the question below. Do you ATTEMPT or SKIP?</p>
          
          <div className="bg-slate-800 p-6 rounded-xl mb-6">
            <span className="text-xs font-bold bg-slate-700 px-2 py-1 rounded mb-4 inline-block">{skipQuestions[0].topic}</span>
            <p className="text-lg leading-relaxed">{skipQuestions[0].question}</p>
          </div>

          <div className="flex gap-4">
             <button onClick={() => {
               if (skipQuestions[0].difficulty === 'Hard') alert("Bad move! This was a time-sink.");
               else alert("Good attempt! This was an easy question.");
               setSkipQuestions(prev => prev.slice(1));
               if (skipQuestions.length <= 1) setSkipTrainingActive(false);
             }} className="flex-1 bg-[hsl(var(--accent))] hover:bg-opacity-90 py-3 rounded-xl font-bold">ATTEMPT</button>
             
             <button onClick={() => {
               if (skipQuestions[0].difficulty === 'Hard') alert("Excellent skip! You saved 4 minutes.");
               else alert("You skipped an easy question! Lost opportunity.");
               setSkipQuestions(prev => prev.slice(1));
               if (skipQuestions.length <= 1) setSkipTrainingActive(false);
             }} className="flex-1 border-2 border-slate-600 hover:border-slate-400 py-3 rounded-xl font-bold transition-colors">SKIP (20s)</button>
          </div>
        </div>
      )}

    </div>
  );
}
