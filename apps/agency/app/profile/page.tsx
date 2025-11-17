/**
 * User Profile Page
 *
 * Allows users to manage their own profile information.
 * - View read-only fields: Email, Role, Agency Name
 * - Edit full name
 * - Change password
 * - Request email change (regular users) or update email (admins)
 *
 * Epic 2: Agency & User Management
 * Story 2.4: User Profile Management
 * Task 06: Create user profile page
 *
 * Acceptance Criteria: 1, 4, 5
 */

import { createServerClient } from '@pleeno/database/server'
import { redirect } from 'next/navigation'
import { ProfileForm } from './components/ProfileForm'

export default async function ProfilePage() {
  const supabase = await createServerClient()

  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !authUser) {
    redirect('/login')
  }

  // Fetch user data with agency information
  const { data: user, error: userError } = await supabase
    .from('users')
    .select(
      `
      id,
      email,
      full_name,
      role,
      status,
      agency_id,
      email_notifications_enabled,
      agencies (
        id,
        name
      )
    `
    )
    .eq('id', authUser.id)
    .single()

  if (userError || !user) {
    console.error('Failed to fetch user:', userError)
    redirect('/login')
  }

  // Type-safe access to agency data
  const agency = Array.isArray(user.agencies) ? user.agencies[0] : user.agencies

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground mt-2">
          Manage your personal information and account settings
        </p>
      </div>

      <ProfileForm
        user={{
          id: user.id,
          email: user.email,
          full_name: user.full_name || '',
          role: user.role,
          agency_name: agency?.name || 'Unknown Agency',
          email_notifications_enabled: user.email_notifications_enabled || false,
        }}
      />
    </div>
  )
}
