# Status Update Job Troubleshooting Runbook

## Overview

**Job Name:** `update-installment-statuses`
**Schedule:** Daily at 2:00 AM (configurable via pg_cron)
**Purpose:** Automatically update installment statuses from 'pending' to 'overdue' based on agency timezone and cutoff time
**Owner:** System Administrator / DevOps Team

## Quick Reference

| Alert Type | Severity | Expected Response Time |
|-----------|----------|----------------------|
| Job Failed | Critical | Within 30 minutes |
| Missed Execution (>25 hours) | Critical | Within 1 hour |
| Slow Execution (>2x avg) | Warning | Within 4 hours |
| Zero Updates (unusual) | Info | Review during business hours |

## Common Failure Scenarios

### 1. Database Connection Timeout

**Symptoms:**
- Error message: "connection timeout", "ECONNREFUSED", or "too many connections"
- Job status: `failed`
- Retry attempts exhausted

**Diagnosis:**

```sql
-- Check for long-running queries
SELECT
  pid,
  usename,
  application_name,
  state,
  query,
  query_start,
  state_change,
  now() - query_start AS duration
FROM pg_stat_activity
WHERE state = 'active'
  AND query_start < now() - INTERVAL '5 minutes'
ORDER BY query_start;

-- Check current connection count
SELECT count(*) as total_connections,
       count(*) FILTER (WHERE state = 'active') as active_connections
FROM pg_stat_activity;

-- Check connection limits
SELECT
  setting AS max_connections,
  (SELECT count(*) FROM pg_stat_activity) AS current_connections,
  setting::int - (SELECT count(*) FROM pg_stat_activity) AS connections_available
FROM pg_settings
WHERE name = 'max_connections';
```

**Resolution:**

1. **Immediate:** Restart the job manually if connection pool has recovered
   ```bash
   # Via Supabase dashboard or API
   curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
     -H "Authorization: Bearer <service-role-key>"
   ```

2. **Short-term:** Kill long-running queries blocking connections
   ```sql
   -- Review the query first, then terminate if safe
   SELECT pg_terminate_backend(<pid>);
   ```

3. **Long-term:**
   - Review Supabase dashboard for resource usage trends
   - Consider upgrading database tier if consistently hitting limits
   - Optimize queries that run longer than expected
   - Increase connection timeout in Edge Function (default: 30s)

---

### 2. API Key Mismatch or Expired

**Symptoms:**
- Error message: "Unauthorized", "Invalid API key", "Authentication failed"
- HTTP status: 401 or 403
- Job logs show immediate failure

**Diagnosis:**

```sql
-- Verify stored API key hash exists
SELECT
  current_setting('app.supabase_function_key_hash', true) as stored_hash,
  CASE
    WHEN current_setting('app.supabase_function_key_hash', true) IS NULL
    THEN 'NOT SET'
    ELSE 'SET'
  END as status;

-- Check when API key was last rotated
SELECT
  description,
  created_at,
  updated_at
FROM pg_catalog.pg_description
WHERE description LIKE '%API key%'
ORDER BY objoid DESC
LIMIT 1;
```

**Resolution:**

1. **Immediate:** Verify API key in Supabase dashboard
   - Go to Settings > API
   - Copy the `service_role` key (not `anon` key)

2. **Rotate API Key:** Follow Task 5 rotation procedure
   ```sql
   -- Generate new API key in Supabase dashboard first, then:
   SELECT rotate_api_key('<new-api-key>');
   ```

3. **Update Edge Function:** Ensure Edge Function uses correct environment variable
   ```bash
   # Check Edge Function secrets
   supabase secrets list

   # Update if needed
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<new-key>
   ```

4. **Verify Authentication:**
   ```bash
   # Test Edge Function with updated key
   curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
     -H "Authorization: Bearer <service-role-key>"
   ```

---

### 3. Edge Function Not Deployed or Unreachable

**Symptoms:**
- HTTP 404 error
- pg_cron logs show "connection refused" or "host not found"
- Job status: `failed` with network error

**Diagnosis:**

```bash
# Check deployed functions
supabase functions list

# Check function logs
supabase functions logs update-installment-statuses --limit 50

# Test function directly
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "Authorization: Bearer <service-role-key>" \
  -v
```

**Resolution:**

1. **Redeploy Edge Function:**
   ```bash
   cd /path/to/pleeno
   supabase functions deploy update-installment-statuses
   ```

2. **Verify Deployment:**
   ```bash
   # Check function is listed
   supabase functions list | grep update-installment-statuses

   # Check function URL is correct
   echo "https://$(supabase status | grep 'API URL' | awk '{print $3}')/functions/v1/update-installment-statuses"
   ```

3. **Update pg_cron URL if changed:**
   ```sql
   -- Check current cron job configuration
   SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';

   -- Update URL if needed
   SELECT cron.unschedule('update-installment-statuses-daily');

   -- Re-create with correct URL (from migration file)
   -- See: supabase/migrations/drafts/pg_cron_schedule.sql
   ```

