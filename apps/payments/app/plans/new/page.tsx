import { PaymentPlanForm } from './components/PaymentPlanForm'

/**
 * New Payment Plan Page
 *
 * Page for creating new payment plans with:
 * - Enrollment selection
 * - Payment details input
 * - Real-time validation
 * - Commission preview
 *
 * Route: /payments/plans/new
 *
 * Epic 4: Payments Domain
 * Story 4.1: Payment Plan Creation
 * Task 4: Payment Plan Form Component
 */
export default function NewPaymentPlanPage() {
  return (
    <div className="container mx-auto max-w-3xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Payment Plan</h1>
        <p className="text-muted-foreground mt-2">
          Set up a new payment plan for a student enrollment
        </p>
      </div>
      <PaymentPlanForm />
    </div>
  )
}
