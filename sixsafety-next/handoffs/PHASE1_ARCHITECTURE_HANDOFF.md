# Phase 1: Architecture Handoff Document

**Project:** SixSafety Redesign - Conversational Interface
**Date:** November 6, 2025
**Architect:** Claude (Architecture Specialist)
**Target:** Transform form-wizard survey into conversational chat interface

---

## Executive Summary

This document outlines the architecture for transforming the current SixSafety form-wizard pattern into a conversational chat interface that matches the reference demo. The redesign requires fundamental changes to the component hierarchy, state management, and UI patterns while maintaining existing API integrations.

**Key Architectural Shift:**
- **Current:** Form wizard with page replacements (exchange-based)
- **Target:** Conversational chat with progressive disclosure (scroll-based)

---

## 1. Component Architecture

### 1.1 Current vs. Target Component Hierarchy

#### Current Architecture
```
HomePage
  └─ NeighbourhoodSelect

SurveyPage
  ├─ ConversationView (raw markdown text)
  └─ DynamicForm (replaces on each exchange)

PlanPage
  └─ SafetyPlanDisplay
```

#### Target Architecture
```
HomePage (Redesigned)
  ├─ BrandedHeader (Toronto Police badge, QR code)
  ├─ NeighbourhoodSelector (styled dropdown)
  ├─ CrimeRiskNotification (shield icon + natural language)
  └─ ActionButtons (Submit, Restart Session)

SurveyPage (Redesigned)
  ├─ ConversationalContainer
  │   ├─ ConversationMessage[] (array of message components)
  │   │   ├─ AssistantMessage (question text, markdown-rendered)
  │   │   ├─ UserResponseEcho (red notification box)
  │   │   └─ SectionHeader (icon + title)
  │   ├─ ActiveQuestionCard
  │   │   ├─ CrimeTypeSelector (multi-select tags)
  │   │   └─ InlineFormElements (styled inputs)
  │   └─ RealTimeSummary (shield icon + dynamic text)
  └─ RunningIndicator (top-right "RUNNING... Stop")

PlanPage (No Changes)
  └─ SafetyPlanDisplay
```

### 1.2 New Components to Create

#### `/components/HomePage/BrandedHeader.tsx`
**Purpose:** Display Toronto Police Services branding and QR code
**Props:**
```typescript
interface BrandedHeaderProps {
  className?: string;
}
```
**Responsibilities:**
- Display Toronto Police Services badge/logo (centered)
- Show QR code on left sidebar with "Try it Yourself!" text
- Maintain navy blue branded background (#1e3a5f or similar)

---

#### `/components/HomePage/NeighbourhoodSelector.tsx`
**Purpose:** Styled neighbourhood selection matching reference design
**Props:**
```typescript
interface NeighbourhoodSelectorProps {
  neighbourhoods: string[];
  selected: string;
  onSelect: (neighbourhood: string, stats: NeighbourhoodStats) => void;
  loading?: boolean;
}
```
**Responsibilities:**
- Custom-styled dropdown (not plain HTML select)
- Display neighbourhood name with count in parentheses
- Integrate with existing CSV data loader
- Show "Find Your Neighbourhood" link

**Key Difference from Current:**
- Replace plain HTML `<select>` with styled component
- Show neighbourhood count: "Agincourt North (129)"

---

#### `/components/HomePage/CrimeRiskNotification.tsx`
**Purpose:** Display crime risk information in natural language
**Props:**
```typescript
interface CrimeRiskNotificationProps {
  neighbourhood: string;
  crimes: Array<{ type: string; risk: string }>;
}
```
**Responsibilities:**
- Render styled notification box with shield icon
- Convert crime array to natural language:
  - "In the Annex neighbourhood, you're facing high risks for Assault, Break and Enter, and Robbery, with a lower risk for Auto Theft."
- Orange/amber background with shield icon

**Example Implementation:**
```typescript
const formatCrimeMessage = (neighbourhood: string, crimes: Crime[]) => {
  const highRisks = crimes.filter(c => c.risk === 'High').map(c => c.type);
  const mediumRisks = crimes.filter(c => c.risk === 'Medium').map(c => c.type);
  const lowRisks = crimes.filter(c => c.risk === 'Low').map(c => c.type);

  let message = `In the ${neighbourhood} neighbourhood, you're facing `;

  if (highRisks.length > 0) {
    message += `high risks for ${highRisks.join(', ')}`;
  }
  // ... continue formatting logic

  return message;
};
```

---

#### `/components/Survey/ConversationalContainer.tsx`
**Purpose:** Main container for conversational scroll interface
**Props:**
```typescript
interface ConversationalContainerProps {
  messages: ConversationMessage[];
  activeQuestion: UISchemaType | null;
  onSubmit: (values: SurveyResponse) => void;
  isLoading: boolean;
  summary?: string;
}

