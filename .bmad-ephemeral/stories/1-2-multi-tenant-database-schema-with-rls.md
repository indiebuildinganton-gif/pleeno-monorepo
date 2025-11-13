# Story 1.2: Multi-Tenant Database Schema with RLS

Status: ready-for-dev

## Story

As a **system architect**,
I want **a database schema with Row-Level Security policies enforcing data isolation**,
so that **each agency's data is automatically isolated at the database level without application-layer checks**.

## Acceptance Criteria

1. **Given** the project infrastructure is initialized, **When** I implement the multi-tenant database schema, **Then** the database has a clear tenant isolation model using agency_id as the tenant key

2. **And** RLS policies are enabled on all tables containing tenant data

3. **And** RLS policies automatically filter queries to the current user's agency_id

4. **And** no application code can bypass RLS protections

5. **And** database migrations are version-controlled and repeatable

## Tasks / Subtasks

- [ ] Design multi-tenant database schema with agency_id isolation (AC: 1)
  - [ ] Create agencies table with id (UUID), name, contact details, settings
  - [ ] Create users table with id (UUID), agency_id (FK), email, role, auth metadata
  - [ ] Define foreign key relationships ensuring referential integrity
  - [ ] Document schema design decisions

- [ ] Set up Supabase database migrations infrastructure (AC: 5)
  - [ ] Initialize Supabase CLI and migration system
  - [ ] Create migration file structure following domain-driven organization
  - [ ] Configure migration naming convention (timestamp + description)
  - [ ] Test migration rollback capability

- [ ] Implement Row-Level Security policies on agencies table (AC: 2, 3)
  - [ ] Enable RLS on agencies table: `ALTER TABLE agencies ENABLE ROW LEVEL SECURITY`
  - [ ] Create policy for agency isolation: `CREATE POLICY agency_isolation ON agencies USING (id = current_setting('app.current_agency_id')::uuid)`
  - [ ] Test policy with different agency contexts
  - [ ] Verify policy cannot be bypassed

- [ ] Implement Row-Level Security policies on users table (AC: 2, 3)
  - [ ] Enable RLS on users table
  - [ ] Create policy: `CREATE POLICY user_agency_isolation ON users USING (agency_id = current_setting('app.current_agency_id')::uuid)`
  - [ ] Create policy for user self-access: allow users to read their own profile
  - [ ] Test policies with multiple user contexts

- [ ] Implement agency_id context setting mechanism (AC: 3)
  - [ ] Create database function to set current agency context from JWT claims
  - [ ] Implement middleware to extract agency_id from Supabase JWT token
  - [ ] Set PostgreSQL session variable: `SET LOCAL app.current_agency_id = '<uuid>'`
  - [ ] Verify context is set correctly on each request

- [ ] Create comprehensive RLS test suite (AC: 4)
  - [ ] Test: User A cannot read User B's data when from different agencies
  - [ ] Test: User A cannot read Agency B's data
  - [ ] Test: Direct SQL queries respect RLS (even with SUPERUSER bypass attempt)
  - [ ] Test: Agency Admin can read all users in their agency
  - [ ] Document test results and RLS validation

- [ ] Write database migration scripts (AC: 5)
  - [ ] Migration 001: Create agencies table with constraints
  - [ ] Migration 002: Create users table with agency_id FK
  - [ ] Migration 003: Enable RLS and create policies for agencies
  - [ ] Migration 004: Enable RLS and create policies for users
  - [ ] Migration 005: Create helper functions for context setting

- [ ] Document multi-tenant architecture patterns (AC: 1, 4)
  - [ ] Document RLS policy patterns for future tables
  - [ ] Create migration template for new tenant-scoped tables
  - [ ] Document agency_id context setting process
  - [ ] Add security testing guidelines for new features

## Dev Notes

### Multi-Tenant Architecture Pattern

**Tenant Isolation Strategy:**
- **Tenant Key**: `agency_id` (UUID) used across all tenant-scoped tables
- **Isolation Layer**: PostgreSQL Row-Level Security (RLS) at database level
- **Context Propagation**: JWT claims → Session variable → RLS policies

**RLS Policy Pattern (Template for Future Tables):**
```sql
-- Enable RLS
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;

-- Create isolation policy
CREATE POLICY {table_name}_agency_isolation
ON {table_name}
USING (agency_id = current_setting('app.current_agency_id')::uuid);

-- Additional policies for specific access patterns (e.g., user self-access)
CREATE POLICY {table_name}_user_self_access
ON {table_name}
USING (user_id = auth.uid());
```

### Database Schema Design

**Core Tables:**

**agencies table:**
```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  currency TEXT DEFAULT 'AUD',
  timezone TEXT DEFAULT 'Australia/Brisbane',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**users table:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'agency_user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
```

### Context Setting Mechanism

