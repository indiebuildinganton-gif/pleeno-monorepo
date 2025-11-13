# Story 3-1: College Registry - Task 20
## Add Admin Permission Checks

**Task 20 of 21**: Centralized admin permission utilities

**Previous**: Task 19 (Validation schemas) - ✅ Completed

---

## Subtasks
- [ ] Create utility function: requireAdmin(supabase) in packages/auth or packages/utils
- [ ] Check current user role === 'agency_admin'
- [ ] Throw ForbiddenError if not admin
- [ ] Apply to all POST/PATCH/DELETE college endpoints
- [ ] Apply to contact add/edit/delete endpoints
- [ ] Show/hide admin-only UI elements based on user role

### AC: 3, 12

**Implementation**:
```typescript
// packages/utils/src/auth/requireAdmin.ts
import { SupabaseClient } from '@supabase/supabase-js'
import { ForbiddenError } from '../errors'

export async function requireAdmin(supabase: SupabaseClient) {
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new ForbiddenError('Authentication required')
  }

  const { data: currentUser } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (currentUser?.role !== 'agency_admin') {
    throw new ForbiddenError('Admin access required')
  }

  return currentUser
}

// Helper for client-side UI
export async function isAdmin(supabase: SupabaseClient): Promise<boolean> {
  try {
    await requireAdmin(supabase)
    return true
  } catch {
    return false
  }
}
```

**Usage in API routes**:
```typescript
import { requireAdmin } from '@pleeno/utils'

export async function POST(request: NextRequest) {
  const supabase = await createServerClient()
  const user = await requireAdmin(supabase) // Throws if not admin
  // ... rest of endpoint
}
```

**Usage in UI**:
```typescript
import { isAdmin } from '@pleeno/utils'

const userIsAdmin = await isAdmin(supabase)
{userIsAdmin && <button>+ Add College</button>}
```

---

## Success Criteria
- ✅ requireAdmin utility created
- ✅ Applied to all admin-only API endpoints
- ✅ UI conditionally shows admin buttons
- ✅ Non-admins get 403 errors
- ✅ Tests verify permission checks work

**Next**: Task 21 - Write tests (Final task!)
