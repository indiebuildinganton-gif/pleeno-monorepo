/**
 * InstallmentsList Component
 *
 * Displays installments in a table with:
 * - Installment number
 * - Due date
 * - Amount
 * - Paid date (if paid)
 * - Paid amount (if paid/partial)
 * - Status badge
 * - Mark as Paid button (for pending and partial installments)
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 4: Payment Plan Detail Page Updates
 */

'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Button,
  Progress,
} from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils/formatters'
import { format, parseISO } from 'date-fns'
import { InstallmentStatusBadge } from '../../components/InstallmentStatusBadge'
import type { Installment } from '@pleeno/validations/installment.schema'

/**
 * InstallmentsList Props
 */
interface InstallmentsListProps {
  /** Array of installments to display */
  installments: Installment[]
  /** Currency code (e.g., AUD, USD) */
  currency: string
  /** Callback when user clicks "Mark as Paid" */
  onMarkAsPaid: (installment: Installment) => void
}

/**
 * InstallmentsList Component
 *
 * Displays installments in a responsive table with "Mark as Paid" buttons
 * for pending and partial installments.
 *
 * @example
 * ```tsx
 * <InstallmentsList
 *   installments={plan.installments}
 *   currency={plan.currency}
 *   onMarkAsPaid={(installment) => {
 *     setSelectedInstallment(installment)
 *     setIsModalOpen(true)
 *   }}
 * />
 * ```
 */
export function InstallmentsList({ installments, currency, onMarkAsPaid }: InstallmentsListProps) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead className="text-right">Paid Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => (
            <>
              <TableRow key={installment.id}>
                {/* Installment Number */}
                <TableCell className="font-medium">
                  {installment.installment_number}
                </TableCell>

                {/* Due Date */}
                <TableCell>
                  {installment.student_due_date ? (
                    <span className="text-sm">
                      {format(parseISO(installment.student_due_date), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </TableCell>

                {/* Amount */}
                <TableCell className="text-right font-semibold">
                  {formatCurrency(installment.amount, currency)}
                </TableCell>

                {/* Paid Date */}
                <TableCell>
                  {installment.paid_date ? (
                    <span className="text-sm">
                      {format(parseISO(installment.paid_date), 'MMM d, yyyy')}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>

                {/* Paid Amount */}
                <TableCell className="text-right">
                  {installment.paid_amount !== null ? (
                    <div className="space-y-1">
                      <div className="text-sm font-semibold">
                        {formatCurrency(installment.paid_amount, currency)}
                      </div>
                      {installment.status === 'partial' && (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(installment.amount - installment.paid_amount, currency)} remaining
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">-</span>
                  )}
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <InstallmentStatusBadge status={installment.status} />
                </TableCell>

                {/* Actions - Mark as Paid Button */}
                <TableCell>
                  {(installment.status === 'pending' || installment.status === 'partial') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onMarkAsPaid(installment)}
                    >
                      Mark as Paid
                    </Button>
                  )}
                </TableCell>
              </TableRow>

              {/* Partial Payment Details Row */}
              {installment.status === 'partial' && installment.paid_amount !== null && (
                <TableRow key={`${installment.id}-partial-details`}>
                  <TableCell colSpan={7} className="bg-yellow-50 border-t-0 py-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-yellow-800">
                          Partial Payment Progress
                        </span>
                        <span className="text-xs text-yellow-700">
                          {formatCurrency(installment.paid_amount, currency)} of{' '}
                          {formatCurrency(installment.amount, currency)} paid
                          {' '}({Math.round((installment.paid_amount / installment.amount) * 100)}%)
                        </span>
                      </div>
                      <Progress
                        value={(installment.paid_amount / installment.amount) * 100}
                        className="h-2 bg-yellow-200"
                      />
                      <div className="text-xs text-yellow-700">
                        Outstanding balance: {formatCurrency(installment.amount - installment.paid_amount, currency)}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
