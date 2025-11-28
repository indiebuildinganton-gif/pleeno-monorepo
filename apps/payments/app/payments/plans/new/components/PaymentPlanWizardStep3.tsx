'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Badge,
} from '@pleeno/ui'
import { formatCurrency, calculateCommissionableValue, calculateExpectedCommission } from '@pleeno/utils'
import { InstallmentTable, type Installment } from './InstallmentTable'
import { Step1FormData } from './PaymentPlanWizardStep1'
import { Step2FormData } from './PaymentPlanWizardStep2'
import { useStudents } from '@/hooks/useStudents'
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react'

/**
 * Placeholder type for Step 3 data
 * This will be implemented in Task 8
 */
export type Step3FormData = {
  // Review and confirmation will be defined in Task 8
  // Placeholder for now
  confirmed?: boolean
}

interface PaymentPlanWizardStep3Props {
  step1Data: Step1FormData
  step2Data: Step2FormData
  generatedInstallments: Installment[]
  onBack: () => void
  onEditStep1: () => void
  onEditStep2: () => void
  onCreate: () => void
  isCreating?: boolean
}

/**
 * PaymentPlanWizardStep3 Component
 *
 * Third and final step of the payment plan wizard showing:
 * - Comprehensive payment plan summary
 * - Complete installment schedule table
 * - Validation of amounts reconciliation
 * - Navigation to edit previous steps or create payment plan
 *
 * Features:
 * - Displays selected student, course, and commission details
 * - Shows complete installment schedule with validation
 * - Highlights total commission (green emphasis)
 * - Validates that installments sum to total course value
 * - Edit buttons to navigate back to Step 1 or Step 2
 * - Create button to finalize payment plan
 * - Loading state during API call
 * - Error handling with user feedback
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 8: Multi-Step Payment Plan Wizard - Step 3
 *
 * @param step1Data - Data from Step 1 (student, course, commission)
 * @param step2Data - Data from Step 2 (fees, installments, dates)
 * @param generatedInstallments - Generated installment preview
 * @param onBack - Callback when Back is clicked
 * @param onEditStep1 - Callback to navigate to Step 1
 * @param onEditStep2 - Callback to navigate to Step 2
 * @param onCreate - Callback when Create is clicked
 * @param isCreating - Whether the creation is in progress
 */
