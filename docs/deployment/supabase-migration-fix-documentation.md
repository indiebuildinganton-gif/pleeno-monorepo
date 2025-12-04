# Supabase Migration and Deployment Fix Documentation

## Problem Summary
**Date**: December 4, 2024

The local Supabase instance was failing to start due to PostgreSQL version incompatibility and multiple migration file errors. The deployment script to UAT was also failing due to authentication and project configuration issues.

### Key Error Messages
1. **PostgreSQL Version Incompatibility**:
   ```
   FATAL: database files are incompatible with server
   DETAIL: The data directory was initialized by PostgreSQL version 15, which is not compatible with this version 17.6.
   ```

2. **Migration Errors**:
   - `ERROR: schema "cron" does not exist`
   - `ERROR: relation "user_roles" does not exist`
   - `ERROR: relation "email_templates" does not exist`
   - `ERROR: cannot change return type of existing function`

3. **Authentication Error**:
   ```
   Access token not provided. Supply an access token by running supabase login
   Your account does not have the necessary privileges to access this endpoint
   ```

## Root Causes

### 1. PostgreSQL Version Mismatch
- Local database was initialized with PostgreSQL 15
- Docker container was trying to use PostgreSQL 17.6
- Docker volume contained incompatible data

### 2. Migration File Issues
Multiple migration files had structural problems:
- **Rollback code at wrong position**: Migration file `20241204000005_004_notifications_domain.sql` had rollback/down migration code at the beginning
- **Missing table references**: Code referenced `user_roles` table that didn't exist (should use `users` table)
- **Foreign key ordering**: Tables referenced before they were created
- **Function redefinition**: Functions being recreated with different return types without dropping first

### 3. Project Configuration
- Deployment script had wrong UAT project ID (`xycdzvqwnifhttjckvpb` instead of `ccmciliwfdtdspdlkuos`)
- Supabase CLI needed authentication
- Access token wasn't being passed correctly

## Solution Steps

### Phase 1: Fix PostgreSQL Version Issue

1. **Stop Supabase completely**:
   ```bash
   npx supabase stop
   ```

2. **Remove old PostgreSQL data volume**:
   ```bash
   docker volume rm supabase_db_pleeno-local
   ```

3. **Restart Supabase** (will recreate volume with PostgreSQL 17.6):
   ```bash
   npx supabase start
   ```

### Phase 2: Fix Migration Files

#### Issue 1: Rollback Code at Beginning
**File**: `supabase/migrations/20241204000005_004_notifications_domain.sql`

The file started with rollback code (lines 1-116) that tried to use `cron.unschedule` before the cron extension was created.

**Fix**: Remove the rollback section from the beginning:
```bash
# Extract correct content starting from line 117
tail -n +117 supabase/migrations/20241204000005_004_notifications_domain.sql > temp.sql
mv supabase/migrations/20241204000005_004_notifications_domain.sql supabase/migrations/20241204000005_004_notifications_domain_broken.sql
mv temp.sql supabase/migrations/20241204000005_004_notifications_domain.sql
```

#### Issue 2: Fix user_roles Reference
**Original problematic code**:
```sql
SELECT 1 FROM user_roles
WHERE user_roles.user_id = auth.uid()
  AND user_roles.role = 'admin'
```

**Fixed to**:
```sql
SELECT 1 FROM users
WHERE users.id = auth.uid()
  AND users.role = 'agency_admin'
```

#### Issue 3: Fix Foreign Key Ordering
**Problem**: `notification_rules` table referenced `email_templates` before it was created.

**Solution**:
1. Remove foreign key from initial table creation
2. Add foreign key constraint after `email_templates` table is created

```sql
-- Initial creation without foreign key
template_id UUID, -- Foreign key will be added after email_templates is created

-- Later, after email_templates is created
ALTER TABLE notification_rules
  ADD CONSTRAINT fk_notification_rules_template
  FOREIGN KEY (template_id)
  REFERENCES email_templates(id)
  ON DELETE SET NULL;
```

#### Issue 4: Fix Function Redefinition
**File**: `supabase/migrations/20241204000006_004_reports_domain.sql`

