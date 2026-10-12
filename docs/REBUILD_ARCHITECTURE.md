# SixSafety TypeScript Rebuild - Technical Architecture

**Version:** 1.0
**Date:** 2025-11-06
**Architect:** Winston (BMad Architect Agent)
**Approved By:** Allan

---

## Executive Summary

This document outlines the complete technical architecture for rebuilding SixSafety from a Streamlit/Python stack to a modern TypeScript/Next.js stack with Once UI and LangChain.js.

**Migration Strategy:** Clean rebuild with no backward compatibility
**Target:** 6 lean, vertical-slice stories
**Timeline:** ~4-6 weeks (1 week per story avg)
**Deployment:** Vercel (frontend + API) or Railway (full-stack)

---

## Technology Stack (2025 Verified Versions)

### Frontend
| Technology | Version | Purpose | Verification Date |
|------------|---------|---------|-------------------|
| Next.js | 15.x (latest) | React framework with App Router | 2025-11-06 |
| React | 19 RC | UI library (bundled with Next.js 15) | 2025-11-06 |
| TypeScript | 5.x | Type safety | 2025-11-06 |
| Once UI | Latest | Component library | 2025-11-06 |
| Zod | 3.x | Runtime validation | 2025-11-06 |

### Backend/RAG
| Technology | Version | Purpose | Verification Date |
|------------|---------|---------|-------------------|
| LangChain.js | v1.0 (latest) | RAG orchestration | 2025-11-06 |
| @langchain/langgraph | Latest | Workflow state management | 2025-11-06 |
| @langchain/pinecone | Latest | Vector store integration | 2025-11-06 |
| @langchain/openai | Latest | LLM and embeddings | 2025-11-06 |
| @pinecone-database/pinecone | v5 | Vector database SDK | 2025-11-06 |
| OpenAI | Latest | GPT-4-turbo, embeddings | 2025-11-06 |

### Infrastructure
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Deployment | Vercel or Railway | Zero-config, auto-scaling |
| Database | PostgreSQL (optional) | User data, plan history |
| Caching | Redis (optional) | Response caching |
| Monitoring | LangSmith | LLM tracing and debugging |
| Analytics | PostHog (optional) | User behavior tracking |

---

## Architectural Decisions

### Decision 1: Monolithic Next.js App

**Choice:** Single Next.js application (frontend + API routes)

**Rationale:**
- ✅ Simpler deployment (single deploy target)
- ✅ Shared TypeScript types across frontend/backend
- ✅ No network latency between services
- ✅ Easier local development
- ✅ Next.js 15 Server Actions eliminate need for separate API

**Trade-offs:**
- ❌ Less independent scaling (acceptable at current scale)
- ❌ Frontend and backend coupled (can separate later if needed)

**Alternative Considered:** Microservices (frontend, API, RAG service)
**Why Rejected:** Over-engineered for a 6-story rebuild. YAGNI principle.

---

### Decision 2: Server-Sent Events (SSE) for Real-Time Updates

**Choice:** SSE instead of WebSocket for progress updates

**Rationale:**
- ✅ Works on serverless platforms (Vercel)
- ✅ One-way communication sufficient (server → client only)
- ✅ Simpler than WebSocket (no handshake, no connection management)
- ✅ Built-in browser support with EventSource API
- ✅ Automatic reconnection on disconnect

**Trade-offs:**
- ❌ One-way only (but we don't need client → server streaming)

**Alternative Considered:** WebSocket
**Why Rejected:** Requires custom Node.js server, incompatible with Vercel

**Implementation Pattern:**
```typescript
// API route: /api/generate-plan/route.ts
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send progress updates
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 0, status: "Starting..." })}\n\n`));

      // Run RAG workflow with progress callbacks
      const result = await ragWorkflow.invoke(input, {
        callbacks: [{
          handleLLMNewToken: (token) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 50, status: "Generating..." })}\n\n`));
          }
        }]
      });

      // Send final result
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ progress: 100, result })}\n\n`));
      controller.close();
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

---

### Decision 3: Dual Server Actions Pattern (Replaces Streamlit Agents)

**Choice:** Two Server Actions for conversation generation

**Rationale:**
- ✅ Type-safe end-to-end (TypeScript)
- ✅ Server Actions are optimized for mutations
- ✅ Automatic request deduplication
- ✅ Built-in error handling
- ✅ No API route needed for simple operations

