// syllabus.ts — CAT 2026/27 Full Syllabus with Topic Weightage

export const CAT_SYLLABUS = {
  VARC: {
    total_questions: 24,
    time_minutes: 40,
    sections: {
      reading_comprehension: {
        questions: 16,
        passages: 4,
        words_per_passage: { min: 450, max: 750 },
        question_types: [
          "Main Idea / Central Argument",
          "Inference (implicit reasoning)",
          "Author's Tone / Attitude",
          "Paragraph Function",
          "Vocabulary in Context",
          "Supporting Detail",
          "Strengthens / Weakens Argument",
          "Para Summary / Analogy"
        ],
        passage_domains: [
          "Philosophy / Ethics / Epistemology",
          "Social Science / Sociology / Political Theory",
          "Economics / Business / Global Affairs",
          "Science / Technology / Environment",
          "Literature / Culture / History"
        ]
      },
      verbal_ability: {
        questions: 8,
        subtypes: {
          "Para Jumble (TITA)": { count: 4, sentences: 6, instruction: "Sentences are jumbled. Arrange them and type the middle 4 in order." },
          "Para Summary (MCQ)": { count: 2, options: 4, instruction: "Pick the best summary for the paragraph." },
          "Odd Sentence Out (TITA)": { count: 2, sentences: 5, instruction: "Find the sentence that does not logically belong. Type its number." }
        }
      }
    }
  },

  DILR: {
    total_questions: 20,
    time_minutes: 40,
    format: "4 sets × 5 questions",
    sets: {
      data_interpretation: {
        set_count: 2,
        question_count_per_set: 5,
        types: [
          "Table with Conditions",
          "Stacked / Grouped Bar Chart",
          "Line Graph (multi-variable trend)",
          "Pie Chart + Secondary Constraint",
          "Caselet (text-based DI)",
          "Network / Flow Data"
        ]
      },
      logical_reasoning: {
        set_count: 2,
        question_count_per_set: 5,
        types: [
          "Linear Arrangement (1D or 2D attributes)",
          "Circular Arrangement (facing inward/outward)",
          "Binary Logic (truth-teller / liar variants)",
          "Matrix Grid (assignment with constraints)",
          "Game & Tournament (knockout, round-robin)",
          "Scheduling (time slots, rooms, days)",
          "Route-based / Navigation",
          "Miscellaneous Constraint Puzzles"
        ]
      }
    }
  },

  QA: {
    total_questions: 22,
    time_minutes: 40,
    topics: {
      Arithmetic: {
        weight: "30-35%",
        expected_questions: [7, 8],
        tita_frequency: "Low",
        subtopics: [
          "Time Speed Distance (TSD)",
          "Trains / Boats & Streams",
          "Pipes & Cisterns / Work & Time",
          "Percentages",
          "Profit, Loss & Discount",
          "Simple & Compound Interest",
          "Mixtures & Alligations",
          "Ratios & Proportions",
          "Averages & Weighted Average",
          "Partnership"
        ]
      },
      Algebra: {
        weight: "22-25%",
        expected_questions: [5, 6],
        tita_frequency: "Medium",
        subtopics: [
          "Linear Equations (1 and 2 variables)",
          "Quadratic Equations",
          "Simultaneous Equations",
          "Inequalities & Absolute Values",
          "Functions (composition, inverse)",
          "Arithmetic Progressions (AP)",
          "Geometric Progressions (GP)",
          "Harmonic Progressions (HP)",
          "Logarithms",
          "Surds & Indices"
        ]
      },
      Geometry: {
        weight: "18-22%",
        expected_questions: [4, 5],
        tita_frequency: "Low",
        subtopics: [
          "Properties of Triangles (congruence, similarity)",
          "Circle (chords, tangents, arcs, sectors)",
          "Quadrilaterals (parallelogram, trapezoid, rhombus)",
          "Polygons (regular polygons, interior angles)",
          "Coordinate Geometry (distance, section formula, slope)",
          "Mensuration 2D (area, perimeter)",
          "Solid Geometry (cube, sphere, cone, cylinder)",
          "Trigonometry basics (heights & distances)"
        ]
      },
      NumberSystem: {
        weight: "14-16%",
        expected_questions: [3, 4],
        tita_frequency: "High",
        subtopics: [
          "Divisibility Rules",
          "Factors & Multiples",
          "HCF and LCM",
          "Remainder Theorem (Fermat, Wilson, Cyclicity)",
          "Unit Digit & Last Two Digits",
          "Factorials & Trailing Zeros",
          "Base Conversion (binary, octal, hex)",
          "Prime Factorization",
          "Digital Root & Digit Sum"
        ]
      },
      ModernMath: {
        weight: "8-10%",
        expected_questions: [2, 3],
        tita_frequency: "High",
        subtopics: [
          "Permutations & Combinations",
          "Circular Permutations",
          "Probability (basic, conditional, Bayes)",
          "Set Theory & Venn Diagrams",
          "Derangements",
          "Inclusion-Exclusion Principle"
        ]
      }
    }
  }
} as const;

