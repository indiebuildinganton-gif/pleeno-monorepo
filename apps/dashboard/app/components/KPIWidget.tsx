/**
 * KPIWidget Component
 *
 * Displays 5 core business KPI metric cards with trend indicators.
 * Uses TanStack Query to fetch data from /api/dashboard/kpis endpoint.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 5: Create KPIWidget Component
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@pleeno/ui'
import {
  Users,
  FileText,
  AlertCircle,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
} from 'lucide-react'
import { getApiUrl } from '../hooks/useApiUrl'

/**
 * KPI Metrics Response Type
 */
interface KPIMetrics {
  active_students: number
  active_payment_plans: number
  outstanding_amount: number
  earned_commission: number
  collection_rate: number
  trends: {
    active_students: 'up' | 'down' | 'neutral'
    active_payment_plans: 'up' | 'down' | 'neutral'
    outstanding_amount: 'up' | 'down' | 'neutral'
    earned_commission: 'up' | 'down' | 'neutral'
    collection_rate: 'up' | 'down' | 'neutral'
  }
}

/**
 * API Response Type
 */
interface KPIResponse {
  success: boolean
  data: KPIMetrics
}

/**
 * Trend Arrow Component
 */
function TrendArrow({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') {
    return <TrendingUp className="w-4 h-4 text-green-600" aria-label="Trending up" />
  }
  if (trend === 'down') {
    return <TrendingDown className="w-4 h-4 text-red-600" aria-label="Trending down" />
  }
  return <ArrowRight className="w-4 h-4 text-gray-400" aria-label="No change" />
}

/**
 * MetricCard Component
 */
interface MetricCardProps {
  label: string
  value: string | number
  icon: React.ReactNode
  trend: 'up' | 'down' | 'neutral'
  variant?: 'default' | 'success' | 'warning'
}

function MetricCard({ label, value, icon, trend, variant = 'default' }: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-amber-200 bg-amber-50'
      default:
        return ''
    }
  }

  return (
    <Card className={getVariantClasses()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">{value}</div>
          <TrendArrow trend={trend} />
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Loading Skeleton Component
 */
function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {[...Array(5)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div
              role="generic"
              className="h-4 w-24 bg-gray-200 rounded animate-pulse"
            />
            <div
              role="generic"
              className="h-5 w-5 bg-gray-200 rounded animate-pulse"
            />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div
                role="generic"
                className="h-8 w-20 bg-gray-200 rounded animate-pulse"
              />
              <div
                role="generic"
                className="h-4 w-4 bg-gray-200 rounded animate-pulse"
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
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
          <AlertCircle className="w-5 h-5" />
          Failed to load KPI metrics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          There was an error loading the dashboard metrics. Please try again.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-800 bg-white border border-red-300 rounded-md hover:bg-red-100 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </CardContent>
    </Card>
  )
}

/**
 * Format currency value
 */
function formatCurrency(amount: number, currency: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format percentage value
 */
function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Main KPIWidget Component
 */
export function KPIWidget() {
  const { data, isLoading, isError, refetch } = useQuery<KPIResponse>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/kpis'))
      if (!res.ok) {
        throw new Error('Failed to fetch KPI metrics')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <KPISkeleton />
  }

  if (isError || !data?.data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const metrics = data.data
  const currency = 'AUD' // TODO: Get from agency settings

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <MetricCard
        label="Active Students"
        value={metrics.active_students}
        icon={<Users className="w-5 h-5" />}
        trend={metrics.trends.active_students}
      />
      <MetricCard
        label="Active Payment Plans"
        value={metrics.active_payment_plans}
        icon={<FileText className="w-5 h-5" />}
        trend={metrics.trends.active_payment_plans}
      />
      <MetricCard
        label="Outstanding Amount"
        value={formatCurrency(metrics.outstanding_amount, currency)}
        icon={<AlertCircle className="w-5 h-5" />}
        trend={metrics.trends.outstanding_amount}
        variant="warning"
      />
      <MetricCard
        label="Earned Commission"
        value={formatCurrency(metrics.earned_commission, currency)}
        icon={<DollarSign className="w-5 h-5" />}
        trend={metrics.trends.earned_commission}
        variant="success"
      />
      <MetricCard
        label="Collection Rate"
        value={formatPercentage(metrics.collection_rate)}
        icon={<TrendingUp className="w-5 h-5" />}
        trend={metrics.trends.collection_rate}
      />
    </div>
  )
}
