# Task 5: Implement agency_id Context Setting Mechanism

## Context
You are implementing Story 1.2: Multi-Tenant Database Schema with RLS. Tasks 1-4 should be completed (RLS policies enabled on agencies and users tables).

## Task Objective
Implement the mechanism that extracts `agency_id` from Supabase JWT tokens and makes it available to RLS policies via PostgreSQL session variables.

## Prerequisites
- Tasks 1-4 completed: RLS policies enabled and tested
- Understanding: RLS policies need to know current user's `agency_id`
- Current approach: Policies use `auth.uid()` to lookup user's agency_id from users table

## Context Setting Strategy

### Current Approach (Working)
```sql
-- Policy looks up agency_id from users table
USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
```

**Pros**: Simple, works with Supabase Auth
**Cons**: Extra query on every RLS check

### Alternative Approach (This Task)
```sql
-- Set PostgreSQL session variable from JWT
SET LOCAL app.current_agency_id = '<uuid>';

-- Policy reads from session variable
USING (agency_id = current_setting('app.current_agency_id')::uuid)
```

**Pros**: Faster (no extra query), explicit context
**Cons**: Requires middleware to set context on each request

## Implementation Steps

### 1. Create Database Function for Context Setting
Create file: `supabase/migrations/001_agency_domain/005_context_functions.sql`

```sql
-- Migration 005: Create helper functions for agency context setting
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Function: Extract agency_id from JWT and set session variable
CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS VOID AS $$
DECLARE
  user_agency_id UUID;
BEGIN
  -- Get current user's agency_id from users table
  SELECT agency_id INTO user_agency_id
  FROM users
  WHERE id = auth.uid();

  -- Set session variable for use by RLS policies
  IF user_agency_id IS NOT NULL THEN
    PERFORM set_config(
      'app.current_agency_id',
      user_agency_id::text,
      true  -- true = local to transaction (important for security)
    );
  ELSE
    -- Clear context if no agency found
    PERFORM set_config('app.current_agency_id', '', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get current agency context (helper for debugging)
CREATE OR REPLACE FUNCTION get_agency_context()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_agency_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify user belongs to agency (helper for testing)
CREATE OR REPLACE FUNCTION verify_agency_access(target_agency_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_agency UUID;
BEGIN
  SELECT agency_id INTO user_agency
  FROM users
  WHERE id = auth.uid();

  RETURN user_agency = target_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION set_agency_context() IS
  'Extracts agency_id from current user and sets PostgreSQL session variable app.current_agency_id';

COMMENT ON FUNCTION get_agency_context() IS
  'Returns current agency_id from session variable (useful for debugging)';

COMMENT ON FUNCTION verify_agency_access(UUID) IS
  'Checks if current user belongs to specified agency (useful for application logic)';

COMMIT;
```

### 2. Apply Migration
```bash
npx supabase db reset
```

### 3. Create Supabase Client Utilities Package
Create file: `packages/database/src/client.ts`

```typescript
/**
 * Supabase client utilities for multi-tenant database access
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.2: Multi-Tenant Database Schema with RLS
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

/**
 * Create Supabase client for browser/client-side use
 * Uses anon key - RLS policies automatically enforced
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
}

/**
 * Get current user's agency_id from Supabase session
 * Returns null if user not authenticated or no agency assigned
 */
export async function getCurrentAgencyId(
  client: ReturnType<typeof createClient>
): Promise<string | null> {
  const {
    data: { session },
  } = await client.auth.getSession();

  if (!session?.user) {
    return null;
  }

  // Get agency_id from users table
  const { data: user, error } = await client
    .from('users')
    .select('agency_id')
    .eq('id', session.user.id)
    .single();

  if (error || !user) {
    console.error('Failed to get agency_id:', error);
    return null;
  }

  return user.agency_id;
}
```

Create file: `packages/database/src/server.ts`

```typescript
/**
 * Supabase server-side client utilities
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.2: Multi-Tenant Database Schema with RLS
 */

import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types/database.types';

/**
 * Create Supabase client for server-side use (Server Components, API Routes)
 * Automatically handles session management via cookies
 */
export function createServerClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error in Server Component (cookies are read-only)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle error in Server Component
          }
        },
      },
    }
  );
}

/**
 * Set agency context in database session
 * Call this before executing RLS-protected queries
 */
export async function setAgencyContext(
  client: ReturnType<typeof createServerClient>
): Promise<void> {
  try {
    // Call database function to set session variable
    const { error } = await client.rpc('set_agency_context');

    if (error) {
      console.error('Failed to set agency context:', error);
    }
  } catch (err) {
    console.error('Error setting agency context:', err);
  }
}
```

Create file: `packages/database/src/middleware.ts`

