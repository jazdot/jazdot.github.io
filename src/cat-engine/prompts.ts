// prompts.ts — Gemini prompt templates for CAT question generation

import type { Difficulty, Section } from "./types.js";

// --------------------------------------------------------------------------
// QA Question Generation Prompt
// --------------------------------------------------------------------------
export function buildQAQuestionPrompt(
  topic: string,
  subtopic: string,
  difficulty: Difficulty,
  questionType: "MCQ" | "TITA",
  count: number = 1
): string {
  const timeLimits = { Easy: 1.5, Medium: 2.5, Hard: 4 };
  const timeLimit = timeLimits[difficulty as keyof typeof timeLimits] || 2.5;

  return `You are an elite CAT question setter with 15+ years of IIM entrance exam experience.
Generate ${count} original CAT 2026/27 Quantitative Aptitude question(s) on the topic: "${topic} > ${subtopic}".

DIFFICULTY: ${difficulty}
TYPE: ${questionType}
MAX SOLVE TIME: ${timeLimit} minutes

STRICT REQUIREMENTS:
1. Question must require active REASONING, not formula lookup
2. ${questionType === "TITA" ? "Answer MUST be a non-negative integer or clean decimal. No options needed." : "Include exactly 4 options (A, B, C, D) where distractors are realistic mistakes"}
3. Include TWO solution methods: step-by-step standard + a 60-second CAT shortcut
4. Identify at least 2 common student mistakes
5. Difficulty calibration: ${difficulty === "Easy" ? "1-step application, no tricks" : difficulty === "Medium" ? "2-3 steps with one subtle trap" : "multi-step, requires insight or pattern recognition"}
6. ORIGINALITY: Do NOT reproduce any known CAT question from 2015–2025

OUTPUT: Return ONLY a valid JSON array with ${count} question object(s). No markdown, no preamble.
Schema for each question:
{
  "id": "QA-${subtopic.replace(/\s/g, "-").toUpperCase()}-${difficulty[0]}-001",
  "section": "QA",
  "topic": "${topic}",
  "subtopic": "${subtopic}",
  "difficulty": "${difficulty}",
  "type": "${questionType}",
  "question": "Clear, unambiguous question statement",
  "options": ${questionType === "MCQ" ? '{"A": "...", "B": "...", "C": "...", "D": "..."}' : "null"},
  "correct_answer": "${questionType === "MCQ" ? "B" : "42 (example)"}",
  "explanation": {
    "brief": "One-line key insight",
    "standard_method": "Full step-by-step solution",
    "shortcut": "CAT-optimized approach under 60 seconds",
    "common_mistakes": ["mistake 1", "mistake 2"]
  },
  "marks": {"correct": 3, "incorrect": ${questionType === "MCQ" ? -1 : 0}},
  "estimated_time_minutes": ${timeLimit},
  "year_relevant": [2026, 2027],
  "concepts_tested": ["concept1", "concept2"],
  "tags": ["tag1", "tag2"]
}`;
}

// --------------------------------------------------------------------------
// DILR Set Generation Prompt
// --------------------------------------------------------------------------
export function buildDILRSetPrompt(
  setType: "Data Interpretation" | "Logical Reasoning",
  subtype: string,
  difficulty: Difficulty
): string {
  return `You are a CAT DILR expert and question designer. Create a complete ${setType} set for CAT 2026/27.

SET TYPE: ${subtype}
DIFFICULTY: ${difficulty}
FORMAT: 1 shared context + 5 questions

DESIGN RULES:
1. Context must provide PARTIAL information — students must derive the rest
2. Questions must build on each other (shared data, escalating complexity)
3. Q1 should be solvable directly, Q5 should require exhaustive case analysis
4. Include exactly 1 TITA question (exact integer answer, no options)
5. ALL numerical values in the context must be precise integers or simple fractions
6. ${difficulty === "Hard" ? "Context must have a hidden constraint that unlocks only at Q4 level" : "Each question must require at least 2 inferential steps"}

ORIGINALITY: Do not reproduce any CAT DILR set from 2015–2025.

OUTPUT: Return ONLY valid JSON. No markdown or preamble.
{
  "set_id": "DILR-${subtype.replace(/\s/g, "-").toUpperCase()}-${difficulty[0]}-001",
  "type": "${setType}",
  "subtype": "${subtype}",
  "difficulty": "${difficulty}",
  "context": "Complete setup with all data, tables, or arrangement details",
  "questions": [
    {
      "q_number": 1,
      "question": "...",
      "type": "MCQ",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct_answer": "C",
      "explanation": "Derivation using context data",
      "marks": {"correct": 3, "incorrect": -1},
      "estimated_time_minutes": 2
    }
  ]
}`;
}

