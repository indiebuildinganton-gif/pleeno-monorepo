# Task 2: Set Up Supabase Database Migrations Infrastructure

## Context
You are implementing Story 1.2: Multi-Tenant Database Schema with RLS. Task 1 (database schema design) should be completed before starting this task.

## Task Objective
Set up robust Supabase migration infrastructure with domain-driven organization, version control, and rollback capability.

## Prerequisites
- Task 1 completed: Migration files `001_agencies_schema.sql` and `002_users_schema.sql` exist
- Supabase local instance running: `npx supabase status`
- Git initialized in project root

## Implementation Steps

### 1. Verify Migration Directory Structure
```bash
# Ensure domain-driven organization per ADR-003
ls -la supabase/migrations/001_agency_domain/

# Expected output:
# 001_agencies_schema.sql
# 002_users_schema.sql
```

### 2. Create Migration Testing Script
Create file: `supabase/scripts/test-migrations.sh`

```bash
#!/bin/bash
# Test migration apply and rollback capability
# Usage: ./scripts/test-migrations.sh

set -e

echo "🧪 Testing Supabase migrations..."

# Reset database to clean state
echo "1. Resetting database to clean state..."
npx supabase db reset --no-seed

# Check migration status
echo "2. Checking migration status..."
npx supabase migration list

# Test rollback capability
echo "3. Testing rollback to migration 001..."
npx supabase db reset
npx supabase migration up --version 20250101000001  # Timestamp of migration 001

# Verify only agencies table exists
echo "4. Verifying rollback state..."
TABLES=$(psql postgresql://postgres:postgres@localhost:54322/postgres -t -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('agencies', 'users');")

if echo "$TABLES" | grep -q "agencies"; then
  echo "✅ agencies table exists"
else
  echo "❌ agencies table missing after rollback"
  exit 1
fi

if echo "$TABLES" | grep -q "users"; then
  echo "❌ users table should not exist after rollback to migration 001"
  exit 1
else
  echo "✅ users table correctly absent"
fi

# Re-apply all migrations
echo "5. Re-applying all migrations..."
npx supabase db reset

echo "✅ Migration testing completed successfully!"
```

Make executable:
```bash
chmod +x supabase/scripts/test-migrations.sh
```

### 3. Create Migration Naming Convention Document
Create file: `supabase/migrations/001_agency_domain/README.md`

```markdown
# Agency Domain Migrations

This directory contains all database migrations related to the **Agency Domain** (Epic 1).

## Migration Naming Convention

**Format**: `{number}_{description}.sql`

- **Number**: Sequential within domain (001, 002, 003, etc.)
- **Description**: Snake_case description of migration purpose
- **Examples**:
  - `001_agencies_schema.sql` - Create agencies table
  - `002_users_schema.sql` - Create users table with agency_id FK
  - `003_agency_rls.sql` - Enable RLS policies on agencies table
  - `004_users_rls.sql` - Enable RLS policies on users table
  - `005_context_functions.sql` - Helper functions for agency context

## Domain-Driven Organization

Per ADR-003, migrations are grouped by domain:
- `001_agency_domain/` - Agency and user management (Epic 1)
- `002_entities_domain/` - Entities and contacts (Epic 2)
- `003_payment_plans_domain/` - Payment plans and installments (Epic 3)
- `004_payments_domain/` - Payment processing and reconciliation (Epic 4)

## Migration Rules

1. **Never modify existing migrations** - Always create new migration to change schema
2. **Use transactions** - All migrations wrapped in BEGIN/COMMIT
3. **Idempotent operations** - Use `IF NOT EXISTS`, `CREATE OR REPLACE`
4. **Down migrations** - Not supported by Supabase; use `db reset` for rollback
5. **Test migrations** - Run `./scripts/test-migrations.sh` before committing

## Rollback Strategy

Supabase CLI supports resetting to specific migration version:
```bash
# Reset to clean state
npx supabase db reset

# Apply migrations up to specific version
npx supabase migration up --version YYYYMMDDHHMMSS
```

## References
- [ADR-003: Domain-Driven Migration Organization](../../docs/architecture.md)
- [Supabase CLI Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)
```

