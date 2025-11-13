# Story 7.2: CSV Export Functionality - Task Execution Manifest

## Story Overview
**Epic**: 7 - Reporting Zone
**Story ID**: 7.2
**Title**: CSV Export Functionality
**Status**: ready-for-dev

**User Story**:
As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Acceptance Criteria
1. ✅ Given I have generated a report, When I click "Export to CSV", Then a CSV file is downloaded with all report data
2. ✅ And the CSV includes column headers
3. ✅ And the CSV respects the selected columns and filters
4. ✅ And currency amounts are formatted correctly
5. ✅ And dates are in ISO format (YYYY-MM-DD)
6. ✅ And the filename includes the report type and timestamp (e.g., "payment_plans_2025-11-10.csv")

## Task Execution Sequence

### Task 1: Create CSV Export API Route
**Status**: ⏳ Not Started
**Prompt File**: `task-1-csv-export-api-route.md`
**Estimated Time**: 2-3 hours

**Key Deliverables**:
- [ ] API route: `apps/reports/app/api/reports/payment-plans/export/route.ts`
- [ ] Query parameter extraction (filters, columns)
- [ ] Database query with RLS filtering
- [ ] Response headers (Content-Type, Content-Disposition)
- [ ] Filename generation with timestamp
- [ ] Basic integration tests

**Acceptance Criteria Coverage**: AC #1, #3, #4, #5, #6

**Dependencies**: None (greenfield)

**Notes**:
- Reuse query logic from report generation API (Story 7.1)
- Ensure RLS policies auto-apply agency_id filter

---

### Task 2: Format CSV Data Correctly
**Status**: ⏳ Not Started
**Prompt File**: `task-2-format-csv-data.md`
**Estimated Time**: 2-3 hours

**Key Deliverables**:
- [ ] CSV formatter utility: `packages/utils/src/csv-formatter.ts`
- [ ] Column header mapping
- [ ] Currency formatting (decimal, 2 places)
- [ ] Date formatting (ISO 8601)
- [ ] Special character escaping
- [ ] UTF-8 BOM addition
- [ ] Unit tests (100% coverage)

**Acceptance Criteria Coverage**: AC #2, #4, #5

**Dependencies**: Task 1 (API route needs formatter)

**Notes**:
- Add UTF-8 BOM for Excel compatibility
- Use `csv-stringify` library for proper escaping
- Handle null/undefined values gracefully

---

### Task 3: Support Large Dataset Streaming
**Status**: ⏳ Not Started
**Prompt File**: `task-3-large-dataset-streaming.md`
**Estimated Time**: 3-4 hours

**Key Deliverables**:
- [ ] Streaming export function in csv-formatter
- [ ] Batch query pattern for large datasets
- [ ] Memory-efficient streaming (>1000 rows)
- [ ] Transfer-Encoding: chunked headers
- [ ] Performance tests (5000+ rows)
- [ ] Memory profiling

**Acceptance Criteria Coverage**: AC #1 (large datasets)

**Dependencies**: Task 1 (API route), Task 2 (formatter)

**Notes**:
- Use Node.js streams for memory efficiency
- Threshold: >1000 rows triggers streaming
- Monitor memory usage during export

---

### Task 4: Add Export Button to Report UI
**Status**: ⏳ Not Started
**Prompt File**: `task-4-export-button-ui.md`
**Estimated Time**: 2 hours

**Key Deliverables**:
- [ ] ExportButtons component: `apps/reports/app/components/ExportButtons.tsx`
- [ ] Export CSV button with download icon
- [ ] Loading state with spinner
- [ ] Error handling with toasts
- [ ] Integration with report builder
- [ ] Component tests

**Acceptance Criteria Coverage**: AC #1

**Dependencies**: Task 1 (API route)

**Notes**:
- Position next to "Export PDF" placeholder
- Use window.location.href for browser download
- Show loading state during export

---

### Task 5: Add Export Tracking
**Status**: ⏳ Not Started
**Prompt File**: `task-5-export-tracking.md`
**Estimated Time**: 1-2 hours

**Key Deliverables**:
- [ ] Activity logging in API route
- [ ] Extend activity-logger utility
- [ ] Log metadata (report_type, format, row_count, filters)
- [ ] Activity feed integration
- [ ] Integration tests

