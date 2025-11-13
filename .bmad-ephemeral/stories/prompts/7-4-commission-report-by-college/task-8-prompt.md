# Story 7-4: Commission Report by College - Task 8

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 8: Testing and Validation

**Acceptance Criteria**: All

**Previous Tasks**:
- Task 1 - Created report page UI with filters
- Task 2 - Implemented commission data API
- Task 3 - Created table display component
- Task 4 - Added CSV export
- Task 5 - Created PDF template
- Task 6 - Implemented PDF export API
- Task 7 - Added city grouping/filtering

### Task Description

Comprehensive testing and validation of the entire commission reporting feature to ensure accuracy, security, and quality.

### Subtasks Checklist

- [ ] Write API route tests:
  - Test commission calculation accuracy (paid vs outstanding)
  - Test date range filtering
  - Test city filtering
  - Test RLS enforcement (agency_id isolation)
  - Test drill-down data includes correct payment plans
- [ ] Write UI integration tests:
  - Generate report with filters → Verify data accuracy
  - Expand branch drill-down → See student payment plans
  - Export CSV → Verify file format
  - Export PDF → Verify professional formatting
- [ ] Test edge cases:
  - No commissions in date range → Empty report with headers
  - Multiple branches in same city → Proper grouping
  - Branch with 0% commission rate → Show zero earned commission
  - Outstanding commissions with negative amounts (credits) → Handle gracefully
- [ ] Test Excel compatibility:
  - Open exported CSV in Excel → Verify UTF-8 BOM works
  - Verify currency formatting displays correctly
- [ ] Test PDF for submission quality:
  - Print PDF → Verify readable on paper
  - Verify logo renders correctly
  - Verify page breaks work for long reports

## Context

### All Acceptance Criteria

1. Generate commission report with breakdown by college and branch for selected time period
2. Display columns: college, branch, city, total paid by students, commission rate, earned commission, outstanding commission
3. City field distinguishes between multiple branches of same school
4. Report includes date range filter
5. Report exportable to CSV and PDF
6. PDF version formatted professionally for submission to college partners
7. Report shows supporting details: list of students and payment plans contributing to commission
8. Report can be grouped/filtered by city

### Testing Standards

- Use Vitest for unit tests
- Use React Testing Library for component tests
- Use Playwright for E2E tests
- Test commission calculation accuracy (paid vs outstanding)
- Test RLS enforcement (agency_id isolation)
- Test CSV/PDF export formatting and Excel compatibility
- Test edge cases: 0% commission rate, negative amounts (credits), multiple branches in same city, empty date ranges

### Test Locations

- `apps/reports/app/api/reports/commissions/__tests__/`
- `apps/reports/app/components/__tests__/`
- `packages/utils/src/__tests__/csv-formatter.test.ts`
- `supabase/tests/commission-report-function.test.sql`
- `e2e/reports/commission-report.spec.ts`

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Story Markdown: Testing Standards section
- Project Testing Docs (if they exist)

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 7**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add notes from Task 7, e.g., "Implemented city-based grouping with toggle in UI"]
3. **Update Task 8**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Final Task**: This task ensures everything works correctly and meets all acceptance criteria.

**Key Testing Areas**:

### 1. API Route Tests

Create `apps/reports/app/api/reports/commissions/__tests__/route.test.ts`:

**Test Cases**:
- ✓ Returns 401 when not authenticated
- ✓ Returns 400 when date range missing
- ✓ Returns commission data grouped by college/branch
- ✓ Calculates earned commission correctly (paid installments × rate)
- ✓ Calculates outstanding commission correctly (overdue unpaid × rate)
- ✓ Filters by date range correctly
- ✓ Filters by city when provided
- ✓ Respects RLS - only returns user's agency data
- ✓ Includes drill-down payment plan data
- ✓ Handles empty results gracefully
- ✓ Handles 0% commission rate branches
- ✓ Handles negative amounts (credits/refunds)

**Example Test**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { POST } from '../route'

describe('Commission Report API', () => {
  it('calculates earned commission correctly', async () => {
    const request = new Request('http://localhost/api/reports/commissions', {
      method: 'POST',
      body: JSON.stringify({
        date_from: '2024-01-01',
        date_to: '2024-12-31',
      }),
    })

    const response = await POST(request)
    const data = await response.json()

    // Verify earned commission = sum(paid_amount × commission_rate)
    const expectedEarned = // ... calculate expected
    expect(data.summary.total_earned).toBeCloseTo(expectedEarned, 2)
  })
})
```

### 2. Component Tests

Create `apps/reports/app/components/__tests__/CommissionReportTable.test.tsx`:

**Test Cases**:
- ✓ Renders table with commission data
- ✓ Groups rows by college
- ✓ Displays all required columns
- ✓ Formats currency correctly
- ✓ Highlights outstanding commissions in red
- ✓ Expands drill-down on row click
- ✓ Shows student payment plans in drill-down
- ✓ Displays summary totals correctly
- ✓ Handles empty data gracefully

**Example Test**:
```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { CommissionReportTable } from '../CommissionReportTable'

