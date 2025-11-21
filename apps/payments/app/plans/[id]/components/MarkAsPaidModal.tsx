'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertTriangle } from 'lucide-react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils'
import { formatDateWithPreset } from '@pleeno/utils/date-helpers'
import { RecordPaymentSchema, type RecordPayment, type Installment } from '@pleeno/validations/installment.schema'
import { useRecordPayment } from '../hooks/useRecordPayment'

/**
 * MarkAsPaidModal Component Props
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 2: Mark as Paid UI Component
 */
interface MarkAsPaidModalProps {
  /** The installment to mark as paid */
  installment: Installment
  /** Whether the modal is open */
  isOpen: boolean
  /** Callback when modal should close */
  onClose: () => void
  /** Optional callback when payment is successfully recorded */
  onSuccess?: () => void
}

/**
 * MarkAsPaidModal Component
 *
 * Modal for recording installment payments with:
 * - React Hook Form + Zod validation
 * - Date picker (max: today)
 * - Amount input with 2 decimal validation
 * - Notes textarea with character counter
 * - Keyboard shortcuts (Esc to close, Enter to submit)
 * - Accessibility attributes
 * - Loading states
 * - TanStack Query mutation with optimistic UI updates
 * - Automatic cache invalidation and rollback on error
 *
 * @example
 * ```tsx
 * <MarkAsPaidModal
 *   installment={installment}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={() => {
 *     // Optional callback after successful payment recording
 *   }}
 * />
 * ```
 */
