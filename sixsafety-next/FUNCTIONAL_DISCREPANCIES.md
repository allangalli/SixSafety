# SixSafety - Functional Flow Discrepancies

**Date:** November 6, 2025
**Analysis:** Comparison between reference demo (ideal) vs current implementation

---

## Critical Findings Summary

The current implementation has **fundamental architectural differences** from the intended design. This is not a bug fix—this requires a significant redesign of the survey flow.

**Severity:** 🔴 **CRITICAL** - Core user experience is completely different

---

## 1. HOME PAGE DISCREPANCIES

### Reference (Ideal)
- Dark navy blue branded background
- Toronto Police Services official badge/logo centered at top
- QR code with "Try it Yourself!" on left sidebar
- Orange "Submit" button (primary action)
- Blue "Restart Session" button (secondary action)
- Styled dropdown showing "Agincourt North (129)" with count
- Crime info shown as styled notification with shield icon
- Natural language: "In the Annex neighbourhood, you're facing high risks for Assault, Break and Enter, and Robbery, with a lower risk for Auto Theft."

### Current Implementation
- ❌ Plain gray background
- ❌ No Toronto Police badge
- ❌ No QR code or sidebar
- ❌ Gray "Start Safety Survey →" button
- ❌ No "Restart Session" button
- ❌ Plain HTML select dropdown
- ❌ Crime info shows as text list: "AssaultMedium, Auto TheftLow" (partially fixed with colon)
- ❌ No styled notification box

**Impact:** Brand identity completely missing, unprofessional appearance

---

## 2. SURVEY FLOW ARCHITECTURE - CRITICAL DIFFERENCE

### Reference (Ideal) - **CONVERSATIONAL FLOW**

**Pattern:**
1. User selects crime types via **multi-select tag interface** (removable orange pills)
2. Questions appear **inline** in a chat-like interface
3. After submission, **red notification box echoes user's response**
4. **New section header appears** (e.g., "Enhancing Safety and Security")
5. **New questions added below** existing content
6. Page **scrolls down** showing conversation history
7. Real-time summary updated at bottom with shield icon
8. **Progressive disclosure** - conversation builds up

**Key Features:**
- ✅ Chat-like scrolling interface
- ✅ Previous responses visible as red notification boxes
- ✅ Section headers with icons separate question groups
- ✅ Multi-select crime tags with × to remove
- ✅ Real-time summary updates
- ✅ Smooth progression without page jumps

### Current Implementation - **FORM REPLACEMENT FLOW**

**Pattern:**
1. Giant "Conversation History" text block with raw markdown
2. Questions appear in separate "Understanding Your Routine and Mobility" section
3. After submission, **entire page content is replaced**
4. New form appears with different questions
5. **No visible conversation history** (hidden in collapsed text)
6. **No progressive disclosure** - just form swapping
7. No summary feedback
8. Exchange counter shows progress (1 of 3, 2 of 3, 3 of 3)

**Key Problems:**
- ❌ Conversation history is unformatted markdown text
- ❌ Questions appear twice (once in history, once in form)
- ❌ Full page replacement instead of progressive conversation
- ❌ No visual feedback of previous responses
- ❌ No section headers or conversation structure
- ❌ No real-time summary
- ❌ Confusing UX - users don't know if they should read the wall of text

**Impact:** 🔴 **CRITICAL** - Completely different user experience. Current feels like a broken form wizard, intended is a natural conversation.

---

## 3. QUESTION TYPES & FORM ELEMENTS

### Reference (Ideal)
- ✅ **Multi-select crime tags** - Orange removable pills ("Auto Theft ×", "Robbery ×")
- ✅ **Styled checkboxes** with orange check icons
- ✅ **Radio buttons** with orange selection
- ✅ Questions inline with form elements
- ✅ Clean, minimal design