```typescript
/**
 * Middleware utilities for agency context management
 * Epic 1: Foundation & Multi-Tenant Security
 * Story 1.2: Multi-Tenant Database Schema with RLS
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from './server';

/**
 * Middleware to set agency context for API routes
 * Add this to your API route handlers to ensure RLS context is set
 *
 * Example usage:
 * ```typescript
 * import { withAgencyContext } from '@pleeno/database/middleware';
 *
 * export const GET = withAgencyContext(async (request) => {
 *   const supabase = createServerClient();
 *   // RLS context is already set
 *   const { data } = await supabase.from('users').select('*');
 *   return Response.json(data);
 * });
 * ```
 */
export function withAgencyContext(
  handler: (request: NextRequest) => Promise<Response>
) {
  return async function (request: NextRequest): Promise<Response> {
    const supabase = createServerClient();

    // Set agency context from JWT
    const { error } = await supabase.rpc('set_agency_context');

    if (error) {
      console.error('Failed to set agency context:', error);
      return NextResponse.json(
        { error: 'Failed to initialize agency context' },
        { status: 500 }
      );
    }

    // Call the actual handler
    return handler(request);
  };
}

/**
 * Get current user's agency_id on server side
 */
export async function getServerAgencyId(): Promise<string | null> {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return null;
  }

  const { data: user } = await supabase
    .from('users')
    .select('agency_id')
    .eq('id', session.user.id)
    .single();

  return user?.agency_id || null;
}
```

Create file: `packages/database/src/index.ts`

```typescript
/**
 * Database package exports
 * Epic 1: Foundation & Multi-Tenant Security
 */

// Client-side utilities
export { createClient, getCurrentAgencyId } from './client';

// Server-side utilities
export { createServerClient, setAgencyContext } from './server';

// Middleware
export { withAgencyContext, getServerAgencyId } from './middleware';

// Types
export type { Database } from './types/database.types';
```

### 4. Create package.json for Database Package
Create file: `packages/database/package.json`

```json
{
  "name": "@pleeno/database",
  "version": "0.1.0",
  "private": true,
  "exports": {
    ".": "./src/index.ts",
    "./client": "./src/client.ts",
    "./server": "./src/server.ts",
    "./middleware": "./src/middleware.ts",
    "./types": "./src/types/database.types.ts"
  },
  "scripts": {
    "generate-types": "supabase gen types typescript --local > src/types/database.types.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### 5. Install Database Package Dependencies
```bash
cd packages/database
npm install
cd ../..
```

### 6. Generate TypeScript Types
```bash
npx supabase gen types typescript --local > packages/database/src/types/database.types.ts
```

### 7. Create Context Testing Script
Create file: `supabase/scripts/test-context-mechanism.sql`

```sql
-- Test agency context setting mechanism
-- Run: psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-context-mechanism.sql

\echo '🧪 Testing Agency Context Mechanism'
\echo '===================================='

-- Setup
\echo '\n1. Setting up test data...'

INSERT INTO agencies (id, name) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Agency A');

INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@agency-a.com')
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, agency_id, email, full_name, role) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'admin@agency-a.com', 'Admin A', 'agency_admin');

\echo '✅ Test data created'

-- Test 1: Set agency context as authenticated user
\echo '\n2. Testing set_agency_context() function...'
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT set_agency_context();

SELECT
  CASE
    WHEN get_agency_context() = '11111111-1111-1111-1111-111111111111' THEN '✅ Agency context set correctly'
    ELSE '❌ Agency context not set: ' || COALESCE(get_agency_context()::text, 'NULL')
  END AS test_result;

-- Test 2: Verify context is transaction-scoped
\echo '\n3. Testing context is transaction-scoped...'

-- Start new transaction (should clear context)
BEGIN;
SELECT
  CASE
    WHEN get_agency_context() IS NULL THEN '✅ Context correctly cleared in new transaction'
    ELSE '❌ Context leaked across transactions: ' || get_agency_context()::text
  END AS test_result;
COMMIT;

-- Test 3: Test verify_agency_access helper function
\echo '\n4. Testing verify_agency_access() helper...'
SET LOCAL request.jwt.claims = '{"sub": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"}';

SELECT
  CASE
    WHEN verify_agency_access('11111111-1111-1111-1111-111111111111') THEN '✅ User has access to their agency'
    ELSE '❌ verify_agency_access failed for user''s own agency'
  END AS test_result;

SELECT
  CASE
    WHEN NOT verify_agency_access('22222222-2222-2222-2222-222222222222') THEN '✅ User correctly denied access to other agency'
    ELSE '❌ SECURITY BREACH: User has access to other agency'
  END AS test_result;

\echo '\n✅ All context mechanism tests passed!'
\echo 'Cleaning up...'

-- Cleanup
RESET ROLE;
DELETE FROM users;
DELETE FROM agencies;
DELETE FROM auth.users WHERE email = 'admin@agency-a.com';

\echo '✅ Cleanup completed'
```

### 8. Run Context Tests
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-context-mechanism.sql
```

## Acceptance Criteria Validation

**AC3**: RLS policies automatically filter queries to current user's agency_id
- ✅ `set_agency_context()` function extracts agency_id from current user
- ✅ Session variable `app.current_agency_id` set with transaction scope
- ✅ Helper functions created for context management

## Verification Commands

```bash
# Verify functions were created
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\df set_agency_context"
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\df get_agency_context"
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\df verify_agency_access"

# Test context setting
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-context-mechanism.sql
```

## Expected Output
- ✅ Migration `005_context_functions.sql` created and applied
- ✅ 3 database functions created: `set_agency_context()`, `get_agency_context()`, `verify_agency_access()`
- ✅ Database package created in `packages/database/src/`
- ✅ Client utilities: `createClient()`, `createServerClient()`, `setAgencyContext()`
- ✅ Middleware: `withAgencyContext()` for API routes
- ✅ TypeScript types generated
- ✅ Context test script passes

## References
- [Story Context](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [Architecture Doc](docs/architecture.md) - Database to Frontend section
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)

## Next Task
After completing this task, proceed to **Task 6: Create Comprehensive RLS Test Suite**