export function MarkAsPaidModal({ installment, isOpen, onClose, onSuccess }: MarkAsPaidModalProps) {
  const [notesCharCount, setNotesCharCount] = useState(0)

  // TanStack Query mutation for recording payment
  const { mutate: recordPayment, isPending } = useRecordPayment()

  // Get today's date in YYYY-MM-DD format for default and max values
  const today = new Date().toISOString().split('T')[0]

  // Calculate outstanding balance for partial payments
  const outstandingBalance = installment.amount - (installment.paid_amount || 0)

  // Determine default paid amount based on installment status
  const defaultPaidAmount = installment.status === 'partial'
    ? outstandingBalance
    : installment.amount

  // Set up React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid },
  } = useForm<RecordPayment>({
    resolver: zodResolver(RecordPaymentSchema),
    mode: 'onChange', // Validate on change for real-time feedback
    defaultValues: {
      paid_date: today,
      paid_amount: defaultPaidAmount,
      notes: '',
    },
  })

  // Watch notes field for character counter
  const notesValue = watch('notes')

  // Watch paid_amount field for partial payment detection
  const watchedPaidAmount = watch('paid_amount')

  // Determine if current payment is partial
  const isPaidAmountPartial = watchedPaidAmount < outstandingBalance

  // Calculate remaining balance after current payment
  const remainingBalance = Math.max(0, outstandingBalance - (watchedPaidAmount || 0))

  // Update character count when notes change
  useEffect(() => {
    setNotesCharCount(notesValue?.length || 0)
  }, [notesValue])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        paid_date: today,
        paid_amount: defaultPaidAmount,
        notes: '',
      })
      setNotesCharCount(0)
    }
  }, [isOpen, defaultPaidAmount, today, reset])

  /**
   * Handle form submission
   * Uses the useRecordPayment mutation hook with optimistic updates
   */
  const onSubmit = (data: RecordPayment) => {
    recordPayment(
      {
        installmentId: installment.id,
        paymentPlanId: installment.payment_plan_id,
        ...data,
      },
      {
        onSuccess: () => {
          // Call success callback
          onSuccess?.()

          // Close modal
          onClose()
        },
      }
    )
  }

  /**
   * Handle keyboard shortcuts
   * - Escape: Close modal (handled by Dialog component)
   * - Enter: Submit form when valid (handled by form onSubmit)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && isValid && !isPending) {
      e.preventDefault()
      handleSubmit(onSubmit)()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" aria-describedby="mark-as-paid-description">
        <DialogHeader>
          <DialogTitle>Mark Installment as Paid</DialogTitle>
          <DialogDescription id="mark-as-paid-description">
            Record payment for Installment #{installment.installment_number}
            {installment.student_due_date && (
              <>
                {' '}
                • Due:{' '}
                {formatDateWithPreset(installment.student_due_date, 'UTC', 'date')}
              </>
            )}
            {' • '}
            {installment.status === 'partial' ? (
              <>
                Outstanding: {formatCurrency(outstandingBalance, 'AUD')} of {formatCurrency(installment.amount, 'AUD')}
              </>
            ) : (
              <>Amount: {formatCurrency(installment.amount, 'AUD')}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown}>
          <div className="space-y-4 py-4">
            {/* Partial Payment Warning */}
            {isPaidAmountPartial && watchedPaidAmount > 0 && (
              <div className="flex items-start gap-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    This is a partial payment
                  </p>
                  <p className="text-sm text-yellow-700">
                    Outstanding balance after this payment:{' '}
                    <span className="font-semibold">
                      {formatCurrency(remainingBalance, 'AUD')}
                    </span>
                  </p>
                  <p className="text-xs text-yellow-600">
                    You can record another payment later to complete this installment.
                  </p>
                </div>
              </div>
            )}

            {/* Payment Date Field */}
            <div className="space-y-2">
              <Label htmlFor="paid_date">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paid_date"
                type="date"
                max={today}
                disabled={isPending}
                aria-required="true"
                aria-invalid={!!errors.paid_date}
                aria-describedby={errors.paid_date ? 'paid_date-error' : undefined}
                {...register('paid_date')}
              />
              {errors.paid_date && (
                <p id="paid_date-error" className="text-sm text-destructive" role="alert">
                  {errors.paid_date.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                The date when the payment was received (cannot be in the future)
              </p>
            </div>

            {/* Payment Amount Field */}
            <div className="space-y-2">
              <Label htmlFor="paid_amount">
                Amount Paid <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paid_amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="Enter amount paid"
                disabled={isPending}
                aria-required="true"
                aria-invalid={!!errors.paid_amount}
                aria-describedby={errors.paid_amount ? 'paid_amount-error' : 'paid_amount-help'}
                {...register('paid_amount', { valueAsNumber: true })}
              />
              {errors.paid_amount && (
                <p id="paid_amount-error" className="text-sm text-destructive" role="alert">
                  {errors.paid_amount.message}
                </p>
              )}
              <p id="paid_amount-help" className="text-xs text-muted-foreground">
                {installment.status === 'partial' ? (
                  <>
                    Outstanding balance: {formatCurrency(outstandingBalance, 'AUD')}
                    {' • '}
                    You can pay any amount up to this balance.
                  </>
                ) : (
                  <>
                    Can be less than the installment amount for partial payments.
                    {' '}
                    Expected: {formatCurrency(installment.amount, 'AUD')}
                  </>
                )}
              </p>
            </div>

            {/* Notes Field */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this payment (e.g., payment method, reference number)"
                rows={3}
                maxLength={500}
                disabled={isPending}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? 'notes-error' : 'notes-counter'}
                {...register('notes')}
              />
              {errors.notes && (
                <p id="notes-error" className="text-sm text-destructive" role="alert">
                  {errors.notes.message}
                </p>
              )}
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Optional notes about this payment
                </p>
                <p
                  id="notes-counter"
                  className={`text-xs ${notesCharCount > 450 ? 'text-destructive' : 'text-muted-foreground'}`}
                  aria-live="polite"
                >
                  {notesCharCount}/500
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !isValid}
              aria-busy={isPending}
            >
              {isPending ? (
                <>
                  <span className="mr-2">Recording...</span>
                  <span className="animate-spin">⏳</span>
                </>
              ) : (
                'Mark as Paid'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
