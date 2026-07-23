import { useState } from 'react';
import { Search, Copy, Check, Compass, AlertCircle, Book, Loader2, Sparkles } from 'lucide-react';
import { generateTrainingModule } from '../../cat-engine/ai-service';
import type { TrainingModule } from '../../cat-engine/types';

export default function StudyHub() {
  const [activeTab, setActiveTab] = useState<'formulas' | 'modules'>('formulas');
  const [formulaSearch, setFormulaSearch] = useState<string>('');
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Training Module state
  const [section, setSection] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [topic, setTopic] = useState<string>('Arithmetic');
  const [subtopic, setSubtopic] = useState<string>('Time Speed Distance');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Topics and Subtopics for selector
  const subtopicMap: Record<string, string[]> = {
    'Arithmetic': ['Time Speed Distance', 'Time & Work', 'Percentages', 'Profit & Loss', 'Ratios & Mixtures'],
    'Algebra': ['Quadratic Equations', 'Linear Equations', 'Logarithms', 'Functions', 'Progressionsings'],
    'Geometry': ['Triangles', 'Circles', 'Polygons & Lines', 'Coordinate Geometry', 'Mensuration'],
    'NumberSystem': ['Factors & Multiples', 'Remainders', 'Last Digit & Base Systems'],
    'Reading Comprehension': ['Main Idea', 'Inference Questions', 'Tone & Style', 'Supporting Details'],
    'Logical Reasoning': ['Binary Logic', 'Arrangements', 'Venn Diagrams', 'Games & Tournaments'],
  };

  const formulas = [
    { id: '1', name: 'Average Speed (Equal Distances)', formula: '2xy / (x + y)', topic: 'Arithmetic', desc: 'Used for two journeys of equal distance at speeds x and y.' },
    { id: '2', name: 'Relative Speed (Opposite Direction)', formula: 'S1 + S2', topic: 'Arithmetic', desc: 'Speeds add up when bodies move towards each other.' },
    { id: '3', name: 'Work & Efficiency Relation', formula: 'W = E * T', topic: 'Arithmetic', desc: 'Work = Efficiency multiplied by time taken.' },
    { id: '4', name: 'Sum of Arithmetic Progression (AP)', formula: 'n/2 * [2a + (n-1)d]', topic: 'Algebra', desc: 'Calculates the sum of first n terms in an AP.' },
    { id: '5', name: 'Quadratic Roots Formula', formula: '[-b ± √(b² - 4ac)] / 2a', topic: 'Algebra', desc: 'Standard formula for solving quadratic equations ax² + bx + c = 0.' },
    { id: '6', name: 'Logarithm Product Rule', formula: 'log(mn) = log(m) + log(n)', topic: 'Algebra', desc: 'Converts multiplication within logarithms to addition.' },
    { id: '7', name: 'Area of Triangle (Herons)', formula: '√[s(s-a)(s-b)(s-c)]', topic: 'Geometry', desc: 'Used when lengths of all three sides (a, b, c) are known. s = (a+b+c)/2.' },
    { id: '8', name: 'Sum of Interior Angles of Polygon', formula: '(n - 2) * 180°', topic: 'Geometry', desc: 'Total angles in a regular polygon with n sides.' },
    { id: '9', name: 'Euler Formula (Polyhedrons)', formula: 'F + V - E = 2', topic: 'Geometry', desc: 'Faces + Vertices - Edges = 2 for any convex polyhedron.' }
  ];

  const handleCopy = (id: string, formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerateModule = async () => {
    setIsLoading(true);
    setModule(null);
    try {
      const result = await generateTrainingModule(section, topic, subtopic, level);
      setModule(result);
    } catch (e) {
      console.error(e);
      alert("Failed to build training module. Please check your network and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFormulas = formulas.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(formulaSearch.toLowerCase()) || f.desc.toLowerCase().includes(formulaSearch.toLowerCase());
    const matchesTopic = selectedTopic === 'All' || f.topic === selectedTopic;
    return matchesSearch && matchesTopic;
  });

  return (
    <div className="w-full space-y-6">
      
      {/* Sub tabs */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1 gap-2 custom-scrollbar">
        <button
          onClick={() => setActiveTab('formulas')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === 'formulas' ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Book size={16} />
          Interactive Formula Hub
        </button>
        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeTab === 'modules' ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
        >
          <Compass size={16} />
          AI Concept & Training Modules
        </button>
      </div>

      {/* 1. Interactive Formula Hub */}
      {activeTab === 'formulas' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search formulas (e.g. Speed, AP)..."
                value={formulaSearch}
                onChange={(e) => setFormulaSearch(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[hsl(var(--accent))] shadow-inner"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {['All', 'Arithmetic', 'Algebra', 'Geometry'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTopic(t)}
                  className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${selectedTopic === t ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))] shadow-md' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:bg-white/90'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFormulas.map((f) => (
              <div key={f.id} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-5 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md hover:border-[hsl(var(--accent))]/30 transition-all group">
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded">{f.topic}</span>
                  <h4 className="font-bold text-slate-800 dark:text-white">{f.name}</h4>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/20 dark:border-white/5 flex items-center justify-between">
                    <code className="text-[hsl(var(--accent))] font-mono font-bold text-sm select-all">{f.formula}</code>
                    <button
                      onClick={() => handleCopy(f.id, f.formula)}
                      className="text-slate-400 hover:text-[hsl(var(--accent))] transition-colors p-1"
                    >
                      {copiedId === f.id ? <Check size={16} className="text-emerald-500"/> : <Copy size={16}/>}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. AI Concept & Training Modules */}
      {activeTab === 'modules' && (
        <div className="space-y-6">
          {!module ? (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Sparkles size={22} className="text-yellow-500 animate-pulse"/> AI Training Module Generator</h3>
                <p className="text-sm text-slate-500 mt-1">Generate comprehensive concept sheets, key worked examples, and pitfalls on-demand.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Section</label>
                  <select
                    value={section}
                    onChange={(e) => {
                      const sec = e.target.value as any;
                      setSection(sec);
                      if (sec === 'QA') { setTopic('Arithmetic'); setSubtopic('Time Speed Distance'); }
                      else if (sec === 'VARC') { setTopic('Reading Comprehension'); setSubtopic('Main Idea'); }
                      else { setTopic('Logical Reasoning'); setSubtopic('Binary Logic'); }
                    }}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    <option value="QA">QA</option>
                    <option value="VARC">VARC</option>
                    <option value="DILR">DILR</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    {section === 'QA' ? (
                      <>
                        <option value="Arithmetic">Arithmetic</option>
                        <option value="Algebra">Algebra</option>
                        <option value="Geometry">Geometry</option>
                        <option value="NumberSystem">Number System</option>
                      </>
                    ) : section === 'VARC' ? (
                      <option value="Reading Comprehension">Reading Comprehension</option>
                    ) : (
                      <option value="Logical Reasoning">Logical Reasoning</option>
                    )}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Subtopic</label>
                  <select
                    value={subtopic}
                    onChange={(e) => setSubtopic(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    {(subtopicMap[topic] || ['General Concept']).map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Target Level</label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    <option value="Beginner">Beginner (Concept check)</option>
                    <option value="Intermediate">Intermediate (Mock level)</option>
                    <option value="Advanced">Advanced (99.9%ile drill)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleGenerateModule}
                disabled={isLoading}
                className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[hsl(var(--accent))]/30 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Synthesize Concept Module'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Concept explanation */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/10">
                    <div>
                      <span className="text-xs font-black uppercase text-slate-500 tracking-wider">{module.topic} • {module.level}</span>
                      <h3 className="text-xl font-black mt-1 text-slate-800 dark:text-white">{subtopic} Concept Blueprint</h3>
                    </div>
                    <button
                      onClick={() => setModule(null)}
                      className="text-xs font-bold text-slate-500 hover:text-[hsl(var(--accent))] hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700"
                    >
                      New Topic
                    </button>
                  </div>
                  
                  {/* Explanation text */}
                  <div className="text-base leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {module.content.concept_explanation}
                  </div>
                  
                  {/* Worked Examples */}
                  <div className="space-y-4 pt-4 border-t border-slate-200/50 dark:border-white/10">
                    <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">Worked Examples</h4>
                    {module.content.worked_examples.map((ex, idx) => (
                      <div key={idx} className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/20 dark:border-white/5 space-y-3">
                        <p className="font-bold text-sm">Example {idx + 1} ({ex.type}):</p>
                        <p className="text-sm font-semibold">{ex.problem}</p>
                        <p className="text-xs text-slate-500 italic pt-2 border-t border-slate-200/20">Solution: {ex.solution}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar: key formulas, traps & tips */}
              <div className="space-y-6">
                {/* Formulas */}
                {module.content.key_formulas && module.content.key_formulas.length > 0 && (
                  <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
                    <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">Module Equations</h4>
                    <div className="space-y-3">
                      {module.content.key_formulas.map((form, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl space-y-1">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{form.name}</p>
                          <code className="text-xs font-mono font-bold text-[hsl(var(--accent))]">{form.formula}</code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Traps */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
                  <h4 className="font-black text-sm text-rose-500 uppercase tracking-wider flex items-center gap-2"><AlertCircle size={16}/> Common Traps & Errors</h4>
                  <div className="space-y-3">
                    {module.common_traps.map((trap, idx) => (
                      <p key={idx} className="text-xs text-slate-500 leading-relaxed pl-3 border-l-2 border-rose-500">{trap}</p>
                    ))}
                  </div>
                </div>

                {/* Tips */}
                <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl space-y-4">
                  <h4 className="font-black text-sm text-emerald-500 uppercase tracking-wider flex items-center gap-2"><Sparkles size={16}/> Pro Tips</h4>
                  <div className="space-y-3">
                    {module.tips.map((tip, idx) => (
                      <p key={idx} className="text-xs text-slate-500 leading-relaxed pl-3 border-l-2 border-emerald-500">{tip}</p>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
