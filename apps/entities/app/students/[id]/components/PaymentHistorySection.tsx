/**
 * Payment History Section Component
 *
 * Story 7.5: Student Payment History Report
 * Task 6: Add Date Range Filtering
 *
 * This component displays a student's payment history with comprehensive
 * date range filtering and export functionality.
 *
 * Features:
 * - Display payment history grouped by payment plan
 * - Date range filtering (All time, This year, Custom)
 * - Active filter display
 * - Refresh functionality
 * - Loading states
 * - Empty state handling
 * - Export to PDF button
 * - Summary totals
 */

'use client'

import { useState, useEffect } from 'react'
import { FileDown, RefreshCw, Calendar } from 'lucide-react'
import { Button } from '@pleeno/ui'
import { getApiUrl } from '@/hooks/useApiUrl'
import { format, startOfYear, endOfYear } from 'date-fns'

interface PaymentHistorySectionProps {
  studentId: string
}

type DateFilter = 'all' | 'thisYear' | 'custom'

interface Installment {
  installment_id: string
  installment_number: number
  amount: number
  due_date: string
  paid_at: string | null
  paid_amount: number | null
  status: string
}

interface PaymentPlan {
  payment_plan_id: string
  college_name: string
  branch_name: string
  program_name: string
  plan_total_amount: number
  plan_start_date: string
  plan_status: string
  installments: Installment[]
}

interface Summary {
  total_paid: number
  total_outstanding: number
  percentage_paid: number
}

