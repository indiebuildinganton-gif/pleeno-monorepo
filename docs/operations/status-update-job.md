# Status Update Job Operations Guide

## Overview

The status update job runs daily at 7:00 AM UTC (5:00 PM Brisbane time) to automatically mark overdue installments. This guide covers operational procedures for maintaining the job.

## Daily Monitoring

### Check Job Health

Run this query every morning:

```sql
-- Last 5 executions
SELECT
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated,
  status
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 5;
```

**Expected:** All recent runs show `status = 'success'`

### Check for Failures

```sql
-- Failed jobs in last 7 days
SELECT
  started_at,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'failed'
  AND started_at > now() - INTERVAL '7 days';
```

**Expected:** Zero results

### Check for Missed Runs

```sql
-- Time since last run
SELECT
  MAX(started_at) AS last_run,
  now() - MAX(started_at) AS time_since_last_run
FROM jobs_log
WHERE job_name = 'update-installment-statuses';
```

**Expected:** `time_since_last_run` < 25 hours

## Manual Execution

### When to Manually Run

- Testing after code changes
- Recovering from failed execution
- Processing installments outside scheduled time

### How to Manually Run

**Option 1: Via curl**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <api-key>" \
  -H "Content-Type: application/json"
```

**Option 2: Via PostgreSQL**

```sql
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);
```

**Option 3: Via Supabase Dashboard**

1. Go to Edge Functions > update-installment-statuses
2. Click "Invoke Function"
3. Add header: `X-API-Key: <api-key>`
4. Send request

## Schedule Management

### View Schedule

```sql
SELECT jobname, schedule, command
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';
```

### Disable Schedule (Emergency)

```sql
SELECT cron.unschedule('update-installment-statuses-daily');
```

### Re-enable Schedule

```sql
-- Run the schedule SQL from migration file
-- See: supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql
```

### Change Schedule Time

```sql
-- Unschedule old
SELECT cron.unschedule('update-installment-statuses-daily');

-- Schedule with new time (example: 6:00 AM UTC instead of 7:00 AM)
SELECT cron.schedule(
  'update-installment-statuses-daily',
  '0 6 * * *',  -- New time
  $$
  SELECT net.http_post(...);
  $$
);
```

## Performance Monitoring

### Average Duration

```sql
SELECT
  AVG(completed_at - started_at) AS avg_duration,
  MAX(completed_at - started_at) AS max_duration
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '30 days';
```

**Expected:** `avg_duration` < 10 seconds

### Records Updated Trend

```sql
SELECT
  DATE(started_at) AS date,
  SUM(records_updated) AS total_updated
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '7 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;
```

## Alerting

Alerts are configured for:
- Job failure: Immediate notification via pg_notify
- Missed execution: Alert if no run in 25 hours

See [Monitoring Setup](../monitoring/status-update-job-alerts.md) for configuration.

## Troubleshooting

For detailed troubleshooting, see [Troubleshooting Runbook](../runbooks/status-update-job-failures.md).

Quick fixes:
- **401 Unauthorized:** Check API key matches between secret and database setting
- **Connection timeout:** Check database performance, consider increasing timeout
- **Zero updates:** Verify test data exists, check timezone logic
- **Edge Function 404:** Redeploy function: `supabase functions deploy update-installment-statuses`
