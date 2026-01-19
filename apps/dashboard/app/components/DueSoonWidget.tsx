/**
 * DueSoonWidget Component
 *
 * Dashboard widget displaying count and total amount of installments due soon.
 * Shows a warning indicator when there are payments approaching their due date,
 * enabling proactive follow-up before payments become overdue.
 *
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

import { getApiUrl } from '../hooks/useApiUrl'
import { getZoneUrl } from '@/lib/navigation-utils'

/**
 * Due Soon Count Response Type
 */
interface DueSoonCountData {
  count: number
  total_amount: number
}

/**
 * API Response Type
 */
interface DueSoonResponse {
  success: boolean
  data: DueSoonCountData
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
 * Loading Skeleton Component
 */
function DueSoonSkeleton() {
  return (
    <Card className="border-amber-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-full bg-gray-200 rounded animate-pulse" />
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
        <CardTitle className="text-red-800 flex items-center gap-2 text-sm">
          <AlertTriangle className="w-4 h-4" />
          Failed to load due soon data
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-red-700 mb-3">
          Unable to fetch upcoming payment information.
        </p>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="w-3 h-3 mr-2" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

/**
 * Empty State Component - No payments due soon
 */
function EmptyState() {
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-green-800">
          Due Soon
        </CardTitle>
        <Clock className="w-5 h-5 text-green-600" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-800">0</div>
        <p className="text-xs text-green-700 mt-2">
          No payments due in the next few days
        </p>
      </CardContent>
    </Card>
  )
}

/**
 * Main DueSoonWidget Component
 *
 * Displays:
 * - Count of installments due soon
 * - Total amount due soon
 * - Link to filtered payment plans view
 *
 * Uses warning color (amber/yellow) to draw attention without alarming
 * (as opposed to red for overdue payments).
 */
export function DueSoonWidget() {
  const { data, isLoading, isError, refetch } = useQuery<DueSoonResponse>({
    queryKey: ['dashboard', 'due-soon-count'],
    queryFn: async () => {
      const res = await fetch(getApiUrl('/api/due-soon-count'))
      if (!res.ok) {
        throw new Error('Failed to fetch due soon count')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return <DueSoonSkeleton />
  }

  if (isError || !data?.data) {
    return <ErrorState onRetry={() => refetch()} />
  }

  const { count, total_amount } = data.data
  const currency = 'AUD' // TODO: Get from agency settings

  // Show empty state if no payments due soon
  if (count === 0) {
    return <EmptyState />
  }

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-amber-900">
          Due Soon
        </CardTitle>
        <Clock className="w-5 h-5 text-amber-600" />
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {/* Count of installments */}
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold text-amber-900">{count}</div>
            <span className="text-xs text-amber-700">
              {count === 1 ? 'payment' : 'payments'}
            </span>
          </div>

          {/* Total amount */}
          <div className="text-sm font-medium text-amber-800">
            {formatCurrency(total_amount)}
          </div>

          {/* Link to filtered view */}
          <a
            href={getZoneUrl('payments', '/plans?filter=due-soon')}
            className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 hover:underline mt-3 transition-colors"
          >
            View all due soon payments
            <ArrowRight className="w-3 h-3" />
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
