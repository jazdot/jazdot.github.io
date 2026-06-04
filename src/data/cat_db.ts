export interface Question {
  id: string;
  text: string;
  type: 'MCQ' | 'TITA';
  options?: string[];
  correct?: number | null;
  tita_answer?: string | null;
  explanation: string;
  section?: 'QA' | 'VARC' | 'DILR';
  context?: string;
}

export interface QuestionGroup {
  section: 'QA' | 'VARC' | 'DILR';
  context?: string;
  questions: Question[];
}

export interface PastPaper {
  id: string;
  year?: number;
  slot?: number;
  title?: string;
  question_groups?: QuestionGroup[];
  questions?: Question[];
}

// Use Vite's import.meta.glob to dynamically import all JSON files in the current folder
const paperModules = import.meta.glob('./*.json', { eager: true });

// Map over the modules to extract the default exports (the actual JSON content)
export const CAT_PAST_PAPERS: PastPaper[] = Object.values(paperModules)
  .map((mod: any) => {
    const paper = mod.default || mod;
    if (paper.question_groups && !paper.questions) {
      let flatQs: Question[] = [];
      paper.question_groups.forEach((group: any) => {
        if (group.questions) {
          group.questions.forEach((q: any) => flatQs.push({ ...q, section: group.section, context: group.context }));
        }
      });
      paper.questions = flatQs;
    }
    if (!paper.title && paper.id) paper.title = paper.id.replace(/_/g, ' ');
    return paper as PastPaper;
  })
  .filter((paper: any) => paper && Array.isArray(paper.questions) && paper.questions.length > 0);

// Helper to dynamically load random questions for Practice Mode
export const getPracticeQuestionsBySection = (section: 'QA' | 'VARC' | 'DILR'): Question[] => {
  let allQs: Question[] = [];
  CAT_PAST_PAPERS.forEach(paper => {
    allQs = [...allQs, ...(paper.questions || []).filter((q: any) => q && q.section === section)];
  });
  // Shuffle array so practice questions are unique per session
  return allQs.sort(() => 0.5 - Math.random());
};