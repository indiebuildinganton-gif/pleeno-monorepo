# pg_cron Job Management Guide

**Story**: 5-1 Automated Status Detection Job - Task 4
**Job Name**: `update-installment-statuses-daily`
**Purpose**: Daily automated detection of overdue installment payments

---

## Quick Reference

### Job Details
- **Schedule**: `0 7 * * *` (7:00 AM UTC daily)
- **Brisbane Time**: 5:00 PM AEST (UTC+10)
- **Target**: Supabase Edge Function `update-installment-statuses`
- **Method**: HTTP POST via `net.http_post()`
- **Authentication**: API key via `X-API-Key` header

### Key Commands
```sql
-- View scheduled job
SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';

-- View recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC LIMIT 10;

-- Check API key
SELECT current_setting('app.supabase_function_key');

-- Manually trigger job
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);
```

---

## Understanding the Schedule

### Cron Expression: `0 7 * * *`
```
┌───────────── minute (0)
│ ┌─────────── hour (7 = 7:00 AM)
│ │ ┌───────── day of month (*)
│ │ │ ┌─────── month (*)
│ │ │ │ ┌───── day of week (*)
│ │ │ │ │
0 7 * * *
```

**Translation**: Every day at 7:00 AM UTC

### Timezone Conversions
- **Brisbane (AEST)**: 5:00 PM (UTC+10, no daylight saving)
- **Sydney (AEDT)**: 6:00 PM during daylight saving (UTC+11)
- **Perth (AWST)**: 3:00 PM (UTC+8, no daylight saving)
- **Adelaide (ACDT)**: 5:30 PM during daylight saving (UTC+10.5)

**Note**: Queensland (Brisbane) does NOT observe daylight saving time, so the conversion is consistent year-round.

---

## Viewing Job Information

### 1. View All Scheduled Jobs
```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database,
  username
FROM cron.job
ORDER BY jobname;
```

### 2. View Specific Job Details
```sql
SELECT
  jobid,
  jobname,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';
```

### 3. View Job Run History
```sql
SELECT
  r.runid,
  r.jobid,
  j.jobname,
  r.job_pid,
  r.database,
  r.username,
  r.status,
  r.return_message,
  r.start_time,
  r.end_time,
  (r.end_time - r.start_time) AS duration
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname = 'update-installment-statuses-daily'
ORDER BY r.start_time DESC
LIMIT 20;
```

### 4. View Failed Runs Only
```sql
SELECT
  r.runid,
  j.jobname,
  r.status,
  r.return_message,
  r.start_time,
  (r.end_time - r.start_time) AS duration
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname = 'update-installment-statuses-daily'
  AND r.status = 'failed'
ORDER BY r.start_time DESC;
```

### 5. View Edge Function Execution Logs
```sql
-- Check jobs_log table for detailed execution information
SELECT
  id,
  job_name,
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated,
  status,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 20;
```

### 6. View Most Recent Execution
```sql
-- Combined view: pg_cron run + Edge Function execution
WITH latest_cron_run AS (
  SELECT
    r.start_time AS cron_start,
    r.end_time AS cron_end,
    r.status AS cron_status,
    r.return_message AS cron_message
  FROM cron.job_run_details r
  JOIN cron.job j ON r.jobid = j.jobid
  WHERE j.jobname = 'update-installment-statuses-daily'
  ORDER BY r.start_time DESC
  LIMIT 1
),
latest_job_log AS (
  SELECT
    started_at AS job_start,
    completed_at AS job_end,
    status AS job_status,
    records_updated,
    error_message,
    metadata
  FROM jobs_log
  WHERE job_name = 'update-installment-statuses'
  ORDER BY started_at DESC
  LIMIT 1
)
SELECT
  c.cron_start,
  c.cron_end,
  c.cron_status,
  c.cron_message,
  j.job_start,
  j.job_end,
  j.job_status,
  j.records_updated,
  j.error_message,
  j.metadata
FROM latest_cron_run c
FULL OUTER JOIN latest_job_log j ON DATE_TRUNC('minute', c.cron_start) = DATE_TRUNC('minute', j.job_start);
```

