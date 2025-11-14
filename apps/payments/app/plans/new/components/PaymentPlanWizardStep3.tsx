'use client'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@pleeno/ui'

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
  onBack: () => void
  onCreate: () => void
  isCreating?: boolean
}

/**
 * PaymentPlanWizardStep3 Component (Placeholder)
 *
 * This is a placeholder component for Step 3: Review & Create.
 * The actual implementation will be completed in Task 8.
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 8: Multi-Step Payment Plan Wizard - Step 3 (NOT YET IMPLEMENTED)
 *
 * @param onBack - Callback when Back is clicked
 * @param onCreate - Callback when Create is clicked
 * @param isCreating - Whether the creation is in progress
 */
export function PaymentPlanWizardStep3({
  onBack,
  onCreate,
  isCreating = false,
}: PaymentPlanWizardStep3Props) {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Step 3: Review & Create</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          This step will be implemented in Task 8
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="rounded-lg border border-dashed border-muted-foreground/25 bg-muted/20 p-8 text-center">
          <p className="text-muted-foreground">
            Review and confirmation UI will be implemented in Task 8
          </p>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isCreating}>
            Back
          </Button>
          <Button type="button" onClick={onCreate} disabled={isCreating}>
            {isCreating ? 'Creating...' : 'Create Payment Plan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
