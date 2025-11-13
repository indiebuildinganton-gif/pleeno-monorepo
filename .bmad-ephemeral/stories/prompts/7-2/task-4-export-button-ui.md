# Task 4: Add Export Button to Report UI

## Story Context
**Epic 7.2**: CSV Export Functionality
**User Story**: As an Agency User, I want to export reports to CSV format, so that I can import payment data into Excel or accounting software.

## Task Objective
Create the UI component with an "Export CSV" button that triggers the export API with current filters and columns, handles loading states, and provides user feedback.

## Acceptance Criteria Coverage
- AC #1: Click "Export to CSV" → CSV file downloads with all report data

## Implementation Requirements

### 1. Create Export Buttons Component
**Path**: `apps/reports/app/components/ExportButtons.tsx`

### 2. Button Placement
- Location: Top right of report results table
- Next to "Export to PDF" button (for future Story 7.3)
- Icon: Download icon (↓)
- Label: "Export CSV"

### 3. Functionality
- Trigger API call with current filters and columns
- Build URL with all query parameters
- Use `window.location.href` to trigger browser download
- Show loading spinner while export is processing
- Handle errors gracefully with toast notifications

### 4. User Feedback
- Loading state: Show spinner and "Exporting..." text
- Success: Show success toast "Report exported successfully"
- Error: Show error toast "Failed to export report"
- Disable button while export is in progress

## Subtasks Checklist
- [ ] Add "Export to CSV" button to report builder page
- [ ] Position next to "Export to PDF" button
- [ ] Add download icon
- [ ] Trigger API call with current filters and columns
- [ ] Show loading spinner while export is processing
- [ ] Handle errors gracefully with toast notifications
- [ ] Test: Click button → CSV downloads with correct data

## Technical Constraints
- **UX**: Show loading state during export
- **UX**: Provide clear error messages
- **Architecture**: Integrate with report builder state management
- **Security**: Pass filters securely via query params

## Dependencies
- `lucide-react`: For Download and Loader2 icons
- `react-hot-toast` or similar: For toast notifications (check existing toast library)
- Current report builder state/context

## Reference Implementation

### Export Buttons Component

```typescript
// apps/reports/app/components/ExportButtons.tsx

'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'react-hot-toast' // or your toast library
import { logActivity } from '@/packages/database/src/activity-logger'

export interface ReportFilters {
  date_from?: string
  date_to?: string
  college_id?: string
  branch_id?: string
  student_id?: string
  status?: string[]
  contract_expiration_from?: string
  contract_expiration_to?: string
}

interface ExportButtonsProps {
  filters: ReportFilters
  columns: string[]
  reportData?: any[] // For activity logging
}

export function ExportButtons({ filters, columns, reportData }: ExportButtonsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)

  const handleExportCSV = async () => {
    setIsExportingCSV(true)

    try {
      // Build export URL with filters and columns
      const url = new URL('/api/reports/payment-plans/export', window.location.origin)
      url.searchParams.set('format', 'csv')

      // Add filters
      if (filters.date_from) {
        url.searchParams.set('date_from', filters.date_from)
      }
      if (filters.date_to) {
        url.searchParams.set('date_to', filters.date_to)
      }
      if (filters.college_id) {
        url.searchParams.set('college_id', filters.college_id)
      }
      if (filters.branch_id) {
        url.searchParams.set('branch_id', filters.branch_id)
      }
      if (filters.student_id) {
        url.searchParams.set('student_id', filters.student_id)
      }
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach(s => url.searchParams.append('status[]', s))
      }
      if (filters.contract_expiration_from) {
        url.searchParams.set('contract_expiration_from', filters.contract_expiration_from)
      }
      if (filters.contract_expiration_to) {
        url.searchParams.set('contract_expiration_to', filters.contract_expiration_to)
      }

      // Add selected columns
      columns.forEach(col => url.searchParams.append('columns[]', col))

      // Trigger download via browser
      window.location.href = url.toString()

      // Log activity (Task 5 integration)
      if (reportData) {
        await logActivity({
          entity_type: 'report',
          action: 'exported',
          description: `Exported payment plans report to CSV (${reportData.length} rows)`,
          metadata: {
            report_type: 'payment_plans',
            format: 'csv',
            row_count: reportData.length,
            filters,
          },
        })
      }

      // Show success message
      toast.success('Report exported successfully')
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export report. Please try again.')
    } finally {
      // Reset loading state after a delay (since download happens in browser)
      setTimeout(() => {
        setIsExportingCSV(false)
      }, 2000)
    }
  }

  const handleExportPDF = async () => {
    // Placeholder for Story 7.3
    toast.error('PDF export coming soon')
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportCSV}
        disabled={isExportingCSV}
        variant="outline"
        size="sm"
        className="flex items-center"
      >
        {isExportingCSV ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </>
        )}
      </Button>

      <Button
        onClick={handleExportPDF}
        disabled={isExportingPDF}
        variant="outline"
        size="sm"
        className="flex items-center"
      >
        <Download className="mr-2 h-4 w-4" />
        Export PDF
      </Button>
    </div>
  )
}
```

