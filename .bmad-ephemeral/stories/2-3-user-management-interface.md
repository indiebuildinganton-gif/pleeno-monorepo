# Story 2.3: User Management Interface

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to view and manage all users in my agency**,
so that **I can control who has access and what roles they have**.

## Acceptance Criteria

1. **Given** I am an Agency Admin, **When** I access the user management page, **Then** I see a list of all users in my agency with their roles and status

2. **And** I can change a user's role (Admin ↔ User)

3. **And** I can deactivate or reactivate user accounts

4. **And** deactivated users cannot log in

5. **And** I can resend invitation emails for pending invitations

6. **And** I can delete pending invitations

## Tasks / Subtasks

- [ ] Extend users table schema with status field (AC: 3, 4)
  - [ ] Create migration: supabase/migrations/002_agency_domain/005_users_status.sql
  - [ ] Add users.status field: ENUM ('active', 'inactive') DEFAULT 'active'
  - [ ] Add constraint to prevent admin from deactivating themselves
  - [ ] Create trigger to prevent login for inactive users
  - [ ] Update RLS policies to check status for authentication

- [ ] Implement user role change API (AC: 2)
  - [ ] Create apps/agency/app/api/users/[id]/role/route.ts
  - [ ] PATCH /api/users/[id]/role endpoint
  - [ ] Request body: { role: 'agency_admin' | 'agency_user' }
  - [ ] Validate current user is agency_admin
  - [ ] Prevent removing last admin from agency (at least one admin required)
  - [ ] Update user role with audit logging
  - [ ] Return updated user
  - [ ] Add error handling with handleApiError()

- [ ] Implement user status change API (AC: 3, 4)
  - [ ] Create apps/agency/app/api/users/[id]/status/route.ts
  - [ ] PATCH /api/users/[id]/status endpoint
  - [ ] Request body: { status: 'active' | 'inactive' }
  - [ ] Validate current user is agency_admin
  - [ ] Prevent admin from deactivating themselves
  - [ ] Update user status with audit logging
  - [ ] Return updated user
  - [ ] Add error handling

- [ ] Create user management list page (AC: 1)
  - [ ] Create apps/agency/app/users/page.tsx
  - [ ] Server Component fetches users from database
  - [ ] Display table with columns: Name, Email, Role, Status, Actions
  - [ ] Show role badge with color coding (Admin: blue, User: gray)
  - [ ] Show status badge (Active: green, Inactive: red)
  - [ ] Add "Invite User" button (opens InviteUserModal from Story 2.2)
  - [ ] Sort users by name (default)
  - [ ] Apply RLS automatically (users in same agency only)

- [ ] Create user actions dropdown menu (AC: 2, 3)
  - [ ] Create apps/agency/app/users/components/UserActionsMenu.tsx
  - [ ] Dropdown menu with actions: Change Role, Deactivate/Activate, View Details
  - [ ] Change Role: Opens ConfirmRoleChangeDialog
  - [ ] Deactivate/Activate: Opens ConfirmStatusChangeDialog
  - [ ] View Details: Navigate to /users/[id]
  - [ ] Disable "Deactivate" option for current user (cannot deactivate self)
  - [ ] Use TanStack Query mutations for optimistic updates

- [ ] Create role change confirmation dialog (AC: 2)
  - [ ] Create apps/agency/app/users/components/ConfirmRoleChangeDialog.tsx
  - [ ] Display current role and new role
  - [ ] Warning message: "Changing role will affect this user's permissions"
  - [ ] "Cancel" and "Confirm" buttons
  - [ ] On confirm: call PATCH /api/users/[id]/role
  - [ ] Show success toast: "Role updated for [User Name]"
  - [ ] Refresh user list with TanStack Query invalidation

- [ ] Create status change confirmation dialog (AC: 3, 4)
  - [ ] Create apps/agency/app/users/components/ConfirmStatusChangeDialog.tsx
  - [ ] Display action: "Deactivate [User Name]" or "Reactivate [User Name]"
  - [ ] Warning for deactivation: "This user will no longer be able to log in"
  - [ ] "Cancel" and "Confirm" buttons
  - [ ] On confirm: call PATCH /api/users/[id]/status
  - [ ] Show success toast: "[User Name] has been deactivated" or "reactivated"
  - [ ] Refresh user list

- [ ] Display pending invitations section (AC: 5, 6)
  - [ ] Query invitations table for pending (used_at IS NULL, expires_at > now())
  - [ ] Display separate section: "Pending Invitations" above user list
  - [ ] Show table with columns: Email, Role, Invited By, Expires In, Actions
  - [ ] Calculate "Expires In" relative time (e.g., "5 days")
  - [ ] Actions: Resend, Delete
  - [ ] If no pending invitations, hide section