describe('CommissionReportTable', () => {
  it('expands drill-down when branch row clicked', () => {
    const mockData = [/* ... */]
    render(<CommissionReportTable data={mockData} summary={mockSummary} />)

    const branchRow = screen.getByText('Main Campus')
    fireEvent.click(branchRow)

    expect(screen.getByText('Student Payment Plans')).toBeInTheDocument()
  })
})
```

### 3. Export Tests

**CSV Export**:
- ✓ Downloads with correct filename
- ✓ Contains all commission data
- ✓ Formats currency as decimal (no symbols)
- ✓ Includes UTF-8 BOM for Excel
- ✓ Opens correctly in Excel (manual test)
- ✓ Includes drill-down student details

**PDF Export**:
- ✓ Downloads with correct filename
- ✓ Renders professional formatting
- ✓ Includes agency logo
- ✓ Shows all commission data
- ✓ Groups by college correctly
- ✓ Page breaks work for long reports
- ✓ Footer with page numbers appears
- ✓ Prints clearly on paper (manual test)

### 4. Database Function Tests

Create `supabase/tests/commission-report-function.test.sql`:

**Test Cases**:
```sql
-- Test commission calculation accuracy
BEGIN;
SELECT plan(5);

-- Setup test data
INSERT INTO colleges (id, name, agency_id) VALUES ('c1', 'Test College', 'a1');
INSERT INTO branches (id, college_id, name, city, commission_rate_percent)
  VALUES ('b1', 'c1', 'Main', 'NYC', 10);
-- ... more test data

-- Test earned commission
SELECT results_eq(
  $$ SELECT earned_commission FROM get_commission_report('a1', '2024-01-01', '2024-12-31', NULL) $$,
  $$ VALUES (1000.00) $$,
  'Earned commission calculated correctly'
);

ROLLBACK;
```

### 5. E2E Tests

Create `e2e/reports/commission-report.spec.ts`:

**Test Flow**:
```typescript
import { test, expect } from '@playwright/test'

test('generate and export commission report', async ({ page }) => {
  // Navigate to reports page
  await page.goto('/reports/commissions')

  // Select date range
  await page.fill('[name="date_from"]', '2024-01-01')
  await page.fill('[name="date_to"]', '2024-12-31')

  // Generate report
  await page.click('button:has-text("Generate Report")')

  // Verify table appears
  await expect(page.locator('table')).toBeVisible()

  // Expand drill-down
  await page.click('tr:has-text("Main Campus")')
  await expect(page.locator('text=Student Payment Plans')).toBeVisible()

  // Export CSV
  const [download1] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Export CSV")'),
  ])
  expect(download1.suggestedFilename()).toMatch(/commissions_report_.*\.csv/)

  // Export PDF
  const [download2] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Export PDF")'),
  ])
  expect(download2.suggestedFilename()).toMatch(/commissions_report_.*\.pdf/)
})
```

### 6. Edge Case Testing

**Manual Testing Checklist**:
- [ ] No data in date range → Shows "No results" message
- [ ] Multiple branches in same city → All appear correctly grouped
- [ ] Branch with 0% commission → Shows $0.00 earned
- [ ] Negative amounts (credits) → Calculates correctly (reduces commission)
- [ ] Very large report (100+ branches) → Performance acceptable, PDF paginates
- [ ] Agency without logo → PDF generates without logo
- [ ] Special characters in names → CSV escapes correctly
- [ ] Long branch/college names → Table layout doesn't break
- [ ] City grouping with single city → Still shows city header
- [ ] City filter with "Group by City" → Works correctly

### 7. Security Testing

- [ ] User A cannot see User B's commission data (RLS test)
- [ ] API requires authentication
- [ ] SQL injection attempts fail safely
- [ ] Export endpoints respect agency_id filtering
- [ ] Invalid date formats rejected

### 8. Performance Testing

- [ ] Report generation under 3 seconds for typical data size
- [ ] CSV export handles 1000+ rows
- [ ] PDF generation completes in reasonable time
- [ ] Database queries use indexes efficiently
- [ ] No N+1 query problems

## Next Steps

After completing this task:

1. **Run All Tests**:
   ```bash
   # Unit and integration tests
   npm test

   # E2E tests
   npm run test:e2e

   # Database tests
   npm run test:db
   ```

2. **Fix Any Failing Tests**:
   - Debug and resolve issues
   - Re-run tests to verify fixes
   - Update implementation if needed

3. **Manual Testing**:
   - Go through the edge case checklist
   - Test CSV in Excel and Google Sheets
   - Print PDF to verify submission quality
   - Test with real data if available

4. **Update the manifest**:
   - Set Task 8 status to "Completed" with today's date
   - Add testing notes (e.g., "All tests passing, verified Excel compatibility and PDF print quality")

5. **Final Story Status**:
   - Update manifest story status to "Completed"
   - Add completion date
   - Add final notes summarizing implementation

6. **Story Completion**:
   - Update story file status to "ready-for-review" or "done"
   - Document any deviations from original plan
   - List any follow-up tasks or improvements needed

## Tips

- Write tests as you implement (don't leave all for the end)
- Test both happy path and error cases
- Use test fixtures for consistent test data
- Mock external dependencies (Supabase, file system)
- Test with realistic data sizes
- Run tests in CI/CD pipeline
- Document any test-specific setup needed
- Keep tests maintainable and readable
- Use descriptive test names
- Group related tests with describe blocks
- Test accessibility (screen readers, keyboard navigation)
- Verify mobile responsiveness if applicable
- Check browser compatibility (Chrome, Firefox, Safari)

## Completion Criteria

The story is complete when:
- [ ] All automated tests pass
- [ ] Manual testing checklist complete
- [ ] All acceptance criteria verified
- [ ] CSV opens correctly in Excel
- [ ] PDF is submission-quality when printed
- [ ] No console errors or warnings
- [ ] Code reviewed and approved (if applicable)
- [ ] Documentation updated
- [ ] Story marked as "done" in tracking system
