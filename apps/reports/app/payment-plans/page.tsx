/**
 * Payment Plans Report Page
 *
 * Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 5: Integrate Report Builder and Results
 *
 * Features:
 * - ReportBuilder for filter configuration
 * - ReportResultsTable for displaying results
 * - TanStack Query for server state management
 * - Toast notifications for success/error feedback
 * - Collapsible builder after first run
 * - Reset filters functionality
 * - Pagination and sorting with API calls
 */

'use client'

import { useState } from 'react'
import { ReportBuilder } from '../components/ReportBuilder'
import { ReportResultsTable } from '../components/ReportResultsTable'
import { usePaymentPlansReport } from '../hooks/usePaymentPlansReport'
import { useToast } from '@pleeno/ui'
import type { ReportBuilderFormData } from '../validations/report-builder.schema'
import type { PaymentPlansReportRequest } from '../types/payment-plans-report'
import { Button } from '@pleeno/ui'
import { ChevronDown, ChevronUp } from 'lucide-react'

export default function PaymentPlansReportPage() {
  const mutation = usePaymentPlansReport()
  const { addToast } = useToast()
  const [isBuilderCollapsed, setIsBuilderCollapsed] = useState(false)
  const [currentRequest, setCurrentRequest] = useState<PaymentPlansReportRequest | null>(null)

  /**
   * Handle report generation from ReportBuilder
   */
  const handleGenerate = (formData: ReportBuilderFormData) => {
    const request: PaymentPlansReportRequest = {
      filters: formData.filters,
      columns: formData.columns,
      pagination: formData.pagination,
      sort: formData.sort,
    }

    setCurrentRequest(request)

    mutation.mutate(request, {
      onSuccess: () => {
        setIsBuilderCollapsed(true)
        addToast({
          title: 'Report Generated',
          description: 'Your payment plans report has been generated successfully.',
          variant: 'success',
        })
      },
      onError: (error: Error) => {
        addToast({
          title: 'Generation Failed',
          description: error.message || 'Failed to generate report. Please try again.',
          variant: 'error',
        })
      },
    })
  }

  /**
   * Handle pagination change - triggers new API call
   */
  const handlePageChange = (page: number) => {
    if (!currentRequest) return

    const updatedRequest: PaymentPlansReportRequest = {
      ...currentRequest,
      pagination: {
        ...currentRequest.pagination,
        page,
      },
    }

    setCurrentRequest(updatedRequest)
    mutation.mutate(updatedRequest, {
      onError: (error: Error) => {
        addToast({
          title: 'Failed to Load Page',
          description: error.message || 'Failed to load page. Please try again.',
          variant: 'error',
        })
      },
    })
  }

  /**
   * Handle page size change - triggers new API call
   */
  const handlePageSizeChange = (pageSize: number) => {
    if (!currentRequest) return

    const updatedRequest: PaymentPlansReportRequest = {
      ...currentRequest,
      pagination: {
        page: 1, // Reset to first page when changing page size
        page_size: pageSize,
      },
    }

    setCurrentRequest(updatedRequest)
    mutation.mutate(updatedRequest, {
      onError: (error: Error) => {
        addToast({
          title: 'Failed to Update Page Size',
          description: error.message || 'Failed to update page size. Please try again.',
          variant: 'error',
        })
      },
    })
  }

  /**
   * Handle sorting change - triggers new API call
   */
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    if (!currentRequest) return

    const updatedRequest: PaymentPlansReportRequest = {
      ...currentRequest,
      sort: { column, direction },
      pagination: {
        ...currentRequest.pagination,
        page: 1, // Reset to first page when sorting changes
      },
    }

    setCurrentRequest(updatedRequest)
    mutation.mutate(updatedRequest, {
      onError: (error: Error) => {
        addToast({
          title: 'Failed to Sort',
          description: error.message || 'Failed to sort results. Please try again.',
          variant: 'error',
        })
      },
    })
  }

  /**
   * Handle reset filters - clears form and hides results
   */
  const handleResetFilters = () => {
    setIsBuilderCollapsed(false)
    setCurrentRequest(null)
    mutation.reset()
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment Plans Report</h1>
        <p className="text-muted-foreground">
          Generate custom reports with contract expiration tracking and commission breakdowns.
        </p>
      </div>

      {/* Report Builder - Collapsible after first run */}
      <div className="space-y-4">
        {isBuilderCollapsed && mutation.isSuccess && (
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <h2 className="font-semibold">Filters Applied</h2>
              <p className="text-sm text-muted-foreground">
                {mutation.data.pagination.total_count} results found
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsBuilderCollapsed(false)}>
                <ChevronDown className="h-4 w-4 mr-2" />
                Modify Filters
              </Button>
              <Button variant="outline" size="sm" onClick={handleResetFilters}>
                Reset Filters
              </Button>
            </div>
          </div>
        )}

        {!isBuilderCollapsed && <ReportBuilder onGenerate={handleGenerate} />}

        {!isBuilderCollapsed && mutation.isSuccess && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsBuilderCollapsed(true)}
            className="w-full"
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Hide Filters
          </Button>
        )}
      </div>

      {/* Loading State */}
      {mutation.isPending && (
        <div className="flex items-center justify-center py-12">
          <div className="space-y-4 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
            <p className="text-muted-foreground">Generating report...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {mutation.isError && !mutation.isPending && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6 text-center space-y-4">
          <div>
            <h3 className="font-semibold text-destructive">Failed to Generate Report</h3>
            <p className="text-sm text-muted-foreground mt-2">{mutation.error.message}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => currentRequest && mutation.mutate(currentRequest)}
          >
            Try Again
          </Button>
        </div>
      )}

      {/* Results Table - Appears after successful generation */}
      {mutation.isSuccess && mutation.data && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">Report Results</h2>
              <p className="text-sm text-muted-foreground">
                Preview mode - read-only table display
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" disabled>
                Export to CSV
              </Button>
              <Button variant="outline" disabled>
                Export to PDF
              </Button>
            </div>
          </div>

          <ReportResultsTable
            data={mutation.data.data}
            pagination={mutation.data.pagination}
            summary={mutation.data.summary}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSort={handleSort}
            isLoading={mutation.isPending}
          />
        </div>
      )}

      {/* Empty State - No report generated yet */}
      {!mutation.isSuccess && !mutation.isPending && !mutation.isError && (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            Configure your filters above and click &quot;Generate Report&quot; to view results.
          </p>
        </div>
      )}
    </div>
  )
}
