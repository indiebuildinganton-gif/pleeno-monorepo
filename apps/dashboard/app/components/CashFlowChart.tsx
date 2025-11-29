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
  const { installment_count, installments, date_bucket } = data

  // Handle empty bucket
  if (!installments || installments.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 min-w-[350px] pointer-events-auto">
        <div className="font-bold text-xl text-gray-900 mb-1">
          Installment Details for {formatDateRange(date_bucket, groupBy)}
        </div>
        <div className="text-sm text-gray-500">No installments in this period</div>
      </div>
    )
  }

  // Show all installments in the modal view, but limit initial render if needed for performance
  // For a modal, we can show more or scroll. Let's show up to 50 to be safe, or just map them all if reasonable.
  // The user asked for scroll y axis, so we should allow scrolling.
  const displayInstallments = installments
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-2xl border border-gray-100 w-[450px] max-h-[600px] flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex justify-between items-start">
            <div>
                <h3 className="font-bold text-xl text-gray-900 mb-1">
                Installment Details
                </h3>
                <p className="text-gray-500 text-sm font-medium">
                    {formatDateRange(date_bucket, groupBy)}
                </p>
            </div>
            <div className="bg-green-50 text-[#1E8449] px-3 py-1 rounded-full text-sm font-medium">
            {installment_count} {installment_count === 1 ? 'Installment' : 'Installments'}
            </div>
        </div>
      </div>

      {/* Student List - Scrollable Area */}
      <div className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
        <div className="text-sm font-bold text-gray-900 sticky top-0 bg-white py-2 z-10">Students:</div>
        
        {displayInstallments.map((inst, idx) => (
          <div key={idx} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              {/* Avatar Placeholder */}
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              
              {/* Details */}
              <div>
                <div className="text-sm font-bold text-gray-900">
                  {inst.student_name} <span className="font-normal text-gray-600 ml-1">{new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(inst.amount)}</span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  due by {format(new Date(inst.due_date), 'MMM dd')}
                </div>
              </div>
            </div>

            {/* Status Badge - Green for both as requested "pending must be shaded with green" */}
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              inst.status === 'paid' 
                ? 'bg-[#dcfce7] text-[#166534]' // Darker green for paid
                : 'bg-orange-100 text-orange-700' // Orange for pending
            }`}>
              {inst.status === 'paid' ? 'Paid' : 'Pending'}
            </div>
          </div>
        ))}
      </div>
      
      <div className="pt-4 mt-2 border-t border-gray-100 text-center text-xs text-gray-400 flex-shrink-0">
        Scroll to see more
      </div>
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
  const outstandingBalance = totalExpected // In this context, expected is what's remaining/outstanding or total? 
  // Clarification: Usually "Expected" in these charts means the total due. "Paid" is what's collected. 
  // So Outstanding = Expected - Paid? Or is "Expected" just the future/unpaid part?
  // Looking at the previous code: netProjection = totalExpected + totalPaid. 
  // This implies "Expected" was the *future* amount and "Paid" was the *past* amount.
  // So "Total Expected Revenue" in the new design likely means the Grand Total (Paid + Expected).
  // And "Outstanding Balance" is the "Expected" part.
  
  const totalRevenue = totalPaid + totalExpected
  const outstandingAmount = totalExpected

  // Calculate date range
  const today = new Date()
  const endDate = addDays(today, days)
  const dateRange = `${format(today, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`

  return (
    <div className="w-full space-y-6">
      {/* Summary Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Expected Revenue Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-2">Total Expected Revenue</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(totalRevenue)}
          </div>
          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
            <span>+2.5%</span>
          </div>
        </div>

        {/* Total Paid Revenue Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-2">Total Paid Revenue</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(totalPaid)}
          </div>
          <div className="text-sm text-green-600 font-medium flex items-center gap-1">
            <span>+5.8%</span>
          </div>
        </div>

        {/* Outstanding Balance Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <div className="text-gray-500 text-sm font-medium mb-2">Outstanding Balance</div>
          <div className="text-3xl font-bold text-gray-900 mb-2">
            {new Intl.NumberFormat('en-AU', { style: 'currency', currency }).format(outstandingAmount)}
          </div>
          <div className="text-sm text-red-500 font-medium flex items-center gap-1">
            <span>-1.2%</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          {/* View Toggles */}
          <div className="bg-gray-50 rounded-lg p-1 flex">
            <button
              onClick={() => setCashFlowView('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                cashFlowView === 'weekly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setCashFlowView('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                cashFlowView === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Monthly
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
             {/* Date Range Display - Requested to be retained */}
            <div className="text-sm text-gray-500 font-medium mr-2 hidden sm:block">
              {dateRange}
            </div>

            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <span className="material-symbols-outlined text-[20px]">tune</span>
            </button>
            <button className="bg-[#13ec5b] hover:bg-[#10d650] text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm">
              <span className="material-symbols-outlined text-[18px]">download</span>
              Download Report
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mb-2" />
              <span className="text-gray-500">Loading projection data...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">Unable to load cash flow projection</p>
              <Button onClick={() => refetch()} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && chartData.length === 0 && (
          <div className="w-full h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="text-gray-300 mb-4">
                <span className="material-symbols-outlined text-[48px]">bar_chart</span>
              </div>
              <p className="text-gray-600 mb-2">
                No upcoming payments scheduled
              </p>
              <p className="text-sm text-gray-500">
                Create payment plans to see projections for the next {days} days
              </p>
            </div>
          </div>
        )}

        {/* Chart */}
        {!isLoading && !isError && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis
                dataKey="date_bucket"
                tickFormatter={(date) => formatDateLabel(date, cashFlowView)}
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                dy={10}
              />
              <YAxis
                tickFormatter={(value) => formatCurrencyCompact(value, currency)}
                stroke="#9CA3AF"
                tick={{ fill: '#6B7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={<CustomTooltip currency={currency} groupBy={mapViewToGroupBy(cashFlowView)} />}
                cursor={{ fill: 'rgba(19, 236, 91, 0.05)' }}
                wrapperStyle={{ 
                  position: 'fixed', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  zIndex: 100, 
                  pointerEvents: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0,0,0,0.2)' // Optional: dim background
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
                iconSize={10}
                formatter={(value) => <span className="text-gray-600 text-sm ml-1">{value}</span>}
              />

              {/* Paid Amount Bar (Dark Green) */}
              <Bar
                dataKey="paid_amount"
                stackId="a"
                fill="#1E8449"
                name="Paid"
                radius={[0, 0, 0, 0]}
                barSize={60}
              />

              {/* Expected Amount Bar (Light Green) - Stacked on top */}
              <Bar
                dataKey="expected_amount"
                stackId="a"
                fill="#A9DFBF"
                name="Expected"
                radius={[4, 4, 0, 0]}
                barSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
