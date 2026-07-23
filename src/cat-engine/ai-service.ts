import type { CATQuestion, DILRSet, RCPassage, MockTest, TrainingModule, Difficulty, Section } from './types';
import { 
  buildQAQuestionPrompt, 
  buildDILRSetPrompt, 
  buildRCPassagePrompt, 
  buildParaJumblePrompt, 
  buildTrainingModulePrompt,
  buildValidationPrompt
} from './prompts';
import { getMockTestDistribution } from './syllabus';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3.1-flash-lite';

async function fetchGemini(promptText: string, retries = 2): Promise<any> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.7,
            responseMimeType: "application/json",
          }
        })
      });

      if (!response.ok) {
        let errorBody = 'No details available.';
        try {
          const errorData = await response.json();
          errorBody = errorData?.error?.message || JSON.stringify(errorData);
        } catch {}
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}. Details: ${errorBody}`);
      }

      const data = await response.json();
      let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) throw new Error("No response generated from AI.");

      rawText = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      // Robust JSON Sanitization for unescaped LaTeX backslashes
      rawText = rawText.replace(/(?<!\\)\\(?!["\\/bfnrt])/g, '\\\\');
      rawText = rawText.replace(/(?<!\\)\\(theta|frac|beta|nabla|rho|tau|text|times|triangle|to|right|Rightarrow|rightarrow|neq|le|ge|circ|cdot|approx|infty|pm|div|sqrt|pi|alpha|Delta|sum)/gi, '\\\\$1');

      return JSON.parse(rawText);
    } catch (error) {
      console.error(`[AI Service] Attempt ${attempt}/${retries} failed:`, error);
      if (attempt === retries) throw error;
      await new Promise(res => setTimeout(res, 1500 * attempt));
    }
  }
}

export async function generateCatQuestions(
  section: Section,
  topic: string,
  subtopic: string,
  difficulty: Difficulty,
  questionType: 'MCQ' | 'TITA' | 'AUTO' = 'AUTO',
  count: number = 1
): Promise<CATQuestion[]> {
  let prompt: string;
  
  if (section === "QA") {
    const resolvedType = questionType === "AUTO" ? (difficulty === "Hard" && Math.random() > 0.6 ? "TITA" : "MCQ") : questionType as "MCQ" | "TITA";
    prompt = buildQAQuestionPrompt(topic, subtopic, difficulty, resolvedType, count);
  } else if (section === "VARC" && (topic === "Para Jumble" || subtopic === "Para Jumble")) {
    prompt = buildParaJumblePrompt(difficulty);
    // Overriding count since buildParaJumblePrompt generates one by default.
    // For simplicity, we loop if count > 1.
    const results: CATQuestion[] = [];
    for (let i = 0; i < count; i++) {
      const res = await fetchGemini(prompt);
      results.push(res);
    }
    return results;
  } else {
    prompt = buildQAQuestionPrompt(topic, subtopic, difficulty, questionType === "AUTO" ? "MCQ" : (questionType as "MCQ" | "TITA"), count);
  }

  const result = await fetchGemini(prompt);
  return Array.isArray(result) ? result : [result];
}

export async function generateDILRSet(
  setType: "Data Interpretation" | "Logical Reasoning",
  subtype: string,
  difficulty: Difficulty
): Promise<DILRSet> {
  const prompt = buildDILRSetPrompt(setType, subtype, difficulty);
  return await fetchGemini(prompt);
}

export async function generateRCPassage(
  domain: string,
  difficulty: Difficulty,
  questionCount: number = 5
): Promise<RCPassage> {
  const prompt = buildRCPassagePrompt(domain, difficulty, questionCount);
  return await fetchGemini(prompt);
}

export async function generateTrainingModule(
  section: Section,
  topic: string,
  subtopic: string,
  level: "Beginner" | "Intermediate" | "Advanced"
): Promise<TrainingModule> {
  const prompt = buildTrainingModulePrompt(section, topic, subtopic, level);
  return await fetchGemini(prompt);
}

export async function validateQuestion(question: any): Promise<any> {
  const prompt = buildValidationPrompt(JSON.stringify(question, null, 2));
  return await fetchGemini(prompt);
}

export async function generateMockTest(
  difficulty: "Easy" | "Medium" | "Hard" | "Mixed" = "Mixed",
  yearTarget: number = 2026,
  sectionFilter: "ALL" | "QA" | "VARC" | "DILR" = "ALL"
): Promise<MockTest> {
  const distribution = getMockTestDistribution(difficulty);
  const testId = `MOCK-${Date.now()}-${difficulty.toUpperCase()}`;
  
  const mockTest: MockTest = {
    test_id: testId,
    difficulty: difficulty as Difficulty,
    year_target: yearTarget,
    sections: {
      VARC: { passages: [], verbal_ability: [] },
      DILR: { sets: [] },
      QA: { questions: [] }
    },
    metadata: {
      topic_distribution: {},
      difficulty_distribution: distribution,
      tita_count: 0,
      estimated_score_range: {
        "40th_percentile": 85,
        "80th_percentile": 120,
        "99th_percentile": 155
      }
    }
  };

  if (sectionFilter === "ALL" || sectionFilter === "QA") {
    const qaTopics = [
      { topic: "Arithmetic", subtopic: "Time Speed Distance", diff: "Medium" as Difficulty, count: 2 },
      { topic: "Arithmetic", subtopic: "Profit Loss", diff: "Easy" as Difficulty, count: 2 },
      { topic: "Algebra", subtopic: "Quadratic Equations", diff: "Medium" as Difficulty, count: 2 },
      { topic: "Geometry", subtopic: "Circles", diff: "Hard" as Difficulty, count: 2 },
      { topic: "NumberSystem", subtopic: "Remainders", diff: "Hard" as Difficulty, count: 2 },
      // Reduced for demo/testing feasibility, a full mock requires 22 questions.
    ];

    for (const t of qaTopics) {
      const qs = await generateCatQuestions("QA", t.topic, t.subtopic, t.diff, "MCQ", t.count);
      mockTest.sections.QA.questions.push(...qs);
    }
  }

  if (sectionFilter === "ALL" || sectionFilter === "DILR") {
    const dilrConfigs = [
      { set_type: "Data Interpretation" as const, subtype: "Caselet", difficulty: "Medium" as Difficulty },
      { set_type: "Logical Reasoning" as const, subtype: "Binary Logic", difficulty: (difficulty === "Mixed" ? "Hard" : difficulty) as Difficulty },
    ];
    for (const cfg of dilrConfigs) {
      const set = await generateDILRSet(cfg.set_type, cfg.subtype, cfg.difficulty);
      mockTest.sections.DILR.sets.push(set);
    }
  }

  if (sectionFilter === "ALL" || sectionFilter === "VARC") {
    const rcPassage = await generateRCPassage("Economics / Global Affairs", "Medium", 5);
    mockTest.sections.VARC.passages.push(rcPassage);
    
    const p1 = await fetchGemini(buildParaJumblePrompt("Medium"));
    const p2 = await fetchGemini(buildParaJumblePrompt("Hard"));
    mockTest.sections.VARC.verbal_ability.push(p1, p2);
  }

  return mockTest;
}
