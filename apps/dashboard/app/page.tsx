/**
 * Dashboard Page
 *
 * Main dashboard page for the application. Displays unauthorized error
 * messages when users attempt to access restricted areas.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 6: Add Role-Based Access Control for Settings Page
 */

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

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
    <div className="container mx-auto p-6">
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

      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Welcome to your agency dashboard</p>
      </div>

      <div className="grid gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Getting Started</h2>
          <p className="text-muted-foreground">
            This is your main dashboard. From here you can access various features and manage your
            agency.
          </p>
        </div>
      </div>
    </div>
  )
}
