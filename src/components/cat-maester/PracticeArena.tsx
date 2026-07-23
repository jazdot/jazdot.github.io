import { useState, useEffect, useRef } from 'react';
import { 
  PlayCircle, Clock, BookOpen, Layers, Edit3, Sparkles, ChevronRight, ChevronLeft, 
  Loader2, Award, ShieldAlert, X, RefreshCw, Compass, CheckCircle2, Bot, Trash, Trash2
} from 'lucide-react';
import { generateCatQuestions, generateDILRSet, generateRCPassage } from '../../cat-engine/ai-service';
import type { CATQuestion, DILRSet, RCPassage } from '../../cat-engine/types';
import { useCatStore } from '../../pages/catStore';

export default function PracticeArena({
  saveDrillResult,
  getDrillResults,
  deleteDrillResult,
  clearAllDrills
}: {
  saveDrillResult: (drill: any) => Promise<any>;
  getDrillResults: () => Promise<any[]>;
  deleteDrillResult: (id: string) => Promise<any>;
  clearAllDrills: () => Promise<any>;
}) {
  const [activeSubTab, setActiveSubTab] = useState<'topic' | 'builder' | 'rc' | 'dilr' | 'history'>('topic');
  const { progress } = useCatStore();
  
  // Custom Test Builder states
  const [selectedSection, setSelectedSection] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [testDifficulty, setTestDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [customQuestions, setCustomQuestions] = useState<CATQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [testActive, setTestActive] = useState<boolean>(false);
  
  // Custom Timer
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<any>(null);

  // RC States
  const [rcDomain, setRcDomain] = useState<string>('Economics & Business');
  const [rcDifficulty, setRcDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [rcPassage, setRcPassage] = useState<RCPassage | null>(null);
  const [rcReadingTime, setRcReadingTime] = useState<number>(0);
  const [rcTimerActive, setRcTimerActive] = useState<boolean>(false);
  const [rcDoneReading, setRcDoneReading] = useState<boolean>(false);
  const [rcWPM, setRcWPM] = useState<number>(0);
  const rcTimerRef = useRef<any>(null);

  // DILR States
  const [dilrType, setDilrType] = useState<'Logical Reasoning' | 'Data Interpretation'>('Logical Reasoning');
  const [dilrSubtype, setDilrSubtype] = useState<string>('Binary Logic');
  const [dilrDifficulty, setDilrDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [dilrSet, setDilrSet] = useState<DILRSet | null>(null);
  const [dilrScratchpad, setDilrScratchpad] = useState<string>('');
  const [showScratchpad, setShowScratchpad] = useState<boolean>(true);
  const [dilrTimer, setDilrTimer] = useState<number>(0);
  const dilrTimerRef = useRef<any>(null);

  // Standalone subject states
  const [selectedSubject, setSelectedSubject] = useState<'QA' | 'VARC' | 'DILR'>('QA');
  const [selectedSubjectTopic, setSelectedSubjectTopic] = useState<string>('Arithmetic');
  const [subjectDifficulty, setSubjectDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isSubjectAdaptive, setIsSubjectAdaptive] = useState<boolean>(false);
  const [subjectCustomTopic, setSubjectCustomTopic] = useState<string>('');
  const [subjectDrillQuestions, setSubjectDrillQuestions] = useState<CATQuestion[]>([]);
  const [subjectDrillActive, setSubjectDrillActive] = useState<boolean>(false);
  const [subjectDrillTimer, setSubjectDrillTimer] = useState<number>(0);
  const subjectDrillTimerRef = useRef<any>(null);

  // Drill Review and History States
  const [activeReviewDrill, setActiveReviewDrill] = useState<any | null>(null);
  const [drillHistoryList, setDrillHistoryList] = useState<any[]>([]);
  
  // Topic Wise Data
  const topicsBySection = {
    QA: ['Arithmetic', 'Algebra', 'Geometry', 'NumberSystem', 'ModernMath'],
    VARC: ['Reading Comprehension', 'Para Jumble', 'Para Summary', 'Odd Sentence Out'],
    DILR: ['Binary Logic', 'Venn Diagrams', 'Arrangements', 'Caselet', 'Games & Tournaments', 'Matrix Grid']
  };

  // Timer effect for Custom Mock
  useEffect(() => {
    if (testActive && isTimed && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && testActive && isTimed) {
      handleEndTest();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, testActive, isTimed]);

  // Timer effect for RC Reading WPM
  useEffect(() => {
    if (rcTimerActive) {
      rcTimerRef.current = setInterval(() => {
        setRcReadingTime(prev => prev + 1);
      }, 1000);
    } else {
      if (rcTimerRef.current) clearInterval(rcTimerRef.current);
    }
    return () => {
      if (rcTimerRef.current) clearInterval(rcTimerRef.current);
    };
  }, [rcTimerActive]);

  // Timer effect for DILR
  useEffect(() => {
    if (dilrSet && !testActive) {
      dilrTimerRef.current = setInterval(() => {
        setDilrTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (dilrTimerRef.current) clearInterval(dilrTimerRef.current);
    }
    return () => {
      if (dilrTimerRef.current) clearInterval(dilrTimerRef.current);
    };
  }, [dilrSet, testActive]);

  // Timer effect for Standalone Subject Drills
  useEffect(() => {
    if (subjectDrillActive) {
      subjectDrillTimerRef.current = setInterval(() => {
        setSubjectDrillTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (subjectDrillTimerRef.current) clearInterval(subjectDrillTimerRef.current);
    }
    return () => {
      if (subjectDrillTimerRef.current) clearInterval(subjectDrillTimerRef.current);
    };
  }, [subjectDrillActive]);

  // Fetch Drill History on Load
  const fetchDrillHistory = async () => {
    try {
      const list = await getDrillResults();
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setDrillHistoryList(list);
    } catch (e) {
      console.error("Error loading drill history", e);
    }
  };

  useEffect(() => {
    fetchDrillHistory();
  }, []);

  // Helper to toggle topic selections
  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleStartCustomTest = async () => {
    setIsLoading(true);
    setTestActive(false);
    try {
      const questions: CATQuestion[] = [];
      const topicsToFetch = selectedTopics.length > 0 ? selectedTopics : topicsBySection[selectedSection];
      
      // Fetch dynamic questions
      for (let i = 0; i < Math.ceil(questionCount / topicsToFetch.length); i++) {
        for (const topic of topicsToFetch) {
          if (questions.length < questionCount) {
            const qs = await generateCatQuestions(selectedSection, topic, 'General Practice', testDifficulty, 'AUTO', 1);
            if (qs && qs[0]) questions.push(qs[0]);
          }
        }
      }

      setCustomQuestions(questions);
      setCurrentQuestionIdx(0);
      setUserAnswers({});
      setIsTimed(isTimed);
      if (isTimed) setTimeLeft(questionCount * 120); // 2 minutes per question
      setTestActive(true);
    } catch (e) {
      console.error(e);
      alert("Failed to build custom test. Try selecting fewer topics or try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndDrill = async (
    type: 'custom_test' | 'rc_passage' | 'dilr_set' | 'subject_drill',
    questions: CATQuestion[],
    answers: Record<string, string>,
    duration: number,
    titleExtra?: string
  ) => {
    // Stop all timers
    if (timerRef.current) clearTimeout(timerRef.current);
    if (rcTimerRef.current) clearInterval(rcTimerRef.current);
    if (dilrTimerRef.current) clearInterval(dilrTimerRef.current);
    if (subjectDrillTimerRef.current) clearInterval(subjectDrillTimerRef.current);

    let correctCount = 0;
    let score = 0;
    const timeSpentPerQ: Record<string, number> = {};
    const avgTime = Math.round(duration / Math.max(1, questions.length));

    questions.forEach(q => {
      const userAns = answers[q.id]?.trim().toLowerCase();
      
      const correctAns = String(q.correct_answer || '').trim().toLowerCase();

      const isCorrect = userAns === correctAns;
      if (isCorrect) {
        correctCount++;
        score += 3;
      } else if (userAns) {
        if (q.type === 'MCQ') score -= 1;
      }

      const qTime = avgTime;
      timeSpentPerQ[q.id] = qTime;

      // Update Zustand analytics
      const topicName = q.topic || 'General';
      const secName = q.section || selectedSection;
      
      useCatStore.getState().addTopicStatResult(topicName, isCorrect, !userAns, qTime, q.id);
      useCatStore.getState().updateSkillRating(
        secName as 'QA' | 'VARC' | 'DILR',
        q.difficulty === 'Hard' ? 1500 : q.difficulty === 'Easy' ? 900 : 1200,
        isCorrect
      );
    });

    useCatStore.getState().updatePracticeStreak(correctCount > 0);

    const drillResult = {
      id: `drill_${Date.now()}`,
      type,
      title: titleExtra || (type === 'custom_test' ? 'Custom Test' : type === 'rc_passage' ? 'RC Passage Drill' : type === 'dilr_set' ? 'DILR Set Drill' : 'Standalone Subjects Drill'),
      date: new Date().toISOString(),
      duration,
      questions,
      answers,
      timeSpent: timeSpentPerQ,
      score,
      accuracy: Math.round((correctCount / questions.length) * 100)
    };

    // Save to IndexedDB
    await saveDrillResult(drillResult);

    // Refresh history list
    fetchDrillHistory();

    // Reset cockpit states
    setTestActive(false);
    setRcPassage(null);
    setRcDoneReading(false);
    setDilrSet(null);
    setSubjectDrillQuestions([]);
    setSubjectDrillActive(false);

    // Load review screen
    setActiveReviewDrill(drillResult);
  };

  const handleEndTest = () => {
    const elapsed = isTimed ? (questionCount * 120) - timeLeft : 0;
    handleEndDrill('custom_test', customQuestions, userAnswers, elapsed);
  };

  // RC Reading Start
  const handleStartRC = async () => {
    setIsLoading(true);
    setRcPassage(null);
    setRcDoneReading(false);
    setRcReadingTime(0);
    setRcWPM(0);
    try {
      const passage = await generateRCPassage(rcDomain, rcDifficulty, 4);
      setRcPassage(passage);
      setRcTimerActive(true);
    } catch (e) {
      console.error(e);
      alert("Failed to generate RC passage.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDoneReading = () => {
    setRcTimerActive(false);
    setRcDoneReading(true);
    if (rcPassage) {
      const wordCount = rcPassage.word_count || rcPassage.passage.split(/\s+/).length;
      const speed = Math.round((wordCount / Math.max(1, rcReadingTime)) * 60);
      setRcWPM(speed);
    }
  };

  // DILR Set practice
  const handleStartDILR = async () => {
    setIsLoading(true);
    setDilrSet(null);
    setDilrScratchpad('');
    setDilrTimer(0);
    try {
      const resultSet = await generateDILRSet(dilrType, dilrSubtype, dilrDifficulty);
      setDilrSet(resultSet);
    } catch (e) {
      console.error(e);
      alert("Failed to generate DILR set.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSubjectDrill = async () => {
    setIsLoading(true);
    setSubjectCustomTopic('');
    
    // Determine target difficulty based on user skill ratings
    const userRating = progress.skillRatings?.[selectedSubject] || 1200;
    const finalDifficulty = isSubjectAdaptive 
      ? (userRating < 1000 ? 'Easy' : userRating > 1400 ? 'Hard' : 'Medium')
      : subjectDifficulty;
      
    const finalTopic = subjectCustomTopic.trim() || selectedSubjectTopic;

    try {
      if (selectedSubject === 'VARC' && finalTopic === 'Reading Comprehension') {
        setRcDomain('Economics & Business');
        setRcDifficulty(finalDifficulty);
        const passage = await generateRCPassage('Economics & Business', finalDifficulty, 4);
        setRcPassage(passage);
        setRcReadingTime(0);
        setRcWPM(0);
        setRcTimerActive(true);
        setActiveSubTab('rc');
      } else if (selectedSubject === 'DILR') {
        setDilrType('Logical Reasoning');
        setDilrSubtype(finalTopic);
        setDilrDifficulty(finalDifficulty);
        const resultSet = await generateDILRSet('Logical Reasoning', finalTopic, finalDifficulty);
        setDilrSet(resultSet);
        setDilrTimer(0);
        setDilrScratchpad('');
        setActiveSubTab('dilr');
      } else {
        const qs = await generateCatQuestions(selectedSubject, finalTopic, 'General Drill', finalDifficulty, 'AUTO', 5);
        if (qs && qs.length > 0) {
          // Normalise section parameter
          const normalizedQs = qs.map(q => ({ ...q, section: selectedSubject }));
          setSubjectDrillQuestions(normalizedQs);
          setUserAnswers({});
          setSubjectDrillActive(true);
          setCurrentQuestionIdx(0);
          setSubjectDrillTimer(0);
        } else {
          alert("Could not generate drill questions. Please try again.");
        }
      }
    } catch (e) {
      console.error(e);
      alert("Error generating subject drill. Please check your API configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  if (activeReviewDrill) {
    return (
      <DrillReviewCockpit 
        drill={activeReviewDrill} 
        onClose={() => setActiveReviewDrill(null)} 
        userAnswers={activeReviewDrill.answers}
        deleteDrillResult={deleteDrillResult}
        fetchDrillHistory={fetchDrillHistory}
      />
    );
  }

  return (
    <div className="w-full space-y-6">
      
      {/* Sub tabs header */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1 gap-2 custom-scrollbar">
        {[
          { id: 'topic', label: 'Subjects & Standalone Drill', icon: Edit3 },
          { id: 'builder', label: 'Custom Test Builder', icon: PlayCircle },
          { id: 'rc', label: 'RC Passage & WPM', icon: BookOpen },
          { id: 'dilr', label: 'DILR Set Practice', icon: Layers },
          { id: 'history', label: 'Saved Drills', icon: Clock }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id as any); setTestActive(false); setSubjectDrillActive(false); }}
            className={`flex items-center gap-2 px-5 py-3 rounded-t-xl font-bold text-sm transition-all whitespace-nowrap border-b-2 ${activeSubTab === tab.id ? 'border-[hsl(var(--accent))] text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/5' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Render Sub Tabs */}
      
      {/* 1. Custom Test Builder */}
      {activeSubTab === 'builder' && !testActive && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="text-yellow-500 animate-pulse" size={24}/> Custom Test Constructor
              </h3>
              <p className="text-sm text-slate-500 mt-1">Design a practice session matching your exact topic focus and difficulty targets.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
            {/* Left Options */}
            <div className="space-y-6">
              {/* Select Section */}
              <div className="space-y-3">
                <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Section focus</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['QA', 'VARC', 'DILR'] as const).map(sec => (
                    <button
                      key={sec}
                      onClick={() => { setSelectedSection(sec); setSelectedTopics([]); }}
                      className={`py-3 rounded-2xl font-black border transition-all ${selectedSection === sec ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))] shadow-lg shadow-[hsl(var(--accent))]/25' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'}`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty & Count */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Difficulty</label>
                  <select
                    value={testDifficulty}
                    onChange={(e) => setTestDifficulty(e.target.value as any)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium (CAT Ideal)</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Questions</label>
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                    <option value={20}>20 Questions</option>
                  </select>
                </div>
              </div>

              {/* Timer options */}
              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-white/5 rounded-2xl">
                <div>
                  <h4 className="font-bold text-sm">Strict Sectional Timer</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Enforce a 2-minute constraint per question.</p>
                </div>
                <button
                  onClick={() => setIsTimed(!isTimed)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${isTimed ? 'bg-[hsl(var(--accent))]' : 'bg-slate-300 dark:bg-slate-600'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${isTimed ? 'left-7' : 'left-1'}`}/>
                </button>
              </div>
            </div>

            {/* Right: Topics Selection */}
            <div className="space-y-3 flex flex-col">
              <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Select Topics (All if none selected)</label>
              <div className="flex-1 min-h-[180px] bg-slate-50 dark:bg-slate-800/20 border border-slate-200/50 dark:border-white/5 rounded-2xl p-4 overflow-y-auto max-h-[250px] grid grid-cols-2 gap-2">
                {topicsBySection[selectedSection].map(topic => {
                  const isSel = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      onClick={() => toggleTopic(topic)}
                      className={`px-3 py-2 text-xs font-bold rounded-xl text-left border transition-all ${isSel ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))]/40 text-[hsl(var(--accent))]' : 'bg-white/40 dark:bg-slate-800/30 border-slate-200/50 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleStartCustomTest}
                disabled={isLoading}
                className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[hsl(var(--accent))]/30 flex justify-center items-center gap-2"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Construct and Start Test <ChevronRight size={18}/></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Builder Test Running Cockpit */}
      {activeSubTab === 'builder' && testActive && customQuestions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col space-y-6 min-h-[500px]">
            {/* Header info */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/10">
              <span className="text-xs font-black uppercase text-slate-500 tracking-wider">Question {currentQuestionIdx + 1} of {customQuestions.length}</span>
              {isTimed && (
                <span className="flex items-center gap-2 bg-rose-500/10 text-rose-500 font-mono font-bold px-3 py-1.5 rounded-xl border border-rose-500/20 text-sm">
                  <Clock size={16} />
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </span>
              )}
            </div>

            {/* Question Text */}
            <div className="flex-1 py-4">
              <span className="text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded mb-4 inline-block">{customQuestions[currentQuestionIdx].topic} • {customQuestions[currentQuestionIdx].difficulty}</span>
              <p className="text-lg font-medium leading-relaxed text-slate-800 dark:text-slate-100">{customQuestions[currentQuestionIdx].question}</p>
              
              {/* Options */}
              {customQuestions[currentQuestionIdx].type === 'MCQ' && customQuestions[currentQuestionIdx].options ? (
                <div className="mt-8 space-y-3">
                  {Object.entries(customQuestions[currentQuestionIdx].options || {}).map(([key, value]) => {
                    const isSelected = userAnswers[customQuestions[currentQuestionIdx].id] === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setUserAnswers(prev => ({ ...prev, [customQuestions[currentQuestionIdx].id]: key }))}
                        className={`w-full text-left p-4 rounded-2xl border font-bold text-sm transition-all flex items-center gap-3 ${isSelected ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))] text-[hsl(var(--accent))] shadow-inner' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}
                      >
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? 'bg-[hsl(var(--accent))] text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{key}</span>
                        <span>{value}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 space-y-3">
                  <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Type in the Answer (TITA)</label>
                  <input
                    type="text"
                    value={userAnswers[customQuestions[currentQuestionIdx].id] || ''}
                    onChange={(e) => setUserAnswers(prev => ({ ...prev, [customQuestions[currentQuestionIdx].id]: e.target.value }))}
                    placeholder="Enter numerical answer..."
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
                  />
                </div>
              )}
            </div>

            {/* Navigation Actions */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-white/10 gap-3">
              <button
                disabled={currentQuestionIdx === 0}
                onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                className="px-4 py-3 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 text-sm font-bold flex items-center gap-2"
              >
                <ChevronLeft size={16}/> Prev
              </button>
              
              {currentQuestionIdx < customQuestions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                  className="bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-[hsl(var(--accent))]/20"
                >
                  Next <ChevronRight size={16}/>
                </button>
              ) : (
                <button
                  onClick={handleEndTest}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20"
                >
                  Submit Test
                </button>
              )}
            </div>
          </div>

          {/* Right Navigation sidebar */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl space-y-6">
            <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">Question Palette</h4>
            <div className="grid grid-cols-5 gap-2">
              {customQuestions.map((q, idx) => {
                const isCurrent = idx === currentQuestionIdx;
                const isAnswered = !!userAnswers[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIdx(idx)}
                    className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${isCurrent ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))] shadow-md' : isAnswered ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/10 hover:border-[hsl(var(--accent))]/50'}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. RC Passage Practice */}
      {activeSubTab === 'rc' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings / Reading Panel */}
          <div className="lg:col-span-2 space-y-6">
            {!rcPassage ? (
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><BookOpen className="text-indigo-500"/> RC Passage Trainer</h3>
                  <p className="text-sm text-slate-500 mt-1">Train your reading comprehension and monitor dynamic WPM speeds.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Passage Domain</label>
                    <select
                      value={rcDomain}
                      onChange={(e) => setRcDomain(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                    >
                      <option value="Economics & Business">Economics & Business</option>
                      <option value="Science & Technology">Science & Technology</option>
                      <option value="Philosophy & Arts">Philosophy & Arts</option>
                      <option value="History & Anthropology">History & Anthropology</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Difficulty</label>
                    <select
                      value={rcDifficulty}
                      onChange={(e) => setRcDifficulty(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleStartRC}
                  disabled={isLoading}
                  className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[hsl(var(--accent))]/30 flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Generate RC Passage'}
                </button>
              </div>
            ) : (
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/10">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">{rcDomain} • {rcDifficulty}</span>
                  {!rcDoneReading ? (
                    <span className="bg-indigo-500/10 text-indigo-500 font-mono font-bold px-3 py-1.5 rounded-xl border border-indigo-500/20 text-xs flex items-center gap-1.5">
                      <Clock size={14} className="animate-spin"/> Reading: {rcReadingTime}s
                    </span>
                  ) : (
                    <span className="bg-emerald-500/10 text-emerald-500 font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs">
                      Speed Captured: {rcWPM} WPM
                    </span>
                  )}
                </div>

                {/* Passage Text */}
                <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar text-base leading-relaxed text-slate-800 dark:text-slate-200 select-none whitespace-pre-line font-serif">
                  {rcPassage.passage}
                </div>

                {!rcDoneReading && (
                  <button
                    onClick={handleDoneReading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 flex justify-center items-center gap-2"
                  >
                    Done Reading - Answer Questions
                  </button>
                )}
              </div>
            )}
          </div>

          {/* RC Questions Panel */}
          <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
            {rcPassage && rcDoneReading ? (
              <div className="space-y-6">
                <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">RC Questions</h4>
                <div className="space-y-4">
                  {rcPassage.questions.map((q, idx) => (
                    <div key={q.id} className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200/30 dark:border-white/5 space-y-3">
                      <p className="text-sm font-bold">{idx + 1}. {q.question}</p>
                      <div className="space-y-2">
                        {q.options && Object.entries(q.options).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: k }))}
                            className={`w-full text-left p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${userAnswers[q.id] === k ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300'}`}
                          >
                            <span className="font-bold">{k}.</span>
                            <span>{v}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleEndDrill('rc_passage', rcPassage.questions.map(q => ({ ...q, passage: rcPassage.passage })), userAnswers, rcReadingTime, `RC Passage: ${rcDomain}`)}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-sm shadow-md shadow-emerald-500/20"
                >
                  Submit RC Drill
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 py-10 space-y-3">
                <BookOpen size={48} className="opacity-30" />
                <p className="text-sm font-bold">Passage Questions Locked</p>
                <p className="text-xs text-slate-400 max-w-[200px]">Read the passage on the left and click "Done Reading" to unlock questions.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Set-level DILR Practice */}
      {activeSubTab === 'dilr' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Main workspace */}
          <div className="lg:col-span-3 space-y-6">
            {!dilrSet ? (
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2"><Layers className="text-emerald-500"/> DILR Set Coach</h3>
                  <p className="text-sm text-slate-500 mt-1">Practice timed set-level logic puzzles with an integrated constraint organizer.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Set Type</label>
                    <select
                      value={dilrType}
                      onChange={(e) => setDilrType(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                    >
                      <option value="Logical Reasoning">Logical Reasoning</option>
                      <option value="Data Interpretation">Data Interpretation</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Subtype</label>
                    <select
                      value={dilrSubtype}
                      onChange={(e) => setDilrSubtype(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                    >
                      {dilrType === 'Logical Reasoning' ? (
                        <>
                          <option value="Binary Logic">Binary Logic</option>
                          <option value="Arrangements & Order">Arrangements & Order</option>
                          <option value="Venn Diagrams">Venn Diagrams</option>
                          <option value="Games & Tournaments">Games & Tournaments</option>
                        </>
                      ) : (
                        <>
                          <option value="Caselet">Caselet</option>
                          <option value="Charts & Graphs">Charts & Graphs</option>
                          <option value="Tables & Matrices">Tables & Matrices</option>
                        </>
                      )}
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Difficulty</label>
                    <select
                      value={dilrDifficulty}
                      onChange={(e) => setDilrDifficulty(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleStartDILR}
                  disabled={isLoading}
                  className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[hsl(var(--accent))]/30 flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Generate DILR Set'}
                </button>
              </div>
            ) : (
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/10">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">{dilrSubtype} • {dilrDifficulty}</span>
                  <span className="bg-emerald-500/10 text-emerald-500 font-mono font-bold px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs flex items-center gap-1.5">
                    <Clock size={14} className="animate-spin"/> Timer: {Math.floor(dilrTimer / 60)}:{(dilrTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Puzzle Context */}
                <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200/30 dark:border-white/5 text-base leading-relaxed whitespace-pre-line font-medium text-slate-800 dark:text-slate-200">
                  {dilrSet.context}
                </div>

                {/* Sub Questions */}
                <div className="space-y-6 pt-4">
                  <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">Set Questions (5)</h4>
                  {dilrSet.questions.map((q, idx) => (
                    <div key={q.id} className="p-5 bg-white/40 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/10 space-y-4">
                      <p className="text-sm font-bold">{idx + 1}. {q.question}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {q.options && Object.entries(q.options).map(([k, v]) => (
                          <button
                            key={k}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: k }))}
                            className={`text-left p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${userAnswers[q.id] === k ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))] text-[hsl(var(--accent))]' : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300'}`}
                          >
                            <span className="font-bold">{k}.</span>
                            <span>{v}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleEndDrill('dilr_set', dilrSet.questions.map(q => ({ ...q, passage: dilrSet.context })), userAnswers, dilrTimer, `DILR Set: ${dilrSubtype}`)}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-500/20 text-sm"
                  >
                    Submit DILR Set
                  </button>
                  <button
                    onClick={() => setShowScratchpad(!showScratchpad)}
                    className="px-5 border border-slate-300 dark:border-slate-700 rounded-2xl font-bold text-xs"
                  >
                    {showScratchpad ? 'Hide Scratchpad' : 'Show Scratchpad'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* DILR Scratchpad */}
          {dilrSet && showScratchpad && (
            <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl flex flex-col h-[500px] lg:h-auto">
              <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2"><Edit3 size={16}/> Puzzle Organizer</h4>
              <p className="text-[10px] text-slate-400 mb-4">Structure variables, draft schedules, grids, or venn relations here.</p>
              <textarea
                value={dilrScratchpad}
                onChange={(e) => setDilrScratchpad(e.target.value)}
                placeholder="A = [Mon, QA]&#10;B = [Tue, DILR]&#10;&#10;Use this sandbox space for constraint layouts..."
                className="flex-1 w-full bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-xs font-mono focus:outline-none resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Standalone Subjects Drill Engine */}
      {activeSubTab === 'topic' && (
        <div className="w-full">
          {subjectDrillActive && subjectDrillQuestions.length > 0 ? (
            /* Subject Drill Cockpit */
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col space-y-6 min-h-[500px]">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/50 dark:border-white/10">
                  <span className="text-xs font-black uppercase text-slate-500 tracking-wider">
                    {selectedSubject} Standalone Drill • Question {currentQuestionIdx + 1} of {subjectDrillQuestions.length}
                  </span>
                  <span className="flex items-center gap-2 bg-rose-500/10 text-rose-500 font-mono font-bold px-3 py-1.5 rounded-xl border border-rose-500/20 text-sm">
                    <Clock size={16} />
                    {Math.floor(subjectDrillTimer / 60)}:{(subjectDrillTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>

                {/* Question */}
                <div className="flex-1 py-4">
                  <span className="text-xs font-bold bg-indigo-500/10 text-indigo-500 px-2 py-1 rounded-md mb-4 inline-block">
                    {subjectDrillQuestions[currentQuestionIdx].topic} • {subjectDrillQuestions[currentQuestionIdx].difficulty}
                  </span>
                  <p className="text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                    {subjectDrillQuestions[currentQuestionIdx].question}
                  </p>

                  {/* Options */}
                  {subjectDrillQuestions[currentQuestionIdx].type === 'MCQ' && subjectDrillQuestions[currentQuestionIdx].options ? (
                    <div className="mt-8 space-y-3">
                      {Object.entries(subjectDrillQuestions[currentQuestionIdx].options || {}).map(([key, value]) => {
                        const isSelected = userAnswers[subjectDrillQuestions[currentQuestionIdx].id] === key;
                        return (
                          <button
                            key={key}
                            onClick={() => setUserAnswers(prev => ({ ...prev, [subjectDrillQuestions[currentQuestionIdx].id]: key }))}
                            className={`w-full text-left p-4 rounded-2xl border font-bold text-sm transition-all flex items-center gap-3 ${isSelected ? 'bg-[hsl(var(--accent))]/10 border-[hsl(var(--accent))] text-[hsl(var(--accent))] shadow-inner' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300'}`}
                          >
                            <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${isSelected ? 'bg-[hsl(var(--accent))] text-white font-black' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                              {key}
                            </span>
                            <span>{value as string}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-8 space-y-3">
                      <label className="text-xs font-black uppercase text-slate-500 tracking-wider">Type in the Answer (TITA)</label>
                      <input
                        type="text"
                        value={userAnswers[subjectDrillQuestions[currentQuestionIdx].id] || ''}
                        onChange={(e) => setUserAnswers(prev => ({ ...prev, [subjectDrillQuestions[currentQuestionIdx].id]: e.target.value }))}
                        placeholder="Enter numerical answer..."
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-bold text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-white/10 gap-3">
                  <button
                    disabled={currentQuestionIdx === 0}
                    onClick={() => setCurrentQuestionIdx(prev => prev - 1)}
                    className="px-4 py-3 rounded-xl border border-slate-200/50 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-50 text-sm font-bold flex items-center gap-2"
                  >
                    <ChevronLeft size={16}/> Prev
                  </button>
                  
                  {currentQuestionIdx < subjectDrillQuestions.length - 1 ? (
                    <button
                      onClick={() => setCurrentQuestionIdx(prev => prev + 1)}
                      className="bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md shadow-[hsl(var(--accent))]/20"
                    >
                      Next <ChevronRight size={16}/>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEndDrill('subject_drill', subjectDrillQuestions, userAnswers, subjectDrillTimer, `${selectedSubject} Standalone Drill`)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md shadow-emerald-500/20"
                    >
                      Submit Drill
                    </button>
                  )}
                </div>
              </div>

              {/* Question palette */}
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl space-y-6">
                <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider">Question Palette</h4>
                <div className="grid grid-cols-5 gap-2">
                  {subjectDrillQuestions.map((q, idx) => {
                    const isCurrent = idx === currentQuestionIdx;
                    const isAnswered = !!userAnswers[q.id];
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentQuestionIdx(idx)}
                        className={`w-10 h-10 rounded-xl font-bold text-xs flex items-center justify-center border transition-all ${isCurrent ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))] shadow-md' : isAnswered ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-500' : 'bg-white/60 dark:bg-white/5 border-slate-200/50 dark:border-white/10 hover:border-[hsl(var(--accent))]/50'}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Subject Drill Lobby */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Config Card */}
              <div className="lg:col-span-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                    <Compass className="text-[hsl(var(--accent))]" size={24}/> Standalone Subjects Drill Engine
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Practice standalone questions for CAT subjects. Weaknesses will adaptively target ELO thresholds.</p>
                </div>

                <div className="space-y-4">
                  {/* Select Subject */}
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Select Subject</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(['QA', 'VARC', 'DILR'] as const).map(sub => (
                        <button
                          key={sub}
                          onClick={() => { setSelectedSubject(sub); setSelectedSubjectTopic(topicsBySection[sub][0]); }}
                          className={`py-3 rounded-2xl font-black border transition-all text-sm ${selectedSubject === sub ? 'bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))] shadow-lg shadow-[hsl(var(--accent))]/25' : 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50'}`}
                        >
                          {sub === 'QA' ? 'Quantitative' : sub === 'VARC' ? 'VARC' : 'DILR'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Topic Select */}
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Topic Focus</label>
                    <select
                      value={selectedSubjectTopic}
                      onChange={(e) => setSelectedSubjectTopic(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none"
                    >
                      {topicsBySection[selectedSubject].map(topic => (
                        <option key={topic} value={topic}>{topic}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty & Adaptive */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Difficulty</label>
                      <select
                        disabled={isSubjectAdaptive}
                        value={subjectDifficulty}
                        onChange={(e) => setSubjectDifficulty(e.target.value as any)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none disabled:opacity-50"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                    
                    <div className="flex flex-col justify-end pb-1 space-y-2">
                      <div className="flex items-center justify-between p-3 bg-white/35 dark:bg-white/5 border border-slate-200/40 dark:border-white/10 rounded-2xl">
                        <div>
                          <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Adaptive ELO Drilling</p>
                          <p className="text-[10px] text-slate-400">Match rolling subject ELO ratings</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSubjectAdaptive}
                          onChange={(e) => setIsSubjectAdaptive(e.target.checked)}
                          className="w-4 h-4 text-indigo-500 border-gray-300 rounded focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Custom topic synthesis */}
                  <div className="space-y-3">
                    <label className="text-sm font-black uppercase text-slate-500 tracking-wider">Custom Topic AI Synthesis (Optional)</label>
                    <input
                      type="text"
                      value={subjectCustomTopic}
                      onChange={(e) => setSubjectCustomTopic(e.target.value)}
                      placeholder="e.g. Mixtures and Alligation replacement formulas..."
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 font-bold text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
                    />
                  </div>
                </div>

                <button
                  onClick={handleStartSubjectDrill}
                  disabled={isLoading}
                  className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-[hsl(var(--accent))]/30 flex justify-center items-center gap-2 text-sm"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : 'Synthesize & Launch Drill'}
                </button>
              </div>

              {/* Right Performance Stats Card */}
              <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col space-y-6">
                <h4 className="font-black text-sm text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Award size={18} className="text-yellow-500" /> Rolling ELO Ratings
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Quantitative Aptitude', rating: progress.skillRatings?.QA || 1200, color: 'text-indigo-500 bg-indigo-500/10' },
                    { label: 'VARC', rating: progress.skillRatings?.VARC || 1200, color: 'text-emerald-500 bg-emerald-500/10' },
                    { label: 'DILR', rating: progress.skillRatings?.DILR || 1200, color: 'text-rose-500 bg-rose-500/10' }
                  ].map(stat => (
                    <div key={stat.label} className="p-4 bg-white/60 dark:bg-slate-900/60 border border-slate-200/40 dark:border-white/5 rounded-2xl flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{stat.label}</span>
                      <span className={`px-3 py-1.5 rounded-xl font-mono font-bold text-sm ${stat.color}`}>{stat.rating} ELO</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-200/40 dark:border-white/10 text-center">
                  <span className="text-xs text-slate-400">Streak details are synchronized continuously with mock results.</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. Saved Drills & History sub-tab */}
      {activeSubTab === 'history' && (
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                <Clock className="text-indigo-500" size={24}/> Saved Drills & Performance History
              </h3>
              <p className="text-sm text-slate-500 mt-1">Review past drill attempts, analysis summaries, and ask Maester Socratic questions.</p>
            </div>
            {drillHistoryList.length > 0 && (
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to clear all drill records?")) {
                    await clearAllDrills();
                    fetchDrillHistory();
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-rose-500 hover:text-rose-600 font-bold border border-rose-500/20 hover:bg-rose-500/10 px-3 py-2 rounded-xl transition-all"
              >
                <Trash size={14} /> Clear All
              </button>
            )}
          </div>

          {drillHistoryList.length === 0 ? (
            <div className="text-center py-16 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <Compass size={48} className="opacity-25 animate-spin" style={{ animationDuration: '6s' }} />
              <p className="text-sm font-bold">No saved drill records found</p>
              <p className="text-xs text-slate-500 max-w-[280px]">Complete custom test constructors, RC passages, DILR sets or Standalone subject drills to build history.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drillHistoryList.map(drill => (
                <div key={drill.id} className="p-5 bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-between space-y-4 hover:border-[hsl(var(--accent))]/45 transition-colors relative group">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">{drill.type === 'custom_test' ? 'Custom Test' : drill.type === 'rc_passage' ? 'RC Passage' : drill.type === 'dilr_set' ? 'DILR Set' : 'Subject Drill'}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(drill.date).toLocaleDateString()} {new Date(drill.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <h4 className="font-black text-slate-800 dark:text-white text-base mt-2">{drill.title}</h4>
                    
                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl text-center border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Score</p>
                        <p className="font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">{drill.score}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl text-center border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Accuracy</p>
                        <p className={`font-black font-mono mt-0.5 ${drill.accuracy >= 80 ? 'text-emerald-500' : drill.accuracy >= 50 ? 'text-yellow-500' : 'text-rose-500'}`}>{drill.accuracy}%</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/30 p-2 rounded-xl text-center border border-slate-100 dark:border-white/5">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Time</p>
                        <p className="font-black text-slate-700 dark:text-slate-300 font-mono mt-0.5">{Math.floor(drill.duration / 60)}m {drill.duration % 60}s</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setActiveReviewDrill(drill)}
                      className="flex-1 bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-bold py-2 rounded-xl text-xs flex justify-center items-center gap-1.5 shadow-md shadow-[hsl(var(--accent))]/15"
                    >
                      <CheckCircle2 size={14} /> Review Drill & Chat
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure you want to delete this drill entry?")) {
                          await deleteDrillResult(drill.id);
                          fetchDrillHistory();
                        }
                      }}
                      className="p-2 border border-slate-200 dark:border-slate-800 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

// --- Auxiliary Components for Review & Chat ---

interface DrillReviewProps {
  drill: any;
  onClose: () => void;
  userAnswers: Record<string, string>;
  deleteDrillResult: (id: string) => Promise<any>;
  fetchDrillHistory: () => Promise<any>;
}

function DrillReviewCockpit({ drill, onClose, userAnswers }: DrillReviewProps) {
  const [expandedExplanation, setExpandedExplanation] = useState<Record<string, boolean>>({});

  // Compute should-have-skipped list
  const skippedThresholdTime = 120; // 2 minutes
  const shouldHaveSkippedList = drill.questions.filter((q: any) => {
    const timeSpent = drill.timeSpent?.[q.id] || 0;
    
    const correctAns = String(q.correct_answer || '').trim().toLowerCase();

    const userAns = (userAnswers[q.id] || '').trim().toLowerCase();
    return timeSpent > skippedThresholdTime && userAns !== correctAns;
  });

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 rounded-3xl shadow-xl gap-4">
        <div>
          <span className="text-xs font-bold text-indigo-500 bg-indigo-500/10 px-2.5 py-1 rounded-md uppercase tracking-wider">Drill Review Cockpit</span>
          <h2 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{drill.title}</h2>
          <p className="text-xs text-slate-400 mt-0.5">Attempted on {new Date(drill.date).toLocaleDateString()} {new Date(drill.date).toLocaleTimeString()}</p>
        </div>
        <button
          onClick={onClose}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold px-5 py-2.5 rounded-2xl text-xs transition-colors flex items-center gap-1.5"
        >
          <X size={14} /> Back to Practice
        </button>
      </div>

      {/* Score Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-5 rounded-3xl shadow-md text-center">
          <p className="text-xs text-slate-400 font-black uppercase tracking-wider">Net Score</p>
          <p className="text-3xl font-black mt-1 font-mono text-indigo-500">{drill.score}</p>
        </div>
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-5 rounded-3xl shadow-md text-center">
          <p className="text-xs text-slate-400 font-black uppercase tracking-wider">Accuracy</p>
          <p className={`text-3xl font-black mt-1 font-mono ${drill.accuracy >= 80 ? 'text-emerald-500' : drill.accuracy >= 50 ? 'text-yellow-500' : 'text-rose-500'}`}>{drill.accuracy}%</p>
        </div>
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-5 rounded-3xl shadow-md text-center">
          <p className="text-xs text-slate-400 font-black uppercase tracking-wider">Duration</p>
          <p className="text-3xl font-black mt-1 font-mono text-slate-700 dark:text-slate-300 font-semibold">
            {Math.floor(drill.duration / 60)}m {drill.duration % 60}s
          </p>
        </div>
        <div className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-5 rounded-3xl shadow-md text-center">
          <p className="text-xs text-slate-400 font-black uppercase tracking-wider">Total Questions</p>
          <p className="text-3xl font-black mt-1 font-mono text-slate-700 dark:text-slate-300 font-semibold">{drill.questions.length}</p>
        </div>
      </div>

      {/* Should Have Skipped Analysis Flagging */}
      {shouldHaveSkippedList.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/25 p-5 rounded-3xl shadow-md flex items-start gap-4">
          <ShieldAlert size={28} className="text-rose-500 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h4 className="text-sm font-black text-rose-500 uppercase tracking-wider">"Should Have Skipped" Flagged Time-Sinks</h4>
            <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">
              You spent over {skippedThresholdTime}s on the following questions and answered incorrectly. Skipping these would have saved critical time for other sections:
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {shouldHaveSkippedList.map((q: any) => {
                const idx = drill.questions.findIndex((item: any) => item.id === q.id);
                return (
                  <span key={q.id} className="bg-rose-500/20 border border-rose-500/45 text-rose-600 dark:text-rose-400 font-mono font-bold text-xs px-2.5 py-1.5 rounded-xl">
                    Question #{idx + 1} ({drill.timeSpent?.[q.id] || 0}s)
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Questions list review */}
      <div className="space-y-6">
        <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <CheckCircle2 size={20} className="text-emerald-500" /> Question-by-Question Review
        </h3>

        {drill.questions.map((q: any, idx: number) => {
          const userAns = userAnswers[q.id] || '';
          const correctAns = String(q.correct_answer || '').trim().toLowerCase();

          const isCorrect = userAns.trim().toLowerCase() === correctAns.trim().toLowerCase();
          const timeSpentOnQ = drill.timeSpent?.[q.id] || 0;
          
          return (
            <div key={q.id} className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 p-6 md:p-8 rounded-3xl shadow-md space-y-4">
              
              {/* Question metadata header */}
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-3">
                <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Question #{idx + 1} • {q.topic || 'General'}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${isCorrect ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : userAns ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                    {isCorrect ? 'Correct' : userAns ? 'Incorrect' : 'Skipped'}
                  </span>
                  <span className="bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Clock size={10} /> {timeSpentOnQ}s
                  </span>
                </div>
              </div>

              {/* Passage / Set Context if present */}
              {q.passage && (
                <div className="bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-200/30 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif max-h-40 overflow-y-auto select-none whitespace-pre-line">
                  <p className="font-sans font-black text-[10px] text-slate-400 uppercase tracking-wider mb-2">Drill Context / Passage</p>
                  {q.passage}
                </div>
              )}

              {/* Question Text */}
              <p className="text-base font-semibold leading-relaxed text-slate-800 dark:text-slate-200 select-none">
                {q.question || q.text}
              </p>

              {/* Options selection */}
              {q.type === 'MCQ' && q.options ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {Object.entries(q.options || {}).map(([key, value]) => {
                    const isUserSelected = userAns.toLowerCase() === key.toLowerCase();
                    const isCorrectOption = correctAns.toLowerCase() === key.toLowerCase();
                    
                    let btnStyle = 'bg-white/40 dark:bg-white/5 border-slate-200/50 dark:border-white/5 text-slate-700 dark:text-slate-300';
                    let circleStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-500';

                    if (isCorrectOption) {
                      btnStyle = 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 border-emerald-500/50';
                      circleStyle = 'bg-emerald-500 text-white font-black';
                    } else if (isUserSelected && !isCorrectOption) {
                      btnStyle = 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 border-rose-500/50';
                      circleStyle = 'bg-rose-500 text-white font-black';
                    }

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 select-none ${btnStyle}`}
                      >
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${circleStyle}`}>{key}</span>
                        <span>{value as string}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="pt-2 flex gap-4 text-xs font-bold font-mono">
                  <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Your Answer</p>
                    <p className={`text-sm mt-0.5 ${isCorrect ? 'text-emerald-500' : 'text-rose-500'}`}>{userAns || 'None (Skipped)'}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-white/5 p-3 rounded-xl">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Correct Answer</p>
                    <p className="text-emerald-500 text-sm mt-0.5">{correctAns}</p>
                  </div>
                </div>
              )}

              {/* Explanations & Socratic Chat */}
              <div className="pt-3">
                <button
                  onClick={() => setExpandedExplanation(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
                  className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-600 font-bold focus:outline-none"
                >
                  <RefreshCw size={12} className={`transition-transform duration-300 ${expandedExplanation[q.id] ? 'rotate-180' : ''}`} />
                  {expandedExplanation[q.id] ? 'Hide Strategy & Explanation' : 'View Strategy & Socratic Tutor'}
                </button>

                {expandedExplanation[q.id] && (
                  <div className="mt-4 border-t border-slate-100 dark:border-white/5 pt-4 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/20 p-5 rounded-2xl border border-slate-200/30 dark:border-white/5 text-sm text-slate-700 dark:text-slate-300 space-y-3 leading-relaxed">
                      <div>
                        <h5 className="font-black text-xs text-indigo-500 uppercase tracking-wider">Solution Approach</h5>
                        <p className="mt-1 font-medium select-none whitespace-pre-line">
                          {q.explanation?.brief || q.explanation?.method || (typeof q.explanation === 'string' ? q.explanation : 'Check standard math guide solutions.')}
                        </p>
                      </div>
                      {q.explanation?.shortcut && (
                        <div>
                          <h5 className="font-black text-xs text-emerald-500 uppercase tracking-wider">Shortcut / Speed strategy</h5>
                          <p className="mt-1 font-medium select-none whitespace-pre-line">{q.explanation.shortcut}</p>
                        </div>
                      )}
                      {q.explanation?.traps && (
                        <div>
                          <h5 className="font-black text-xs text-rose-500 uppercase tracking-wider">Common Trap Warnings</h5>
                          <p className="mt-1 font-medium select-none whitespace-pre-line">{q.explanation.traps}</p>
                        </div>
                      )}
                    </div>

                    {/* Socratic chat bot */}
                    <SocraticChat question={q} userAnswers={userAnswers} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SocraticChat({ question, userAnswers }: { question: any, userAnswers: Record<string, string> }) {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'model', text: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    const newMsgList = [...messages, { role: 'user' as const, text: userMsg }];
    setMessages(newMsgList);
    setInput('');
    setLoading(true);

    try {
      const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${GEMINI_API_KEY}`;
      
      const correctAnsStr = String(question.correct_answer || '').trim();

      const userAnsStr = userAnswers[question.id] || 'Skipped';

      const seedPrompt = `Act as a Socratic math and reasoning tutor for CAT (Common Admission Test).
Here is the question the student is working on:
"${question.question || question.text}"
Correct Answer: "${correctAnsStr}"
Student's Answer: "${userAnsStr}"
Provided Explanation: "${question.explanation?.brief || question.explanation?.method || (typeof question.explanation === 'string' ? question.explanation : '')}"

Help the student understand the core concept socratically. Do NOT solve the question for them immediately. Guide them step-by-step with leading questions or hints. Keep answers concise, and format beautifully with paragraphs.`;

      const contents = [
        { role: 'user', parts: [{ text: seedPrompt }] },
        ...newMsgList.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }))
      ];

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) throw new Error("API error");
      const data = await response.json();
      const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I am having trouble explaining this. Can you rephrase?";
      
      setMessages([...newMsgList, { role: 'model', text: reply }]);
    } catch (e) {
      console.error(e);
      setMessages([...newMsgList, { role: 'model', text: "Sorry, I encountered an error connecting to Socratic Maester. Please check your network and key configuration." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-4 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl space-y-3">
      <div className="flex items-center gap-2 text-indigo-500 font-black text-xs uppercase tracking-wider">
        <Bot size={16} /> Socratic Tutor Chat
      </div>
      <div className="max-h-48 overflow-y-auto space-y-2 text-xs custom-scrollbar">
        {messages.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500 italic">No messages. Ask the Maester to explain the solution steps socratically.</p>
        )}
        {messages.map((m, idx) => (
          <div key={idx} className={`p-2 rounded-xl max-w-[85%] ${m.role === 'user' ? 'bg-indigo-500 text-white ml-auto' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 mr-auto'}`}>
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="text-slate-400 italic flex items-center gap-1.5">
            <Loader2 size={12} className="animate-spin" /> Maester is thinking...
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question about this step..."
          className="flex-1 text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500"
        />
        <button
          onClick={handleSend}
          disabled={loading}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold"
        >
          Send
        </button>
      </div>
    </div>
  );
}
