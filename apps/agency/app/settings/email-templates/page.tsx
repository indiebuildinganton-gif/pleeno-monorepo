/**
 * Email Template Management Page
 *
 * Allows agency admins to view, create, edit, and delete email templates.
 * Templates are used for automated email notifications to various stakeholders.
 *
 * Epic 5: Intelligent Status Automation & Notifications
 * Story 5.5: Automated Email Notifications (Multi-Stakeholder)
 * Task 3: Email Template Management UI
 * Acceptance Criteria: AC #2
 */

import { requireRoleForPage } from '@pleeno/auth'
import { EmailTemplateManagement } from './components/EmailTemplateManagement'

export default async function EmailTemplatesPage() {
  // Server-side role check - only agency admins can manage email templates
  await requireRoleForPage(['agency_admin'])

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded font-medium">
            Admin Only
          </span>
        </div>
        <p className="text-muted-foreground">
          Customize email templates for automated notifications sent to students, colleges, sales
          agents, and agency users. Use variable placeholders to personalize each email.
        </p>
      </div>

      <EmailTemplateManagement />
    </div>
  )
}
