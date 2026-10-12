# UI Design Issues - SixSafety

**Priority:** Low (Address after functional bugs are fixed)
**Goal:** Replace native HTML elements with Once-UI components

---

## Home Page (`/`)

### Issues Identified
1. **Native HTML select dropdown** instead of Once-UI select component
   - Location: Neighbourhood selection
   - Current: Browser default `<select>` element
   - Needed: Once-UI styled dropdown

2. **Plain text styling**
   - No Once-UI typography components
   - Basic browser default fonts and sizing

3. **No visual hierarchy**
   - Headings and body text not properly styled
   - Missing Once-UI design tokens

4. **Excessive whitespace/empty space**
   - Large gray area below content
   - Poor vertical space utilization

5. **No branded styling**
   - Generic appearance
   - Missing Once-UI theme application

6. **Link styling**
   - "look it up here" link uses basic browser styling
   - Should use Once-UI link component

7. **Crime statistics display** (after neighbourhood selection)
   - Currently shows basic flexbox layout with text
   - Risk level badges need better styling (colored pills are too basic)
   - Consider card-based design with icons for crime types
   - Add visual hierarchy and spacing improvements
   - Use Once-UI components for badges/tags
   - Consider adding trend indicators or comparison data

---

## Survey Page (`/survey`)

### Issues Identified (to be documented as we review)
- TBD based on screenshot analysis

---

## Plan Page (`/plan`)

### Issues Identified
- TBD based on screenshot analysis

---

## General Issues

### Components Needed from Once-UI
- [ ] Button components
- [ ] Input/Select components
- [ ] Typography components
- [ ] Card/Container components
- [ ] Layout components
- [ ] Theme/design tokens

### Design System Integration
- [ ] Import Once-UI library
- [ ] Apply theme configuration
- [ ] Replace all native HTML elements
- [ ] Implement consistent spacing
- [ ] Add proper responsive design
- [ ] Implement loading states
- [ ] Add transitions/animations

---

**Note:** This file will be updated as we continue reviewing screenshots and identifying additional UI design issues.