**Architecture:**
```
User Input → Server Action 1 (Conversational)
          ↓
    Textual Response
          ↓
    Server Action 2 (UI Generation)
          ↓
    UI Schema (Zod validated)
          ↓
    DynamicForm Component → Once UI Rendering
```

**Legacy Comparison:**
- **Streamlit:** ConversationalAgent + UIAgent (Python)
- **Modern:** generateConversation + generateUISchema (TypeScript Server Actions)

---

### Decision 4: LangGraph for RAG Orchestration

**Choice:** LangGraph workflow instead of manual LCEL chains

**Rationale:**
- ✅ 60% less code than manual chains
- ✅ Built-in state management
- ✅ Better error handling and retries
- ✅ Visual debugging with LangSmith
- ✅ Easy to add new steps (query rewriting, reranking)

**Workflow Design:**
```
┌─────────────────────────────────────────────┐
│         RAG Workflow (LangGraph)            │
├─────────────────────────────────────────────┤
│                                             │
│  [START]                                    │
│     ↓                                       │
│  [RETRIEVE] ← MultiQueryRetriever           │
│     │ Generate 3 query variations           │
│     │ Retrieve k=20 docs per query          │
│     │ Deduplicate and rank                  │
│     ↓                                       │
│  [ANALYZE]                                  │
│     │ GPT-4-turbo analyzes context          │
│     │ Identifies safety concerns            │
│     │ Verifies sources                      │
│     ↓                                       │
│  [GENERATE]                                 │
│     │ GPT-4-turbo generates plan            │
│     │ Uses Trinity-Bellwoods example        │
│     │ Formats with sources                  │
│     ↓                                       │
│  [END] → Safety Plan String                 │
│                                             │
└─────────────────────────────────────────────┘
```

**Legacy Comparison:**
- **Python:** 150+ lines of manual chain composition
- **TypeScript:** 50-70 lines with LangGraph

---

### Decision 5: Once UI Component-First Approach

**Choice:** Once UI over Tailwind-first libraries (shadcn, Radix)

**Rationale:**
- ✅ Component-first (no utility class management)
- ✅ 70% less code than shadcn + Tailwind
- ✅ Semantic variables for consistency
- ✅ Good TypeScript support
- ✅ Accessible by default

**Component Mapping (Streamlit → Once UI):**
| Streamlit | Once UI | Implementation |
|-----------|---------|----------------|
| `st.selectbox()` | `<Select>` | Dropdown with options |
| `st.radio()` | `<Button>` group | Multiple buttons with `variant="secondary"` |
| `st.multiselect()` | `<Checkbox>` group | Multiple checkboxes |
| `st.slider()` | `<Input type="range">` | HTML5 range input |
| `st.text_input()` | `<Input>` | Standard text input |
| `st.button()` | `<Button>` | Primary action button |

---

### Decision 6: Keep Existing Pinecone Index

**Choice:** Reuse existing Pinecone vector store

**Rationale:**
- ✅ No data migration needed
- ✅ Embeddings are OpenAI (same across Python/TypeScript)
- ✅ @langchain/pinecone has same API as Python version
- ✅ Saves time and cost

**Migration Steps:**
1. Install `@langchain/pinecone` and `@pinecone-database/pinecone`
2. Use same index name and namespace
3. Verify embeddings model matches (text-embedding-3-large or text-embedding-3-small)
4. Test retrieval with known queries

**Code Comparison:**
```python
# Legacy Python
from langchain_pinecone import PineconeVectorStore
vectorstore = PineconeVectorStore(
    index_name=os.environ["PINECONE_INDEX_NAME"],
    embedding=OpenAIEmbeddings(model="text-embedding-3-large")
)
```

