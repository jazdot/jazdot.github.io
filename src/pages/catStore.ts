import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TestHistory {
  date: string;
  attempted: number;
  correct: number;
}

interface TopicStat {
  attempted: number;
  correct: number;
  skipped: number;
  totalTimeSpent: number; // in seconds
  questionIds?: string[];
}

interface SkillHistory {
  date: string;
  skillRatings: { QA: number; VARC: number; DILR: number; };
}

interface Progress {
  totalAttempted: number;
  correct: number;
  testsCompleted: number;
  history?: TestHistory[];
  topicStats?: Record<string, TopicStat>;
  bookmarkedQuestions?: string[];
  skillRatings?: {
    QA: number;
    VARC: number;
    DILR: number;
  };
  currentStreak?: number;
  maxStreak?: number;
  isActivated?: boolean;
  bookmarkedNotes?: Record<string, string>;
  skillHistory?: SkillHistory[];
  studyPlan?: {
    targetPercentile: number;
    targetDate: string;
    dailyGoalQuestions: number;
  };
}

interface CatState {
  user: { name: string, uid?: string, photoURL?: string } | null;
  progress: Progress;
  login: (name: string, uid?: string, photoURL?: string) => void;
  setWholeProgress: (progress: Progress) => void;
  logout: () => void;
  addResult: (attempted: number, correct: number) => void;
  addTopicResult: (topic: string, isCorrect: boolean, questionId?: string) => void;
  toggleBookmark: (questionId: string) => void;
  updateBookmarkNote: (questionId: string, note: string) => void;
  clearHistory: () => void;
  updateSkillRating: (subject: 'QA' | 'VARC' | 'DILR', questionDifficulty: number, isCorrect: boolean) => void;
  updatePracticeStreak: (isCorrect: boolean) => void;
  setActivated: () => void;
  addTopicStatResult: (topic: string, isCorrect: boolean, skipped: boolean, timeSpent: number, questionId?: string) => void;
  setStudyPlan: (plan: { targetPercentile: number; targetDate: string; dailyGoalQuestions: number }) => void;
}

export const useCatStore = create<CatState>()(
  persist(
    (set) => ({
      user: null,
      progress: { totalAttempted: 0, correct: 0, testsCompleted: 0, history: [], topicStats: {}, bookmarkedQuestions: [], bookmarkedNotes: {}, skillRatings: { QA: 1200, VARC: 1200, DILR: 1200 }, currentStreak: 0, maxStreak: 0, isActivated: false, skillHistory: [] },
      
      login: (name, uid, photoURL) => set({ user: { name, uid, photoURL } }),
      setWholeProgress: (progress) => set({ progress }),
      logout: () => set({ user: null }),
      
      addResult: (attempted, correct) => set((state) => ({
        progress: {
          totalAttempted: state.progress.totalAttempted + attempted,
          correct: state.progress.correct + correct,
          testsCompleted: state.progress.testsCompleted + 1,
          history: [...(state.progress.history || []), { date: new Date().toISOString(), attempted, correct }]
        }
      })),
      
      addTopicResult: (topic, isCorrect, questionId) => set((state) => {
        const stats = state.progress.topicStats || {};
        const current = stats[topic] || { attempted: 0, correct: 0, skipped: 0, totalTimeSpent: 0, questionIds: [] };
        const qIds = current.questionIds || [];
        return {
          progress: {
            ...state.progress,
            topicStats: {
              ...stats,
              [topic]: {
                ...current,
                attempted: current.attempted + 1,
                correct: current.correct + (isCorrect ? 1 : 0),
                questionIds: questionId && !qIds.includes(questionId) ? [...qIds, questionId] : qIds
              }
            }
          }
        };
      }),
      
      addTopicStatResult: (topic, isCorrect, skipped, timeSpent, questionId) => set((state) => {
        const stats = state.progress.topicStats || {};
        const current = stats[topic] || { attempted: 0, correct: 0, skipped: 0, totalTimeSpent: 0, questionIds: [] };
        const qIds = current.questionIds || [];
        return {
          progress: {
            ...state.progress,
            topicStats: {
              ...stats,
              [topic]: {
                ...current,
                attempted: current.attempted + (!skipped ? 1 : 0),
                correct: current.correct + (isCorrect && !skipped ? 1 : 0),
                skipped: current.skipped + (skipped ? 1 : 0),
                totalTimeSpent: current.totalTimeSpent + timeSpent,
                questionIds: questionId && !qIds.includes(questionId) ? [...qIds, questionId] : qIds
              }
            }
          }
        };
      }),
      
      toggleBookmark: (questionId) => set((state) => {
        const bookmarks = state.progress.bookmarkedQuestions || [];
        return {
          progress: {
            ...state.progress,
            bookmarkedQuestions: bookmarks.includes(questionId) ? bookmarks.filter(id => id !== questionId) : [...bookmarks, questionId]
          }
        };
      }),

      updateBookmarkNote: (questionId, note) => set((state) => ({
        progress: {
          ...state.progress,
          bookmarkedNotes: {
            ...(state.progress.bookmarkedNotes || {}),
            [questionId]: note
          }
        }
      })),
      
      clearHistory: () => set((state) => ({
        progress: { ...state.progress, totalAttempted: 0, correct: 0, testsCompleted: 0, history: [], topicStats: {}, currentStreak: 0, maxStreak: 0, isActivated: false, bookmarkedNotes: {}, skillHistory: [] }
      })),

      updateSkillRating: (subject, questionDifficulty, isCorrect) => set(state => {
        const currentRatings = state.progress.skillRatings || { QA: 1200, VARC: 1200, DILR: 1200 };
        const userRating = currentRatings[subject];
        
        const K = 32;
        const expectedScore = 1 / (1 + Math.pow(10, (questionDifficulty - userRating) / 400));
        const actualScore = isCorrect ? 1 : 0;
        
        const newUserRating = Math.round(userRating + K * (actualScore - expectedScore));
        const newSkillRatings = {
          ...currentRatings,
          [subject]: newUserRating,
        };
        
        return {
          progress: {
            ...state.progress,
            skillRatings: newSkillRatings,
            skillHistory: [
              ...(state.progress.skillHistory || []).slice(-99), // Keep last 100 entries
              { date: new Date().toISOString(), skillRatings: newSkillRatings }
            ]
          }
        };
      }),

      updatePracticeStreak: (isCorrect) => set(state => {
        const currentStreak = state.progress.currentStreak || 0;
        const maxStreak = state.progress.maxStreak || 0;
        const newStreak = isCorrect ? currentStreak + 1 : 0;
        return {
          progress: {
            ...state.progress,
            currentStreak: newStreak,
            maxStreak: Math.max(maxStreak, newStreak)
          }
        };
      }),

      setActivated: () => set(state => ({
        progress: {
          ...state.progress,
          isActivated: true
        }
      })),

      setStudyPlan: (plan) => set(state => ({
        progress: {
          ...state.progress,
          studyPlan: plan
        }
      }))
    }),
    { name: 'cat-maester-storage' }
  )
);