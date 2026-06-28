---
name: cat-question-engine
description: >
  Use this skill to generate, validate, and structure CAT (Common Admission Test)
  exam questions, mock tests, and training modules. Trigger this skill whenever a
  user asks to: generate CAT questions, create mock tests, build training modules,
  design CAT syllabus content, create practice sets for VARC/DILR/QA, or build any
  question bank for CAT 2026/27 preparation. Also trigger when asked to validate if
  a question meets CAT standards, calibrate difficulty, or structure an RC passage
  with questions. Always use this skill for anything related to IIM entrance exams,
  even if not explicitly called "CAT" (e.g., MBA entrance, quantitative aptitude exam).
---

# CAT Question Engine — 2026/27 Edition

This skill governs the generation of IIM-standard CAT questions. Every output must be
exam-authentic, intellectually demanding, and structured for both AI rendering and
human pedagogy.

---

## 1. CAT 2026/27 Exam Architecture

| Section | Questions | Time | MCQ | TITA | Marking |
|---|---|---|---|---|---|
| VARC | 24 | 40 min | ~18 | ~6 | +3 / -1 (MCQ), +3 / 0 (TITA) |
| DILR | 20 | 40 min | ~14 | ~6 | +3 / -1 (MCQ), +3 / 0 (TITA) |
| QA | 22 | 40 min | ~14 | ~8 | +3 / -1 (MCQ), +3 / 0 (TITA) |
| **Total** | **66** | **120 min** | | | |

**TITA = Type In The Answer** (no negative marking; no options given)

---

## 2. Full Syllabus with Weightage

### Section 1 — VARC (Verbal Ability & Reading Comprehension)

**Reading Comprehension (16 questions, 4 passages)**

Passage Types and Frequency:
- Philosophy / Ethics / Epistemology — 1 passage (~25% chance)
- Social Science / Sociology / Political Theory — 1 passage
- Economics / Business / Finance — 1 passage
- Science / Technology / Environment — 1 passage

Passage specs: 450–750 words, CAT-2026 trend is toward ABSTRACT and ARGUMENTATIVE prose.

RC Question subtypes per passage (pick 4–5):
- Main Idea / Central Argument
- Inference (implicit reasoning, not explicit)
- Author's Tone / Attitude
- Paragraph Function (what does para X do)
- Vocabulary in Context (pick synonym fitting the passage meaning)
- Supporting Detail / Fact-based
- Strengthens / Weakens argument
- Summary / Analogy

**Verbal Ability (8 questions — all TITA or MCQ)**

| Type | Count | Format |
|---|---|---|
| Para Jumbles (TITA) | 4 | 6 sentences, find order, type middle 4 only |
| Para Summary | 2 | 5 statements, pick best summary |
| Odd Sentence Out (TITA) | 2 | 5 sentences, type number of odd sentence |

---

### Section 2 — DILR (Data Interpretation & Logical Reasoning)

**Format: 4 sets × 5 questions** (occasionally 5 sets × 4)

**Data Interpretation Set Types:**
- Table-based with conditions (most common)
- Bar Chart / Stacked Bar (comparative analysis)
- Line Graph (trend + rate of change)
- Pie Chart + additional constraint
- Caselet (text-based DI, no graph)
- Network / Flow Chart data

**Logical Reasoning Set Types:**
- Linear Arrangement (one row / multiple attributes)
- Circular Arrangement (facing inward/outward)
- Binary Logic (truth-tellers, liars, alternates)
- Matrix Grid (assignments, constraints)
- Game & Tournament (knockout, round-robin, scoring)
- Scheduling (time slots, days, rooms)
- Miscellaneous: coding-decoding patterns, route-based sets

**DILR Design Rules:**
- Each set must have exactly 5 unique data questions
- Questions must build on each other within a set (shared context)
- Include at least 1 TITA question per set
- Difficulty should escalate Q1→Q5 within a set
- All numerical answers must be integers or simple decimals

---

### Section 3 — QA (Quantitative Aptitude)

