# Story 2 Handoff: Dynamic Form System

**Status:** ✅ COMPLETE
**Completed:** 2025-11-06
**Next Story:** Story 3 - RAG Backend Service

---

## What Was Built

### Dual Server Actions Pattern
- ✅ `lib/actions.ts` - Two Server Actions:
  - `generateConversation()` - LLM generates next question
  - `generateUISchema()` - LLM converts text to UI JSON schema
- ✅ Uses OpenAI GPT-4-turbo-preview
- ✅ Structured output with `response_format: {type: "json_object"}`
- ✅ Zod validation for type safety

### Dynamic Form System
- ✅ `components/DynamicForm.tsx` - Renders UI from JSON schema
- ✅ Supports: select, checkbox-group, radio-group, text, slider
- ✅ Client-side validation
- ✅ Error handling and display
- ✅ Responsive design

### Conversation Management
- ✅ `lib/contexts/SurveyContext.tsx` - React Context for global state
- ✅ `components/ConversationView.tsx` - Chat-style history display
- ✅ Tracks 3-exchange conversation limit
- ✅ Stores responses for RAG input

### Survey Page
- ✅ `app/survey/page.tsx` - Main survey orchestration
- ✅ Loads neighbourhood from sessionStorage
- ✅ Manages conversation flow
- ✅ Progress indicator (3 exchanges)
- ✅ Completion state with "Generate Plan" button

### Schemas & Prompts
- ✅ `lib/schemas/ui-schema.ts` - Zod schemas for validation
- ✅ `lib/prompts/conversation-prompts.ts` - System prompts
- ✅ Few-shot examples for better LLM performance

---

## How It Works

### Flow Diagram
```
[User arrives at /survey]
    ↓
Load neighbourhood from sessionStorage
    ↓
Auto-start conversation with neighbourhood context
    ↓
[Exchange 1]
    → generateConversation(neighbourhoodData)
    → GPT-4 generates question
    → generateUISchema(question, exchangeNum=1)
    → GPT-4 generates UI JSON
    → Zod validates schema
    → DynamicForm renders UI
    → User fills form
    → Submit
    ↓
[Exchange 2]
    → generateConversation(userResponse, history)
    → GPT-4 generates next question
    → generateUISchema(question, exchangeNum=2)
    → Render → Submit
    ↓
[Exchange 3]
    → Same pattern
    ↓
[After 3 exchanges]
    → Mark survey complete
    → Show "Generate Plan" button
    → Store survey data in sessionStorage
    → Navigate to /plan
```

### Data Structure Passed to Story 3
```typescript
{
  neighbourhood: "Trinity-Bellwoods",
  crime_types: ["Auto Theft: High", "Break and Enter: High"],
  user_context: [
    "Q: Which crime types concern you?",
    "A: Auto Theft, Break and Enter",
    "Q: Do you have a car alarm?",
    "A: No",
    // ... more Q&A pairs
  ]
}
```

---

## What Story 3 Needs

### Input from Story 2
- ✅ `sessionStorage.getItem('surveyData')` contains complete survey data
- ✅ Format matches RAG input requirements
- ✅ Neighbourhood, crime types, and user context all included

### Files Story 3 Will Create
1. `lib/rag/workflow.ts` - LangGraph workflow definition
2. `lib/rag/prompts.ts` - Analysis and generation prompts
3. `lib/rag/pinecone.ts` - Pinecone client setup
4. `lib/rag/retrievers.ts` - MultiQueryRetriever configuration
5. `lib/utils/openai.ts` - OpenAI client utility
6. `types/rag.ts` - TypeScript types for RAG

### Story 3 Requirements
- Must implement LangGraph state graph
- Must use MultiQueryRetriever (k=20, 3 query variations)
- Must connect to existing Pinecone index
- Must match legacy prompt structure
- Must return formatted safety plan string

---

## Environment Variables Used

### Story 2 Requirements
```env
OPENAI_API_KEY=sk-...              # ✅ REQUIRED
LANGSMITH_API_KEY=...              # ✅ CONFIGURED
LANGSMITH_PROJECT=sixsafety-rebuild
LANGCHAIN_TRACING_V2=true
```

### Story 3 Additional Requirements
```env
PINECONE_API_KEY=...               # ⚠️ NEEDED
PINECONE_INDEX=...                 # ⚠️ NEEDED
```

---

## Testing Story 2

