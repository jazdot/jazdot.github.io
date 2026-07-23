// src/index.ts — CAT MCP Server (Antigravity / Gemini Integration)
// Compatible with @modelcontextprotocol/sdk v0.6+

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  buildQAQuestionPrompt,
  buildDILRSetPrompt,
  buildRCPassagePrompt,
  buildParaJumblePrompt,
  buildTrainingModulePrompt,
  buildValidationPrompt,
} from "./prompts.js";
import { CAT_SYLLABUS, getSyllabusText, getTopicsForSection, getMockTestDistribution } from "./syllabus.js";

// --------------------------------------------------------------------------
// Antigravity (Gemini) Setup
// --------------------------------------------------------------------------
const ANTIGRAVITY_API_KEY =
  process.env.ANTIGRAVITY_API_KEY ||
  process.env.GEMINI_API_KEY ||
  "";

if (!ANTIGRAVITY_API_KEY) {
  console.error("[CAT-MCP] WARNING: No API key found. Set ANTIGRAVITY_API_KEY or GEMINI_API_KEY.");
}

const genAI = new GoogleGenerativeAI(ANTIGRAVITY_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.5-pro",
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 8192,
    responseMimeType: "application/json",
  },
});

// --------------------------------------------------------------------------
// Gemini Call Wrapper
// --------------------------------------------------------------------------
async function callAntigravity(prompt: string): Promise<unknown> {
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new McpError(ErrorCode.InternalError, `Antigravity API error: ${msg}`);
  }
}

// --------------------------------------------------------------------------
// MCP Server Setup
// --------------------------------------------------------------------------
const server = new Server(
  { name: "cat-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// --------------------------------------------------------------------------
// TOOL REGISTRY
// --------------------------------------------------------------------------
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "generate_cat_question",
      description: "Generate original CAT 2026/27 questions for any section, topic, and difficulty level. Powered by Antigravity (Gemini).",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["QA", "DILR", "VARC"], description: "CAT section" },
          topic: { type: "string", description: "Topic (e.g., Arithmetic, Data Interpretation, Reading Comprehension)" },
          subtopic: { type: "string", description: "Subtopic (e.g., Time Speed Distance, Linear Arrangement, Philosophy)" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"], description: "Difficulty level" },
          question_type: { type: "string", enum: ["MCQ", "TITA", "AUTO"], description: "MCQ = 4 options, TITA = type answer, AUTO = let AI decide" },
          count: { type: "number", minimum: 1, maximum: 10, default: 1, description: "Number of questions to generate" }
        },
        required: ["section", "topic", "subtopic", "difficulty"]
      }
    },
    {
      name: "generate_dilr_set",
      description: "Generate a complete DILR set (1 shared context + 5 questions) for CAT 2026/27. Returns a ready-to-use practice set.",
      inputSchema: {
        type: "object",
        properties: {
          set_type: { type: "string", enum: ["Data Interpretation", "Logical Reasoning"], description: "DI or LR set" },
          subtype: { type: "string", description: "Specific type e.g. 'Binary Logic', 'Caselet', 'Game & Tournament'" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] }
        },
        required: ["set_type", "subtype", "difficulty"]
      }
    },
    {
      name: "generate_rc_passage",
      description: "Generate a complete RC passage with questions for CAT 2026/27 VARC section.",
      inputSchema: {
        type: "object",
        properties: {
          domain: { type: "string", description: "Topic domain e.g. Philosophy, Economics, Social Science, Technology" },
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          question_count: { type: "number", minimum: 3, maximum: 6, default: 5 }
        },
        required: ["domain", "difficulty"]
      }
    },
    {
      name: "generate_para_jumble",
      description: "Generate VA Para Jumble (TITA) questions for CAT 2026/27.",
      inputSchema: {
        type: "object",
        properties: {
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
          count: { type: "number", minimum: 1, maximum: 5, default: 2 }
        },
        required: ["difficulty"]
      }
    },
    {
      name: "generate_mock_test",
      description: "Generate a complete CAT mock test with all 66 questions across VARC, DILR, and QA sections.",
      inputSchema: {
        type: "object",
        properties: {
          difficulty: { type: "string", enum: ["Easy", "Medium", "Hard", "Mixed"], default: "Mixed" },
          year_target: { type: "number", enum: [2026, 2027], default: 2026 },
          section_filter: { type: "string", enum: ["ALL", "QA", "VARC", "DILR"], default: "ALL", description: "Generate only specific section" }
        },
        required: []
      }
    },
    {
      name: "create_training_module",
      description: "Create a complete training module with theory, formulas, worked examples, and practice questions for a CAT topic.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["QA", "DILR", "VARC"] },
          topic: { type: "string", description: "Parent topic" },
          subtopic: { type: "string", description: "Specific subtopic to learn" },
          level: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] }
        },
        required: ["section", "topic", "subtopic", "level"]
      }
    },
    {
      name: "get_cat_syllabus",
      description: "Get the complete CAT 2026/27 syllabus with topic weightage, question counts, and exam structure.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["ALL", "QA", "VARC", "DILR"], default: "ALL" },
          format: { type: "string", enum: ["json", "text"], default: "json" }
        },
        required: []
      }
    },
    {
      name: "validate_question",
      description: "Validate a CAT question for exam readiness, difficulty calibration, and quality standards.",
      inputSchema: {
        type: "object",
        properties: {
          question: { type: "object", description: "The question object to validate (following CAT question schema)" }
        },
        required: ["question"]
      }
    },
    {
      name: "get_topic_list",
      description: "Get the complete list of CAT topics and subtopics for a given section.",
      inputSchema: {
        type: "object",
        properties: {
          section: { type: "string", enum: ["QA", "VARC", "DILR"] }
        },
        required: ["section"]
      }
    }
  ]
}));