```typescript
// Modern TypeScript
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { Pinecone } from "@pinecone-database/pinecone";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-small" // Or text-embedding-3-large
});

const pinecone = new Pinecone();
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!);

const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
  pineconeIndex,
  maxConcurrency: 5
});
```

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SIXSAFETY MODERNIZED                      │
│                 (TypeScript + Next.js 15)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │  FRONTEND: Next.js 15 App Router                  │    │
│  │  /app/page.tsx - Main survey interface            │    │
│  │  /components/DynamicForm.tsx - Form renderer      │    │
│  │  /lib/actions.ts - Server Actions                 │    │
│  └─────────────────┬─────────────────────────────────┘    │
│                    │                                        │
│         ┌──────────┴──────────┐                            │
│         │                     │                             │
│    Server Actions        API Routes                        │
│    (Short ops)          (Long ops + SSE)                   │
│         │                     │                             │
│         ▼                     ▼                             │
│  ┌─────────────┐    ┌─────────────────────────┐          │
│  │ Conversation│    │ /api/generate-plan      │          │
│  │ Generation  │    │ - LangGraph workflow     │          │
│  │ (GPT-4)     │    │ - SSE progress updates   │          │
│  │             │    │ - Returns safety plan    │          │
│  │ UI Schema   │    │                          │          │
│  │ Generation  │    │                          │          │
│  │ (GPT-4)     │    │                          │          │
│  └─────────────┘    └────────────┬─────────────┘          │
│                                  │                          │
│                                  ▼                          │
│                    ┌──────────────────────────┐            │
│                    │ RAG Service (LangGraph)  │            │
│                    │ - MultiQueryRetriever    │            │
│                    │ - Pinecone vector store  │            │
│                    │ - GPT-4-turbo generation │            │
│                    └──────────────────────────┘            │
│                                                             │
│  External Services:                                        │
│  - Pinecone (existing index)                              │
│  - OpenAI API (GPT-4, embeddings)                         │
│  - LangSmith (tracing)                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
sixsafety-next/
├── app/
│   ├── layout.tsx                 # Root layout with Once UI
│   ├── page.tsx                   # Main survey page
│   ├── api/
│   │   └── generate-plan/
│   │       └── route.ts           # SSE endpoint for RAG
│   └── plan/
│       └── page.tsx               # Plan display page
│
├── components/
│   ├── DynamicForm.tsx            # Renders Once UI from JSON schema
│   ├── NeighbourhoodSelect.tsx    # Dropdown for neighbourhood selection
│   ├── ConversationView.tsx       # Chat-style conversation display
│   └── PlanDisplay.tsx            # Safety plan renderer
│
├── lib/
│   ├── actions.ts                 # Server Actions (conversation, UI gen)
│   ├── rag/
│   │   ├── workflow.ts            # LangGraph RAG workflow
│   │   ├── prompts.ts             # System prompts
│   │   └── retrievers.ts          # MultiQueryRetriever setup
│   ├── schemas/
│   │   ├── ui-schema.ts           # Zod schemas for UI elements
│   │   └── survey-schema.ts       # Zod schemas for survey data
│   └── utils/
│       ├── openai.ts              # OpenAI client setup
│       ├── pinecone.ts            # Pinecone client setup
│       └── csv-loader.ts          # Load neighbourhood crime data
│
├── public/
│   └── data/
│       └── neighbourhood-crimes.csv   # Toronto crime statistics
│
├── types/
│   ├── survey.ts                  # TypeScript types for survey
│   └── plan.ts                    # TypeScript types for plan
│
├── .env.local                     # Environment variables
├── next.config.mjs                # Next.js configuration
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript configuration
└── README.md                      # Project documentation
```

---

## Data Flow Architecture

### Flow 1: Neighbourhood Selection

```
[User] → Select neighbourhood from dropdown
         ↓
      page.tsx loads crime data from CSV
         ↓
      Display crime statistics for neighbourhood
         ↓
      Store in React Context (conversation state)
         ↓
      Enable "Start Survey" button
```

### Flow 2: Dynamic Conversation (3 Exchanges)

```
[User] → Submit response to question
         ↓
      Server Action: generateConversation()
         ↓
      OpenAI GPT-4-turbo generates next question
         ↓
      Server Action: generateUISchema()
         ↓
      OpenAI GPT-4-turbo converts to JSON schema
         ↓
      Zod validation
         ↓
      Return UI schema to client
         ↓
      DynamicForm component renders Once UI components
         ↓
      User interacts with form
         ↓
      Repeat 3 times (3 exchanges total)
         ↓
      Enable "Generate Plan" button
```

### Flow 3: Plan Generation (RAG Workflow)

```
[User] → Click "Generate Plan"
         ↓
      POST /api/generate-plan (with survey data)
         ↓
      Establish SSE connection
         ↓
      LangGraph workflow starts
         ↓
      [RETRIEVE] MultiQueryRetriever
         │ → Generate 3 query variations
         │ → Retrieve k=20 docs from Pinecone
         │ → Deduplicate and return top 10
         │ → SSE: { progress: 25, status: "Retrieving documents..." }
         ↓
      [ANALYZE] GPT-4-turbo analysis
         │ → Analyze user context + retrieved docs
         │ → Identify safety concerns
         │ → SSE: { progress: 50, status: "Analyzing safety concerns..." }
         ↓
      [GENERATE] GPT-4-turbo generation
         │ → Generate safety plan with examples
         │ → Format with sources
         │ → SSE: { progress: 75, status: "Generating safety plan..." }
         ↓
      Format final output
         ↓
      SSE: { progress: 100, result: safetyPlan }
         ↓
      Close SSE connection
         ↓
      Client displays plan on /plan page
