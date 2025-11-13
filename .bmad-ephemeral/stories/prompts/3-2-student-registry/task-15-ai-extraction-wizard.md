# Task 15: AI Extraction Wizard (Premium)

## Context
Story 3.2: Student Registry - UI for AI-powered offer letter extraction

## Acceptance Criteria Coverage
- AC 8: Premium Feature (AI-Powered Extraction) UI

## Task Description
Create AI extraction wizard for uploading offer letters and reviewing extracted data (premium feature).

## Subtasks
1. Create /entities/students/new/extract page (gated by subscription tier)
2. Implement offer letter upload
3. Show extraction progress spinner
4. Display extracted data in review form
5. Allow editing of extracted data
6. Implement college/branch matching UI
7. Show "Create New College/Branch" option if no match
8. Display confidence scores
9. Handle extraction errors gracefully

## Technical Requirements
- Location: `apps/entities/app/students/new/extract/`
- Files to create:
  - `page.tsx` (Client Component)
- Check subscription tier on page load
- Show upgrade prompt for basic tier
- Multi-step wizard (upload → extract → review → save)

## Wizard Steps

### Step 1: Upload Offer Letter
- PDF file upload
- File type validation (PDF only)
- Premium feature badge/indicator

### Step 2: AI Extraction (Processing)
- Progress spinner
- "Extracting data from offer letter..."
- Cancel option

### Step 3: Review Extracted Data
- Form with pre-populated fields
- Confidence scores per field
- Edit capability for all fields
- College/branch matching results
- Create new college/branch option

### Step 4: Save
- Validation
- Save student + enrollment + payment plan
- Success confirmation

## Extracted Data Display
```
Student Information (95% confidence)
- Full Name: [John Doe] ✓
- Passport: [P1234567] ✓

College Information (88% confidence)
- College: [Imagine] (matched to existing)
- Branch: [Brisbane] (matched to existing)
- [Create New College/Branch]

Payment Information (92% confidence)
- Total: [$25,000]
- Schedule: [4 installments shown]
```

## Confidence Indicators
- High (90-100%): Green checkmark
- Medium (70-89%): Yellow warning
- Low (<70%): Red flag, manual review required

## Constraints
- Premium/Enterprise tier only
- PDF files only
- Show confidence scores
- Allow full editing
- Match to existing colleges
- Allow creating new colleges
- Handle extraction failures

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 8, lines 69-78)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Subscription tier check working
- [ ] Upload working
- [ ] Extraction progress shown
- [ ] Extracted data displayed
- [ ] All fields editable
- [ ] Confidence scores shown
- [ ] College matching working
- [ ] Create new college option working
- [ ] Error handling functional
- [ ] Save working correctly
