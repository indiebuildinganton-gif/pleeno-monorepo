'use client'

import { useEffect } from 'react'
import { redirect } from 'next/navigation'

/**
 * Root Page - Redirects to Dashboard
 *
 * This page handles the root path (/) and redirects to /dashboard.
 * Required because with basePath: '/dashboard', the root doesn't exist
 * in the normal app structure, but users might access the domain root.
 */
export default function RootPage() {
  useEffect(() => {
    // Client-side redirect to dashboard
    window.location.href = '/dashboard'
  }, [])

  // This will execute on server-side
  redirect('/dashboard')
}
