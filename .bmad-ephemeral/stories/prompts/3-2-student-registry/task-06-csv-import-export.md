# Task 6: CSV Import/Export API

## Context
Story 3.2: Student Registry - Bulk data operations for agency onboarding

## Acceptance Criteria Coverage
- AC 6: Data Import/Export

## Task Description
Implement CSV export and import functionality with validation, field mapping, and email notifications.

## Subtasks
1. Implement GET /api/students/export (CSV file generation)
2. Implement POST /api/students/import (CSV upload)
3. Create CSV import wizard with field mapping
4. Validate data during import with error reporting
5. Support partial data import (missing optional fields)
6. Generate email notification to admin listing incomplete student records
7. Include clickable links to edit incomplete students in email
8. Log all import changes to audit_log table

## Technical Requirements
- Location: `apps/entities/app/api/students/`
- Files to create:
  - `export/route.ts` (GET)
  - `import/route.ts` (POST)
- Use CSV parsing library (papaparse or similar)
- Email via Resend
- Field mapping UI component

## API Signatures
```typescript
GET /api/students/export
POST /api/students/import FormData {file: File (CSV)}
```

## Import Workflow
1. Parse CSV file
2. Map fields to schema
3. Validate each row
4. Import valid rows
5. Report errors for invalid rows
6. Identify incomplete records (missing phone)
7. Send email with links to edit

## Constraints
- Support partial data (optional fields can be missing)
- Validate required fields: full_name, passport_number
- Handle duplicate passport numbers
- Log all imports to audit trail
- Email admin after import completion

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 6, lines 52-61)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Export generates CSV with all fields
- [ ] Import validates data correctly
- [ ] Field mapping works
- [ ] Error reporting functional
- [ ] Email notification sent
- [ ] Clickable links in email work
- [ ] Audit logging active
- [ ] Partial data supported
