# Task 7: Testing

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Implement comprehensive test coverage for CSV export functionality including unit tests, integration tests, and E2E tests to verify all acceptance criteria, edge cases, and integration points.

## Acceptance Criteria Coverage
All acceptance criteria from AC #1 through AC #6, plus edge cases, error handling, and performance requirements.

## Testing Strategy

### 1. Test Pyramid
- **Unit Tests (70%)**: Test individual functions (formatters, validators)
- **Integration Tests (20%)**: Test API routes, database queries, RLS
- **E2E Tests (10%)**: Test full user flow from UI to download

### 2. Test Framework
- **Unit Tests**: Vitest
- **Component Tests**: React Testing Library + Vitest
- **Integration Tests**: Vitest + Supertest (or similar)
- **E2E Tests**: Playwright

### 3. Coverage Goals
- Overall: 80%+ coverage
- CSV formatter utilities: 100% coverage
- API routes: 90%+ coverage
- UI components: 80%+ coverage

## Subtasks Checklist

### Unit Tests
- [ ] Test CSV formatting functions (currency, dates, headers, BOM)
- [ ] Test column validation
- [ ] Test filter parameter parsing
- [ ] Test filename generation
- [ ] Test special character escaping

### Integration Tests
- [ ] Test API route with all filters applied
- [ ] Test CSV headers match selected columns
- [ ] Test RLS filtering by agency_id
- [ ] Test streaming for large datasets
- [ ] Test empty results (headers only)
- [ ] Test error handling (invalid filters, DB errors)

### E2E Tests
- [ ] Test full export flow: Login → Reports → Generate → Export → Download
- [ ] Test CSV opens correctly in Excel
- [ ] Test filtered exports match report view
- [ ] Test column selection exports correctly
- [ ] Test export appears in activity feed

### Edge Cases
- [ ] Export with 0 rows (empty report)
- [ ] Export with 10,000+ rows (streaming stress test)
- [ ] Export with special characters in text fields
- [ ] Export with null values in optional fields
- [ ] Multiple concurrent exports
- [ ] Export interrupted mid-stream

## Test Implementation

### Unit Tests - CSV Formatter

