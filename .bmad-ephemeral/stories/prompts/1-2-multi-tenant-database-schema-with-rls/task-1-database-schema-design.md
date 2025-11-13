# Task 1: Design Multi-Tenant Database Schema with agency_id Isolation

## Context
You are implementing Story 1.2: Multi-Tenant Database Schema with RLS for the Pleeno commission management system. This is a greenfield Turborepo monorepo project with Next.js 15 and Supabase.

## Task Objective
Design and implement the core multi-tenant database schema with `agency_id` as the tenant isolation key.

## Prerequisites
- Story 1.1 must be completed (Turborepo monorepo initialized, Supabase running locally)
- Verify: `npx supabase status` shows running instance
- Project structure: `apps/`, `packages/`, `supabase/` directories exist

## Implementation Steps

### 1. Create Migration Directory Structure
```bash
mkdir -p supabase/migrations/001_agency_domain
```

### 2. Create Agencies Table Migration
Create file: `supabase/migrations/001_agency_domain/001_agencies_schema.sql`

```sql
-- Migration 001: Create agencies table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  currency TEXT DEFAULT 'AUD' NOT NULL,
  timezone TEXT DEFAULT 'Australia/Brisbane' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_agencies_name ON agencies(name);

-- Add comments for documentation
COMMENT ON TABLE agencies IS 'Multi-tenant agencies - each represents a separate commission agency with isolated data';
COMMENT ON COLUMN agencies.id IS 'Primary tenant identifier used for RLS policies across all tenant-scoped tables';
COMMENT ON COLUMN agencies.currency IS 'Default currency for all financial calculations (ISO 4217 code)';
COMMENT ON COLUMN agencies.timezone IS 'Agency timezone for date/time display (IANA timezone identifier)';
```

### 3. Create Users Table Migration
Create file: `supabase/migrations/001_agency_domain/002_users_schema.sql`

```sql
-- Migration 002: Create users table with agency_id foreign key
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

CREATE TABLE users (
  -- Link to Supabase Auth user
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- User profile
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,

  -- Role-based access control
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'agency_user')),

  -- Account status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes (critical for RLS queries)
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(agency_id, status);

-- Updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add comments
COMMENT ON TABLE users IS 'Application users linked to Supabase Auth, scoped to agencies for multi-tenant isolation';
COMMENT ON COLUMN users.agency_id IS 'Foreign key to agencies table - enforces tenant isolation via RLS policies';
COMMENT ON COLUMN users.id IS 'References auth.users(id) from Supabase Auth - single source of truth for authentication';
COMMENT ON COLUMN users.role IS 'User role within their agency: agency_admin (full access) or agency_user (limited access)';
```

### 4. Apply Migrations
```bash
cd supabase
npx supabase db reset  # Apply all migrations to local instance
```

### 5. Generate TypeScript Types
```bash
npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts
```

## Acceptance Criteria Validation

**AC1**: Database has clear tenant isolation model using agency_id as tenant key
- ✅ `agency_id` column added to users table with NOT NULL constraint
- ✅ Foreign key relationship: `users.agency_id` → `agencies.id` with CASCADE delete
- ✅ Indexes created on agency_id for query performance

## Verification Commands

```bash
# Check migrations were applied
npx supabase db diff

# Verify table structure
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d agencies"
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d users"

# Check indexes
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\di idx_users_agency_id"
```

## Expected Output
- ✅ Migration files created in `supabase/migrations/001_agency_domain/`
- ✅ Tables `agencies` and `users` exist in local Supabase database
- ✅ Foreign key constraint enforced: `users.agency_id` references `agencies.id`
- ✅ TypeScript types generated in `packages/database/src/types/database.types.ts`

## References
- [Story Context](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [Architecture Doc](docs/architecture.md) - Section: Database Schema - Agency Domain
- [ADR-003](docs/architecture.md) - Domain-Driven Migration Organization

## Next Task
After completing this task, proceed to **Task 2: Set Up Supabase Database Migrations Infrastructure**
