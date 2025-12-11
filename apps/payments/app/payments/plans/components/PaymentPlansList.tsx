/**
 * PaymentPlansList Component
 *
 * Displays payment plans in a responsive table/card layout with:
 * - Student Name (linked to student profile)
 * - College / Branch
 * - Total Amount (formatted currency)
 * - Installments (e.g., "5 of 12 paid")
 * - Next Due Date (formatted date)
 * - Status (badge: active/completed/cancelled)
 * - View Details button
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 3: Payment Plans List Page
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Skeleton,
} from '@pleeno/ui'
import { formatCurrency, format, parseISO } from '@pleeno/utils'
import { PaymentPlanStatusBadge } from './PaymentPlanStatusBadge'
import { ExternalLink } from 'lucide-react'
import { getApiUrl } from '@/hooks/useApiUrl'

/**
 * Get the entities zone URL based on environment
 */
const getEntitiesUrl = () => {
  return process.env.NEXT_PUBLIC_ENTITIES_URL || 'http://localhost:3001'
}

/**
 * Payment Plan from API
 */
interface PaymentPlan {
  id: string
  enrollment_id: string
  student_id: string | null
  total_amount: number
  currency: string
  status: 'active' | 'completed' | 'cancelled'
  next_due_date: string | null
  total_installments: number
  installments_paid_count: number
  student: {
    first_name: string
    last_name: string
  } | null
  college: {
    name: string
  } | null
  branch: {
    name: string
  } | null
}

/**
 * API Response
 */
interface PaymentPlansResponse {
  success: boolean
  data: PaymentPlan[]
  meta: {
    total: number
    page: number
    per_page: number
    total_pages: number
  }
}

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* Desktop: Table skeleton */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>College / Branch</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-5 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile: Card skeleton */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

/**
 * Empty State Component
 */
function EmptyState() {
  return (
    <Card className="p-12 text-center">
      <div className="mx-auto max-w-md">
        <p className="text-lg text-gray-600 mb-2">No payment plans found</p>
        <p className="text-sm text-gray-500 mb-6">
          Create your first payment plan to get started
        </p>
        <Link href="/payments/plans/new">
          <Button>Create Payment Plan</Button>
        </Link>
      </div>
    </Card>
  )
}

/**
 * Error State Component
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50 p-6">
      <div className="text-center">
        <p className="text-red-800 mb-4">Failed to load payment plans</p>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </Card>
  )
}

/**
 * PaymentPlansList Component
 */
export function PaymentPlansList() {
  const searchParams = useSearchParams()

  // Build query parameters from searchParams
  // This will allow filters to be passed via URL query string
  const queryParams = new URLSearchParams()
  searchParams.forEach((value, key) => {
    queryParams.append(key, value)
  })

  // Fetch payment plans with TanStack Query
  const { data, isLoading, error, refetch } = useQuery<PaymentPlansResponse>({
    queryKey: ['payment-plans', Object.fromEntries(queryParams.entries())],
    queryFn: async () => {
      const url = getApiUrl(`/api/payment-plans?${queryParams.toString()}`)
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error('Failed to fetch payment plans')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Show loading state
  if (isLoading) {
    return <LoadingSkeleton />
  }

  // Show error state
  if (error) {
    return <ErrorState onRetry={() => refetch()} />
  }

  // Show empty state
  if (!data?.data || data.data.length === 0) {
    return <EmptyState />
  }

  const plans = data.data

  return (
    <div className="space-y-4">
      {/* Desktop: Table Layout */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>College / Branch</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead>Installments</TableHead>
                <TableHead>Next Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => {
                const studentName = plan.student
                  ? `${plan.student.first_name} ${plan.student.last_name}`
                  : 'Unknown Student'
                const collegeName = plan.college?.name || 'Unknown College'
                const branchName = plan.branch?.name || 'Unknown Branch'

                return (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">
                      {plan.student_id ? (
                        <a
                          href={`${getEntitiesUrl()}/students/${plan.student_id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          {studentName}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span>{studentName}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{collegeName}</div>
                        <div className="text-sm text-gray-500">{branchName}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatCurrency(plan.total_amount, plan.currency)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {plan.installments_paid_count} of {plan.total_installments} paid
                      </span>
                    </TableCell>
                    <TableCell>
                      {plan.next_due_date ? (
                        <span className="text-sm">
                          {format(parseISO(plan.next_due_date), 'MMM d, yyyy')}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">No due date</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <PaymentPlanStatusBadge status={plan.status} />
                    </TableCell>
                    <TableCell>
                      <Link href={`/payments/plans/${plan.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile: Card Layout */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {plans.map((plan) => {
          const studentName = plan.student
            ? `${plan.student.first_name} ${plan.student.last_name}`
            : 'Unknown Student'
          const collegeName = plan.college?.name || 'Unknown College'
          const branchName = plan.branch?.name || 'Unknown Branch'

          return (
            <Card key={plan.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {plan.student_id ? (
                        <a
                          href={`${getEntitiesUrl()}/students/${plan.student_id}`}
                          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                        >
                          {studentName}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span>{studentName}</span>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      {collegeName}
                      <br />
                      {branchName}
                    </p>
                  </div>
                  <PaymentPlanStatusBadge status={plan.status} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Amount</span>
                    <span className="font-semibold">
                      {formatCurrency(plan.total_amount, plan.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Installments</span>
                    <span className="text-sm">
                      {plan.installments_paid_count} of {plan.total_installments} paid
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Next Due Date</span>
                    {plan.next_due_date ? (
                      <span className="text-sm">
                        {format(parseISO(plan.next_due_date), 'MMM d, yyyy')}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">No due date</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <Link href={`/payments/plans/${plan.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination info */}
      {data.meta && data.meta.total > 0 && (
        <div className="text-sm text-gray-600 text-center py-4">
          Showing {data.data.length} of {data.meta.total} payment plans
        </div>
      )}
    </div>
  )
}