### Manual Test Steps
1. Ensure `.env.local` has OPENAI_API_KEY
2. `npm run dev`
3. Navigate to http://localhost:3000
4. Select neighbourhood (e.g., "Trinity-Bellwoods")
5. Click "Start Safety Survey"
6. **Exchange 1:** Should ask about crime types (checkbox-group)
7. Select options → Submit
8. **Exchange 2:** Should ask follow-up questions (varied UI)
9. Submit responses
10. **Exchange 3:** Final questions
11. Submit → See "Survey Complete" with checkmark
12. Click "Generate My Safety Plan"
13. Redirects to `/plan` (will show 404 until Story 4)
14. Check sessionStorage for `surveyData`

### Expected Behavior
- ✅ Progress bar shows 0/3, 1/3, 2/3, 3/3
- ✅ Conversation history displays in chat bubbles
- ✅ Dynamic forms render correctly
- ✅ Validation errors show for required fields
- ✅ Loading spinner shows during LLM calls
- ✅ Errors display in red banner if API fails

### Common Issues & Solutions

**"OpenAI API key not configured"**
- Add OPENAI_API_KEY to `.env.local`
- Restart dev server

**Form doesn't render after submission**
- Check browser console for Zod validation errors
- LLM may have returned invalid JSON
- Retry with lower temperature (already set to 0.3)

**Progress stuck at 0/3**
- Check if initial neighbourhood context is missing
- Verify sessionStorage has neighbourhood data

---

## Key Implementation Details

### Server Actions Pattern
```typescript
// Server Action 1: Conversational
"use server"
export async function generateConversation(
  userInput: string,
  history: Message[]
) {
  // Uses CONVERSATIONAL_SYSTEM_PROMPT
  // Temperature: 0.7 (creative)
  // Returns: { success, content } or { success, error }
}

// Server Action 2: UI Generation
"use server"
export async function generateUISchema(
  conversationText: string,
  exchangeNumber: number
) {
  // Uses UI_GENERATION_SYSTEM_PROMPT
  // Temperature: 0.3 (consistent)
  // response_format: { type: "json_object" }
  // Zod validation: UISchema.parse(json)
  // Returns: { success, schema } or { success, error }
}
```

### React Context Structure
```typescript
interface SurveyState {
  neighbourhood: NeighbourhoodStats | null;
  conversationHistory: Message[];       // All messages
  currentSchema: UISchemaType | null;   // Current form
  exchangeCount: number;                // 0-3
  responses: SurveyResponse[];          // All form submissions
  isComplete: boolean;                  // After 3 exchanges
  isLoading: boolean;                   // LLM call in progress
  error: string | null;                 // Error message
}
```

### Dynamic Form Rendering
- Uses `discriminatedUnion` for type-safe element rendering
- Switch statement maps schema type to React component
- Client-side validation before submission
- Disabled state during Server Action calls

---

## Files Created in Story 2

```
sixsafety-next/
├── app/
│   └── survey/
│       └── page.tsx               ✅ Survey orchestration
├── components/
│   ├── DynamicForm.tsx            ✅ Form renderer
│   └── ConversationView.tsx       ✅ Chat history
├── lib/
│   ├── actions.ts                 ✅ Server Actions
│   ├── contexts/
│   │   └── SurveyContext.tsx      ✅ React Context
│   ├── prompts/
│   │   └── conversation-prompts.ts ✅ System prompts
│   └── schemas/
│       └── ui-schema.ts           ✅ Zod schemas
└── docs/
    └── STORY_2_HANDOFF.md         ✅ This file
```

---

## Success Criteria Met

- ✅ Two Server Actions implemented (conversation + UI generation)
- ✅ `DynamicForm` component renders UI from JSON schema
- ✅ Conversation state managed with React Context
- ✅ 3-exchange conversation flow enforced
- ✅ Zod validation for UI schemas
- ✅ Error handling for LLM failures
- ✅ Progress indicator shows exchange count
- ✅ Survey completion triggers plan generation navigation

---

## Known Limitations

1. **No Retry Logic** - Failed LLM calls show error, no auto-retry
   - Story 5 will add retry with exponential backoff

2. **No Caching** - Each conversation starts fresh
   - Story 6 will add response caching

3. **No Rate Limiting** - Unlimited OpenAI API calls
   - Story 6 will add rate limiting

4. **Basic Error Messages** - Generic error text
   - Story 5 will improve error UX

5. **No Once UI Integration Yet** - Using native HTML elements
   - Could integrate Once UI components later if needed

---

## Story 3 Ready to Begin

**Next Developer:** Start with RAG backend implementation.

**Context:** User has completed 3-exchange survey. Survey data is stored in sessionStorage and includes neighbourhood, crime types, and user context Q&A pairs.

**First Task:** Create `lib/rag/workflow.ts` with LangGraph state graph implementing retrieve → analyze → generate pattern.

**Key Requirement:** Must connect to existing Pinecone index with Toronto Police Service safety resources.
