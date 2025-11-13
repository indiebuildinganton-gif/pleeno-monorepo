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
