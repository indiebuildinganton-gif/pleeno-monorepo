/**
 * PaymentPlanDetail Component
 *
 * Displays payment plan details with:
 * - Student information
 * - College and Branch information
 * - Total amount and currency
 * - Payment progress bar
 * - Progress text (X of Y installments paid)
 * - Amount paid vs total (using formatCurrency)
 * - Payment plan status badge
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 4: Payment Plan Detail Page Updates
 */

'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Progress,
} from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils/formatters'
import { PaymentPlanStatusBadge } from '../../components/PaymentPlanStatusBadge'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { PaymentPlanDetail as PaymentPlanDetailType } from '../hooks/usePaymentPlanDetail'

/**
 * PaymentPlanDetail Props
 */
interface PaymentPlanDetailProps {
  /** Payment plan data */
  plan: PaymentPlanDetailType
}

/**
 * PaymentPlanDetail Component
 *
 * Displays comprehensive payment plan details including progress indicators
 *
 * @example
 * ```tsx
 * <PaymentPlanDetail plan={data.data} />
 * ```
 */
export function PaymentPlanDetail({ plan }: PaymentPlanDetailProps) {
  // Calculate payment progress
  const paidInstallments = plan.installments.filter(i => i.status === 'paid').length
  const totalInstallments = plan.installments.length

  // Calculate amount progress
  // Include both 'paid' and 'partial' installments to match commission calculation
  const paidAmount = plan.installments
    .filter(i => (i.status === 'paid' || i.status === 'partial') && i.paid_amount !== null)
    .reduce((sum, i) => sum + (i.paid_amount || 0), 0)
  const totalAmount = plan.total_amount

  // Calculate progress percentage based on amount paid
  const progressPercentage = totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0

  // Student name
  const studentName = plan.student
    ? `${plan.student.first_name} ${plan.student.last_name}`
    : 'Unknown Student'

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl">Payment Plan Details</CardTitle>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Student:</span>
                <Link
                  href={`/students/${plan.enrollment_id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
                >
                  {studentName}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div>
                <span className="text-sm text-gray-600">College: </span>
                <span className="text-sm font-medium">{plan.college?.name || 'Unknown'}</span>
                {plan.branch?.name && (
                  <>
                    <span className="text-sm text-gray-600"> / </span>
                    <span className="text-sm font-medium">{plan.branch.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <PaymentPlanStatusBadge status={plan.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Payment Progress Section */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Payment Progress</span>
              <span className="text-sm text-gray-600">{progressPercentage}%</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Installments Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Installments Paid</div>
              <div className="text-2xl font-bold">
                {paidInstallments} <span className="text-gray-400">of</span> {totalInstallments}
              </div>
            </div>

            {/* Amount Progress */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Amount Paid</div>
              <div className="text-2xl font-bold">
                {formatCurrency(paidAmount, plan.currency)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                of {formatCurrency(totalAmount, plan.currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Commission Tracking */}
        <div className="space-y-4 pt-4 border-t">
          <div className="text-sm font-medium text-gray-700">Commission Tracking</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Expected Commission</div>
              <div className="text-lg font-semibold">
                {formatCurrency(plan.expected_commission, plan.currency)}
              </div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Earned Commission</div>
              <div className="text-lg font-semibold text-green-700">
                {formatCurrency(plan.earned_commission, plan.currency)}
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">Commission Progress</span>
              <span className="text-sm font-medium text-green-700">
                {plan.expected_commission > 0
                  ? `${Math.round((plan.earned_commission / plan.expected_commission) * 100)}% earned`
                  : '0% earned'}
              </span>
            </div>
            <Progress
              value={plan.expected_commission > 0
                ? (plan.earned_commission / plan.expected_commission) * 100
                : 0}
              className="h-2"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
