# pg_cron Schedule Testing Guide

**Story**: 5-1 Automated Status Detection Job
**Task**: 4 - Configure pg_cron Schedule
**Date**: 2025-11-13

## Overview

This guide provides step-by-step instructions for testing the pg_cron configuration that schedules automatic execution of the `update-installment-statuses` Edge Function daily at 7:00 AM UTC.

## Prerequisites

Before testing, ensure:
- [ ] Tasks 1, 2, and 3 are completed (database function, jobs_log table, Edge Function)
- [ ] Edge Function is deployed: `supabase functions deploy update-installment-statuses`
- [ ] API key placeholder is configured (actual key will be set in Task 5)
- [ ] Access to Supabase SQL Editor or psql

## Test Execution

### Running the Automated Test Suite

1. **Navigate to the drafts directory**:
   ```bash
   cd supabase/migrations/drafts
   ```

2. **Run the test SQL file**:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f test_configure_pg_cron_schedule.sql
   ```

   Or using Supabase CLI:
   ```bash
   supabase db exec -f test_configure_pg_cron_schedule.sql
   ```

3. **Expected Results**:
   - All 10 tests should pass (✓ PASS)
   - Overall result: "✓ ALL TESTS PASSED"
   - Test summary: 6/6 tests passed

### Manual Verification Steps

#### 1. Verify Extensions are Enabled

```sql
-- Check pg_cron extension
SELECT extname, extversion
FROM pg_extension
WHERE extname IN ('pg_cron', 'http');
```

**Expected Output**:
```
extname  | extversion
---------|------------
pg_cron  | 1.5
http     | 1.6
```

#### 2. Verify API Key Configuration

```sql
-- Check API key is configured (without revealing the value)
SELECT current_setting('app.supabase_function_key', true) IS NOT NULL AS key_configured;
```

**Expected Output**:
```
key_configured
--------------
t
```

#### 3. Verify Job is Scheduled

```sql
-- View the scheduled job
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';
```

**Expected Output**:
- `jobname`: `update-installment-statuses-daily`
- `schedule`: `0 7 * * *`
- `active`: `t` (true)
- `command`: Contains `net.http_post(...)` with Edge Function URL

#### 4. Manual Job Trigger (Pre-Production Testing)

**IMPORTANT**: Before running this test, you must:
1. Deploy the Edge Function: `supabase functions deploy update-installment-statuses`
2. Update the project reference URL in the SQL below
3. Ensure Task 5 (API key configuration) is completed, or use the placeholder key

```sql
-- Manually trigger the job (update URL with your project reference)
SELECT net.http_post(
  url := 'https://your-project-ref.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS request_id;
```

**Expected Behavior**:
- Function returns a request ID (integer)
- No errors are raised

#### 5. Verify Job Execution in Logs

After manually triggering the job, check the logs:

```sql
-- Check jobs_log table for execution record
SELECT
  id,
  job_name,
  started_at,
  completed_at,
  records_updated,
  status,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;
```

**Expected Output**:
- `job_name`: `update-installment-statuses`
- `status`: `success` (or `failed` if there were issues)
- `records_updated`: Number of installments updated (may be 0 if no overdue payments)
- `error_message`: NULL (if successful)
- `metadata`: JSONB with agency results

#### 6. Check Cron Job Run History

```sql
-- View recent cron job executions
SELECT
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

**Note**: This will only show results after the job has run at least once at the scheduled time (7:00 AM UTC). For a newly configured job, this table may be empty until the first scheduled execution.

## Test Scenarios

### Scenario 1: Fresh Installation

**Test**: Verify all components are installed correctly

**Steps**:
1. Run the migration: `configure_pg_cron_schedule.sql`
2. Run the test suite: `test_configure_pg_cron_schedule.sql`
3. Verify all tests pass

**Success Criteria**:
- ✓ pg_cron extension enabled
- ✓ http extension enabled
- ✓ API key configured
- ✓ Job scheduled with correct cron expression
- ✓ Job is active

### Scenario 2: Manual Job Execution

**Test**: Manually trigger the job before scheduled time

**Steps**:
1. Deploy Edge Function (if not already deployed)
2. Update project reference URL in test SQL
3. Execute manual trigger SQL (see section 4 above)
4. Check jobs_log table for execution record

**Success Criteria**:
- ✓ net.http_post returns a request ID
- ✓ jobs_log contains a new record with status 'success'
- ✓ No error messages in jobs_log

### Scenario 3: Scheduled Execution

**Test**: Wait for the job to run at scheduled time (7:00 AM UTC)

**Steps**:
1. Note current time and calculate when next 7:00 AM UTC will occur
2. Wait for scheduled time
3. After scheduled time, check cron.job_run_details
4. Check jobs_log table for execution record

**Success Criteria**:
- ✓ cron.job_run_details shows successful execution
- ✓ jobs_log contains execution record with correct timestamp
- ✓ Status is 'success' or 'failed' (not 'running')

### Scenario 4: Job Re-scheduling

**Test**: Unschedule and re-schedule the job

**Steps**:
1. Unschedule: `SELECT cron.unschedule('update-installment-statuses-daily');`
2. Verify job is removed: `SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';`
3. Re-run migration to re-schedule
4. Verify job appears again with same schedule

**Success Criteria**:
- ✓ Job can be unscheduled without errors
- ✓ Job can be re-scheduled successfully
- ✓ Schedule remains `0 7 * * *`

## Troubleshooting

### Issue: Extensions Not Enabled

**Symptoms**:
- Error: `extension "pg_cron" does not exist`
- Error: `function net.http_post() does not exist`

**Solutions**:
1. Ensure running on Supabase (pg_cron is pre-installed)
2. Run: `CREATE EXTENSION IF NOT EXISTS pg_cron;`
3. Run: `CREATE EXTENSION IF NOT EXISTS http;`
4. Contact Supabase support if extensions cannot be enabled

### Issue: API Key Not Configured

**Symptoms**:
- Test 3 fails: "API key is not configured"
- Manual trigger returns 401 Unauthorized

**Solutions**:
1. Run: `ALTER DATABASE postgres SET app.supabase_function_key = 'placeholder-key';`
2. Reload config: `SELECT pg_reload_conf();`
3. Wait for Task 5 to configure actual API key

### Issue: Job Not Scheduled

**Symptoms**:
- Test 4 fails: Job does not appear in cron.job table
- Query returns no rows

**Solutions**:
1. Re-run the migration: `configure_pg_cron_schedule.sql`
2. Check for errors in migration output
3. Verify pg_cron extension is enabled
4. Check database logs for scheduling errors

### Issue: Manual Trigger Fails

**Symptoms**:
- Error: `could not connect to server`
- Error: `401 Unauthorized`
- jobs_log shows status 'failed'

**Solutions**:
1. Verify Edge Function is deployed: `supabase functions list`
2. Check project reference URL is correct
3. Verify API key matches between pg_cron and Edge Function
4. Test Edge Function directly with curl:
   ```bash
   curl -X POST 'https://your-project-ref.supabase.co/functions/v1/update-installment-statuses' \
     -H 'Content-Type: application/json' \
     -H 'X-API-Key: your-api-key' \
     -d '{}'
   ```

### Issue: Job Runs But No Records Updated

**Symptoms**:
- jobs_log shows status 'success'
- records_updated is 0
- No installments are marked overdue

**Solutions**:
1. Verify there are installments with status 'pending' and due_date in the past
2. Check agencies.timezone is configured correctly
3. Verify agencies.overdue_cutoff_time is set (default: 17:00:00)
4. Run Task 1 test suite to verify database function works correctly

### Issue: Scheduled Time Not Working

**Symptoms**:
- Job does not run at 7:00 AM UTC
- cron.job_run_details is empty after scheduled time

**Solutions**:
1. Verify job is active: `SELECT active FROM cron.job WHERE jobname = 'update-installment-statuses-daily';`
2. Check server timezone: `SHOW timezone;`
3. Verify cron expression: `SELECT schedule FROM cron.job WHERE jobname = 'update-installment-statuses-daily';`
4. Check pg_cron is running: `SELECT * FROM cron.job;`
5. Review PostgreSQL logs for cron execution errors

## Production Deployment Checklist

Before deploying to production:

- [ ] All test scenarios pass successfully
- [ ] Edge Function is deployed and tested
- [ ] Project reference URL is updated in cron job command
- [ ] API key is configured (Task 5)
- [ ] Timezone alignment verified (7:00 AM UTC = 5:00 PM Brisbane AEST)
- [ ] Manual trigger test completed successfully
- [ ] jobs_log table shows successful execution
- [ ] Monitoring/alerting configured (Task 8)
- [ ] Documentation reviewed and updated

## Monitoring

After deployment, monitor the following:

1. **Daily Execution**:
   ```sql
   SELECT started_at, completed_at, status, records_updated
   FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
   AND started_at > NOW() - INTERVAL '7 days'
   ORDER BY started_at DESC;
   ```

2. **Failure Rate**:
   ```sql
   SELECT
     COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
     COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
     ROUND(COUNT(*) FILTER (WHERE status = 'failed')::numeric / COUNT(*) * 100, 2) AS failure_rate_percent
   FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
   AND started_at > NOW() - INTERVAL '30 days';
   ```

3. **Cron Job Health**:
   ```sql
   SELECT
     jobname,
     active,
     schedule,
     (SELECT MAX(start_time) FROM cron.job_run_details WHERE jobid = cron.job.jobid) AS last_run
   FROM cron.job
   WHERE jobname = 'update-installment-statuses-daily';
   ```

## Next Steps

After completing Task 4:

1. ✓ Mark Task 4 as completed in MANIFEST.md
2. → Proceed to Task 5: Implement API Key Authentication
3. → Update the placeholder API key with actual secure key
4. → Re-test with actual API key
5. → Complete remaining tasks (6-10) as per README.md

---

**Last Updated**: 2025-11-13
**Status**: Task 4 Implementation Complete
