# Task 6: Implement Agency Context Setting

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Extract agency_id from JWT claims and set PostgreSQL session variable to enable Row-Level Security (RLS) filtering.

## Acceptance Criteria Addressed
- AC 5: agency_id is automatically set in the security context on login

## Subtasks
- [ ] Extract agency_id from JWT claims (user.app_metadata.agency_id)
- [ ] Set PostgreSQL session variable: `SET LOCAL app.current_agency_id`
- [ ] Create setAgencyContext() function in packages/database/src/middleware.ts
- [ ] Call setAgencyContext() in server-side data fetching
- [ ] Verify RLS policies filter correctly by agency_id

## Implementation Guide

### 1. Create Database RPC Function (Migration)
First, ensure the database function exists from Story 1.2. If not, create it:

**File**: `supabase/migrations/001_agency_domain/04_rls_helpers.sql`

```sql
-- Function to set agency context for RLS
CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get agency_id from JWT claims
  PERFORM set_config(
    'app.current_agency_id',
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'agency_id',
      ''
    ),
    true  -- true = LOCAL to current transaction
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION set_agency_context() TO authenticated;

COMMENT ON FUNCTION set_agency_context() IS
'Sets the agency context from JWT claims for Row-Level Security filtering';
```

### 2. Create setAgencyContext Utility
**File**: `packages/database/src/middleware.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js'

/**
 * Sets the agency context for RLS policies
 * Extracts agency_id from JWT claims and sets PostgreSQL session variable
 *
 * Call this function at the start of any server-side data fetching operation
 * to ensure RLS policies filter data by the user's agency.
 *
 * @param supabase - Supabase client (server-side)
 * @throws Error if agency context cannot be set
 */
export async function setAgencyContext(
  supabase: SupabaseClient
): Promise<void> {
  try {
    // Call the database function to set RLS context
    const { error } = await supabase.rpc('set_agency_context')

    if (error) {
      console.error('Failed to set agency context:', error)
      throw new Error('Failed to set agency context')
    }
  } catch (err) {
    console.error('Error setting agency context:', err)
    throw err
  }
}

/**
 * Gets the current user's agency ID from JWT claims
 *
 * @param supabase - Supabase client (server-side)
 * @returns agency_id or null if not found
 */
export async function getCurrentAgencyId(
  supabase: SupabaseClient
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return (user.app_metadata?.agency_id as string) || null
}

/**
 * Verifies that agency context is correctly set
 * Useful for debugging RLS issues
 *
 * @param supabase - Supabase client (server-side)
 * @returns The current agency_id from session or null
 */
export async function getAgencyContextValue(
  supabase: SupabaseClient
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_current_agency_id')

    if (error) {
      console.error('Failed to get agency context:', error)
      return null
    }

    return data as string | null
  } catch (err) {
    console.error('Error getting agency context:', err)
    return null
  }
}
```

### 3. Create Helper Function to Get Context (Optional)
Add this to the migration if you want to debug context:

**File**: `supabase/migrations/001_agency_domain/04_rls_helpers.sql` (append)

```sql
-- Helper function to get current agency context (for debugging)
CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN current_setting('app.current_agency_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION get_current_agency_id() TO authenticated;

COMMENT ON FUNCTION get_current_agency_id() IS
'Returns the current agency ID from session variable (for debugging)';
```

### 4. Update Database Package Index
**File**: `packages/database/src/index.ts`

```typescript
export { createServerClient } from './server'
export { createClient } from './client'
export {
  setAgencyContext,
  getCurrentAgencyId,
  getAgencyContextValue,
} from './middleware'
```

### 5. Example: Using setAgencyContext in Server Component
**File**: Example Server Component

