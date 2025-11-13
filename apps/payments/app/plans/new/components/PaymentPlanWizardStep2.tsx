'use client'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'

/**
 * Placeholder type for Step 2 data
 * This will be implemented in Task 7
 */
export type Step2FormData = {
  // Installment configuration will be defined in Task 7
  // Placeholder for now
  installment_count?: number
}

interface PaymentPlanWizardStep2Props {
  initialData?: Partial<Step2FormData>
  onNext: (data: Step2FormData) => void
  onBack: () => void
}

/**
 * PaymentPlanWizardStep2 Component (Placeholder)
 *
 * This is a placeholder component for Step 2: Configure Installments.
 * The actual implementation will be completed in Task 7.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 7: Multi-Step Payment Plan Wizard - Step 2 (NOT YET IMPLEMENTED)
 *
 * @param initialData - Pre-filled form data
 * @param onNext - Callback when form is valid and Next is clicked
 * @param onBack - Callback when Back is clicked
 */
export function PaymentPlanWizardStep2({
  initialData,
  onNext,
  onBack,
}: PaymentPlanWizardStep2Props) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Step 2: Configure Installments</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          This step will be implemented in Task 7
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center">
          <p className="text-muted-foreground">
            Installment configuration UI will be implemented in Task 7
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button
            type="button"
            onClick={() => onNext(initialData || {})}
          >
            Next: Review & Create
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
