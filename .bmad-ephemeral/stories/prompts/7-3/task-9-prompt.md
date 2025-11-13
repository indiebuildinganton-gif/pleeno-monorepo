# Story 7-3: PDF Export Functionality - Task 9

**Story**: PDF Export Functionality
**Task**: Testing
**Acceptance Criteria**: All
**Previous Tasks**: Tasks 1-8 (All implementation complete) - Should be completed

## User Story Context

**As a** Development Team
**I want** comprehensive test coverage for PDF export functionality
**So that** I can ensure reliability, catch regressions, and maintain quality

## Task Description

Write comprehensive test suites covering unit tests, integration tests, E2E tests, and edge cases for the complete PDF export functionality. Verify all acceptance criteria are met and the feature works reliably.

## Subtasks Checklist

- [ ] Write API route unit tests:
  - Test PDF export with all filters applied
  - Test PDF includes agency logo and branding
  - Test PDF includes report metadata and filters
  - Test PDF table formatting (headers, rows, columns)
  - Test PDF pagination (multiple pages)
  - Test PDF summary totals
  - Test filename generation with timestamp
  - Test RLS filtering by agency_id
- [ ] Write integration tests:
  - Generate report → Click "Export PDF" → PDF downloads
  - Open PDF → Verify all sections present
  - Apply filters → Export PDF → Verify filtered data
  - Select columns → Export PDF → Verify only selected columns
  - Upload logo → Export PDF → Verify logo appears
- [ ] Write error handling tests:
  - Invalid filters → Return 400 error
  - No data available → Return PDF with headers only
  - Database error → Return 500 error
  - Logo load failure → Fallback to text name
- [ ] Test edge cases:
  - Export with 0 rows (empty report)
  - Export with 100+ rows (pagination)
  - Export with long text values (truncation)
  - Export without logo (text fallback)
  - Export with many columns (layout adjustment)

## Acceptance Criteria

**All ACs must be verified through automated and manual testing:**

1. **AC #1**: PDF file downloads with formatted report data
2. **AC #2**: PDF includes agency logo/name, report title, generation date, filters applied
3. **AC #3**: PDF includes formatted table with report data
4. **AC #4**: PDF includes summary totals
5. **AC #5**: PDF has proper page breaks for large reports
6. **AC #6**: Filename includes report type and timestamp

## Context & Constraints

### Key Constraints
- **Multi-Tenant Security**: Test RLS filtering - agencies only see own data
- **Performance**: Test PDF generation time for various dataset sizes
- **Error Handling**: All error cases must be tested and handled gracefully

### Testing Standards

Use Vitest for unit tests, React Testing Library for component tests, Playwright for E2E tests. Test files co-located with source in `__tests__/` subdirectories.

**Test Locations:**
- `apps/reports/app/api/**/__tests__/*.test.ts` - API route tests
- `packages/ui/src/pdf/__tests__/*.test.tsx` - Component tests
- `packages/utils/src/__tests__/pdf-exporter.test.ts` - Utility tests
- `__tests__/e2e/pdf-export.spec.ts` - E2E tests

## Update Manifest

Before starting implementation:
1. Open `.bmad-ephemeral/stories/prompts/7-3/manifest.md`
2. Update Task 8 status to "Completed" with completion date
3. Update Task 9 status to "In Progress" with start date
4. Add implementation notes from Task 8

## Implementation Guidelines

### Step 1: API Route Unit Tests