```typescript
import { createServerClient } from '@pleeno/database/server'
import { setAgencyContext } from '@pleeno/database'
import { redirect } from 'next/navigation'

export default async function EntitiesPage() {
  const supabase = createServerClient()

  // Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Set agency context for RLS
  await setAgencyContext(supabase)

  // Fetch entities - RLS will automatically filter by agency_id
  const { data: entities, error } = await supabase
    .from('entities')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch entities:', error)
    return <div>Error loading entities</div>
  }

  return (
    <div>
      <h1>Entities</h1>
      <ul>
        {entities.map((entity) => (
          <li key={entity.id}>{entity.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 6. Example: Using setAgencyContext in API Route
**File**: Example API Route

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database/server'
import { setAgencyContext } from '@pleeno/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()

    // Verify authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set agency context for RLS
    await setAgencyContext(supabase)

    // Fetch data - RLS filters by agency_id automatically
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    return NextResponse.json({ payments })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

### 7. Update Signup to Set Agency in Metadata
Make sure signup flow sets agency_id in JWT metadata:

**File**: `apps/shell/app/api/auth/signup/route.ts` (verify this exists)

```typescript
// After creating user record, update JWT metadata
const { error: updateError } = await supabase.auth.updateUser({
  data: {
    agency_id: agencyId,
    role: isFirstUser ? 'agency_admin' : 'agency_user',
  },
})
```

## Architecture Context
- RLS policies use `current_setting('app.current_agency_id')` to filter data
- JWT claims from Supabase Auth contain agency_id in app_metadata
- Database function extracts JWT claims and sets session variable
- Session variable is LOCAL to each transaction (automatic cleanup)

## How It Works

1. **User logs in** → JWT includes `app_metadata.agency_id`
2. **Server Component/API route** → Creates Supabase client with JWT
3. **Call `setAgencyContext()`** → Executes `set_agency_context()` RPC
4. **Database function** → Extracts agency_id from JWT → Sets session variable
5. **RLS policies** → Read `current_setting('app.current_agency_id')` → Filter queries
6. **Query executes** → Only returns data for user's agency

## Security Notes
⚠️ **CRITICAL**:
- Always call `setAgencyContext()` before data queries
- RLS policies are the actual security boundary
- Even if context is not set, RLS should block cross-tenant access
- Context setting is an optimization and explicit filter
- Never trust client-side agency_id values

## Prerequisites
- Story 1.2 completed (RLS policies and set_agency_context function)
- Task 2 completed (Signup sets agency_id in JWT metadata)
- Task 5 completed (Middleware validates JWT)

## Validation
- [ ] set_agency_context() database function exists
- [ ] setAgencyContext() utility function works without errors
- [ ] getCurrentAgencyId() returns correct agency_id from JWT
- [ ] Queries return only data for user's agency
- [ ] Cross-tenant access is blocked (User A cannot see User B's data)
- [ ] Context is set correctly in Server Components
- [ ] Context is set correctly in API routes

## Testing Scenarios

### Test 1: Verify Context Setting
```typescript
const supabase = createServerClient()
await setAgencyContext(supabase)

const agencyId = await getCurrentAgencyId(supabase)
const contextValue = await getAgencyContextValue(supabase)

console.log('JWT agency_id:', agencyId)
console.log('Session agency_id:', contextValue)
// Should match
```

### Test 2: Verify Cross-Tenant Isolation
1. Create two agencies with users
2. Log in as User A (Agency 1)
3. Try to query Agency 2's data
4. Should return empty results (filtered by RLS)

### Test 3: Verify RLS Filtering
```sql
-- Manual test in Supabase SQL editor
SELECT set_config('request.jwt.claims', '{"agency_id": "test-agency-uuid"}', true);
SELECT set_agency_context();
SELECT * FROM entities;  -- Should only show entities for test-agency-uuid
```

## Debugging Tips
- Check JWT metadata: `console.log(user.app_metadata)`
- Verify context: Use `getAgencyContextValue()`
- Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'entities'`
- Test direct SQL: Use Supabase SQL editor to test RLS

## Next Steps
After completing this task, proceed to Task 7: Create Auth UI Components.
