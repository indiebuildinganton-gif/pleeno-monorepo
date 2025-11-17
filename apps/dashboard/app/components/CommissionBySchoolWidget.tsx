/**
 * CommissionBySchoolWidget Component
 *
 * Displays top 5 schools by commission with percentage share and trends.
 * Uses horizontal bars to show commission breakdown by school.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 7: Create CommissionBySchoolWidget Component
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils'
import { ArrowUp, ArrowDown, ArrowRight, AlertTriangle, RefreshCw } from 'lucide-react'
import { getApiUrl } from '../hooks/useApiUrl'

/**
 * School Commission Data Type
 */
interface SchoolCommission {
  college_id: string
  college_name: string
  commission: number
  percentage_share: number // 0-100
  trend: 'up' | 'down' | 'neutral'
}

/**
 * API Response Type
 */
interface CommissionBySchoolResponse {
  success: boolean
  data: SchoolCommission[]
}

/**
 * Trend Arrow Component
 */
interface TrendArrowProps {
  trend: 'up' | 'down' | 'neutral'
}

function TrendArrow({ trend }: TrendArrowProps) {
  if (trend === 'up') {
    return <ArrowUp className="w-4 h-4 text-green-600" aria-label="Trending up" />
  }
  if (trend === 'down') {
    return <ArrowDown className="w-4 h-4 text-red-600" aria-label="Trending down" />
  }
  return <ArrowRight className="w-4 h-4 text-gray-400" aria-label="No change" />
}

/**
 * Get progress bar color based on percentage
 * Gradient from yellow (low) to green (high)
 */
function getProgressBarColor(percentage: number): string {
  if (percentage >= 30) {
    return 'bg-green-600'
  } else if (percentage >= 20) {
    return 'bg-green-500'
  } else if (percentage >= 15) {
    return 'bg-yellow-500'
  } else if (percentage >= 10) {
    return 'bg-yellow-400'
  }
  return 'bg-yellow-300'
}

/**
 * School Row Component
 */
interface SchoolRowProps {
  collegeId: string
  name: string
  commission: number
  percentageShare: number
  trend: 'up' | 'down' | 'neutral'
  currency?: string
}

function SchoolRow({
  collegeId,
  name,
  commission,
  percentageShare,
  trend,
  currency = 'AUD',
}: SchoolRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Link
          href={`/colleges/${collegeId}`}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {name}
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-gray-900">
            {formatCurrency(commission, currency, 'en-AU')}
          </span>
          <TrendArrow trend={trend} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getProgressBarColor(percentageShare)} transition-all duration-300`}
            style={{ width: `${percentageShare}%` }}
            role="progressbar"
            aria-valuenow={percentageShare}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${percentageShare}% of total commission`}
          />
        </div>
        <span className="text-xs font-medium text-gray-600 w-12 text-right">
          {percentageShare.toFixed(1)}%
        </span>
      </div>
    </div>
  )
}

/**
 * Loading Skeleton Component
 */
function WidgetSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="flex items-center gap-3">
                  <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          ))}
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
          Failed to load commission by school
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          There was an error loading the school commission data. Please try again.
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
 * Main CommissionBySchoolWidget Component
 */
export function CommissionBySchoolWidget() {
  const { data, isLoading, isError, refetch } = useQuery<CommissionBySchoolResponse>({
    queryKey: ['dashboard', 'commission-by-school'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/dashboard/commission-by-school'))
      if (!res.ok) {
        throw new Error('Failed to fetch commission by school data')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <WidgetSkeleton />
  }

  if (isError || !data?.data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const schools = data.data
  const currency = 'AUD' // TODO: Get from agency settings

  // Limit to top 5 schools (API should already return top 5, but ensure here)
  const topSchools = schools.slice(0, 5)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Schools</CardTitle>
        <p className="text-sm text-muted-foreground">
          Commission breakdown by top performing schools
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topSchools.map((school) => (
            <SchoolRow
              key={school.college_id}
              collegeId={school.college_id}
              name={school.college_name}
              commission={school.commission}
              percentageShare={school.percentage_share}
              trend={school.trend}
              currency={currency}
            />
          ))}
        </div>
        <div className="mt-6 pt-4 border-t border-gray-200">
          <Link
            href="/colleges"
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
          >
            View All Colleges →
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