| Topic | Weight | Questions | Key Subtopics |
|---|---|---|---|
| Arithmetic | 30–35% | 7–8 | TSD, Work-Time, %, P&L, Mixtures, Ratio, SI/CI, Averages |
| Algebra | 22–25% | 5–6 | Linear/Quadratic Eq, Inequalities, Functions, Progressions, Logs, Surds |
| Geometry & Mensuration | 18–22% | 4–5 | Triangles, Circles, Quadrilaterals, Coordinate Geometry, 3D shapes |
| Number System | 14–16% | 3–4 | Factors, HCF/LCM, Remainders, Unit Digits, Cyclicity, Base Conversion |
| Modern Math | 8–10% | 2–3 | PnC, Probability, Set Theory, Venn Diagrams |

**CAT 2026/27 Trend Signals (apply these):**
- Geometry is de-emphasized; Algebra gaining weight
- More multi-concept questions (e.g., Arithmetic + Number System)
- TITA questions dominate Number System and Modern Math
- Avoid standalone memorization questions; test application + reasoning
- "Elegant solution exists" — all questions must have a shortcut method

---

## 3. Difficulty Calibration Matrix

| Level | Avg Solve Time | Accuracy Rate | What Makes It Hard |
|---|---|---|---|
| Easy | < 90 sec | >70% | Direct formula application, 1-step |
| Medium | 90–180 sec | 40–65% | 2-step reasoning, mild trap |
| Hard | > 3 min | < 35% | Multi-step, deceptive setup, novel frame |

**Distractor (wrong option) Design Rules:**
- Option A: Most common mistake (unit error, sign flip)
- Option B or C: Correct answer
- Option C or D: Partially correct computation
- Option D: Answer if you misread the question
- Never make a distractor obviously absurd
- Distance between options should not give away the answer

---

## 4. Section-Specific Generation Guidelines

### Generating VARC — RC Passages

1. Write the passage first (450–600 words), then generate questions from it
2. Passage must have: a central argument, at least 2 nuanced sub-claims, no hedging language
3. Passage tone options: Critical, Analytical, Descriptive, Discursive, Persuasive
4. Questions must test INFERENCE over RECALL — never ask "what did the author say"
5. Passage level: Comparable to The Economist, Aeon, Foreign Affairs, or Nature

### Generating VARC — Para Jumbles

1. Write 6 coherent, related sentences from a single topic
2. Shuffle them to create the question
3. Ensure logical flow requires grammatical + contextual reasoning
4. Include at least one pronoun/demonstrative linkage that confirms ordering
5. The answer sentence order must be unambiguous and defensible

### Generating VARC — Para Summary

1. Write a 150-word paragraph with a clear main idea
2. Write 4 options: 1 correct, 1 too narrow, 1 too broad, 1 slightly misrepresents tone
3. Correct option must capture ALL key ideas but NO extra information

### Generating DILR Sets

1. Design the data structure first (table, arrangement, constraints)
2. Ensure partial information is given — students must derive the rest
3. Questions must be ordered: Q1 (warm-up), Q2–Q4 (medium), Q5 (hard or exhaustive)
4. Validate: every question must be solvable from the data given
5. Add at least 1 "if-then" conditional question per set
6. Label clearly: "Questions 1–5 are based on the following information:"

### Generating QA Questions

1. State the question cleanly — no unnecessary padding
2. Include one elegant shortcut method in the explanation
3. Identify the concept(s) tested (e.g., "Remainder Theorem + Cyclicity")
4. TITA questions: answer must be a non-negative integer, simple fraction, or clean decimal
5. Medium/Hard: solution requires recognizing an unstated constraint or pattern

---

## 5. Output Schema

All generated questions MUST follow this JSON structure:

