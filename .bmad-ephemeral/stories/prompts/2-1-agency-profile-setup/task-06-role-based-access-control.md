# Story 2-1: Agency Profile Setup - Task 6

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 6: Add Role-Based Access Control for Settings Page

### Previous Tasks Completed
✅ Task 1: Created Agency Validation Schema
✅ Task 2: Implemented API Route for Agency Updates
✅ Task 3: Created Agency Settings Page and Form
✅ Task 4: Displayed Agency Name in Application Header
✅ Task 5: Implemented Timezone-Aware Date Formatting

### Description
Implement role-based access control to ensure only agency admins can access the settings page. Regular agency users should be redirected with an appropriate error message.

### Subtasks
- [ ] Implement `requireRole()` check in settings page
- [ ] Redirect non-admin users to dashboard with error message
- [ ] Display "Admin Only" badge on settings nav item
- [ ] Test access control with agency_user role

### Acceptance Criteria
This task supports **AC #1**: Only Agency Admin can access settings page

### Key Constraints
- **Role-based access**: Only agency_admin role can edit agency settings
- **Error handling**: Display user-friendly error messages
- **Security**: Server-side validation (don't rely only on UI)

### Dependencies
- Auth utilities for role checking (may need to create)
- Supabase for user role verification

### Reference Documents
- [Architecture Doc - RLS Policies](docs/architecture.md#data-architecture)
- [Story 1.3 - Authentication](../.bmad-ephemeral/stories/1-3-authentication-authorization.md)

---

## 📋 Update Implementation Manifest

1. Read `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
2. Update Task 5: Set status to "Completed" with today's date
3. Update Task 6: Set status to "In Progress" with today's date
4. Add notes about date helpers completion

---

## Implementation Instructions

1. **Update manifest** as described above
2. **Create or update** `packages/auth/src/utils/require-role.ts`
3. **Update** settings page to use role checking
4. **Add** navigation guards
5. **Test** with both admin and user roles

### Expected File Structure
```
packages/auth/src/utils/
└── require-role.ts       # Create or update

apps/agency/app/settings/
└── page.tsx              # Update with role check
```

### Implementation Pattern

```typescript
// packages/auth/src/utils/require-role.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole = 'agency_admin' | 'agency_user'

export async function requireRole(role: UserRole) {
  const supabase = createClient()

  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Get user's role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role, agency_id')
    .eq('id', user.id)
    .single()

  if (userError || !userData) {
    redirect('/login')
  }

  // Check role matches
  if (userData.role !== role) {
    redirect('/dashboard?error=unauthorized')
  }

  return { user, userData }
}
```

```typescript
// apps/agency/app/settings/page.tsx (update)
import { requireRole } from '@pleeno/auth/utils/require-role'

export default async function AgencySettingsPage() {
  // Check role before rendering
  await requireRole('agency_admin')

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-2xl font-bold">Agency Settings</h1>
        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded">
          Admin Only
        </span>
      </div>

      {/* Rest of settings form */}
    </div>
  )
}
```

### Navigation Guard Pattern

```typescript
// apps/shell/app/components/Navigation.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function Navigation() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkRole() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        setIsAdmin(userData?.role === 'agency_admin')
      }
    }

    checkRole()
  }, [])

  return (
    <nav>
      <Link href="/dashboard">Dashboard</Link>
      {isAdmin && (
        <Link href="/agency/settings">
          Settings <span className="text-xs text-gray-500">(Admin)</span>
        </Link>
      )}
    </nav>
  )
}
```

---

## After Completion

1. ✅ Update manifest.md: Mark Task 6 completed
2. 🔄 Move to: `task-07-write-tests.md`

---

## Testing Checklist

Before marking complete:
- [ ] requireRole() utility created
- [ ] Settings page protected with role check
- [ ] Non-admin users redirected to dashboard
- [ ] Error message displayed on unauthorized access
- [ ] "Admin Only" badge shown on settings page
- [ ] Navigation only shows settings link to admins
- [ ] Tested with agency_admin role (can access)
- [ ] Tested with agency_user role (cannot access)
- [ ] Manifest updated with Task 6 progress