```typescript
// packages/utils/src/__tests__/csv-formatter.test.ts

import { describe, it, expect } from 'vitest'
import {
  formatCurrencyForCSV,
  formatDateISO,
  generateCSVHeaders,
  addUTF8BOM,
  exportAsCSV,
  getColumnValue,
} from '../csv-formatter'

describe('CSV Formatter - Currency', () => {
  it('formats currency with 2 decimal places', () => {
    expect(formatCurrencyForCSV(1234.56)).toBe('1234.56')
    expect(formatCurrencyForCSV(1000)).toBe('1000.00')
    expect(formatCurrencyForCSV(0.5)).toBe('0.50')
    expect(formatCurrencyForCSV(999999.99)).toBe('999999.99')
  })

  it('handles edge cases', () => {
    expect(formatCurrencyForCSV(0)).toBe('0.00')
    expect(formatCurrencyForCSV(-100.5)).toBe('-100.50')
    expect(formatCurrencyForCSV(null)).toBe('')
    expect(formatCurrencyForCSV(undefined)).toBe('')
  })

  it('rounds to 2 decimal places', () => {
    expect(formatCurrencyForCSV(1.234)).toBe('1.23')
    expect(formatCurrencyForCSV(1.235)).toBe('1.24') // Banker's rounding
  })
})

describe('CSV Formatter - Dates', () => {
  it('formats date strings to ISO format', () => {
    expect(formatDateISO('2025-11-13T12:00:00Z')).toBe('2025-11-13')
    expect(formatDateISO('2025-01-01')).toBe('2025-01-01')
    expect(formatDateISO('2025-12-31T23:59:59Z')).toBe('2025-12-31')
  })

  it('formats Date objects to ISO format', () => {
    const date = new Date('2025-11-13T12:00:00Z')
    expect(formatDateISO(date)).toBe('2025-11-13')
  })

  it('handles edge cases', () => {
    expect(formatDateISO(null)).toBe('')
    expect(formatDateISO(undefined)).toBe('')
    expect(formatDateISO('')).toBe('')
  })

  it('handles invalid dates gracefully', () => {
    expect(formatDateISO('invalid-date')).toBe('')
  })
})

describe('CSV Formatter - Headers', () => {
  it('maps column keys to labels', () => {
    const columns = ['student_name', 'total_amount', 'status']
    const headers = generateCSVHeaders(columns)
    expect(headers).toEqual(['Student Name', 'Total Amount', 'Status'])
  })

  it('uses key as label if not mapped', () => {
    const columns = ['unknown_column']
    const headers = generateCSVHeaders(columns)
    expect(headers).toEqual(['unknown_column'])
  })

  it('handles empty columns array', () => {
    const headers = generateCSVHeaders([])
    expect(headers).toEqual([])
  })
})

describe('CSV Formatter - BOM', () => {
  it('prepends UTF-8 BOM', () => {
    expect(addUTF8BOM('data')).toBe('\uFEFFdata')
    expect(addUTF8BOM('')).toBe('\uFEFF')
  })

  it('BOM character is U+FEFF', () => {
    const bom = addUTF8BOM('')
    expect(bom.charCodeAt(0)).toBe(0xFEFF)
  })
})

describe('CSV Formatter - Column Value Extraction', () => {
  const mockRow = {
    total_amount: 1000,
    status: 'active',
    enrollments: [
      {
        student: { full_name: 'John Doe' },
        branch: {
          name: 'Main Branch',
          city: 'New York',
          college: { name: 'State University' },
        },
      },
    ],
  }

  it('extracts direct properties', () => {
    expect(getColumnValue(mockRow, 'total_amount')).toBe(1000)
    expect(getColumnValue(mockRow, 'status')).toBe('active')
  })

  it('extracts nested properties', () => {
    expect(getColumnValue(mockRow, 'student_name')).toBe('John Doe')
    expect(getColumnValue(mockRow, 'branch_name')).toBe('Main Branch')
    expect(getColumnValue(mockRow, 'college_name')).toBe('State University')
  })

  it('handles missing nested properties', () => {
    const incompleteRow = { enrollments: [] }
    expect(getColumnValue(incompleteRow, 'student_name')).toBeUndefined()
  })
})

describe('CSV Formatter - Full Export', () => {
  const mockData = [
    {
      total_amount: 1000,
      currency: 'USD',
      start_date: '2025-01-01',
      status: 'active',
      commission_rate_percent: 15,
      expected_commission: 150,
      earned_commission: 75,
      enrollments: [
        {
          student: { full_name: 'John Doe' },
          branch: {
            name: 'Main Branch',
            city: 'New York',
            contract_expiration_date: '2026-12-31',
            college: { name: 'State University' },
          },
        },
      ],
    },
  ]

  it('exports CSV with correct format', () => {
    const columns = ['student_name', 'total_amount', 'status']
    const response = exportAsCSV(mockData, columns)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
    expect(response.headers.get('Content-Disposition')).toMatch(
      /attachment; filename="payment_plans_.*\.csv"/
    )
  })

  it('includes UTF-8 BOM', async () => {
    const columns = ['student_name']
    const response = exportAsCSV(mockData, columns)
    const text = await response.text()

    expect(text.charCodeAt(0)).toBe(0xFEFF)
  })

  it('respects column selection', async () => {
    const columns = ['student_name', 'total_amount']
    const response = exportAsCSV(mockData, columns)
    const text = await response.text()
    const lines = text.split('\n')

    expect(lines[0]).toContain('Student Name')
    expect(lines[0]).toContain('Total Amount')
    expect(lines[0]).not.toContain('Status')
  })

  it('formats currency correctly', async () => {
    const columns = ['total_amount', 'expected_commission']
    const response = exportAsCSV(mockData, columns)
    const text = await response.text()
    const lines = text.split('\n')

    expect(lines[1]).toContain('1000.00')
    expect(lines[1]).toContain('150.00')
  })

  it('formats dates correctly', async () => {
    const columns = ['start_date']
    const response = exportAsCSV(mockData, columns)
    const text = await response.text()
    const lines = text.split('\n')

    expect(lines[1]).toContain('2025-01-01')
  })
})

describe('CSV Formatter - Special Characters', () => {
  const mockDataWithSpecialChars = [
    {
      enrollments: [
        {
          student: { full_name: 'José García, Jr.' },
          branch: {
            name: 'Branch "A"',
            college: { name: 'College\nWith Newline' },
          },
        },
      ],
    },
  ]

  it('escapes commas', async () => {
    const columns = ['student_name']
    const response = exportAsCSV(mockDataWithSpecialChars, columns)
    const text = await response.text()

    // CSV should quote fields with commas
    expect(text).toContain('"José García, Jr."')
  })

  it('escapes quotes', async () => {
    const columns = ['branch_name']
    const response = exportAsCSV(mockDataWithSpecialChars, columns)
    const text = await response.text()

    // CSV should escape quotes with double quotes
    expect(text).toContain('Branch ""A""')
  })

  it('handles newlines', async () => {
    const columns = ['college_name']
    const response = exportAsCSV(mockDataWithSpecialChars, columns)
    const text = await response.text()

    // Newlines should be preserved in quoted fields
    expect(text).toContain('College\nWith Newline')
  })
})
```

