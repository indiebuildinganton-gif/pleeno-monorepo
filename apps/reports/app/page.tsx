/**
 * Reports Landing Page
 *
 * Main landing page for the Reports zone. Provides navigation to various
 * report types including Payment Plans Report with contract expiration tracking.
 *
 * Epic 7: Payment Plans and Reporting Zone
 * Story 7-1: Payment Plans Report Generator with Contract Expiration Tracking
 * Task 1: Create Reports Zone Foundation
 */

import Link from 'next/link'

export default function ReportsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-2">
          Access various reports and analytics for your agency
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Payment Plans Report Card */}
        <Link
          href="/payment-plans"
          className="group block border rounded-lg p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <svg
                className="w-6 h-6 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <svg
              className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            Payment Plans Report
          </h2>
          <p className="text-sm text-muted-foreground">
            View and track payment plans with contract expiration monitoring
          </p>
        </Link>

        {/* Placeholder for future reports */}
        <div className="border rounded-lg p-6 opacity-50">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-900/20">
              <svg
                className="w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-gray-400">More Reports</h2>
          <p className="text-sm text-muted-foreground">Coming soon...</p>
        </div>
      </div>
    </div>
  )
}