interface ConversationMessage {
  id: string;
  type: 'assistant' | 'user-response' | 'section-header';
  content: string;
  timestamp: Date;
}
```
**Responsibilities:**
- Manage scroll behavior (auto-scroll to bottom on new content)
- Render all conversation history in order
- Display active question card at bottom
- Show real-time summary after responses
- Maintain conversation state visually

**Key Features:**
- Progressive disclosure: append new content, never replace
- Smooth scroll animation when new content appears
- Maintain scroll position when user scrolls up to review

---

#### `/components/Survey/AssistantMessage.tsx`
**Purpose:** Display AI assistant questions with proper markdown rendering
**Props:**
```typescript
interface AssistantMessageProps {
  content: string;
  isInitial?: boolean;
}
```
**Responsibilities:**
- Render markdown content using `react-markdown`
- Style with proper typography (headings, lists, bold)
- Support inline questions
- No chat bubble - just styled text content

**Dependencies:**
```bash
# Already installed in package.json
react-markdown: ^9.0.1
remark-gfm: ^4.0.0
rehype-raw: ^7.0.0
```

**Example Implementation:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function AssistantMessage({ content }: AssistantMessageProps) {
  return (
    <div className="prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

---

#### `/components/Survey/UserResponseEcho.tsx`
**Purpose:** Display user's response in red notification box
**Props:**
```typescript
interface UserResponseEchoProps {
  responses: SurveyResponse;
  questionLabels: string[];
}
```
**Responsibilities:**
- Format responses as: "Question: Answer; Question: Answer;"
- Display in red/pink notification box with icon
- Show after form submission
- Format arrays properly: `['Auto Theft', 'Robbery']`

**Reference Format:**
```
What level of security monitoring do you prefer?: Moderate - Alarm and Camera;
Select crime types you are concerned about:: ['Auto Theft', 'Robbery'];
Would you consider neighborhood watch participation?: True;
```

**Styling:**
- Red/pink background (#fee2e2 or similar)
- Red border (#fca5a5)
- Icon on left (info or alert icon)
- Compact text formatting

---

#### `/components/Survey/SectionHeader.tsx`
**Purpose:** Display conversation stage headers with icons
**Props:**
```typescript
interface SectionHeaderProps {
  title: string;
  icon?: 'shield' | 'security' | 'home' | 'community';
}
```
**Responsibilities:**
- Render section title with icon
- Separate conversation stages visually
- Examples: "Enhancing Safety and Security", "Security Enhancements Preferences"

**Styling:**
- Orange shield icon on left
- Bold text
- Margin/padding for visual separation

---

#### `/components/Survey/CrimeTypeSelector.tsx`
**Purpose:** Multi-select tag interface for crime types
**Props:**
```typescript
interface CrimeTypeSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}
```
**Responsibilities:**
- Display available crime types as options
- Show selected items as removable orange pills/tags
- Each tag has an × button to remove
- Dropdown or button interface to add new selections

**Example UI:**
```
Select crime types you are concerned about:
[Auto Theft ×] [Robbery ×] [+ Add crime type ▼]
```

**Styling:**
- Orange background for tags (#f97316 or similar)
- White text
- × icon on right side of each tag
- Rounded pill shape

**Implementation Approach:**
```typescript
// Custom component or use a library like react-select with custom styling
// Recommended: Custom implementation for full control
```

---

#### `/components/Survey/InlineFormElements.tsx`
**Purpose:** Styled form elements (checkboxes, radios) inline with questions
**Props:**
```typescript
interface InlineFormElementsProps {
  elements: UIElement[];
  values: SurveyResponse;
  onChange: (updates: Partial<SurveyResponse>) => void;
  disabled?: boolean;
}
```
**Responsibilities:**
- Render form elements inline with question text
- Custom-styled checkboxes with orange check marks
- Custom-styled radio buttons with orange selection
- Remove separation between "conversation" and "form"

**Key Features:**
- Checkbox: Orange checkmark, rounded square
- Radio: Orange filled circle when selected
- Consistent with brand colors

---

#### `/components/Survey/RealTimeSummary.tsx`
**Purpose:** Display dynamic summary of user responses
**Props:**
```typescript
interface RealTimeSummaryProps {
  summary: string;
  visible: boolean;
}
```
**Responsibilities:**
- Show shield icon with summary text
- Update after each submission
- Appear/disappear with smooth animation
- Positioned at bottom of conversation

**Example Summary:**
```
"You prefer moderate security monitoring with alarms and cameras,
are concerned about Auto Theft and Robbery, and are interested
in participating in a neighborhood watch."
```

**Styling:**
- Shield icon on left
- Light background
- Italic or slightly smaller text
- Fade-in animation

---

#### `/components/Survey/RunningIndicator.tsx`
**Purpose:** Show "RUNNING... Stop" indicator during processing
**Props:**
```typescript
interface RunningIndicatorProps {
  isRunning: boolean;
  onStop?: () => void;
}
```
**Responsibilities:**
- Display in top-right corner
- Show animated "running" state
- Provide stop button (optional functionality)

**Styling:**
- Top-right fixed position
- Animated runner icon or pulse
- "Stop" button next to indicator

---

### 1.3 Components to Modify

#### `/components/DynamicForm.tsx`
**Changes Needed:**
1. Remove form container styling (will be embedded inline)
2. Break into individual form element components
3. Support inline rendering mode
4. Add CrimeTypeSelector integration for specific question types

**Recommended Approach:**
- Refactor into smaller components
- Move styling to parent (ActiveQuestionCard)
- Support both current and new rendering modes during transition

---

#### `/components/ConversationView.tsx`
**Changes Needed:**
1. Remove current chat bubble UI
2. Integrate markdown rendering for assistant messages
3. Support multiple message types (assistant, user-echo, section-header)
4. Add scroll management

**New Structure:**
```typescript
export function ConversationView({ messages }: ConversationViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new message added
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages.length]);

  return (
    <div ref={scrollRef} className="conversation-container">
      {messages.map((msg, idx) => {
        switch (msg.type) {
          case 'assistant':
            return <AssistantMessage key={idx} content={msg.content} />;
          case 'user-response':
            return <UserResponseEcho key={idx} {...msg} />;
          case 'section-header':
            return <SectionHeader key={idx} title={msg.content} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
```

---

#### `/components/NeighbourhoodSelect.tsx`
**Changes Needed:**
1. Extract logic into custom hook: `useNeighbourhoodData()`
2. Create separate presentational components for home vs. survey use
3. Format display to include neighbourhood count

---

### 1.4 Components to Keep As-Is

These components work correctly and don't need changes:

- `/components/SafetyPlanDisplay.tsx` - Final plan display
- `/components/Toast.tsx` - Toast notifications
- `/app/plan/page.tsx` - Plan generation page

---

## 2. State Management Plan

### 2.1 Current SurveyContext Issues

The current context uses an **exchange-based model** that needs to shift to a **message-based model**.

**Current State:**
```typescript
interface SurveyState {
  neighbourhood: NeighbourhoodStats | null;
  conversationHistory: Message[];          // ← Used for API, not UI
  currentSchema: UISchemaType | null;      // ← Replaced on each exchange
  exchangeCount: number;                   // ← Limits to 3 exchanges
  responses: SurveyResponse[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;
}
```

**Issues:**
1. `conversationHistory` stores raw API messages, not UI-renderable content
2. `currentSchema` replacement causes page jumps
3. No tracking of section headers or response echoes
4. No summary generation state

### 2.2 Redesigned SurveyContext

**New State Structure:**
```typescript
interface SurveyState {
  // Existing (keep)
  neighbourhood: NeighbourhoodStats | null;
  exchangeCount: number;
  responses: SurveyResponse[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;

  // New fields
  conversationMessages: ConversationMessage[];  // UI-renderable messages
  activeQuestion: UISchemaType | null;          // Current question (not in history)
  currentSummary: string | null;                // Real-time summary text
  apiHistory: Message[];                        // Raw API conversation (renamed)

  // Section tracking
  currentSection: string | null;                // "Enhancing Safety and Security"
  sectionHistory: string[];                     // Track section progression
}

interface ConversationMessage {
  id: string;
  type: 'assistant' | 'user-response' | 'section-header';
  content: string | SurveyResponse;
  timestamp: Date;
  metadata?: {
    sectionTitle?: string;
    questionLabels?: string[];
  };
}
```

### 2.3 New Context Methods

```typescript
interface SurveyContextType {
  // Existing (keep)
  state: SurveyState;
  setNeighbourhood: (neighbourhood: NeighbourhoodStats) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Modified
  addResponse: (response: SurveyResponse) => void;
  incrementExchange: () => void;
  markComplete: () => void;

  // New methods
  addConversationMessage: (message: ConversationMessage) => void;
  addSectionHeader: (title: string) => void;
  addUserResponseEcho: (response: SurveyResponse, labels: string[]) => void;
  setActiveQuestion: (schema: UISchemaType | null) => void;
  updateSummary: (summary: string) => void;
  addApiMessage: (message: Message) => void;  // Renamed from addMessage
}
```

### 2.4 State Update Patterns

#### Pattern 1: Initial Question Load
```typescript
async function startConversation(neighbourhood: NeighbourhoodStats) {
  setLoading(true);

  // 1. Generate conversation
  const convResult = await generateConversation(initialInput, []);

  // 2. Add to API history
  addApiMessage({ role: 'assistant', content: convResult.content });

  // 3. Add assistant message to UI
  addConversationMessage({
    id: generateId(),
    type: 'assistant',
    content: convResult.content,
    timestamp: new Date()
  });

  // 4. Generate UI schema
  const uiResult = await generateUISchema(convResult.content, 1);

  // 5. Set as active question (not in conversation history)
  setActiveQuestion(uiResult.schema);

  setLoading(false);
}
```

#### Pattern 2: Form Submission & Next Question
```typescript
async function handleFormSubmit(values: SurveyResponse) {
  setLoading(true);

  // 1. Save response to state
  addResponse(values);

  // 2. Add response echo to conversation
  addUserResponseEcho(values, getCurrentQuestionLabels());

  // 3. Add to API history
  const userResponseText = formatResponseForAPI(values);
  addApiMessage({ role: 'user', content: userResponseText });

  // 4. Generate summary
  const summary = await generateSummary(state.responses.concat(values));
  updateSummary(summary);

  // 5. Increment exchange
  incrementExchange();

  // 6. Check if complete
  if (state.exchangeCount + 1 >= MAX_EXCHANGES) {
    markComplete();
    setActiveQuestion(null);
    setLoading(false);
    return;
  }

  // 7. Generate next conversation
  const convResult = await generateConversation(userResponseText, state.apiHistory);

  // 8. Add section header (if provided by AI)
  const sectionTitle = extractSectionTitle(convResult.content);
  if (sectionTitle) {
    addSectionHeader(sectionTitle);
  }

  // 9. Add assistant message to UI
  addConversationMessage({
    id: generateId(),
    type: 'assistant',
    content: convResult.content,
    timestamp: new Date()
  });

  // 10. Generate UI schema
  const uiResult = await generateUISchema(convResult.content, state.exchangeCount + 2);

  // 11. Set as active question
  setActiveQuestion(uiResult.schema);

  setLoading(false);
}
```

### 2.5 Progressive Disclosure Implementation

**Key Principle:** Never remove or replace existing content, only append.

```typescript
// ❌ WRONG (current implementation)
setCurrentSchema(newSchema); // Replaces entire form

// ✅ CORRECT (new implementation)
addConversationMessage(previousQuestionAsMessage);
addUserResponseEcho(userResponse);
addSectionHeader(newSection);
addConversationMessage(newQuestionMessage);
setActiveQuestion(newSchema);
```

---

## 3. Styling System

### 3.1 Design Tokens

Create `/app/design-tokens.css` or extend `globals.css`:

```css
:root {
  /* Brand Colors */
  --color-navy-blue: #1e3a5f;           /* Background */
  --color-navy-dark: #152d47;           /* Darker shade */

  --color-orange-primary: #f97316;      /* Primary action, tags */
  --color-orange-hover: #ea580c;        /* Hover state */

  --color-blue-primary: #3b82f6;        /* Secondary actions */
  --color-blue-hover: #2563eb;          /* Hover state */

  /* Notification Colors */
  --color-red-notification-bg: #fee2e2;
  --color-red-notification-border: #fca5a5;
  --color-red-notification-text: #991b1b;

  --color-amber-notification-bg: #fef3c7;
  --color-amber-notification-border: #fcd34d;
  --color-amber-notification-text: #92400e;

  /* Text */
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-text-white: #ffffff;

  /* Spacing */
  --spacing-xs: 0.25rem;   /* 4px */
  --spacing-sm: 0.5rem;    /* 8px */
  --spacing-md: 1rem;      /* 16px */
  --spacing-lg: 1.5rem;    /* 24px */
  --spacing-xl: 2rem;      /* 32px */
  --spacing-2xl: 3rem;     /* 48px */

  /* Border Radius */
  --radius-sm: 0.375rem;   /* 6px */
  --radius-md: 0.5rem;     /* 8px */
  --radius-lg: 0.75rem;    /* 12px */
  --radius-full: 9999px;   /* Pills */

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

### 3.2 Tailwind Config Extensions

Update `/tailwind.config.ts`:

```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        'navy-blue': {
          DEFAULT: '#1e3a5f',
          dark: '#152d47',
          light: '#2d4a6f',
        },
        'brand-orange': {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          light: '#fb923c',
        },
        'brand-blue': {
          DEFAULT: '#3b82f6',
          hover: '#2563eb',
        },
        // Notification colors
        'notification-red': {
          bg: '#fee2e2',
          border: '#fca5a5',
          text: '#991b1b',
        },
        'notification-amber': {
          bg: '#fef3c7',
          border: '#fcd34d',
          text: '#92400e',
        },
      },
      // Typography for markdown
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#111827',
            p: {
              marginTop: '0.75rem',
              marginBottom: '0.75rem',
            },
            strong: {
              color: '#111827',
              fontWeight: '600',
            },
            ul: {
              marginTop: '0.5rem',
              marginBottom: '0.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),  // Add this for markdown
  ],
};
export default config;
```

**Note:** Need to install `@tailwindcss/typography`:
```bash
npm install -D @tailwindcss/typography
```

### 3.3 Component Styling Patterns

#### Pattern 1: Notification Boxes
```typescript
// Red notification (user response echo)
<div className="bg-notification-red-bg border-2 border-notification-red-border rounded-lg p-4 flex items-start gap-3">
  <AlertCircle className="w-5 h-5 text-notification-red-text flex-shrink-0 mt-0.5" />
  <p className="text-sm text-notification-red-text">{content}</p>
</div>

// Amber notification (crime risk)
<div className="bg-notification-amber-bg border-2 border-notification-amber-border rounded-lg p-4 flex items-start gap-3">
  <Shield className="w-5 h-5 text-notification-amber-text flex-shrink-0 mt-0.5" />
  <p className="text-sm text-notification-amber-text">{content}</p>
</div>
```

#### Pattern 2: Orange Tag Pills
```typescript
<span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange text-white text-sm font-medium rounded-full">
  {label}
  <button
    onClick={onRemove}
    className="hover:bg-brand-orange-hover rounded-full p-0.5 transition-colors"
  >
    <X className="w-3.5 h-3.5" />
  </button>
</span>
```

#### Pattern 3: Primary Button
```typescript
<button className="bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg">
  Submit
</button>
```

#### Pattern 4: Secondary Button
```typescript
<button className="bg-transparent border-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors">
  Restart Session
</button>
```

#### Pattern 5: Custom Checkbox (Orange)
```typescript
// Use custom CSS or Tailwind's arbitrary values
<input
  type="checkbox"
  className="w-5 h-5 rounded border-gray-300 text-brand-orange focus:ring-brand-orange focus:ring-2 focus:ring-offset-0"
/>
```

#### Pattern 6: Custom Radio (Orange)
```typescript
<input
  type="radio"
  className="w-5 h-5 border-gray-300 text-brand-orange focus:ring-brand-orange focus:ring-2"
/>
```

### 3.4 CSS Strategy

**Recommended Approach:** Tailwind-first with component-scoped CSS modules for complex patterns

1. **Tailwind Classes:** Use for 90% of styling
2. **CSS Modules:** Use for complex animations or pseudo-elements
3. **Global CSS:** Only for design tokens and reusable animations

**Example: Conversation scroll container with fade edges**
```css
/* components/Survey/ConversationalContainer.module.css */
.scrollContainer {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  position: relative;
}

.scrollContainer::before {
  content: '';
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(to bottom, white, transparent);
  pointer-events: none;
  z-index: 10;
}

.scrollContainer::after {
  content: '';
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  height: 20px;
  background: linear-gradient(to top, white, transparent);
  pointer-events: none;
  z-index: 10;
}
```

---

## 4. Key Technical Decisions

### 4.1 Markdown Rendering

**Decision:** Use `react-markdown` with `remark-gfm` plugin

**Rationale:**
- Already installed in `package.json`
- Widely used, well-maintained
- Supports GitHub Flavored Markdown (tables, strikethrough, etc.)
- Good TypeScript support
- Allows custom component overrides

**Implementation:**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Optional: customize rendering
    strong: ({node, ...props}) => <span className="font-semibold text-gray-900" {...props} />,
    ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1" {...props} />,
  }}
>
  {markdownContent}
</ReactMarkdown>
```

**Alternatives Considered:**
- `marked` - Less React-friendly
- `remark-react` - More complex setup
- Custom parser - Unnecessary complexity

### 4.2 Multi-Select Tag Component

**Decision:** Custom implementation (not a library)

**Rationale:**
- Simple use case (just crime types, limited options)
- Full control over styling to match brand
- Avoid dependency bloat
- Better accessibility control

**Implementation Pattern:**
```typescript
export function CrimeTypeSelector({ options, selected, onChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const available = options.filter(opt => !selected.includes(opt));

  return (
    <div className="space-y-2">
      {/* Selected tags */}
      <div className="flex flex-wrap gap-2">
        {selected.map(item => (
          <Tag
            key={item}
            label={item}
            onRemove={() => onChange(selected.filter(s => s !== item))}
          />
        ))}

        {/* Add button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="..."
        >
          + Add
        </button>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute bg-white border rounded-lg shadow-lg">
          {available.map(opt => (
            <button
              key={opt}
              onClick={() => {
                onChange([...selected, opt]);
                setIsOpen(false);
              }}
              className="..."
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Alternative Considered:**
- `react-select` - Overkill, harder to style precisely

### 4.3 Scroll Management

**Decision:** Auto-scroll with user override detection

**Strategy:**
```typescript
function useConversationScroll(messages: ConversationMessage[]) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Detect user scroll up
  const handleScroll = () => {
    if (!scrollRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;

    setAutoScroll(isAtBottom);
  };

  // Auto-scroll on new messages (if enabled)
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length, autoScroll]);

  return { scrollRef, handleScroll };
}
```

**Features:**
- Auto-scroll to new content by default
- Detect when user scrolls up to review
- Disable auto-scroll when reviewing
- Re-enable when user scrolls back to bottom

### 4.4 Icon Library

**Decision:** Use Lucide React

**Rationale:**
- Lightweight, tree-shakeable
- Consistent design language
- Excellent TypeScript support
- Easy to customize size and color

**Installation:**
```bash
npm install lucide-react
```

**Icons Needed:**
```typescript
import {
  Shield,        // Crime notification, summary
  AlertCircle,   // User response echo
  Home,          // Section headers
  Lock,          // Security section
  Users,         // Community section
  X,             // Remove tags
  ChevronDown,   // Dropdowns
  Play,          // Running indicator (or Loader2 with spin)
} from 'lucide-react';
```

**Alternative Considered:**
- Heroicons - Also good, slightly different style
- React Icons - Larger bundle

### 4.5 QR Code Generation

**Decision:** Use `qrcode.react`

**Installation:**
```bash
npm install qrcode.react
npm install -D @types/qrcode.react
```

**Usage:**
```typescript
import { QRCodeSVG } from 'qrcode.react';

<QRCodeSVG
  value={window.location.origin}
  size={180}
  level="H"
  includeMargin={true}
/>
```

---

## 5. File Structure Recommendations

### 5.1 New Directory Structure

```
/Users/allan/Documents/Projects/SixSafety/sixsafety-next/
├── app/
│   ├── globals.css                        # (modify) Add design tokens
│   ├── layout.tsx                         # (keep)
│   ├── page.tsx                          # (REDESIGN) Home page
│   ├── survey/
│   │   └── page.tsx                      # (REDESIGN) Survey page
│   └── plan/
│       └── page.tsx                      # (keep)
│
├── components/
│   ├── HomePage/                         # (NEW DIRECTORY)
│   │   ├── BrandedHeader.tsx            # (NEW)
│   │   ├── NeighbourhoodSelector.tsx   # (NEW)
│   │   ├── CrimeRiskNotification.tsx   # (NEW)
│   │   └── ActionButtons.tsx           # (NEW)
│   │
│   ├── Survey/                          # (NEW DIRECTORY)
│   │   ├── ConversationalContainer.tsx  # (NEW)
│   │   ├── AssistantMessage.tsx        # (NEW)
│   │   ├── UserResponseEcho.tsx        # (NEW)
│   │   ├── SectionHeader.tsx           # (NEW)
│   │   ├── CrimeTypeSelector.tsx       # (NEW)
│   │   ├── InlineFormElements.tsx      # (NEW)
│   │   ├── RealTimeSummary.tsx         # (NEW)
│   │   ├── RunningIndicator.tsx        # (NEW)
│   │   └── ActiveQuestionCard.tsx      # (NEW)
│   │
│   ├── NeighbourhoodSelect.tsx         # (modify or deprecate)
│   ├── DynamicForm.tsx                  # (modify - extract elements)
│   ├── ConversationView.tsx             # (REDESIGN)
│   ├── SafetyPlanDisplay.tsx            # (keep)
│   └── Toast.tsx                        # (keep)
│
├── lib/
│   ├── contexts/
│   │   └── SurveyContext.tsx           # (REDESIGN - new state)
│   ├── hooks/                          # (NEW DIRECTORY)
│   │   ├── useConversationScroll.ts   # (NEW)
│   │   ├── useNeighbourhoodData.ts    # (NEW)
│   │   └── useSummaryGenerator.ts     # (NEW)
│   ├── utils/
│   │   ├── csv-loader.ts              # (keep)
│   │   ├── formatters.ts              # (NEW - crime message, responses)
│   │   └── id-generator.ts            # (NEW - message IDs)
│   ├── actions.ts                      # (keep)
│   └── schemas/
│       └── ui-schema.ts                # (keep)
│
├── public/
│   ├── toronto-police-badge.svg        # (NEW - add badge asset)
│   └── ...
│
└── handoffs/
    └── PHASE1_ARCHITECTURE_HANDOFF.md  # (THIS FILE)
```

### 5.2 Files to Create (Priority Order)

**Phase 2 (Home Page):**
1. `/components/HomePage/BrandedHeader.tsx`
2. `/components/HomePage/NeighbourhoodSelector.tsx`
3. `/components/HomePage/CrimeRiskNotification.tsx`
4. `/components/HomePage/ActionButtons.tsx`
5. `/lib/utils/formatters.ts`
6. `/lib/hooks/useNeighbourhoodData.ts`
7. `/public/toronto-police-badge.svg` (asset)

**Phase 3 (Survey Page):**
1. `/lib/contexts/SurveyContext.tsx` (redesign)
2. `/components/Survey/ConversationalContainer.tsx`
3. `/components/Survey/AssistantMessage.tsx`
4. `/components/Survey/UserResponseEcho.tsx`
5. `/components/Survey/SectionHeader.tsx`
6. `/components/Survey/CrimeTypeSelector.tsx`
7. `/components/Survey/InlineFormElements.tsx`
8. `/components/Survey/RealTimeSummary.tsx`
9. `/components/Survey/RunningIndicator.tsx`
10. `/components/Survey/ActiveQuestionCard.tsx`
11. `/lib/hooks/useConversationScroll.ts`
12. `/lib/hooks/useSummaryGenerator.ts`
13. `/lib/utils/id-generator.ts`

### 5.3 Files to Modify

1. `/app/page.tsx` - Complete redesign using new HomePage components
2. `/app/survey/page.tsx` - Complete redesign using new Survey components
3. `/app/globals.css` - Add design tokens
4. `/tailwind.config.ts` - Add brand colors and typography
5. `/components/ConversationView.tsx` - Redesign for message types
6. `/components/DynamicForm.tsx` - Extract to smaller components
7. `/package.json` - Add new dependencies

### 5.4 Files to Keep As-Is

1. `/app/plan/page.tsx`
2. `/components/SafetyPlanDisplay.tsx`
3. `/components/Toast.tsx`
4. `/lib/actions.ts`
5. `/lib/schemas/ui-schema.ts`
6. `/lib/utils/csv-loader.ts`
7. All API-related files

---

## 6. Integration Points

### 6.1 Home Page → Survey Page

**Current Flow:**
```typescript
// app/page.tsx
sessionStorage.setItem('neighbourhood', JSON.stringify(neighbourhoodStats));
router.push('/survey');

// app/survey/page.tsx
const storedData = sessionStorage.getItem('neighbourhood');
const neighbourhood = JSON.parse(storedData);
```

**New Flow (Same):**
- Keep sessionStorage approach
- No changes needed to integration
- Just update visual presentation

**Data Contract:**
```typescript
interface NeighbourhoodStats {
  neighbourhood: string;
  crimes: Array<{
    type: string;
    risk: 'High' | 'Medium' | 'Low';
  }>;
}
```

### 6.2 Survey Page → API Integration

**Current API Calls:**
1. `generateConversation(input, history)` - Get AI response
2. `generateUISchema(content, exchangeNumber)` - Get form schema

**New Flow (Enhanced):**
```typescript
// 1. Initial load
const convResult = await generateConversation(neighbourhoodInput, []);
const uiResult = await generateUISchema(convResult.content, 1);

// 2. After each submission
const userResponse = formatResponseForAPI(values);
const convResult = await generateConversation(userResponse, apiHistory);

// Extract section title from AI response (if present)
const sectionTitle = extractSectionTitle(convResult.content);

const uiResult = await generateUISchema(convResult.content, exchangeNumber);

// 3. Generate summary (NEW)
const summary = await generateSummary(allResponses);
```

**New API Helper (Optional):**
```typescript
// lib/actions.ts
export async function generateSummary(responses: SurveyResponse[]): Promise<string> {
  // Call AI to generate natural language summary
  // "You prefer moderate security monitoring..."

  // Could be:
  // - Simple template-based formatting
  // - AI-generated via OpenAI
  // - Extracted from conversation history
}
```

**API Contract (Unchanged):**
- Keep existing `generateConversation` signature
- Keep existing `generateUISchema` signature
- Add optional `generateSummary` helper

### 6.3 Survey Page → Plan Generation

**Current Flow:**
```typescript
// app/survey/page.tsx
const surveyData = {
  neighbourhood: state.neighbourhood?.neighbourhood || "",
  crime_types: state.neighbourhood?.crimes.map(c => `${c.type}: ${c.risk}`) || [],
  user_context: state.responses.flatMap(/* ... */)
};
sessionStorage.setItem('surveyData', JSON.stringify(surveyData));
router.push('/plan');
```

**New Flow (Same):**
- Keep sessionStorage approach
- Same data structure
- No changes needed

**Data Contract (Unchanged):**
```typescript
interface SurveyData {
  neighbourhood: string;
  crime_types: string[];
  user_context: string[];
}
```

### 6.4 Section Title Extraction

**Challenge:** AI response might include section headers we need to extract

**Solution 1: AI Convention**
Ask AI to prefix sections with marker:
```
[SECTION: Enhancing Safety and Security]

Regular question text here...
```

**Solution 2: Pattern Matching**
```typescript
function extractSectionTitle(content: string): string | null {
  const match = content.match(/\[SECTION:\s*(.+?)\]/);
  return match ? match[1] : null;
}

function removeSectionMarker(content: string): string {
  return content.replace(/\[SECTION:\s*.+?\]\n*/g, '');
}
```

**Recommendation:** Use Solution 2 (pattern matching) for flexibility

---

## 7. Requirements for Next Phase (Phase 2: Home Page)

### 7.1 What Phase 2 Agent Needs to Know

**Objective:** Implement the redesigned home page matching the reference demo

**Key Files to Work On:**
1. `/app/page.tsx` - Main home page
2. `/components/HomePage/BrandedHeader.tsx` - Create new
3. `/components/HomePage/NeighbourhoodSelector.tsx` - Create new
4. `/components/HomePage/CrimeRiskNotification.tsx` - Create new
5. `/components/HomePage/ActionButtons.tsx` - Create new
6. `/lib/utils/formatters.ts` - Create new (crime message formatter)
7. `/lib/hooks/useNeighbourhoodData.ts` - Create new
8. `/app/globals.css` - Add design tokens
9. `/tailwind.config.ts` - Add brand colors

**Dependencies to Install:**
```bash
npm install lucide-react qrcode.react
npm install -D @types/qrcode.react @tailwindcss/typography
```

**Assets Needed:**
- Toronto Police Services badge (SVG or PNG)
  - Source: Official TPS website or provide placeholder
  - Save to `/public/toronto-police-badge.svg`

**Design Specifications:**
- **Background:** Navy blue (#1e3a5f)
- **Primary Button:** Orange (#f97316) with hover (#ea580c)
- **Secondary Button:** Blue outline (#3b82f6)
- **QR Code:** Top-left corner, white text "Try it Yourself!"
- **Badge:** Centered at top, above title
- **Dropdown:** Custom-styled (not plain HTML select)
- **Crime Notification:** Amber background with shield icon

**Reference Screenshots:**
- Frame 1: Initial state with neighbourhood selection
- Frame 2: After selection showing crime notification

**Data Flow:**
1. Load neighbourhoods from CSV (existing function)
2. User selects neighbourhood
3. Display crime risk notification with natural language
4. Enable Submit button
5. Store neighbourhood in sessionStorage
6. Navigate to `/survey`

**Functional Requirements:**
- Maintain existing data flow (sessionStorage)
- Preserve navigation to `/survey`
- Keep CSV data loading logic
- Add "Restart Session" button (clears sessionStorage)

**Testing Checklist:**
- [ ] Page loads with navy blue background
- [ ] Toronto Police badge displays correctly
- [ ] QR code appears in top-left
- [ ] Neighbourhood dropdown works
- [ ] Crime notification appears after selection
- [ ] Crime message uses natural language format
- [ ] Submit button navigates to /survey
- [ ] Restart Session button clears state
- [ ] Responsive design (mobile/tablet/desktop)

### 7.2 Handoff to Phase 3 (Survey Page)

After Phase 2 is complete, Phase 3 agent will need:

**Context:**
- Understanding of new state management (SurveyContext redesign)
- Knowledge of conversational pattern (append, not replace)
- Familiarity with markdown rendering setup

**Prerequisites:**
- Phase 2 home page fully functional
- Design tokens established
- Brand colors configured
- Icon library installed

**Key Focus Areas:**
1. SurveyContext redesign (most critical)
2. ConversationalContainer implementation
3. Message type components (Assistant, UserEcho, SectionHeader)
4. CrimeTypeSelector multi-select tags
5. Scroll management and progressive disclosure

---

## 8. Migration Strategy

### 8.1 Phased Approach

**Phase 1:** Architecture & Planning (CURRENT)
- ✅ Document architecture
- ✅ Define components
- ✅ Plan state management
- ✅ Establish styling system

**Phase 2:** Home Page Redesign
- Implement BrandedHeader, NeighbourhoodSelector, etc.
- Add design tokens and brand colors
- Install dependencies
- Test navigation flow

**Phase 3:** Survey Page Redesign
- Redesign SurveyContext
- Implement ConversationalContainer
- Create message components
- Add scroll management
- Test full conversation flow

**Phase 4:** Polish & Testing
- Cross-browser testing
- Mobile responsiveness
- Accessibility audit
- Performance optimization

### 8.2 Backward Compatibility

During development, maintain parallel implementations:

```typescript
// Feature flag approach
const USE_NEW_SURVEY_UI = process.env.NEXT_PUBLIC_NEW_UI === 'true';

export default function SurveyPage() {
  return USE_NEW_SURVEY_UI ? (
    <NewSurveyContent />
  ) : (
    <OldSurveyContent />
  );
}
```

### 8.3 Rollback Plan

If issues arise:
1. Revert to previous commit
2. Toggle feature flag to disable new UI
3. Debug in isolation using Storybook (optional setup)

---

## 9. Testing Strategy

### 9.1 Component Testing

**Key Components to Test:**
- CrimeTypeSelector: Add/remove tags, keyboard navigation
- ConversationalContainer: Scroll behavior, message rendering
- UserResponseEcho: Format various response types
- AssistantMessage: Markdown rendering edge cases

**Example Test:**
```typescript
describe('CrimeTypeSelector', () => {
  it('adds selected crime type as tag', () => {
    const onChange = jest.fn();
    render(<CrimeTypeSelector options={['Assault', 'Robbery']} selected={[]} onChange={onChange} />);

    // Click add button, select option
    // Verify onChange called with new selection
  });

  it('removes tag when X clicked', () => {
    const onChange = jest.fn();
    render(<CrimeTypeSelector selected={['Assault']} onChange={onChange} />);

    // Click X on tag
    // Verify onChange called with empty array
  });
});
```

### 9.2 Integration Testing

**Critical Flows:**
1. Home → Survey → Plan (full journey)
2. Neighbourhood selection → Crime display
3. Form submission → Response echo → Next question
4. Summary generation after each exchange
5. Survey completion → Plan generation

### 9.3 Visual Regression Testing

**Key Screens:**
- Home page (initial state)
- Home page (neighbourhood selected)
- Survey page (first question)
- Survey page (after first submission with echo)
- Survey page (multiple exchanges visible)
- Survey page (completion state)

---

## 10. Performance Considerations

### 10.1 Optimization Strategies

**Markdown Rendering:**
- Memoize ReactMarkdown component
- Use `React.memo()` for AssistantMessage

**Scroll Performance:**
- Use `useCallback` for scroll handlers
- Debounce scroll position detection
- Virtual scrolling for very long conversations (future)

**State Updates:**
- Batch state updates where possible
- Use `useReducer` for complex state logic (consider for SurveyContext)

**Example:**
```typescript
const AssistantMessage = React.memo(({ content }: Props) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </ReactMarkdown>
  );
});
```

### 10.2 Bundle Size

**Monitor:**
- Markdown libraries add ~50KB
- Icon library (Lucide) is tree-shakeable
- QR code library adds ~20KB

**Strategy:**
- Code-split Survey components (lazy load)
- Ensure proper tree-shaking

---

## 11. Accessibility Considerations

### 11.1 Key Requirements

**Keyboard Navigation:**
- Tab through form elements
- Enter to submit
- Escape to close dropdowns
- Arrow keys in multi-select

**Screen Readers:**
- Proper ARIA labels on custom components
- Live regions for dynamic content (new messages)
- Semantic HTML (headings, lists, etc.)

**Focus Management:**
- Auto-focus on active question after scroll
- Visible focus indicators
- Focus trap in dropdowns

**Example:**
```typescript
<div
  role="log"
  aria-live="polite"
  aria-atomic="false"
  className="conversation-container"
>
  {messages.map(msg => (
    <div role="article" aria-label={`${msg.type} message`}>
      {/* Message content */}
    </div>
  ))}
</div>
```

### 11.2 Color Contrast

Ensure WCAG AA compliance:
- Orange on white: 4.5:1 minimum
- Navy blue text on white: 4.5:1 minimum
- White text on navy blue: 4.5:1 minimum

**Tool:** Use contrast checker during development

---

## 12. Open Questions & Risks

### 12.1 Open Questions

1. **Toronto Police Badge Asset:**
   - Do we have official approval to use the badge?
   - Where to obtain high-quality SVG/PNG?

2. **Summary Generation:**
   - Should summaries be AI-generated or template-based?
   - Do summaries update after each exchange or just at the end?

3. **Section Headers:**
   - Does AI reliably provide section titles?
   - Fallback if no section title provided?

4. **"Stop" Button Functionality:**
   - Should it actually stop the AI request?
   - Or just visual indicator with no control?

5. **Crime Type Options:**
   - Are crime types fixed (from CSV) or dynamic?
   - Can users add custom crime types?

### 12.2 Risks

**Risk 1: Markdown Complexity**
- AI might generate markdown that breaks layout
- **Mitigation:** Test with various markdown samples, add CSS constraints

**Risk 2: State Management Complexity**
- New state structure more complex than current
- **Mitigation:** Thorough testing, consider useReducer pattern

**Risk 3: Scroll Performance**
- Long conversations might lag
- **Mitigation:** Virtual scrolling if needed, optimize re-renders

**Risk 4: Browser Compatibility**
- Custom form elements might render differently
- **Mitigation:** Test in Chrome, Firefox, Safari, Edge

**Risk 5: API Changes**
- AI responses might not match expected format
- **Mitigation:** Robust parsing, fallback handling

---

## 13. Next Steps

### 13.1 Immediate Actions (Phase 2 Agent)

1. **Install Dependencies:**
   ```bash
   npm install lucide-react qrcode.react
   npm install -D @types/qrcode.react @tailwindcss/typography
   ```

2. **Add Design Tokens:**
   - Update `/app/globals.css` with color variables
   - Update `/tailwind.config.ts` with brand colors

3. **Obtain Assets:**
   - Toronto Police badge (SVG/PNG)
   - Save to `/public/toronto-police-badge.svg`

4. **Create Components:**
   - Start with `BrandedHeader.tsx`
   - Then `NeighbourhoodSelector.tsx`
   - Then `CrimeRiskNotification.tsx`
   - Finally integrate into `/app/page.tsx`

5. **Test Integration:**
   - Verify neighbourhood selection works
   - Test navigation to survey page
   - Confirm sessionStorage data flow

### 13.2 Future Phases

**Phase 3 (Survey Page):**
- Implement new SurveyContext
- Build ConversationalContainer
- Create message components
- Add scroll management

**Phase 4 (Polish):**
- Accessibility audit
- Performance optimization
- Cross-browser testing
- Mobile responsiveness

---

## 14. Conclusion

This architecture document provides a complete blueprint for transforming the SixSafety application from a form-wizard pattern to a conversational chat interface. The redesign maintains all existing API integrations and data flows while dramatically improving the user experience to match the reference demo.

**Key Success Factors:**
1. Progressive disclosure pattern (append, never replace)
2. Proper markdown rendering for AI responses
3. Visual feedback through response echoes and summaries
4. Consistent brand styling (navy blue, orange accents)
5. Smooth scroll management

**Critical Path:**
- Phase 2: Home page redesign (establishes design system)
- Phase 3: Survey page redesign (implements conversational pattern)
- Phase 4: Testing and polish

The architecture is designed to be implemented incrementally while maintaining the ability to rollback if needed. Each phase builds on the previous one, with clear handoff points and success criteria.

---

## Appendix A: Code Examples

### A.1 Complete SurveyContext Implementation

```typescript
"use client";

import { createContext, useContext, useReducer, ReactNode } from "react";
import type { Message } from "@/lib/actions";
import type { UISchemaType, SurveyResponse } from "@/lib/schemas/ui-schema";
import type { NeighbourhoodStats } from "@/lib/utils/csv-loader";

// State types
interface ConversationMessage {
  id: string;
  type: 'assistant' | 'user-response' | 'section-header';
  content: string | SurveyResponse;
  timestamp: Date;
  metadata?: {
    sectionTitle?: string;
    questionLabels?: string[];
  };
}

interface SurveyState {
  neighbourhood: NeighbourhoodStats | null;
  exchangeCount: number;
  responses: SurveyResponse[];
  isComplete: boolean;
  isLoading: boolean;
  error: string | null;

  conversationMessages: ConversationMessage[];
  activeQuestion: UISchemaType | null;
  currentSummary: string | null;
  apiHistory: Message[];
  currentSection: string | null;
  sectionHistory: string[];
}

// Action types
type SurveyAction =
  | { type: 'SET_NEIGHBOURHOOD'; payload: NeighbourhoodStats }
  | { type: 'ADD_CONVERSATION_MESSAGE'; payload: ConversationMessage }
  | { type: 'ADD_SECTION_HEADER'; payload: string }
  | { type: 'ADD_USER_RESPONSE_ECHO'; payload: { response: SurveyResponse; labels: string[] } }
  | { type: 'SET_ACTIVE_QUESTION'; payload: UISchemaType | null }
  | { type: 'UPDATE_SUMMARY'; payload: string }
  | { type: 'ADD_API_MESSAGE'; payload: Message }
  | { type: 'ADD_RESPONSE'; payload: SurveyResponse }
  | { type: 'INCREMENT_EXCHANGE' }
  | { type: 'MARK_COMPLETE' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET' };

// Initial state
const initialState: SurveyState = {
  neighbourhood: null,
  exchangeCount: 0,
  responses: [],
  isComplete: false,
  isLoading: false,
  error: null,
  conversationMessages: [],
  activeQuestion: null,
  currentSummary: null,
  apiHistory: [],
  currentSection: null,
  sectionHistory: [],
};

// Reducer
function surveyReducer(state: SurveyState, action: SurveyAction): SurveyState {
  switch (action.type) {
    case 'SET_NEIGHBOURHOOD':
      return { ...state, neighbourhood: action.payload };

    case 'ADD_CONVERSATION_MESSAGE':
      return {
        ...state,
        conversationMessages: [...state.conversationMessages, action.payload]
      };

    case 'ADD_SECTION_HEADER':
      return {
        ...state,
        currentSection: action.payload,
        sectionHistory: [...state.sectionHistory, action.payload],
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: `section-${Date.now()}`,
            type: 'section-header',
            content: action.payload,
            timestamp: new Date(),
          }
        ]
      };

    case 'ADD_USER_RESPONSE_ECHO':
      return {
        ...state,
        conversationMessages: [
          ...state.conversationMessages,
          {
            id: `echo-${Date.now()}`,
            type: 'user-response',
            content: action.payload.response,
            timestamp: new Date(),
            metadata: { questionLabels: action.payload.labels }
          }
        ]
      };

    case 'SET_ACTIVE_QUESTION':
      return { ...state, activeQuestion: action.payload };

    case 'UPDATE_SUMMARY':
      return { ...state, currentSummary: action.payload };

    case 'ADD_API_MESSAGE':
      return {
        ...state,
        apiHistory: [...state.apiHistory, action.payload]
      };

    case 'ADD_RESPONSE':
      return {
        ...state,
        responses: [...state.responses, action.payload]
      };

    case 'INCREMENT_EXCHANGE':
      return { ...state, exchangeCount: state.exchangeCount + 1 };

    case 'MARK_COMPLETE':
      return { ...state, isComplete: true };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

// Context type
interface SurveyContextType {
  state: SurveyState;
  setNeighbourhood: (neighbourhood: NeighbourhoodStats) => void;
  addConversationMessage: (message: ConversationMessage) => void;
  addSectionHeader: (title: string) => void;
  addUserResponseEcho: (response: SurveyResponse, labels: string[]) => void;
  setActiveQuestion: (schema: UISchemaType | null) => void;
  updateSummary: (summary: string) => void;
  addApiMessage: (message: Message) => void;
  addResponse: (response: SurveyResponse) => void;
  incrementExchange: () => void;
  markComplete: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const SurveyContext = createContext<SurveyContextType | undefined>(undefined);

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(surveyReducer, initialState);

  const contextValue: SurveyContextType = {
    state,
    setNeighbourhood: (neighbourhood) =>
      dispatch({ type: 'SET_NEIGHBOURHOOD', payload: neighbourhood }),
    addConversationMessage: (message) =>
      dispatch({ type: 'ADD_CONVERSATION_MESSAGE', payload: message }),
    addSectionHeader: (title) =>
      dispatch({ type: 'ADD_SECTION_HEADER', payload: title }),
    addUserResponseEcho: (response, labels) =>
      dispatch({ type: 'ADD_USER_RESPONSE_ECHO', payload: { response, labels } }),
    setActiveQuestion: (schema) =>
      dispatch({ type: 'SET_ACTIVE_QUESTION', payload: schema }),
    updateSummary: (summary) =>
      dispatch({ type: 'UPDATE_SUMMARY', payload: summary }),
    addApiMessage: (message) =>
      dispatch({ type: 'ADD_API_MESSAGE', payload: message }),
    addResponse: (response) =>
      dispatch({ type: 'ADD_RESPONSE', payload: response }),
    incrementExchange: () =>
      dispatch({ type: 'INCREMENT_EXCHANGE' }),
    markComplete: () =>
      dispatch({ type: 'MARK_COMPLETE' }),
    setLoading: (loading) =>
      dispatch({ type: 'SET_LOADING', payload: loading }),
    setError: (error) =>
      dispatch({ type: 'SET_ERROR', payload: error }),
    reset: () =>
      dispatch({ type: 'RESET' }),
  };

  return (
    <SurveyContext.Provider value={contextValue}>
      {children}
    </SurveyContext.Provider>
  );
}

export function useSurvey() {
  const context = useContext(SurveyContext);
  if (context === undefined) {
    throw new Error("useSurvey must be used within a SurveyProvider");
  }
  return context;
}
```

---

## Appendix B: Utility Functions

### B.1 Crime Message Formatter

```typescript
// lib/utils/formatters.ts

interface Crime {
  type: string;
  risk: 'High' | 'Medium' | 'Low';
}

export function formatCrimeRiskMessage(
  neighbourhood: string,
  crimes: Crime[]
): string {
  const highRisks = crimes.filter(c => c.risk === 'High').map(c => c.type);
  const mediumRisks = crimes.filter(c => c.risk === 'Medium').map(c => c.type);
  const lowRisks = crimes.filter(c => c.risk === 'Low').map(c => c.type);

  let message = `In the ${neighbourhood} neighbourhood, you're facing `;
  const parts: string[] = [];

  if (highRisks.length > 0) {
    parts.push(`high risks for ${formatList(highRisks)}`);
  }

  if (mediumRisks.length > 0) {
    parts.push(`medium risks for ${formatList(mediumRisks)}`);
  }

  if (lowRisks.length > 0) {
    parts.push(`${lowRisks.length > 1 ? 'lower risks' : 'a lower risk'} for ${formatList(lowRisks)}`);
  }

  if (parts.length === 0) {
    return `The ${neighbourhood} neighbourhood has no specific crime risk data available.`;
  }

  // Join parts with proper grammar
  if (parts.length === 1) {
    message += parts[0];
  } else if (parts.length === 2) {
    message += `${parts[0]} and ${parts[1]}`;
  } else {
    const last = parts.pop();
    message += `${parts.join(', ')}, and ${last}`;
  }

  message += '.';
  return message;
}

function formatList(items: string[]): string {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;

  const last = items[items.length - 1];
  const rest = items.slice(0, -1);
  return `${rest.join(', ')}, and ${last}`;
}

export function formatResponseForDisplay(
  response: SurveyResponse,
  labels?: string[]
): string {
  return Object.entries(response)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: [${value.map(v => `'${v}'`).join(', ')}]`;
      }
      return `${key}: ${value}`;
    })
    .join('; ') + ';';
}

export function formatResponseForAPI(response: SurveyResponse): string {
  return Object.entries(response)
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }
      return `${key}: ${value}`;
    })
    .join("; ");
}
```

### B.2 ID Generator

```typescript
// lib/utils/id-generator.ts

let messageIdCounter = 0;

export function generateMessageId(type: string): string {
  messageIdCounter++;
  return `${type}-${Date.now()}-${messageIdCounter}`;
}

export function resetMessageIdCounter(): void {
  messageIdCounter = 0;
}
```

### B.3 Section Title Extraction

```typescript
// lib/utils/section-extractor.ts

export function extractSectionTitle(content: string): string | null {
  // Look for pattern: [SECTION: Title]
  const match = content.match(/\[SECTION:\s*(.+?)\]/);
  return match ? match[1].trim() : null;
}

export function removeSectionMarker(content: string): string {
  return content.replace(/\[SECTION:\s*.+?\]\n*/g, '');
}

export function hasSectionMarker(content: string): boolean {
  return /\[SECTION:\s*.+?\]/.test(content);
}
```

---

## Document Metadata

**Version:** 1.0
**Last Updated:** November 6, 2025
**Author:** Claude (Architecture Specialist)
**Reviewers:** Pending
**Status:** Ready for Phase 2 Handoff

**Change Log:**
- v1.0 (2025-11-06): Initial architecture document created

---

**End of Architecture Handoff Document**
