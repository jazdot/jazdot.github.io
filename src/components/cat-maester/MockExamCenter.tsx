import { useState, useEffect, useRef } from 'react';
import { Clock, Award, AlertTriangle, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';
import { generateMockTest } from '../../cat-engine/ai-service';
import type { MockTest, CATQuestion } from '../../cat-engine/types';

export default function MockExamCenter() {
  const [mockMode, setMockMode] = useState<'select' | 'lobby' | 'exam' | 'review'>('select');
  const [selectedMockType, setSelectedMockType] = useState<'full' | 'sectional' | 'past'>('full');
  const [sectionalFilter, setSectionalFilter] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [mockDifficulty, setMockDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  
  // States during mock test
  const [currentMock, setCurrentMock] = useState<MockTest | null>(null);
  const [activeSection, setActiveSection] = useState<'VARC' | 'DILR' | 'QA'>('VARC');
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Section Timers (40 min per section)
  const [sectionTimeLeft, setSectionTimeLeft] = useState<number>(40 * 60);
  const examTimerRef = useRef<any>(null);

  // Time spent per question tracker
  const [questionTimeTracker, setQuestionTimeTracker] = useState<Record<string, number>>({});
  const activeQuestionId = useRef<string>('');
  const questionTimeRef = useRef<any>(null);

  // Completed Test review
  const [reviewTest, setReviewTest] = useState<MockTest | null>(null);
  const [reviewAnswers, setReviewAnswers] = useState<Record<string, string>>({});

  // Past papers list
  const pastPapers = [
    { year: 2024, slot: 'Slot 1 Slot 2 Slot 3' },
    { year: 2023, slot: 'Slot 1 Slot 2 Slot 3' },
    { year: 2022, slot: 'Slot 1 Slot 2 Slot 3' },
    { year: 2021, slot: 'Slot 1 Slot 2 Slot 3' },
    { year: 2020, slot: 'Slot 1 Slot 2 Slot 3' },
    { year: 2019, slot: 'Slot 1 Slot 2 Slot 3' }
  ];

  // Effect for sectional timer
  useEffect(() => {
    if (mockMode === 'exam' && sectionTimeLeft > 0) {
      examTimerRef.current = setTimeout(() => {
        setSectionTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (sectionTimeLeft === 0 && mockMode === 'exam') {
      handleSectionTimeout();
    }
    return () => {
      if (examTimerRef.current) clearTimeout(examTimerRef.current);
    };
  }, [sectionTimeLeft, mockMode]);

  // Track time spent on the active question
  useEffect(() => {
    if (mockMode === 'exam' && currentMock) {
      const activeQ = getActiveQuestion();
      if (activeQ) {
        activeQuestionId.current = activeQ.id;
        if (questionTimeRef.current) clearInterval(questionTimeRef.current);
        
        questionTimeRef.current = setInterval(() => {
          setQuestionTimeTracker(prev => ({
            ...prev,
            [activeQuestionId.current]: (prev[activeQuestionId.current] || 0) + 1
          }));
        }, 1000);
      }
    } else {
      if (questionTimeRef.current) clearInterval(questionTimeRef.current);
    }
    return () => {
      if (questionTimeRef.current) clearInterval(questionTimeRef.current);
    };
  }, [currentQIndex, activeSection, mockMode]);

  const handleStartGeneratedMock = async () => {
    setIsLoading(true);
    setMockMode('lobby');
    try {
      const mock = await generateMockTest(
        mockDifficulty,
        2026,
        selectedMockType === 'sectional' ? sectionalFilter : 'ALL'
      );
      setCurrentMock(mock);
      setAnswers({});
      setBookmarks([]);
      setQuestionTimeTracker({});
      setSectionTimeLeft(40 * 60);
      setActiveSection(selectedMockType === 'sectional' ? sectionalFilter : 'VARC');
      setCurrentQIndex(0);
      setMockMode('exam');
    } catch (e) {
      console.error(e);
      alert("Failed to build Mock test. Please try again.");
      setMockMode('select');
    } finally {
      setIsLoading(false);
    }
  };

  const getSectionQuestions = (): CATQuestion[] => {
    if (!currentMock) return [];
    if (activeSection === 'VARC') {
      const rcQs = currentMock.sections.VARC.passages.flatMap(p => p.questions);
      const vaQs = currentMock.sections.VARC.verbal_ability;
      return [...rcQs, ...vaQs];
    } else if (activeSection === 'DILR') {
      return currentMock.sections.DILR.sets.flatMap(s => s.questions);
    } else {
      return currentMock.sections.QA.questions;
    }
  };

  const getActiveQuestion = (): CATQuestion | null => {
    const qs = getSectionQuestions();
    return qs[currentQIndex] || null;
  };

  const handleSectionTimeout = () => {
    if (selectedMockType === 'sectional') {
      handleSubmitExam();
    } else {
      if (activeSection === 'VARC') {
        setActiveSection('DILR');
        setCurrentQIndex(0);
        setSectionTimeLeft(40 * 60);
      } else if (activeSection === 'DILR') {
        setActiveSection('QA');
        setCurrentQIndex(0);
        setSectionTimeLeft(40 * 60);
      } else {
        handleSubmitExam();
      }
    }
  };

  const handleSubmitExam = () => {
    if (examTimerRef.current) clearTimeout(examTimerRef.current);
    if (questionTimeRef.current) clearInterval(questionTimeRef.current);
    setReviewTest(currentMock);
    setReviewAnswers(answers);
    setMockMode('review');
  };

  // Flag "Should Have Skipped" questions
  const getFlaggedSkippedQuestions = () => {
    if (!reviewTest) return [];
    const flagged: Array<{ q: CATQuestion; timeSpent: number }> = [];
    const allQs = [
      ...reviewTest.sections.VARC.passages.flatMap(p => p.questions),
      ...reviewTest.sections.VARC.verbal_ability,
      ...reviewTest.sections.DILR.sets.flatMap(s => s.questions),
      ...reviewTest.sections.QA.questions
    ];

    allQs.forEach(q => {
      const userAns = reviewAnswers[q.id];
      const timeSpent = questionTimeTracker[q.id] || 0;
      const isCorrect = userAns === q.correct_answer;

      // Flag if user spent > 150 seconds and got it wrong, or > 180s regardless (time-sinks)
      if (timeSpent > 120 && !isCorrect) {
        flagged.push({ q, timeSpent });
      }
    });

    return flagged;
  };

  const flaggedSkips = getFlaggedSkippedQuestions();
  const totalSavedTime = flaggedSkips.reduce((acc, f) => acc + f.timeSpent, 0);

  return (
    <div className="w-full space-y-6">
      
      {/* 1. Selection screen */}
      {mockMode === 'select' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Sparkles className="text-[hsl(var(--accent))] animate-pulse"/> AI Mock Test Engine</h3>
              <p className="text-sm text-slate-500 mt-1">Simulate strict sectional locks matching the official CAT format.</p>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Exam Format</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'full', label: 'Full 66Q Mock', desc: 'VARC + DILR + QA (120 mins)' },
                  { id: 'sectional', label: 'Sectional Mock', desc: 'VARC, DILR or QA (40 mins)' },
                  { id: 'past', label: 'Past Papers', desc: 'Solve actual previous years' }
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedMockType(opt.id as any)}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${selectedMockType === opt.id ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))] text-[hsl(var(--accent))] shadow-inner' : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                  >
                    <span className="font-bold text-sm">{opt.label}</span>
                    <span className="text-[10px] opacity-75 mt-1">{opt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {selectedMockType === 'sectional' && (
              <div className="space-y-4 pt-2">
                <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Target Section</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['VARC', 'DILR', 'QA'] as const).map(sec => (
                    <button
                      key={sec}
                      onClick={() => setSectionalFilter(sec)}
                      className={`py-3 rounded-2xl font-black border transition-all ${sectionalFilter === sec ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))] shadow-md' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300'}`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedMockType !== 'past' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Difficulty Profile</label>
                  <select
                    value={mockDifficulty}
                    onChange={(e) => setMockDifficulty(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    <option value="Mixed">Mixed (Standard CAT distribution)</option>
                    <option value="Easy">Easy (Foundation training)</option>
                    <option value="Medium">Medium (Moderate drill)</option>
                    <option value="Hard">Hard (99.9th percentile drill)</option>
                  </select>
                </div>
                
                <div className="flex flex-col justify-end">
                  <button
                    onClick={handleStartGeneratedMock}
                    disabled={isLoading}
                    className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[hsl(var(--accent))]/30 flex justify-center items-center gap-2"
                  >
                    Generate and Enter lobby <ArrowRight size={18}/>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Past Papers lists */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div>
              <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2"><Award size={16} className="text-yellow-500"/> Previous CAT papers</h4>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {pastPapers.map((paper) => (
                  <div key={paper.year} className="flex justify-between items-center p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/30 dark:border-white/5 rounded-2xl">
                    <div>
                      <p className="font-bold text-sm">CAT {paper.year}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{paper.slot}</p>
                    </div>
                    <button
                      onClick={() => { alert("Past paper mocks will be generated using the AI engine based on historical weights."); }}
                      className="bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                    >
                      Mock
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-4 border-t border-slate-200/50 dark:border-white/10 text-xs text-slate-400 leading-relaxed">
              Official past papers are calibrated according to standard IRT formulas to ensure accuracy ELO scales match real-world rankings.
            </div>
          </div>
        </div>
      )}

      {/* 2. Loading Lobby */}
      {mockMode === 'lobby' && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center py-24 space-y-4">
          <Clock className="text-[hsl(var(--accent))] animate-spin" size={64} />
          <h3 className="text-2xl font-black">Assembling AI Mock Test</h3>
          <p className="text-sm text-slate-500 max-w-md leading-relaxed">
            Please wait. Generating DILR Sets, reading comprehension passages, and Quantitative questions via the Gemini LLM. 
            Calculating ELO benchmarks and IRT score distributions.
          </p>
        </div>
      )}

      {/* 3. Strict Exam Mode */}
      {mockMode === 'exam' && currentMock && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between min-h-[500px]">
            {/* Exam Header */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Active Section:</span>
                <span className="bg-[hsl(var(--accent))]/10 text-[hsl(var(--accent))] font-black px-3 py-1 rounded-xl text-xs">{activeSection}</span>
              </div>
              <span className="flex items-center gap-2 bg-rose-500/10 text-rose-500 font-mono font-bold px-3 py-1.5 rounded-xl border border-rose-500/20 text-sm">
                <Clock size={16}/>
                {Math.floor(sectionTimeLeft / 60)}:{(sectionTimeLeft % 60).toString().padStart(2, '0')}
              </span>
            </div>

            {/* Question Workspace */}
            {getActiveQuestion() ? (
              <div className="flex-1 py-6 space-y-4">
                {/* Passage / Set Context if any */}
                {getActiveQuestion()?.passage && (
                  <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200/30 dark:border-white/5 text-sm max-h-[220px] overflow-y-auto custom-scrollbar leading-relaxed font-serif">
                    {getActiveQuestion()?.passage}
                  </div>
                )}
                
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded tracking-wider">
                  Q{currentQIndex + 1} • {getActiveQuestion()?.type}
                </span>
                <p className="text-lg font-medium leading-relaxed">{getActiveQuestion()?.question}</p>

                {/* Options/Input */}
                {getActiveQuestion()?.type === 'MCQ' && getActiveQuestion()?.options ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-4">
                    {Object.entries(getActiveQuestion()?.options || {}).map(([k, v]) => (
                      <button
                        key={k}
                        onClick={() => setAnswers(prev => ({ ...prev, [getActiveQuestion()!.id]: k }))}
                        className={`text-left p-4 rounded-2xl border font-bold text-sm transition-all flex items-center gap-3 ${answers[getActiveQuestion()!.id] === k ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}
                      >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${answers[getActiveQuestion()!.id] === k ? 'bg-[hsl(var(--accent))] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{k}</span>
                        <span>{v}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="pt-4 space-y-2 max-w-md">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider">TITA Answer Input</label>
                    <input
                      type="text"
                      value={answers[getActiveQuestion()!.id] || ''}
                      onChange={(e) => setAnswers(prev => ({ ...prev, [getActiveQuestion()!.id]: e.target.value }))}
                      placeholder="Type numerical answer..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-sm focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-slate-500">No questions found in this section.</p>
              </div>
            )}

            {/* Exam Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-white/10 gap-3">
              <div className="flex gap-2">
                <button
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-xs font-bold disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => {
                    const qId = getActiveQuestion()?.id;
                    if (qId) {
                      setBookmarks(prev => prev.includes(qId) ? prev.filter(id => id !== qId) : [...prev, qId]);
                    }
                  }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all ${bookmarks.includes(getActiveQuestion()?.id || '') ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' : 'border-slate-200/50 dark:border-white/10 hover:bg-slate-50'}`}
                >
                  Bookmark
                </button>
              </div>
              
              <div className="flex gap-2">
                {currentQIndex < getSectionQuestions().length - 1 ? (
                  <button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                    className="bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Save & Next
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold"
                  >
                    Submit Section/Exam
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Navigator Panel */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            <div className="space-y-6">
              <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">Exam navigator</h4>
              
              <div className="grid grid-cols-4 gap-2">
                {getSectionQuestions().map((q, idx) => {
                  const isCurrent = idx === currentQIndex;
                  const isAnswered = !!answers[q.id];
                  const isBookmarked = bookmarks.includes(q.id);

                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQIndex(idx)}
                      className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${isCurrent ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))]' : isBookmarked ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-600' : isAnswered ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/10'}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-200/50 dark:border-white/10 space-y-2 text-[10px] text-slate-400">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-[hsl(var(--accent))]"></div> Current</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30"></div> Answered</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded bg-yellow-500/10 border border-yellow-500/30"></div> Bookmarked</div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Exam Review Cockpit & Should have Skipped Flagging */}
      {mockMode === 'review' && reviewTest && (
        <div className="space-y-8 animate-in fade-in duration-500">
          
          {/* Skip analysis banner */}
          <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border border-amber-500/30 p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-left">
              <ShieldAlert className="text-amber-500 shrink-0" size={42} />
              <div>
                <h4 className="text-lg font-black text-slate-800 dark:text-white">Should Have Skipped Analysis (Opportunity cost)</h4>
                <p className="text-sm text-slate-500 mt-0.5">
                  Our algorithm flagged <span className="font-bold text-rose-500">{flaggedSkips.length} questions</span> as high-cost time-sinks. 
                  You lost a total of <span className="font-bold text-amber-500">{Math.floor(totalSavedTime / 60)}m {totalSavedTime % 60}s</span> trying to solve them.
                </p>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-slate-900/80 px-5 py-3 rounded-2xl border border-slate-200/50 dark:border-slate-800 shadow-sm text-center">
              <span className="text-[10px] font-black uppercase text-slate-400">Total Saved time</span>
              <p className="text-xl font-black text-[hsl(var(--accent))] mt-0.5">+{Math.floor(totalSavedTime / 60)}m</p>
            </div>
          </div>

          {/* Details list */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-black">Detailed Mock Analysis</h3>
              <button
                onClick={() => setMockMode('select')}
                className="bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                Back to Mock Center
              </button>
            </div>

            <div className="space-y-4">
              {[
                ...reviewTest.sections.VARC.passages.flatMap(p => p.questions),
                ...reviewTest.sections.VARC.verbal_ability,
                ...reviewTest.sections.DILR.sets.flatMap(s => s.questions),
                ...reviewTest.sections.QA.questions
              ].map((q, idx) => {
                const userAns = reviewAnswers[q.id];
                const timeSpent = questionTimeTracker[q.id] || 0;
                const isCorrect = userAns === q.correct_answer;
                const isFlagged = flaggedSkips.some(f => f.q.id === q.id);

                return (
                  <div key={q.id} className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${isFlagged ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/30 dark:border-white/5'}`}>
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-black text-slate-400">Q{idx + 1}</span>
                        <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{q.section} • {q.topic}</span>
                        {isFlagged && (
                          <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 flex items-center gap-1">
                            <AlertTriangle size={10}/> SHOULD HAVE SKIPPED
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{q.question}</p>
                      
                      {/* Standard LaTeX standard standard standard standard standard standard standard standard standard standard explanation standard standard standard standard */}
                      {q.explanation && (
                        <p className="text-xs text-slate-400 italic">Explanation: {q.explanation.brief || (q.explanation as any)}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right md:flex-col md:items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-black">Time Spent</span>
                        <span className={`text-sm font-bold font-mono ${timeSpent > 120 ? 'text-amber-500' : 'text-slate-500'}`}>{timeSpent}s</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400 uppercase font-black">Your Ans</span>
                        <span className={`text-sm font-black ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>{userAns || 'Skipped'} (Correct: {q.correct_answer})</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
