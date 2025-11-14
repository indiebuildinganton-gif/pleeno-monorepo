/**
 * Payment Plan Detail Page
 *
 * Displays comprehensive payment plan details with:
 * - Payment plan summary and progress indicators
 * - List of all installments
 * - Mark as Paid functionality for pending/partial installments
 * - Auto-refresh after successful payment recording (via TanStack Query)
 *
 * Epic 4: Payments Domain
 * Story 4.4: Manual Payment Recording
 * Task 4: Payment Plan Detail Page Updates
 */

'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button, Card, Skeleton } from '@pleeno/ui'
import { usePaymentPlanDetail } from './hooks/usePaymentPlanDetail'
import { PaymentPlanDetail } from './components/PaymentPlanDetail'
import { InstallmentsList } from './components/InstallmentsList'
import { MarkAsPaidModal } from './components/MarkAsPaidModal'
import type { Installment } from '@pleeno/validations/installment.schema'

/**
 * Loading Skeleton Component
 */
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </Card>
      <Card>
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24 w-full" />
        </div>
      </Card>
    </div>
  )
}

/**
 * Error State Component
 */
function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50 p-6">
      <div className="text-center">
        <p className="text-red-800 mb-4">Failed to load payment plan details</p>
        <Button variant="outline" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </Card>
  )
}

/**
 * Payment Plan Detail Page Component
 */
export default function PaymentPlanDetailPage() {
  const params = useParams()
  const planId = params.id as string

  // Modal state for Mark as Paid
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null)

  // Fetch payment plan details
  const { data, isLoading, error, refetch } = usePaymentPlanDetail(planId)

  // Handle Mark as Paid click
  const handleMarkAsPaid = (installment: Installment) => {
    setSelectedInstallment(installment)
    setIsModalOpen(true)
  }

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedInstallment(null)
  }

  // Handle successful payment recording
  const handlePaymentSuccess = () => {
    // The page will auto-refresh thanks to TanStack Query invalidation
    // in the useRecordPayment mutation hook
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <LoadingSkeleton />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ErrorState onRetry={() => refetch()} />
      </div>
    )
  }

  // No data
  if (!data?.data) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="p-12 text-center">
          <p className="text-lg text-gray-600">Payment plan not found</p>
        </Card>
      </div>
    )
  }

  const plan = data.data

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Navigation */}
      <div className="mb-6">
        <Link href="/plans">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Payment Plans
          </Button>
        </Link>
      </div>

      <div className="space-y-6">
        {/* Payment Plan Summary */}
        <PaymentPlanDetail plan={plan} />

        {/* Installments List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Installments</h2>
            <InstallmentsList
              installments={plan.installments}
              currency={plan.currency}
              onMarkAsPaid={handleMarkAsPaid}
            />
          </div>
        </Card>
      </div>

      {/* Mark as Paid Modal */}
      {selectedInstallment && (
        <MarkAsPaidModal
          installment={selectedInstallment}
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