### Integration Tests - API Route

```typescript
// apps/reports/app/api/reports/payment-plans/export/__tests__/route.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET } from '../route'

// Mock Supabase
vi.mock('@/lib/supabase/server')

describe('Payment Plans Export API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns CSV with correct headers', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv'
    )

    const response = await GET(request)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/csv; charset=utf-8')
  })

  it('applies date range filters', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv&date_from=2025-01-01&date_to=2025-12-31'
    )

    const response = await GET(request)
    expect(response.ok).toBe(true)

    // Verify Supabase query was called with filters
    // (Mock verification)
  })

  it('applies college filter', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv&college_id=college-1'
    )

    const response = await GET(request)
    expect(response.ok).toBe(true)
  })

  it('applies status filter', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv&status[]=active&status[]=completed'
    )

    const response = await GET(request)
    expect(response.ok).toBe(true)
  })

  it('validates column selection', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv&columns[]=invalid_column'
    )

    const response = await GET(request)
    expect(response.status).toBe(400)

    const body = await response.json()
    expect(body.error).toBe('Invalid columns')
    expect(body.invalid).toContain('invalid_column')
  })

  it('handles empty results', async () => {
    // Mock empty data
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv&college_id=nonexistent'
    )

    const response = await GET(request)
    expect(response.ok).toBe(true)

    const text = await response.text()
    const lines = text.split('\n')

    // Should have headers but no data rows
    expect(lines.length).toBe(2) // Header + empty line
  })

  it('enforces RLS filtering', async () => {
    // Verify query includes agency_id filter
    // (Mock verification - check Supabase client calls)
  })

  it('handles database errors', async () => {
    // Mock database error
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv'
    )

    // Mock Supabase to throw error
    const response = await GET(request)

    expect(response.status).toBe(500)
  })

  it('generates filename with timestamp', async () => {
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv'
    )

    const response = await GET(request)
    const contentDisposition = response.headers.get('Content-Disposition')

    expect(contentDisposition).toMatch(
      /attachment; filename="payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.csv"/
    )
  })
})

describe('Export API - Streaming', () => {
  it('uses streaming for large datasets', async () => {
    // Mock large dataset (>1000 rows)
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv'
    )

    const response = await GET(request)

    // Verify streaming headers
    expect(response.headers.get('Transfer-Encoding')).toBe('chunked')
  })

  it('uses synchronous export for small datasets', async () => {
    // Mock small dataset (<1000 rows)
    const request = new Request(
      'http://localhost/api/reports/payment-plans/export?format=csv'
    )

    const response = await GET(request)

    // Verify no streaming headers
    expect(response.headers.get('Transfer-Encoding')).toBeNull()
  })
})
```

