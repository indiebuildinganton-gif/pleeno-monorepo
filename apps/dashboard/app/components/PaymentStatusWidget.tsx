/**
 * PaymentStatusWidget Component
 *
 * Displays payment status overview with four status categories:
 * - Pending: Installments awaiting payment
 * - Due Soon: Payments due in the next 7 days
 * - Overdue: Late payments requiring attention
 * - Paid This Month: Successfully collected payments
 *
 * Uses TanStack Query to fetch data from payment status summary API.
 * Each status card is color-coded for quick visual identification.
 * Cards are clickable and navigate to payment plans with appropriate filters.
 *
 * Epic 5: Payment Plans & Installment Tracking
 * Story 5.4: Payment Status Dashboard Widget
 * Task 3: Create PaymentStatusWidget Component
 * Task 4: Add Navigation to Payment Plans with Filters
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@pleeno/ui'
import {
  Clock,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react'

/**
 * Payment Status Data Type
 */
interface PaymentStatus {
  count: number
  total_amount: number
}

/**
 * Payment Status Summary Response
 */
interface PaymentStatusData {
  pending: PaymentStatus
  due_soon: PaymentStatus
  overdue: PaymentStatus
  paid_this_month: PaymentStatus
}

/**
 * API Response Type
 */
interface PaymentStatusResponse {
  success: boolean
  data: PaymentStatusData
}

/**
 * Status Card Component Props
 */
interface StatusCardProps {
  label: string
  count: number
  amount: number
  icon: React.ReactNode
  colorClass: 'gray' | 'amber' | 'red' | 'green'
  href: string
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
 * Get color variant classes based on status
 */
function getColorClasses(colorClass: 'gray' | 'amber' | 'red' | 'green') {
  switch (colorClass) {
    case 'green':
      return {
        card: 'border-green-200 bg-green-50 hover:shadow-lg hover:scale-[1.02]',
        icon: 'text-green-600',
        text: 'text-green-900',
      }
    case 'amber':
      return {
        card: 'border-amber-200 bg-amber-50 hover:shadow-lg hover:scale-[1.02]',
        icon: 'text-amber-600',
        text: 'text-amber-900',
      }
    case 'red':
      return {
        card: 'border-red-200 bg-red-50 hover:shadow-lg hover:scale-[1.02]',
        icon: 'text-red-600',
        text: 'text-red-900',
      }
    case 'gray':
      return {
        card: 'border-gray-200 bg-gray-50 hover:shadow-lg hover:scale-[1.02]',
        icon: 'text-gray-600',
        text: 'text-gray-900',
      }
  }
}

/**
 * Status Card Component
 */
function StatusCard({
  label,
  count,
  amount,
  icon,
  colorClass,
  href,
}: StatusCardProps) {
  const colors = getColorClasses(colorClass)
  const currency = 'AUD' // TODO: Get from agency settings

  return (
    <Link href={href} className="block">
      <Card
        className={`cursor-pointer transition-all duration-200 ${colors.card}`}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{label}</CardTitle>
          <div className="flex items-center gap-2">
            <div className={colors.icon}>{icon}</div>
            <ArrowRight className={`w-4 h-4 ${colors.icon}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className={`text-2xl font-bold ${colors.text}`}>
              {formatCurrency(amount, currency)}
            </div>
            <p className="text-xs text-muted-foreground">
              {count} {count === 1 ? 'installment' : 'installments'}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Loading Skeleton Component
 */
function PaymentStatusSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-3 w-28 bg-gray-200 rounded animate-pulse" />
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
function PaymentStatusError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="text-red-800 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Failed to load payment status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700 mb-4">
          There was an error loading the payment status overview. Please try again.
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
 * Main PaymentStatusWidget Component
 */
export default function PaymentStatusWidget() {
  const { data, isLoading, isError, refetch } = useQuery<PaymentStatusResponse>({
    queryKey: ['payment-status-summary'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/payment-status-summary')
      if (!response.ok) {
        throw new Error('Failed to fetch payment status')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (matches API cache)
    refetchOnWindowFocus: true,
  })

  if (isLoading) {
    return <PaymentStatusSkeleton />
  }

  if (isError || !data?.success) {
    return <PaymentStatusError onRetry={() => refetch()} />
  }

  const statusData = data.data

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatusCard
        label="Pending"
        count={statusData.pending.count}
        amount={statusData.pending.total_amount}
        icon={<Clock className="w-5 h-5" />}
        colorClass="gray"
        href="/payments?status=pending"
      />
      <StatusCard
        label="Due Soon"
        count={statusData.due_soon.count}
        amount={statusData.due_soon.total_amount}
        icon={<AlertCircle className="w-5 h-5" />}
        colorClass="amber"
        href="/payments?status=due_soon"
      />
      <StatusCard
        label="Overdue"
        count={statusData.overdue.count}
        amount={statusData.overdue.total_amount}
        icon={<AlertTriangle className="w-5 h-5" />}
        colorClass="red"
        href="/payments?status=overdue"
      />
      <StatusCard
        label="Paid This Month"
        count={statusData.paid_this_month.count}
        amount={statusData.paid_this_month.total_amount}
        icon={<CheckCircle className="w-5 h-5" />}
        colorClass="green"
        href="/payments?status=paid&period=current_month"
      />
    </div>
  )
}
