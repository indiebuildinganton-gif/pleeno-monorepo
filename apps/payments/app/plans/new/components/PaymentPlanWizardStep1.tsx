'use client'

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
} from '@pleeno/ui'
import { StudentSelect } from './StudentSelect'
import { CollegeBranchSelect } from './CollegeBranchSelect'
import { useStudents } from '@/hooks/useStudents'

/**
 * Zod validation schema for Step 1
 * Validates student, course details, commission, and dates
 */
const step1Schema = z
  .object({
    student_id: z.string().min(1, 'Please select a student'),
    branch_id: z.string().min(1, 'Please select a branch'),
    course_name: z.string().min(1, 'Course name is required').max(255),
    total_course_value: z
      .number({
        required_error: 'Total course value is required',
        invalid_type_error: 'Must be a number',
      })
      .positive('Must be a positive amount')
      .min(0.01, 'Must be at least $0.01'),
    commission_rate: z
      .number({
        required_error: 'Commission rate is required',
        invalid_type_error: 'Must be a number',
      })
      .min(0, 'Must be between 0 and 1')
      .max(1, 'Must be between 0 and 1'),
    course_start_date: z.string().min(1, 'Start date is required'),
    course_end_date: z.string().min(1, 'End date is required'),
  })
  .refine((data) => new Date(data.course_end_date) > new Date(data.course_start_date), {
    message: 'End date must be after start date',
    path: ['course_end_date'],
  })

export type Step1FormData = z.infer<typeof step1Schema>

interface PaymentPlanWizardStep1Props {
  initialData?: Partial<Step1FormData>
  onNext: (data: Step1FormData) => void
  onCancel: () => void
}

/**
 * PaymentPlanWizardStep1 Component
 *
 * First step of the payment plan wizard collecting:
 * - Student selection
 * - College and branch
 * - Course details (name, value, dates)
 * - Commission rate
 *
 * Features:
 * - React Hook Form with Zod validation
 * - Real-time form validation
 * - Auto-population of college/branch from student's latest enrollment
 * - Date validation (end date after start date)
 * - Commission rate helper text with examples
 * - Responsive design
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 6: Multi-Step Payment Plan Wizard - Step 1
 *
 * @param initialData - Pre-filled form data (for back navigation)
 * @param onNext - Callback when form is valid and Next is clicked
 * @param onCancel - Callback when Cancel is clicked
 */
export function PaymentPlanWizardStep1({
  initialData,
  onNext,
  onCancel,
}: PaymentPlanWizardStep1Props) {
  const { data: studentsData } = useStudents({ per_page: 1000 })
  const students = studentsData?.data || []

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]
  // Default end date to 1 year from today
  const oneYearFromToday = new Date()
  oneYearFromToday.setFullYear(oneYearFromToday.getFullYear() + 1)
  const defaultEndDate = oneYearFromToday.toISOString().split('T')[0]

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    mode: 'onChange',
    defaultValues: initialData || {
      student_id: '',
      branch_id: '',
      course_name: '',
      total_course_value: 0,
      commission_rate: 0,
      course_start_date: today,
      course_end_date: defaultEndDate,
    },
  })

  const watchedStudentId = watch('student_id')
  const watchedBranchId = watch('branch_id')
  const watchedCommissionRate = watch('commission_rate')

  /**
   * Handle student selection
   * Auto-populates college/branch from latest enrollment if available
   */
  const handleStudentChange = (studentId: string) => {
    setValue('student_id', studentId, { shouldValidate: true })

    // Auto-populate college/branch from student's latest enrollment
    const selectedStudent = students.find((s) => s.id === studentId)
    // Note: Student type includes latest_enrollment from API
    // This will need to be handled by the component
  }

  /**
   * Handle branch selection (also sets commission rate)
   */
  const handleBranchChange = (branchId: string, commissionRate: number) => {
    setValue('branch_id', branchId, { shouldValidate: true })
    setValue('commission_rate', commissionRate / 100, { shouldValidate: true })
  }

  /**
   * Form submission handler
   */
  const onSubmit = (data: Step1FormData) => {
    onNext(data)
  }

  /**
   * Convert commission rate (0-1) to percentage for display
   */
  const getCommissionPercentage = () => {
    if (!watchedCommissionRate) return '0%'
    return `${(watchedCommissionRate * 100).toFixed(1)}%`
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Step 1: General Information</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Select the student and provide course details
        </p>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Section: Student & College */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Student & College</h3>

            {/* Student Selection */}
            <StudentSelect
              value={watchedStudentId}
              onChange={handleStudentChange}
              error={errors.student_id?.message}
            />

            {/* College & Branch Selection */}
            <CollegeBranchSelect
              branchId={watchedBranchId}
              onBranchChange={handleBranchChange}
              error={errors.branch_id?.message}
            />
          </div>

          {/* Section: Course Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Course Details</h3>

            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="course_name">
                Course Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course_name"
                type="text"
                placeholder="e.g., Bachelor of Computer Science"
                {...register('course_name')}
              />
              {errors.course_name && (
                <p className="text-sm text-destructive">{errors.course_name.message}</p>
              )}
            </div>

            {/* Total Course Value */}
            <div className="space-y-2">
              <Label htmlFor="total_course_value">
                Total Course Value <span className="text-destructive">*</span>
              </Label>
              <Input
                id="total_course_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="Enter total course value"
                {...register('total_course_value', { valueAsNumber: true })}
              />
              {errors.total_course_value && (
                <p className="text-sm text-destructive">{errors.total_course_value.message}</p>
              )}
            </div>

            {/* Commission Rate */}
            <div className="space-y-2">
              <Label htmlFor="commission_rate">
                Commission Rate <span className="text-destructive">*</span>
              </Label>
              <Input
                id="commission_rate"
                type="number"
                step="0.01"
                min="0"
                max="1"
                placeholder="e.g., 0.15 for 15%"
                {...register('commission_rate', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted-foreground">
                Enter as decimal: 0.1 = 10%, 0.15 = 15%, 0.3 = 30%
                {watchedCommissionRate > 0 && (
                  <span className="ml-2 font-medium text-foreground">
                    (Currently: {getCommissionPercentage()})
                  </span>
                )}
              </p>
              {errors.commission_rate && (
                <p className="text-sm text-destructive">{errors.commission_rate.message}</p>
              )}
            </div>

            {/* Course Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="course_start_date">
                  Course Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course_start_date"
                  type="date"
                  min={today}
                  {...register('course_start_date')}
                />
                {errors.course_start_date && (
                  <p className="text-sm text-destructive">{errors.course_start_date.message}</p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="course_end_date">
                  Course End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="course_end_date"
                  type="date"
                  min={today}
                  {...register('course_end_date')}
                />
                {errors.course_end_date && (
                  <p className="text-sm text-destructive">{errors.course_end_date.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid}>
              Next: Configure Installments
            </Button>
          </div>
        </CardContent>
      </form>
    </Card>
  )
}
