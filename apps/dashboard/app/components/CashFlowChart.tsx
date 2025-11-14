/**
 * CashFlowChart Component
 *
 * Displays a visual chart showing projected cash flow for the next 90 days.
 * Shows paid vs expected payments using a stacked bar chart.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.2: Cash Flow Projection Chart
 * Task 2: Create CashFlowChart Component
 */

'use client'

import { useQuery } from '@tanstack/react-query'
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
import { format } from 'date-fns'
import { formatCurrency } from '@pleeno/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { AlertTriangle, RefreshCw } from 'lucide-react'

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
  if (value >= 1000000) {
    return formatCurrency(value / 1000000, currency, 'en-AU').replace(/\.00/, '') + 'M'
  } else if (value >= 1000) {
    return formatCurrency(value / 1000, currency, 'en-AU').replace(/\.00/, '') + 'K'
  }
  return formatCurrency(value, currency, 'en-AU').replace(/\.00/, '')
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
            {formatCurrency(expected_amount, currency, 'en-AU')}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Total Paid:</span>
          <span className="font-medium text-green-600">
            {formatCurrency(paid_amount, currency, 'en-AU')}
          </span>
        </div>
        <div className="flex justify-between border-t pt-1">
          <span className="text-gray-900 font-medium">Total for Period:</span>
          <span className="font-bold text-gray-900">
            {formatCurrency(totalAmount, currency, 'en-AU')}
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
                  {formatCurrency(inst.amount, currency, 'en-AU')}
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
 * Loading Skeleton Component
 */
function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-56 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="w-full h-[400px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
          <span className="text-gray-400">Loading chart...</span>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Error State Component
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Failed to load cash flow projection
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          There was an error loading the cash flow chart. Please try again.
        </p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Main CashFlowChart Component
 */
interface CashFlowChartProps {
  groupBy?: 'day' | 'week' | 'month'
  days?: number
}

export function CashFlowChart({ groupBy = 'week', days = 90 }: CashFlowChartProps) {
  const { data, isLoading, isError, refetch } = useQuery<CashFlowResponse>({
    queryKey: ['cash-flow-projection', groupBy, days],
    queryFn: async () => {
      const res = await fetch(
        `/api/cash-flow-projection?groupBy=${groupBy}&days=${days}`
      )
      if (!res.ok) {
        throw new Error('Failed to fetch cash flow projection')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (isError || !data?.data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const chartData = data.data
  const currency = 'AUD' // TODO: Get from agency settings

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cash Flow Projection</CardTitle>
        <p className="text-sm text-muted-foreground">
          Projected cash flow for the next {days} days showing paid and expected payments
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date_bucket"
              tickFormatter={(date) => formatDateLabel(date, groupBy)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyCompact(value, currency)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip currency={currency} groupBy={groupBy} />} />
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

        {/* Color Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-600" />
            <span className="text-gray-600">Paid (Already Received)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-500" />
            <span className="text-gray-600">Expected (Pending Installments)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