### Integration with Report Builder

```typescript
// apps/reports/app/page.tsx or similar report builder page

import { ExportButtons } from './components/ExportButtons'

export default function ReportBuilderPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: '2025-01-01',
    date_to: '2025-12-31',
  })

  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'student_name',
    'college_name',
    'branch_name',
    'total_amount',
    'status',
  ])

  const [reportData, setReportData] = useState<any[]>([])

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Payment Plans Report</h1>

        {/* Export buttons */}
        <ExportButtons
          filters={filters}
          columns={selectedColumns}
          reportData={reportData}
        />
      </div>

      {/* Report filters and results */}
      {/* ... */}
    </div>
  )
}
```

### Alternative: Fetch-based Download (if window.location doesn't work)

```typescript
const handleExportCSV = async () => {
  setIsExportingCSV(true)

  try {
    // Build URL same as above
    const url = new URL('/api/reports/payment-plans/export', window.location.origin)
    // ... add params

    // Fetch the CSV file
    const response = await fetch(url.toString())

    if (!response.ok) {
      throw new Error('Export failed')
    }

    // Get the blob
    const blob = await response.blob()

    // Extract filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition')
    const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
    const filename = filenameMatch?.[1] || 'payment_plans_export.csv'

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(downloadUrl)

    toast.success('Report exported successfully')
  } catch (error) {
    console.error('Export failed:', error)
    toast.error('Failed to export report')
  } finally {
    setIsExportingCSV(false)
  }
}
```

## Testing Requirements

### Component Tests
```typescript
// apps/reports/app/components/__tests__/ExportButtons.test.tsx

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportButtons } from '../ExportButtons'
import { toast } from 'react-hot-toast'

vi.mock('react-hot-toast')

describe('ExportButtons', () => {
  const mockFilters = {
    date_from: '2025-01-01',
    date_to: '2025-12-31',
    college_id: 'college-1',
  }

  const mockColumns = ['student_name', 'total_amount', 'status']

  it('renders CSV export button', () => {
    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    expect(screen.getByText('Export CSV')).toBeInTheDocument()
  })

  it('shows loading state when exporting', async () => {
    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    await waitFor(() => {
      expect(screen.getByText('Exporting...')).toBeInTheDocument()
    })
  })

  it('builds correct URL with filters', () => {
    const originalLocation = window.location
    delete (window as any).location
    window.location = { ...originalLocation, href: '' } as any

    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    expect(window.location.href).toContain('/api/reports/payment-plans/export')
    expect(window.location.href).toContain('format=csv')
    expect(window.location.href).toContain('date_from=2025-01-01')
    expect(window.location.href).toContain('college_id=college-1')
    expect(window.location.href).toContain('columns%5B%5D=student_name')

    window.location = originalLocation
  })

  it('disables button while exporting', async () => {
    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('handles export errors', async () => {
    // Mock fetch to throw error
    vi.spyOn(window, 'fetch').mockRejectedValueOnce(new Error('Network error'))

    render(<ExportButtons filters={mockFilters} columns={mockColumns} />)

    const button = screen.getByText('Export CSV')
    fireEvent.click(button)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to export report. Please try again.')
    })
  })
})
```

### E2E Test
```typescript
// e2e/reports/csv-export.spec.ts

import { test, expect } from '@playwright/test'

test.describe('CSV Export', () => {
  test('exports CSV file when clicking Export CSV button', async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')

    // Navigate to reports
    await page.goto('/reports')

    // Generate report
    await page.click('button:has-text("Generate Report")')
    await page.waitForSelector('table') // Wait for results

    // Setup download listener
    const downloadPromise = page.waitForEvent('download')

    // Click export button
    await page.click('button:has-text("Export CSV")')

    // Wait for download
    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Verify filename format
    expect(filename).toMatch(/^payment_plans_\d{4}-\d{2}-\d{2}_\d{6}\.csv$/)

    // Verify file downloads successfully
    const path = await download.path()
    expect(path).toBeTruthy()
  })

  test('shows loading state during export', async ({ page }) => {
    await page.goto('/reports')

    // Click export button
    await page.click('button:has-text("Export CSV")')

    // Verify loading state
    await expect(page.locator('button:has-text("Exporting...")')).toBeVisible()
  })
})
```

## UI/UX Checklist
- [ ] Button positioned top right of report results
- [ ] Download icon visible
- [ ] Button labeled "Export CSV"
- [ ] Loading spinner shows during export
- [ ] Button text changes to "Exporting..."
- [ ] Button disabled during export
- [ ] Success toast on successful export
- [ ] Error toast on failed export
- [ ] Works with all filter combinations
- [ ] Works with all column selections

## Accessibility Checklist
- [ ] Button has proper ARIA labels
- [ ] Loading state announced to screen readers
- [ ] Keyboard accessible (Tab + Enter)
- [ ] Focus visible during keyboard navigation
- [ ] Error messages accessible to screen readers

## Next Task
After completing this task, proceed to:
**Task 5: Add Export Tracking** - Log export events to activity log for audit trail.
