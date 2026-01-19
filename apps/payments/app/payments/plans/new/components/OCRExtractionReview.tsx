'use client'

import { useState, useEffect } from 'react'
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Alert,
  AlertDescription,
  AlertTitle,
  Switch,
} from '@pleeno/ui'
import { AlertTriangle, Check, Edit2 } from 'lucide-react'
import { OCRConfidenceIndicator, OCRConfidenceDot, getConfidenceLevel } from './OCRConfidenceIndicator'
import type { PaymentPlanOCRResult, PaymentPlanConfidenceScores } from '@pleeno/validations'
import type { Step1FormData } from './PaymentPlanWizardStep1'
import type { Step2FormData } from './PaymentPlanWizardStep2'

export interface OCRExtractionReviewProps {
  /**
   * OCR extraction result
   */
  extraction: PaymentPlanOCRResult
  /**
   * Callback when user proceeds to wizard
   */
  onProceed: (step1Data: Partial<Step1FormData>, step2Data: Partial<Step2FormData>) => void
  /**
   * Callback when user cancels/goes back
   */
  onBack: () => void
  /**
   * Whether proceeding is disabled
   */
  isDisabled?: boolean
}

/**
 * OCRExtractionReview Component
 *
 * Displays extracted data from OCR with confidence indicators,
 * allowing users to review and edit before proceeding to the wizard.
 *
 * Features:
 * - Field-level confidence indicators
 * - Inline editing for all extracted fields
 * - Warning banner for low confidence fields
 * - Pre-population of wizard data on proceed
 *
 * Epic 4: Payments Domain
 * Story: Payment Plan OCR Upload
 */