```

---

## Component Specifications

### 1. DynamicForm Component

**Purpose:** Render Once UI components from JSON schema

**Props:**
```typescript
interface DynamicFormProps {
  schema: UISchema;
  onSubmit: (values: Record<string, any>) => void;
  disabled?: boolean;
}

// Zod schema
const UIElementSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("select"),
    label: z.string(),
    options: z.array(z.string()),
    required: z.boolean().optional()
  }),
  z.object({
    type: z.literal("checkbox-group"),
    label: z.string(),
    options: z.array(z.string())
  }),
  z.object({
    type: z.literal("radio-group"),
    label: z.string(),
    options: z.array(z.string())
  }),
  z.object({
    type: z.literal("text"),
    label: z.string(),
    placeholder: z.string().optional()
  })
]);

const UISchema = z.object({
  title: z.string(),
  ui_elements: z.array(UIElementSchema)
});
```

**Implementation:**
```typescript
"use client"

import { useState } from "react";
import { Button, Input, Select, Checkbox } from "@once-ui/react";

export function DynamicForm({ schema, onSubmit, disabled }: DynamicFormProps) {
  const [values, setValues] = useState<Record<string, any>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2>{schema.title}</h2>

      {schema.ui_elements.map((element, index) => {
        switch (element.type) {
          case "select":
            return (
              <Select
                key={index}
                label={element.label}
                options={element.options}
                onChange={(value) => setValues({...values, [element.label]: value})}
                required={element.required}
              />
            );

          case "checkbox-group":
            return (
              <fieldset key={index}>
                <legend>{element.label}</legend>
                {element.options.map(option => (
                  <Checkbox
                    key={option}
                    label={option}
                    onChange={(checked) => {
                      const current = values[element.label] || [];
                      setValues({
                        ...values,
                        [element.label]: checked
                          ? [...current, option]
                          : current.filter(v => v !== option)
                      });
                    }}
                  />
                ))}
              </fieldset>
            );

          case "radio-group":
            return (
              <div key={index} role="radiogroup">
                <label>{element.label}</label>
                {element.options.map(option => (
                  <Button
                    key={option}
                    variant={values[element.label] === option ? "primary" : "secondary"}
                    onClick={() => setValues({...values, [element.label]: option})}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            );

          case "text":
            return (
              <Input
                key={index}
                label={element.label}
                placeholder={element.placeholder}
                onChange={(e) => setValues({...values, [element.label]: e.target.value})}
              />
            );

          default:
            return null;
        }
      })}

      <Button type="submit" disabled={disabled}>
        Continue
      </Button>
    </form>
  );
}
```

---

### 2. Server Actions (Dual-Agent Pattern)

**File:** `lib/actions.ts`

```typescript
"use server"

import { z } from "zod";
import OpenAI from "openai";
import { UISchema } from "./schemas/ui-schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// System prompts (same as legacy config.json)
const CONVERSATIONAL_PROMPT = `
Guide the user through a structured conversation to gather information for a personalized safety recommendation plan.
Start the first exchange with a MultiSelect asking the user to select one or more crime types from: 'Assault', 'Auto Theft', 'Break and Enter', and 'Robbery.'
If the crime type selection has already been collected, do not ask for it again in subsequent exchanges.
Use the user's responses to refine questions and collect more specific details about safety habits, vulnerabilities, or current security measures.
Ensure each exchange includes at least three UI elements, using a balanced mix of MultiSelect, RadioButtons, and Checkboxes.
Use Sliders sparingly and only when absolutely necessary, ensuring the scale aligns with the context of the question.
Avoid text inputs entirely, and do not suggest pepper spray or self-defense devices illegal in Canada.
Keep the interaction concise, with three back-and-forth exchanges designed to gather comprehensive information.
`;

const UI_GENERATION_PROMPT = `
Convert the conversation text into a structured JSON format for the UI.
Start the first UI section with a MultiSelect for selecting crime types ('Assault', 'Auto Theft', 'Break and Enter', 'Robbery').
If crime type selection has already been collected, exclude it from subsequent exchanges.
Each UI section must include at least three diverse UI elements, ensuring a balance between MultiSelect, RadioButtons, and Checkboxes.
For Checkboxes, frame labels as Yes/No questions with a tooltip in brackets: 'Check for Yes, Uncheck for No.'
Use Sliders only when absolutely necessary and ensure the scale is clearly defined and appropriate for the context.
Avoid including text inputs or any references to updates, alerts, or illegal self-defense devices in Canada.

Return JSON matching this schema:
{
  "title": "Question Title",
  "ui_elements": [
    {
      "type": "select" | "checkbox-group" | "radio-group" | "text",
      "label": "Element Label",
      "options": ["Option 1", "Option 2"] // For select, checkbox-group, radio-group
    }
  ]
}
`;

// Server Action 1: Conversational Agent
export async function generateConversation(
  userInput: string,
  history: Array<{role: "user" | "assistant", content: string}>
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: CONVERSATIONAL_PROMPT },
        ...history,
        { role: "user", content: userInput }
      ],
      temperature: 0.7
    });

    return {
      success: true,
      content: response.choices[0].message.content
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Server Action 2: UI Generation Agent
export async function generateUISchema(conversationText: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        { role: "system", content: UI_GENERATION_PROMPT },
        { role: "user", content: conversationText }
      ],
      response_format: { type: "json_object" }, // Structured output
      temperature: 0.3 // Lower temperature for more consistent JSON
    });

    const json = JSON.parse(response.choices[0].message.content!);
    const validated = UISchema.parse(json); // Zod validation

    return {
      success: true,
      schema: validated
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
```

---

### 3. RAG Workflow (LangGraph)

**File:** `lib/rag/workflow.ts`

```typescript
import { StateGraph, END } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { Document } from "@langchain/core/documents";
import { getPineconeVectorStore } from "./pinecone";
import { ANALYSIS_PROMPT, GENERATION_PROMPT, SAFETY_EXAMPLES } from "./prompts";

// Define state shape
interface RAGState {
  input: string;
  neighbourhood: string;
  crime_types: string[];
  user_context: string[];
  documents: Document[];
  analysis: string;
  plan: string;
}

// Initialize LLM
const llm = new ChatOpenAI({
  model: "gpt-4-turbo",
  temperature: 0
});

// Create workflow
const workflow = new StateGraph<RAGState>({
  channels: {
    input: null,
    neighbourhood: null,
    crime_types: null,
    user_context: null,
    documents: null,
    analysis: null,
    plan: null
  }
});

// Node 1: Multi-query retrieval
workflow.addNode("retrieve", async (state) => {
  const vectorStore = await getPineconeVectorStore();

  // Create multi-query retriever
  const retriever = MultiQueryRetriever.fromLLM({
    llm: new ChatOpenAI({ model: "gpt-4-turbo" }),
    retriever: vectorStore.asRetriever({
      k: 20, // Retrieve more docs initially
      searchType: "similarity"
    }),
    queryCount: 3, // Generate 3 query variations
    verbose: true
  });

  // Format input for retrieval
  const query = `
    Neighbourhood: ${state.neighbourhood}
    Safety Concerns: ${state.crime_types.join(", ")}
    User Context: ${state.user_context.join("\n")}
  `;

  const documents = await retriever.getRelevantDocuments(query);

  // Return top 10 after deduplication
  return { documents: documents.slice(0, 10) };
});

// Node 2: Analyze
workflow.addNode("analyze", async (state) => {
  const analysisChain = PromptTemplate.fromTemplate(ANALYSIS_PROMPT)
    .pipe(llm)
    .pipe(new StringOutputParser());

  const analysis = await analysisChain.invoke({
    neighbourhood: state.neighbourhood,
    crime_types: state.crime_types.join(", "),
    user_context: state.user_context.join("\n"),
    context: state.documents.map(d => d.pageContent).join("\n\n")
  });

  return { analysis };
});

// Node 3: Generate
workflow.addNode("generate", async (state) => {
  const generationChain = PromptTemplate.fromTemplate(GENERATION_PROMPT)
    .pipe(llm)
    .pipe(new StringOutputParser());

  const plan = await generationChain.invoke({
    neighbourhood: state.neighbourhood,
    crime_types: state.crime_types.join(", "),
    analysis: state.analysis,
    examples: SAFETY_EXAMPLES
  });

  // Format final output with sources
  const formattedPlan = `
CITY OF TORONTO SERVICE SAFETY PLAN
Neighbourhood: ${state.neighbourhood}
Primary Concerns: ${state.crime_types.join(", ")}

${plan}

Sources Consulted:
${state.documents.map(d => `- ${d.metadata.title} (${d.metadata.source})`).join("\n")}

----

Note: This safety plan is generated based on Toronto Police Service resources and general
safety guidelines. For emergencies, always call 911. For non-emergency police matters,
call 416-808-2222.
  `.trim();

  return { plan: formattedPlan };
});

// Define edges
workflow.addEdge("retrieve", "analyze");
workflow.addEdge("analyze", "generate");
workflow.addEdge("generate", END);

// Compile workflow
export const ragWorkflow = workflow.compile();

// Export function for API route
export async function generateSafetyPlan(input: {
  neighbourhood: string;
  crime_types: string[];
  user_context: string[];
}) {
  const result = await ragWorkflow.invoke({
    input: JSON.stringify(input),
    neighbourhood: input.neighbourhood,
    crime_types: input.crime_types,
    user_context: input.user_context,
    documents: [],
    analysis: "",
    plan: ""
  });

  return result.plan;
}
```

---

### 4. SSE API Route

**File:** `app/api/generate-plan/route.ts`

```typescript
import { NextRequest } from "next/server";
import { generateSafetyPlan } from "@/lib/rag/workflow";

export const runtime = "nodejs"; // Use Node.js runtime for streaming

export async function POST(request: NextRequest) {
  const { neighbourhood, crime_types, user_context } = await request.json();

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send initial progress
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            progress: 0,
            status: "Starting safety plan generation..."
          })}\n\n`)
        );

        // Simulate progress updates (in real implementation, use callbacks)
        const progressInterval = setInterval(() => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              progress: Math.min(progress + 10, 90),
              status: "Processing..."
            })}\n\n`)
          );
        }, 500);

        let progress = 10;

        // Generate plan
        const plan = await generateSafetyPlan({
          neighbourhood,
          crime_types,
          user_context
        });

        // Clear interval
        clearInterval(progressInterval);

        // Send final result
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            progress: 100,
            status: "Complete",
            result: plan
          })}\n\n`)
        );

        controller.close();
      } catch (error) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({
            error: error instanceof Error ? error.message : "Unknown error"
          })}\n\n`)
        );
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