**Acceptance Criteria Coverage**: AC #1 (audit trail)

**Dependencies**: Task 1 (API route), Story 6.4 (activity logging)

**Notes**:
- Async logging to avoid blocking export
- Don't fail export if logging fails
- Display in activity feed from Story 6.4

---

### Task 6: Handle Column Selection
**Status**: ⏳ Not Started
**Prompt File**: `task-6-column-selection.md`
**Estimated Time**: 2 hours

**Key Deliverables**:
- [ ] Column selection parameter handling
- [ ] Column validation (whitelist)
- [ ] Column order preservation
- [ ] Default to all columns if none specified
- [ ] Integration tests

**Acceptance Criteria Coverage**: AC #3

**Dependencies**: Task 1 (API route), Task 2 (formatter), Task 4 (UI)

**Notes**:
- Validate column keys against AVAILABLE_COLUMNS
- Maintain user-specified column order
- Return 400 error for invalid columns

---

### Task 7: Testing
**Status**: ⏳ Not Started
**Prompt File**: `task-7-testing.md`
**Estimated Time**: 4-5 hours

**Key Deliverables**:
- [ ] Unit tests (csv-formatter, validators)
- [ ] Integration tests (API route, RLS, streaming)
- [ ] Component tests (ExportButtons)
- [ ] E2E tests (full export flow)
- [ ] Edge case tests (empty, large, special chars)
- [ ] Performance tests
- [ ] 80%+ overall coverage

**Acceptance Criteria Coverage**: All AC #1-6 + edge cases

**Dependencies**: All previous tasks

**Notes**:
- Comprehensive test coverage required
- Manual Excel compatibility testing
- Performance testing with large datasets

---

## Execution Instructions

### For Sequential Execution
1. Copy Task 1 prompt → Execute in Claude Code Web → Verify completion
2. Copy Task 2 prompt → Execute in Claude Code Web → Verify completion
3. Copy Task 3 prompt → Execute in Claude Code Web → Verify completion
4. Copy Task 4 prompt → Execute in Claude Code Web → Verify completion
5. Copy Task 5 prompt → Execute in Claude Code Web → Verify completion
6. Copy Task 6 prompt → Execute in Claude Code Web → Verify completion
7. Copy Task 7 prompt → Execute in Claude Code Web → Verify completion

### Verification Checklist (After Each Task)
- [ ] Code compiles without errors
- [ ] Tests pass (if applicable)
- [ ] Acceptance criteria met
- [ ] Documentation updated
- [ ] Update this manifest with completion status

### Task Completion Status Legend
- ⏳ Not Started
- 🚧 In Progress
- ✅ Completed
- ⚠️ Blocked
- ❌ Failed

## Dependencies Installation

Before starting, ensure these dependencies are installed:

```bash
# CSV generation library
npm install csv-stringify

# Date formatting (should already be installed)
npm install date-fns

# Testing libraries (should already be installed)
npm install -D vitest @testing-library/react @playwright/test
```

## Story Context Reference
- **Story File**: `.bmad-ephemeral/stories/7-2-csv-export-functionality.md`
- **Context File**: `.bmad-ephemeral/stories/7-2-csv-export-functionality.context.xml`
- **Architecture Doc**: `docs/architecture.md` (Reporting Zone)
- **Epic Doc**: `docs/epics.md` (Epic 7)

## Notes & Learnings

### Task Execution Notes
(Update as you complete tasks)

**Task 1**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

**Task 2**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

**Task 3**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

**Task 4**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

**Task 5**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

**Task 6**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

**Task 7**:
- Date:
- Completion Time:
- Notes:
- Issues Encountered:

### Technical Decisions
(Document any technical decisions made during implementation)

### Deviations from Plan
(Document any changes from the original task specifications)

### Future Improvements
(Document ideas for future enhancements)

## Story Completion

**Definition of Done**:
- [ ] All 7 tasks completed
- [ ] All acceptance criteria verified
- [ ] All tests passing (80%+ coverage)
- [ ] Manual Excel compatibility verified
- [ ] Activity logging working
- [ ] Code reviewed
- [ ] Documentation updated
- [ ] Demo prepared

**Final Status**: ⏳ Not Started
**Completion Date**: _____
**Total Development Time**: _____

---

**Generated**: 2025-11-13
**Last Updated**: 2025-11-13