---

### 4. Timezone Data Issue

**Symptoms:**
- Error mentioning "invalid timezone", "timezone not found"
- Partial failure: some agencies processed, others skipped
- Metadata shows specific agencies with errors

**Diagnosis:**

```sql
-- Check for invalid timezones in agencies table
SELECT
  id,
  name,
  timezone,
  cutoff_time
FROM agencies
WHERE timezone NOT IN (SELECT name FROM pg_timezone_names)
   OR timezone IS NULL;

-- Verify timezone names are IANA-compliant
SELECT
  a.name AS agency_name,
  a.timezone,
  CASE
    WHEN a.timezone IN (SELECT name FROM pg_timezone_names) THEN 'Valid'
    ELSE 'Invalid'
  END AS validation_status
FROM agencies a
ORDER BY validation_status, agency_name;
```

**Resolution:**

1. **Fix Invalid Timezones:**
   ```sql
   -- Update to valid IANA timezone names
   UPDATE agencies
   SET timezone = 'America/New_York'
   WHERE timezone = 'EST' OR timezone = 'Eastern';

   UPDATE agencies
   SET timezone = 'America/Chicago'
   WHERE timezone = 'CST' OR timezone = 'Central';

   UPDATE agencies
   SET timezone = 'America/Denver'
   WHERE timezone = 'MST' OR timezone = 'Mountain';

   UPDATE agencies
   SET timezone = 'America/Los_Angeles'
   WHERE timezone = 'PST' OR timezone = 'Pacific';
   ```

2. **Set Default for NULL Timezones:**
   ```sql
   -- Set to UTC if agency hasn't configured timezone yet
   UPDATE agencies
   SET timezone = 'UTC'
   WHERE timezone IS NULL;
   ```

3. **Verify Valid Timezone Names:**
   See [Task 6: Valid Timezone List](../../supabase/migrations/drafts/test_agency_timezone_fields.sql)

4. **Re-run Job:**
   ```bash
   curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
     -H "Authorization: Bearer <service-role-key>"
   ```

---

### 5. No Installments Updated (Unexpected Zero)

**Symptoms:**
- Job completes successfully (`status: success`)
- `records_updated: 0`
- Expected some installments to be marked overdue

**Diagnosis:**

```sql
-- Check for installments that SHOULD be overdue
SELECT
  a.name AS agency_name,
  a.timezone,
  a.cutoff_time,
  COUNT(*) AS pending_overdue_count
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN agencies a ON pp.agency_id = a.id
WHERE i.status = 'pending'
  AND pp.status = 'active'
  AND i.student_due_date < CURRENT_DATE
GROUP BY a.id, a.name, a.timezone, a.cutoff_time
ORDER BY pending_overdue_count DESC;

-- Check if cutoff time logic is working
SELECT
  a.name AS agency_name,
  a.timezone,
  a.cutoff_time,
  (CURRENT_TIMESTAMP AT TIME ZONE a.timezone)::time AS current_time_in_agency_tz,
  CASE
    WHEN (CURRENT_TIMESTAMP AT TIME ZONE a.timezone)::time >= a.cutoff_time
    THEN 'Past Cutoff - Should Update'
    ELSE 'Before Cutoff - Will Not Update Yet'
  END AS update_eligibility
FROM agencies a
WHERE a.timezone IS NOT NULL
ORDER BY update_eligibility DESC, agency_name;
```

**Resolution:**

1. **Verify Test Data Exists:**
   - Ensure there are payment plans with `status = 'active'`
   - Ensure there are installments with `status = 'pending'`
   - Ensure `student_due_date` is in the past

2. **Check Agency Configuration:**
   - Verify agencies have valid timezone settings
   - Verify cutoff_time is set (default: 18:00:00)

3. **Verify Job Logic:**
   Review Edge Function code:
   ```typescript
   // File: supabase/functions/update-installment-statuses/index.ts
   // Ensure the WHERE clause is correct:
   // - installment.status = 'pending'
   // - payment_plan.status = 'active'
   // - installment.student_due_date < current date in agency timezone
   // - current time >= agency.cutoff_time
   ```

4. **Manual Test:**
   ```sql
   -- Manually check what the query would return
   -- (This is the same query the Edge Function uses)
   SELECT
     i.id,
     i.student_due_date,
     a.timezone,
     (CURRENT_TIMESTAMP AT TIME ZONE a.timezone)::date AS today_in_agency_tz
   FROM installments i
   JOIN payment_plans pp ON i.payment_plan_id = pp.id
   JOIN agencies a ON pp.agency_id = a.id
   WHERE i.status = 'pending'
     AND pp.status = 'active'
     AND i.student_due_date < (CURRENT_TIMESTAMP AT TIME ZONE a.timezone)::date
     AND (CURRENT_TIMESTAMP AT TIME ZONE a.timezone)::time >= a.cutoff_time;
   ```

---

### 6. Job Stuck in 'running' Status

**Symptoms:**
- Job logs show `status: running` for >1 hour
- No completion time
- No error message
- Job appears to have hung

