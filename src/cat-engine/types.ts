// types.ts — CAT MCP Server Type Definitions

export type Section = "VARC" | "DILR" | "QA";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type QuestionType = "MCQ" | "TITA";
export type SubsectionVARC = "Reading Comprehension" | "Para Jumble" | "Para Summary" | "Odd Sentence Out";

export interface QuestionMarks {
  correct: number;
  incorrect: number;
}

export interface QuestionExplanation {
  brief: string;
  standard_method: string;
  shortcut: string;
  common_mistakes: string[];
}

export interface CATQuestion {
  id: string;
  section: Section;
  topic: string;
  subtopic: string;
  difficulty: Difficulty;
  type: QuestionType;
  question: string;
  passage?: string | null;
  options?: Record<"A" | "B" | "C" | "D", string> | null;
  correct_answer: string;
  explanation: QuestionExplanation;
  marks: QuestionMarks;
  estimated_time_minutes: number;
  year_relevant: number[];
  concepts_tested: string[];
  tags: string[];
}

export interface DILRSet {
  set_id: string;
  type: "Data Interpretation" | "Logical Reasoning";
  subtype: string;
  difficulty: Difficulty;
  context: string;
  questions: CATQuestion[];
}

export interface RCPassage {
  passage_id: string;
  topic_domain: string;
  word_count: number;
  passage: string;
  questions: CATQuestion[];
}

export interface MockTestSection {
  VARC: {
    passages: RCPassage[];
    verbal_ability: CATQuestion[];
  };
  DILR: {
    sets: DILRSet[];
  };
  QA: {
    questions: CATQuestion[];
  };
}

export interface MockTest {
  test_id: string;
  difficulty: Difficulty;
  year_target: number;
  sections: MockTestSection;
  metadata: {
    topic_distribution: Record<string, number>;
    difficulty_distribution: Record<Difficulty, number>;
    tita_count: number;
    estimated_score_range: {
      "40th_percentile": number;
      "80th_percentile": number;
      "99th_percentile": number;
    };
  };
}

export interface TrainingModule {
  module_id: string;
  section: Section;
  topic: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  estimated_duration_minutes: number;
  learning_objectives: string[];
  content: {
    concept_explanation: string;
    key_formulas: Array<{ name: string; formula: string; example: string }>;
    worked_examples: Array<{ type: Difficulty; problem: string; solution: string }>;
  };
  practice_questions: CATQuestion[];
  tips: string[];
  common_traps: string[];
  next_modules: string[];
}

export interface QATopicNode {
  weight: string;
  subtopics: string[];
  tita_frequency: "Low" | "Medium" | "High";
}

export interface SyllabusSection {
  total_questions: number;
  time_minutes: number;
  description: string;
  topics: Record<string, QATopicNode | { questions: number; types: string[] } | { passages: number; question_types: string[] }>;
}

export interface GenAIConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxOutputTokens: number;
}
