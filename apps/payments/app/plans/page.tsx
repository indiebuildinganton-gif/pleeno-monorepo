/**
 * Payment Plans List Page
 *
 * Displays all payment plans for the agency with filtering capabilities.
 * Includes filter for "due soon" installments.
 *
 * Epic 5: Intelligent Status Automation
 * Story 5.2: Due Soon Notification Flags
 * Task 2: Update UI to display "due soon" badges - Filter functionality
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'
import { Filter, RefreshCw, Plus } from 'lucide-react'
import Link from 'next/link'
import { InstallmentStatusBadge } from './components/InstallmentStatusBadge'
import { formatDateInAgencyTimezone } from '@pleeno/utils/date-helpers'

/**
 * Payment Plan with Installments
 */
interface PaymentPlanWithInstallments {
  id: string
  student_name: string
  college_name: string
  total_amount: number
  status: string
  created_at: string
  installments: Array<{
    id: string
    amount: number
    student_due_date: string
    status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
    is_due_soon: boolean
    days_until_due: number | null
  }>
}

/**
 * Filter Tabs Component
 */
function FilterTabs({ activeFilter }: { activeFilter: string | null }) {
  const router = useRouter()

  const filters = [
    { key: null, label: 'All Plans' },
    { key: 'due-soon', label: 'Due Soon' },
    { key: 'overdue', label: 'Overdue' },
    { key: 'pending', label: 'Pending' },
  ]

  const handleFilterChange = (filterKey: string | null) => {
    if (filterKey) {
      router.push(`/plans?filter=${filterKey}`)
    } else {
      router.push('/plans')
    }
  }

  return (
    <div className="flex gap-2 mb-6 border-b border-gray-200">
      {filters.map((filter) => (
        <button
          key={filter.key || 'all'}
          onClick={() => handleFilterChange(filter.key)}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeFilter === filter.key
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Payment Plan Card Component
 */
function PaymentPlanCard({ plan }: { plan: PaymentPlanWithInstallments }) {
  // Find if there are any due soon or overdue installments
  const dueSoonCount = plan.installments.filter((i) => i.is_due_soon).length
  const overdueCount = plan.installments.filter((i) => i.status === 'overdue').length

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{plan.student_name}</CardTitle>
            <p className="text-sm text-gray-600 mt-1">{plan.college_name}</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">
              ${Number(plan.total_amount).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {plan.installments.length} installments
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert counts */}
        <div className="flex gap-3 mb-3">
          {dueSoonCount > 0 && (
            <div className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
              {dueSoonCount} due soon
            </div>
          )}
          {overdueCount > 0 && (
            <div className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 px-2 py-1 rounded">
              {overdueCount} overdue
            </div>
          )}
        </div>

        {/* Installments list (show first 3) */}
        <div className="space-y-2">
          {plan.installments.slice(0, 3).map((installment) => (
            <div
              key={installment.id}
              className="flex justify-between items-center text-sm border-t pt-2"
            >
              <div>
                <div className="font-medium">
                  ${Number(installment.amount).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Due: {formatDateInAgencyTimezone(installment.student_due_date, 'UTC', 'PP')}
                </div>
              </div>
              <InstallmentStatusBadge
                status={installment.status}
                isDueSoon={installment.is_due_soon}
                daysUntilDue={installment.days_until_due || undefined}
              />
            </div>
          ))}
          {plan.installments.length > 3 && (
            <div className="text-xs text-gray-500 pt-2">
              + {plan.installments.length - 3} more installments
            </div>
          )}
        </div>

        {/* View details link */}
        <Link
          href={`/plans/${plan.id}`}
          className="inline-block mt-4 text-sm text-blue-600 hover:text-blue-800 hover:underline"
        >
          View full plan →
        </Link>
      </CardContent>
    </Card>
  )
}

/**
 * Loading Skeleton
 */
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

/**
 * Empty State
 */
function EmptyState({ filter }: { filter: string | null }) {
  const message = filter
    ? `No payment plans found with ${filter} installments`
    : 'No payment plans found'

  return (
    <Card className="p-12 text-center">
      <p className="text-gray-600 mb-4">{message}</p>
      <Link href="/plans/new">
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Payment Plan
        </Button>
      </Link>
    </Card>
  )
}

/**
 * Main Payment Plans List Page
 */
export default function PaymentPlansPage() {
  const searchParams = useSearchParams()
  const filter = searchParams.get('filter')

  // TODO: Implement actual API endpoint for payment plans
  // For now, this is a placeholder that shows the structure
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['payment-plans', filter],
    queryFn: async () => {
      // Placeholder - would call actual API
      // const res = await fetch(`/api/payment-plans${filter ? `?filter=${filter}` : ''}`)
      // if (!res.ok) throw new Error('Failed to fetch payment plans')
      // return res.json()
      return { success: true, data: [] }
    },
    staleTime: 5 * 60 * 1000,
  })

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Payment Plans</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all payment plans and installments
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Link href="/plans/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <FilterTabs activeFilter={filter} />

      {/* Content */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : isError ? (
        <Card className="border-red-200 bg-red-50 p-6">
          <p className="text-red-800">Failed to load payment plans</p>
          <Button variant="outline" onClick={() => refetch()} className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </Card>
      ) : !data?.data || data.data.length === 0 ? (
        <EmptyState filter={filter} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.data.map((plan: PaymentPlanWithInstallments) => (
            <PaymentPlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  )
}