export function OCRExtractionReview({
  extraction,
  onProceed,
  onBack,
  isDisabled = false,
}: OCRExtractionReviewProps) {
  // Editable state for all fields
  const [studentName, setStudentName] = useState(extraction.student_name || '')
  const [courseName, setCourseName] = useState(extraction.course_name || '')
  const [totalCourseValue, setTotalCourseValue] = useState(
    extraction.total_course_value?.toString() || ''
  )
  const [commissionRate, setCommissionRate] = useState(
    extraction.commission_rate !== null
      ? (extraction.commission_rate * 100).toString()
      : ''
  )
  const [courseStartDate, setCourseStartDate] = useState(extraction.course_start_date || '')
  const [courseEndDate, setCourseEndDate] = useState(extraction.course_end_date || '')
  const [initialPaymentAmount, setInitialPaymentAmount] = useState(
    extraction.initial_payment_amount?.toString() || ''
  )
  const [initialPaymentDueDate, setInitialPaymentDueDate] = useState(
    extraction.initial_payment_due_date || ''
  )
  const [numberOfInstallments, setNumberOfInstallments] = useState(
    extraction.number_of_installments?.toString() || ''
  )
  const [paymentFrequency, setPaymentFrequency] = useState<string>(
    extraction.payment_frequency || ''
  )
  const [materialsCost, setMaterialsCost] = useState(
    extraction.materials_cost?.toString() || ''
  )
  const [adminFees, setAdminFees] = useState(extraction.admin_fees?.toString() || '')
  const [otherFees, setOtherFees] = useState(extraction.other_fees?.toString() || '')
  const [firstPaymentDueDate, setFirstPaymentDueDate] = useState(
    extraction.first_payment_due_date || ''
  )
  const [gstInclusive, setGstInclusive] = useState(extraction.gst_inclusive ?? true)

  const scores = extraction.confidence_scores

  /**
   * Get fields with low confidence for warning banner
   */
  const getLowConfidenceFields = (): Array<{ field: string; score: number }> => {
    const fields: Array<{ field: string; score: number }> = []
    const fieldNames: Record<keyof PaymentPlanConfidenceScores, string> = {
      student_name: 'Student Name',
      course_name: 'Course Name',
      total_course_value: 'Total Course Value',
      commission_rate: 'Commission Rate',
      course_start_date: 'Course Start Date',
      course_end_date: 'Course End Date',
      initial_payment_amount: 'Initial Payment',
      initial_payment_due_date: 'Initial Payment Due Date',
      number_of_installments: 'Number of Installments',
      payment_frequency: 'Payment Frequency',
      materials_cost: 'Materials Cost',
      admin_fees: 'Admin Fees',
      other_fees: 'Other Fees',
      first_payment_due_date: 'First Payment Due Date',
      gst_inclusive: 'GST Inclusive',
      installments: 'Installments',
      overall: 'Overall',
    }

    for (const [key, value] of Object.entries(scores)) {
      if (key !== 'overall' && value < 0.5) {
        fields.push({
          field: fieldNames[key as keyof PaymentPlanConfidenceScores] || key,
          score: value,
        })
      }
    }

    return fields.sort((a, b) => a.score - b.score)
  }

  const lowConfidenceFields = getLowConfidenceFields()
  const hasLowConfidence = lowConfidenceFields.length > 0

  /**
   * Handle proceed to wizard
   */
  const handleProceed = () => {
    // Build Step 1 data
    const step1Data: Partial<Step1FormData> = {}

    // Note: student_name extracted but student_id needs to be selected in wizard
    // We pass it as a hint for the wizard
    if (studentName) {
      // Student selection happens in wizard - we just store the name as a hint
      (step1Data as any).extracted_student_name = studentName
    }
    if (courseName) step1Data.course_name = courseName
    if (totalCourseValue) {
      step1Data.total_course_value = parseFloat(totalCourseValue)
    }
    if (commissionRate) {
      step1Data.commission_rate = parseFloat(commissionRate) / 100 // Convert from percentage to decimal
    }
    if (courseStartDate) step1Data.course_start_date = courseStartDate
    if (courseEndDate) step1Data.course_end_date = courseEndDate

    // Build Step 2 data
    const step2Data: Partial<Step2FormData> = {}
    if (initialPaymentAmount) {
      step2Data.initial_payment_amount = parseFloat(initialPaymentAmount)
    }
    if (initialPaymentDueDate) {
      step2Data.initial_payment_due_date = initialPaymentDueDate
    }
    if (numberOfInstallments) {
      step2Data.number_of_installments = parseInt(numberOfInstallments, 10)
    }
    if (paymentFrequency && ['monthly', 'quarterly', 'custom'].includes(paymentFrequency)) {
      step2Data.payment_frequency = paymentFrequency as 'monthly' | 'quarterly' | 'custom'
    }
    if (materialsCost) {
      step2Data.materials_cost = parseFloat(materialsCost)
    }
    if (adminFees) {
      step2Data.admin_fees = parseFloat(adminFees)
    }
    if (otherFees) {
      step2Data.other_fees = parseFloat(otherFees)
    }
    if (firstPaymentDueDate) {
      step2Data.first_college_due_date = firstPaymentDueDate
    }
    step2Data.gst_inclusive = gstInclusive

    onProceed(step1Data, step2Data)
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner for Low Confidence */}
      {hasLowConfidence && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Please Review These Fields</AlertTitle>
          <AlertDescription>
            The following fields have low extraction confidence and may need correction:{' '}
            <span className="font-medium">
              {lowConfidenceFields.map((f) => f.field).join(', ')}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Overall Confidence */}
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <h3 className="font-medium">Extraction Confidence</h3>
          <p className="text-sm text-muted-foreground">
            Overall accuracy of the extracted data
          </p>
        </div>
        <OCRConfidenceIndicator score={scores.overall} showPercentage size="lg" />
      </div>

      {/* Step 1 Fields: General Information */}
      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Student, course, and commission details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Student Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="student_name">Student Name</Label>
              <OCRConfidenceDot score={scores.student_name} />
            </div>
            <Input
              id="student_name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Student name"
              className={getConfidenceLevel(scores.student_name) === 'low' ? 'border-red-300' : ''}
            />
            <p className="text-xs text-muted-foreground">
              You'll select the actual student from your registry in the next step
            </p>
          </div>

          {/* Course Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="course_name">Course Name</Label>
              <OCRConfidenceDot score={scores.course_name} />
            </div>
            <Input
              id="course_name"
              value={courseName}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="Course or program name"
              className={getConfidenceLevel(scores.course_name) === 'low' ? 'border-red-300' : ''}
            />
          </div>

          {/* Total Course Value */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="total_course_value">Total Course Value ($)</Label>
              <OCRConfidenceDot score={scores.total_course_value} />
            </div>
            <Input
              id="total_course_value"
              type="number"
              value={totalCourseValue}
              onChange={(e) => setTotalCourseValue(e.target.value)}
              placeholder="0.00"
              className={getConfidenceLevel(scores.total_course_value) === 'low' ? 'border-red-300' : ''}
            />
          </div>

          {/* Commission Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="commission_rate">Commission Rate (%)</Label>
              <OCRConfidenceDot score={scores.commission_rate} />
            </div>
            <Input
              id="commission_rate"
              type="number"
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
              placeholder="0"
              min="0"
              max="100"
              className={getConfidenceLevel(scores.commission_rate) === 'low' ? 'border-red-300' : ''}
            />
          </div>

          {/* Course Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="course_start_date">Course Start Date</Label>
                <OCRConfidenceDot score={scores.course_start_date} />
              </div>
              <Input
                id="course_start_date"
                type="date"
                value={courseStartDate}
                onChange={(e) => setCourseStartDate(e.target.value)}
                className={getConfidenceLevel(scores.course_start_date) === 'low' ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="course_end_date">Course End Date</Label>
                <OCRConfidenceDot score={scores.course_end_date} />
              </div>
              <Input
                id="course_end_date"
                type="date"
                value={courseEndDate}
                onChange={(e) => setCourseEndDate(e.target.value)}
                className={getConfidenceLevel(scores.course_end_date) === 'low' ? 'border-red-300' : ''}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2 Fields: Payment Structure */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Structure</CardTitle>
          <CardDescription>
            Initial payment and installment configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Initial Payment */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="initial_payment_amount">Initial Payment ($)</Label>
                <OCRConfidenceDot score={scores.initial_payment_amount} />
              </div>
              <Input
                id="initial_payment_amount"
                type="number"
                value={initialPaymentAmount}
                onChange={(e) => setInitialPaymentAmount(e.target.value)}
                placeholder="0.00"
                className={getConfidenceLevel(scores.initial_payment_amount) === 'low' ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="initial_payment_due_date">Initial Payment Due</Label>
                <OCRConfidenceDot score={scores.initial_payment_due_date} />
              </div>
              <Input
                id="initial_payment_due_date"
                type="date"
                value={initialPaymentDueDate}
                onChange={(e) => setInitialPaymentDueDate(e.target.value)}
                className={getConfidenceLevel(scores.initial_payment_due_date) === 'low' ? 'border-red-300' : ''}
              />
            </div>
          </div>

          {/* Installments */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="number_of_installments">Number of Installments</Label>
                <OCRConfidenceDot score={scores.number_of_installments} />
              </div>
              <Input
                id="number_of_installments"
                type="number"
                value={numberOfInstallments}
                onChange={(e) => setNumberOfInstallments(e.target.value)}
                placeholder="1"
                min="1"
                className={getConfidenceLevel(scores.number_of_installments) === 'low' ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="payment_frequency">Payment Frequency</Label>
                <OCRConfidenceDot score={scores.payment_frequency} />
              </div>
              <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                <SelectTrigger
                  id="payment_frequency"
                  className={getConfidenceLevel(scores.payment_frequency) === 'low' ? 'border-red-300' : ''}
                >
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* First Payment Due Date */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="first_payment_due_date">First Installment Due Date</Label>
              <OCRConfidenceDot score={scores.first_payment_due_date} />
            </div>
            <Input
              id="first_payment_due_date"
              type="date"
              value={firstPaymentDueDate}
              onChange={(e) => setFirstPaymentDueDate(e.target.value)}
              className={getConfidenceLevel(scores.first_payment_due_date) === 'low' ? 'border-red-300' : ''}
            />
          </div>

          {/* Non-Commissionable Fees */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="materials_cost">Materials Cost ($)</Label>
                <OCRConfidenceDot score={scores.materials_cost} />
              </div>
              <Input
                id="materials_cost"
                type="number"
                value={materialsCost}
                onChange={(e) => setMaterialsCost(e.target.value)}
                placeholder="0.00"
                className={getConfidenceLevel(scores.materials_cost) === 'low' ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="admin_fees">Admin Fees ($)</Label>
                <OCRConfidenceDot score={scores.admin_fees} />
              </div>
              <Input
                id="admin_fees"
                type="number"
                value={adminFees}
                onChange={(e) => setAdminFees(e.target.value)}
                placeholder="0.00"
                className={getConfidenceLevel(scores.admin_fees) === 'low' ? 'border-red-300' : ''}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="other_fees">Other Fees ($)</Label>
                <OCRConfidenceDot score={scores.other_fees} />
              </div>
              <Input
                id="other_fees"
                type="number"
                value={otherFees}
                onChange={(e) => setOtherFees(e.target.value)}
                placeholder="0.00"
                className={getConfidenceLevel(scores.other_fees) === 'low' ? 'border-red-300' : ''}
              />
            </div>
          </div>

          {/* GST Inclusive */}
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <Label htmlFor="gst_inclusive" className="font-normal">
                GST Inclusive
              </Label>
              <OCRConfidenceDot score={scores.gst_inclusive} />
            </div>
            <Switch
              id="gst_inclusive"
              checked={gstInclusive}
              onCheckedChange={setGstInclusive}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isDisabled}>
          Back
        </Button>
        <Button onClick={handleProceed} disabled={isDisabled}>
          <Check className="mr-2 h-4 w-4" />
          Continue to Wizard
        </Button>
      </div>
    </div>
  )
}