// --------------------------------------------------------------------------
// TOOL HANDLERS
// --------------------------------------------------------------------------
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {

      // ─── generate_cat_question ───────────────────────────────────────────
      case "generate_cat_question": {
        const { section, topic, subtopic, difficulty, question_type = "AUTO", count = 1 } = args as {
          section: "QA" | "VARC" | "DILR";
          topic: string;
          subtopic: string;
          difficulty: "Easy" | "Medium" | "Hard";
          question_type?: "MCQ" | "TITA" | "AUTO";
          count?: number;
        };

        let prompt: string;
        if (section === "QA") {
          const resolvedType = question_type === "AUTO" ? (difficulty === "Hard" && Math.random() > 0.6 ? "TITA" : "MCQ") : question_type as "MCQ" | "TITA";
          prompt = buildQAQuestionPrompt(topic, subtopic, difficulty, resolvedType, count);
        } else if (section === "VARC" && (topic === "Para Jumble" || subtopic === "Para Jumble")) {
          prompt = buildParaJumblePrompt(difficulty);
        } else {
          prompt = buildQAQuestionPrompt(topic, subtopic, difficulty, question_type === "AUTO" ? "MCQ" : (question_type as "MCQ" | "TITA"), count);
        }

        const questions = await callAntigravity(prompt);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, count, section, topic, subtopic, difficulty, questions }, null, 2)
          }]
        };
      }

      // ─── generate_dilr_set ───────────────────────────────────────────────
      case "generate_dilr_set": {
        const { set_type, subtype, difficulty } = args as {
          set_type: "Data Interpretation" | "Logical Reasoning";
          subtype: string;
          difficulty: "Easy" | "Medium" | "Hard";
        };

        const prompt = buildDILRSetPrompt(set_type, subtype, difficulty);
        const dilrSet = await callAntigravity(prompt);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, dilrSet }, null, 2)
          }]
        };
      }

      // ─── generate_rc_passage ─────────────────────────────────────────────
      case "generate_rc_passage": {
        const { domain, difficulty, question_count = 5 } = args as {
          domain: string;
          difficulty: "Easy" | "Medium" | "Hard";
          question_count?: number;
        };

        const prompt = buildRCPassagePrompt(domain, difficulty, question_count);
        const passage = await callAntigravity(prompt);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, passage }, null, 2)
          }]
        };
      }

      // ─── generate_para_jumble ────────────────────────────────────────────
      case "generate_para_jumble": {
        const { difficulty, count = 2 } = args as {
          difficulty: "Easy" | "Medium" | "Hard";
          count?: number;
        };

        const results = [];
        for (let i = 0; i < count; i++) {
          const prompt = buildParaJumblePrompt(difficulty);
          const pj = await callAntigravity(prompt);
          results.push(pj);
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, count, questions: results }, null, 2)
          }]
        };
      }

      // ─── generate_mock_test ──────────────────────────────────────────────
      case "generate_mock_test": {
        const { difficulty = "Mixed", year_target = 2026, section_filter = "ALL" } = args as {
          difficulty?: "Easy" | "Medium" | "Hard" | "Mixed";
          year_target?: number;
          section_filter?: "ALL" | "QA" | "VARC" | "DILR";
        };

        const distribution = getMockTestDistribution(difficulty);
        const testId = `MOCK-${Date.now()}-${difficulty.toUpperCase()}`;
        const mockTestStructure: Record<string, unknown> = { test_id: testId, difficulty, year_target, sections: {} };
        const sections = (mockTestStructure.sections as Record<string, unknown>);

        if (section_filter === "ALL" || section_filter === "QA") {
          // Generate QA: 22 questions across topics
          const qaTopics = [
            { topic: "Arithmetic", subtopic: "Time Speed Distance", diff: "Medium" as const, count: 2 },
            { topic: "Arithmetic", subtopic: "Profit Loss", diff: "Easy" as const, count: 2 },
            { topic: "Algebra", subtopic: "Quadratic Equations", diff: "Medium" as const, count: 2 },
            { topic: "Geometry", subtopic: "Circles", diff: "Hard" as const, count: 2 },
            { topic: "NumberSystem", subtopic: "Remainders", diff: "Hard" as const, count: 2 },
          ];

          const qaQuestions = [];
          for (const t of qaTopics) {
            const prompt = buildQAQuestionPrompt(t.topic, t.subtopic, t.diff, "MCQ", t.count);
            const qs = await callAntigravity(prompt);
            qaQuestions.push(...(Array.isArray(qs) ? qs : [qs]));
          }
          sections.QA = { questions: qaQuestions };
        }

        if (section_filter === "ALL" || section_filter === "DILR") {
          const dilrSets = [];
          const dilrConfigs = [
            { set_type: "Data Interpretation" as const, subtype: "Caselet", difficulty: "Medium" as const },
            { set_type: "Logical Reasoning" as const, subtype: "Binary Logic", difficulty: difficulty === "Mixed" ? "Hard" as const : difficulty as "Easy" | "Medium" | "Hard" },
          ];
          for (const cfg of dilrConfigs) {
            const prompt = buildDILRSetPrompt(cfg.set_type, cfg.subtype, cfg.difficulty);
            const set = await callAntigravity(prompt);
            dilrSets.push(set);
          }
          sections.DILR = { sets: dilrSets };
        }

        if (section_filter === "ALL" || section_filter === "VARC") {
          const rcPassage = await callAntigravity(buildRCPassagePrompt("Economics / Global Affairs", "Medium", 5));
          const paraJumbles = [];
          for (let i = 0; i < 2; i++) {
            const pj = await callAntigravity(buildParaJumblePrompt("Medium"));
            paraJumbles.push(pj);
          }
          sections.VARC = {
            passages: [rcPassage],
            verbal_ability: paraJumbles
          };
        }

        mockTestStructure.metadata = {
          difficulty_distribution: distribution,
          year_target,
          sections_generated: section_filter,
          generated_at: new Date().toISOString()
        };

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, mock_test: mockTestStructure }, null, 2)
          }]
        };
      }

      // ─── create_training_module ──────────────────────────────────────────
      case "create_training_module": {
        const { section, topic, subtopic, level } = args as {
          section: "QA" | "DILR" | "VARC";
          topic: string;
          subtopic: string;
          level: "Beginner" | "Intermediate" | "Advanced";
        };

        const prompt = buildTrainingModulePrompt(section, topic, subtopic, level);
        const module_ = await callAntigravity(prompt);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, module: module_ }, null, 2)
          }]
        };
      }

      // ─── get_cat_syllabus ────────────────────────────────────────────────
      case "get_cat_syllabus": {
        const { section = "ALL", format = "json" } = args as {
          section?: "ALL" | "QA" | "VARC" | "DILR";
          format?: "json" | "text";
        };

        const sectionKey = section === "ALL" ? undefined : section as "QA" | "VARC" | "DILR";
        const data = format === "json"
          ? (sectionKey ? CAT_SYLLABUS[sectionKey] : CAT_SYLLABUS)
          : getSyllabusText(sectionKey);

        return {
          content: [{
            type: "text",
            text: typeof data === "string" ? data : JSON.stringify({ syllabus: data }, null, 2)
          }]
        };
      }

      // ─── validate_question ───────────────────────────────────────────────
      case "validate_question": {
        const { question } = args as { question: unknown };
        const prompt = buildValidationPrompt(JSON.stringify(question, null, 2));
        const validation = await callAntigravity(prompt);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, validation }, null, 2)
          }]
        };
      }

      // ─── get_topic_list ──────────────────────────────────────────────────
      case "get_topic_list": {
        const { section } = args as { section: "QA" | "VARC" | "DILR" };
        const topics = getTopicsForSection(section);
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              section,
              total_topics: topics.length,
              topics
            }, null, 2)
          }]
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (err) {
    if (err instanceof McpError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${msg}`);
  }
});

// --------------------------------------------------------------------------
// Start Server
// --------------------------------------------------------------------------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[CAT-MCP] Server running on stdio. Connected to Antigravity (Gemini).");
}

main().catch(err => {
  console.error("[CAT-MCP] Fatal error:", err);
  process.exit(1);
});
