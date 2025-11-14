'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
} from '@pleeno/ui'
import { PaymentPlanSummary } from './PaymentPlanSummary'
import { Step1FormData } from './PaymentPlanWizardStep1'
import {
  calculateCommissionableValue,
  calculateExpectedCommission,
} from '@pleeno/utils/src/commission-calculator'
import { calculateStudentDueDate } from '@pleeno/utils/src/date-helpers'
import { Loader2 } from 'lucide-react'

/**
 * Zod validation schema for Step 2
 * Validates payment structure configuration
 */
const step2Schema = z
  .object({
    initial_payment_amount: z
      .number({
        invalid_type_error: 'Must be a number',
      })
      .nonnegative('Must be 0 or greater')
      .default(0),
    initial_payment_due_date: z.string().optional(),
    initial_payment_paid: z.boolean().default(false),
    number_of_installments: z
      .number({
        required_error: 'Number of installments is required',
        invalid_type_error: 'Must be a number',
      })
      .int('Must be a whole number')
      .min(1, 'Must be at least 1')
      .max(24, 'Cannot exceed 24 installments'),
    payment_frequency: z.enum(['monthly', 'quarterly', 'custom'], {
      required_error: 'Please select a payment frequency',
    }),
    materials_cost: z
      .number({
        invalid_type_error: 'Must be a number',
      })
      .nonnegative('Must be 0 or greater')
      .default(0),
    admin_fees: z
      .number({
        invalid_type_error: 'Must be a number',
      })
      .nonnegative('Must be 0 or greater')
      .default(0),
    other_fees: z
      .number({
        invalid_type_error: 'Must be a number',
      })
      .nonnegative('Must be 0 or greater')
      .default(0),
    first_college_due_date: z.string().min(1, 'First college due date is required'),
    student_lead_time_days: z
      .number({
        required_error: 'Student lead time is required',
        invalid_type_error: 'Must be a number',
      })
      .int('Must be a whole number')
      .nonnegative('Must be 0 or greater')
      .default(7),
    gst_inclusive: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // If initial payment amount > 0, due date is required
      if (data.initial_payment_amount > 0 && !data.initial_payment_due_date) {
        return false
      }
      return true
    },
    {
      message: 'Initial payment due date is required when amount is specified',
      path: ['initial_payment_due_date'],
    }
  )

export type Step2FormData = z.infer<typeof step2Schema>

interface PaymentPlanWizardStep2Props {
  initialData?: Partial<Step2FormData>
  step1Data: Step1FormData
  onNext: (data: Step2FormData) => void
  onBack: () => void
}

/**
 * PaymentPlanWizardStep2 Component
 *
 * Second step of the payment plan wizard handling:
 * - Initial payment configuration
 * - Installment configuration (count, frequency)
 * - Non-commissionable fees
 * - Due date timeline configuration
 * - GST handling
 * - Real-time payment summary with commission calculations
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Real-time calculation updates using form.watch()
 * - Conditional field enabling (initial payment fields)
 * - Date preview for student due dates
 * - Side-by-side layout with summary panel
 * - Integration with generate-installments API
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 7: Multi-Step Payment Plan Wizard - Step 2
 *
 * @param initialData - Pre-filled form data (for back navigation)
 * @param step1Data - Data from Step 1 (student, course, commission)
 * @param onNext - Callback when form is valid and Generate Installments is clicked
 * @param onBack - Callback when Back is clicked
 */
