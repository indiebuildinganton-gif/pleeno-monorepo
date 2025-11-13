# Story 7-5: Student Payment History Report - Task 6

**Story**: Student Payment History Report
**Task**: Add Date Range Filtering
**Acceptance Criteria**: AC #6

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Implement comprehensive date range filtering for the payment history view, including preset filters (All Time, This Year) and custom date range selection. This task enhances both the UI from Task 1 and integrates with the API from Task 2.

## Subtasks Checklist

- [ ] Add date range filter UI to Payment History section:
  - Preset buttons: "All Time", "This Year", "Custom"
  - Date picker inputs for custom range (date_from, date_to)
  - Default to "All Time"
- [ ] When filter changes:
  - Update API call with date_from and date_to params
  - Reload payment history data
  - Update summary totals based on filtered data
- [ ] Display active filter: "Showing: All Time" or "Showing: Jan 1, 2025 - Dec 31, 2025"
- [ ] Test: Select "This Year" → See only current year installments
- [ ] Test: Select "Custom" and enter range → See filtered results

## Acceptance Criteria

**AC #6**: And I can filter by date range (all time, this year, custom)

## Context & Constraints

### Key Constraints
- **Date Inclusivity**: Filter should include installments where due_date is between date_from and date_to (inclusive)
- **UI Feedback**: Show active filter clearly to user
- **API Integration**: Date parameters must be passed to both payment history API and PDF export API
- **Validation**: Custom date range must have valid start and end dates (start <= end)

### Design Pattern

Three-tier filtering approach:
1. **All Time**: No date filtering (default)
2. **This Year**: Automatic range from Jan 1 to Dec 31 of current year
3. **Custom**: User-selected date range with date pickers

### Dependencies

**Required NPM Packages:**
- `react` (19) - React hooks for state management
- `date-fns` (^4.1.0) - Date manipulation and formatting
- Date picker component (from UI library or custom)

**Related Components:**
- PaymentHistorySection (Task 1) - Component to enhance
- Payment history API (Task 2) - API to integrate with

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context

## Implementation Guidelines

### Step 1: Update PaymentHistorySection Component