### 4. Configure Git for Migrations
Add to `.gitignore` (if not already present):
```bash
# Add to .gitignore
cat >> .gitignore << 'EOF'

# Supabase
supabase/.branches
supabase/.temp
supabase/seed.sql
EOF
```

Ensure migrations are tracked:
```bash
# Migrations should be version controlled
git add supabase/migrations/
git add supabase/config.toml
```

### 5. Create Migration Checklist Template
Create file: `supabase/migrations/MIGRATION_CHECKLIST.md`

```markdown
# Migration Checklist

Use this checklist before creating and committing new migrations.

## Pre-Migration

- [ ] Local Supabase instance is running (`npx supabase status`)
- [ ] Current migrations are up to date (`npx supabase db reset`)
- [ ] Database types are generated (`npx supabase gen types typescript --local`)

## Creating Migration

- [ ] Migration file follows naming convention: `{number}_{description}.sql`
- [ ] Migration placed in correct domain directory (e.g., `001_agency_domain/`)
- [ ] SQL statements are idempotent (use `IF NOT EXISTS`, `CREATE OR REPLACE`)
- [ ] Includes comments documenting purpose and epic/story reference
- [ ] Uses proper constraints (NOT NULL, CHECK, FK, etc.)
- [ ] Adds indexes for foreign keys and frequently queried columns
- [ ] Includes table/column comments for documentation

## Testing Migration

- [ ] Run `npx supabase db reset` - migration applies successfully
- [ ] Run `./scripts/test-migrations.sh` - rollback test passes
- [ ] Verify schema changes: `psql -U postgres -h localhost -p 54322 -d postgres -c "\d {table_name}"`
- [ ] Check for migration errors: `npx supabase migration list`
- [ ] Regenerate TypeScript types: `npx supabase gen types typescript --local`

## Pre-Commit

- [ ] Migration file committed to Git
- [ ] Updated TypeScript types committed
- [ ] Migration appears in `npx supabase migration list`
- [ ] No uncommitted schema changes: `npx supabase db diff` returns empty

## Production Deployment (Future)

- [ ] Migration tested on staging environment
- [ ] Migration reviewed by team member
- [ ] Rollback plan documented (if applicable)
- [ ] Applied to production: `npx supabase db push`
```

### 6. Test Migration Rollback Capability
```bash
# Run migration test script
./supabase/scripts/test-migrations.sh
```

Expected output:
```
🧪 Testing Supabase migrations...
1. Resetting database to clean state...
2. Checking migration status...
3. Testing rollback to migration 001...
4. Verifying rollback state...
✅ agencies table exists
✅ users table correctly absent
5. Re-applying all migrations...
✅ Migration testing completed successfully!
```

### 7. Verify Migration Infrastructure
```bash
# Check migration files are version controlled
git status supabase/migrations/

# List applied migrations
npx supabase migration list

# Check for any schema drift
npx supabase db diff
```

## Acceptance Criteria Validation

**AC5**: Database migrations are version-controlled and repeatable
- ✅ Migrations in `supabase/migrations/001_agency_domain/` tracked in Git
- ✅ Migration naming convention documented: `{number}_{description}.sql`
- ✅ Rollback capability tested via `test-migrations.sh`
- ✅ Migration checklist created for future migrations

## Verification Commands

```bash
# Verify migration infrastructure
ls -R supabase/

# Test migration apply
npx supabase db reset

# Test rollback (should work)
npx supabase migration up --version 20250101000001

# Verify Git tracking
git log supabase/migrations/
```

## Expected Output
- ✅ Migration directory structure follows domain-driven organization
- ✅ Migration testing script (`test-migrations.sh`) passes
- ✅ Migration checklist and README created
- ✅ All migration files tracked in Git
- ✅ Rollback capability verified

## References
- [Story Context](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [ADR-003: Domain-Driven Migration Organization](docs/architecture.md)
- [Supabase CLI Documentation](https://supabase.com/docs/guides/cli/local-development)

## Next Task
After completing this task, proceed to **Task 3: Implement Row-Level Security Policies on Agencies Table**
