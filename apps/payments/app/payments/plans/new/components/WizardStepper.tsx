'use client'

import { cn } from '@pleeno/ui'

interface WizardStepperProps {
  currentStep: 1 | 2 | 3
  steps: Array<{
    number: 1 | 2 | 3
    label: string
  }>
}

/**
 * WizardStepper Component
 *
 * Progress indicator for multi-step wizard showing current step,
 * completed steps, and upcoming steps.
 *
 * Features:
 * - Visual step progression (Step 1 → Step 2 → Step 3)
 * - Active step highlighting
 * - Completed step indicators
 * - Responsive design
 *
 * Epic 4: Payments Domain
 * Story 4.2: Flexible Installment Structure
 * Task 6: Multi-Step Payment Plan Wizard - Step 1
 *
 * @param currentStep - Currently active step (1, 2, or 3)
 * @param steps - Array of step configurations
 */
export function WizardStepper({ currentStep, steps }: WizardStepperProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm border-2 transition-colors',
                  step.number === currentStep &&
                    'bg-primary text-primary-foreground border-primary',
                  step.number < currentStep &&
                    'bg-primary/20 text-primary border-primary',
                  step.number > currentStep &&
                    'bg-muted text-muted-foreground border-muted-foreground/30'
                )}
              >
                {step.number < currentStep ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>

              {/* Step Label */}
              <div
                className={cn(
                  'mt-2 text-sm font-medium text-center',
                  step.number === currentStep && 'text-primary',
                  step.number < currentStep && 'text-primary/70',
                  step.number > currentStep && 'text-muted-foreground'
                )}
              >
                {step.label}
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-2 transition-colors -mt-6',
                  step.number < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