export function PaymentPlanWizardStep2({
  initialData,
  step1Data,
  onNext,
  onBack,
}: PaymentPlanWizardStep2Props) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)

  // Get today's date in YYYY-MM-DD format (for min date validation)
  const today = new Date().toISOString().split('T')[0]

  // Get course start date from Step 1 (for min first college due date)
  const courseStartDate = step1Data.course_start_date

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<Step2FormData>({
    resolver: zodResolver(step2Schema),
    mode: 'onChange',
    defaultValues: initialData || {
      initial_payment_amount: 0,
      initial_payment_due_date: '',
      initial_payment_paid: false,
      number_of_installments: 1,
      payment_frequency: 'monthly',
      materials_cost: 0,
      admin_fees: 0,
      other_fees: 0,
      first_college_due_date: '',
      student_lead_time_days: 7,
      gst_inclusive: true,
    },
  })

  // Watch form values for real-time calculations
  const formValues = watch()

  // Calculate commissionable value
  const commissionableValue = calculateCommissionableValue(
    step1Data.total_course_value,
    formValues.materials_cost || 0,
    formValues.admin_fees || 0,
    formValues.other_fees || 0
  )

  // Calculate expected commission
  const expectedCommission = calculateExpectedCommission(
    commissionableValue,
    step1Data.commission_rate,
    formValues.gst_inclusive
  )

  // Calculate remaining after initial payment
  const remainingAfterInitial = commissionableValue - (formValues.initial_payment_amount || 0)

  // Calculate amount per installment (with proper rounding)
  const amountPerInstallment =
    formValues.number_of_installments > 0
      ? Math.floor((remainingAfterInitial * 100) / formValues.number_of_installments) / 100
      : 0

  // Calculate preview student due date
  const [previewStudentDueDate, setPreviewStudentDueDate] = useState<string>('')

  useEffect(() => {
    if (formValues.first_college_due_date && formValues.student_lead_time_days !== undefined) {
      try {
        const collegeDueDate = new Date(formValues.first_college_due_date)
        const studentDueDate = calculateStudentDueDate(
          collegeDueDate,
          formValues.student_lead_time_days
        )
        setPreviewStudentDueDate(studentDueDate.toISOString().split('T')[0])
      } catch (error) {
        setPreviewStudentDueDate('')
      }
    } else {
      setPreviewStudentDueDate('')
    }
  }, [formValues.first_college_due_date, formValues.student_lead_time_days])

  // Validate that total fees don't exceed course value
  const totalFees =
    (formValues.materials_cost || 0) + (formValues.admin_fees || 0) + (formValues.other_fees || 0)
  const feesExceedCourseValue = totalFees >= step1Data.total_course_value

  // Validate that initial payment doesn't exceed commissionable value
  const initialPaymentExceedsValue =
    (formValues.initial_payment_amount || 0) > commissionableValue

  /**
   * Form submission handler
   * Combines Step 1 + Step 2 data and calls generate-installments API
   */
  const onSubmit = async (data: Step2FormData) => {
    setIsGenerating(true)
    setApiError(null)

    try {
      // Note: The API endpoint expects a payment plan ID, but in the wizard flow,
      // we haven't created the payment plan yet. This will need to be adjusted
      // based on the actual implementation in Task 8.
      // For now, we'll just pass the data to the next step.
      onNext(data)
    } catch (error) {
      setApiError(error instanceof Error ? error.message : 'Failed to generate installments')
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Form */}
      <div className="lg:col-span-2">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Step 2: Payment Structure</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure payment schedule, fees, and due dates
            </p>
          </CardHeader>

          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Section: Initial Payment */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Initial Payment</h3>

                {/* Initial Payment Amount */}
                <div className="space-y-2">
                  <Label htmlFor="initial_payment_amount">Initial Payment Amount</Label>
                  <Input
                    id="initial_payment_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={commissionableValue}
                    placeholder="0.00 (optional)"
                    {...register('initial_payment_amount', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional upfront payment before installments begin (max:{' '}
                    {commissionableValue.toFixed(2)})
                  </p>
                  {errors.initial_payment_amount && (
                    <p className="text-sm text-destructive">
                      {errors.initial_payment_amount.message}
                    </p>
                  )}
                  {initialPaymentExceedsValue && (
                    <p className="text-sm text-destructive">
                      Initial payment cannot exceed commissionable value
                    </p>
                  )}
                </div>

                {/* Initial Payment Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="initial_payment_due_date">
                    Initial Payment Due Date
                    {(formValues.initial_payment_amount || 0) > 0 && (
                      <span className="text-destructive"> *</span>
                    )}
                  </Label>
                  <Input
                    id="initial_payment_due_date"
                    type="date"
                    min={today}
                    disabled={(formValues.initial_payment_amount || 0) === 0}
                    {...register('initial_payment_due_date')}
                  />
                  {errors.initial_payment_due_date && (
                    <p className="text-sm text-destructive">
                      {errors.initial_payment_due_date.message}
                    </p>
                  )}
                </div>

                {/* Initial Payment Paid Toggle */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="initial_payment_paid"
                    checked={formValues.initial_payment_paid}
                    onCheckedChange={(checked) => setValue('initial_payment_paid', checked)}
                    disabled={(formValues.initial_payment_amount || 0) === 0}
                  />
                  <Label
                    htmlFor="initial_payment_paid"
                    className={
                      (formValues.initial_payment_amount || 0) === 0
                        ? 'text-muted-foreground'
                        : ''
                    }
                  >
                    Has the initial payment already been paid?
                  </Label>
                </div>
              </div>

              {/* Section: Installment Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Installments</h3>

                {/* Number of Installments */}
                <div className="space-y-2">
                  <Label htmlFor="number_of_installments">
                    Number of Installments <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="number_of_installments"
                    type="number"
                    min="1"
                    max="24"
                    {...register('number_of_installments', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Regular installments (not including initial payment). Maximum 24 installments.
                  </p>
                  {errors.number_of_installments && (
                    <p className="text-sm text-destructive">
                      {errors.number_of_installments.message}
                    </p>
                  )}
                </div>

                {/* Payment Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="payment_frequency">
                    Payment Frequency <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formValues.payment_frequency}
                    onValueChange={(value) =>
                      setValue('payment_frequency', value as 'monthly' | 'quarterly' | 'custom')
                    }
                  >
                    <SelectTrigger id="payment_frequency">
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">
                        <div>
                          <div className="font-medium">Monthly</div>
                          <div className="text-xs text-muted-foreground">
                            Installments due every month
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="quarterly">
                        <div>
                          <div className="font-medium">Quarterly</div>
                          <div className="text-xs text-muted-foreground">
                            Installments due every 3 months
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="custom">
                        <div>
                          <div className="font-medium">Custom</div>
                          <div className="text-xs text-muted-foreground">
                            Manually configure due dates
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.payment_frequency && (
                    <p className="text-sm text-destructive">{errors.payment_frequency.message}</p>
                  )}
                </div>
              </div>

              {/* Section: Non-Commissionable Fees */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Non-Commissionable Fees</h3>
                <p className="text-sm text-muted-foreground">
                  These fees are excluded from commission calculations
                </p>

                {/* Materials Cost */}
                <div className="space-y-2">
                  <Label htmlFor="materials_cost">Materials Cost</Label>
                  <Input
                    id="materials_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('materials_cost', { valueAsNumber: true })}
                  />
                  {errors.materials_cost && (
                    <p className="text-sm text-destructive">{errors.materials_cost.message}</p>
                  )}
                </div>

                {/* Admin Fees */}
                <div className="space-y-2">
                  <Label htmlFor="admin_fees">Admin Fees</Label>
                  <Input
                    id="admin_fees"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('admin_fees', { valueAsNumber: true })}
                  />
                  {errors.admin_fees && (
                    <p className="text-sm text-destructive">{errors.admin_fees.message}</p>
                  )}
                </div>

                {/* Other Fees */}
                <div className="space-y-2">
                  <Label htmlFor="other_fees">Other Fees</Label>
                  <Input
                    id="other_fees"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('other_fees', { valueAsNumber: true })}
                  />
                  {errors.other_fees && (
                    <p className="text-sm text-destructive">{errors.other_fees.message}</p>
                  )}
                </div>

                {feesExceedCourseValue && (
                  <p className="text-sm text-destructive">
                    Total fees cannot equal or exceed the total course value
                  </p>
                )}
              </div>

              {/* Section: Due Date Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Payment Timeline</h3>

                {/* First College Due Date */}
                <div className="space-y-2">
                  <Label htmlFor="first_college_due_date">
                    First Installment College Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="first_college_due_date"
                    type="date"
                    min={courseStartDate}
                    {...register('first_college_due_date')}
                  />
                  <p className="text-xs text-muted-foreground">
                    When the first payment is due to the college (must be after course start date)
                  </p>
                  {errors.first_college_due_date && (
                    <p className="text-sm text-destructive">
                      {errors.first_college_due_date.message}
                    </p>
                  )}
                </div>

                {/* Student Lead Time */}
                <div className="space-y-2">
                  <Label htmlFor="student_lead_time_days">
                    Student Lead Time (days) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="student_lead_time_days"
                    type="number"
                    min="0"
                    {...register('student_lead_time_days', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    How many days before college due date must students pay
                  </p>
                  {errors.student_lead_time_days && (
                    <p className="text-sm text-destructive">
                      {errors.student_lead_time_days.message}
                    </p>
                  )}
                </div>

                {/* Preview: First Student Due Date */}
                {previewStudentDueDate && (
                  <div className="space-y-2">
                    <Label>Preview: First Student Due Date</Label>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium">
                        {new Date(previewStudentDueDate).toLocaleDateString('en-AU', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Students will need to pay {formValues.student_lead_time_days} days before
                        the college due date
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Section: GST Configuration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">GST</h3>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="gst_inclusive" className="text-base">
                      GST Inclusive
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {formValues.gst_inclusive
                        ? 'Amounts already include GST'
                        : 'GST will be calculated separately'}
                    </p>
                  </div>
                  <Switch
                    id="gst_inclusive"
                    checked={formValues.gst_inclusive}
                    onCheckedChange={(checked) => setValue('gst_inclusive', checked)}
                  />
                </div>
              </div>

              {/* API Error */}
              {apiError && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                  <p className="text-sm font-medium">{apiError}</p>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="outline" onClick={onBack} disabled={isGenerating}>
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={
                    !isValid ||
                    isGenerating ||
                    feesExceedCourseValue ||
                    initialPaymentExceedsValue
                  }
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Generate Installments'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      </div>

      {/* Right Column: Real-Time Summary */}
      <div className="lg:col-span-1">
        <div className="sticky top-6">
          <PaymentPlanSummary
            totalCourseValue={step1Data.total_course_value}
            commissionRate={step1Data.commission_rate}
            currency="AUD"
            materialsCost={formValues.materials_cost || 0}
            adminFees={formValues.admin_fees || 0}
            otherFees={formValues.other_fees || 0}
            initialPaymentAmount={formValues.initial_payment_amount || 0}
            commissionableValue={commissionableValue}
            expectedCommission={expectedCommission}
            numberOfInstallments={formValues.number_of_installments}
            amountPerInstallment={amountPerInstallment}
          />
        </div>
      </div>
    </div>
  )
}