### Current Implementation
- ❌ No multi-select tag interface
- ❌ Standard HTML checkboxes (unstyled)
- ❌ Standard HTML radio buttons (unstyled)
- ❌ Questions in dynamic form component
- ❌ Generic styling

**Impact:** Missing interactive crime type selector, poor visual consistency

---

## 4. FEEDBACK & RESPONSE ECHO

### Reference (Ideal)
- ✅ **Red notification boxes** echo user responses after submission
- ✅ Format: "What level of security monitoring do you prefer?: Moderate - Alarm and Camera; Select crime types you are concerned about:: ['Auto Theft', 'Robbery']; Would you consider neighborhood watch participation? (Check for Yes, Uncheck for No): True;"
- ✅ Provides clear feedback that response was captured
- ✅ Shows context for next questions

### Current Implementation
- ❌ No visual echo of responses
- ❌ No feedback boxes
- ❌ User responses stored in context but not displayed
- ❌ "Conversation History" text includes responses but unreadable

**Impact:** No confirmation feedback, users uncertain if responses were captured

---

## 5. REAL-TIME SUMMARY

### Reference (Ideal)
- ✅ **Shield icon with summary** appears at bottom after each submission
- ✅ Updates dynamically: "You prefer moderate security monitoring with alarms and cameras, are concerned about Auto Theft and Robbery, and are interested in participating in a neighborhood watch."
- ✅ Provides context and confirmation

### Current Implementation
- ❌ No real-time summary
- ❌ No dynamic feedback
- ❌ Only see final output at end

**Impact:** Users don't see how their answers are being interpreted until the very end

---

## 6. SECTION HEADERS & STRUCTURE

### Reference (Ideal)
- ✅ **Section headers with icons** separate conversation stages
- ✅ Examples: "Enhancing Safety and Security", "Security Enhancements Preferences"
- ✅ Orange shield icons
- ✅ Clear visual hierarchy

### Current Implementation
- ❌ Generic form titles from UI schema
- ❌ No icons
- ❌ No conversation stages
- ❌ Just sequential form replacement

**Impact:** No sense of conversation progression or context

---

## 7. LOADING & PROCESS INDICATORS

### Reference (Ideal)
- ✅ **"RUNNING... Stop" indicator** in top right during AI processing
- ✅ Shows active process
- ✅ Provides stop control

### Current Implementation
- ✅ Spinner with "Generating kick-off question..." (fixed!)
- ❌ No "RUNNING... Stop" indicator
- ❌ No way to cancel/stop process

**Impact:** Minor - loading indication exists but not as sophisticated

---

## 8. MARKDOWN RENDERING

### Reference (Ideal)
- ✅ Markdown properly rendered as clean text
- ✅ Bold text, bullets, numbered lists all formatted
- ✅ Easy to read

### Current Implementation
- ❌ Raw markdown text in "Conversation History"
- ❌ Shows "**text**", "1.", "2." as literal characters
- ❌ Unreadable wall of text

**Impact:** 🔴 **CRITICAL** - Conversation history is unusable

---

## 9. FINAL SAFETY PLAN OUTPUT

### Reference (Ideal)
- ✅ Clean "Your Safety Plan:" header
- ✅ Neighborhood and crime summary
- ✅ "NEIGHBOURHOOD-SPECIFIC ASSESSMENT:" section
- ✅ "TARGETED SAFETY RECOMMENDATIONS:" with numbered items
- ✅ Each recommendation has: Prevention Strategies, Warning Signs, Immediate Actions, Community Resources
- ✅ Properly formatted with bullets and structure

### Current Implementation
- ❓ Need to verify - may be similar if markdown is rendered
- ❓ Previous screenshots showed it wasn't reached due to test issues

**Impact:** Unknown - need to test completion flow

---

## 10. NAVIGATION & STATE MANAGEMENT

### Reference (Ideal)
- ✅ QR code for easy sharing
- ✅ "Restart Session" button always available
- ✅ Smooth scrolling conversation
- ✅ No page transitions