- [ ] Implement invitation resend functionality (AC: 5)
  - [ ] Create apps/agency/app/api/invitations/[id]/resend/route.ts
  - [ ] POST /api/invitations/[id]/resend endpoint
  - [ ] Validate invitation exists and is pending
  - [ ] Extend expiration by 7 days from current time
  - [ ] Resend invitation email with updated expiration
  - [ ] Log resend action in audit log
  - [ ] Return updated invitation
  - [ ] Show success toast: "Invitation resent to [email]"

- [ ] Implement invitation deletion (AC: 6)
  - [ ] Update apps/agency/app/api/invitations/[id]/route.ts
  - [ ] DELETE /api/invitations/[id] endpoint
  - [ ] Validate invitation exists and is pending
  - [ ] Soft delete or hard delete invitation (decision: hard delete)
  - [ ] Log deletion in audit log
  - [ ] Return success response
  - [ ] Show success toast: "Invitation deleted"

- [ ] Create validation schemas (AC: 2, 3)
  - [ ] Create packages/validations/src/user.schema.ts
  - [ ] Define UserRoleUpdateSchema: role ENUM
  - [ ] Define UserStatusUpdateSchema: status ENUM
  - [ ] Validate role values ('agency_admin', 'agency_user')
  - [ ] Validate status values ('active', 'inactive')
  - [ ] Export TypeScript types

- [ ] Add navigation link to user management (AC: 1)
  - [ ] Update apps/agency/app/layout.tsx navigation
  - [ ] Add "Users" link to agency settings navigation
  - [ ] Link to /agency/users
  - [ ] Active state highlighting for current page
  - [ ] Admin-only visibility (hide from regular users)

- [ ] Write tests for user management (AC: 1-6)
  - [ ] Test: Admin can view all users in their agency (200)
  - [ ] Test: User cannot access user management (403)
  - [ ] Test: Admin can change user role (200)
  - [ ] Test: Cannot remove last admin from agency (400)
  - [ ] Test: Admin can deactivate user (200)
  - [ ] Test: Admin cannot deactivate themselves (400)
  - [ ] Test: Inactive user cannot log in (401)
  - [ ] Test: Admin can reactivate user (200)
  - [ ] Test: Admin can resend pending invitation (200)
  - [ ] Test: Admin can delete pending invitation (200)
  - [ ] Test: Cannot resend/delete used invitation (400)
  - [ ] Test: RLS prevents cross-agency user management

## Dev Notes

### User Management Architecture

**Page Structure:**
```
User Management Page
├── Header
│   ├── Title: "Team Members"
│   └── Button: "Invite User"
├── Pending Invitations Section (conditional)
│   ├── Table: Email, Role, Invited By, Expires In, Actions
│   └── Actions: Resend, Delete
└── Active Users Section
    ├── Table: Name, Email, Role, Status, Actions
    └── Actions Dropdown: Change Role, Deactivate/Activate, View Details
```

**User List Filtering:**
- Default: Show all users (active and inactive)
- Sort: Name (A-Z) by default
- Future enhancement: Filter by role, status, search by name/email

**Role Change Logic:**
```typescript
// Validation before role change
async function canChangeRole(userId: string, newRole: string) {
  // 1. Check if user is last admin
  if (newRole === 'agency_user') {
    const adminCount = await countAdminsInAgency(agencyId)
    if (adminCount <= 1) {
      throw new Error('Cannot remove last admin from agency')
    }
  }
  return true
}
```

**Status Change Logic:**
```typescript
// Validation before status change
async function canChangeStatus(userId: string, currentUserId: string) {
  // 1. Cannot deactivate self
  if (userId === currentUserId) {
    throw new Error('Cannot deactivate your own account')
  }
  return true
}
```

**Authentication Hook for Inactive Users:**
```sql
-- Trigger to check user status on login
CREATE OR REPLACE FUNCTION check_user_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'inactive' THEN
    RAISE EXCEPTION 'User account is deactivated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_user_active_trigger
  BEFORE INSERT OR UPDATE ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_user_active();
```

### Project Structure Notes