Create `apps/reports/app/api/reports/payment-plans/export/__tests__/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

describe('PDF Export API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return PDF with correct Content-Type header', async () => {
    const request = new Request('http://localhost/api/reports/payment-plans/export?format=pdf');
    const response = await GET(request);

    expect(response.headers.get('Content-Type')).toBe('application/pdf');
  });

  it('should include filename with timestamp in Content-Disposition', async () => {
    const request = new Request('http://localhost/api/reports/payment-plans/export?format=pdf');
    const response = await GET(request);

    const disposition = response.headers.get('Content-Disposition');
    expect(disposition).toMatch(/^attachment; filename="payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf"$/);
  });

  it('should filter by agency_id via RLS', async () => {
    // Mock session with specific agency_id
    vi.mock('@/lib/auth', () => ({
      getCurrentUser: vi.fn().mockResolvedValue({ id: 'user-1', agency_id: 'agency-1' }),
    }));

    const request = new Request('http://localhost/api/reports/payment-plans/export?format=pdf');
    await GET(request);

    // Verify query includes agency_id filter
    expect(mockSupabase.from).toHaveBeenCalledWith('payment_plans');
    expect(mockSupabase.eq).toHaveBeenCalledWith('agency_id', 'agency-1');
  });

  it('should apply date range filters', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=pdf&date_from=2025-01-01&date_to=2025-01-31'
    );
    await GET(request);

    expect(mockSupabase.gte).toHaveBeenCalledWith('start_date', '2025-01-01');
    expect(mockSupabase.lte).toHaveBeenCalledWith('start_date', '2025-01-31');
  });

  it('should apply status filters', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=pdf&status[]=active&status[]=completed'
    );
    await GET(request);

    expect(mockSupabase.in).toHaveBeenCalledWith('status', ['active', 'completed']);
  });

  it('should handle empty results with headers-only PDF', async () => {
    // Mock empty data
    vi.mock('@/lib/supabase', () => ({
      queryPaymentPlans: vi.fn().mockResolvedValue([]),
    }));

    const request = new Request('http://localhost/api/reports/payment-plans/export?format=pdf');
    const response = await GET(request);

    expect(response.status).toBe(200);
    // PDF should still generate with headers but no data rows
  });

  it('should return 400 for invalid filters', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=pdf&date_from=invalid-date'
    );
    const response = await GET(request);

    expect(response.status).toBe(400);
  });

  it('should return 500 on database error', async () => {
    vi.mock('@/lib/supabase', () => ({
      queryPaymentPlans: vi.fn().mockRejectedValue(new Error('Database error')),
    }));

    const request = new Request('http://localhost/api/reports/payment-plans/export?format=pdf');
    const response = await GET(request);

    expect(response.status).toBe(500);
  });

  it('should log export activity', async () => {
    const mockLogActivity = vi.fn();
    vi.mock('@/utils/activity-logger', () => ({
      logExportActivity: mockLogActivity,
    }));

    const request = new Request('http://localhost/api/reports/payment-plans/export?format=pdf');
    await GET(request);

    expect(mockLogActivity).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        reportType: 'payment_plans',
        format: 'pdf',
      })
    );
  });
});
```

### Step 2: PDF Component Tests

Create `packages/ui/src/pdf/__tests__/PDFReportHeader.test.tsx`:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '@react-pdf/renderer';
import { PDFReportHeader } from '../PDFReportHeader';

