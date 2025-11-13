'use client'

import { useState } from 'react'
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
  useToast,
} from '@pleeno/ui'
import { calculateExpectedCommission, createEnrollmentWithOfferLetter } from '@pleeno/utils'
import { useCreatePaymentPlan } from '@/hooks/useCreatePaymentPlan'
import { StudentSelect } from './StudentSelect'
import { CollegeBranchSelect } from './CollegeBranchSelect'
import { OfferLetterUpload } from './OfferLetterUpload'
import { PaymentPlanSummary } from './PaymentPlanSummary'

/**
 * Client-side form validation schema
 * Updated to include enrollment creation fields
 */
const paymentPlanFormSchema = z.object({
  // Enrollment fields (required to create enrollment)
  student_id: z.string().min(1, 'Please select a student'),
  branch_id: z.string().min(1, 'Please select a branch'),
  program_name: z.string().min(1, 'Program name is required').max(255),
  // Payment plan fields
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
 * Main form component for creating payment plans with inline enrollment creation:
 * - Student selection with search
 * - College and branch selection (cascading)
 * - Program name input
 * - Offer letter upload (optional)
 * - Form fields for amount, date, notes, reference
 * - Real-time validation with inline errors
 * - Real-time commission preview
 * - Creates enrollment before payment plan
 * - Handles duplicate enrollments (reuses existing)
 */
export function PaymentPlanForm() {
  const router = useRouter()
  const { addToast } = useToast()
  const createPaymentPlan = useCreatePaymentPlan()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [offerLetterFile, setOfferLetterFile] = useState<File | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PaymentPlanFormData>({
    resolver: zodResolver(paymentPlanFormSchema),
    defaultValues: {
      student_id: '',
      branch_id: '',
      program_name: '',
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
  const watchedStudentId = watch('student_id')
  const watchedBranchId = watch('branch_id')

  // Calculate expected commission in real-time
  const expectedCommission = calculateExpectedCommission(watchedAmount || 0, watchedRate || 0)

  /**
   * Handle student selection
   */
  const handleStudentChange = (studentId: string) => {
    setValue('student_id', studentId, { shouldValidate: true })
  }

  /**
   * Handle branch selection (also sets commission rate)
   */
  const handleBranchChange = (branchId: string, commissionRate: number) => {
    setValue('branch_id', branchId, { shouldValidate: true })
    setValue('commission_rate', commissionRate, { shouldValidate: true })
  }

  /**
   * Handle offer letter file selection
   */
  const handleOfferLetterChange = (file: File | null) => {
    setOfferLetterFile(file)
  }

  /**
   * Submit handler - creates enrollment first, then payment plan
   */
  const onSubmit = async (data: PaymentPlanFormData) => {
    setIsSubmitting(true)

    try {
      // Step 1: Create or find enrollment (with optional offer letter)
      const enrollment = await createEnrollmentWithOfferLetter(
        data.student_id,
        data.branch_id,
        data.program_name,
        offerLetterFile || undefined
      )

      // Show notification if enrollment was reused
      if (enrollment.is_existing) {
        addToast({
          title: 'Existing enrollment found',
          description: 'Using existing enrollment for this student-college-program combination.',
          variant: 'default',
        })
      }

      // Step 2: Create payment plan with the enrollment_id
      const paymentPlanData = {
        enrollment_id: enrollment.id,
        total_amount: data.total_amount,
        start_date: data.start_date,
        notes: data.notes || null,
        reference_number: data.reference_number || null,
      }

      // Use TanStack Query mutation
      createPaymentPlan.mutate(paymentPlanData)
    } catch (error) {
      // Handle enrollment creation errors
      const errorMessage = error instanceof Error ? error.message : 'Failed to create enrollment'
      addToast({
        title: 'Enrollment creation failed',
        description: errorMessage,
        variant: 'error',
      })
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Payment Plan</CardTitle>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Section: Enrollment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Enrollment Information</h3>

            {/* Student Selection */}
            <StudentSelect
              value={watchedStudentId}
              onChange={handleStudentChange}
              error={errors.student_id?.message}
              disabled={isSubmitting}
            />

            {/* College & Branch Selection */}
            <CollegeBranchSelect
              branchId={watchedBranchId}
              onBranchChange={handleBranchChange}
              error={errors.branch_id?.message}
              disabled={isSubmitting}
            />

            {/* Program Name */}
            <div className="space-y-2">
              <Label htmlFor="program_name">
                Program Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="program_name"
                type="text"
                placeholder="e.g., Bachelor of Computer Science"
                disabled={isSubmitting}
                {...register('program_name')}
              />
              {errors.program_name && (
                <p className="text-sm text-destructive">{errors.program_name.message}</p>
              )}
            </div>

            {/* Offer Letter Upload */}
            <OfferLetterUpload
              value={offerLetterFile}
              onFileSelect={handleOfferLetterChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Section: Payment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Payment Details</h3>

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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
                {...register('reference_number')}
              />
              {errors.reference_number && (
                <p className="text-sm text-destructive">{errors.reference_number.message}</p>
              )}
            </div>
          </div>

          {/* Payment Plan Summary - Real-time Preview */}
          {watchedBranchId && watchedAmount > 0 && (
            <PaymentPlanSummary
              totalAmount={watchedAmount}
              commissionRate={watchedRate}
              expectedCommission={expectedCommission}
              currency="AUD"
            />
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Payment Plan'}
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
