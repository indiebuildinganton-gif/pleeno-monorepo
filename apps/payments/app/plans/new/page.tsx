'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, Button } from '@pleeno/ui'
import { WizardStepper } from './components/WizardStepper'
import { PaymentPlanWizardStep1, type Step1FormData } from './components/PaymentPlanWizardStep1'
import { PaymentPlanWizardStep2, type Step2FormData } from './components/PaymentPlanWizardStep2'
import { PaymentPlanWizardStep3 } from './components/PaymentPlanWizardStep3'

/**
 * New Payment Plan Wizard Page
 *
 * Multi-step wizard for creating payment plans with flexible installment structures:
 * - Step 1: General information (student, course, commission, dates)
 * - Step 2: Configure installments (Task 7)
 * - Step 3: Review and create (Task 8)
 *
 * Features:
 * - Step-by-step navigation
 * - Form data persistence across steps
 * - Cancel confirmation dialog
 * - Progress indicator
 *
 * Route: /payments/plans/new
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 6: Multi-Step Payment Plan Wizard - Step 1
 */
export default function NewPaymentPlanPage() {
  const router = useRouter()

  // Wizard state management
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [step1Data, setStep1Data] = useState<Step1FormData | null>(null)
  const [step2Data, setStep2Data] = useState<Step2FormData | null>(null)
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
   * Handle Step 2 completion
   * Saves data and navigates to Step 3
   */
  const handleStep2Next = (data: Step2FormData) => {
    setStep2Data(data)
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
   * Handle payment plan creation from Step 3
   * This will be implemented in Task 8
   */
  const handleCreate = async () => {
    setIsCreating(true)

    // TODO: Implement in Task 8
    // - Combine step1Data, step2Data, generated installments
    // - Call API to create payment plan with installments
    // - Handle success/error
    // - Redirect to payment plan details or list

    console.log('Creating payment plan with data:', {
      step1Data,
      step2Data,
    })

    // Placeholder: simulate API call
    setTimeout(() => {
      setIsCreating(false)
      // router.push('/payments/plans')
    }, 2000)
  }

  return (
    <div className="container mx-auto max-w-5xl py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Create Payment Plan</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new payment plan with flexible installment structure
        </p>
      </div>

      {/* Wizard Progress Indicator */}
      <WizardStepper currentStep={currentStep} steps={steps} />

      {/* Step Content */}
      <div className="mt-8">
        {currentStep === 1 && (
          <PaymentPlanWizardStep1
            initialData={step1Data || undefined}
            onNext={handleStep1Next}
            onCancel={handleCancel}
          />
        )}

        {currentStep === 2 && (
          <PaymentPlanWizardStep2
            initialData={step2Data || undefined}
            onNext={handleStep2Next}
            onBack={handleStep2Back}
          />
        )}

        {currentStep === 3 && (
          <PaymentPlanWizardStep3
            onBack={handleStep3Back}
            onCreate={handleCreate}
            isCreating={isCreating}
          />
        )}
      </div>

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
