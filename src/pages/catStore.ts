import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Progress {
  totalAttempted: number;
  correct: number;
  testsCompleted: number;
}

interface CatState {
  user: { name: string } | null;
  progress: Progress;
  login: (name: string) => void;
  logout: () => void;
  addResult: (attempted: number, correct: number) => void;
}

export const useCatStore = create<CatState>()(
  persist(
    (set) => ({
      user: null,
      progress: { totalAttempted: 0, correct: 0, testsCompleted: 0 },
      
      login: (name) => set({ user: { name } }),
      logout: () => set({ user: null }),
      
      addResult: (attempted, correct) => set((state) => ({
        progress: {
          totalAttempted: state.progress.totalAttempted + attempted,
          correct: state.progress.correct + correct,
          testsCompleted: state.progress.testsCompleted + 1,
        }
      })),
    }),
    { name: 'cat-master-storage' }
  )
);