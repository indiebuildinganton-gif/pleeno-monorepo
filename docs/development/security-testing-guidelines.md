# Security Testing Guidelines for Multi-Tenant Features

**Epic**: 1 - Foundation & Multi-Tenant Security
**Last Updated**: 2025-01-13

## Mandatory Security Tests for Every Feature

### 1. RLS Isolation Test

**Requirement**: Verify users cannot access other agencies' data

```sql
-- Setup: Create test data for Agency A and Agency B
-- Test: Authenticate as User A
-- Execute: SELECT * FROM {table_name}
-- Expected: Only Agency A rows returned (zero Agency B rows)

SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-a-uuid"}';

SELECT COUNT(*) AS leaked_rows
FROM {table_name}
WHERE agency_id = 'agency-b-uuid';

-- Expected: leaked_rows = 0
```

**❌ Test Fails If**: User A can see any Agency B data

### 2. Cross-Agency Modification Prevention Test

**Requirement**: Users cannot modify other agencies' data

```sql
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-a-uuid"}';

UPDATE {table_name}
SET {column} = 'HACKED'
WHERE agency_id = 'agency-b-uuid';

-- Expected: 0 rows affected, no error (silent filtering by RLS)

SELECT {column}
FROM {table_name}
WHERE agency_id = 'agency-b-uuid'
  AND {column} = 'HACKED';

-- Expected: 0 rows (update was blocked)
```

**❌ Test Fails If**: UPDATE affects any Agency B rows

### 3. Role-Based Access Control Test

**Requirement**: Regular users cannot perform admin-only operations

```sql
-- Test admin-only operation as regular user
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "regular-user-uuid"}';

-- Attempt admin operation (e.g., delete user, modify agency settings)
DELETE FROM users WHERE id != auth.uid();

-- Expected: 0 rows affected (operation blocked)
```

**❌ Test Fails If**: Regular user can perform admin operations

### 4. Policy Completeness Validation

**Requirement**: All tenant-scoped tables have RLS enabled

```sql
SELECT
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = '{table_name}';

-- Expected: rls_enabled = true
```

**❌ Test Fails If**: RLS not enabled on tenant-scoped table

## Testing Workflow for New Features

### Before Committing Code

- [ ] Run local RLS test suite: `./supabase/scripts/run-all-tests.sh`
- [ ] Add feature-specific security tests to test suite
- [ ] Verify no cross-agency data leakage
- [ ] Test with different user roles (admin vs regular user)
- [ ] Check EXPLAIN plans show index usage
- [ ] Validate all policies exist (SELECT, INSERT, UPDATE, DELETE)

### In Pull Request

- [ ] CI/CD RLS tests pass (GitHub Actions)
- [ ] Security testing checklist completed
- [ ] RLS policy documentation updated
- [ ] Migration follows template pattern

### Code Review Checklist

**Reviewer MUST verify**:

- [ ] All tenant-scoped tables have `agency_id` column with FK
- [ ] RLS enabled on all tenant-scoped tables
- [ ] Indexes created on `agency_id`
- [ ] Policies created for all operations (SELECT, INSERT, UPDATE, DELETE)
- [ ] No service role key usage in client code
- [ ] Tests include cross-agency isolation verification

## Security Red Flags

**🚨 IMMEDIATE CODE REVIEW REQUIRED IF:**

1. Table with agency-specific data does NOT have `agency_id` column
2. Table has `agency_id` but RLS not enabled
3. Service role key used in client-side code
4. Direct SQL bypasses RLS checks
5. User role check done in application code instead of RLS policy
6. Foreign key missing ON DELETE CASCADE
7. Migration modifies existing RLS policies (should create new migration)

## Performance Testing

### Ensure RLS Queries Use Indexes

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM {table_name}
WHERE agency_id = 'some-uuid';

-- Expected: "Index Scan using idx_{table_name}_agency_id"
-- NOT: "Seq Scan on {table_name}"
```

**❌ Performance Issue If**: Full table scan detected

### Benchmark RLS Overhead

```bash
# Measure query time with RLS
psql -c "EXPLAIN ANALYZE SELECT * FROM {table_name}" > with_rls.txt

# Compare: RLS overhead should be <5%
```

## References

- [RLS Policy Patterns](./rls-policy-patterns.md)
- [Story 1.2 RLS Implementation](../../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md)
- [Comprehensive RLS Test Suite](../../supabase/tests/rls-comprehensive-test-suite.sql)
