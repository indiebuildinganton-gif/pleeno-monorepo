# Story 5-1: Automated Status Detection Job - Task 9

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 9: Migration File Creation

### Description
Consolidate all database changes from previous tasks into a single, cohesive migration file. This migration sets up the complete jobs infrastructure: extensions, tables, functions, and scheduled jobs.

### Implementation Checklist
- [ ] Create migration file: `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql`
- [ ] Include pg_cron extension installation
- [ ] Include http extension installation (for HTTP requests)
- [ ] Include jobs_log table creation (from Task 2)
- [ ] Include update_installment_statuses() function (from Task 1)
- [ ] Include agency table updates (from Task 6): timezone, cutoff_time, due_soon_threshold_days
- [ ] Include pg_cron job schedule configuration (from Task 4)
- [ ] Include alert trigger setup (from Task 8)
- [ ] Add migration comments explaining each section
- [ ] Test migration on local Supabase instance
- [ ] Verify rollback procedure

### Acceptance Criteria
All acceptance criteria are satisfied by this migration:
- AC 1: Automated Status Detection (Function + Agency fields)
- AC 2: Scheduled Execution (pg_cron schedule)
- AC 3: Execution Logging and Monitoring (jobs_log table + alert trigger)
- AC 4: Reliability and Error Handling (Function implements atomicity)
- AC 5: Security and Access Control (RLS policies, API key in settings)

### Migration File Structure

**File: `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql`**