**User Management Location:**
```
apps/agency/
├── app/
│   ├── users/
│   │   ├── page.tsx                    # User list (Server Component)
│   │   ├── [id]/
│   │   │   └── page.tsx                # User detail from Story 2.2
│   │   └── components/
│   │       ├── UserActionsMenu.tsx     # Dropdown actions
│   │       ├── ConfirmRoleChangeDialog.tsx
│   │       ├── ConfirmStatusChangeDialog.tsx
│   │       ├── UserTable.tsx           # Client Component for table
│   │       ├── PendingInvitationsTable.tsx
│   │       └── InviteUserModal.tsx     # From Story 2.2
│   └── api/
│       ├── users/
│       │   └── [id]/
│       │       ├── role/
│       │       │   └── route.ts        # PATCH /api/users/:id/role
│       │       └── status/
│       │           └── route.ts        # PATCH /api/users/:id/status
│       └── invitations/
│           └── [id]/
│               ├── resend/
│               │   └── route.ts        # POST /api/invitations/:id/resend
│               └── route.ts            # DELETE /api/invitations/:id

packages/validations/
└── src/
    └── user.schema.ts                  # Zod schemas for user updates
```

### Database Schema Details

**Users Table Extension:**
```sql
-- Add status field to users table
ALTER TABLE users ADD COLUMN status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active';

-- Constraint: Prevent deactivating self (enforced in API)
-- Constraint: At least one active admin per agency (enforced in API)

-- RLS policy for authentication (existing)
CREATE POLICY "Users can view users in their agency"
  ON users FOR SELECT
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

-- RLS policy for updates (admin only)
CREATE POLICY "Admins can update users in their agency"
  ON users FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );
```

**Audit Logging for Role/Status Changes:**
```sql
-- Trigger function to log user changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'role_change',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      ),
      now()
    );
  END IF;

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();
```

### Architecture Alignment

**From Architecture Document (architecture.md):**

