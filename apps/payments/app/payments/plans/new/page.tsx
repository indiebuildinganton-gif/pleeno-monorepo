'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@pleeno/ui'
import { FileText, Keyboard, Upload, ArrowLeft } from 'lucide-react'
import { WizardStepper } from './components/WizardStepper'
import { PaymentPlanWizardStep1, type Step1FormData } from './components/PaymentPlanWizardStep1'
import { PaymentPlanWizardStep2, type Step2FormData } from './components/PaymentPlanWizardStep2'
import { PaymentPlanWizardStep3 } from './components/PaymentPlanWizardStep3'
import { DocumentUpload } from './components/DocumentUpload'
import { OCRExtractionReview } from './components/OCRExtractionReview'
import { type Installment } from './components/InstallmentTable'
import {
  calculateCommissionableValue,
  calculateExpectedCommission,
  generateInstallmentDueDates,
  calculateStudentDueDate,
} from '@pleeno/utils'
import { getApiUrl } from '@/hooks/useApiUrl'
import { useExtractFromDocument, type ExtractFromDocumentResult } from '@/hooks/useExtractFromDocument'

/**
 * Mode for payment plan creation
 */
type CreationMode = 'select-mode' | 'ocr-upload' | 'ocr-review' | 'wizard'

/**
 * New Payment Plan Wizard Page
 *
 * Multi-step wizard for creating payment plans with flexible installment structures:
 * - Mode Selection: Choose between manual entry or OCR upload
 * - OCR Upload: Upload document for AI-powered extraction
 * - OCR Review: Review and edit extracted data
 * - Step 1: General information (student, course, commission, dates)
 * - Step 2: Configure installments (Task 7)
 * - Step 3: Review and create (Task 8)
 *
 * Features:
 * - OCR-powered document extraction (Premium feature)
 * - Step-by-step navigation
 * - Form data persistence across steps
 * - Cancel confirmation dialog
 * - Progress indicator
 *
 * Route: /payments/plans/new
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Story: Payment Plan OCR Upload
 */
