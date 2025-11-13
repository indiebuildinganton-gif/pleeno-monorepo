# Story 5-1: Automated Status Detection Job - Task 8

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 8: Monitoring and Alerting Setup

### Description
Set up monitoring and alerting infrastructure to track job execution health and notify administrators when issues occur. This ensures reliability and enables proactive problem resolution.

### Implementation Checklist
- [ ] Create monitoring dashboard (Supabase Dashboard or external tool)
- [ ] Configure alert: Job status = 'failed' → notify admin
- [ ] Configure alert: Job hasn't run in 25 hours → notify admin
- [ ] Set up email/Slack notification channel
- [ ] Log job execution metrics (duration, records_updated, errors)
- [ ] Create runbook for troubleshooting job failures
- [ ] Test alerting with simulated failures
- [ ] Document monitoring procedures

### Acceptance Criteria
- **AC 3**: Execution Logging and Monitoring
  - Execution details logged to jobs_log table
  - Log includes count of status transitions per agency
  - Monitoring/alerting configured if job fails

- **AC 4**: Reliability and Error Handling
  - Failed executions trigger alerts to system administrators

### Key Constraints
- Alert Latency: Alerts should trigger within 5 minutes of failure
- Notification Channels: Support email and/or Slack
- Dashboard Access: Admins only (use RLS or external auth)
- Runbook: Must include common failure scenarios and solutions

### Monitoring Queries

**File: `docs/monitoring/status-update-job-queries.sql`**

```sql
-- Query 1: Recent Job Executions
SELECT
  id,
  job_name,
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated,
  status,
  error_message
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;

-- Query 2: Failed Jobs (Last 7 Days)
SELECT
  id,
  started_at,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'failed'
  AND started_at > now() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- Query 3: Job Success Rate (Last 30 Days)
SELECT
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) AS success_rate
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND started_at > now() - INTERVAL '30 days';

-- Query 4: Average Job Duration
SELECT
  AVG(completed_at - started_at) AS avg_duration,
  MIN(completed_at - started_at) AS min_duration,
  MAX(completed_at - started_at) AS max_duration
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '7 days';

-- Query 5: Records Updated Trend
SELECT
  DATE(started_at) AS date,
  SUM(records_updated) AS total_updated,
  COUNT(*) AS runs
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Query 6: Missed Executions (Job Should Run Daily)
SELECT
  MAX(started_at) AS last_run,
  now() - MAX(started_at) AS time_since_last_run,
  CASE
    WHEN now() - MAX(started_at) > INTERVAL '25 hours' THEN 'ALERT: Missed execution'
    ELSE 'OK'
  END AS status
FROM jobs_log
WHERE job_name = 'update-installment-statuses';
```

### Alert Configuration

**Alert 1: Job Failed**

```sql
-- Create PostgreSQL function to send alert on job failure
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
```

**Alert 2: Missed Execution**

This requires external monitoring (cron job or scheduled function):

```typescript
// File: supabase/functions/check-job-health/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Check last run
  const { data: lastRun } = await supabase
    .from("jobs_log")
    .select("started_at")
    .eq("job_name", "update-installment-statuses")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  const hoursSinceLastRun = lastRun
    ? (Date.now() - new Date(lastRun.started_at).getTime()) / (1000 * 60 * 60)
    : 999;

  if (hoursSinceLastRun > 25) {
    // Send alert (implement your notification method)
    await sendAlert({
      subject: "ALERT: Status Update Job Missed",
      message: `Last run was ${hoursSinceLastRun.toFixed(1)} hours ago`,
    });
  }

  return new Response(
    JSON.stringify({ ok: hoursSinceLastRun <= 25, hoursSinceLastRun }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

### Notification Implementations

**Option 1: Email via Supabase Edge Function**

```typescript
// Use Resend, SendGrid, or similar
import { Resend } from "https://esm.sh/resend@2";