export function PaymentPlanWizardStep3({
  step1Data,
  step2Data,
  generatedInstallments,
  onBack,
  onEditStep1,
  onEditStep2,
  onCreate,
  isCreating = false,
}: PaymentPlanWizardStep3Props) {

  // Fetch students to get student name
  const { data: studentsData } = useStudents({ per_page: 1000 })
  const students = studentsData?.data || []
  const selectedStudent = students.find((s) => s.id === step1Data.student_id)

  // Calculate values for summary
  const commissionableValue = calculateCommissionableValue(
    step1Data.total_course_value,
    step2Data.materials_cost || 0,
    step2Data.admin_fees || 0,
    step2Data.other_fees || 0
  )

  const expectedCommission = calculateExpectedCommission(
    commissionableValue,
    step1Data.commission_rate,
    step2Data.gst_inclusive
  )

  const totalFees =
    (step2Data.materials_cost || 0) +
    (step2Data.admin_fees || 0) +
    (step2Data.other_fees || 0)

  // Validation: Check if installments sum to commissionable value
  const VALIDATION_TOLERANCE = 0.01
  const installmentTotal = generatedInstallments.reduce((sum, inst) => sum + inst.amount, 0)
  const difference = Math.abs(installmentTotal - commissionableValue)
  const isValid = difference < VALIDATION_TOLERANCE

  // Convert commission rate to percentage for display
  const commissionRatePercent = step1Data.commission_rate * 100

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
   * Get payment frequency display name
   */
  const getFrequencyLabel = (frequency: string): string => {
    switch (frequency) {
      case 'monthly':
        return 'Monthly'
      case 'quarterly':
        return 'Quarterly'
      case 'custom':
        return 'Custom'
      default:
        return frequency
    }
  }

  return (
    <Card className="w-full max-w-5xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Step 3: Review & Confirmation</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Review the payment plan summary and installment schedule before creating
        </p>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Payment Plan Summary Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Payment Plan Summary</h3>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Selected Student */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Selected Student</p>
                <p className="text-lg font-semibold">
                  {selectedStudent
                    ? `${selectedStudent.first_name} ${selectedStudent.last_name}`
                    : 'Loading...'}
                </p>
                {selectedStudent && (
                  <p className="text-sm text-muted-foreground">{selectedStudent.email}</p>
                )}
              </div>

              {/* Course */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Course</p>
                <p className="text-base font-medium">{step1Data.course_name}</p>
              </div>

              {/* Course Dates */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Course Dates</p>
                <p className="text-base">
                  {formatDate(step1Data.course_start_date)} -{' '}
                  {formatDate(step1Data.course_end_date)}
                </p>
              </div>

              {/* Total Course Value */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Course Value</p>
                <p className="text-2xl font-bold">
                  {formatCurrency(step1Data.total_course_value, 'AUD')}
                </p>
              </div>

              {/* Non-Commissionable Fees */}
              {totalFees > 0 && (
                <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm font-medium">Non-Commissionable Fees:</p>
                  <div className="space-y-1 text-sm">
                    {step2Data.materials_cost! > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Materials:</span>
                        <span>{formatCurrency(step2Data.materials_cost!, 'AUD')}</span>
                      </div>
                    )}
                    {step2Data.admin_fees! > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Admin:</span>
                        <span>{formatCurrency(step2Data.admin_fees!, 'AUD')}</span>
                      </div>
                    )}
                    {step2Data.other_fees! > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Other:</span>
                        <span>{formatCurrency(step2Data.other_fees!, 'AUD')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-medium pt-1 border-t">
                      <span>Total Fees:</span>
                      <span>{formatCurrency(totalFees, 'AUD')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Commission Details - Highlighted */}
              <div className="rounded-lg border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-4 space-y-3">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  Commission Details
                </p>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-800 dark:text-green-200">Commission Rate:</span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {commissionRatePercent.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-green-800 dark:text-green-200">
                      Commissionable Value:
                    </span>
                    <span className="font-medium text-green-900 dark:text-green-100">
                      {formatCurrency(commissionableValue, 'AUD')}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-green-200 dark:border-green-800">
                    <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                      Total Commission:
                    </span>
                    <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(expectedCommission, 'AUD')}
                    </span>
                  </div>
                </div>
              </div>

              {/* GST Status */}
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">GST Status</p>
                <Badge variant={step2Data.gst_inclusive ? 'default' : 'secondary'}>
                  {step2Data.gst_inclusive ? 'GST Inclusive' : 'GST Exclusive'}
                </Badge>
              </div>

              {/* Payment Structure */}
              <div className="space-y-2 rounded-lg border p-3 bg-muted/30">
                <p className="text-sm font-medium">Payment Structure:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Frequency:</span>
                    <span className="font-medium">
                      {getFrequencyLabel(step2Data.payment_frequency)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Number of Installments:</span>
                    <span className="font-medium">{step2Data.number_of_installments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student Lead Time:</span>
                    <span className="font-medium">{step2Data.student_lead_time_days} days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Installment Schedule Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h3 className="text-lg font-semibold">Installment Schedule</h3>
            <Badge variant="outline">
              {generatedInstallments.length} installment
              {generatedInstallments.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Validation Banner */}
          {isValid ? (
            <Alert className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertDescription className="text-green-900 dark:text-green-100">
                <span className="font-medium">Amounts reconcile correctly</span> - Installments sum
                to commissionable value
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">
                    Warning: Installments do not sum to commissionable value
                  </p>
                  <div className="text-sm">
                    <p>Expected: {formatCurrency(commissionableValue, 'AUD')}</p>
                    <p>Actual: {formatCurrency(installmentTotal, 'AUD')}</p>
                    <p>Difference: {formatCurrency(difference, 'AUD')}</p>
                  </div>
                  <p className="text-sm mt-2">
                    Please go back to Step 2 and regenerate the installments.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Installment Table */}
          <InstallmentTable
            installments={generatedInstallments}
            totalCourseValue={commissionableValue}
            currency="AUD"
          />

          {/* Helper Text */}
          <p className="text-xs text-muted-foreground">
            <CheckCircle2 className="inline h-3 w-3 mr-1 text-green-600 dark:text-green-400" />
            All installments generate commission based on the{' '}
            {commissionRatePercent.toFixed(1)}% commission rate
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-wrap gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={onBack} disabled={isCreating}>
            Back to Step 2
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onEditStep1}
            disabled={isCreating}
            className="ml-auto"
          >
            Edit General Info
          </Button>

          <Button type="button" variant="outline" onClick={onEditStep2} disabled={isCreating}>
            Edit Payment Structure
          </Button>

          <Button
            type="button"
            onClick={onCreate}
            disabled={!isValid || isCreating}
            className="bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Payment Plan...
              </>
            ) : (
              'Create Payment Plan'
            )}
          </Button>
        </div>

        {/* Validation Help Text */}
        {!isValid && (
          <p className="text-sm text-muted-foreground text-center">
            The "Create Payment Plan" button is disabled because the installment amounts do not
            reconcile. Please review and regenerate the installments.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