---

## Environment Variables

```env
# .env.local

# OpenAI
OPENAI_API_KEY=sk-...

# Pinecone
PINECONE_API_KEY=...
PINECONE_INDEX=sixsafety-toronto-safety
PINECONE_ENVIRONMENT=us-east-1  # Optional, auto-detected

# LangSmith (optional, for tracing)
LANGSMITH_API_KEY=...
LANGSMITH_PROJECT=sixsafety-rebuild

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## THE 6 LEAN STORIES

### Story 1: Foundation + Static Survey Interface

**Goal:** Set up Next.js project with Once UI and static neighbourhood selection

**Acceptance Criteria:**
- ✅ Next.js 15 project initialized with TypeScript
- ✅ Once UI installed and configured
- ✅ Neighbourhood selection dropdown populated from CSV
- ✅ Crime statistics displayed for selected neighbourhood
- ✅ Basic routing (/ → /survey → /plan)
- ✅ Deployed to Vercel (or Railway)

**Technical Tasks:**
1. Run `npx create-next-app@latest sixsafety-next --typescript --tailwind --app`
2. Install Once UI: `npm install @once-ui/react`
3. Configure Once UI theme in `app/layout.tsx`
4. Create `/app/page.tsx` with neighbourhood selection
5. Load CSV data (`public/data/neighbourhood-crimes.csv`)
6. Create `components/NeighbourhoodSelect.tsx`
7. Display crime statistics for selected neighbourhood
8. Set up environment variables
9. Deploy to Vercel

**Deliverables:**
- Working Next.js app with neighbourhood selection
- URL: `https://sixsafety-next.vercel.app`