describe('PDFReportHeader', () => {
  it('should render agency name when logo_url is not provided', async () => {
    const props = {
      agency: { name: 'Test Agency' },
      reportTitle: 'Payment Plans Report',
      generatedAt: new Date('2025-11-13T10:30:00'),
      generatedBy: { name: 'John Doe', email: 'john@test.com' },
    };

    const doc = <PDFReportHeader {...props} />;
    const result = await render(doc);

    // Verify agency name is rendered (logo_url not provided)
    expect(result).toContain('Test Agency');
  });

  it('should render logo when logo_url is provided', async () => {
    const props = {
      agency: { name: 'Test Agency', logo_url: 'https://example.com/logo.png' },
      reportTitle: 'Payment Plans Report',
      generatedAt: new Date('2025-11-13T10:30:00'),
      generatedBy: { name: 'John Doe', email: 'john@test.com' },
    };

    const doc = <PDFReportHeader {...props} />;
    const result = await render(doc);

    // Verify logo URL is used (implementation-specific)
  });

  it('should format generation date with Brisbane timezone', async () => {
    const props = {
      agency: { name: 'Test Agency' },
      reportTitle: 'Payment Plans Report',
      generatedAt: new Date('2025-11-13T10:30:00'),
      generatedBy: { name: 'John Doe', email: 'john@test.com' },
    };

    const doc = <PDFReportHeader {...props} />;
    const result = await render(doc);

    expect(result).toContain('November 13, 2025');
    expect(result).toContain('10:30 AM');
  });
});
```

### Step 3: Integration Tests

Create `__tests__/integration/pdf-export.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('PDF Export Integration', () => {
  it('should generate PDF with filters applied', async () => {
    // Setup: Create test data in database
    const testData = await createTestPaymentPlans();

    // Generate PDF with filters
    const response = await fetch('/api/reports/payment-plans/export?format=pdf&status[]=active');
    const blob = await response.blob();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/pdf');
    expect(blob.size).toBeGreaterThan(0);

    // Cleanup
    await cleanupTestData(testData);
  });

  it('should include logo in PDF after upload', async () => {
    // Upload logo
    const logoFile = new File(['fake-image-data'], 'logo.png', { type: 'image/png' });
    await uploadAgencyLogo(logoFile);

    // Generate PDF
    const response = await fetch('/api/reports/payment-plans/export?format=pdf');
    const blob = await response.blob();

    // Verify PDF contains logo (would need PDF parsing library)
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should paginate large datasets', async () => {
    // Create 100 test payment plans
    const testData = await createTestPaymentPlans(100);

    // Generate PDF
    const response = await fetch('/api/reports/payment-plans/export?format=pdf');
    const blob = await response.blob();

    expect(response.status).toBe(200);

    // Verify multiple pages (would need PDF parsing)
    // Expected: 100 rows / 30 per page = 4 pages

    await cleanupTestData(testData);
  });
});
```

### Step 4: E2E Tests with Playwright

Create `__tests__/e2e/pdf-export.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('PDF Export E2E', () => {
  test('should export PDF from report builder', async ({ page }) => {
    // Navigate to report builder
    await page.goto('/reports/payment-plans');

    // Wait for report to load
    await page.waitForSelector('[data-testid="report-table"]');

    // Click Export PDF button
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-button"]');
    const download = await downloadPromise;

    // Verify download
    expect(download.suggestedFilename()).toMatch(/payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.pdf/);

    // Verify file size is reasonable (at least 5KB)
    const path = await download.path();
    const fs = require('fs');
    const stats = fs.statSync(path);
    expect(stats.size).toBeGreaterThan(5000);
  });

  test('should show loading state during export', async ({ page }) => {
    await page.goto('/reports/payment-plans');

    await page.click('[data-testid="export-pdf-button"]');

    // Verify loading state appears
    await expect(page.locator('text=Generating PDF...')).toBeVisible();

    // Wait for download to complete
    await page.waitForEvent('download');

    // Verify loading state disappears
    await expect(page.locator('text=Generating PDF...')).not.toBeVisible();
  });

  test('should apply filters to PDF export', async ({ page }) => {
    await page.goto('/reports/payment-plans');

    // Apply date filter
    await page.fill('[data-testid="date-from"]', '2025-01-01');
    await page.fill('[data-testid="date-to"]', '2025-01-31');

    // Click Export PDF
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-pdf-button"]');
    await downloadPromise;

    // Verify API was called with correct params
    // (would need to intercept API calls)
  });
});
```

### Step 5: Edge Case Tests

```typescript
describe('PDF Export Edge Cases', () => {
  it('should handle empty dataset', async () => {
    // No payment plans in database
    const response = await fetch('/api/reports/payment-plans/export?format=pdf');
    const blob = await response.blob();

    expect(response.status).toBe(200);
    // Should still generate PDF with headers but "No data" message
  });

  it('should handle very long text values', async () => {
    const longTextPlan = {
      student_name: 'A'.repeat(100), // 100 character name
      notes: 'B'.repeat(500), // 500 character notes
    };

    const response = await fetch('/api/reports/payment-plans/export?format=pdf');
    const blob = await response.blob();

    expect(response.status).toBe(200);
    // Text should be truncated, not cause overflow
  });

  it('should handle missing logo gracefully', async () => {
    // Set logo_url to non-existent URL
    await supabase.from('agencies').update({ logo_url: 'https://example.com/missing.png' });

    const response = await fetch('/api/reports/payment-plans/export?format=pdf');

    expect(response.status).toBe(200);
    // Should fallback to agency name text
  });

  it('should handle wide tables with many columns', async () => {
    const columns = Array.from({ length: 20 }, (_, i) => `column_${i}`);

    const response = await fetch(
      `/api/reports/payment-plans/export?format=pdf&columns=${columns.join(',')}`
    );

    expect(response.status).toBe(200);
    // Should use landscape orientation or adjust layout
  });
});
```

### Step 6: Performance Tests

```typescript
describe('PDF Export Performance', () => {
  it('should generate PDF in under 5 seconds for 100 rows', async () => {
    const testData = await createTestPaymentPlans(100);

    const startTime = Date.now();
    const response = await fetch('/api/reports/payment-plans/export?format=pdf');
    await response.blob();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 seconds

    await cleanupTestData(testData);
  });

  it('should generate PDF in under 30 seconds for 1000 rows', async () => {
    const testData = await createTestPaymentPlans(1000);

    const startTime = Date.now();
    const response = await fetch('/api/reports/payment-plans/export?format=pdf');
    await response.blob();
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(30000); // 30 seconds

    await cleanupTestData(testData);
  });
});
```

## Implementation Notes

### What Was Completed in Previous Tasks
- Tasks 1-8: All PDF export functionality implemented
- API route, components, UI, logging all complete

### How This Task Verifies Previous Work
- Unit tests verify individual components work correctly
- Integration tests verify components work together
- E2E tests verify complete user journeys
- Edge case tests ensure robustness

### Testing Strategy

**Test Pyramid**:
- Many unit tests (fast, isolated)
- Some integration tests (moderate speed, verify interactions)
- Few E2E tests (slow, verify complete flows)

**Coverage Goals**:
- API routes: 90%+ coverage
- PDF components: 80%+ coverage
- Utilities: 90%+ coverage
- E2E: Critical user paths

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 9 as "Completed" with date
2. Update Story 7-3 status to "completed" in main story file
3. Run all tests and ensure they pass
4. Update `.bmad-ephemeral/sprint-status.yaml` - mark story as DONE
5. Prepare demo for stakeholders

## Testing Checklist

### Unit Tests
- [ ] API route tests pass
- [ ] PDF component tests pass
- [ ] Utility function tests pass
- [ ] All edge cases covered

### Integration Tests
- [ ] PDF generation with filters works
- [ ] Logo upload and display works
- [ ] Pagination works for large datasets
- [ ] Activity logging works

### E2E Tests
- [ ] Export button triggers download
- [ ] Loading state displays correctly
- [ ] PDF downloads with correct filename
- [ ] Filters apply to PDF export

### Manual Testing
- [ ] AC #1: PDF downloads when clicking button ✓
- [ ] AC #2: PDF includes logo, title, date, filters ✓
- [ ] AC #3: PDF includes formatted table ✓
- [ ] AC #4: PDF includes summary totals ✓
- [ ] AC #5: PDF has proper page breaks ✓
- [ ] AC #6: Filename has report type and timestamp ✓

### Edge Cases
- [ ] Empty dataset handled
- [ ] Long text truncated correctly
- [ ] Missing logo shows fallback
- [ ] Wide tables handled with landscape
- [ ] Network errors show appropriate message

### Performance
- [ ] 100 rows export in < 5 seconds
- [ ] 1000 rows export in < 30 seconds
- [ ] Memory usage reasonable

### Security
- [ ] RLS filters by agency_id correctly
- [ ] Cannot export other agency's data
- [ ] Activity logging includes correct user_id

## Final Verification

Before marking story complete:
1. All tests pass
2. All acceptance criteria verified
3. Code review completed
4. Manual testing completed
5. Demo prepared
6. Documentation updated
7. Activity logs verified
8. Performance benchmarks met
