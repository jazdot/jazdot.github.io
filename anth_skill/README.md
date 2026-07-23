# CAT MCP Server — Antigravity (Gemini) Integration
## For CAT 2026/27 Coaching & Mock Test Webapp

---

## What This Is

An MCP (Model Context Protocol) server that connects your CAT coaching webapp to Google Antigravity (Gemini) for:
- **Dynamic question generation** across all CAT sections and topics
- **Full mock test generation** (66 questions, all sections)
- **Training module creation** with theory + practice
- **Question quality validation**

---

## Setup

### 1. Install dependencies
```bash
cd cat-mcp-server
npm install
npm run build
```

### 2. Configure your API key
```bash
# .env
ANTIGRAVITY_API_KEY=your-gemini-api-key-from-google-cloud
# OR
GEMINI_API_KEY=your-api-key

# Optional: Override model
GEMINI_MODEL=gemini-1.5-pro  # default
```

### 3. Register with Claude Desktop
Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "cat-mcp-server": {
      "command": "node",
      "args": ["/absolute/path/to/cat-mcp-server/dist/index.js"],
      "env": {
        "ANTIGRAVITY_API_KEY": "your-gemini-api-key"
      }
    }
  }
}
```

---

## Available Tools

| Tool | Description |
|---|---|
| `generate_cat_question` | Generate QA, VARC (VA), or DILR questions |
| `generate_dilr_set` | Full DILR set: 1 context + 5 questions |
| `generate_rc_passage` | Complete RC passage + 4-5 questions |
| `generate_para_jumble` | VA Para Jumble (TITA) questions |
| `generate_mock_test` | Full 66-question CAT mock test |
| `create_training_module` | Training module with theory + practice |
| `get_cat_syllabus` | Syllabus with weightage |
| `validate_question` | Quality gate for any question |
| `get_topic_list` | All topics per section |

---

## Webapp Integration (REST API Wrapper)

To call from your React frontend, wrap MCP tools in an Express API:

```typescript
// server/api/cat-questions.ts
import express from "express";
import { generateQuestionDirect } from "../mcp-bridge";

const router = express.Router();

// GET /api/cat/question?section=QA&topic=Arithmetic&subtopic=TSD&difficulty=Medium
router.get("/question", async (req, res) => {
  const { section, topic, subtopic, difficulty, count = 1 } = req.query;
  try {
    const result = await generateQuestionDirect({
      section, topic, subtopic, difficulty, count: Number(count)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cat/mock-test
router.post("/mock-test", async (req, res) => {
  const { difficulty = "Mixed", year_target = 2026, section_filter = "ALL" } = req.body;
  try {
    const result = await generateMockTestDirect({ difficulty, year_target, section_filter });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
```

---

## Tool Usage Examples

### Generate a Hard QA question
```
generate_cat_question({
  section: "QA",
  topic: "Algebra",
  subtopic: "Quadratic Equations",
  difficulty: "Hard",
  question_type: "TITA",
  count: 3
})
```

### Generate a DILR Binary Logic set
```
generate_dilr_set({
  set_type: "Logical Reasoning",
  subtype: "Binary Logic",
  difficulty: "Hard"
})
```

### Generate Economics RC passage
```
generate_rc_passage({
  domain: "Economics / Global Trade Policy",
  difficulty: "Medium",
  question_count: 5
})
```

### Create a training module
```
create_training_module({
  section: "QA",
  topic: "NumberSystem",
  subtopic: "Remainder Theorem",
  level: "Intermediate"
})
```

---

## Webapp Syllabus Module Design

For the training section tabs in your CAT webapp, map syllabus to routes:

```
/train/QA/Arithmetic/TSD         → Time Speed Distance module
/train/QA/Algebra/Quadratic      → Quadratic Equations module
/train/DILR/LR/BinaryLogic       → Binary Logic module
/train/VARC/RC/Philosophy        → RC: Philosophy passages
/train/VARC/VA/ParaJumble        → Para Jumble training
```

Each route calls `create_training_module` to generate fresh content, caches for 24h.

---

## Question Bank Caching Strategy

Don't call Antigravity on every request — cache questions:

```typescript
// Suggested cache TTL
const CACHE_TTL = {
  question: 7 * 24 * 60 * 60 * 1000,      // 7 days (questions don't expire)
  mock_test: 24 * 60 * 60 * 1000,          // 24 hours
  training_module: 30 * 24 * 60 * 60 * 1000 // 30 days
};
```

---

## SKILL.md — For Claude Direct Integration

The `SKILL.md` in this repo is a Claude skill file. Install it to let Claude generate CAT questions directly without calling Antigravity:

1. Place `SKILL.md` in your Claude skills directory
2. Claude will use it to generate questions inline during conversations
3. Use when Gemini API is unavailable or for quick question creation

---

## Compatibility

- Node.js ≥ 18
- Claude Desktop (for MCP registration)
- `@modelcontextprotocol/sdk` ^0.6.0
- `@google/generative-ai` ^0.15.0 (Antigravity/Gemini SDK)
- React + TypeScript frontend (your existing stack)
