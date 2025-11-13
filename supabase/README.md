# Pleeno Database (Supabase PostgreSQL)

Multi-tenant commission management system with Row-Level Security (RLS) enforcing complete data isolation.

## Quick Start

```bash
# Start local Supabase instance
npx supabase start

# Apply migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts

# Run RLS test suite
./scripts/run-all-tests.sh
```

## Database Architecture

### Multi-Tenant Isolation

**Tenant Key**: `agency_id` (UUID) - Every tenant-scoped table includes this column.

**Isolation**: PostgreSQL Row-Level Security (RLS) automatically filters queries.

**Security**: Database-enforced isolation - application code cannot bypass.

### RLS Policy Pattern

All tenant-scoped tables follow the standard pattern. See [docs/development/rls-policy-patterns.md](../docs/development/rls-policy-patterns.md).

**Template**: `supabase/migrations/_TEMPLATE_tenant_scoped_table.sql`

## Creating New Tenant-Scoped Tables

1. Copy template: `cp migrations/_TEMPLATE_tenant_scoped_table.sql migrations/{domain}/{number}_{table_name}.sql`
2. Replace `{table_name}` with actual table name
3. Add table-specific columns
4. Apply migration: `npx supabase db reset`
5. Generate types: `npx supabase gen types typescript --local`
6. Run tests: `./scripts/run-all-tests.sh`
7. Commit migration and updated types

## Testing

```bash
# Run all RLS tests
./scripts/run-all-tests.sh

# Run comprehensive test suite
psql postgresql://postgres:postgres@localhost:54322/postgres -f tests/rls-comprehensive-test-suite.sql
```

## Migration Organization

```
supabase/
└── migrations/
    ├── 001_agency_domain/       # Epic 1: Foundation & Multi-Tenant Security
    │   ├── 001_agencies_schema.sql
    │   ├── 002_users_schema.sql
    │   ├── 003_agency_rls.sql
    │   ├── 004_users_rls.sql
    │   └── 005_context_functions.sql
    ├── 002_entities_domain/     # Epic 2: Entities and contacts
    └── 003_payment_plans_domain/ # Epic 3: Payment plans
```

## References

- [RLS Policy Patterns](../docs/development/rls-policy-patterns.md)
- [Security Testing Guidelines](../docs/development/security-testing-guidelines.md)
- [Story 1.2 Implementation](../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md)