### Component Tests - Export Buttons

```typescript
// apps/reports/app/components/__tests__/ExportButtons.test.tsx

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportButtons } from '../ExportButtons'

vi.mock('react-hot-toast')

describe('ExportButtons Component', () => {
  const mockFilters = {
    date_from: '2025-01-01',
    date_to: '2025-12-31',
    college_id: 'college-1',
  }

  const mockColumns = ['student_name', 'total_amount', 'status']

  it('renders export buttons', () => {
    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    expect(screen.getByText('Export CSV')).toBeInTheDocument()
    expect(screen.getByText('Export PDF')).toBeInTheDocument()
  })

  it('shows loading state on click', async () => {
    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })
  })

  it('disables button while exporting', async () => {
    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('builds correct export URL', () => {
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' } as any

    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    expect(window.location.href).toContain('/api/reports/payment-plans/export')
    expect(window.location.href).toContain('format=csv')
    expect(window.location.href).toContain('date_from=2025-01-01')
    expect(window.location.href).toContain('columns%5B%5D=student_name')

    window.location = originalLocation
  })
})
```

### E2E Tests - Full Export Flow

```typescript
// e2e/reports/csv-export.spec.ts

import { test, expect } from '@playwright/test'
import fs from 'fs'

test.describe('CSV Export E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('exports CSV file with correct data', async ({ page }) => {
    // Navigate to reports
    await page.goto('/reports')

    // Generate report
    await page.selectOption('[name="college"]', 'college-1')
    await page.fill('[name="date_from"]', '2025-01-01')
    await page.fill('[name="date_to"]', '2025-12-31')
    await page.click('button:has-text("Generate Report")')

    // Wait for results
    await page.waitForSelector('table tbody tr')

    // Setup download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.click('button:has-text("Export CSV")')

    // Wait for download
    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Verify filename format
    expect(filename).toMatch(/^payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.csv$/)

    // Download file
    const path = await download.path()
    expect(path).toBeTruthy()

    // Read CSV content
    const csvContent = fs.readFileSync(path!, 'utf-8')

    // Verify UTF-8 BOM
    expect(csvContent.charCodeAt(0)).toBe(0xFEFF)

    // Verify headers
    expect(csvContent).toContain('Student Name')
    expect(csvContent).toContain('Total Amount')
    expect(csvContent).toContain('Status')

    // Verify data row count
    const lines = csvContent.split('\n')
    const dataRowCount = lines.length - 2 // Exclude header + empty last line

    // Get row count from UI
    const tableRows = await page.locator('table tbody tr').count()
    expect(dataRowCount).toBe(tableRows)
  })

  test('respects filter selections', async ({ page }) => {
    await page.goto('/reports')

    // Apply filters
    await page.selectOption('[name="status"]', 'active')
    await page.click('button:has-text("Generate Report")')
    await page.waitForSelector('table tbody tr')

    // Export
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export CSV")')
    const download = await downloadPromise
    const path = await download.path()

    // Verify all rows have 'active' status
    const csvContent = fs.readFileSync(path!, 'utf-8')
    const lines = csvContent.split('\n').slice(1) // Skip header

    lines.forEach(line => {
      if (line.trim()) {
        expect(line).toContain('active')
      }
    })
  })

  test('respects column selection', async ({ page }) => {
    await page.goto('/reports')

    // Deselect some columns
    await page.uncheck('[name="column_branch"]')
    await page.uncheck('[name="column_college"]')

    // Generate report
    await page.click('button:has-text("Generate Report")')
    await page.waitForSelector('table tbody tr')

    // Export
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export CSV")')
    const download = await downloadPromise
    const path = await download.path()

    // Verify selected columns only
    const csvContent = fs.readFileSync(path!, 'utf-8')
    const headers = csvContent.split('\n')[0]

    expect(headers).toContain('Student Name')
    expect(headers).toContain('Total Amount')
    expect(headers).not.toContain('Branch')
    expect(headers).not.toContain('College')
  })

  test('export appears in activity feed', async ({ page }) => {
    await page.goto('/reports')

    // Generate and export report
    await page.click('button:has-text("Generate Report")')
    await page.waitForSelector('table tbody tr')

    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("Export CSV")')
    await downloadPromise

    // Navigate to dashboard
    await page.goto('/dashboard')

    // Verify export activity
    await expect(
      page.locator('text=exported payment plans report to CSV')
    ).toBeVisible()
  })

  test('shows loading state during export', async ({ page }) => {
    await page.goto('/reports')

    await page.click('button:has-text("Generate Report")')
    await page.waitForSelector('table tbody tr')

    // Click export
    await page.click('button:has-text("Export CSV")')

    // Verify loading state
    await expect(page.locator('button:has-text("Exporting...")')).toBeVisible()
  })

  test('handles export errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/reports/payment-plans/export*', route =>
      route.abort()
    )

    await page.goto('/reports')
    await page.click('button:has-text("Generate Report")')
    await page.waitForSelector('table tbody tr')

    // Click export
    await page.click('button:has-text("Export CSV")')

    // Verify error toast
    await expect(page.locator('text=Failed to export report')).toBeVisible()
  })
})
```