async function sendEmailAlert(error: any) {
  const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

  await resend.emails.send({
    from: "alerts@yourdomain.com",
    to: ["admin@yourdomain.com"],
    subject: "Status Update Job Failed",
    html: `
      <h2>Job Failure Alert</h2>
      <p><strong>Job Name:</strong> update-installment-statuses</p>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><a href="https://app.supabase.com/project/<project-ref>/logs">View Logs</a></p>
    `,
  });
}
```

**Option 2: Slack Webhook**

```typescript
async function sendSlackAlert(error: any) {
  const webhookUrl = Deno.env.get("SLACK_WEBHOOK_URL")!;

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: ":rotating_light: Status Update Job Failed",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Job Name:* update-installment-statuses\n*Error:* ${error.message}\n*Time:* ${new Date().toISOString()}`,
          },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Logs" },
              url: "https://app.supabase.com/project/<project-ref>/logs",
            },
          ],
        },
      ],
    }),
  });
}
```

### Monitoring Dashboard

**Option 1: Supabase Dashboard**

Create a custom SQL query in Supabase Dashboard:
1. Go to SQL Editor
2. Save monitoring queries as "Favorite Queries"
3. Access via Dashboard > SQL > Favorites

**Option 2: External Dashboard (Grafana, Metabase)**

Export job metrics via API:

```typescript
// File: supabase/functions/job-metrics/index.ts
serve(async (req) => {
  const supabase = createClient(...);

  const { data } = await supabase
    .from("jobs_log")
    .select("*")
    .eq("job_name", "update-installment-statuses")
    .gte("started_at", new Date(Date.now() - 30 * 86400000).toISOString())
    .order("started_at", { ascending: false });

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### Troubleshooting Runbook

**File: `docs/runbooks/status-update-job-failures.md`**

```markdown
# Status Update Job Troubleshooting Runbook

## Common Failure Scenarios

### 1. Database Connection Timeout

**Symptoms:**
- Error: "connection timeout"
- Retry attempts exhausted

**Diagnosis:**
```sql
-- Check for long-running queries
SELECT * FROM pg_stat_activity
WHERE state = 'active' AND query_start < now() - INTERVAL '5 minutes';
```

**Resolution:**
- Check Supabase dashboard for high load
- Review database performance metrics
- Consider increasing connection timeout

### 2. API Key Mismatch

**Symptoms:**
- Error: "Unauthorized"
- Status: 401

**Diagnosis:**
```sql
-- Verify API key setting
SELECT current_setting('app.supabase_function_key');
```

**Resolution:**
- Regenerate API key (see Task 5 rotation procedure)
- Update both Supabase secret and database setting
- Redeploy Edge Function

### 3. Edge Function Not Deployed

**Symptoms:**
- HTTP request returns 404
- pg_cron logs show connection error

**Diagnosis:**
```bash
# Check deployed functions
supabase functions list
```

**Resolution:**
```bash
# Redeploy function
supabase functions deploy update-installment-statuses
```

### 4. Timezone Data Issue

**Symptoms:**
- Error mentioning timezone names
- Some agencies not processed

**Diagnosis:**
```sql
-- Check for invalid timezones
SELECT id, name, timezone
FROM agencies
WHERE timezone NOT IN (SELECT name FROM pg_timezone_names);
```

**Resolution:**
- Update invalid timezones to valid IANA names
- See Task 6 for valid timezone list

### 5. No Installments Updated

**Symptoms:**
- Job runs successfully
- records_updated = 0
- Expected some updates

**Diagnosis:**
```sql
-- Check for pending installments past due
SELECT COUNT(*)
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
WHERE i.status = 'pending'
  AND pp.status = 'active'
  AND i.student_due_date < CURRENT_DATE;
```

**Resolution:**
- Verify test data exists
- Check agency timezone settings
- Verify cutoff time logic
```

### Testing Alerts

```bash
# Test 1: Simulate job failure
# Insert a failed job log entry
psql -c "
INSERT INTO jobs_log (job_name, started_at, completed_at, status, error_message)
VALUES ('update-installment-statuses', now(), now(), 'failed', 'Test failure');
"

# Verify pg_notify sent
# (Requires listener script or external monitoring)

# Test 2: Simulate missed execution
# Stop the cron job for > 25 hours
psql -c "SELECT cron.unschedule('update-installment-statuses-daily');"

# Wait, then run health check
curl https://<project-ref>.supabase.co/functions/v1/check-job-health

# Re-enable cron job
psql -f supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql
```

---

## Implementation Notes

### Monitoring Best Practices

**What to Monitor:**
- Job execution status (success/failure)
- Execution duration
- Records updated count
- Error messages
- Missed executions

**Alert Thresholds:**
- Failed execution: Immediate alert
- Missed execution: After 25 hours (allows 1-hour margin)
- Slow execution: If duration > 2x average
- Zero updates: Optional alert if unusual

### Cost Considerations

**Supabase Dashboard:**
- Free, built-in monitoring
- Limited customization

**External Tools:**
- More features (Grafana, Datadog, Sentry)
- Additional cost
- May require separate hosting

**Recommendation:** Start with Supabase Dashboard + pg_notify, upgrade if needed.

---

## Next Steps

1. Create monitoring queries file
2. Set up pg_notify trigger for failures
3. Implement notification method (email or Slack)
4. Create health check function (optional)
5. Write troubleshooting runbook
6. Test alerts with simulated failures
7. When Task 8 is complete:
   - Update `MANIFEST.md`: Set Task 8 status to "Completed" with completion date
   - Add monitoring files to "Files Created"
   - Add alert test results to implementation notes
   - Move to `task-09-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
