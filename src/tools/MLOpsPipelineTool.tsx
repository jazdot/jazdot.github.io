import { useState, useEffect, useRef } from 'react';
import { m } from 'framer-motion';
import { Database, Filter, BrainCircuit, Activity, Package, Cloud, Play, CheckCircle2, Circle, Loader2 } from 'lucide-react';

const STAGES = [
  { id: 'ingestion', name: 'Data Ingestion', icon: Database, duration: 1500, logs: ['Connecting to feature store...', 'Querying 500k rows...', 'Data ingestion complete.'] },
  { id: 'preprocessing', name: 'Preprocessing', icon: Filter, duration: 2000, logs: ['Handling missing values...', 'Normalizing numerical features...', 'Encoding categorical variables...', 'Preprocessing complete.'] },
  { id: 'training', name: 'Model Training', icon: BrainCircuit, duration: 3500, logs: ['Initializing XGBoost Regressor...', 'Epoch 1/10: loss 0.45', 'Epoch 5/10: loss 0.22', 'Epoch 10/10: loss 0.12', 'Model training converged.'] },
  { id: 'evaluation', name: 'Evaluation', icon: Activity, duration: 1500, logs: ['Running test set...', 'RMSE: 0.15, R2: 0.94', 'Model passed threshold requirements.'] },
  { id: 'containerization', name: 'Containerization', icon: Package, duration: 2500, logs: ['Building Docker image...', 'Layer 1/5...', 'Layer 5/5...', 'Pushing to registry...', 'Image tagged v1.2.4'] },
  { id: 'deployment', name: 'Edge Deployment', icon: Cloud, duration: 2000, logs: ['Updating Kubernetes deployment...', 'Rolling update started...', 'Pod health checks passing...', 'Deployment successful.'] }
];

export default function MLOpsPipelineTool() {
  const [status, setStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [activeStage, setActiveStage] = useState(-1);
  const [stageProgress, setStageProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Handle pipeline progression
  useEffect(() => {
    if (status !== 'running') return;

    let startTime = Date.now();
    let animationFrame: number;
    const currentStageObj = STAGES[activeStage];

    if (!currentStageObj) {
      setStatus('completed');
      setLogs(prev => [...prev, '\n[SYSTEM] Pipeline execution completed successfully.']);
      return;
    }

    const duration = currentStageObj.duration;
    let lastLogIndex = -1;

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const p = Math.min((elapsed / duration) * 100, 100);
      setStageProgress(p);

      const expectedLogIndex = Math.floor((p / 100) * currentStageObj.logs.length);
      if (expectedLogIndex > lastLogIndex && expectedLogIndex < currentStageObj.logs.length) {
        setLogs(prev => [...prev, `[${currentStageObj.id.toUpperCase()}] ${currentStageObj.logs[expectedLogIndex]}`]);
        lastLogIndex = expectedLogIndex;
      }

      if (p < 100) {
        animationFrame = requestAnimationFrame(updateProgress);
      } else {
        setActiveStage(prev => prev + 1);
        setStageProgress(0);
      }
    };

    animationFrame = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(animationFrame);
  }, [status, activeStage]);

  const triggerPipeline = () => {
    setStatus('running');
    setActiveStage(0);
    setStageProgress(0);
    setLogs(['[SYSTEM] Initializing MLOps Pipeline...']);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full text-slate-900 dark:text-white">
      {/* Stages Display */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-bold text-lg opacity-80">Pipeline Stages</h3>
          {status === 'idle' ? (
            <button onClick={triggerPipeline} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors text-sm shadow-lg shadow-blue-500/20 active:scale-95">
              <Play size={16} /> Run Pipeline
            </button>
          ) : status === 'completed' ? (
            <button onClick={() => { setStatus('idle'); setActiveStage(-1); setStageProgress(0); setLogs([]); }} className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm active:scale-95">
              Reset
            </button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg text-sm">
              <Loader2 size={16} className="animate-spin" /> Running...
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {STAGES.map((stage, idx) => {
            const isActive = idx === activeStage;
            const isPast = idx < activeStage || status === 'completed';
            const Icon = stage.icon;

            return (
              <div key={stage.id} className={`relative p-3 md:p-4 rounded-xl border transition-colors duration-300 ${isActive ? 'bg-blue-500/10 border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : isPast ? 'bg-green-500/5 border-green-500/30' : 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 opacity-60'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isActive ? 'bg-blue-500 text-white shadow-md shadow-blue-500/40' : isPast ? 'bg-green-500 text-white shadow-md shadow-green-500/20' : 'bg-slate-500/20 text-slate-500 dark:text-slate-400'}`}><Icon size={16} /></div>
                    <span className={`font-semibold text-sm ${isActive ? 'text-blue-600 dark:text-blue-400' : isPast ? 'text-green-600 dark:text-green-400' : ''}`}>{stage.name}</span>
                  </div>
                  <div>{isActive ? <Loader2 size={18} className="text-blue-500 animate-spin" /> : isPast ? <CheckCircle2 size={18} className="text-green-500" /> : <Circle size={18} className="text-slate-400" />}</div>
                </div>
                <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden mt-2"><m.div className={`h-full ${isPast ? 'bg-green-500' : 'bg-blue-500'}`} initial={{ width: isPast ? '100%' : '0%' }} animate={{ width: isPast ? '100%' : isActive ? `${stageProgress}%` : '0%' }} transition={{ ease: "linear", duration: 0.1 }} /></div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal Display */}
      <div className="flex-1 flex flex-col gap-2 h-[350px] md:h-auto mt-4 md:mt-0">
        <h3 className="font-bold text-lg mb-2 opacity-80">Execution Logs</h3>
        <div className="flex-1 bg-[#0c0c0c] text-emerald-400 font-mono text-xs md:text-sm rounded-xl p-4 overflow-y-auto shadow-inner border border-white/10">{logs.length === 0 ? (<span className="opacity-50">Waiting for pipeline trigger...</span>) : (logs.map((log, i) => (<div key={i} className="mb-1.5 leading-relaxed opacity-90 break-all">{log}</div>)))}<div ref={logsEndRef} /></div>
      </div>
    </div>
  );
}