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
  questionIds?: string[];
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
}

interface CatState {
  user: { name: string } | null;
  progress: Progress;
  login: (name: string) => void;
  logout: () => void;
  addResult: (attempted: number, correct: number) => void;
  addTopicResult: (topic: string, isCorrect: boolean, questionId?: string) => void;
  toggleBookmark: (questionId: string) => void;
  clearHistory: () => void;
  updateSkillRating: (subject: 'QA' | 'VARC' | 'DILR', questionDifficulty: number, isCorrect: boolean) => void;
}

export const useCatStore = create<CatState>()(
  persist(
    (set) => ({
      user: null,
      progress: { totalAttempted: 0, correct: 0, testsCompleted: 0, history: [], topicStats: {}, bookmarkedQuestions: [], skillRatings: { QA: 1200, VARC: 1200, DILR: 1200 } },
      
      login: (name) => set({ user: { name } }),
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
        const current = stats[topic] || { attempted: 0, correct: 0, questionIds: [] };
        const qIds = current.questionIds || [];
        return {
          progress: {
            ...state.progress,
            topicStats: {
              ...stats,
              [topic]: {
                attempted: current.attempted + 1,
                correct: current.correct + (isCorrect ? 1 : 0),
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
      
      clearHistory: () => set((state) => ({
        progress: { ...state.progress, totalAttempted: 0, correct: 0, testsCompleted: 0, history: [], topicStats: {} }
      })),

      updateSkillRating: (subject, questionDifficulty, isCorrect) => set(state => {
        const currentRatings = state.progress.skillRatings || { QA: 1200, VARC: 1200, DILR: 1200 };
        const userRating = currentRatings[subject];
        
        const K = 32;
        const expectedScore = 1 / (1 + Math.pow(10, (questionDifficulty - userRating) / 400));
        const actualScore = isCorrect ? 1 : 0;
        
        const newUserRating = Math.round(userRating + K * (actualScore - expectedScore));
        
        return {
          progress: {
            ...state.progress,
            skillRatings: {
              ...currentRatings,
              [subject]: newUserRating,
            }
          }
        };
      })
    }),
    { name: 'cat-master-storage' }
  )
);