// --------------------------------------------------------------------------
// Helper: Get all subtopics for a section
// --------------------------------------------------------------------------
export function getTopicsForSection(section: "VARC" | "DILR" | "QA"): string[] {
  if (section === "QA") {
    return Object.entries(CAT_SYLLABUS.QA.topics).flatMap(([topic, data]) =>
      (data as unknown as { subtopics: readonly string[] }).subtopics.map(s => `${topic} > ${s}`)
    );
  }
  if (section === "DILR") {
    return [
      ...CAT_SYLLABUS.DILR.sets.data_interpretation.types.map(t => `DI > ${t}`),
      ...CAT_SYLLABUS.DILR.sets.logical_reasoning.types.map(t => `LR > ${t}`)
    ];
  }
  if (section === "VARC") {
    return [
      ...CAT_SYLLABUS.VARC.sections.reading_comprehension.question_types.map(t => `RC > ${t}`),
      ...Object.keys(CAT_SYLLABUS.VARC.sections.verbal_ability.subtypes).map(t => `VA > ${t}`)
    ];
  }
  return [];
}

// --------------------------------------------------------------------------
// Helper: Get syllabus as plain text for prompts
// --------------------------------------------------------------------------
export function getSyllabusText(section?: "VARC" | "DILR" | "QA"): string {
  const lines: string[] = [];

  if (!section || section === "QA") {
    lines.push("=== QA SYLLABUS ===");
    for (const [topic, data] of Object.entries(CAT_SYLLABUS.QA.topics)) {
      const d = data as unknown as { weight: string; subtopics: readonly string[] };
      lines.push(`\n${topic} (${d.weight}):`);
      d.subtopics.forEach(s => lines.push(`  - ${s}`));
    }
  }

  if (!section || section === "DILR") {
    lines.push("\n=== DILR SYLLABUS ===");
    lines.push("Data Interpretation Set Types:");
    CAT_SYLLABUS.DILR.sets.data_interpretation.types.forEach(t => lines.push(`  - ${t}`));
    lines.push("Logical Reasoning Set Types:");
    CAT_SYLLABUS.DILR.sets.logical_reasoning.types.forEach(t => lines.push(`  - ${t}`));
  }

  if (!section || section === "VARC") {
    lines.push("\n=== VARC SYLLABUS ===");
    lines.push("RC Question Types:");
    CAT_SYLLABUS.VARC.sections.reading_comprehension.question_types.forEach(t => lines.push(`  - ${t}`));
    lines.push("Verbal Ability:");
    Object.keys(CAT_SYLLABUS.VARC.sections.verbal_ability.subtypes).forEach(t => lines.push(`  - ${t}`));
  }

  return lines.join("\n");
}

// --------------------------------------------------------------------------
// Helper: Get difficulty distribution for a full mock test
// --------------------------------------------------------------------------
export function getMockTestDistribution(overall: "Easy" | "Medium" | "Hard" | "Mixed") {
  const distributions = {
    Easy:   { Easy: 35, Medium: 20, Hard: 11 },
    Medium: { Easy: 22, Medium: 30, Hard: 14 },
    Hard:   { Easy: 14, Medium: 27, Hard: 25 },
    Mixed:  { Easy: 22, Medium: 30, Hard: 14 }
  };
  return distributions[overall];
}

// --------------------------------------------------------------------------
// CAT Scoring Reference
// --------------------------------------------------------------------------
export const SCORING = {
  MCQ: { correct: 3, incorrect: -1, unattempted: 0 },
  TITA: { correct: 3, incorrect: 0, unattempted: 0 }
};

export const PERCENTILE_CUTOFFS_2025 = {
  IIM_ABC: 99,
  IIM_KLIM: 97,
  Top_20_MBA: 92,
  Top_50_MBA: 85
};