**Estimated Time:** 1 week

---

### Story 2: Dynamic Form System (Dual Server Actions)

**Goal:** Implement LLM-driven dynamic form generation

**Acceptance Criteria:**
- ✅ Two Server Actions implemented (conversation + UI generation)
- ✅ `DynamicForm` component renders Once UI from JSON schema
- ✅ Conversation state managed with React Context
- ✅ 3-exchange conversation flow enforced
- ✅ Zod validation for UI schemas
- ✅ Error handling for LLM failures

**Technical Tasks:**
1. Create `lib/actions.ts` with dual Server Actions
2. Implement `generateConversation()` Server Action
3. Implement `generateUISchema()` Server Action
4. Create `lib/schemas/ui-schema.ts` with Zod schemas
5. Build `components/DynamicForm.tsx` component
6. Create React Context for conversation state
7. Implement conversation flow in `/app/survey/page.tsx`
8. Add loading states and error boundaries
9. Test with various conversation flows

**Deliverables:**
- Fully functional dynamic survey with LLM-generated questions
- No hardcoded questions (all generated by GPT-4)

**Estimated Time:** 1.5 weeks

---

### Story 3: RAG Backend Service (LangGraph)

**Goal:** Build TypeScript RAG pipeline with LangGraph

**Acceptance Criteria:**
- ✅ LangGraph workflow implemented (retrieve → analyze → generate)
- ✅ MultiQueryRetriever configured with Pinecone
- ✅ Connected to existing Pinecone index
- ✅ Analysis and generation prompts ported from Python
- ✅ Safety plan format matches legacy output
- ✅ LangSmith tracing enabled