---

## Managing the Job

### Pause Job (Deactivate)
```sql
-- Deactivate the job (it will remain scheduled but won't run)
UPDATE cron.job
SET active = false
WHERE jobname = 'update-installment-statuses-daily';
```

### Resume Job (Activate)
```sql
-- Reactivate the job
UPDATE cron.job
SET active = true
WHERE jobname = 'update-installment-statuses-daily';
```

### Unschedule Job (Remove)
```sql
-- Completely remove the job from the schedule
SELECT cron.unschedule('update-installment-statuses-daily');

-- Verify it's gone
SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';
-- Should return 0 rows
```

### Reschedule Job (Change Schedule)
```sql
-- Unschedule the old job
SELECT cron.unschedule('update-installment-statuses-daily');

-- Schedule with new time (example: 8:00 AM UTC instead of 7:00 AM)
SELECT cron.schedule(
  'update-installment-statuses-daily',
  '0 8 * * *',  -- New schedule
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

### Update API Key
```sql
-- Update the stored API key
ALTER DATABASE postgres SET app.supabase_function_key = 'new-api-key-value';

-- Verify update
SELECT current_setting('app.supabase_function_key');

-- Job will automatically use the new key on next run (no need to reschedule)
```

### Update Project Reference (Edge Function URL)
```sql
-- You must unschedule and reschedule the job with the new URL
SELECT cron.unschedule('update-installment-statuses-daily');

