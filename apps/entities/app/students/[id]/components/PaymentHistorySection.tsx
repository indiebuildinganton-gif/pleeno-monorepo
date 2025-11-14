/**
 * Payment History Section Component
 *
 * Story 7.5: Student Payment History Report
 * Task 5: PDF Export Integration
 *
 * This component displays a student's payment history and provides
 * export functionality to download as PDF.
 *
 * Features:
 * - Display payment history grouped by payment plan
 * - Date range filtering (All time, This year, Custom)
 * - Export to PDF button
 * - Loading states
 * - Empty state handling
 */

'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@pleeno/ui'

interface PaymentHistorySectionProps {
  studentId: string
}

export function PaymentHistorySection({
  studentId,
}: PaymentHistorySectionProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [dateFilter, setDateFilter] = useState<'all' | 'thisYear' | 'custom'>(
    'all'
  )
  const [customDateFrom, setCustomDateFrom] = useState<string>('')
  const [customDateTo, setCustomDateTo] = useState<string>('')

  /**
   * Handle PDF export
   * Builds query parameters and triggers download via API route
   */
  const handleExportPDF = async () => {
    try {
      setIsExporting(true)

      // Build query params
      const params = new URLSearchParams({
        format: 'pdf',
      })

      // Add date filters based on selection
      if (dateFilter === 'thisYear') {
        const year = new Date().getFullYear()
        params.set('date_from', `${year}-01-01`)
        params.set('date_to', `${year}-12-31`)
      } else if (dateFilter === 'custom' && customDateFrom && customDateTo) {
        params.set('date_from', customDateFrom)
        params.set('date_to', customDateTo)
      }

      // Trigger download
      const url = `/api/students/${studentId}/payment-history/export?${params}`
      window.open(url, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
      // TODO: Show error toast or notification
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Payment History</h2>
        <div className="flex items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Period:</label>
            <select
              value={dateFilter}
              onChange={(e) =>
                setDateFilter(e.target.value as 'all' | 'thisYear' | 'custom')
              }
              className="border rounded-md px-3 py-1.5 text-sm"
            >
              <option value="all">All Time</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Inputs */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm"
                placeholder="From"
              />
              <span className="text-sm text-muted-foreground">to</span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="border rounded-md px-3 py-1.5 text-sm"
                placeholder="To"
              />
            </div>
          )}

          {/* Export PDF Button */}
          <Button
            onClick={handleExportPDF}
            disabled={
              isExporting ||
              (dateFilter === 'custom' && (!customDateFrom || !customDateTo))
            }
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Payment History Content */}
      <div className="space-y-4">
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">
            Payment history display is not yet implemented.
          </p>
          <p className="text-xs mt-2">
            Use the &quot;Export PDF&quot; button to download the complete payment statement.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 pt-6 border-t">
        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            How to use:
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
            <li>• Select a time period from the dropdown</li>
            <li>• Click &quot;Export PDF&quot; to download a payment statement</li>
            <li>• The PDF includes all payment plans and installments</li>
            <li>• Custom date ranges let you filter by specific periods</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