**Technical Tasks:**
1. Install LangChain.js packages: `@langchain/langgraph`, `@langchain/pinecone`, `@langchain/openai`
2. Create `lib/rag/workflow.ts` with LangGraph state graph
3. Implement `retrieve` node with MultiQueryRetriever
4. Implement `analyze` node with GPT-4
5. Implement `generate` node with GPT-4
6. Port prompts from Python to `lib/rag/prompts.ts`
7. Set up Pinecone connection in `lib/rag/pinecone.ts`
8. Test workflow with sample inputs
9. Verify embeddings match (text-embedding-3-large or text-embedding-3-small)
10. Enable LangSmith tracing

**Deliverables:**
- Standalone RAG service that can be called from API route
- Test script demonstrating workflow execution

**Estimated Time:** 1.5 weeks

---

### Story 4: Frontend-Backend Integration (SSE)

**Goal:** Connect survey to RAG pipeline with real-time updates

**Acceptance Criteria:**
- ✅ API route `/api/generate-plan` implemented with SSE
- ✅ Survey submission triggers plan generation
- ✅ Progress updates displayed in real-time
- ✅ Generated plan displayed on `/plan` page
- ✅ Error handling for RAG failures
- ✅ Plan can be regenerated if error occurs

**Technical Tasks:**
1. Create `app/api/generate-plan/route.ts` with SSE
2. Connect API route to LangGraph workflow
3. Implement progress callback system
4. Create `/app/plan/page.tsx` for plan display
5. Build `components/PlanDisplay.tsx` component
6. Implement SSE client in survey page
7. Add progress bar and status messages
8. Handle SSE errors and reconnection
9. Store plan in session (or database if implemented)
10. Add "Download PDF" button (optional)

**Deliverables:**
- End-to-end flow: neighbourhood selection → survey → plan generation → display
- Real-time progress updates during generation

**Estimated Time:** 1 week

---

### Story 5: Polish & UX Enhancements

**Goal:** Improve user experience and error handling

**Acceptance Criteria:**
- ✅ Loading states for all async operations
- ✅ Error messages user-friendly
- ✅ Conversation flow validates 3 exchanges
- ✅ Responsive design (mobile + desktop)
- ✅ Accessibility (keyboard navigation, screen readers)
- ✅ Plan export/download functionality
- ✅ "Restart Survey" button
- ✅ Animated transitions (Once UI)

**Technical Tasks:**
1. Add loading skeletons for all components
2. Implement error boundaries with retry logic
3. Add validation for conversation exchange count
4. Test responsive design on mobile devices
5. Run accessibility audit (axe DevTools)
6. Implement plan export (PDF or Markdown)
7. Add "Restart Survey" functionality
8. Improve animations and transitions
9. Add tooltips for complex UI elements
10. User testing and feedback

**Deliverables:**
- Polished, production-ready user interface
- Accessibility compliance (WCAG 2.1 AA)

**Estimated Time:** 1 week

---

### Story 6: Production Ready (Monitoring + Optimization)

**Goal:** Prepare for production deployment

