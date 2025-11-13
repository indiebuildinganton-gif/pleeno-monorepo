import { createServerClient } from '@pleeno/database/server'
import { redirect } from 'next/navigation'
import { UserTable } from './components/UserTable'
import { PendingInvitationsTable } from './components/PendingInvitationsTable'
import { InviteUserModal } from './components/InviteUserModal'

export default async function UsersPage() {
  const supabase = await createServerClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/auth/login')
  }

  // Get current user to check admin role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  // Only admins can access user management
  if (currentUser?.role !== 'agency_admin') {
    redirect('/dashboard')
  }

  // Fetch all users in agency (RLS auto-filters)
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .order('full_name', { ascending: true })

  if (usersError) {
    console.error('Error fetching users:', usersError)
    return <div>Error loading users</div>
  }

  // Fetch pending invitations
  const { data: invitations, error: invitationsError } = await supabase
    .from('invitations')
    .select(
      `
      *,
      invited_by:users!invitations_invited_by_fkey(full_name)
    `
    )
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  const pendingInvitations = invitationsError ? [] : invitations

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage users and their roles in your agency
          </p>
        </div>
        <InviteUserModal />
      </div>

      {pendingInvitations.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Invitations</h2>
          <PendingInvitationsTable
            initialInvitations={pendingInvitations}
            currentUserId={user.id}
          />
        </div>
      )}

      <div>
        <h2 className="text-xl font-semibold mb-4">Active Users</h2>
        <UserTable initialUsers={users || []} currentUserId={user.id} />
      </div>
    </div>
  )
}