export function PaymentHistorySection({
  studentId,
}: PaymentHistorySectionProps) {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')
  const [customDateFrom, setCustomDateFrom] = useState<string>('')
  const [customDateTo, setCustomDateTo] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [paymentHistory, setPaymentHistory] = useState<PaymentPlan[]>([])
  const [summary, setSummary] = useState<Summary>({
    total_paid: 0,
    total_outstanding: 0,
    percentage_paid: 0,
  })
  const [error, setError] = useState<string | null>(null)

  /**
   * Calculate date range based on filter
   * Returns date_from and date_to parameters for API
   */
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
        if (customDateFrom && customDateTo && isCustomRangeValid()) {
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

  /**
   * Get display text for active filter
   * Shows user-friendly description of current date filter
   */
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

  /**
   * Validate custom date range
   * Ensures start date is before or equal to end date
   */
  const isCustomRangeValid = (): boolean => {
    if (!customDateFrom || !customDateTo) return false
    return new Date(customDateFrom) <= new Date(customDateTo)
  }

  /**
   * Fetch payment history from API
   * Includes date range parameters based on current filter
   */
  const fetchPaymentHistory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const dateRange = getDateRange()
      const params = new URLSearchParams()

      if (dateRange.date_from) params.set('date_from', dateRange.date_from)
      if (dateRange.date_to) params.set('date_to', dateRange.date_to)

      const response = await fetch(
        getApiUrl(`/api/students/${studentId}/payment-history?${params}`)
      )

      if (!response.ok) {
        throw new Error('Failed to fetch payment history')
      }

      const result = await response.json()
      setPaymentHistory(result.data || [])
      setSummary(result.summary)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setError('Failed to load payment history. Please try again.')
      setPaymentHistory([])
      setSummary({
        total_paid: 0,
        total_outstanding: 0,
        percentage_paid: 0,
      })
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Fetch on mount and when filter changes
   * Triggers new API call whenever date filter or custom dates change
   */
  useEffect(() => {
    fetchPaymentHistory()
  }, [dateFilter, customDateFrom, customDateTo])

  /**
   * Handle date filter change
   * Resets custom dates when switching away from custom mode
   */
  const handleDateFilterChange = (filter: DateFilter) => {
    setDateFilter(filter)

    // Reset custom dates when switching away from custom
    if (filter !== 'custom') {
      setCustomDateFrom('')
      setCustomDateTo('')
    }
  }

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
      const dateRange = getDateRange()
      if (dateRange.date_from) params.set('date_from', dateRange.date_from)
      if (dateRange.date_to) params.set('date_to', dateRange.date_to)

      // Trigger download
      const url = getApiUrl(`/api/students/${studentId}/payment-history/export?${params}`)
      window.open(url, '_blank')
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  /**
   * Format currency for display
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount)
  }

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return 'N/A'
    return format(new Date(dateStr), 'MMM d, yyyy')
  }

  /**
   * Get status badge color
   */
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Payment History</h2>

        <div className="flex items-center gap-4">
          {/* Date Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Period:</label>
            <select
              value={dateFilter}
              onChange={(e) =>
                handleDateFilterChange(e.target.value as DateFilter)
              }
              className="border rounded-md px-3 py-1.5 text-sm"
              disabled={isLoading}
            >
              <option value="all">All Time</option>
              <option value="thisYear">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Action Buttons */}
          <Button
            onClick={fetchPaymentHistory}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button
            onClick={handleExportPDF}
            disabled={
              isLoading ||
              isExporting ||
              paymentHistory.length === 0 ||
              (dateFilter === 'custom' && !isCustomRangeValid())
            }
            size="sm"
            className="flex items-center gap-2"
          >
            <FileDown className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {/* Custom Date Range Inputs */}
      {dateFilter === 'custom' && (
        <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label htmlFor="date-from" className="text-sm font-medium">
                From:
              </label>
              <input
                id="date-from"
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                max={customDateTo || undefined}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="date-to" className="text-sm font-medium">
                To:
              </label>
              <input
                id="date-to"
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                min={customDateFrom || undefined}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {!isCustomRangeValid() && customDateFrom && customDateTo && (
              <p className="text-sm text-red-600">
                Invalid date range: Start date must be before or equal to end date
              </p>
            )}
          </div>
        </div>
      )}

      {/* Active Filter Display */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          {getFilterDisplayText()}
        </p>
        {paymentHistory.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {paymentHistory.length} payment plan{paymentHistory.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <p className="text-sm text-muted-foreground">Loading payment history...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && paymentHistory.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            No payment history available for selected date range
          </p>
          {dateFilter !== 'all' && (
            <Button
              variant="link"
              onClick={() => handleDateFilterChange('all')}
              className="mt-2"
            >
              View all payment history
            </Button>
          )}
        </div>
      )}

      {/* Payment History Display */}
      {!isLoading && !error && paymentHistory.length > 0 && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium mb-1">
                Total Paid
              </p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {formatCurrency(summary.total_paid)}
              </p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium mb-1">
                Total Outstanding
              </p>
              <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {formatCurrency(summary.total_outstanding)}
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">
                Percentage Paid
              </p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {summary.percentage_paid.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Payment Plans */}
          <div className="space-y-6">
            {paymentHistory.map((plan) => (
              <div
                key={plan.payment_plan_id}
                className="border rounded-lg p-4 space-y-4"
              >
                {/* Payment Plan Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {plan.college_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {plan.branch_name} • {plan.program_name}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Started: {formatDate(plan.plan_start_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold">
                      {formatCurrency(plan.plan_total_amount)}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                        plan.plan_status
                      )}`}
                    >
                      {plan.plan_status}
                    </span>
                  </div>
                </div>

                {/* Installments Table */}
                {plan.installments.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">#</th>
                          <th className="px-3 py-2 text-left font-medium">Due Date</th>
                          <th className="px-3 py-2 text-left font-medium">Amount</th>
                          <th className="px-3 py-2 text-left font-medium">Paid Amount</th>
                          <th className="px-3 py-2 text-left font-medium">Paid Date</th>
                          <th className="px-3 py-2 text-left font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {plan.installments.map((inst) => (
                          <tr key={inst.installment_id} className="hover:bg-muted/50">
                            <td className="px-3 py-2">{inst.installment_number}</td>
                            <td className="px-3 py-2">{formatDate(inst.due_date)}</td>
                            <td className="px-3 py-2 font-medium">
                              {formatCurrency(inst.amount)}
                            </td>
                            <td className="px-3 py-2">
                              {inst.paid_amount
                                ? formatCurrency(inst.paid_amount)
                                : '-'}
                            </td>
                            <td className="px-3 py-2">{formatDate(inst.paid_at)}</td>
                            <td className="px-3 py-2">
                              <span
                                className={`inline-block px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                  inst.status
                                )}`}
                              >
                                {inst.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {plan.installments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No installments found
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