```sql
-- =====================================================
-- Migration: Jobs Infrastructure for Status Automation
-- Epic: 5 - Intelligent Status Automation
-- Story: 5.1 - Automated Status Detection Job
-- =====================================================

-- This migration sets up the infrastructure for automated
-- background jobs, starting with the status update job that
-- marks overdue installments daily at 7:00 AM UTC.

-- =====================================================
-- SECTION 1: Extensions
-- =====================================================

-- Enable pg_cron for job scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;
COMMENT ON EXTENSION pg_cron IS 'PostgreSQL-native job scheduler for automated tasks';

-- Enable http extension for making HTTP requests to Edge Functions
CREATE EXTENSION IF NOT EXISTS http;
COMMENT ON EXTENSION http IS 'Allows PostgreSQL to make HTTP requests via net.http_post()';

-- =====================================================
-- SECTION 2: Jobs Log Table
-- =====================================================

-- Table to track all job executions
CREATE TABLE jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  records_updated INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add comments
COMMENT ON TABLE jobs_log IS 'Tracks execution of automated jobs (status updates, notifications, etc.)';
COMMENT ON COLUMN jobs_log.job_name IS 'Name of the job (e.g., update-installment-statuses)';
COMMENT ON COLUMN jobs_log.metadata IS 'Job-specific results, e.g., agency-level update counts';

-- Create indexes for efficient querying
CREATE INDEX idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC);
CREATE INDEX idx_jobs_log_status ON jobs_log(status) WHERE status = 'failed';

-- Enable RLS
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Admin-only access
CREATE POLICY "Admin users can view all job logs"
  ON jobs_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Service role can insert job logs"
  ON jobs_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update job logs"
  ON jobs_log
  FOR UPDATE
  TO service_role
  USING (true);

-- =====================================================
-- SECTION 3: Agency Configuration Fields
-- =====================================================

-- Add timezone and cutoff time fields to agencies table
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Australia/Brisbane',
ADD COLUMN IF NOT EXISTS overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add constraints
ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  'Australia/Brisbane', 'Australia/Sydney', 'Australia/Melbourne',
  'Australia/Perth', 'Australia/Adelaide', 'America/Los_Angeles',
  'America/New_York', 'America/Chicago', 'Europe/London',
  'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore',
  'Pacific/Auckland', 'UTC'
));

ALTER TABLE agencies
ADD CONSTRAINT agencies_cutoff_time_check
CHECK (overdue_cutoff_time BETWEEN '00:00:00' AND '23:59:59');

ALTER TABLE agencies
ADD CONSTRAINT agencies_due_soon_days_check
CHECK (due_soon_threshold_days BETWEEN 1 AND 30);

-- Add comments
COMMENT ON COLUMN agencies.timezone IS 'IANA timezone name for agency location';
COMMENT ON COLUMN agencies.overdue_cutoff_time IS 'Time of day when pending installments become overdue (default 5:00 PM)';
COMMENT ON COLUMN agencies.due_soon_threshold_days IS 'Days before due date to flag as "due soon"';

-- =====================================================
-- SECTION 4: Status Update Function
-- =====================================================

CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_record RECORD;
  current_time_in_zone TIMESTAMPTZ;
  updated_count INT;
BEGIN
  -- Loop through each agency
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    -- Get current time in agency's timezone
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments past due date or past cutoff time today
    WITH updated AS (
      UPDATE installments i
      SET status = 'overdue'
      FROM payment_plans pp
      WHERE i.payment_plan_id = pp.id
        AND pp.agency_id = agency_record.id
        AND pp.status = 'active'
        AND i.status = 'pending'
        AND (
          i.student_due_date < CURRENT_DATE
          OR (
            i.student_due_date = CURRENT_DATE
            AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
          )
        )
      RETURNING i.id
    )
    SELECT count(*) INTO updated_count FROM updated;

    -- Return results for this agency
    RETURN QUERY SELECT
      agency_record.id,
      updated_count,
      jsonb_build_object('pending_to_overdue', updated_count);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION update_installment_statuses IS 'Updates installment statuses to overdue based on due dates and agency timezones';

-- =====================================================
-- SECTION 5: Alert Trigger
-- =====================================================

-- Function to send notification on job failure
CREATE OR REPLACE FUNCTION notify_job_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'failed' AND NEW.job_name = 'update-installment-statuses' THEN
    -- Send notification via pg_notify
    PERFORM pg_notify(
      'job_failure',
      json_build_object(
        'job_name', NEW.job_name,
        'started_at', NEW.started_at,
        'error_message', NEW.error_message
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER trigger_notify_job_failure
AFTER INSERT OR UPDATE ON jobs_log
FOR EACH ROW
EXECUTE FUNCTION notify_job_failure();

-- =====================================================
-- SECTION 6: API Key Configuration
-- =====================================================

-- Store API key as PostgreSQL custom setting
-- IMPORTANT: Replace 'your-api-key-here' with actual generated key
-- See Task 5 for API key generation instructions
ALTER DATABASE postgres SET app.supabase_function_key = 'your-api-key-here';

COMMENT ON DATABASE postgres IS 'API key stored in app.supabase_function_key setting for Edge Function authentication';

-- =====================================================
-- SECTION 7: pg_cron Schedule
-- =====================================================

-- Schedule daily job at 7:00 AM UTC (5:00 PM Brisbane time)
-- IMPORTANT: Replace <project-ref> with actual Supabase project reference
-- Find at: Supabase Dashboard > Settings > API > Project URL
SELECT cron.schedule(
  'update-installment-statuses-daily',
  '0 7 * * *',  -- 7:00 AM UTC daily
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', current_setting('app.supabase_function_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =====================================================
-- END OF MIGRATION
-- =====================================================

-- Verification queries:

-- Check extensions
-- SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'http');

-- Check jobs_log table
-- SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 5;

-- Check agency fields
-- SELECT id, name, timezone, overdue_cutoff_time FROM agencies LIMIT 5;

-- Check pg_cron job
-- SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';

-- Test function manually
-- SELECT * FROM update_installment_statuses();
```

### Pre-Deployment Checklist

Before applying this migration:

1. **Replace placeholders:**
   - [ ] Replace `<project-ref>` with actual Supabase project reference
   - [ ] Replace `your-api-key-here` with actual generated API key (from Task 5)

2. **Verify dependencies:**
   - [ ] Edge Function `update-installment-statuses` is deployed
   - [ ] API key is generated and stored in Supabase secrets

3. **Backup database:**
   - [ ] Take database snapshot before migration
   - [ ] Document current state

### Testing the Migration

**Step 1: Apply Migration Locally**

```bash
# Start local Supabase
supabase start

# Apply migration
supabase db push

# Verify tables and functions created
psql -h localhost -p 54322 -U postgres -d postgres \
  -c "SELECT * FROM cron.job;"
```

**Step 2: Test Function**

