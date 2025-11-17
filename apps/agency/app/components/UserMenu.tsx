/**
 * User Menu Component (Server Component)
 *
 * Fetches current user information and renders the user menu dropdown
 * in the navigation header.
 *
 * Epic 2: Agency & User Management
 * Story 2.4: User Profile Management
 * Task 13: Add navigation link to profile
 */

import { createServerClient } from '@pleeno/database/server'
import { UserMenuClient } from './UserMenuClient'

export async function UserMenu() {
  const supabase = await createServerClient()

  // Get authenticated user
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser()

  // If not authenticated, don't render the menu
  if (authError || !authUser) {
    return null
  }

  // Fetch user data from users table
  const { data: user } = await supabase
    .from('users')
    .select('id, full_name, email, role')
    .eq('id', authUser.id)
    .single()

  // If user data not found, fall back to auth user email
  const displayName = user?.full_name || authUser.email || 'User'
  const userEmail = user?.email || authUser.email || ''

  return <UserMenuClient name={displayName} email={userEmail} />
}