**Added DROP statement before recreation**:
```sql
-- Drop the existing function first to change the return type
DROP FUNCTION IF EXISTS update_installment_statuses();

CREATE OR REPLACE FUNCTION update_installment_statuses()
```

### Phase 3: Fix Authentication and Project Configuration

1. **Authenticate with Supabase CLI**:
   ```bash
   npx supabase login
   ```
   Follow the browser link and enter the verification code when prompted.

2. **Update deployment script with correct project ID**:
   ```bash
   sed -i '' 's/xycdzvqwnifhttjckvpb/ccmciliwfdtdspdlkuos/g' scripts/deploy-local-to-uat-improved.sh
   ```

3. **Set environment variables and run deployment**:
   ```bash
   export SUPABASE_ACCESS_TOKEN=sbp_b1d0bbda96e96c2482e3adaf49958645f944f2f3
   export SUPABASE_UAT_PROJECT_ID=ccmciliwfdtdspdlkuos
   ./scripts/deploy-local-to-uat-improved.sh
   ```

## Final Working Configuration

### Environment Variables
```bash
SUPABASE_ACCESS_TOKEN=sbp_b1d0bbda96e96c2482e3adaf49958645f944f2f3
SUPABASE_UAT_PROJECT_ID=ccmciliwfdtdspdlkuos
SUPABASE_DATABASE_PASSWORD=hh8tP8TL2pQhCSst
```

### Project Details
- **UAT Project Name**: pleeno-uat
- **Project ID**: ccmciliwfdtdspdlkuos
- **Region**: Oceania (Sydney)
- **URL**: https://ccmciliwfdtdspdlkuos.supabase.co

### Verified Working Commands
```bash
# List accessible projects
export SUPABASE_ACCESS_TOKEN=sbp_b1d0bbda96e96c2482e3adaf49958645f944f2f3
npx supabase projects list

# Link to UAT project
npx supabase link --project-ref ccmciliwfdtdspdlkuos --password hh8tP8TL2pQhCSst

# Run deployment script
./scripts/deploy-local-to-uat-improved.sh
```

## Key Learnings

1. **PostgreSQL Version Compatibility**: Always ensure Docker volumes are compatible with the container's PostgreSQL version. When upgrading, remove old volumes.

2. **Migration File Structure**:
   - Never include rollback code at the beginning of a migration
   - Ensure extensions are created before using them
   - Check table references match actual schema
   - Add DROP statements when changing function signatures

3. **Foreign Key Dependencies**: Create tables in dependency order or add foreign keys after all tables exist.

4. **Authentication Flow**:
   - Supabase CLI requires authentication for remote operations
   - Access tokens can be set via environment variable or login command
   - Project IDs must match exactly with what's in your Supabase account

5. **Debugging Approach**:
   - Check Docker container health first
   - Examine migration files for structural issues
   - Verify authentication and permissions
   - Ensure project configuration matches actual projects

## Cleanup Tasks Performed

1. Removed broken migration backup: `rm supabase/migrations/20241204000005_004_notifications_domain_broken.sql`
2. Removed old PostgreSQL data volume
3. Fixed all migration files in place

## Success Indicators

✅ Local Supabase starts without errors
✅ All migrations apply cleanly
✅ Database seeds successfully
✅ Deployment script links to UAT project
✅ No PostgreSQL version conflicts
✅ No missing table/function references

## Future Prevention

1. **Version Management**: Document PostgreSQL version in project README
2. **Migration Testing**: Test migrations on fresh database before committing
3. **Environment Documentation**: Keep `.env.example` updated with required variables
4. **Script Validation**: Add validation checks in deployment scripts for required environment variables
5. **Regular Cleanup**: Periodically clean Docker volumes to prevent version conflicts

## Final Status

The deployment script now successfully:
- Connects to local Supabase (PostgreSQL 17.6)
- Generates migrations (currently in sync)
- Links to UAT project (pleeno-uat)
- Offers deployment options (preview, incremental, reset)

The system is now fully operational and ready for deployments to UAT environment.