/**
 * Dashboard Page
 *
 * Main dashboard for authenticated users.
 * Displays welcome message for new users who accepted invitations.
 *
 * Features:
 * - Welcome toast for new users (from query parameter)
 * - Basic dashboard layout
 * - User-specific content based on role
 */

'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function DashboardPage() {
  const searchParams = useSearchParams()
  const welcomeMessage = searchParams.get('welcome')
  const [showWelcome, setShowWelcome] = useState(false)

  useEffect(() => {
    if (welcomeMessage) {
      setShowWelcome(true)
      // Auto-hide welcome message after 5 seconds
      const timer = setTimeout(() => {
        setShowWelcome(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [welcomeMessage])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Welcome Toast */}
      {showWelcome && welcomeMessage && (
        <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top">
          <div className="rounded-lg bg-green-500 px-6 py-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="font-medium">{decodeURIComponent(welcomeMessage)}</p>
              <button
                onClick={() => setShowWelcome(false)}
                className="ml-2 rounded-full p-1 hover:bg-green-600"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Dashboard Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">Welcome to your Pleeno dashboard</p>
        </div>

        {/* Dashboard Content Placeholder */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Quick Stats</h2>
            <p className="mt-2 text-gray-600">Dashboard content coming soon...</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <p className="mt-2 text-gray-600">Activity feed coming soon...</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
            <p className="mt-2 text-gray-600">Task list coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  )
}
