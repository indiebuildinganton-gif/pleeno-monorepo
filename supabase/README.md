# Pleeno - Supabase Database

This directory contains the Supabase configuration and database migrations for the Pleeno commission management system.

## Epic 1: Foundation & Multi-Tenant Security
### Story 1.2: Multi-Tenant Database Schema with RLS

## What Has Been Implemented

### ✅ Migration Files Created

#### 1. Migration 001: Agencies Table
- **File**: `migrations/001_agency_domain/001_agencies_schema.sql`
- **Creates**: `agencies` table with:
  - `id` (UUID, primary key) - Tenant identifier
  - `name` (TEXT, required) - Agency name
  - `contact_email`, `contact_phone` - Contact information
  - `currency` (default: AUD) - Financial calculations currency
  - `timezone` (default: Australia/Brisbane) - Agency timezone
  - `created_at`, `updated_at` - Timestamps
- **Includes**:
  - Auto-update trigger for `updated_at` column
  - Index on `name` for common queries
  - Documentation comments on table and columns

#### 2. Migration 002: Users Table
- **File**: `migrations/001_agency_domain/002_users_schema.sql`
- **Creates**: `users` table with:
  - `id` (UUID, references auth.users) - Link to Supabase Auth
  - `agency_id` (UUID, FK to agencies) - Tenant isolation key
  - `email` (TEXT, unique) - User email
  - `full_name` (TEXT) - User's full name
  - `role` (TEXT) - Either 'agency_admin' or 'agency_user'
  - `status` (TEXT) - active/inactive/suspended
  - `created_at`, `updated_at` - Timestamps
- **Includes**:
  - Foreign key constraint: `agency_id` → `agencies(id)` ON DELETE CASCADE
  - Performance indexes: agency_id, email, (agency_id, status)
  - Email format validation constraint
  - Auto-update trigger for `updated_at`
  - Documentation comments

### ✅ Supabase Configuration
- **File**: `config.toml`
- **Configured**:
  - Project ID: `pleeno-local`
  - PostgreSQL 15
  - API, Auth, Storage, Studio ports
  - Email testing server (Inbucket)
  - JWT settings (1 hour expiry)
  - Development site URL (localhost:3000)
  - Redirect URLs (http://localhost:3000/**)

### ✅ Domain-Driven Migration Structure (Task 4)
- **Created**: Domain-based migration folder structure
  - `000_foundation/` - Foundation schema setup
  - `001_agency_domain/` - Agency and user tables (populated)
  - `002_entities_domain/` - Future: Entities, clients, representatives
  - `003_payments_domain/` - Future: Payments and commissions
  - `004_reports_domain/` - Future: Reporting and analytics
- **Foundation Migration**: Placeholder created at `000_foundation/00000000000000_initial_setup.sql`

### ✅ Package Structure
- **Directory**: `packages/database/`
- **Created**:
  - `package.json` with dependencies (@supabase/supabase-js, @supabase/ssr)
  - `src/types/database.types.ts` - Placeholder TypeScript types
  - `src/index.ts` - Package entry point

## Acceptance Criteria Status

### ✅ AC1: Clear Tenant Isolation Model
- **Status**: COMPLETE
- `agency_id` column added to users table with NOT NULL constraint
- Foreign key relationship: `users.agency_id` → `agencies.id` ON DELETE CASCADE
- Indexes created on agency_id for query performance

### ⏳ AC2-AC5: To Be Implemented in Future Tasks
- AC2: RLS policies enabled (Story 1.2, Task 3-4)
- AC3: RLS automatic filtering (Story 1.2, Task 5)
- AC4: Bypass prevention (Story 1.2, Task 6)
- AC5: Version-controlled migrations (COMPLETE)

## Current Status: Task 4 Completion

### ✅ Completed
- Supabase initialized with `npx supabase init`
- `config.toml` configured with project settings
- Domain-driven migration folder structure created
- Foundation migration placeholder created
- Configuration updated for local development

### ⚠️ Docker Requirement
**Important**: Supabase local development requires Docker to be installed and running. The configuration is complete, but the following steps require Docker:

- Starting local Supabase (`npx supabase start`)
- Applying migrations (`npx supabase db reset`)
- Accessing Supabase Studio (http://localhost:54323)
- Testing database connections

## Next Steps

### Prerequisites
Before applying migrations, you need:

1. **Docker Installed**: Supabase requires Docker to run locally
   ```bash
   # Install Docker Desktop or Docker Engine
   # Verify installation:
   docker --version
   ```

2. **Supabase CLI**: Install the Supabase CLI
   ```bash
   npm install -g supabase
   ```

### Applying Migrations

Once Docker is installed and running:

```bash
# 1. Start Supabase local instance (from supabase directory)
cd supabase
npx supabase start

# 2. Apply all migrations
npx supabase db reset

# 3. Verify database structure
npx supabase status

# 4. Generate TypeScript types
npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts
```

### Verification Queries

```bash
# Check tables were created
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d agencies"
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d users"

# Check foreign key constraint
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\d users" | grep "Foreign-key"

# Check indexes
psql postgresql://postgres:postgres@localhost:54322/postgres -c "\di idx_users_agency_id"
```

## Migration Organization

Following **ADR-003: Domain-Driven Migration Organization**, migrations are organized by domain:

```
supabase/migrations/
├── 001_agency_domain/          # Current (Story 1.2)
│   ├── 001_agencies_schema.sql
│   └── 002_users_schema.sql
├── 002_entities_domain/        # Future (Story 1.3)
├── 003_payments_domain/        # Future (Epic 4)
├── 004_notifications_domain/   # Future (Epic 5)
└── 005_audit_domain/           # Future (Epic 8)
```

## Database Schema Relationships

```
agencies (1) ─── (M) users
     │
     └─ Primary tenant identifier
     └─ All tenant-scoped tables will reference agency_id
```

## Resources

- [Architecture Document](../docs/architecture.md)
- [Story 1.2 Context](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- [Supabase Local Development](https://supabase.com/docs/guides/cli/local-development)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Epic**: 1 - Foundation & Multi-Tenant Security
**Story**: 1.2 - Multi-Tenant Database Schema with RLS
**Task**: 1 - Design Multi-Tenant Database Schema with agency_id Isolation
**Status**: ✅ COMPLETE (Migration files ready, awaiting Docker for application)
