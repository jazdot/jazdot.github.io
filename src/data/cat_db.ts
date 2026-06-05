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
const paperModules = import.meta.glob<PastPaper>('./*.json');

const processPaper = (paper: PastPaper): PastPaper => {
  if (paper.question_groups && !paper.questions) {
    let flatQs: Question[] = [];
    paper.question_groups.forEach((group: any) => {
      let sectionName = group.section;
      if (sectionName === 'Quant') sectionName = 'QA';
      if (sectionName === 'LRDI') sectionName = 'DILR';

      if (group.questions) {
        group.questions.forEach((q: any) => flatQs.push({ ...q, section: sectionName, context: group.context }));
      }
    });
    paper.questions = flatQs;
  }
  if (!paper.title && paper.id) paper.title = paper.id.replace(/_/g, ' ');
  return paper;
};

export const paperLoaders: Record<string, () => Promise<PastPaper>> = Object.entries(
  paperModules
).reduce((acc, [path, loader]) => {
  const id = path.split('/').pop()?.replace('.json', '');
  if (id) {
    acc[id] = async () => {
      const mod = await loader();
      return processPaper(((mod as any).default || mod) as PastPaper);
    };
  }
  return acc;
}, {} as Record<string, () => Promise<PastPaper>>);

export const getAllQuestions = async (): Promise<Question[]> => {
  let allQs: Question[] = [];
  for (const loader of Object.values(paperLoaders)) {
    const paper = await loader();
    if (paper && Array.isArray(paper.questions)) {
      allQs.push(...paper.questions);
    }
  }
  return allQs;
};

// Helper to dynamically load random questions for Practice Mode
export const getPracticeQuestionsBySection = async (section: 'QA' | 'VARC' | 'DILR'): Promise<Question[]> => {
  const allQs = await getAllQuestions();
  const sectionQs = allQs.filter((q: any) => q && q.section === section);
  // Shuffle array so practice questions are unique per session
  return sectionQs.sort(() => 0.5 - Math.random());
};