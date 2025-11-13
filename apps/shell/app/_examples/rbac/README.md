# RBAC Example Components

This directory contains example components demonstrating Role-Based Access Control (RBAC) implementation in the Pleeno application.

## Overview

The Pleeno RBAC system implements a two-tier role hierarchy:
- **agency_admin**: Full access to all features including user management
- **agency_user**: Limited access to core features

## Components

### 1. UserManagementPage.tsx
Example of a page-level role restriction. This component demonstrates:
- Using `isAgencyAdmin()` to restrict entire pages
- Showing graceful error messages for unauthorized users
- Loading states during auth initialization
- Admin-only functionality placeholders

**Usage:**
```tsx
import UserManagementPage from './_examples/rbac/UserManagementPage'

export default function Page() {
  return <UserManagementPage />
}
```

### 2. DashboardHeader.tsx
Example of conditional UI rendering based on role. This component demonstrates:
- Using `isAgencyAdmin()` to show/hide navigation items
- Using `getUserRole()` to display role badges
- Admin-only links that are hidden from regular users
- Proper client-side role checking for UI purposes

**Usage:**
```tsx
import DashboardHeader from './_examples/rbac/DashboardHeader'

export default function DashboardLayout({ children }) {
  return (
    <>
      <DashboardHeader />
      {children}
    </>
  )
}
```

## API Routes

### /api/agency/users/route.ts
Example protected API endpoint demonstrating:
- Using `requireRole()` middleware to enforce authorization
- Returning 401 for unauthenticated requests
- Returning 403 for unauthorized requests (wrong role)
- Proper error handling and response formatting

**Usage:**
```typescript
import { requireRole } from '@pleeno/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const authResult = await requireRole(request, ['agency_admin'])

  if (authResult instanceof NextResponse) {
    return authResult // Return error response
  }

  const { user, role } = authResult
  // Proceed with authorized logic
}
```

## Available RBAC Functions

### Client-Side (UI Rendering Only)

```typescript
import {
  hasRole,
  hasAnyRole,
  isAgencyAdmin,
  getUserRole,
  type UserRole
} from '@pleeno/auth'

// Check if user has a specific role
hasRole(user, 'agency_admin') // true/false

// Check if user has any of the specified roles
hasAnyRole(user, ['agency_admin', 'agency_user']) // true/false

// Check if user is an agency admin (convenience function)
isAgencyAdmin(user) // true/false

// Get the user's role
getUserRole(user) // 'agency_admin' | 'agency_user' | null
```

### Server-Side (Security Boundary)

```typescript
import { requireRole } from '@pleeno/auth'
import { NextRequest } from 'next/server'

// Require specific role(s) in API routes
const authResult = await requireRole(request, ['agency_admin'])

if (authResult instanceof NextResponse) {
  return authResult // Error response (401 or 403)
}

const { user, role } = authResult
// Continue with authorized logic
```

## Security Notes

⚠️ **CRITICAL**: Client-side role checks are for UI rendering ONLY, NOT security boundaries.

### Security Boundaries

1. **Client-Side Functions** (`hasRole`, `isAgencyAdmin`, etc.)
   - ❌ NOT security boundaries
   - ✅ Use for hiding/showing UI elements
   - ✅ Use for conditional rendering
   - ❌ NEVER trust for authorization decisions

2. **Server-Side Functions** (`requireRole`)
   - ✅ Actual security boundary
   - ✅ Use in ALL API routes and Server Actions
   - ✅ Enforces authorization before data access
   - ✅ Returns proper HTTP status codes

3. **Row-Level Security (RLS)**
   - ✅ Database-level security
   - ✅ Ensures tenant isolation
   - ✅ Complements RBAC for defense in depth

### Defense in Depth

The Pleeno security model uses multiple layers:

```
┌─────────────────────────────────────┐
│ Client-Side Role Checks             │  UI Layer
│ (hasRole, isAgencyAdmin)            │  (Conditional Rendering)
└─────────────────────────────────────┘
           ⬇️ (User experience)
┌─────────────────────────────────────┐
│ Server-Side Role Enforcement        │  Application Layer
│ (requireRole middleware)            │  (Authorization)
└─────────────────────────────────────┘
           ⬇️ (API protection)
┌─────────────────────────────────────┐
│ Row-Level Security (RLS)            │  Database Layer
│ (Supabase policies)                 │  (Data filtering)
└─────────────────────────────────────┘
```

## Role Permissions Matrix

| Feature | Agency Admin | Agency User |
|---------|--------------|-------------|
| View Dashboard | ✅ | ✅ |
| View Entities | ✅ | ✅ |
| Create Entities | ✅ | ✅ |
| Edit Entities | ✅ | ✅ |
| Process Payments | ✅ | ✅ |
| Generate Reports | ✅ | ✅ |
| Manage Users | ✅ | ❌ |
| Assign Roles | ✅ | ❌ |
| Agency Settings | ✅ | ❌ |
| Delete Users | ✅ | ❌ |

## Testing RBAC

### Manual Testing

1. **Create two test users:**
   ```
   Admin: admin@example.com (role: agency_admin)
   User: user@example.com (role: agency_user)
   ```

2. **Test admin access:**
   - Login as admin
   - Navigate to `/agency/users`
   - Should see user management page
   - Should see admin-only navigation items

3. **Test user restrictions:**
   - Login as regular user
   - Navigate to `/agency/users`
   - Should see "Access Denied" message
   - Should NOT see admin-only navigation items

4. **Test API protection:**
   ```bash
   # As admin (should succeed)
   curl -H "Authorization: Bearer $ADMIN_TOKEN" \
     http://localhost:3000/api/agency/users

   # As user (should return 403)
   curl -H "Authorization: Bearer $USER_TOKEN" \
     http://localhost:3000/api/agency/users
   ```

## Implementation Checklist

- [x] Role column in users table
- [x] Role stored in JWT app_metadata
- [x] Client-side role checking functions
- [x] Server-side role enforcement middleware
- [x] Example protected API routes
- [x] Example client-side components
- [ ] Unit tests for role checking functions
- [ ] Integration tests for protected routes
- [ ] E2E tests for role-based UI

## Related Documentation

- [Authentication Flow](../../docs/authentication.md)
- [Multi-Tenant Security](../../docs/multi-tenant.md)
- [Database Schema](../../../supabase/migrations/)
- [API Security](../../docs/api-security.md)

## Epic & Story Reference

- **Epic 1**: Foundation & Multi-Tenant Security
- **Story 1.3**: Authentication & Authorization Framework
- **Task 4**: Implement Role-Based Access Control (RBAC)
