# Story 5-1: Automated Status Detection Job - Task 4

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 4: Configure pg_cron Schedule

### Description
Set up pg_cron extension to automatically invoke the Edge Function from Task 3 at 7:00 AM UTC daily (5:00 PM Brisbane time). This provides PostgreSQL-native job scheduling integrated with Supabase.

### Implementation Checklist
- [ ] Enable pg_cron extension: `CREATE EXTENSION IF NOT EXISTS pg_cron`
- [ ] Configure pg_cron to invoke Edge Function via HTTP POST
- [ ] Schedule job with cron expression: `0 7 * * *` (7:00 AM UTC daily)
- [ ] Use `net.http_post()` extension for HTTP requests from PostgreSQL
- [ ] Pass API key in X-API-Key header
- [ ] Store API key in PostgreSQL configuration setting
- [ ] Test cron job manually before scheduling
- [ ] Verify cron job appears in `cron.job` table
- [ ] Document how to view/manage scheduled jobs

### Acceptance Criteria
- **AC 2**: Scheduled Execution
  - The system is operational
  - When the scheduled time arrives (7:00 AM UTC = 5:00 PM Brisbane time)
  - Then the job runs automatically every day at this time
  - And the job executes via Supabase Edge Function invoked by pg_cron
  - And the cron schedule is: `0 7 * * *` (daily at 7:00 AM UTC)

### Key Constraints
- Extension Requirements: Requires both pg_cron and http (for net.http_post)
- URL Format: Must use full Supabase Edge Function URL with project reference
- API Key Storage: Use PostgreSQL custom setting (app.supabase_function_key)
- Cron Expression: `0 7 * * *` = every day at 7:00 AM UTC
- Error Handling: pg_cron will log failures, but doesn't retry automatically

### SQL Implementation

**Enable Extensions:**

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable http extension for making HTTP requests
CREATE EXTENSION IF NOT EXISTS http;
```

**Configure API Key:**

```sql
-- Store API key as custom PostgreSQL setting
-- This will be replaced with actual key value in production
ALTER DATABASE postgres SET app.supabase_function_key = 'your-api-key-here';
```

**Schedule Job:**

```sql
-- Schedule daily job at 7:00 AM UTC
SELECT cron.schedule(
  'update-installment-statuses-daily',  -- Job name
  '0 7 * * *',                          -- Cron expression: 7:00 AM UTC daily
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
```

**Note:** Replace `<project-ref>` with actual Supabase project reference.

### Cron Expression Breakdown

`0 7 * * *` means:
- `0` - Minute (0 = at the start of the hour)
- `7` - Hour (7 = 7:00 AM UTC)
- `*` - Day of month (every day)
- `*` - Month (every month)
- `*` - Day of week (every day of week)

Result: Runs every day at 7:00 AM UTC (5:00 PM Brisbane AEST/6:00 PM AEDT)

### Managing Scheduled Jobs

**View all scheduled jobs:**

```sql
SELECT * FROM cron.job;
```

**View job run history:**

```sql
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC
LIMIT 10;
```

**Unschedule a job:**

```sql
SELECT cron.unschedule('update-installment-statuses-daily');
```

**Manually trigger job (for testing):**

```sql
-- Execute the same SQL that pg_cron will run
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS request_id;
```

### Dependencies
- PostgreSQL extensions: `pg_cron`, `http`
- Supabase Edge Function from Task 3
- API key from Task 5

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) Pattern 3: Automated Status State Machine
- pg_cron documentation: https://github.com/citusdata/pg_cron

### Testing Approach

**Test 1: Manual Execution**

```sql
-- Test HTTP request manually
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);

-- Check jobs_log table for execution record
SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 1;
```

**Test 2: Schedule Verification**

```sql
-- Verify job is scheduled
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

-- Should return 1 row with:
-- schedule: '0 7 * * *'
-- command: Contains http_post call
```

**Test 3: Cron Execution Monitoring**

```sql
-- Wait for scheduled time, then check run history
SELECT
  jobid,
  runid,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC
LIMIT 5;
```

---

## Implementation Notes

### Supabase-Specific Considerations

**Project Reference:**
- Find your project reference in Supabase Dashboard > Settings > API
- Format: `https://<project-ref>.supabase.co`
- Example: `https://abcdefghijklmnop.supabase.co`

**pg_cron in Supabase:**
- Already installed on Supabase Postgres instances
- Runs as `postgres` user (superuser privileges)
- Logs stored in `cron.job_run_details` table

**HTTP Extension:**
- Supabase includes `http` extension for making HTTP requests
- Alternative: `pg_net` extension (newer, async)
- Both work for this use case

### Timezone Considerations

**Why 7:00 AM UTC?**
- Brisbane (Australia/Brisbane) is UTC+10 (AEST) or UTC+11 (AEDT during daylight saving)
- 7:00 AM UTC = 5:00 PM Brisbane AEST
- Chosen to run at end of business day (5:00 PM default cutoff time)

**Alternative Schedules:**
- For different timezone targeting, adjust hour value
- Example: `0 22 * * *` = 10:00 PM UTC = 8:00 AM Brisbane next day

### Security

**API Key Storage:**
- Stored as PostgreSQL custom setting
- Only accessible to database owner/superuser
- Not exposed in pg_cron job listing
- Retrieved dynamically via `current_setting()`

**Network Access:**
- pg_cron runs inside database
- Requires network access to Edge Function endpoint
- Supabase allows internal communication

### Troubleshooting

**Job not running?**
1. Check if scheduled: `SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily'`
2. Check run history: `SELECT * FROM cron.job_run_details ORDER BY start_time DESC`
3. Test manual execution with same SQL
4. Verify API key is set: `SELECT current_setting('app.supabase_function_key')`

**HTTP request failing?**
1. Verify Edge Function is deployed: `supabase functions list`
2. Test Edge Function directly with curl
3. Check API key matches between pg_cron and Edge Function
4. Review Edge Function logs in Supabase Dashboard

---

## Next Steps

1. Enable pg_cron and http extensions
2. Configure API key setting (use placeholder, will be updated in Task 5)
3. Schedule the cron job
4. Test manual execution
5. Verify job appears in cron.job table
6. When Task 4 is complete:
   - Update `MANIFEST.md`: Set Task 4 status to "Completed" with completion date
   - Add SQL migration content to "Files Created"
   - Add any implementation notes
   - Move to `task-05-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