export default function NewPaymentPlanPage() {
  const router = useRouter()

  // Mode and OCR state
  const [mode, setMode] = useState<CreationMode>('select-mode')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractionResult, setExtractionResult] = useState<ExtractFromDocumentResult | null>(null)
  const [prePopulatedStep1, setPrePopulatedStep1] = useState<Partial<Step1FormData> | null>(null)
  const [prePopulatedStep2, setPrePopulatedStep2] = useState<Partial<Step2FormData> | null>(null)

  // OCR extraction mutation
  const extractMutation = useExtractFromDocument()

  // Wizard state management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null)
  const [step2Data, setStep2Data] = useState<Step2FormData | null>(null)
  const [generatedInstallments, setGeneratedInstallments] = useState<Installment[]>([])
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  /**
   * Step configuration for progress indicator
   */
  const steps = [
    { number: 1 as const, label: 'General Info' },
    { number: 2 as const, label: 'Installments' },
    { number: 3 as const, label: 'Review' },
  ]

  /**
   * Handle Step 1 completion
   * Saves data and navigates to Step 2
   */
  const handleStep1Next = (data: Step1FormData) => {
    setStep1Data(data)
    setCurrentStep(2)
  }

  /**
   * Generate installments from Step 1 and Step 2 data
   */
  const generateInstallments = (
    step1: Step1FormData,
    step2: Step2FormData
  ): Installment[] => {
    // Calculate commissionable value
    const commissionableValue = calculateCommissionableValue(
      step1.total_course_value,
      step2.materials_cost || 0,
      step2.admin_fees || 0,
      step2.other_fees || 0
    )

    // Calculate remaining amount after initial payment
    const remainingAfterInitial = commissionableValue - (step2.initial_payment_amount || 0)

    // Calculate base amount per installment (with proper rounding)
    const baseAmountPerInstallment =
      Math.floor((remainingAfterInitial * 100) / step2.number_of_installments) / 100

    // Calculate total base amount across all installments
    const totalBaseAmount = baseAmountPerInstallment * step2.number_of_installments

    // Calculate remainder cents to distribute to final installment
    const remainder = Math.round((remainingAfterInitial - totalBaseAmount) * 100) / 100

    const installments: Installment[] = []

    // Generate initial payment installment (installment_number = 0)
    if (step2.initial_payment_amount && step2.initial_payment_amount > 0 && step2.initial_payment_due_date) {
      const initialPaymentDueDate = new Date(step2.initial_payment_due_date)

      // For initial payment, student due date = college due date (no lead time)
      installments.push({
        installment_number: 0,
        amount: Math.round(step2.initial_payment_amount * 100) / 100,
        student_due_date: initialPaymentDueDate.toISOString(),
        college_due_date: initialPaymentDueDate.toISOString(),
        is_initial_payment: true,
        generates_commission: true,
        status: step2.initial_payment_paid ? 'paid' : 'draft',
      })
    }

    // Generate regular installments (1..N)
    if (step2.payment_frequency === 'custom') {
      // For custom frequency, generate placeholder due dates
      for (let i = 1; i <= step2.number_of_installments; i++) {
        const amount =
          i === step2.number_of_installments
            ? baseAmountPerInstallment + remainder
            : baseAmountPerInstallment

        installments.push({
          installment_number: i,
          amount: Math.round(amount * 100) / 100,
          student_due_date: '', // Placeholder for custom frequency
          college_due_date: '', // Placeholder for custom frequency
          is_initial_payment: false,
          generates_commission: true,
          status: 'draft',
        })
      }
    } else {
      // Generate college due dates based on frequency
      const firstCollegeDueDate = new Date(step2.first_college_due_date)
      const collegeDueDates = generateInstallmentDueDates(
        firstCollegeDueDate,
        step2.number_of_installments,
        step2.payment_frequency
      )

      // Create installment objects with calculated due dates
      collegeDueDates.forEach((collegeDueDate, index) => {
        const installmentNumber = index + 1

        // Calculate student due date using lead time
        const studentDueDate = calculateStudentDueDate(
          collegeDueDate,
          step2.student_lead_time_days
        )

        // Add remainder to final installment for exact reconciliation
        const amount =
          installmentNumber === step2.number_of_installments
            ? baseAmountPerInstallment + remainder
            : baseAmountPerInstallment

        installments.push({
          installment_number: installmentNumber,
          amount: Math.round(amount * 100) / 100,
          student_due_date: studentDueDate.toISOString(),
          college_due_date: collegeDueDate.toISOString(),
          is_initial_payment: false,
          generates_commission: true,
          status: 'draft',
        })
      })
    }

    return installments
  }

  /**
   * Handle Step 2 completion
   * Generates installments and navigates to Step 3
   */
  const handleStep2Next = (data: Step2FormData) => {
    setStep2Data(data)

    // Generate installments from step1 and step2 data
    if (step1Data) {
      const installments = generateInstallments(step1Data, data)
      setGeneratedInstallments(installments)
    }

    setCurrentStep(3)
  }

  /**
   * Handle back navigation from Step 2
   */
  const handleStep2Back = () => {
    setCurrentStep(1)
  }

  /**
   * Handle back navigation from Step 3
   */
  const handleStep3Back = () => {
    setCurrentStep(2)
  }

  /**
   * Handle cancel from Step 1
   * Shows confirmation dialog
   */
  const handleCancel = () => {
    setShowCancelDialog(true)
  }

  /**
   * Confirm cancellation
   * Redirects back to payment plans list
   */
  const confirmCancel = () => {
    router.back()
  }

  /**
   * Handle file selection for OCR
   */
  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file)
    if (file) {
      extractMutation.mutate(file, {
        onSuccess: (result) => {
          setExtractionResult(result)
          setMode('ocr-review')
        },
      })
    }
  }

  /**
   * Handle proceeding from OCR review to wizard
   */
  const handleOCRProceed = (
    step1Partial: Partial<Step1FormData>,
    step2Partial: Partial<Step2FormData>
  ) => {
    setPrePopulatedStep1(step1Partial)
    setPrePopulatedStep2(step2Partial)
    setMode('wizard')
  }

  /**
   * Handle going back from OCR review to upload
   */
  const handleOCRBack = () => {
    setMode('ocr-upload')
    setExtractionResult(null)
  }

  /**
   * Reset to mode selection
   */
  const handleBackToModeSelection = () => {
    setMode('select-mode')
    setSelectedFile(null)
    setExtractionResult(null)
    setPrePopulatedStep1(null)
    setPrePopulatedStep2(null)
  }

  /**
   * Handle payment plan creation from Step 3
   * Creates enrollment (if needed), payment plan, and installments
   */
  const handleCreate = async () => {
    if (!step1Data || !step2Data) {
      console.error('Missing step data')
      return
    }

    setIsCreating(true)

    try {
      // Calculate commissionable value for the payment plan total
      const commissionableValue = calculateCommissionableValue(
        step1Data.total_course_value,
        step2Data.materials_cost || 0,
        step2Data.admin_fees || 0,
        step2Data.other_fees || 0
      )

      // Step 1: Create or find enrollment
      // First, try to find an existing enrollment for this student-branch combination
      let enrollmentId: string | null = null

      const findEnrollmentResponse = await fetch(
        `/api/enrollments?student_id=${step1Data.student_id}&branch_id=${step1Data.branch_id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (findEnrollmentResponse.ok) {
        const enrollmentsData = await findEnrollmentResponse.json()
        const existingEnrollments = enrollmentsData.data || []

        // Find an active enrollment for this student-branch
        const existingEnrollment = existingEnrollments.find(
          (e: any) =>
            e.student_id === step1Data.student_id &&
            e.branch_id === step1Data.branch_id &&
            e.status === 'active'
        )

        if (existingEnrollment) {
          enrollmentId = existingEnrollment.id
        }
      }

      // If no existing enrollment found, create a new one
      if (!enrollmentId) {
        const createEnrollmentResponse = await fetch(getApiUrl('/api/enrollments'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            student_id: step1Data.student_id,
            branch_id: step1Data.branch_id,
            program_name: step1Data.course_name,
            start_date: step1Data.course_start_date,
            end_date: step1Data.course_end_date,
            status: 'active',
          }),
        })

        if (!createEnrollmentResponse.ok) {
          const errorData = await createEnrollmentResponse.json()
          throw new Error(
            errorData.error?.message || 'Failed to create enrollment'
          )
        }

        const enrollmentData = await createEnrollmentResponse.json()
        enrollmentId = enrollmentData.data.id
      }

      if (!enrollmentId) {
        throw new Error('Failed to create or find enrollment')
      }

      // Step 2: Create payment plan
      const createPaymentPlanResponse = await fetch(getApiUrl('/api/payment-plans'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          total_amount: commissionableValue,
          start_date: step1Data.course_start_date,
          notes: `Payment plan for ${step1Data.course_name}. ${
            step2Data.payment_frequency === 'monthly'
              ? 'Monthly'
              : step2Data.payment_frequency === 'quarterly'
              ? 'Quarterly'
              : 'Custom'
          } payment schedule with ${step2Data.number_of_installments} installments.`,
        }),
      })

      if (!createPaymentPlanResponse.ok) {
        const errorData = await createPaymentPlanResponse.json()
        throw new Error(
          errorData.error?.message || 'Failed to create payment plan'
        )
      }

      const paymentPlanData = await createPaymentPlanResponse.json()
      const paymentPlanId = paymentPlanData.data.id

      // Step 3: Create installments
      const createInstallmentsResponse = await fetch(
        `/api/payment-plans/${paymentPlanId}/installments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            installments: generatedInstallments,
          }),
        }
      )

      if (!createInstallmentsResponse.ok) {
        const errorData = await createInstallmentsResponse.json()
        console.error('Failed to create installments:', errorData)
        // Payment plan was created but installments failed
        // Still consider this a success and redirect
        // User can add installments later
      }

      // Success! Redirect to payment plans list or detail page
      console.log('Payment plan created successfully:', paymentPlanId)

      // Redirect to the payment plans list
      router.push('/payments/plans')
    } catch (error) {
      console.error('Error creating payment plan:', error)
      setIsCreating(false)
      alert(
        error instanceof Error
          ? error.message
          : 'Failed to create payment plan. Please try again.'
      )
    }
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Payment Plan</h1>
        <p className="text-muted-foreground mt-2">
          {mode === 'select-mode'
            ? 'Choose how you want to create your payment plan'
            : mode === 'ocr-upload'
            ? 'Upload a payment plan document for automatic data extraction'
            : mode === 'ocr-review'
            ? 'Review and edit the extracted data before proceeding'
            : 'Set up a new payment plan with flexible installment structure'}
        </p>
      </div>

      {/* Mode Selection */}
      {mode === 'select-mode' && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Manual Entry Option */}
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => setMode('wizard')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <Keyboard className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardTitle>Enter Manually</CardTitle>
                <CardDescription>
                  Fill in the payment plan details step by step using the wizard
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button variant="outline" className="w-full">
                  Start Manual Entry
                </Button>
              </CardContent>
            </Card>

            {/* OCR Upload Option */}
            <Card
              className="cursor-pointer transition-all hover:border-primary hover:shadow-md"
              onClick={() => setMode('ocr-upload')}
            >
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <FileText className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  Upload Document
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Premium
                  </span>
                </CardTitle>
                <CardDescription>
                  Upload a scanned payment plan document for AI-powered extraction
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
            <Button variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* OCR Upload Mode */}
      {mode === 'ocr-upload' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToModeSelection}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upload Payment Plan Document</CardTitle>
              <CardDescription>
                Upload a scanned payment plan, offer letter, or invoice. Our AI will
                extract the payment details automatically.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentUpload
                onFileSelect={handleFileSelect}
                value={selectedFile}
                isExtracting={extractMutation.isPending}
                error={extractMutation.error?.message}
                description="Upload a PDF, JPEG, or PNG document (max 10MB). The extracted data will be reviewed before creating the payment plan."
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* OCR Review Mode */}
      {mode === 'ocr-review' && extractionResult && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleOCRBack}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Upload Different Document
            </Button>
          </div>

          <OCRExtractionReview
            extraction={extractionResult.extraction}
            onProceed={handleOCRProceed}
            onBack={handleOCRBack}
          />
        </div>
      )}

      {/* Wizard Mode */}
      {mode === 'wizard' && (
        <>
          {/* Wizard Progress Indicator */}
          <WizardStepper currentStep={currentStep} steps={steps} />

          {/* Step Content */}
          <div className="mt-8">
            {currentStep === 1 && (
              <PaymentPlanWizardStep1
                initialData={step1Data || prePopulatedStep1 || undefined}
                onNext={handleStep1Next}
                onCancel={handleCancel}
              />
            )}

            {currentStep === 2 && step1Data && (
              <PaymentPlanWizardStep2
                initialData={step2Data || prePopulatedStep2 || undefined}
                step1Data={step1Data}
                onNext={handleStep2Next}
                onBack={handleStep2Back}
              />
            )}

            {currentStep === 3 && step1Data && step2Data && (
              <PaymentPlanWizardStep3
                step1Data={step1Data}
                step2Data={step2Data}
                generatedInstallments={generatedInstallments}
                onBack={handleStep3Back}
                onEditStep1={() => setCurrentStep(1)}
                onEditStep2={() => setCurrentStep(2)}
                onCreate={handleCreate}
                isCreating={isCreating}
              />
            )}
          </div>
        </>
      )}

      {/* Cancel Confirmation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Payment Plan Creation?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel? All entered information will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Continue Editing
            </Button>
            <Button
              variant="destructive"
              onClick={confirmCancel}
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
