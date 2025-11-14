'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils'
import { cn } from '@/lib/utils'

interface PaymentPlanSummaryProps {
  // From Step 1
  totalCourseValue: number
  commissionRate: number
  currency?: string

  // From Step 2 (optional for Step 1 usage)
  materialsCost?: number
  adminFees?: number
  otherFees?: number
  initialPaymentAmount?: number
  commissionableValue?: number
  expectedCommission?: number
  numberOfInstallments?: number
  amountPerInstallment?: number

  className?: string
}

/**
 * PaymentPlanSummary Component
 *
 * Displays real-time preview of payment plan calculations including:
 * - Total course value with currency formatting
 * - Non-commissionable fees breakdown
 * - Commissionable value (highlighted)
 * - Commission rate (from branch)
 * - Expected commission (calculated in real-time, highlighted in green)
 * - Initial payment
 * - Remaining amount for installments
 * - Amount per installment
 *
 * Updates in real-time as the user types values in Step 2.
 * Uses the commission-calculator utility for client-side calculations that match
 * the database calculation exactly.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 7: Multi-Step Payment Plan Wizard - Step 2
 *
 * @param totalCourseValue - Total course value (from Step 1)
 * @param commissionRate - Commission rate as decimal (e.g., 0.15 for 15%)
 * @param currency - Currency code (default: 'AUD')
 * @param materialsCost - Materials cost (non-commissionable)
 * @param adminFees - Admin fees (non-commissionable)
 * @param otherFees - Other fees (non-commissionable)
 * @param initialPaymentAmount - Initial payment amount
 * @param commissionableValue - Calculated commissionable value
 * @param expectedCommission - Calculated expected commission
 * @param numberOfInstallments - Number of regular installments
 * @param amountPerInstallment - Calculated amount per installment
 * @param className - Optional additional CSS classes
 */
export function PaymentPlanSummary({
  totalCourseValue,
  commissionRate,
  currency = 'AUD',
  materialsCost = 0,
  adminFees = 0,
  otherFees = 0,
  initialPaymentAmount = 0,
  commissionableValue,
  expectedCommission,
  numberOfInstallments,
  amountPerInstallment,
  className,
}: PaymentPlanSummaryProps) {
  // Calculate total fees
  const totalFees = materialsCost + adminFees + otherFees

  // Calculate remaining for installments if we have the data
  const remainingForInstallments =
    commissionableValue !== undefined && initialPaymentAmount !== undefined
      ? commissionableValue - initialPaymentAmount
      : undefined

  // Convert commission rate to percentage for display
  const commissionRatePercent = commissionRate * 100

  return (
    <Card className={cn('bg-card', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Payment Plan Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Total Course Value */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Course Value</span>
            <span className="text-lg font-semibold">
              {formatCurrency(totalCourseValue, currency)}
            </span>
          </div>

          {/* Non-Commissionable Fees (shown only if any fees exist) */}
          {totalFees > 0 && (
            <>
              <div className="border-t pt-3" />
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Non-Commissionable Fees:
                </div>
                {materialsCost > 0 && (
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-sm text-muted-foreground">Materials</span>
                    <span className="text-sm">{formatCurrency(materialsCost, currency)}</span>
                  </div>
                )}
                {adminFees > 0 && (
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-sm text-muted-foreground">Admin</span>
                    <span className="text-sm">{formatCurrency(adminFees, currency)}</span>
                  </div>
                )}
                {otherFees > 0 && (
                  <div className="flex justify-between items-center pl-4">
                    <span className="text-sm text-muted-foreground">Other</span>
                    <span className="text-sm">{formatCurrency(otherFees, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pl-4">
                  <span className="text-sm font-medium text-muted-foreground">Total Fees</span>
                  <span className="text-sm font-medium">
                    {formatCurrency(totalFees, currency)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Commissionable Value (highlighted) */}
          {commissionableValue !== undefined && (
            <>
              <div className="border-t pt-3" />
              <div className="flex justify-between items-center bg-blue-50 dark:bg-blue-950 p-2 rounded">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Commissionable Value
                </span>
                <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                  {formatCurrency(commissionableValue, currency)}
                </span>
              </div>
            </>
          )}

          {/* Commission Rate */}
          <div className="border-t pt-3" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Commission Rate</span>
            <span className="text-lg font-medium">{commissionRatePercent.toFixed(1)}%</span>
          </div>

          {/* Expected Commission (highlighted in green) */}
          {expectedCommission !== undefined && (
            <>
              <div className="border-t pt-3" />
              <div className="flex justify-between items-center bg-green-50 dark:bg-green-950 p-3 rounded">
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Expected Commission
                </span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(expectedCommission, currency)}
                </span>
              </div>
            </>
          )}

          {/* Payment Structure */}
          {initialPaymentAmount !== undefined && initialPaymentAmount > 0 && (
            <>
              <div className="border-t pt-3" />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Initial Payment</span>
                <span className="text-lg font-medium">
                  {formatCurrency(initialPaymentAmount, currency)}
                </span>
              </div>
            </>
          )}

          {/* Remaining for Installments */}
          {remainingForInstallments !== undefined && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Remaining for Installments</span>
              <span className="text-lg font-medium">
                {formatCurrency(remainingForInstallments, currency)}
              </span>
            </div>
          )}

          {/* Number of Installments */}
          {numberOfInstallments !== undefined && numberOfInstallments > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Number of Installments</span>
              <span className="text-lg font-medium">{numberOfInstallments}</span>
            </div>
          )}

          {/* Amount per Installment */}
          {amountPerInstallment !== undefined && amountPerInstallment > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount per Installment</span>
              <span className="text-lg font-semibold">
                {formatCurrency(amountPerInstallment, currency)}
              </span>
            </div>
          )}
        </div>

        {/* Helper Text */}
        {totalCourseValue > 0 && expectedCommission !== undefined && (
          <p className="text-xs text-muted-foreground pt-2 border-t">
            Commission calculated at {commissionRatePercent.toFixed(1)}% of commissionable value
          </p>
        )}
      </CardContent>
    </Card>
  )
}
