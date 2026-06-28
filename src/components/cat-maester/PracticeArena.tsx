import { useState, useEffect, useRef } from 'react';
import { PlayCircle, Clock, BookOpen, Layers, Edit3, Sparkles, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { generateCatQuestions, generateDILRSet, generateRCPassage } from '../../cat-engine/ai-service';
import type { CATQuestion, DILRSet, RCPassage } from '../../cat-engine/types';

export default function PracticeArena() {
  const [activeSubTab, setActiveSubTab] = useState<'topic' | 'builder' | 'rc' | 'dilr'>('topic');
  
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

  const handleEndTest = () => {
    setTestActive(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    alert("Test Completed! Review your responses in the dashboard.");
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

  return (
    <div className="w-full space-y-6">
      
      {/* Sub tabs header */}
      <div className="flex border-b border-slate-200 dark:border-white/10 overflow-x-auto pb-1 gap-2 custom-scrollbar">
        {[
          { id: 'builder', label: 'Custom Test Builder', icon: PlayCircle },
          { id: 'rc', label: 'RC Passage & WPM', icon: BookOpen },
          { id: 'dilr', label: 'DILR Set Practice', icon: Layers },
          { id: 'topic', label: 'Topic Drill Engine', icon: Edit3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveSubTab(tab.id as any); setTestActive(false); }}
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
                  onClick={() => setRcPassage(null)}
                  className="w-full bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-black py-3 rounded-xl text-sm"
                >
                  End Passage Drill
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
                    onClick={() => { setDilrSet(null); }}
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

      {/* 4. Topic Drill Engine (Legacy Practice replacement) */}
      {activeSubTab === 'topic' && (
        <div className="flex flex-col flex-1 items-center justify-center text-center py-20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-3xl p-6">
          <Edit3 size={48} className="text-[hsl(var(--accent))] opacity-60 mb-4 animate-bounce" />
          <h3 className="text-xl font-black">Dynamic Topic Drill Mode</h3>
          <p className="text-sm text-slate-500 max-w-md mt-2">Topic drills can be triggered instantly from the Dashboard heatmap or construction engine directly, targeting your rolling weaknesses.</p>
          <button
            onClick={() => setActiveSubTab('builder')}
            className="mt-6 bg-[hsl(var(--accent))] hover:bg-opacity-95 text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            Launch Builder to Start
          </button>
        </div>
      )}

    </div>
  );
}
