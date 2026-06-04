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
}

interface CatState {
  user: { name: string } | null;
  progress: Progress;
  login: (name: string) => void;
  logout: () => void;
  addResult: (attempted: number, correct: number) => void;
  addTopicResult: (topic: string, isCorrect: boolean, questionId?: string) => void;
}

export const useCatStore = create<CatState>()(
  persist(
    (set) => ({
      user: null,
      progress: { totalAttempted: 0, correct: 0, testsCompleted: 0, history: [], topicStats: {} },
      
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
    }),
    { name: 'cat-master-storage' }
  )
);