# RLS Testing Guide

This directory contains scripts for testing and verifying Row-Level Security (RLS) policies on the Pleeno database.

## Prerequisites

1. **Supabase Running**: Ensure Supabase is running locally
   ```bash
   npx supabase status
   ```
   If not running, start it with:
   ```bash
   npx supabase start
   ```

2. **Docker**: Supabase requires Docker to be installed and running
   ```bash
   docker ps  # Should show running containers
   ```

3. **Migrations Applied**: Ensure all migrations have been applied
   ```bash
   npx supabase db reset  # Resets database and applies all migrations
   ```

## Available Scripts

### 1. Apply RLS Migration

The RLS migration is automatically applied when you reset the database:

```bash
npx supabase db reset
```

This will apply all migrations in order, including:
- `001_agencies_schema.sql` - Creates agencies table
- `002_users_schema.sql` - Creates users table
- `003_agency_rls.sql` - **Enables RLS and creates policies on agencies table**

### 2. Verify RLS Policies

Check that RLS is enabled and policies are correctly configured:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/verify-rls-agencies.sql
```

**What it checks:**
- ✅ RLS is enabled on agencies table
- ✅ All 4 expected policies exist (SELECT, INSERT, UPDATE, DELETE)
- ✅ Policies use `auth.uid()` correctly
- ✅ UPDATE policy checks for `agency_admin` role
- ✅ INSERT/DELETE policies block all operations
- ✅ Performance indexes exist on users.agency_id

### 3. Test RLS Functionality

Run comprehensive security tests to verify RLS policies work correctly:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-agencies.sql
```

**What it tests:**
1. **Setup**: Creates 2 test agencies (A and B) with admin users
2. **RLS Enabled**: Verifies RLS is active on agencies table
3. **Tenant Isolation (SELECT)**: User A can only see Agency A
4. **Tenant Isolation (SELECT)**: User B can only see Agency B
5. **Self-Update**: Agency admin can update their own agency
6. **Cross-Tenant Protection**: Agency A admin CANNOT update Agency B
7. **INSERT Protection**: Authenticated users cannot create agencies
8. **DELETE Protection**: Authenticated users cannot delete agencies
9. **Cleanup**: Removes all test data

**Expected Output:**
```
🧪 Testing RLS Policies on Agencies Table
==========================================

1. Setting up test data...
✅ Test data created

2. Testing RLS is enabled...
 schemaname | tablename | rls_enabled
------------+-----------+-------------
 public     | agencies  | t
(1 row)

3. Testing Agency A admin can only see Agency A...
 ✅ Correct agency visible

4. Testing Agency B admin can only see Agency B...
 ✅ Correct agency visible

5. Testing Agency A admin can update their agency...
 ✅ Agency admin can update their agency

6. Testing Agency A admin CANNOT update Agency B...
 ✅ Cross-agency update blocked

7. Testing authenticated users cannot INSERT agencies...
 ✅ INSERT correctly blocked by RLS

8. Testing authenticated users cannot DELETE agencies...
 ✅ DELETE correctly blocked by RLS

✅ All RLS tests passed!
```

## Understanding the RLS Policies

### Policy 1: agency_isolation_select (SELECT)

```sql
CREATE POLICY agency_isolation_select ON agencies
  FOR SELECT
  USING (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );
```

**How it works:**
1. User makes a SELECT query on agencies table
2. RLS policy executes for each row
3. `auth.uid()` retrieves current authenticated user's ID from JWT
4. Subquery looks up user's `agency_id` from users table
5. Only rows where `agencies.id = user's agency_id` are returned

**Result:** Users can only see their own agency's data

### Policy 2: agency_isolation_insert (INSERT)

```sql
CREATE POLICY agency_isolation_insert ON agencies
  FOR INSERT
  WITH CHECK (false);
```

**How it works:**
- `WITH CHECK (false)` means the condition always fails
- No authenticated user can INSERT rows into agencies table
- Only the service role (bypass RLS) can create agencies

**Result:** Application users cannot create new agencies

### Policy 3: agency_isolation_update (UPDATE)

```sql
CREATE POLICY agency_isolation_update ON agencies
  FOR UPDATE
  USING (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (...);
```

**How it works:**
1. `USING` clause: Determines which rows can be selected for update
2. Only rows matching user's agency_id AND user has role='agency_admin'
3. `WITH CHECK` clause: Same condition applied to updated data
4. Regular users (non-admins) cannot update even their own agency

**Result:** Only agency admins can update their own agency settings

### Policy 4: agency_isolation_delete (DELETE)

```sql
CREATE POLICY agency_isolation_delete ON agencies
  FOR DELETE
  USING (false);
```

**How it works:**
- `USING (false)` means the condition always fails
- No authenticated user can DELETE rows from agencies table
- Only the service role (bypass RLS) can delete agencies

**Result:** Application users cannot delete agencies

## Troubleshooting

### Test Script Fails

**Issue**: `psql: connection refused`
```bash
# Check if Supabase is running
npx supabase status

# If not running, start it
npx supabase start
```

**Issue**: `relation "agencies" does not exist`
```bash
# Reset database and apply migrations
npx supabase db reset
```

**Issue**: Test shows "RLS FAILED"
```bash
# Verify policies are correctly defined
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/verify-rls-agencies.sql

# Check for policy errors in migration
cat supabase/migrations/001_agency_domain/003_agency_rls.sql
```

### Performance Issues

If RLS queries are slow, ensure indexes exist:

```sql
-- Check for required index
SELECT * FROM pg_indexes WHERE tablename = 'users' AND indexdef LIKE '%agency_id%';

-- Should show: idx_users_agency_id
```

This index is critical because every RLS SELECT policy performs a lookup on `users.agency_id`.

## Next Steps

After verifying RLS on agencies table:

1. **Task 4**: Implement RLS policies on users table
2. **Task 5**: Implement RLS on all other tenant-scoped tables
3. **Integration Testing**: Test RLS with actual Supabase Auth flow
4. **Production Deployment**: Apply migrations to production Supabase instance

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS Guide](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- Architecture Doc: `docs/architecture.md` - Section: Multi-Tenant Isolation (RLS)
- ADR-002: Supabase with PostgreSQL RLS for Multi-Tenancy
