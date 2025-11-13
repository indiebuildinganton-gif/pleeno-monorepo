# Task 4: Set Up Supabase PostgreSQL Database

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 1

## Objective

Initialize Supabase for local development with PostgreSQL database and set up domain-driven migration structure.

## Context

Supabase provides PostgreSQL with Row-Level Security (RLS) for multi-tenancy. This task sets up the local development environment using Docker and establishes the migration structure for future schema development.

## Prerequisites

- Task 1 completed (Turborepo monorepo initialized)
- Docker Desktop installed and running
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Verify Docker is Running

```bash
docker --version
# Should show Docker version

docker ps
# Should connect successfully (empty list is OK)
```

**If Docker is not installed:**
- Download and install Docker Desktop from https://www.docker.com/products/docker-desktop
- Start Docker Desktop
- Wait for Docker to be fully running

### 2. Create Supabase Directory

```bash
mkdir -p supabase
cd supabase
```

### 3. Initialize Supabase

```bash
npx supabase init
```

This creates:
- `supabase/config.toml` - Supabase configuration
- `supabase/seed.sql` - Seed data (optional)

### 4. Start Local Supabase

```bash
npx supabase start
```

**This will:**
- Download Supabase Docker images (first time only, ~1GB)
- Start PostgreSQL, PostgREST, GoTrue, Storage, and other services
- Output connection details including:
  - API URL
  - API Keys (anon key, service role key)
  - Database URL
  - Studio URL (local Supabase dashboard)

**Important:** Save these connection details - you'll need them for environment variables.

### 5. Create Domain-Driven Migration Structure

```bash
mkdir -p migrations/001_agency_domain
mkdir -p migrations/002_entities_domain
mkdir -p migrations/003_payments_domain
mkdir -p migrations/004_reports_domain
mkdir -p migrations/000_foundation
```

### 6. Create Foundation Migration Placeholder

Create `migrations/000_foundation/00000000000000_initial_setup.sql`:

```sql
-- Foundation migration
-- This will be populated in Story 1.2 with:
-- - Multi-tenant schema setup
-- - Core tables (agencies, users, roles)
-- - Row-Level Security policies
-- - Audit triggers

-- Placeholder for initial setup
SELECT 'Foundation schema will be created in Story 1.2' as message;
```

### 7. Configure Supabase Settings

Edit `supabase/config.toml` to customize settings:

```toml
# Project name
project_id = "pleeno-local"

[db]
port = 54322
major_version = 15

[api]
enabled = true
port = 54321
schemas = ["public"]

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/**"]
jwt_expiry = 3600

[auth.external.google]
enabled = false

[studio]
enabled = true
port = 54323
```

### 8. Verify Supabase is Running

```bash
npx supabase status
```

Should show all services running:
- PostgreSQL
- PostgREST (API)
- GoTrue (Auth)
- Storage
- Studio

### 9. Access Supabase Studio

Open your browser to the Studio URL (typically http://localhost:54323)

You should see:
- Database tables
- Authentication users
- Storage buckets
- SQL Editor

### 10. Test Database Connection

Create a test migration to verify everything works:

```bash
npx supabase migration new test_connection
```

Edit the generated migration file and add:

```sql
-- Test connection
CREATE TABLE IF NOT EXISTS test_table (
  id SERIAL PRIMARY KEY,
  message TEXT
);

INSERT INTO test_table (message) VALUES ('Supabase connection successful!');
```

Apply the migration:

```bash
npx supabase db reset
```

Verify in Supabase Studio that `test_table` exists with the test row.

Then delete the test migration:

```bash
# Delete the test migration file
rm supabase/migrations/*_test_connection.sql

# Reset database
npx supabase db reset
```

## Verification Steps

1. **Verify Docker containers are running:**
   ```bash
   docker ps
   # Should show multiple Supabase containers (postgres, api, auth, etc.)
   ```

2. **Verify Supabase status:**
   ```bash
   npx supabase status
   # Should show all services with status "running"
   ```

3. **Verify Studio access:**
   - Open http://localhost:54323
   - Should load Supabase Studio interface

4. **Verify database connection from PostgreSQL client:**
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres
   # Password: postgres (default)
   # Should connect successfully
   ```

5. **Verify migration structure:**
   ```bash
   ls -la supabase/migrations/
   # Should show domain folders: 000_foundation, 001_agency_domain, etc.
   ```

## Success Criteria

- [ ] Docker installed and running
- [ ] Supabase initialized with `npx supabase init`
- [ ] Local Supabase started with `npx supabase start`
- [ ] All Supabase services running (verified with `npx supabase status`)
- [ ] Domain-driven migration folder structure created
- [ ] Foundation migration placeholder created
- [ ] Supabase Studio accessible at http://localhost:54323
- [ ] Database connection verified

## Environment Variables to Save

After starting Supabase, save these values (from `npx supabase status` output):

```
API URL: http://localhost:54321
Anon Key: eyJh... (long JWT token)
Service Role Key: eyJh... (long JWT token)
Database URL: postgresql://postgres:postgres@localhost:54322/postgres
Studio URL: http://localhost:54323
```

You'll need these for the next task (Configure Environment Variables).

## Common Issues

**Issue:** Docker not running
- **Solution:** Start Docker Desktop and wait for it to fully initialize

**Issue:** Port already in use (54321, 54322, 54323)
- **Solution:** Stop other services using these ports or configure different ports in `config.toml`

**Issue:** Supabase containers won't start
- **Solution:** Run `npx supabase stop` then `npx supabase start` again

**Issue:** Permission denied on Docker
- **Solution:** Add your user to docker group or run with sudo (not recommended)

## Stopping Supabase

When you're done developing:

```bash
npx supabase stop
```

To completely remove Supabase containers and data:

```bash
npx supabase stop --no-backup
```

## Architecture References

- **Source:** docs/architecture.md - Project Initialization
- **Source:** docs/architecture.md - ADR-002: Supabase with PostgreSQL RLS
- **Source:** docs/PRD.md - Multi-Tenancy Architecture

## Next Task

After completing this task, proceed to **Task 5: Configure Environment Variables**