### Current Implementation
- ❌ No QR code
- ❌ No restart functionality
- ❌ Page navigations (/survey route)
- ❌ Form replacement UX

**Impact:** Less user-friendly, no easy session restart

---

## ROOT CAUSE ANALYSIS

### Why Is It So Different?

**Current Architecture:**
1. Uses Next.js routing (`/` → `/survey` → `/plan`)
2. `SurveyContext` manages state with `exchangeCount` (0-2)
3. Each exchange: Generate conversation → Generate UI schema → Render form → Submit → Replace
4. `ConversationView` component shows raw markdown text
5. `DynamicForm` component renders form from schema
6. Page replaces content on each exchange

**Intended Architecture (from reference):**
1. Single-page conversational interface
2. Scroll-based chat UI
3. Progressive disclosure pattern
4. Real-time response echoing
5. Multi-select tag interface for crime types
6. Section headers separate conversation stages
7. No page navigation - all on one page

**Fundamental Mismatch:**
- Current: **Form wizard pattern** with page replacements
- Intended: **Chat/conversation pattern** with progressive disclosure

---

## ARCHITECTURAL CHANGES NEEDED

To match the reference demo, these major changes are required:

### 1. Survey Page Redesign
- [ ] Replace form wizard with chat/conversation UI
- [ ] Implement scrollable conversation container
- [ ] Add response echo boxes (red notifications)
- [ ] Add section headers with icons
- [ ] Implement real-time summary with shield icon
- [ ] Keep all previous content visible while adding new content

### 2. Form Components
- [ ] Create multi-select tag component for crime types
- [ ] Style checkboxes and radio buttons to match design
- [ ] Inline questions with form elements
- [ ] Remove separation between "Conversation History" and form

### 3. Markdown Rendering
- [ ] Implement proper markdown-to-React renderer
- [ ] Format bold, bullets, numbered lists correctly
- [ ] Remove raw markdown display

### 4. Home Page Redesign
- [ ] Implement branded navy blue design
- [ ] Add Toronto Police Services badge
- [ ] Add QR code with "Try it Yourself!"
- [ ] Style dropdown and buttons to match
- [ ] Add "Restart Session" button
- [ ] Create notification box for crime info

### 5. State Management
- [ ] Modify conversation flow to append rather than replace
- [ ] Track response echoes for display
- [ ] Generate section headers dynamically
- [ ] Implement real-time summary generation

---

## PRIORITY ASSESSMENT

### P0 - Critical (Blocks intended UX)
1. 🔴 Survey conversation flow architecture
2. 🔴 Markdown rendering in conversation
3. 🔴 Response echo boxes
4. 🔴 Multi-select crime tag interface

### P1 - High (Significant UX impact)
5. 🟠 Section headers with icons
6. 🟠 Real-time summary feedback
7. 🟠 Home page branding and styling
8. 🟠 Crime info natural language formatting

### P2 - Medium (Nice to have)
9. 🟡 QR code feature
10. 🟡 "Restart Session" button
11. 🟡 "RUNNING... Stop" indicator
12. 🟡 Styled form elements (checkboxes/radio)

---

## RECOMMENDATION

**This is not a bug fix—this is a redesign.**

The current implementation was built with a **form wizard pattern**, but the intended design is a **conversational chat interface**. These are fundamentally different UX patterns.

**Options:**

1. **Full Redesign (Recommended)** - Rebuild survey page to match reference demo
   - Estimated effort: 3-5 days
   - Matches original vision
   - Better UX

2. **Hybrid Approach** - Keep current architecture but improve presentation
   - Render markdown properly
   - Add response echo boxes
   - Improve visual design
   - Estimated effort: 1-2 days
   - Compromised UX but functional

3. **Current + Polish** - Just fix markdown rendering and styling
   - Quickest path to functional
   - Estimated effort: 0.5 days
   - Doesn't match intended design

**Recommended next step:** Discuss with user which approach to take before implementing fixes.