**Diagnosis:**

```sql
-- Find stuck jobs
SELECT
  id,
  job_name,
  started_at,
  now() - started_at AS running_duration,
  metadata
FROM jobs_log
WHERE status = 'running'
  AND started_at < now() - INTERVAL '1 hour'
ORDER BY started_at;

-- Check Edge Function logs for errors
-- (Use Supabase dashboard: Logs > Edge Functions)
```

**Resolution:**

1. **Mark Job as Failed:**
   ```sql
   -- Update stuck job to failed status
   UPDATE jobs_log
   SET
     status = 'failed',
     completed_at = now(),
     error_message = 'Job timed out - manually marked as failed by admin'
   WHERE id = '<stuck-job-id>'
     AND status = 'running';
   ```

2. **Investigate Root Cause:**
   - Check Edge Function timeout settings (default: 60 seconds)
   - Review database query performance
   - Check for deadlocks or lock contention
   - Review Edge Function logs for clues

3. **Prevent Future Occurrences:**
   - Add timeout to Edge Function HTTP request
   - Add database query timeout
   - Implement progress tracking for long-running operations

---

### 7. High Failure Rate (Multiple Consecutive Failures)

**Symptoms:**
- Multiple jobs failing in a row
- Success rate drops below 90%
- Different error messages each time

**Diagnosis:**

```sql
-- Check recent failure pattern
SELECT
  started_at,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'failed'
  AND started_at > now() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- Analyze error patterns
SELECT
  LEFT(error_message, 100) AS error_pattern,
  COUNT(*) AS occurrence_count,
  MIN(started_at) AS first_seen,
  MAX(started_at) AS last_seen
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'failed'
  AND started_at > now() - INTERVAL '7 days'
GROUP BY LEFT(error_message, 100)
ORDER BY occurrence_count DESC;
```

**Resolution:**

1. **Identify Common Pattern:**
   - Look for recurring error messages
   - Check if failures occur at specific times
   - Correlate with database maintenance windows or deployments

2. **Apply Specific Fix:**
   - Follow appropriate scenario above based on error type
   - If systemic issue, escalate to infrastructure team

3. **Increase Monitoring:**
   - Set up more granular alerts
   - Add detailed logging to Edge Function
   - Monitor database health metrics

---

## Escalation Path

### Level 1: Automated Alerts
- **Response Time:** Immediate notification
- **Action:** Alert sent to on-call engineer via Slack/email

### Level 2: On-Call Engineer
- **Response Time:** 30 minutes for critical, 4 hours for warnings
- **Action:** Follow runbook, attempt standard fixes

### Level 3: Senior DevOps / Database Admin
- **Response Time:** 2 hours for critical, next business day for warnings
- **Action:** Complex database issues, performance optimization

### Level 4: Engineering Team Lead
- **Response Time:** 4 hours for critical
- **Action:** Code changes required, architectural decisions

## Preventive Maintenance

### Daily
- Review job execution logs (automated via dashboard)
- Check for any failures (automated alerts)

### Weekly
- Review job performance trends
- Check success rate (should be >95%)
- Review average execution time

### Monthly
- Analyze long-term trends
- Review and update timezone configurations as needed
- Test alert system (simulate failures)
- Review and update runbook based on new scenarios

## Monitoring Queries

See: `docs/monitoring/status-update-job-queries.sql`

Quick health check:
```sql
SELECT
  CASE
    WHEN lr.status = 'failed' THEN 'CRITICAL: Last run failed'
    WHEN now() - lr.started_at > INTERVAL '25 hours' THEN 'WARNING: No recent execution'
    WHEN lr.status = 'success' THEN 'OK: Running normally'
    ELSE 'UNKNOWN'
  END AS health_status,
  lr.started_at AS last_run,
  lr.status AS last_status,
  lr.records_updated,
  lr.error_message
FROM (
  SELECT *
  FROM jobs_log
  WHERE job_name = 'update-installment-statuses'
  ORDER BY started_at DESC
  LIMIT 1
) lr;
```

## Contact Information

| Role | Contact | Escalation Priority |
|------|---------|-------------------|
| On-Call Engineer | Slack: #on-call | Primary |
| Database Admin | Slack: #database-team | Secondary |
| Engineering Lead | Slack: #engineering-leads | Tertiary |
| Emergency Hotline | +1-XXX-XXX-XXXX | After hours critical |

## Related Documentation

- [Task 5: API Key Management](../../.bmad-ephemeral/prompt-context/task-05-prompt.md)
- [Task 6: Timezone Configuration](../../.bmad-ephemeral/prompt-context/task-06-prompt.md)
- [Task 7: Security Review](../../.bmad-ephemeral/prompt-context/task-07-prompt.md)
- [Monitoring Queries](../monitoring/status-update-job-queries.sql)
- [Edge Function Code](../../supabase/functions/update-installment-statuses/index.ts)

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-13 | System | Initial version |

---

**Last Updated:** 2025-11-13
**Next Review:** 2025-12-13