// --------------------------------------------------------------------------
// RC Passage + Questions Prompt
// --------------------------------------------------------------------------
export function buildRCPassagePrompt(
  domain: string,
  difficulty: Difficulty,
  questionCount: number = 5
): string {
  return `You are a VARC specialist for CAT. Write an original RC passage and ${questionCount} questions for CAT 2026/27.

DOMAIN: ${domain}
DIFFICULTY: ${difficulty}
TARGET WORDS: ${difficulty === "Easy" ? "450–500" : difficulty === "Medium" ? "500–600" : "600–700"}

PASSAGE REQUIREMENTS:
1. Argumentative or analytical prose (NOT descriptive)
2. Dense ideas — comparable to The Economist, Aeon, or Foreign Affairs editorial level
3. Multiple nuanced sub-claims with the main thesis evident but NOT stated in the first paragraph
4. NO hedging language like "it could be argued" — author must have a clear viewpoint
5. Completely original — not paraphrased from any known source

QUESTION REQUIREMENTS (${questionCount} questions):
- At least 1 "Main Idea" question
- At least 1 "Inference" question (answer NOT directly stated in passage)
- At least 1 "Author's Tone / Attitude" question
- At most 1 "Supporting Detail" question (direct recall)
- All options must be plausible; wrong options should fail on ONE specific criterion

OUTPUT: Return ONLY valid JSON. No markdown.
{
  "passage_id": "RC-${domain.replace(/\s/g, "-").toUpperCase()}-${difficulty[0]}-001",
  "topic_domain": "${domain}",
  "word_count": <actual_count>,
  "tone": "Analytical / Critical / etc.",
  "passage": "Full passage text here...",
  "questions": [
    {
      "id": "RC-Q001",
      "question_type": "Main Idea",
      "question": "...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct_answer": "A",
      "explanation": "Why A is correct and others fail",
      "estimated_time_minutes": 1.5
    }
  ]
}`;
}

// --------------------------------------------------------------------------
// Para Jumble Prompt
// --------------------------------------------------------------------------
export function buildParaJumblePrompt(difficulty: Difficulty): string {
  return `You are a VARC CAT expert. Create an original Para Jumble question for CAT 2026/27.

DIFFICULTY: ${difficulty}
FORMAT: 6 sentences (labeled 1–6). The first sentence (sentence 1) is given as a fixed opener. Students must arrange sentences 2–6, then TYPE the sequence of the 4 middle sentences (excluding the opener and the final sentence).

DESIGN RULES:
1. Topic must be an idea-based paragraph (not a narrative story)
2. Include at least one pronoun linkage (this, these, it, they) confirming one pair
3. Include a contrast marker (however, yet, but) that confirms positioning
4. The 4-middle-sentence order must be UNAMBIGUOUS — only one defensible arrangement
5. ${difficulty === "Hard" ? "Use parallel clause structures to mislead before the logical connection becomes clear" : "Include a clear cause-effect chain"}

OUTPUT: Return ONLY valid JSON.
{
  "id": "VA-PJ-${difficulty[0]}-001",
  "section": "VARC",
  "topic": "Para Jumble",
  "subtopic": "Sentence Ordering",
  "difficulty": "${difficulty}",
  "type": "TITA",
  "instruction": "The given sentences, when properly sequenced, form a coherent paragraph. Sentence 1 is the opening sentence. Arrange sentences 2-6 and enter the sequence of the four middle sentences.",
  "sentences": {
    "1": "Fixed opening sentence.",
    "2": "Jumbled sentence A.",
    "3": "Jumbled sentence B.",
    "4": "Jumbled sentence C.",
    "5": "Jumbled sentence D.",
    "6": "Fixed closing sentence."
  },
  "correct_answer": "3524",
  "explanation": {
    "brief": "Key linkage explanation",
    "standard_method": "Step-by-step reasoning for the sequence",
    "shortcut": "Key connector words that pin the order",
    "common_mistakes": ["...]
  },
  "marks": {"correct": 3, "incorrect": 0},
  "estimated_time_minutes": 2
}`;
}

