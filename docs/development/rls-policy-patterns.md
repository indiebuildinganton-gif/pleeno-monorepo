# RLS Policy Patterns for Multi-Tenant Isolation

**Epic**: 1 - Foundation & Multi-Tenant Security
**Story**: 1.2 - Multi-Tenant Database Schema with RLS
**Last Updated**: 2025-01-13

## Overview

All tenant-scoped tables in Pleeno **MUST** implement Row-Level Security (RLS) policies following the patterns documented here. This ensures complete data isolation between agencies at the database level.

## Core Principle

**Tenant Key**: `agency_id` (UUID) - Every tenant-scoped table must include this column.

**Isolation Layer**: PostgreSQL RLS enforces isolation - application code cannot bypass.

**Context Source**: Supabase Auth JWT → `auth.uid()` → User lookup → `agency_id`

## Standard RLS Policy Template

### When Creating New Tenant-Scoped Table

Use this template for any table that stores agency-specific data:

```sql
-- Step 1: Create table with agency_id column
CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  -- ... other columns ...
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Step 2: Add required indexes (CRITICAL for RLS performance)
CREATE INDEX idx_{table_name}_agency_id ON {table_name}(agency_id);

-- Step 3: Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SELECT policy (agency isolation)
CREATE POLICY {table_name}_agency_isolation_select ON {table_name}
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Step 5: Create INSERT policy (restrict or allow based on use case)
CREATE POLICY {table_name}_agency_isolation_insert ON {table_name}
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Step 6: Create UPDATE policy (agency isolation)
CREATE POLICY {table_name}_agency_isolation_update ON {table_name}
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Step 7: Create DELETE policy (agency isolation)
CREATE POLICY {table_name}_agency_isolation_delete ON {table_name}
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Step 8: Add policy documentation
COMMENT ON POLICY {table_name}_agency_isolation_select ON {table_name} IS
  'Agency isolation: Users can only SELECT rows belonging to their agency';
```

## Policy Variations

### Variation 1: User-Owned Resources (with self-access)

For tables where users should always access their own data (e.g., user profiles, notifications):

```sql
-- Multi-policy approach: Agency isolation OR user ownership
CREATE POLICY {table_name}_agency_isolation ON {table_name}
  FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY {table_name}_user_self_access ON {table_name}
  FOR SELECT
  USING (user_id = auth.uid());

-- Result: User sees their data + all agency data (OR logic)
```

### Variation 2: Admin-Only Modifications

For sensitive tables (e.g., agency settings, billing):

```sql
-- Only agency admins can UPDATE
CREATE POLICY {table_name}_admin_update ON {table_name}
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );
```

### Variation 3: Read-Only Tables

For reference data or audit logs:

```sql
-- Users can SELECT but not INSERT/UPDATE/DELETE
CREATE POLICY {table_name}_read_only_select ON {table_name}
  FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY {table_name}_prevent_insert ON {table_name}
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY {table_name}_prevent_update ON {table_name}
  FOR UPDATE
  USING (false);

CREATE POLICY {table_name}_prevent_delete ON {table_name}
  FOR DELETE
  USING (false);
```

## Performance Considerations

### Required Indexes

**ALWAYS create index on `agency_id`**:
```sql
CREATE INDEX idx_{table_name}_agency_id ON {table_name}(agency_id);
```

Without this index, RLS queries will perform full table scans (very slow).

### Composite Indexes for Common Queries

```sql
-- For status-based queries
CREATE INDEX idx_{table_name}_agency_status ON {table_name}(agency_id, status);

-- For date range queries
CREATE INDEX idx_{table_name}_agency_date ON {table_name}(agency_id, created_at DESC);
```

## Testing Your RLS Policies

### RLS Testing Checklist

For every new tenant-scoped table, verify:

- [ ] RLS is enabled: `SELECT rowsecurity FROM pg_tables WHERE tablename = '{table_name}'`
- [ ] All 4 operation types have policies (SELECT, INSERT, UPDATE, DELETE)
- [ ] Cross-agency data access prevented (User A cannot see Agency B data)
- [ ] Users can access their own agency's data
- [ ] Indexes exist on `agency_id` column
- [ ] Performance: EXPLAIN shows index usage
- [ ] Policies documented with COMMENT

### Test Template

```sql
-- Test cross-agency isolation
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "user-a-uuid"}';

-- This should return 0 rows (or only Agency A rows)
SELECT * FROM {table_name} WHERE agency_id = 'agency-b-uuid';
```

## Common Pitfalls

### ❌ Pitfall 1: Missing agency_id Index

**Problem**: Slow queries, full table scans
**Solution**: Always create index on agency_id

```sql
CREATE INDEX idx_{table_name}_agency_id ON {table_name}(agency_id);
```

### ❌ Pitfall 2: Forgetting CASCADE on Foreign Key

**Problem**: Cannot delete agency due to orphaned records
**Solution**: Use ON DELETE CASCADE

```sql
agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE
```

### ❌ Pitfall 3: Using Service Role Key in Client

**Problem**: RLS bypassed, security breach
**Solution**: Only use anon key in client, service role key in secure server contexts

```typescript
// ❌ WRONG: Never expose service role key
const supabase = createClient(url, SERVICE_ROLE_KEY);

// ✅ CORRECT: Use anon key (RLS enforced)
const supabase = createClient(url, ANON_KEY);
```

### ❌ Pitfall 4: Incomplete Policy Coverage

**Problem**: Some operations not protected by RLS
**Solution**: Create policies for ALL operations (SELECT, INSERT, UPDATE, DELETE)

### ❌ Pitfall 5: Not Testing Cross-Agency Access

**Problem**: Security vulnerabilities go unnoticed
**Solution**: Always test that User A cannot access Agency B data

## Migration Checklist

When creating migration for new tenant-scoped table:

- [ ] Table includes `agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE`
- [ ] Index created on `agency_id`
- [ ] RLS enabled: `ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY`
- [ ] Policies created for SELECT, INSERT, UPDATE, DELETE
- [ ] Policy names follow convention: `{table_name}_{operation}_policy`
- [ ] Comments added to policies documenting behavior
- [ ] Migration placed in correct domain folder (e.g., `001_agency_domain/`)
- [ ] Migration follows naming convention: `{number}_{description}.sql`

## References

- [Architecture Doc](../architecture.md) - Multi-Tenant Isolation section
- [Story 1.2 Context](../../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)

## Example: Adding Payment Plans Table (Future Epic 3)

```sql
-- Migration: 003_payment_plans_domain/001_payment_plans_schema.sql

CREATE TABLE payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  total_amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes
CREATE INDEX idx_payment_plans_agency_id ON payment_plans(agency_id);
CREATE INDEX idx_payment_plans_agency_status ON payment_plans(agency_id, status);
CREATE INDEX idx_payment_plans_entity ON payment_plans(entity_id);

-- Enable RLS
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- Agency isolation policies
CREATE POLICY payment_plans_agency_isolation_select ON payment_plans
  FOR SELECT USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY payment_plans_agency_isolation_insert ON payment_plans
  FOR INSERT WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY payment_plans_agency_isolation_update ON payment_plans
  FOR UPDATE
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
  WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY payment_plans_agency_isolation_delete ON payment_plans
  FOR DELETE USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));
```

---

**Key Takeaway**: Every tenant-scoped table MUST follow this pattern. No exceptions. Database-level enforcement ensures security cannot be bypassed by application bugs.