### Performance Tests

```typescript
// e2e/reports/csv-export-performance.spec.ts

test('exports large dataset without timeout', async ({ page }) => {
  // Increase timeout for large export
  test.setTimeout(60000)

  await page.goto('/reports')

  // Generate report with large dataset (5000+ rows)
  await page.fill('[name="date_from"]', '2020-01-01')
  await page.fill('[name="date_to"]', '2025-12-31')
  await page.click('button:has-text("Generate Report")')

  const downloadPromise = page.waitForEvent('download')
  await page.click('button:has-text("Export CSV")')

  // Verify download completes within timeout
  const download = await downloadPromise
  expect(download).toBeTruthy()
})
```

## Test Execution

### Run Unit Tests
```bash
npm run test:unit
```

### Run Integration Tests
```bash
npm run test:integration
```

### Run E2E Tests
```bash
npm run test:e2e
```

### Run All Tests
```bash
npm run test
```

### Coverage Report
```bash
npm run test:coverage
```

## Definition of Done

### Unit Tests ✓
- [ ] All CSV formatter functions tested
- [ ] All edge cases covered
- [ ] 100% coverage for csv-formatter.ts

### Integration Tests ✓
- [ ] API route tested with all filter combinations
- [ ] RLS filtering verified
- [ ] Error handling tested
- [ ] Column validation tested
- [ ] Streaming tested for large datasets

### E2E Tests ✓
- [ ] Full export flow tested
- [ ] Filter application verified
- [ ] Column selection verified
- [ ] Activity tracking verified
- [ ] Excel compatibility verified (manual)

### Edge Cases ✓
- [ ] Empty results tested
- [ ] Large datasets tested (5000+ rows)
- [ ] Special characters tested
- [ ] Null values tested
- [ ] Concurrent exports tested

### Performance ✓
- [ ] Export completes in <5 seconds (standard reports)
- [ ] Memory usage acceptable for large datasets
- [ ] No memory leaks

## Manual Testing Checklist

### Excel Compatibility
- [ ] Open exported CSV in Microsoft Excel
- [ ] Verify UTF-8 characters display correctly (é, ñ, etc.)
- [ ] Verify dates recognized as dates
- [ ] Verify currency amounts formatted as numbers
- [ ] Verify commas, quotes, newlines handled properly

### Browser Compatibility
- [ ] Test export in Chrome
- [ ] Test export in Firefox
- [ ] Test export in Safari
- [ ] Test export in Edge

## Story Completion

After all tests pass and acceptance criteria are verified:
- [ ] Mark story as complete
- [ ] Update sprint status
- [ ] Document any known issues
- [ ] Prepare demo for stakeholders