**File**: `apps/entities/app/students/[id]/components/PaymentHistorySection.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { FileDown, RefreshCw, Calendar } from 'lucide-react'
import { format, startOfYear, endOfYear } from 'date-fns'

interface PaymentHistorySectionProps {
  studentId: string
}

type DateFilter = 'all' | 'thisYear' | 'custom'

export function PaymentHistorySection({ studentId }: PaymentHistorySectionProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [summary, setSummary] = useState({
    total_paid: 0,
    total_outstanding: 0,
    percentage_paid: 0,
  })

  // Calculate date range based on filter
  const getDateRange = (): { date_from?: string; date_to?: string } => {
    const today = new Date()

    switch (dateFilter) {
      case 'all':
        return {} // No date filtering

      case 'thisYear':
        return {
          date_from: format(startOfYear(today), 'yyyy-MM-dd'),
          date_to: format(endOfYear(today), 'yyyy-MM-dd'),
        }

      case 'custom':
        if (customDateFrom && customDateTo) {
          return {
            date_from: customDateFrom,
            date_to: customDateTo,
          }
        }
        return {}

      default:
        return {}
    }
  }

  // Get display text for active filter
  const getFilterDisplayText = (): string => {
    const dateRange = getDateRange()

    if (!dateRange.date_from && !dateRange.date_to) {
      return 'Showing: All Time'
    }

    if (dateFilter === 'thisYear') {
      return `Showing: This Year (${new Date().getFullYear()})`
    }

    if (dateFilter === 'custom' && dateRange.date_from && dateRange.date_to) {
      const fromDate = format(new Date(dateRange.date_from), 'MMM d, yyyy')
      const toDate = format(new Date(dateRange.date_to), 'MMM d, yyyy')
      return `Showing: ${fromDate} - ${toDate}`
    }

    return 'Showing: All Time'
  }

  // Fetch payment history
  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true)

      const dateRange = getDateRange()
      const params = new URLSearchParams()

      if (dateRange.date_from) params.set('date_from', dateRange.date_from)
      if (dateRange.date_to) params.set('date_to', dateRange.date_to)

      const response = await fetch(
        `/api/students/${studentId}/payment-history?${params}`
      )

      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }

      const result = await response.json()
      setPaymentHistory(result.data)
      setSummary(result.summary)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      // Show error toast or notification
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchPaymentHistory()
  }, [dateFilter, customDateFrom, customDateTo])

  // Handle date filter change
  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)

    // Reset custom dates when switching away from custom
    if (filter !== 'custom') {
      setCustomDateFrom('')
      setCustomDateTo('')
    }
  }

  // Handle PDF export
  const handleExportPDF = async () => {
    try {
      setIsExporting(true)

      const dateRange = getDateRange()
      const params = new URLSearchParams({ format: 'pdf' })

      if (dateRange.date_from) params.set('date_from', dateRange.date_from)
      if (dateRange.date_to) params.set('date_to', dateRange.date_to)

      const url = `/api/students/${studentId}/payment-history/export?${params}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
      // Show error toast or notification
    } finally {
      setIsExporting(false)
    }
  }

  // Validate custom date range
  const isCustomRangeValid = (): boolean => {
    if (!customDateFrom || !customDateTo) return false
    return new Date(customDateFrom) <= new Date(customDateTo)
  }

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Payment History</h2>

        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleDateFilterChange('all')}
              className={`px-4 py-2 rounded-md transition-colors ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => handleDateFilterChange('thisYear')}
              className={`px-4 py-2 rounded-md transition-colors ${
                dateFilter === 'thisYear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => handleDateFilterChange('custom')}
              className={`px-4 py-2 rounded-md transition-colors flex items-center gap-2 ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Custom
            </button>
          </div>

          {/* Action Buttons */}
          <button
            onClick={fetchPaymentHistory}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || isExporting || paymentHistory.length === 0}
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {dateFilter === 'custom' && (
        <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <label htmlFor="date-from" className="text-sm font-medium text-gray-700">
              From:
            </label>
            <input
              id="date-from"
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              max={customDateTo || undefined}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="date-to" className="text-sm font-medium text-gray-700">
              To:
            </label>
            <input
              id="date-to"
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              min={customDateFrom || undefined}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {!isCustomRangeValid() && customDateFrom && customDateTo && (
            <p className="text-sm text-red-600">
              Invalid date range: Start date must be before end date
            </p>
          )}
        </div>
      )}

      {/* Active Filter Display */}
      <div className="text-sm text-gray-600 font-medium">
        {getFilterDisplayText()}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && paymentHistory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No payment history available for selected date range</p>
        </div>
      )}

      {/* Payment History Display */}
      {!isLoading && paymentHistory.length > 0 && (
        <PaymentHistoryTimeline
          paymentHistory={paymentHistory}
          summary={summary}
        />
      )}
    </div>
  )
}
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 6 as "Completed" with date
2. Test all date range filter scenarios
3. Move to `task-7-prompt.md` to refactor and reuse utilities
4. Task 7 focuses on consolidating shared code from Stories 7.2 and 7.4

## Testing Checklist

- [ ] "All Time" filter shows all payment history
- [ ] "This Year" filter shows only current year installments
- [ ] "Custom" filter shows date picker inputs
- [ ] Custom date range validation works (start <= end)
- [ ] Invalid date range shows error message
- [ ] API call includes correct date_from and date_to parameters
- [ ] Payment history reloads when filter changes
- [ ] Summary totals update based on filtered data
- [ ] Active filter displays correct text
- [ ] PDF export respects active filter
- [ ] Refresh button reloads data with current filter
- [ ] Empty state shows when no data in date range
- [ ] Loading state shows during data fetch
- [ ] Date inputs have proper min/max constraints
- [ ] No console errors or warnings
