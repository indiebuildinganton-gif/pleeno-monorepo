'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  cn,
} from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils'
import { CheckCircle2 } from 'lucide-react'


/**
 * Installment object from generate-installments API
 */
export interface Installment {
  installment_number: number
  amount: number
  student_due_date: string // ISO date
  college_due_date: string // ISO date
  is_initial_payment: boolean
  generates_commission: boolean
  status: 'draft' | 'paid'
}

interface InstallmentTableProps {
  installments: Installment[]
  totalCourseValue: number
  currency?: string
  className?: string
}

/**
 * InstallmentTable Component
 *
 * Displays a comprehensive table of payment plan installments with:
 * - Installment number (0 = Initial Payment, 1-N = regular installments)
 * - Amount (currency formatted)
 * - Student due date
 * - College due date
 * - Status badge (Paid/Draft)
 * - Commission-eligible indicator
 * - Total row with validation
 *
 * Features:
 * - Initial payment row highlighted
 * - Status badges with color coding
 * - Commission eligibility indicators
 * - Validation footer showing total vs expected
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 10: InstallmentTable Component
 *
 * @param installments - Array of installment objects to display
 * @param totalCourseValue - Expected total for validation
 * @param currency - Currency code (default: 'AUD')
 * @param className - Optional CSS classes
 */
export function InstallmentTable({
  installments,
  totalCourseValue,
  currency = 'AUD',
  className,
}: InstallmentTableProps) {
  // Calculate total from installments
  const installmentTotal = installments.reduce((sum, inst) => sum + inst.amount, 0)

  // Check if total reconciles (allow 1 cent rounding difference)
  const VALIDATION_TOLERANCE = 0.01
  const difference = Math.abs(installmentTotal - totalCourseValue)
  const isValid = difference < VALIDATION_TOLERANCE

  /**
   * Format date for display
   */
  const formatDate = (dateStr: string): string => {
    if (!dateStr) return '-'

    try {
      const date = new Date(dateStr)
      return date.toLocaleDateString('en-AU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return '-'
    }
  }

  /**
   * Get installment label (Initial Payment or Installment N)
   */
  const getInstallmentLabel = (installment: Installment): string => {
    if (installment.is_initial_payment) {
      return 'Initial Payment'
    }
    return `Installment ${installment.installment_number}`
  }

  return (
    <div className={cn('rounded-md border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">#</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Student Due Date</TableHead>
            <TableHead>College Due Date</TableHead>
            <TableHead className="text-center">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No installments generated yet
              </TableCell>
            </TableRow>
          ) : (
            installments.map((installment) => (
              <TableRow
                key={installment.installment_number}
                className={cn(
                  installment.is_initial_payment &&
                    'bg-blue-50/50 dark:bg-blue-950/20 font-medium'
                )}
              >
                {/* Installment Number/Label */}
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getInstallmentLabel(installment)}
                    {installment.generates_commission && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right font-medium">
                  {formatCurrency(installment.amount, currency)}
                </TableCell>

                {/* Student Due Date */}
                <TableCell>{formatDate(installment.student_due_date)}</TableCell>

                {/* College Due Date */}
                <TableCell>{formatDate(installment.college_due_date)}</TableCell>

                {/* Status */}
                <TableCell className="text-center">
                  {installment.status === 'paid' ? (
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Draft</Badge>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>

        {installments.length > 0 && (
          <TableFooter>
            <TableRow>
              <TableCell className="font-bold">Total</TableCell>
              <TableCell className="text-right font-bold">
                {formatCurrency(installmentTotal, currency)}
              </TableCell>
              <TableCell colSpan={2}></TableCell>
              <TableCell className="text-center">
                {isValid ? (
                  <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                    ✓ Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    ⚠ Invalid
                  </Badge>
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