**JWT Claims Structure (Supabase Auth):**
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "app_metadata": {
    "agency_id": "agency-uuid"
  }
}
```

**Database Function for Context Setting:**
```sql
CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS VOID AS $$
BEGIN
  -- Extract agency_id from JWT claims
  PERFORM set_config(
    'app.current_agency_id',
    COALESCE(
      current_setting('request.jwt.claims', true)::json->>'agency_id',
      ''
    ),
    true  -- true = local to transaction
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Middleware Integration:**
```typescript
// packages/database/src/middleware.ts
export async function setAgencyContext(request: Request) {
  const supabase = createServerClient(request);
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    // Agency ID is stored in user metadata
    const agencyId = session.user.app_metadata.agency_id;

    // Set context in database session
    await supabase.rpc('set_agency_context');
  }
}
```

### Testing Strategy

**RLS Validation Tests:**

1. **Cross-Agency Data Leakage Test:**
   - Create Agency A with User A
   - Create Agency B with User B
   - Authenticate as User A, attempt to query Agency B data
   - **Expected**: Zero rows returned (RLS blocks access)

2. **Direct SQL Bypass Test:**
   - Create test users in different agencies
   - Execute raw SQL: `SELECT * FROM users WHERE agency_id != current_setting('app.current_agency_id')`
   - **Expected**: Empty result set (RLS enforced even for raw queries)

3. **Policy Completeness Test:**
   - Verify all tables with `agency_id` have RLS enabled
   - Check no tables are missing isolation policies
   - **Expected**: No tenant-scoped tables without RLS

4. **Performance Test:**
   - Measure query performance with RLS enabled
   - Compare to baseline queries without RLS
   - **Expected**: Minimal overhead (<5% performance impact)

### Architecture Alignment

**From Architecture Document:**
- Uses Supabase PostgreSQL with domain-driven schema organization (Section: Database to Frontend)
- Follows migration structure: `supabase/migrations/001_agency_domain/`
- Implements RLS as specified in architecture decision table
- Aligns with security requirement: "PostgreSQL Row-Level Security (RLS) enforcing multi-tenant isolation"

**Migration File Organization (Turborepo Monorepo Context):**
```
pleeno-monorepo/
└── supabase/
    └── migrations/
        └── 001_agency_domain/         # Epic 1 migrations
            ├── 001_agencies_schema.sql
            ├── 002_users_schema.sql
            ├── 003_agency_rls.sql
            ├── 004_users_rls.sql
            └── 005_context_functions.sql
```

### Prerequisites Validation

**Dependency on Story 1.1:**
- Requires: Next.js project initialized with Supabase connection configured
- Requires: `.env.local` with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
- Requires: Supabase CLI installed and configured
- Verify: `npx supabase status` returns running local instance

### Security Considerations

**RLS Policy Security:**
- Policies use `SECURITY DEFINER` functions where needed to prevent privilege escalation
- Session variables are scoped to transaction (`true` in `set_config`) to prevent leakage
- JWT claims validation happens at Supabase Auth layer before reaching database

**Bypass Prevention:**
- Service role key should NEVER be exposed to client
- All client requests use anon key with RLS enforcement
- Admin operations use service role key only in secure server contexts

**Audit Trail:**
- All schema changes logged via migration system
- RLS policy changes require new migration (immutable history)
- Future: Audit log table will track data access (Epic 8)

### Project Structure Notes

**Database Migration Location:**
Per architecture document, migrations follow domain-driven organization:
- Location: `supabase/migrations/001_agency_domain/`
- Naming: Sequential numbers + descriptive names
- Version control: All migrations committed to Git

**Shared Database Client (Turborepo Package):**
- Location: `pleeno-monorepo/packages/database/src/`
- Exports: `createClient()`, `createServerClient()`, `setAgencyContext()`
- Types: Generated via `supabase gen types typescript > packages/database/src/types/database.types.ts`
- All zones import from: `@pleeno/database` (shared package)

### References

- [Source: docs/epics.md#Story-1.2-Multi-Tenant-Database-Schema-with-RLS]
- [Source: docs/architecture.md#Multi-Tenancy-Architecture - RLS implementation pattern]
- [Source: docs/architecture.md#Database-Schema-Design - agencies and users tables]
- [Source: docs/architecture.md#Security - RLS policy enforcement]
- [Source: docs/PRD.md#Multi-Tenancy-Architecture - Complete data isolation requirement]
- [Source: docs/PRD.md#Security-Considerations - Zero data leakage between agencies]

### Learnings from Previous Story

**From Story 1.1 (Status: ready-for-dev)**

This story has not yet been implemented, so there are no completion notes or technical debt to address. However, Story 1.1 establishes the foundation this story depends on:

**Expected Outputs from Story 1.1:**
- **Turborepo monorepo initialized** with 6 Next.js 15 zones (shell, dashboard, agency, entities, payments, reports)
- Supabase database instance running locally via Docker
- Environment variables set up (`.env.local` and `.env.example`)
- **Project folder structure:** `apps/`, `packages/`, `supabase/` (NOT flat structure)
- **Development environment:** All zones running on ports 3000-3005
- Shared packages structure: `packages/database`, `packages/ui`, etc.

**Integration Points:**
- This story will create the first database migrations in `supabase/migrations/001_agency_domain/`
- Will add database client utilities to `packages/database/src/` (NOT `/lib`)
- Will extend Supabase configuration started in Story 1.1
- Database package will be imported by all zones as `@pleeno/database`

**Validation Before Starting:**
- Confirm Story 1.1 is fully complete (all tasks checked off)
- Verify Supabase local instance is running: `npx supabase status`
- Verify database connection works from Next.js app

[Source: stories/1-1-project-infrastructure-initialization.md]

## Dev Agent Record

### Context Reference

- [1-2-multi-tenant-database-schema-with-rls.context.xml](.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
