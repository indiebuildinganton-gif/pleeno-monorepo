'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
  useToast,
} from '@pleeno/ui'
import { formatCurrency } from '@pleeno/utils/formatters'
import { formatDateWithPreset, DateFormatPresets } from '@pleeno/utils/date-helpers'
import { RecordPaymentSchema, type RecordPayment, type Installment } from '@pleeno/validations/installment.schema'

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
 * - Optimistic UI updates (will be implemented in Task 3)
 *
 * @example
 * ```tsx
 * <MarkAsPaidModal
 *   installment={installment}
 *   isOpen={isModalOpen}
 *   onClose={() => setIsModalOpen(false)}
 *   onSuccess={() => {
 *     // Refresh data
 *     refetch()
 *   }}
 * />
 * ```
 */
export function MarkAsPaidModal({ installment, isOpen, onClose, onSuccess }: MarkAsPaidModalProps) {
  const { addToast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notesCharCount, setNotesCharCount] = useState(0)

  // Get today's date in YYYY-MM-DD format for default and max values
  const today = new Date().toISOString().split('T')[0]

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
      paid_amount: installment.amount,
      notes: '',
    },
  })

  // Watch notes field for character counter
  const notesValue = watch('notes')

  // Update character count when notes change
  useEffect(() => {
    setNotesCharCount(notesValue?.length || 0)
  }, [notesValue])

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        paid_date: today,
        paid_amount: installment.amount,
        notes: '',
      })
      setNotesCharCount(0)
    }
  }, [isOpen, installment.amount, today, reset])

  /**
   * Handle form submission
   * TODO: Task 3 will implement the actual mutation using TanStack Query
   */
  const onSubmit = async (data: RecordPayment) => {
    setIsSubmitting(true)

    try {
      // TODO: Task 3 - Call useRecordPayment mutation here
      // For now, just simulate an API call
      console.log('Recording payment:', {
        installment_id: installment.id,
        ...data,
      })

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Show success toast
      addToast({
        title: 'Payment recorded',
        description: `Installment #${installment.installment_number} marked as paid`,
        variant: 'default',
      })

      // Call success callback
      onSuccess?.()

      // Close modal
      onClose()
    } catch (error) {
      // Show error toast
      const errorMessage = error instanceof Error ? error.message : 'Failed to record payment'
      addToast({
        title: 'Error',
        description: errorMessage,
        variant: 'error',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  /**
   * Handle keyboard shortcuts
   * - Escape: Close modal (handled by Dialog component)
   * - Enter: Submit form when valid (handled by form onSubmit)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && isValid && !isSubmitting) {
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
            Amount: {formatCurrency(installment.amount, 'AUD')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} onKeyDown={handleKeyDown}>
          <div className="space-y-4 py-4">
            {/* Payment Date Field */}
            <div className="space-y-2">
              <Label htmlFor="paid_date">
                Payment Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="paid_date"
                type="date"
                max={today}
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                Can be less than the installment amount for partial payments. Expected: {formatCurrency(installment.amount, 'AUD')}
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
                disabled={isSubmitting}
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
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !isValid}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
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
