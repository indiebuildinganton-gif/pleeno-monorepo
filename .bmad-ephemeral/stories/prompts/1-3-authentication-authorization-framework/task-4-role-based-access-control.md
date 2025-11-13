# Task 4: Implement Role-Based Access Control (RBAC)

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Implement role-based access control system with server-side and client-side utilities for checking user roles.

## Acceptance Criteria Addressed
- AC 3: Role-based access control (RBAC) distinguishes between Agency Admin and Agency User roles

## Subtasks
- [ ] Store user role in users table (role ENUM: 'agency_admin', 'agency_user')
- [ ] Include role in JWT claims via Supabase Auth metadata
- [ ] Create requireRole() middleware helper
- [ ] Create hasRole() client-side utility function
- [ ] Test role-based UI rendering (hide admin-only buttons for agency_user)

## Implementation Guide

### 1. Verify Database Schema
The role column should already exist from Story 1.2. Verify:

```sql
-- Check users table has role column
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Should show: role | text with CHECK constraint
```

### 2. Create Permission Utilities
**File**: `packages/auth/src/utils/permissions.ts`

```typescript
import { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'

export type UserRole = 'agency_admin' | 'agency_user'

/**
 * Client-side utility to check if user has a specific role
 * WARNING: This is for UI rendering only, NOT a security boundary
 */
export function hasRole(user: User | null, role: UserRole): boolean {
  if (!user) return false

  const userRole = user.app_metadata?.role as UserRole

  // Agency admin has access to everything
  if (userRole === 'agency_admin') return true

  // Check specific role
  return userRole === role
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | null, roles: UserRole[]): boolean {
  if (!user) return false

  const userRole = user.app_metadata?.role as UserRole
  return roles.includes(userRole)
}

/**
 * Server-side middleware to require specific role
 * Use in API routes and middleware
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: User; role: UserRole } | NextResponse> {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const userRole = user.app_metadata?.role as UserRole

  if (!userRole || !allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: 'Forbidden - insufficient permissions' },
      { status: 403 }
    )
  }

  return { user, role: userRole }
}

/**
 * Check if user is agency admin
 */
export function isAgencyAdmin(user: User | null): boolean {
  return hasRole(user, 'agency_admin')
}

/**
 * Get user's role from JWT metadata
 */
export function getUserRole(user: User | null): UserRole | null {
  if (!user) return null
  return (user.app_metadata?.role as UserRole) || null
}
```

### 3. Update Auth Package Index
**File**: `packages/auth/src/index.ts`

```typescript
export { useAuth } from './hooks/useAuth'
export {
  hasRole,
  hasAnyRole,
  requireRole,
  isAgencyAdmin,
  getUserRole,
  type UserRole,
} from './utils/permissions'
```

### 4. Example: Protected API Route
**File**: `apps/shell/app/api/agency/users/route.ts` (example)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@pleeno/auth'
import { createServerClient } from '@pleeno/database/server'

export async function GET(request: NextRequest) {
  // Only agency admins can list users
  const authResult = await requireRole(request, ['agency_admin'])

  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  const { user } = authResult
  const supabase = createServerClient()

  // Get agency_id from JWT metadata
  const agencyId = user.app_metadata?.agency_id

  // Query users for this agency (RLS will also filter)
  const { data: users, error } = await supabase
    .from('users')
    .select('*')
    .eq('agency_id', agencyId)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }

  return NextResponse.json({ users })
}
```

### 5. Example: Client-Side Role Check
**File**: Example component using role checks

```typescript
'use client'

import { useAuth } from '@pleeno/auth'
import { hasRole, isAgencyAdmin } from '@pleeno/auth'

export function UserManagementPage() {
  const { user, loading } = useAuth()

  if (loading) return <div>Loading...</div>

  // Only show to agency admins
  if (!isAgencyAdmin(user)) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p>You don't have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">User Management</h1>

      {/* Admin-only actions */}
      <div className="mt-4 space-x-2">
        <button className="btn-primary">Add User</button>
        <button className="btn-danger">Delete User</button>
      </div>

      {/* User list */}
      <div className="mt-6">
        {/* User table */}
      </div>
    </div>
  )
}
```

### 6. Example: Conditional UI Rendering
```typescript
'use client'

import { useAuth } from '@pleeno/auth'
import { isAgencyAdmin } from '@pleeno/auth'

export function DashboardHeader() {
  const { user } = useAuth()
  const isAdmin = isAgencyAdmin(user)

  return (
    <header className="flex items-center justify-between p-4">
      <h1>Dashboard</h1>

      <nav className="space-x-4">
        <a href="/dashboard">Home</a>
        <a href="/entities">Entities</a>
        <a href="/payments">Payments</a>

        {/* Only show admin links to admins */}
        {isAdmin && (
          <>
            <a href="/agency/users">User Management</a>
            <a href="/agency/settings">Agency Settings</a>
          </>
        )}
      </nav>
    </header>
  )
}
```

## Architecture Context
- Two roles: `agency_admin` (full access) and `agency_user` (limited access)
- Role stored in both users table and JWT app_metadata
- Server-side checks are the security boundary
- Client-side checks are for UI rendering only

## Role Permissions
**Agency Admin can:**
- Manage users (add, edit, delete)
- Configure agency settings
- View all data for their agency
- Assign roles to users
- Access admin-only features

**Agency User can:**
- View data for their agency
- Create and edit entities
- Process payments
- Generate reports
- No user management access

## Security Notes
⚠️ **CRITICAL**:
- `hasRole()` is NOT a security boundary
- Always use `requireRole()` on server-side (API routes, Server Actions)
- Never trust client-side role checks for security decisions
- RLS policies provide database-level security
- RBAC adds application-level feature access control

## Prerequisites
- Task 1 completed (Supabase Auth integration)
- Task 2 completed (User registration with role assignment)
- Story 1.2 completed (users table with role column)

## Validation
- [ ] hasRole() returns correct boolean for different roles
- [ ] requireRole() blocks unauthorized access (403)
- [ ] requireRole() allows authorized access
- [ ] isAgencyAdmin() correctly identifies admins
- [ ] JWT app_metadata includes role field
- [ ] Client-side UI conditionally renders based on role

## Next Steps
After completing this task, proceed to Task 5: Implement Authentication Middleware.