**API Route Pattern for Role Change:**
```typescript
// apps/agency/app/api/users/[id]/role/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { UserRoleUpdateSchema } from '@pleeno/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = UserRoleUpdateSchema.parse(body)

    // Check if changing to user role and if this is the last admin
    if (validatedData.role === 'agency_user') {
      const { count: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('agency_id', currentUser.agency_id)
        .eq('role', 'agency_admin')
        .eq('status', 'active')

      if (adminCount && adminCount <= 1) {
        throw new ValidationError('Cannot remove last admin from agency')
      }
    }

    // Update user role
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ role: validatedData.role })
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id)  // RLS double-check
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**API Route Pattern for Status Change:**
```typescript
// apps/agency/app/api/users/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { UserStatusUpdateSchema } from '@pleeno/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Prevent admin from deactivating themselves
    if (params.id === user.id) {
      throw new ValidationError('Cannot deactivate your own account')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = UserStatusUpdateSchema.parse(body)

    // Update user status
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ status: validatedData.status })
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id)  // RLS double-check
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**User Table Component (Client Component):**
```typescript
// apps/agency/app/users/components/UserTable.tsx
'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@pleeno/ui'
import { Badge } from '@pleeno/ui'
import { UserActionsMenu } from './UserActionsMenu'
import { User } from '@pleeno/database/types'

interface UserTableProps {
  initialUsers: User[]
}

export function UserTable({ initialUsers }: UserTableProps) {
  const queryClient = useQueryClient()

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      const result = await response.json()
      if (!result.success) throw new Error(result.error.message)
      return result.data
    },
    initialData: initialUsers
  })

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user) => (
          <TableRow key={user.id}>
            <TableCell className="font-medium">{user.full_name}</TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              <Badge variant={user.role === 'agency_admin' ? 'default' : 'secondary'}>
                {user.role === 'agency_admin' ? 'Admin' : 'User'}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={user.status === 'active' ? 'success' : 'destructive'}>
                {user.status === 'active' ? 'Active' : 'Inactive'}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <UserActionsMenu user={user} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### Learnings from Previous Story

**From Story 2.2: User Invitation and Task Assignment System (Status: ready-for-dev)**

Story 2.2 is not yet implemented but establishes the foundation for user management:

**Expected Infrastructure from 2.2:**
- **User management page:** apps/agency/app/users/ structure already created
- **InviteUserModal component:** Reuse for "Invite User" button
- **Invitation API routes:** POST /api/invitations already implemented
- **Pending invitations table:** Structure exists, extend with Resend/Delete actions
- **Audit logging:** audit_log table and triggers already set up
- **Validation schemas:** invitation.schema.ts pattern to follow

**What This Story Builds Upon:**
- Extends user management page with user list (2.2 added invitation creation)
- Adds user actions (role change, status change) to existing user infrastructure
- Reuses pending invitations display from 2.2 with additional actions
- Follows same API route patterns (validation, auth checks, RLS)
- Uses same audit logging infrastructure

**Integration Points:**
- "Invite User" button opens InviteUserModal from Story 2.2
- Pending invitations section extends 2.2's invitation display
- User detail page links to task assignments from 2.2
- Shared validation patterns (email, role enum)
- Shared error handling utilities

**Patterns to Apply:**
- Server Components for initial data fetch (users list)
- Client Components for interactive UI (actions menu, dialogs)
- TanStack Query for optimistic updates and cache invalidation
- Validate admin role before rendering admin-only UI
- Use confirmation dialogs for destructive actions
- Display clear success/error messages with toasts

[Source: .bmad-ephemeral/stories/2-2-user-invitation-and-task-assignment-system.md]

**Key Dependencies:**
- Story 2.2 must be completed first for invitation infrastructure
- Invitation resend/delete functionality extends 2.2's invitation system
- User detail page from 2.2 is entry point for viewing user details

### Security Considerations

**Access Control:**
- Only agency_admin can change roles
- Only agency_admin can change user status
- Only agency_admin can resend/delete invitations
- Cannot deactivate own account (prevent lock-out)
- At least one active admin required per agency (prevent orphaning)
- RLS prevents cross-agency user management

**Status Change Validation:**
- Validate user exists and belongs to same agency
- Prevent status change for self
- Check authentication before any operation
- Audit all role and status changes

**Role Change Validation:**
- Validate user exists and belongs to same agency
- Count active admins before demoting
- Prevent removing last admin
- Audit all role changes

**Invitation Management:**
- Only pending invitations can be resent or deleted
- Cannot resend/delete used invitations
- Resend extends expiration by 7 days
- Deletion is permanent (hard delete)
- Audit all resend/delete actions

**Authentication for Inactive Users:**
- Inactive users blocked at authentication layer
- Middleware checks status before allowing session
- Clear error message: "Your account has been deactivated"
- Contact admin message displayed

### Testing Strategy

**Unit Tests:**
1. **Validation Schemas:**
   - Valid role update passes
   - Invalid role rejected
   - Valid status update passes
   - Invalid status rejected

2. **Helper Functions:**
   - canChangeRole() validates last admin constraint
   - canChangeStatus() validates self-deactivation
   - Relative time calculation for invitation expiration

**Integration Tests:**
1. **User List Display:**
   - Admin can view all users (200)
   - User cannot view user management (403)
   - RLS filters users to same agency
   - Pending invitations displayed separately
   - Expired invitations not displayed

2. **Role Change:**
   - Admin can change user role (200)
   - User cannot change role (403)
   - Cannot remove last admin (400)
   - Role change logged in audit trail
   - RLS prevents cross-agency role changes

3. **Status Change:**
   - Admin can deactivate user (200)
   - Admin can reactivate user (200)
   - Admin cannot deactivate self (400)
   - Inactive user blocked from login (401)
   - Status change logged in audit trail

4. **Invitation Management:**
   - Admin can resend pending invitation (200)
   - Admin can delete pending invitation (200)
   - Cannot resend used invitation (400)
   - Cannot delete used invitation (400)
   - Resend extends expiration correctly
   - Email sent on resend

**E2E Tests:**
1. **Role Change Flow:**
   - Login as admin
   - Navigate to user management
   - Click actions menu for user
   - Select "Change Role"
   - Confirm role change
   - Verify success toast
   - Verify role updated in list
   - Verify audit log entry

2. **Status Change Flow:**
   - Login as admin
   - Navigate to user management
   - Click actions menu for user
   - Select "Deactivate"
   - Confirm deactivation
   - Verify success toast
   - Verify status updated in list
   - Logout
   - Try to login as deactivated user
   - Verify login blocked

3. **Invitation Resend Flow:**
   - Login as admin
   - Navigate to user management
   - View pending invitations
   - Click "Resend" for invitation
   - Verify success toast
   - Verify expiration extended
   - Verify email sent

### References

- [Source: docs/epics.md#Story-2.3-User-Management-Interface]
- [Source: docs/PRD.md#FR-1.3-User-Role-Management]
- [Source: docs/PRD.md#Epic-2-Agency-&-User-Management]
- [Source: docs/architecture.md#Data-Architecture - users schema]
- [Source: docs/architecture.md#Security-Architecture - RLS patterns]
- [Source: .bmad-ephemeral/stories/2-2-user-invitation-and-task-assignment-system.md - foundation and invitation system]

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/2-3-user-management-interface.context.xml

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- **2025-11-13:** Story created from epics.md via create-story workflow
