/**
 * CashFlowChart Component
 *
 * Displays a visual chart showing projected cash flow for the next 90 days.
 * Shows paid vs expected payments using a stacked bar chart.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.2: Cash Flow Projection Chart
 * Task 2: Create CashFlowChart Component
 * Task 4: Add View Toggle Controls
 * Task 5: Implement Real-Time Updates
 * Task 6: Add Widget Header and Controls
 */

'use client'

import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getApiUrl } from '../hooks/useApiUrl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { format, addDays } from 'date-fns'
import { Button } from '@pleeno/ui'
import { RefreshCw } from 'lucide-react'
import { useDashboardStore, type CashFlowView } from '@pleeno/stores'
import { createClient } from '@pleeno/database/client'
import { useAuth } from '@pleeno/auth'

/**
 * Cash Flow Data Type
 */
interface CashFlowData {
  date_bucket: string // ISO date
  paid_amount: number
  expected_amount: number
  installment_count: number
  installments: Array<{
    student_name: string
    amount: number
    status: string
    due_date: string
  }>
}

/**
 * API Response Type
 */
interface CashFlowResponse {
  success: boolean
  data: CashFlowData[]
}

/**
 * Map CashFlowView to API groupBy parameter
 * Store uses: 'daily' | 'weekly' | 'monthly'
 * API expects: 'day' | 'week' | 'month'
 */
function mapViewToGroupBy(view: CashFlowView): 'day' | 'week' | 'month' {
  switch (view) {
    case 'daily':
      return 'day'
    case 'weekly':
      return 'week'
    case 'monthly':
      return 'month'
  }
}

/**
 * Format date based on groupBy parameter
 */
function formatDateLabel(dateStr: string, groupBy: string = 'week'): string {
  try {
    const date = new Date(dateStr)

    switch (groupBy) {
      case 'day':
        return format(date, 'MMM dd') // "Jan 15"
      case 'week':
        return format(date, 'MMM dd') // "Jan 15" (week start)
      case 'month':
        return format(date, 'MMM yyyy') // "Jan 2025"
      default:
        return format(date, 'MMM dd')
    }
  } catch {
    return dateStr
  }
}

/**
 * Format currency for Y-axis (compact format)
 */
function formatCurrencyCompact(value: number, currency: string = 'AUD'): string {
  // Use Intl.NumberFormat directly since formatCurrency from utils has conflicting signatures
  const formatter = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  
  if (value >= 1000000) {
    return formatter.format(value / 1000000).replace(/\.00/, '') + 'M'
  } else if (value >= 1000) {
    return formatter.format(value / 1000).replace(/\.00/, '') + 'K'
  }
  return formatter.format(value).replace(/\.00/, '')
}

/**
 * Format date range based on groupBy parameter
 */
function formatDateRange(dateStr: string, groupBy: string): string {
  try {
    const date = new Date(dateStr)

    switch (groupBy) {
      case 'day':
        return format(date, 'MMM dd, yyyy') // "Jan 15, 2025"
      case 'week': {
        // Show week range (e.g., "Jan 15-21, 2025")
        const weekEnd = new Date(date)
        weekEnd.setDate(date.getDate() + 6)
        return `${format(date, 'MMM dd')}-${format(weekEnd, 'dd, yyyy')}`
      }
      case 'month':
        return format(date, 'MMMM yyyy') // "January 2025"
      default:
        return format(date, 'MMM dd, yyyy')
    }
  } catch {
    return dateStr
  }
}

/**
 * Custom Tooltip Component
 */
interface TooltipPayload {
  payload: CashFlowData
  value: number
  name: string
  dataKey: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  currency?: string
  groupBy?: 'day' | 'week' | 'month'
}

