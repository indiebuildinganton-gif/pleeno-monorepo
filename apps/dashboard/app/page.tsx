/**
 * Dashboard Page
 *
 * Main dashboard page displaying KPI metrics and business insights.
 *
 * Epic 6: Dashboard & Reporting Zone
 * Story 6.1: KPI Widgets with Trends and Market Breakdown
 * Task 9: Integrate Widgets into Dashboard Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { KPIWidget } from './components/KPIWidget'
import { SeasonalCommissionChart } from './components/SeasonalCommissionChart'
import { CommissionBySchoolWidget } from './components/CommissionBySchoolWidget'
import { CommissionByCountryWidget } from './components/CommissionByCountryWidget'

export default function Dashboard() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const errorParam = searchParams.get('error')
    if (errorParam === 'unauthorized') {
      setError(
        'You do not have permission to access that page. Only agency admins can access settings.'
      )

      // Clear the error after 5 seconds
      const timeout = setTimeout(() => {
        setError(null)
      }, 5000)

      return () => clearTimeout(timeout)
    }
  }, [searchParams])

  return (
    <div className="container mx-auto px-4 py-8">
      {error && (
        <div className="mb-6 p-4 rounded-md bg-red-50 text-red-800 border border-red-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">High-level KPIs and business health metrics</p>
      </div>

      <div className="space-y-8">
        {/* Row 1: Key Metrics */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Key Metrics</h2>
          <KPIWidget />
        </section>

        {/* Row 2: Seasonal Trends */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Seasonal Trends</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <SeasonalCommissionChart />
          </div>
        </section>

        {/* Row 3: Commission Breakdown */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Commission Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <CommissionBySchoolWidget />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <CommissionByCountryWidget />
            </div>
          </div>
        </section>
      <div className="space-y-6">
        <KPIWidget />

        {/* Payment Status Widget - Task 3: Create PaymentStatusWidget Component */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Payment Status Overview</h2>
          <p className="text-sm text-muted-foreground">
            Payment status widget will be integrated here in Task 3
          </p>
        </div>
      </div>
    </div>
  )
}
