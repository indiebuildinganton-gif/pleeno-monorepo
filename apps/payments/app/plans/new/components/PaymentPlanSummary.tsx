'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils'
import { cn } from '@/lib/utils'

interface PaymentPlanSummaryProps {
  totalAmount: number
  commissionRate: number
  expectedCommission: number
  currency: string
  className?: string
}

/**
 * PaymentPlanSummary Component
 *
 * Displays real-time preview of payment plan calculations including:
 * - Total amount with currency formatting
 * - Commission rate (read-only, from branch)
 * - Expected commission (calculated in real-time, highlighted in green)
 *
 * Updates in real-time as the user types the total amount or changes commission rate.
 * Uses the commission-calculator utility for client-side calculations that match
 * the database calculation exactly.
 *
 * @param totalAmount - The total payment amount
 * @param commissionRate - Commission rate percentage (0-100)
 * @param expectedCommission - Calculated expected commission amount
 * @param currency - Currency code (USD, EUR, GBP, AUD, etc.)
 * @param className - Optional additional CSS classes
 */
export function PaymentPlanSummary({
  totalAmount,
  commissionRate,
  expectedCommission,
  currency,
  className,
}: PaymentPlanSummaryProps) {
  return (
    <Card className={cn('bg-card', className)}>
      <CardHeader>
        <CardTitle className="text-lg">Payment Plan Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-xl font-bold">
              {formatCurrency(totalAmount, currency)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Commission Rate</span>
            <span className="text-lg font-medium">{commissionRate}%</span>
          </div>

          <div className="border-t pt-3" />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Expected Commission
            </span>
            <span className="text-2xl font-bold text-green-600">
              {formatCurrency(expectedCommission, currency)}
            </span>
          </div>
        </div>

        {totalAmount > 0 && (
          <p className="text-xs text-muted-foreground">
            Commission calculated at {commissionRate}% of total amount
          </p>
        )}
      </CardContent>
    </Card>
  )
}