function CustomTooltip({
  active,
  payload,
  label,
  currency = 'AUD',
  groupBy = 'week',
}: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload
  const { paid_amount, expected_amount, installment_count, installments, date_bucket } = data

  const totalAmount = paid_amount + expected_amount

  // Handle empty bucket
  if (!installments || installments.length === 0) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <div className="font-semibold text-gray-900 mb-1">
          {formatDateRange(date_bucket, groupBy)}
        </div>
        <div className="text-sm text-gray-600">No installments in this period</div>
      </div>
    )
  }

  // Get top 5 students
  const displayInstallments = installments.slice(0, 5)
  const remainingCount = installments.length - 5

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200 max-w-sm">
      {/* Date Range */}
      <div className="font-semibold text-gray-900 mb-2">
        {formatDateRange(date_bucket, groupBy)}
      </div>

      {/* Amounts */}
      <div className="space-y-1 mb-3 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Expected:</span>
          <span className="font-medium text-blue-600">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(expected_amount)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Paid:</span>
          <span className="font-medium text-green-600">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(paid_amount)}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-gray-900 font-medium">Total for Period:</span>
          <span className="font-bold text-gray-900">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(totalAmount)}
          </span>
        </div>
      </div>

      {/* Installment Count */}
      <div className="text-sm text-gray-600 mb-2">
        {installment_count} {installment_count === 1 ? 'installment' : 'installments'}
      </div>

      {/* Student List */}
      {displayInstallments.length > 0 && (
        <div className="border-t pt-2">
          <div className="text-xs font-medium text-gray-700 mb-1">Students:</div>
          <div className="space-y-1">
            {displayInstallments.map((inst, idx) => (
              <div key={idx} className="text-xs text-gray-600 flex justify-between gap-2">
                <span className="truncate">{inst.student_name}</span>
                <span className="whitespace-nowrap">
                  {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(inst.amount)}
                  <span
                    className={`ml-1 ${
                      inst.status === 'paid' ? 'text-green-600' : 'text-blue-600'
                    }`}
                  >
                    ({inst.status})
                  </span>
                </span>
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="text-xs text-gray-500 italic">
                ...and {remainingCount} more
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


/**
 * Main CashFlowChart Component
 */
interface CashFlowChartProps {
  days?: number
}

export function CashFlowChart({ days = 90 }: CashFlowChartProps) {
  // Get view selection from Zustand store
  const { cashFlowView, setCashFlowView } = useDashboardStore()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data, isLoading, isError, isFetching, refetch } = useQuery<CashFlowResponse>({
    queryKey: ['cash-flow-projection', cashFlowView, days],
    queryFn: async () => {
      const groupBy = mapViewToGroupBy(cashFlowView)
      const res = await fetch(
        getApiUrl(`/api/cash-flow-projection?groupBy=${groupBy}&days=${days}`)
      )
      if (!res.ok) {
        throw new Error('Failed to fetch cash flow projection')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchInterval: 5 * 60 * 1000, // Background refetch every 5 minutes
  })

  // Set up Supabase Realtime subscription for installments table changes
  useEffect(() => {
    const agencyId = user?.app_metadata?.agency_id
    if (!agencyId) return

    const supabase = createClient()

    // Subscribe to installments table changes for this agency
    const channel = supabase
      .channel('cash-flow-updates')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'installments',
          filter: `agency_id=eq.${agencyId}`,
        },
        (payload) => {
          console.log('Installment changed:', payload)
          // Invalidate query to trigger refetch
          queryClient.invalidateQueries({ queryKey: ['cash-flow-projection'] })
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.app_metadata?.agency_id, queryClient])

  const chartData = data?.data || []
  const currency = 'AUD' // TODO: Get from agency settings

  // Calculate summary metrics
  const totalExpected = chartData.reduce((sum, d) => sum + d.expected_amount, 0)
  const totalPaid = chartData.reduce((sum, d) => sum + d.paid_amount, 0)
  const netProjection = totalExpected + totalPaid

  // Calculate date range
  const today = new Date()
  const endDate = addDays(today, days)
  const dateRange = `${format(today, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Cash Flow Projection (Next {days} Days)
          </h2>
          <p className="text-sm text-gray-600 mt-1">{dateRange}</p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 transition-colors self-start"
          title="Refresh data"
        >
          <RefreshCw
            className={`w-5 h-5 text-gray-600 ${isFetching ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      {/* Summary Metrics */}
      {!isLoading && !isError && chartData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-sm text-blue-600 font-medium mb-1">Total Expected</div>
            <div className="text-2xl font-bold text-blue-900">
              {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(totalExpected)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-sm text-green-600 font-medium mb-1">Total Paid</div>
            <div className="text-2xl font-bold text-green-900">
              {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(totalPaid)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm text-purple-600 font-medium mb-1">Net Projection</div>
            <div className="text-2xl font-bold text-purple-900">
              {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(netProjection)}
            </div>
          </div>
        </div>
      )}

      {/* View Toggle Buttons */}
      <div className="flex flex-col sm:flex-row justify-end mb-4 gap-2">
        <Button
          variant={cashFlowView === 'daily' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCashFlowView('daily')}
        >
          Daily
        </Button>
        <Button
          variant={cashFlowView === 'weekly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCashFlowView('weekly')}
        >
          Weekly
        </Button>
        <Button
          variant={cashFlowView === 'monthly' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setCashFlowView('monthly')}
        >
          Monthly
        </Button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="w-full h-[400px] animate-pulse bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-500">Loading chart...</span>
        </div>
      )}

      {/* Error State */}
      {isError && (
        <div className="w-full p-8 text-center">
          <p className="text-red-600 mb-4">Unable to load cash flow projection</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !isError && chartData.length === 0 && (
        <div className="w-full p-12 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">
            No upcoming payments scheduled in the next {days} days
          </p>
          <p className="text-sm text-gray-500">
            Create payment plans to see cash flow projections
          </p>
        </div>
      )}

      {/* Chart */}
      {!isLoading && !isError && chartData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date_bucket"
              tickFormatter={(date) => formatDateLabel(date, cashFlowView)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyCompact(value, currency)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip currency={currency} groupBy={mapViewToGroupBy(cashFlowView)} />} />
            <Legend
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="rect"
            />

            {/* Paid Amount Bar (Green) */}
            <Bar
              dataKey="paid_amount"
              stackId="a"
              fill="#10b981"
              name="Paid"
              radius={[0, 0, 4, 4]}
            />

            {/* Expected Amount Bar (Blue) - Stacked on top */}
            <Bar
              dataKey="expected_amount"
              stackId="a"
              fill="#3b82f6"
              name="Expected"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