// --------------------------------------------------------------------------
// Training Module Prompt
// --------------------------------------------------------------------------
export function buildTrainingModulePrompt(
  section: Section,
  topic: string,
  subtopic: string,
  level: "Beginner" | "Intermediate" | "Advanced"
): string {
  const durationMap = { Beginner: 30, Intermediate: 45, Advanced: 60 };

  return `You are an expert CAT coach creating a structured learning module.

SECTION: ${section}
TOPIC: ${topic}
SUBTOPIC: ${subtopic}
LEVEL: ${level}
TARGET DURATION: ${durationMap[level]} minutes

MODULE CONTENT REQUIREMENTS:
1. Concept explanation: clear, concise, uses analogies where helpful
2. Key formulas: every formula with a worked micro-example
3. Worked examples: 1 Easy, 1 Medium, 1 Hard (for ${level} modules, tilt toward ${level})
4. Practice questions: 5 questions in ascending difficulty (Easy → Hard)
5. Tips: CAT-specific time-saving strategies for this subtopic
6. Common traps: the 2-3 most frequent student errors in this subtopic
7. Next modules: what to study after this

OUTPUT: Return ONLY valid JSON. No markdown.
{
  "module_id": "TM-${section}-${subtopic.replace(/\s/g, "-")}-${level[0]}-001",
  "section": "${section}",
  "topic": "${topic}",
  "subtopic": "${subtopic}",
  "level": "${level}",
  "estimated_duration_minutes": ${durationMap[level]},
  "learning_objectives": ["By end: student can do X", "By end: student can apply Y"],
  "content": {
    "concept_explanation": "...",
    "key_formulas": [
      {"name": "Formula Name", "formula": "...", "when_to_use": "...", "example": "..."}
    ],
    "worked_examples": [
      {"type": "Easy", "problem": "...", "solution": "..."},
      {"type": "Medium", "problem": "...", "solution": "..."},
      {"type": "Hard", "problem": "...", "solution": "..."}
    ]
  },
  "practice_questions": [/* 5 full question objects following standard schema */],
  "tips": ["CAT tip 1", "CAT tip 2", "CAT tip 3"],
  "common_traps": ["Trap 1 description", "Trap 2 description"],
  "next_modules": ["NextTopic1", "NextTopic2"]
}`;
}

// --------------------------------------------------------------------------
// Question Validation Prompt
// --------------------------------------------------------------------------
export function buildValidationPrompt(questionJson: string): string {
  return `You are a senior IIM question paper committee reviewer. Evaluate this CAT question for exam readiness.

QUESTION TO EVALUATE:
${questionJson}

EVALUATION CRITERIA (score 1-10 each):
1. Cognitive Level: Does it test reasoning (not recall)? 
2. Clarity: Is the question unambiguous?
3. Distractor Quality: Are wrong options plausibly misleading (not obviously wrong)?
4. Difficulty Calibration: Does it match the stated difficulty level?
5. Time Feasibility: Can a prepared student solve it in the stated time?
6. Explanation Quality: Does the explanation teach the concept, not just give the answer?
7. Originality: Is this clearly not from any past CAT paper?

OUTPUT: Return ONLY valid JSON.
{
  "is_exam_ready": true,
  "overall_score": 8.5,
  "scores": {
    "cognitive_level": 9,
    "clarity": 8,
    "distractor_quality": 8,
    "difficulty_calibration": 9,
    "time_feasibility": 8,
    "explanation_quality": 9,
    "originality": 8
  },
  "issues": ["Issue 1 if any", "Issue 2 if any"],
  "improvements": ["Specific improvement 1", "Specific improvement 2"],
  "verdict": "APPROVED / NEEDS_REVISION / REJECTED",
  "rejection_reason": null
}`;
}
