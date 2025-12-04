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
