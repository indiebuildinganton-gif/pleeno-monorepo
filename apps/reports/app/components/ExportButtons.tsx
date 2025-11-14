/**
 * Export Buttons Component
 *
 * Epic 7.2: CSV Export Functionality
 * Task 4: Add Export Button to Report UI
 *
 * Features:
 * - Export to CSV button with loading states
 * - Export to PDF button (placeholder for Story 7.3)
 * - Toast notifications for success/error feedback
 * - Activity logging for audit trail
 * - Integrates with current report filters and columns
 */

'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@pleeno/ui'
import { useToast } from '@pleeno/ui'
import type { PaymentPlansReportFilters } from '../types/payment-plans-report'

export interface ExportButtonsProps {
  filters: PaymentPlansReportFilters
  columns: string[]
  reportData?: any[] // For activity logging and user feedback
}

export function ExportButtons({ filters, columns, reportData }: ExportButtonsProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const { addToast } = useToast()

  const handleExportCSV = async () => {
    setIsExportingCSV(true)

    try {
      // Build export URL with filters and columns
      const url = new URL('/api/reports/payment-plans/export', window.location.origin)
      url.searchParams.set('format', 'csv')

      // Add date range filters
      if (filters.date_from) {
        url.searchParams.set('date_from', filters.date_from)
      }
      if (filters.date_to) {
        url.searchParams.set('date_to', filters.date_to)
      }

      // Add college filters (as multiple college_id params)
      if (filters.college_ids && filters.college_ids.length > 0) {
        filters.college_ids.forEach((id) => url.searchParams.append('college_id', id))
      }

      // Add branch filters (as multiple branch_id params)
      if (filters.branch_ids && filters.branch_ids.length > 0) {
        filters.branch_ids.forEach((id) => url.searchParams.append('branch_id', id))
      }

      // Add student filters (as multiple student_id params)
      if (filters.student_ids && filters.student_ids.length > 0) {
        filters.student_ids.forEach((id) => url.searchParams.append('student_id', id))
      }

      // Add status filters (as multiple status[] params)
      if (filters.status && filters.status.length > 0) {
        filters.status.forEach((s) => url.searchParams.append('status[]', s))
      }

      // Add contract expiration filters
      if (filters.contract_expiration_from) {
        url.searchParams.set('contract_expiration_from', filters.contract_expiration_from)
      }
      if (filters.contract_expiration_to) {
        url.searchParams.set('contract_expiration_to', filters.contract_expiration_to)
      }

      // Add selected columns (as multiple columns[] params)
      columns.forEach((col) => url.searchParams.append('columns[]', col))

      // Trigger download via browser
      // Using window.location.href for simple downloads
      // Alternative: Use fetch + blob for better error handling
      window.location.href = url.toString()

      // NOTE: Activity logging is handled server-side in the API route
      // (apps/reports/app/api/reports/payment-plans/export/route.ts)
      // Server-side logging is more reliable because:
      // 1. It logs after successful data fetch from database
      // 2. It has access to accurate row counts and applied filters
      // 3. It runs in the same transaction as the export
      // 4. window.location.href doesn't provide success/failure feedback for client-side logging
      //
      // If implementing client-side backup logging is required, consider switching to:
      // - fetch() + blob download for better error handling
      // - Or create a separate API endpoint for logging export attempts

      // Show success message
      addToast({
        title: 'Export Started',
        description: `Exporting ${reportData?.length || 0} rows to CSV. Download will begin shortly.`,
        variant: 'success',
      })
    } catch (error) {
      console.error('Export failed:', error)
      addToast({
        title: 'Export Failed',
        description: 'Failed to export report. Please try again.',
        variant: 'error',
      })
    } finally {
      // Reset loading state after a delay (since download happens in browser)
      setTimeout(() => {
        setIsExportingCSV(false)
      }, 2000)
    }
  }

  const handleExportPDF = async () => {
    // Placeholder for Story 7.3
    addToast({
      title: 'Coming Soon',
      description: 'PDF export functionality will be available soon.',
      variant: 'warning',
    })
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleExportCSV}
        disabled={isExportingCSV}
        variant="outline"
        size="sm"
        className="flex items-center"
        aria-label="Export report to CSV format"
      >
        {isExportingCSV ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
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
        aria-label="Export report to PDF format"
      >
        <Download className="mr-2 h-4 w-4" aria-hidden="true" />
        Export PDF
      </Button>
    </div>
  )
}
