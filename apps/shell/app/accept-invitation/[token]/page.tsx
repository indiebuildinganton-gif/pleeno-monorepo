/**
 * Invitation Acceptance Page
 *
 * This page handles the invitation acceptance flow for new users.
 * It validates the invitation token and displays a signup form.
 *
 * Flow:
 * 1. Fetch invitation data using the token from URL params
 * 2. Validate token (not expired, not used)
 * 3. Display error if token invalid or expired
 * 4. Show signup form with email pre-filled from invitation
 * 5. On successful signup, redirect to dashboard
 *
 * Epic 2: Agency Configuration & User Management
 * Story 2.2: User Invitation and Task Assignment System
 * Task 06: Create invitation acceptance page and flow
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect } from 'next/navigation'
import { isInvitationExpired } from '@pleeno/utils'
import AcceptInvitationForm from './AcceptInvitationForm'

interface PageProps {
  params: Promise<{ token: string }>
  searchParams: Promise<{ tasks?: string }>
}

export default async function AcceptInvitationPage({ params, searchParams }: PageProps) {
  const { token } = await params
  const { tasks } = await searchParams

  // Fetch invitation data
  const supabase = await createServerClient()

  const { data: invitation, error } = await supabase
    .from('invitations')
    .select('*, agencies(name)')
    .eq('token', token)
    .single()

  // Handle invalid token
  if (error || !invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Invalid Invitation</h2>
            <p className="mt-4 text-sm text-gray-600">
              This invitation link is invalid. Please check the link or contact your agency
              administrator for a new invitation.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Validate invitation not expired
  if (isInvitationExpired(invitation)) {
    const expiresAt = new Date(invitation.expires_at)
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Invitation Expired</h2>
            <p className="mt-4 text-sm text-gray-600">
              This invitation has expired. Please request a new invitation from your agency
              administrator.
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Expired on: {expiresAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Validate invitation not already used
  if (invitation.used_at) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Invitation Already Used</h2>
            <p className="mt-4 text-sm text-gray-600">
              This invitation has already been used and cannot be reused. If you already have an
              account, please log in. Otherwise, contact your agency administrator for a new
              invitation.
            </p>
            <div className="mt-6">
              <a
                href="/login"
                className="text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Go to Login →
              </a>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Valid invitation - show signup form
  const agencyName = (invitation.agencies as any)?.name || 'the agency'

  return (
    <AcceptInvitationForm
      token={token}
      email={invitation.email}
      agencyName={agencyName}
      tasks={tasks}
    />
  )
}
