# SixSafety Redesign - Master Execution Plan

**Date:** November 6, 2025
**Objective:** Transform current form-wizard implementation into conversational chat interface matching reference demo

---

## Executive Summary

**Scope:** Full redesign of survey interface from form wizard → conversational chat
**Estimated Duration:** 3-5 days of focused work
**Approach:** Phased implementation with agent delegation and handoff documents

---

## Phase Breakdown

### Phase 1: Design System & Component Architecture
**Duration:** 0.5 day
**Agent:** Architecture Specialist
**Deliverables:**
- Component architecture document
- State management plan
- Styling system setup (Once-UI integration)
- Handoff document for Phase 2

**Key Tasks:**
- Analyze reference demo styling patterns
- Plan component hierarchy
- Define shared design tokens
- Set up styling infrastructure

---

### Phase 2: Home Page Redesign (Branded UI)
**Duration:** 0.5 day
**Agent:** Frontend Developer
**Dependencies:** Phase 1 complete
**Deliverables:**
- Redesigned home page matching reference
- Toronto Police badge integration
- QR code component
- Styled dropdown and buttons
- Crime info notification component
- Handoff document for Phase 3

**Key Tasks:**
- Implement navy blue branded background
- Add Toronto Police Services badge
- Create QR code with "Try it Yourself!"
- Style neighbourhood dropdown
- Create orange Submit button
- Create blue Restart Session button
- Format crime info as notification box

---

### Phase 3: Survey Conversation Interface
**Duration:** 1.5 days
**Agent:** Frontend Architect + Developer
**Dependencies:** Phase 1 & 2 complete
**Deliverables:**
- Conversational chat UI component
- Response echo boxes (red notifications)
- Section headers with icons
- Progressive disclosure logic
- Real-time summary component
- Handoff document for Phase 4

**Key Tasks:**
- Replace form wizard with chat container
- Implement scrolling conversation view
- Create response echo component
- Build section header component
- Implement real-time summary with shield icon
- Update SurveyContext for conversation flow
- Modify form submission to append not replace

---

### Phase 4: Form Components & Interactions
**Duration:** 1 day
**Agent:** UI Component Developer
**Dependencies:** Phase 3 complete
**Deliverables:**
- Multi-select crime tag component
- Styled checkbox components
- Styled radio button components
- Inline form elements
- Handoff document for Phase 5

**Key Tasks:**
- Build multi-select tag interface (orange removable pills)
- Style checkboxes with orange check icons
- Style radio buttons with orange selection
- Integrate form elements inline with conversation
- Connect to DynamicForm component

---

### Phase 5: Markdown Rendering & Content Display
**Duration:** 0.5 day
**Agent:** Content Specialist
**Dependencies:** Phase 3 complete
**Deliverables:**
- Markdown renderer component
- Formatted conversation history
- Proper text rendering
- Handoff document for Phase 6

**Key Tasks:**
- Install markdown rendering library (react-markdown)
- Create markdown wrapper component
- Replace raw text display with rendered markdown
- Format bold, bullets, numbered lists
- Test with sample content

---

### Phase 6: Integration Testing & Bug Fixes
**Duration:** 0.5 day
**Agent:** QA + Developer
**Dependencies:** Phases 1-5 complete
**Deliverables:**
- Tested end-to-end flow
- Bug fix list
- Fixed issues
- Handoff document for Phase 7

**Key Tasks:**
- Test complete user flow
- Verify all interactions work
- Fix any integration bugs
- Test with real AI responses
- Verify data flow through context
- Test plan generation

---

### Phase 7: Final Polish & Documentation
**Duration:** 0.5 day
**Agent:** Polish Specialist + Tech Writer
**Dependencies:** Phase 6 complete
**Deliverables:**
- Polished UI
- Updated documentation
- Deployment-ready code
- Final handoff document

**Key Tasks:**
- Fine-tune animations and transitions
- Verify responsive design
- Update README
- Document new architecture
- Create developer guide
- Final visual QA

---

## Agent Handoff Structure

Each phase will produce a handoff document with:

1. **Completed Work Summary**
   - What was built
   - Files modified/created
   - Key decisions made

2. **Technical Details**
   - Component APIs
   - State management changes
   - Styling patterns used

3. **Known Issues/Limitations**
   - What needs attention
   - Edge cases to consider
   - Performance considerations

4. **Next Phase Requirements**
   - What the next agent needs to know
   - Dependencies to be aware of
   - Integration points

5. **Testing Notes**
   - What was tested
   - What still needs testing
   - Test data/scenarios

---

## Risk Mitigation

### High-Risk Areas
1. **State Management Changes** - Could break existing flow
   - Mitigation: Incremental changes with testing

2. **AI Response Handling** - Dynamic content may not fit new UI
   - Mitigation: Test with various response lengths

3. **Form Validation** - New inline forms need proper validation
   - Mitigation: Preserve existing validation logic

### Rollback Plan
- Keep current implementation in git branch
- Feature flag for new UI
- Can revert if critical issues found

---

## Success Criteria

### Must Have (P0)
- ✅ Conversational chat interface
- ✅ Response echo boxes
- ✅ Progressive disclosure
- ✅ Markdown rendering working
- ✅ Multi-select crime tags
- ✅ Branded home page

### Should Have (P1)
- ✅ Section headers with icons
- ✅ Real-time summary
- ✅ Styled form elements
- ✅ Natural language crime info

### Nice to Have (P2)
- ⭕ QR code
- ⭕ Restart Session button
- ⭕ RUNNING... Stop indicator
- ⭕ Smooth animations

---

## Current Status

**Phase 1:** READY TO START
**Overall Progress:** 0%

---

## Next Steps

1. ✅ Create this master plan
2. ⏭️ Spin up Phase 1 agent (Architecture Specialist)
3. ⏭️ Generate handoff document after Phase 1
4. ⏭️ Continue through phases sequentially

---

**Note:** This is a living document. Updates will be made as phases complete.
