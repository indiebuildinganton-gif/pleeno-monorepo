/**
 * Agency Settings Page
 *
 * Allows agency admins to view and edit their agency's profile information.
 * Implements server-side role-based access control to ensure only agency
 * admins can access this page.
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2-1: Agency Profile Setup
 * Task 6: Add Role-Based Access Control for Settings Page
 */

import { requireRoleForPage } from '@pleeno/auth'
import { AgencySettingsForm } from './components/AgencySettingsForm'

export default async function AgencySettingsPage() {
  // Server-side role check - redirects if not authorized
  await requireRoleForPage(['agency_admin'])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Agency Settings</h1>
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded font-medium">
            Admin Only
          </span>
        </div>
        <p className="text-muted-foreground">
          Manage your agency&apos;s profile information and preferences
        </p>
      </div>

      <AgencySettingsForm />
    </div>
  )
}
