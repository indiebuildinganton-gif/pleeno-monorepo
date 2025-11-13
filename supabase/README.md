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

#### 3. Migration 003: Agencies RLS Policies
- **File**: `migrations/001_agency_domain/003_agency_rls.sql`
- **Enables**: Row-Level Security on `agencies` table
- **Policies**:
  - `agency_isolation_select`: Users can only view their own agency
  - `agency_isolation_insert`: Blocks INSERT (service role only)
  - `agency_isolation_update`: Agency admins can update their agency
  - `agency_isolation_delete`: Blocks DELETE (service role only)
- **Testing**: `scripts/test-rls-agencies.sql` - 8 comprehensive tests

#### 4. Migration 004: Users RLS Policies
- **File**: `migrations/001_agency_domain/004_users_rls.sql`
- **Enables**: Row-Level Security on `users` table
- **Policies**:
  - SELECT: Multi-policy approach (agency isolation + self-access)
    - `users_agency_isolation_select`: View users in same agency
    - `users_self_access_select`: Always view own profile
  - INSERT: `users_prevent_insert` - Blocks all user creation
  - UPDATE: Two-tier access control
    - `users_self_update`: Users can update their profile (not role/agency)
    - `users_admin_update`: Admins can update users in their agency
  - DELETE: `users_admin_delete` - Admins can delete users (not themselves)
- **Testing**: `scripts/test-rls-users.sql` - 12 comprehensive tests

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

### ✅ AC2: RLS Policies Enabled
- **Status**: COMPLETE
- RLS enabled on `agencies` table with 4 policies (SELECT, INSERT, UPDATE, DELETE)
- RLS enabled on `users` table with 6 policies covering all operations
- Multi-policy approach on users table (agency isolation + self-access)
- Test scripts verify all security requirements

### ⏳ AC3-AC4: To Be Implemented in Future Tasks
- AC3: RLS automatic filtering (Story 1.2, Task 5)
- AC4: Bypass prevention (Story 1.2, Task 6)

### ✅ AC5: Version-Controlled Migrations
- **Status**: COMPLETE
- All migrations in version control under `migrations/001_agency_domain/`

## Current Status: Story 1.2 - Tasks 1-4 Complete

### ✅ Completed
- Task 1: Database schema design with tenant isolation
- Task 2: Migration files for agencies and users tables
- Task 3: RLS policies on agencies table
- Task 4: RLS policies on users table (JUST COMPLETED)
  - Migration 004: `migrations/001_agency_domain/004_users_rls.sql`
  - Test script: `scripts/test-rls-users.sql`
  - 6 comprehensive policies covering SELECT, INSERT, UPDATE, DELETE
  - Multi-policy approach for flexible access control

### 📋 Next Steps
- Task 5: Implement agency_id context setting mechanism
- Task 6: Test RLS bypass prevention

### ⚠️ Docker Requirement
**Important**: Supabase local development requires Docker to be installed and running. The migrations and test scripts are ready but require Docker to run:

- Starting local Supabase (`npx supabase start`)
- Applying migrations (`npx supabase db reset`)
- Running tests (`psql ... -f scripts/test-rls-users.sql`)
- Accessing Supabase Studio (http://localhost:54323)

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

# Verify RLS is enabled
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('agencies', 'users');"

# List all RLS policies
psql postgresql://postgres:postgres@localhost:54322/postgres -c "SELECT schemaname, tablename, policyname, cmd FROM pg_policies WHERE tablename IN ('agencies', 'users') ORDER BY tablename, cmd, policyname;"
```

### Running RLS Tests

```bash
# Test agencies RLS policies (8 tests)
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-agencies.sql

# Test users RLS policies (12 tests)
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/test-rls-users.sql

# Verify RLS policies (quick check)
psql postgresql://postgres:postgres@localhost:54322/postgres -f supabase/scripts/verify-rls-agencies.sql
```

## Migration Organization

Following **ADR-003: Domain-Driven Migration Organization**, migrations are organized by domain:

```
supabase/migrations/
├── 001_agency_domain/          # Current (Story 1.2) - Complete
│   ├── 001_agencies_schema.sql      # Agencies table
│   ├── 002_users_schema.sql         # Users table
│   ├── 003_agency_rls.sql           # Agencies RLS policies
│   └── 004_users_rls.sql            # Users RLS policies
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