```sql
-- Insert test data
-- (See Task 7 for test data setup)

-- Run function
SELECT * FROM update_installment_statuses();

-- Verify results
SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 1;
```

**Step 3: Test pg_cron Schedule**

```sql
-- Manually trigger scheduled SQL
SELECT net.http_post(
  url := 'http://localhost:54321/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);

-- Check jobs_log for execution
SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 1;
```

### Rollback Procedure

**File: `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.down.sql`**

```sql
-- Rollback migration: Remove all jobs infrastructure

-- Unschedule cron job
SELECT cron.unschedule('update-installment-statuses-daily');

-- Drop trigger and function
DROP TRIGGER IF EXISTS trigger_notify_job_failure ON jobs_log;
DROP FUNCTION IF EXISTS notify_job_failure();

-- Drop status update function
DROP FUNCTION IF EXISTS update_installment_statuses();

-- Remove agency fields
ALTER TABLE agencies
DROP COLUMN IF EXISTS due_soon_threshold_days,
DROP COLUMN IF EXISTS overdue_cutoff_time,
DROP COLUMN IF EXISTS timezone;

-- Drop jobs_log table
DROP TABLE IF EXISTS jobs_log;

-- Drop extensions (optional, may be used by other features)
-- DROP EXTENSION IF EXISTS http;
-- DROP EXTENSION IF EXISTS pg_cron;

-- Remove API key setting
ALTER DATABASE postgres RESET app.supabase_function_key;
```

### Deployment to Production

```bash
# Step 1: Deploy Edge Function
supabase functions deploy update-installment-statuses

# Step 2: Set API key secret
supabase secrets set SUPABASE_FUNCTION_KEY="<generated-key>"

# Step 3: Update migration with production values
# Edit migration file:
# - Replace <project-ref> with production project reference
# - Replace your-api-key-here with actual API key

# Step 4: Apply migration
supabase db push

# Step 5: Verify
supabase sql --db-url <production-db-url> \
  --file supabase/migrations/004_notifications_domain/verify.sql
```

**File: `supabase/migrations/004_notifications_domain/verify.sql`**

```sql
-- Verification queries for production deployment

-- 1. Check extensions
SELECT extname, extversion FROM pg_extension WHERE extname IN ('pg_cron', 'http');

-- 2. Check jobs_log table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'jobs_log';

-- 3. Check agency fields added
SELECT column_name FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days');

-- 4. Check function exists
SELECT routine_name FROM information_schema.routines
WHERE routine_name = 'update_installment_statuses';

-- 5. Check pg_cron job scheduled
SELECT jobname, schedule FROM cron.job WHERE jobname = 'update-installment-statuses-daily';

-- Expected: All queries return results
```

---

## Implementation Notes

### Migration Best Practices

**Idempotency:**
- Use `CREATE TABLE IF NOT EXISTS`
- Use `ALTER TABLE ADD COLUMN IF NOT EXISTS`
- Use `CREATE OR REPLACE FUNCTION`

**Comments:**
- Document purpose of each section
- Explain complex logic
- Reference story/epic numbers

**Verification:**
- Include verification queries in comments
- Create separate verify.sql file
- Test locally before production

### Migration Naming Convention

Format: `{sequence}_{domain}_{description}.sql`

- `004`: Migration sequence number (Epic number)
- `notifications_domain`: Domain/module name
- `001_jobs_infrastructure`: Specific feature

### Common Migration Issues

**Issue 1: pg_cron extension requires superuser**

Solution: Contact Supabase support or use Supabase Dashboard to enable extension.

**Issue 2: API key exposed in migration**

Solution: Use placeholder, replace during deployment, never commit actual key to git.

**Issue 3: Project reference changes between environments**

Solution: Use environment-specific migration files or post-migration update script.

---

## Next Steps

1. Create migration file with all sections
2. Replace placeholders with actual values (project-ref, API key)
3. Create rollback migration file
4. Test migration on local Supabase
5. Verify all components work together
6. Create verification SQL file
7. When Task 9 is complete:
   - Update `MANIFEST.md`: Set Task 9 status to "Completed" with completion date
   - Add migration file path to "Files Created"
   - Add test results to implementation notes
   - Move to `task-10-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