**Acceptance Criteria:**
- ✅ LangSmith monitoring configured
- ✅ Response caching implemented (Redis or in-memory)
- ✅ Rate limiting for API routes
- ✅ Error tracking (Sentry or similar)
- ✅ Performance optimization (Lighthouse score >90)
- ✅ SEO optimization
- ✅ Production deployment tested
- ✅ Documentation updated

**Technical Tasks:**
1. Configure LangSmith project and tags
2. Implement response caching (Redis or Vercel KV)
3. Add rate limiting with `next-rate-limit`
4. Set up Sentry for error tracking
5. Run Lighthouse audit and optimize
6. Add meta tags for SEO
7. Create API documentation
8. Write deployment guide
9. Load testing with realistic traffic
10. Final production deployment

**Deliverables:**
- Production-ready application with monitoring
- Deployment documentation

**Estimated Time:** 1 week

---

## Story Dependencies

```
Story 1 (Foundation)
    ↓
Story 2 (Dynamic Forms)  ←→  Story 3 (RAG Backend)
    ↓                              ↓
    └────────→ Story 4 (Integration) ←────────┘
                    ↓
               Story 5 (Polish)
                    ↓
               Story 6 (Production)
```

**Notes:**
- Stories 2 and 3 can be developed in parallel
- Story 4 requires both Stories 2 and 3 complete
- Stories 5 and 6 are sequential refinements

---

## Deployment Strategy

### Development
```bash
# Local development
npm run dev

# Access at http://localhost:3000
```

### Staging (Vercel)
```bash
# Automatic preview deployments on PR
git push origin feature-branch

# Vercel creates preview URL: https://sixsafety-next-{hash}.vercel.app
```

### Production (Vercel)
```bash
# Deploy to production
git push origin main

# Live at: https://sixsafety.vercel.app
```

### Alternative: Railway (if WebSocket needed later)
```bash
# Connect Railway to GitHub repo
railway up

# Automatic deployments on push to main
# Custom domain: https://sixsafety.up.railway.app
```

---

## Migration Checklist

### Pre-Migration
- [ ] Export existing Pinecone index metadata
- [ ] Backup current production data
- [ ] Document API contracts from legacy middleware
- [ ] Set up new GitHub repository
- [ ] Configure CI/CD pipeline

### During Migration
- [ ] Story 1: Foundation complete ✓
- [ ] Story 2: Dynamic forms complete ✓
- [ ] Story 3: RAG backend complete ✓
- [ ] Story 4: Integration complete ✓
- [ ] Story 5: Polish complete ✓
- [ ] Story 6: Production ready ✓

### Post-Migration
- [ ] Blue-green deployment (run both old and new)
- [ ] Monitor error rates and performance
- [ ] User acceptance testing
- [ ] Gradual traffic switching (10% → 50% → 100%)
- [ ] Decommission legacy system
- [ ] Archive legacy repositories

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| LLM API changes | Low | High | Pin API versions, monitor OpenAI changelog |
| Pinecone index incompatibility | Low | High | Test with sample queries early (Story 3) |
| SSE browser support | Low | Medium | Fallback to polling if SSE fails |
| Cost overruns (LLM calls) | Medium | Medium | Implement caching, rate limiting |
| Dynamic form complexity | Medium | High | Extensive testing with edge cases |
| Performance issues | Low | Medium | Load testing in Story 6 |

---

## Success Metrics

### Technical Metrics
- Response time < 5s (90th percentile)
- Error rate < 1%
- Lighthouse performance score > 90
- Test coverage > 80% (if adding tests later)

### Business Metrics
- Plan generation time < 90s (better than legacy)
- User completion rate > 70%
- User satisfaction score > 4/5

---

## Conclusion

This architecture provides a **lean, modern, production-ready** rebuild of SixSafety using TypeScript, Next.js 15, and LangChain.js. The 6-story breakdown ensures:

1. ✅ **Incremental delivery** - Each story is deployable
2. ✅ **Risk mitigation** - Critical components tested early
3. ✅ **Clean slate** - No legacy code debt
4. ✅ **Modern patterns** - Best practices from 2025
5. ✅ **Type safety** - End-to-end TypeScript
6. ✅ **Scalability** - Serverless-first architecture

**Total Estimated Timeline:** 6-8 weeks
**Team Size:** 1-2 developers
**Budget:** Low (serverless deployment, existing Pinecone index)

---

**Document Status:** ✅ Complete - Ready for Implementation
**Next Step:** Begin Story 1 - Foundation Setup

**Approved By:** Allan
**Date:** 2025-11-06
