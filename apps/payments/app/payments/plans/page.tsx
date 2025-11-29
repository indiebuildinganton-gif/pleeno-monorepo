/**
 * Payment Plans List Page
 *
 * Displays all payment plans for the agency with filtering capabilities.
 * Server Component that renders the PaymentPlansList client component.
 *
 * Epic 4: Payments Domain
 * Story 4.3: Payment Plan List and Detail Views
 * Task 3: Payment Plans List Page
 */

import Link from 'next/link'
import { Button } from '@pleeno/ui'
import { Plus, RefreshCw } from 'lucide-react'
import { PaymentPlansList } from './components/PaymentPlansList'
import { PaymentPlansFilterPanel } from './components/PaymentPlansFilterPanel'
import { PaymentPlansSearchBar } from './components/PaymentPlansSearchBar'
import { Suspense } from 'react'

/**
 * Loading fallback for PaymentPlansList
 */
function PaymentPlansListFallback() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-200 rounded-lg" />
        ))}
      </div>
    </div>
  )
}

/**
 * Main Payment Plans Page (Server Component)
 */
export default async function PaymentPlansPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Payment Plans</h1>
          <p className="text-gray-600 mt-1">
            Manage and track all payment plans
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/payments/plans/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Filter Panel */}
        <Suspense fallback={<div className="animate-pulse h-64 bg-gray-200 rounded-lg" />}>
          <PaymentPlansFilterPanel />
        </Suspense>

        {/* Search Bar */}
        <Suspense fallback={<div className="animate-pulse h-10 bg-gray-200 rounded-lg" />}>
          <PaymentPlansSearchBar />
        </Suspense>

        {/* Payment Plans List */}
        <Suspense fallback={<PaymentPlansListFallback />}>
          <PaymentPlansList />
        </Suspense>
      </div>
    </div>
  )
}