```json
{
  "id": "QA-TSD-M-001",
  "section": "QA",
  "topic": "Arithmetic",
  "subtopic": "Time Speed Distance",
  "difficulty": "Medium",
  "type": "MCQ",
  "question": "...",
  "passage": null,
  "options": {
    "A": "...",
    "B": "...",
    "C": "...",
    "D": "..."
  },
  "correct_answer": "B",
  "explanation": {
    "brief": "One-line key insight",
    "standard_method": "Step-by-step solution",
    "shortcut": "CAT-optimized 60-second approach",
    "common_mistakes": ["...", "..."]
  },
  "marks": { "correct": 3, "incorrect": -1 },
  "estimated_time_minutes": 2,
  "year_relevant": [2026, 2027],
  "concepts_tested": ["relative speed", "meeting point formula"],
  "tags": ["trains", "relative-motion", "arithmetic"]
}
```

For DILR sets, wrap 5 questions in a set object:

```json
{
  "set_id": "DILR-SET-001",
  "type": "Logical Reasoning",
  "subtype": "Linear Arrangement",
  "difficulty": "Medium",
  "context": "...[full setup data]...",
  "questions": [ /* array of 5 question objects */ ]
}
```

For RC passages:

```json
{
  "passage_id": "RC-ECON-001",
  "topic_domain": "Economics",
  "passage": "...[450-600 word text]...",
  "questions": [ /* array of 4-5 question objects, options only A-D */ ]
}
```

---

## 6. Training Module Structure

When creating a training module for a topic, output this structure:

```json
{
  "module_id": "TM-QA-TSD-001",
  "section": "QA",
  "topic": "Time Speed Distance",
  "level": "Intermediate",
  "estimated_duration_minutes": 45,
  "learning_objectives": ["...", "..."],
  "content": {
    "concept_explanation": "...",
    "key_formulas": [
      { "name": "Relative Speed (same direction)", "formula": "v1 - v2", "example": "..." }
    ],
    "worked_examples": [
      { "type": "Easy", "problem": "...", "solution": "..." }
    ]
  },
  "practice_questions": [ /* 5-8 question objects, Easy→Hard */ ],
  "tips": ["...", "..."],
  "common_traps": ["...", "..."],
  "next_modules": ["Work-Time", "Boats & Streams"]
}
```

---

## 7. Mock Test Structure

Full mock test format (66 questions, 120 minutes):

```json
{
  "test_id": "MOCK-001",
  "difficulty": "Mixed",
  "year_target": 2026,
  "sections": {
    "VARC": {
      "passages": [ /* 4 RC passage sets */ ],
      "verbal_ability": [ /* 8 VA questions */ ]
    },
    "DILR": {
      "sets": [ /* 4 DILR sets */ ]
    },
    "QA": {
      "questions": [ /* 22 QA questions */ ]
    }
  },
  "metadata": {
    "topic_distribution": { ... },
    "difficulty_distribution": { "Easy": 22, "Medium": 30, "Hard": 14 },
    "tita_count": 20,
    "estimated_score_range": { "40th_percentile": 85, "99th_percentile": 155 }
  }
}
```

---

## 8. Anti-Patterns — Never Generate These

**QA:**
- Questions solvable by direct formula substitution without any reasoning
- Options where one is obviously wrong (e.g., negative time)
- "Find the LCM of 12 and 18" — trivial, not CAT-worthy
- Questions that require calculator-level computation

**DILR:**
- Sets where all values are directly stated (no derivation needed)
- Sets with fewer than 3 logical constraints
- DI sets with single data source and no comparative analysis

**VARC:**
- RC questions asking "What is mentioned in paragraph 2?"
- Para jumbles where ordering is obviously chronological
- Summary options with identical length and scope

**General:**
- Re-use of any question from publicly known CAT papers (2015–2025)
- Answers that depend on memorizing a fact (e.g., "π ≈ 3.14")
- Questions that can be solved by elimination without any math

---

## 9. Quality Gate (run before returning any question)

Before returning a generated question, verify:
- [ ] Can a 99-percentiler solve this in the estimated time?
- [ ] Are all distractors defensible as plausible mistakes?
- [ ] Does the explanation include a shortcut method?
- [ ] Is the question uniquely solvable (no ambiguity in correct answer)?
- [ ] Does it map to at least one CAT 2026/27 syllabus node?
- [ ] For TITA: is the answer a clean number (not 3.67891...)?
