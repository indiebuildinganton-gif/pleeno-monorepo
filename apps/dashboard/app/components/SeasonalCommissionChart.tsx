/**
 * SeasonalCommissionChart Component
 *
 * Displays a line chart showing monthly commission for the last 12 months
 * with peak/quiet indicators and year-over-year comparison.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 6: Create SeasonalCommissionChart Component
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  Legend,
} from 'recharts'
import { getApiUrl } from '../hooks/useApiUrl'
import { format } from 'date-fns'
import { formatCurrency as formatCurrencyUtil } from '@pleeno/utils'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Month Commission Data Type
 */
interface MonthCommission {
  month: string // "2025-01" format
  commission: number
  previous_year_commission?: number
  is_peak?: boolean
  is_quiet?: boolean
  yoy_change?: number // Percentage change from previous year
}

/**
 * API Response Type
 */
interface SeasonalCommissionResponse {
  success: boolean
  data: MonthCommission[]
}

/**
 * Format month from "YYYY-MM" to "Jan", "Feb", etc.
 */
function formatMonth(monthStr: string): string {
  try {
    // Parse "2025-01" format
    const [year, month] = monthStr.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1, 1)
    return format(date, 'MMM')
  } catch {
    return monthStr
  }
}

/**
 * Format currency for display
 */
function formatCurrencyDisplay(value: number, currency: string = 'AUD'): string {
  // For Y-axis, show compact format
  if (value >= 1000000) {
    return formatCurrencyUtil(value / 1000000, currency, 'en-AU').replace(/\.00/, '') + 'M'
  } else if (value >= 1000) {
    return formatCurrencyUtil(value / 1000, currency, 'en-AU').replace(/\.00/, '') + 'K'
  }
  return formatCurrencyUtil(value, currency, 'en-AU')
}

/**
 * Custom Tooltip Component
 */
interface TooltipPayload {
  payload: MonthCommission
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
  currency?: string
}

function CustomTooltip({ active, payload, label, currency = 'AUD' }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) {
    return null
  }

  const data = payload[0].payload
  const commission = data.commission
  const previousYearCommission = data.previous_year_commission
  const yoyChange = data.yoy_change

  return (
    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
      <p className="font-semibold mb-2">{label ? formatMonth(label) : ''}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span className="text-sm">
            <span className="font-medium">Current: </span>
            {formatCurrencyUtil(commission, currency, 'en-AU')}
          </span>
        </div>
        {previousYearCommission !== undefined && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            <span className="text-sm">
              <span className="font-medium">Previous Year: </span>
              {formatCurrencyUtil(previousYearCommission, currency, 'en-AU')}
            </span>
          </div>
        )}
        {yoyChange !== undefined && (
          <div className="text-sm pt-1 border-t border-gray-100">
            <span className="font-medium">YoY Change: </span>
            <span className={yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {yoyChange >= 0 ? '+' : ''}
              {yoyChange.toFixed(1)}%
            </span>
          </div>
        )}
        {data.is_peak && (
          <div className="text-xs text-green-700 font-medium pt-1">🌟 Peak Month</div>
        )}
        {data.is_quiet && (
          <div className="text-xs text-orange-600 font-medium pt-1">📉 Quiet Month</div>
        )}
      </div>
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
        <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px] bg-gray-100 rounded animate-pulse flex items-center justify-center">
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
          Failed to load seasonal commission data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          There was an error loading the seasonal commission chart. Please try again.
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
 * Main SeasonalCommissionChart Component
 */
export function SeasonalCommissionChart() {
  const { data, isLoading, isError, refetch } = useQuery<SeasonalCommissionResponse>({
    queryKey: ['dashboard', 'seasonal-commission'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/seasonal-commission'))
      if (!res.ok) {
        throw new Error('Failed to fetch seasonal commission data')
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
  const hasPreviousYearData = chartData.some((item) => item.previous_year_commission !== undefined)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seasonal Commission Trends</CardTitle>
        <p className="text-sm text-muted-foreground">
          Monthly commission for the last 12 months with year-over-year comparison
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrencyDisplay(value, currency)}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip currency={currency} />} />
            {hasPreviousYearData && (
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} iconType="line" />
            )}

            {/* Current Year Commission Line */}
            <Line
              type="monotone"
              dataKey="commission"
              stroke="#10b981"
              strokeWidth={2}
              dot={(props) => {
                const { cx, cy, payload } = props
                if (payload.is_peak) {
                  return (
                    <circle cx={cx} cy={cy} r={6} fill="#10b981" stroke="#fff" strokeWidth={2} />
                  )
                }
                if (payload.is_quiet) {
                  return (
                    <circle cx={cx} cy={cy} r={6} fill="#f59e0b" stroke="#fff" strokeWidth={2} />
                  )
                }
                return <circle cx={cx} cy={cy} r={4} fill="#10b981" />
              }}
              name="Current Year"
              activeDot={{ r: 8 }}
            />

            {/* Previous Year Comparison Line (if available) */}
            {hasPreviousYearData && (
              <Line
                type="monotone"
                dataKey="previous_year_commission"
                stroke="#60a5fa"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: '#60a5fa', r: 3 }}
                name="Previous Year"
              />
            )}

            {/* Peak Month Indicators */}
            {chartData.map((item, idx) => {
              if (item.is_peak) {
                return (
                  <ReferenceDot
                    key={`peak-${idx}`}
                    x={item.month}
                    y={item.commission}
                    r={8}
                    fill="#10b981"
                    fillOpacity={0.3}
                    stroke="none"
                  />
                )
              }
              return null
            })}

            {/* Quiet Month Indicators */}
            {chartData.map((item, idx) => {
              if (item.is_quiet) {
                return (
                  <ReferenceDot
                    key={`quiet-${idx}`}
                    x={item.month}
                    y={item.commission}
                    r={8}
                    fill="#f59e0b"
                    fillOpacity={0.3}
                    stroke="none"
                  />
                )
              }
              return null
            })}
          </LineChart>
        </ResponsiveContainer>

        {/* Legend for Peak/Quiet Indicators */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-600" />
            <span className="text-gray-600">Peak Month</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-600">Quiet Month</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
