# Story 7-3: PDF Export Functionality - Task 1

**Story**: PDF Export Functionality
**Task**: Create PDF Export API Route
**Acceptance Criteria**: AC #1, 6

## User Story Context

**As a** Agency Admin
**I want** to export reports to PDF format
**So that** I can share professional-looking reports with stakeholders or college partners

## Task Description

Create an API route that handles PDF export requests for payment plan reports. This route will extend the existing CSV export functionality to support PDF format generation.

## Subtasks Checklist

- [ ] Create API route: `GET /api/reports/payment-plans/export?format=pdf`
- [ ] Accept all filter params from report generation (same as CSV export)
- [ ] Accept `columns[]` query parameter for column selection
- [ ] Query payment_plans with same logic as report generation and CSV export
- [ ] Generate PDF using `@react-pdf/renderer`
- [ ] Set HTTP response headers:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="payment_plans_YYYY-MM-DD_HHmmss.pdf"`
- [ ] Generate filename with timestamp: `payment_plans_${date}.pdf`
- [ ] Test: Verify PDF downloads with correct filename
- [ ] Test: Verify RLS filters by agency_id

## Acceptance Criteria

**AC #1**: Given I have generated a report, When I click "Export to PDF", Then a PDF file is downloaded with formatted report data

**AC #6**: And the filename includes the report type and timestamp

## Context & Constraints

### Key Constraints
- **Multi-Tenant Security**: All queries MUST filter by agency_id via RLS. Never expose data from other agencies.
- **API Route Reuse**: Extend existing `/api/reports/payment-plans/export` route with format=pdf parameter (format=csv already exists from Story 7.2)
- **Export Tracking**: Log all PDF exports to activity_log table with row count, page count, and filters applied

### Relevant Interfaces

**GET /api/reports/payment-plans/export**
- Path: `apps/reports/app/api/reports/payment-plans/export/route.ts`
- Signature: `GET /api/reports/payment-plans/export?format=pdf&date_from={date}&date_to={date}&college_id={uuid}&branch_id={uuid}&student_id={uuid}&status[]={string}&contract_expiration_from={date}&contract_expiration_to={date}&columns[]={string}`
- Description: Existing CSV export endpoint. Extend to handle format=pdf. Returns PDF file with Content-Type: application/pdf and Content-Disposition: attachment header.

### Dependencies

**Required NPM Packages:**
- `@react-pdf/renderer` (^4.3.1) - React components to PDF generation library (server-compatible)
- `@supabase/supabase-js` (latest) - Supabase client for database queries
- `@supabase/ssr` (latest) - Supabase Server-Side Rendering utilities for Next.js
- `date-fns` (^4.1.0) - Date formatting for report metadata timestamps
- `date-fns-tz` (latest) - Timezone support for Brisbane time display

### Artifacts & References

**Documentation:**
- `docs/epics.md` - Epic 7: Reporting & Export - Story 7.3 details
- `docs/architecture.md` - Reporting Zone architecture (apps/reports/)
- `.bmad-ephemeral/stories/7-2-csv-export-functionality.md` - CSV export patterns to reuse

**Code References:**
- `apps/reports/app/api/reports/payment-plans/export/route.ts` - Existing CSV export route to extend

## CRITICAL: Create Implementation Manifest

Before starting implementation, create a manifest file to track progress across all tasks:

**Location**: `.bmad-ephemeral/stories/prompts/7-3/manifest.md`

**Content Template**:
```markdown
# Story 7-3 Implementation Manifest

**Story**: PDF Export Functionality
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Create PDF Export API Route
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Create PDF Template with React Components
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Add Agency Logo/Branding
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Include Report Metadata and Filters
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Format Data Table with Pagination
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Add Summary Totals Section
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Add Export Button to Report UI
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Add Export Tracking
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

## Implementation Guidelines

1. **Install Dependencies First**: Ensure `@react-pdf/renderer` and date formatting packages are installed
2. **Review Existing CSV Export**: Study the existing route.ts implementation for CSV export
3. **Extend Format Parameter**: Add logic to handle `format=pdf` parameter alongside existing `format=csv`
4. **Basic PDF Generation**: Start with a simple PDF document to verify the flow works
5. **Test Early**: Verify PDF downloads with correct headers and filename before adding complexity

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 1 as "Completed" with date
2. Add implementation notes about any challenges or decisions
3. Move to `task-2-prompt.md` to create PDF template components
4. The PDF template components will provide the structure you'll use in this API route

## Testing Checklist

- [ ] API route responds to `format=pdf` parameter
- [ ] PDF file downloads with correct Content-Type header
- [ ] Filename includes timestamp in format: `payment_plans_YYYY-MM-DD_HHmmss.pdf`
- [ ] RLS filtering works - only agency's own data is exported
- [ ] All filter parameters from CSV export work with PDF export
- [ ] Basic PDF structure renders without errors