SELECT cron.schedule(
  'update-installment-statuses-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://NEW-PROJECT-REF.supabase.co/functions/v1/update-installment-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', current_setting('app.supabase_function_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Manual Testing

### Test the HTTP Request
```sql
-- Execute the same request that pg_cron will make
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS request_id;

-- Check the result in jobs_log
SELECT * FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;
```

### Test with curl (Outside Database)
```bash
# Get your project reference and API key
PROJECT_REF="your-project-ref"
API_KEY="your-api-key"

# Test the Edge Function
curl -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{}'
```

### Verify Database Function
```sql
-- Test the underlying database function directly
SELECT * FROM update_installment_statuses();

-- Should return results like:
-- agency_id | updated_count | transitions
-- ----------|---------------|------------
-- uuid1     | 5             | {"pending_to_overdue": 5}
-- uuid2     | 3             | {"pending_to_overdue": 3}
```

---

## Troubleshooting

### Job Not Running

**Problem**: Job doesn't execute at scheduled time

**Diagnosis**:
```sql
-- 1. Check if job is scheduled
SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';
-- Should return 1 row

-- 2. Check if job is active
SELECT active FROM cron.job WHERE jobname = 'update-installment-statuses-daily';
-- Should return true

-- 3. Check for recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC LIMIT 5;
-- Check if any runs have occurred
```

**Solutions**:
- If job doesn't exist: Re-run migration `pg_cron_schedule.sql`
- If job is inactive: `UPDATE cron.job SET active = true WHERE jobname = 'update-installment-statuses-daily';`
- If no runs yet: Wait for scheduled time or trigger manually
- Check PostgreSQL logs for pg_cron errors

---

### HTTP Request Failing

**Problem**: Job runs but HTTP request fails

**Diagnosis**:
```sql
-- Check pg_cron run history for errors
SELECT return_message, status
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC LIMIT 1;
```

**Common Errors**:

1. **"could not resolve host"** or **"connection refused"**
   - **Cause**: Network connectivity issue or wrong URL
   - **Solution**:
     - Verify project reference in URL
     - Check Edge Function is deployed: `supabase functions list`
     - Test URL from outside: `curl https://<project-ref>.supabase.co/functions/v1/update-installment-statuses`

2. **"Unauthorized" or 401**
   - **Cause**: API key mismatch
   - **Solution**:
     - Check API key: `SELECT current_setting('app.supabase_function_key');`
     - Verify Edge Function expects this key
     - Update key if needed (see "Update API Key" above)

3. **"404 Not Found"**
   - **Cause**: Edge Function not deployed or wrong endpoint name
   - **Solution**:
     - Deploy function: `supabase functions deploy update-installment-statuses`
     - Verify endpoint name matches: `/functions/v1/update-installment-statuses`

4. **Timeout**
   - **Cause**: Edge Function taking too long
   - **Solution**:
     - Check Edge Function logs in Supabase Dashboard
     - Review database function performance
     - Consider adding indexes (see `update_installment_statuses.sql` for recommendations)

---

### No Installments Updated

**Problem**: Job runs successfully but no installments are marked overdue

**Diagnosis**:
```sql
-- 1. Check job execution log
SELECT records_updated, metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC LIMIT 1;

-- 2. Check if there are installments that should be overdue
SELECT
  i.id,
  i.student_due_date,
  i.status,
  pp.status AS payment_plan_status,
  a.timezone,
  a.overdue_cutoff_time
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN agencies a ON pp.agency_id = a.id
WHERE i.status = 'pending'
  AND pp.status = 'active'
  AND i.student_due_date < CURRENT_DATE
LIMIT 10;

-- 3. Test database function manually
SELECT * FROM update_installment_statuses();
```

**Common Causes**:
- No installments meet criteria (status='pending', active plan, past due date)
- Timezone/cutoff time configuration incorrect
- Database function not working correctly
- RLS policies blocking updates

**Solutions**:
- Verify test data exists
- Check agency timezone settings: `SELECT id, name, timezone, overdue_cutoff_time FROM agencies;`
- Test database function with sample data
- Review RLS policies on installments table

---

### API Key Issues

**Problem**: API key not set or incorrect

**Diagnosis**:
```sql
-- Try to retrieve API key
SELECT current_setting('app.supabase_function_key');
-- If this errors, the setting doesn't exist
```

**Solutions**:
```sql
-- Set API key (requires superuser)
ALTER DATABASE postgres SET app.supabase_function_key = 'actual-api-key';

-- Verify it's set
SELECT current_setting('app.supabase_function_key');

-- If you get "unrecognized configuration parameter" error:
-- You may need to use a different approach depending on Supabase configuration
-- Contact Supabase support or use environment variables in Edge Function instead
```

---

### High Load or Performance Issues

**Problem**: Job takes too long or impacts database performance

**Diagnosis**:
```sql
-- Check execution duration
SELECT
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;

-- Check if indexes exist
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('installments', 'payment_plans')
ORDER BY tablename, indexname;
```

**Solutions**:
- Add recommended indexes (see `update_installment_statuses.sql`)
- Consider running job during off-peak hours
- Break up processing into smaller batches
- Optimize database function query performance

---

## Monitoring and Alerting

### Set Up Monitoring

**1. Create a monitoring function**:
```sql
CREATE OR REPLACE FUNCTION check_job_health()
RETURNS TABLE(
  job_name TEXT,
  last_run TIMESTAMPTZ,
  status TEXT,
  hours_since_last_run NUMERIC,
  issue TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH latest_run AS (
    SELECT
      'update-installment-statuses-daily' AS job_name,
      r.start_time AS last_run,
      r.status,
      EXTRACT(EPOCH FROM (NOW() - r.start_time)) / 3600 AS hours_since
    FROM cron.job_run_details r
    JOIN cron.job j ON r.jobid = j.jobid
    WHERE j.jobname = 'update-installment-statuses-daily'
    ORDER BY r.start_time DESC
    LIMIT 1
  )
  SELECT
    lr.job_name,
    lr.last_run,
    lr.status::TEXT,
    lr.hours_since,
    CASE
      WHEN lr.last_run IS NULL THEN 'Job has never run'
      WHEN lr.hours_since > 25 THEN 'Job has not run in over 25 hours (expected daily)'
      WHEN lr.status = 'failed' THEN 'Last run failed'
      ELSE 'OK'
    END AS issue
  FROM latest_run lr;
END;
$$ LANGUAGE plpgsql;

-- Run monitoring check
SELECT * FROM check_job_health();
```

**2. Check for failed runs in last 7 days**:
```sql
SELECT
  COUNT(*) AS failed_runs,
  MIN(start_time) AS first_failure,
  MAX(start_time) AS last_failure
FROM cron.job_run_details r
JOIN cron.job j ON r.jobid = j.jobid
WHERE j.jobname = 'update-installment-statuses-daily'
  AND r.status = 'failed'
  AND r.start_time > NOW() - INTERVAL '7 days';
```

**3. Alert on consecutive failures**:
```sql
WITH recent_runs AS (
  SELECT
    r.start_time,
    r.status,
    LAG(r.status) OVER (ORDER BY r.start_time) AS prev_status,
    LAG(r.status, 2) OVER (ORDER BY r.start_time) AS prev_prev_status
  FROM cron.job_run_details r
  JOIN cron.job j ON r.jobid = j.jobid
  WHERE j.jobname = 'update-installment-statuses-daily'
  ORDER BY r.start_time DESC
  LIMIT 1
)
SELECT
  CASE
    WHEN status = 'failed' AND prev_status = 'failed' AND prev_prev_status = 'failed'
    THEN 'ALERT: 3 consecutive failures!'
    WHEN status = 'failed' AND prev_status = 'failed'
    THEN 'WARNING: 2 consecutive failures'
    ELSE 'OK'
  END AS alert_status
FROM recent_runs;
```

---

## Configuration Reference

### Environment Variables (Edge Function)
```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_FUNCTION_KEY=<api-key>
```

### PostgreSQL Settings
```sql
-- API key for Edge Function authentication
app.supabase_function_key = '<api-key>'
```

### Agency Configuration (per agency)
```sql
SELECT
  id,
  name,
  timezone,              -- Default: 'Australia/Brisbane'
  overdue_cutoff_time,   -- Default: '17:00' (5:00 PM)
  due_soon_threshold_days -- Default: 4
FROM agencies;
```

### Cron Schedule Format
```
 ┌────────── minute (0 - 59)
 │ ┌──────── hour (0 - 23)
 │ │ ┌────── day of month (1 - 31)
 │ │ │ ┌──── month (1 - 12)
 │ │ │ │ ┌── day of week (0 - 6) (Sunday = 0)
 │ │ │ │ │
 * * * * *
```

**Examples**:
- `0 7 * * *` - Every day at 7:00 AM
- `30 8 * * 1-5` - Weekdays at 8:30 AM
- `0 */6 * * *` - Every 6 hours
- `0 0 1 * *` - First day of every month at midnight
- `0 9,17 * * *` - Every day at 9:00 AM and 5:00 PM

---

## Best Practices

### 1. Regular Monitoring
- Check job run history weekly
- Review jobs_log for errors
- Monitor execution duration trends
- Set up alerts for failures

### 2. Testing
- Test manually after deployment
- Verify API key works
- Confirm Edge Function is deployed
- Test with sample data in staging

### 3. Maintenance
- Keep API keys secure
- Update project reference if migrating
- Review and optimize database function periodically
- Clean up old job run history (pg_cron keeps 30 days by default)

### 4. Documentation
- Document any schedule changes
- Record reasons for manual triggers
- Track API key updates
- Note any configuration changes

### 5. Disaster Recovery
- Keep backup of migration files
- Document API key recovery process
- Test job recreation procedure
- Have rollback plan ready

---

## Related Documentation

- **Task 1**: `update_installment_statuses.sql` - Database function
- **Task 2**: `jobs_log_table.sql` - Execution logging table
- **Task 3**: `supabase/functions/update-installment-statuses/` - Edge Function
- **Architecture**: `docs/architecture.md` - Pattern 3: Automated Status State Machine
- **pg_cron docs**: https://github.com/citusdata/pg_cron
- **Supabase docs**: https://supabase.com/docs

---

## Support and Troubleshooting

If you encounter issues not covered in this guide:

1. **Check PostgreSQL logs** for pg_cron errors
2. **Review Edge Function logs** in Supabase Dashboard
3. **Test each component individually** (database function, Edge Function, pg_cron)
4. **Verify configuration** (API key, project reference, schedule)
5. **Consult story documentation** for additional context

For Supabase-specific issues, refer to: https://supabase.com/docs/guides/functions

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Story**: 5-1 Automated Status Detection Job
**Task**: 4 - Configure pg_cron Schedule
