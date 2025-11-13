'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Textarea,
} from '@pleeno/ui'
import { calculateExpectedCommission } from '@pleeno/utils'
import { useCreatePaymentPlan } from '@/hooks/useCreatePaymentPlan'
import { EnrollmentSelect } from './EnrollmentSelect'
import { PaymentPlanSummary } from './PaymentPlanSummary'

/**
 * Client-side form validation schema
 * Extends the server-side schema with client-specific requirements
 */
const paymentPlanFormSchema = z.object({
  enrollment_id: z.string().min(1, 'Please select an enrollment'),
  total_amount: z
    .number({
      required_error: 'Total amount is required',
      invalid_type_error: 'Total amount must be a number',
    })
    .positive('Amount must be greater than 0')
    .min(0.01, 'Amount must be at least $0.01')
    .finite('Amount must be a finite number'),
  start_date: z.string().min(1, 'Start date is required'),
  commission_rate: z.number().min(0).max(100),
  notes: z.string().max(10000, 'Notes cannot exceed 10,000 characters').optional().nullable(),
  reference_number: z
    .string()
    .max(255, 'Reference number cannot exceed 255 characters')
    .optional()
    .nullable(),
})

type PaymentPlanFormData = z.infer<typeof paymentPlanFormSchema>

/**
 * PaymentPlanForm Component
 *
 * Main form component for creating payment plans with:
 * - Enrollment selection with search
 * - Form fields for amount, date, notes, reference
 * - Real-time validation with inline errors
 * - Real-time commission preview
 * - API submission handling
 */
export function PaymentPlanForm() {
  const router = useRouter()
  const createPaymentPlan = useCreatePaymentPlan()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentPlanFormData>({
    resolver: zodResolver(paymentPlanFormSchema),
    defaultValues: {
      enrollment_id: '',
      total_amount: 0,
      start_date: new Date().toISOString().split('T')[0],
      commission_rate: 0,
      notes: '',
      reference_number: '',
    },
  })

  // Watch form values for real-time calculations
  const watchedAmount = watch('total_amount')
  const watchedRate = watch('commission_rate')
  const watchedEnrollment = watch('enrollment_id')

  // Calculate expected commission in real-time
  const expectedCommission = calculateExpectedCommission(watchedAmount || 0, watchedRate || 0)

  const handleEnrollmentChange = (enrollmentId: string, commissionRate: number) => {
    setValue('enrollment_id', enrollmentId, { shouldValidate: true })
    setValue('commission_rate', commissionRate, { shouldValidate: true })
  }

  const onSubmit = (data: PaymentPlanFormData) => {
    // Prepare data for API (exclude commission_rate as it's auto-populated server-side)
    const apiData = {
      enrollment_id: data.enrollment_id,
      total_amount: data.total_amount,
      start_date: data.start_date,
      notes: data.notes || null,
      reference_number: data.reference_number || null,
    }

    // Use TanStack Query mutation
    createPaymentPlan.mutate(apiData)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Payment Plan</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Enrollment Selection */}
          <EnrollmentSelect
            value={watchedEnrollment}
            onChange={handleEnrollmentChange}
            error={errors.enrollment_id?.message}
          />

          {/* Total Amount */}
          <div className="space-y-2">
            <Label htmlFor="total_amount">
              Total Amount <span className="text-destructive">*</span>
            </Label>
            <Input
              id="total_amount"
              type="number"
              step="0.01"
              placeholder="Enter total amount"
              disabled={createPaymentPlan.isPending}
              {...register('total_amount', { valueAsNumber: true })}
            />
            {errors.total_amount && (
              <p className="text-sm text-destructive">{errors.total_amount.message}</p>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start_date">
              Start Date <span className="text-destructive">*</span>
            </Label>
            <Input
              id="start_date"
              type="date"
              disabled={createPaymentPlan.isPending}
              {...register('start_date')}
            />
            {errors.start_date && (
              <p className="text-sm text-destructive">{errors.start_date.message}</p>
            )}
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes or comments about this payment plan"
              rows={4}
              disabled={createPaymentPlan.isPending}
              {...register('notes')}
            />
            {errors.notes && <p className="text-sm text-destructive">{errors.notes.message}</p>}
          </div>

          {/* Reference Number (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reference_number">Reference Number (Optional)</Label>
            <Input
              id="reference_number"
              type="text"
              placeholder="Invoice #, PO #, etc."
              disabled={createPaymentPlan.isPending}
              {...register('reference_number')}
            />
            {errors.reference_number && (
              <p className="text-sm text-destructive">{errors.reference_number.message}</p>
            )}
          </div>

          {/* Payment Plan Summary - Real-time Preview */}
          {watchedEnrollment && watchedAmount > 0 && (
            <PaymentPlanSummary
              totalAmount={watchedAmount}
              commissionRate={watchedRate}
              expectedCommission={expectedCommission}
              currency="AUD"
            />
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={createPaymentPlan.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createPaymentPlan.isPending}>
              {createPaymentPlan.isPending ? 'Creating...' : 'Create Payment Plan'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
