import { useMemo } from 'react';
import { useCatStore } from '../../pages/catStore';
import { Target, TrendingUp, Clock, AlertTriangle, Activity, Map } from 'lucide-react';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell } from 'recharts';

export default function AnalyticsDashboard() {
  const { progress } = useCatStore();
  const { topicStats, skillRatings, studyPlan } = progress;

  // 1. Weak Topic Ranker & Accuracy Heatmap Data
  const topicAnalysis = useMemo(() => {
    if (!topicStats) return [];
    return Object.keys(topicStats).map(topic => {
      const stat = topicStats[topic];
      const accuracy = stat.attempted > 0 ? (stat.correct / stat.attempted) * 100 : 0;
      const skipRate = (stat.attempted + stat.skipped) > 0 ? (stat.skipped / (stat.attempted + stat.skipped)) * 100 : 0;
      const avgTime = stat.attempted > 0 ? (stat.totalTimeSpent || 0) / stat.attempted : 0;
      return { topic, accuracy, skipRate, avgTime, attempted: stat.attempted };
    }).sort((a, b) => a.accuracy - b.accuracy); // Weakest first
  }, [topicStats]);

  // 2. Score to Percentile Predictor (Simplified Equi-percentile mapping)
  const predictPercentile = (qa: number, varc: number, dilr: number) => {
    // ELO rating to Percentile approx mapping (CAT normalization)
    const avgRating = (qa + varc + dilr) / 3;
    if (avgRating > 1600) return 99.9;
    if (avgRating > 1500) return 99.0;
    if (avgRating > 1400) return 95.0;
    if (avgRating > 1300) return 90.0;
    if (avgRating > 1200) return 80.0;
    if (avgRating > 1100) return 70.0;
    return 50.0;
  };

  const currentPercentile = predictPercentile(skillRatings?.QA || 1200, skillRatings?.VARC || 1200, skillRatings?.DILR || 1200);

  // 3. Scatter Chart Data for Attempt vs Accuracy Matrix (What to skip)
  const matrixData = topicAnalysis.filter(t => t.attempted > 3).map(t => ({
    x: t.avgTime, // Time spent
    y: t.accuracy, // Accuracy
    z: t.attempted, // Bubble size
    name: t.topic
  }));

  const getHeatmapColor = (accuracy: number) => {
    if (accuracy >= 80) return 'bg-emerald-500 text-white';
    if (accuracy >= 50) return 'bg-yellow-500 text-white';
    return 'bg-rose-500 text-white';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-2"><Target size={16}/> Predicted Percentile</span>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-4xl font-black text-[hsl(var(--accent))]">{currentPercentile.toFixed(2)}</span>
            <span className="text-slate-500 mb-1">%ile</span>
          </div>
          {studyPlan?.targetPercentile && (
            <div className="mt-2 text-xs font-medium text-slate-500">Target: {studyPlan.targetPercentile}%ile</div>
          )}
        </div>
        
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-2"><Activity size={16}/> Overall Accuracy</span>
          <div className="mt-4 text-4xl font-black text-slate-800 dark:text-white">
            {progress.totalAttempted > 0 ? Math.round((progress.correct / progress.totalAttempted) * 100) : 0}%
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">{progress.correct} correct out of {progress.totalAttempted}</div>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <span className="text-slate-500 dark:text-slate-400 text-sm font-bold flex items-center gap-2"><Clock size={16}/> Avg Time/Question</span>
          <div className="mt-4 text-4xl font-black text-slate-800 dark:text-white">
            {topicAnalysis.length > 0 ? Math.round(topicAnalysis.reduce((acc, t) => acc + t.avgTime, 0) / topicAnalysis.length) : 0}s
          </div>
          <div className="mt-2 text-xs font-medium text-slate-500">Ideal: 90s - 120s</div>
        </div>

        <div className="p-6 bg-[hsl(var(--accent))]/10 dark:bg-[hsl(var(--accent))]/5 rounded-2xl border border-[hsl(var(--accent))]/20 flex flex-col justify-center items-center text-center">
          <TrendingUp className="text-[hsl(var(--accent))] mb-2" size={32} />
          <h3 className="font-bold text-slate-800 dark:text-white">Sectional Split</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">QA: {skillRatings?.QA || 1200} | VARC: {skillRatings?.VARC || 1200} | DILR: {skillRatings?.DILR || 1200}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Attempt vs Accuracy Matrix */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg flex items-center gap-2"><Map size={18} className="text-indigo-500"/> Attempt vs Accuracy Matrix</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Identify time-sinks. Topics in the bottom-right (High Time, Low Accuracy) should be SKIPPED during mocks.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" dataKey="x" name="Avg Time (s)" unit="s" stroke="#888" fontSize={12} />
                <YAxis type="number" dataKey="y" name="Accuracy" unit="%" stroke="#888" fontSize={12} />
                <ZAxis type="number" dataKey="z" range={[50, 400]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700">
                        <p className="font-bold">{data.name}</p>
                        <p className="text-sm">Accuracy: {data.y.toFixed(1)}%</p>
                        <p className="text-sm">Avg Time: {data.x.toFixed(1)}s</p>
                        <p className="text-sm">Attempts: {data.z}</p>
                      </div>
                    );
                  }
                  return null;
                }}/>
                <Scatter name="Topics" data={matrixData} fill="hsl(var(--accent))">
                  {matrixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.y < 50 && entry.x > 120 ? '#ef4444' : entry.y > 70 ? '#10b981' : 'hsl(var(--accent))'} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weak Topic Ranker & Heatmap */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
          <h3 className="font-bold text-lg flex items-center gap-2 mb-6"><AlertTriangle size={18} className="text-rose-500"/> Weak Topic Ranker</h3>
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '300px' }}>
            {topicAnalysis.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-10">Attempt more questions to generate topic analytics.</p>
            ) : (
              <div className="space-y-3">
                {topicAnalysis.slice(0, 10).map((t, idx) => (
                  <div key={t.topic} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-mono text-xs">{idx + 1}</span>
                      <span className="font-medium text-sm">{t.topic}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-end">
                        <span className="text-xs text-slate-500">Avg: {Math.round(t.avgTime)}s</span>
                        <span className="text-xs text-slate-500">Skip: {Math.round(t.skipRate)}%</span>
                      </div>
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${getHeatmapColor(t.accuracy)}`}>
                        {Math.round(t.accuracy)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
