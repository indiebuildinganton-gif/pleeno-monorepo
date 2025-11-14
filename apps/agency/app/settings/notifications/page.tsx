/**
 * Notification Settings Page
 *
 * Allows agency admins to configure which stakeholders receive emails for
 * different events (overdue, due soon, payment received). Each recipient type
 * can be independently enabled/disabled for each event type.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 2: Notification Settings UI
 * Acceptance Criteria: AC #1-4
 */

import { requireRoleForPage } from '@pleeno/auth'
import { NotificationSettingsForm } from './components/NotificationSettingsForm'

export default async function NotificationSettingsPage() {
  // Server-side role check - only agency admins can configure notifications
  await requireRoleForPage(['agency_admin'])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Notification Settings</h1>
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded font-medium">
            Admin Only
          </span>
        </div>
        <p className="text-muted-foreground">
          Configure email notifications for different stakeholders and events. Each recipient type
          (agency users, students, colleges, sales agents) can be independently enabled or disabled
          for each event type (overdue payments, due soon reminders, payment received
          confirmations).
        </p>
      </div>

      <NotificationSettingsForm />
    </div>
  )
}
