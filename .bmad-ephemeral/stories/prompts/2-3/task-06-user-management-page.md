# Task 6: Create User Management Page

**Story:** 2.3 User Management Interface
**AC:** 1

## Context

Create the main user management page that displays all users with their roles and status, plus pending invitations.

## Task

Build the user management page as a Server Component that fetches and displays user data.

## Requirements

1. Create file: `apps/agency/app/users/page.tsx`
2. Server Component fetches users from database
3. Display table with columns: Name, Email, Role, Status, Actions
4. Show role badge with color coding (Admin: blue, User: gray)
5. Show status badge (Active: green, Inactive: red)
6. Add "Invite User" button (opens InviteUserModal from Story 2.2)
7. Sort users by name (default)
8. Apply RLS automatically (users in same agency only)
9. Display pending invitations section above user list

## Implementation

```typescript
// apps/agency/app/users/page.tsx
import { createServerClient } from '@pleeno/database'
import { redirect } from 'next/navigation'
import { Button } from '@pleeno/ui'
import { UserTable } from './components/UserTable'
import { PendingInvitationsTable } from './components/PendingInvitationsTable'
import { InviteUserModal } from './components/InviteUserModal'

export default async function UsersPage() {
  const supabase = await createServerClient()

  // Check authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
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
    .select(`
      *,
      invited_by:users!invitations_invited_by_fkey(full_name)
    `)
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
```

## Architecture Alignment

- Location: `apps/agency/app/users/page.tsx`
- Server Component for initial data fetch
- Use createServerClient from @pleeno/database
- Redirect non-admins to dashboard
- RLS automatically filters by agency_id
- Pass data to Client Components via props

## Page Layout

```
┌─────────────────────────────────────────────┐
│ Team Members              [Invite User]     │
├─────────────────────────────────────────────┤
│                                             │
│ Pending Invitations (if any)                │
│ ┌─────────────────────────────────────────┐ │
│ │ Email  Role  Invited By  Expires  Actions│ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Active Users                                │
│ ┌─────────────────────────────────────────┐ │
│ │ Name  Email  Role  Status  Actions       │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

## Access Control

- Only `agency_admin` can access this page
- Non-admins redirected to `/dashboard`
- Unauthenticated users redirected to `/auth/login`
- RLS ensures users only see their agency's data

## Acceptance Criteria

- [ ] File created at correct location
- [ ] Server Component fetches users successfully
- [ ] Admin role check before rendering page
- [ ] Non-admins redirected appropriately
- [ ] Users displayed in table format
- [ ] Users sorted by name
- [ ] Role and status badges styled correctly
- [ ] Pending invitations section shown conditionally
- [ ] "Invite User" button present
- [ ] RLS automatically filters users by agency

## Data Flow

1. Server Component authenticates user
2. Checks if user is admin
3. Fetches users from database (RLS filtered)
4. Fetches pending invitations
5. Passes data to Client Components
6. Client Components handle interactions

## Next Steps

After completing this task:
1. Verify page loads for admin users
2. Verify non-admins are redirected
3. Check user data displays correctly
4. Proceed to Task 7: Create User Table Component
