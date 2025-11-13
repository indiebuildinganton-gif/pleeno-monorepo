'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@pleeno/ui'

interface PaymentPlanSummaryProps {
  totalAmount: number
  commissionRate: number
  expectedCommission: number
  currency?: string
}

/**
 * PaymentPlanSummary Component
 *
 * Displays real-time preview of payment plan calculations including:
 * - Total amount
 * - Commission rate (read-only, from branch)
 * - Expected commission (calculated in real-time)
 *
 * @param totalAmount - The total payment amount
 * @param commissionRate - Commission rate percentage (0-100)
 * @param expectedCommission - Calculated expected commission amount
 * @param currency - Currency code (default: AUD)
 */
export function PaymentPlanSummary({
  totalAmount,
  commissionRate,
  expectedCommission,
  currency = 'AUD',
}: PaymentPlanSummaryProps) {
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <Card className="bg-muted/50">
      <CardHeader>
        <CardTitle className="text-lg">Payment Plan Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Amount:</span>
          <span className="font-semibold text-lg">{formatCurrency(totalAmount)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Commission Rate:</span>
          <span className="font-medium">{commissionRate.toFixed(2)}%</span>
        </div>

        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Expected Commission:</span>
            <span className="font-bold text-xl text-primary">
              {formatCurrency(expectedCommission)}
            </span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground mt-2">
          Commission is calculated as {commissionRate.toFixed(2)}% of the total amount
        </div>
      </CardContent>
    </Card>
  )
}
