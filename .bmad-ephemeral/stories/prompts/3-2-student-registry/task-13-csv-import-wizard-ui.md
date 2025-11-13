# Task 13: CSV Import Wizard UI

## Context
Story 3.2: Student Registry - UI for bulk student import via CSV

## Acceptance Criteria Coverage
- AC 6: Data Import/Export (UI component)

## Task Description
Create CSV import wizard with file upload, field mapping, validation display, and progress tracking.

## Subtasks
1. Create /entities/students/import page
2. Implement CSV file upload component
3. Create field mapping interface
4. Display data validation errors
5. Show import progress
6. Display import completion summary
7. Show email notification sent confirmation

## Technical Requirements
- Location: `apps/entities/app/students/import/`
- Files to create:
  - `page.tsx` (Client Component)
- Multi-step wizard (upload → map → validate → import → complete)
- Use Shadcn components for file upload, tables
- Show progress indicator during import

## Wizard Steps

### Step 1: Upload CSV
- File input accepting .csv files
- File size validation
- Preview first 5 rows

### Step 2: Map Fields
- Table showing CSV columns → Student fields
- Dropdowns to map each column
- Required field indicators
- Preview mapped data

### Step 3: Validate
- Show validation results
- List errors by row
- Allow skip/fix options
- Summary: X valid, Y errors

### Step 4: Import
- Progress bar
- Current row indicator
- Cancel option

### Step 5: Complete
- Summary: X imported, Y failed
- List incomplete records
- Email notification confirmation
- Download error report

## Field Mapping Options
CSV Column → Student Field:
- Name → full_name (required)
- Passport → passport_number (required)
- Email → email (optional)
- Phone → phone (optional)
- DOB → date_of_birth (optional)
- Nationality → nationality (optional)
- Visa Status → visa_status (optional)

## Constraints
- Multi-step wizard flow
- Field mapping with dropdowns
- Validation before import
- Error reporting
- Progress tracking
- Email confirmation display

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 6, lines 52-61)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Upload step working
- [ ] Field mapping functional
- [ ] Validation display working
- [ ] Progress indicator shown
- [ ] Import executes correctly
- [ ] Summary displayed
- [ ] Email confirmation shown
- [ ] Error report downloadable
