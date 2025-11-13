# Story 5-1: Automated Status Detection Job - Task 10

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 10: Documentation

### Description
Create comprehensive documentation covering deployment procedures, operational guides, troubleshooting, and architectural decisions. This ensures the team can maintain and debug the automated status detection system.

### Implementation Checklist
- [ ] Document Edge Function deployment procedure
- [ ] Document API key configuration and rotation
- [ ] Document how to manually trigger status update job (for testing/debugging)
- [ ] Document monitoring and alerting setup
- [ ] Document troubleshooting procedures (what to do if job fails)
- [ ] Add inline code comments explaining timezone handling and cutoff logic
- [ ] Update architecture.md with operational procedures
- [ ] Create operational runbook for common scenarios
- [ ] Document testing procedures for future changes

### Acceptance Criteria
All acceptance criteria are documented:
- AC 1: Automated Status Detection (timezone logic documented)
- AC 2: Scheduled Execution (deployment and schedule documented)
- AC 3: Execution Logging and Monitoring (monitoring setup documented)
- AC 4: Reliability and Error Handling (troubleshooting documented)
- AC 5: Security and Access Control (API key procedures documented)

### Documentation Files to Create/Update

#### 1. Edge Function README

**File: `supabase/functions/update-installment-statuses/README.md`**

```markdown
# Update Installment Statuses Edge Function

## Overview

This Edge Function is invoked daily by pg_cron to automatically mark overdue installments. It calls the `update_installment_statuses()` PostgreSQL function and logs execution results.

## Deployment

### Initial Deployment

```bash
# Deploy function
supabase functions deploy update-installment-statuses

# Set API key secret
supabase secrets set SUPABASE_FUNCTION_KEY="<your-api-key>"

# Verify deployment
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <your-api-key>"
```

### Updating the Function

```bash
# Make code changes to index.ts

# Redeploy
supabase functions deploy update-installment-statuses

# Test
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <your-api-key>"

# Check logs
supabase functions logs update-installment-statuses
```

## Manual Invocation

### Via curl

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json"
```

### Via PostgreSQL

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

### Via Supabase Dashboard

1. Go to Edge Functions > update-installment-statuses
2. Click "Invoke Function"
3. Add header: `X-API-Key: <your-api-key>`
4. Click "Send Request"

## Response Format

**Success (200):**
```json
{
  "success": true,
  "recordsUpdated": 8,
  "agencies": [
    {
      "agency_id": "a1...",
      "updated_count": 5,
      "transitions": {
        "pending_to_overdue": 5
      }
    },
    {
      "agency_id": "a2...",
      "updated_count": 3,
      "transitions": {
        "pending_to_overdue": 3
      }
    }
  ]
}
```

**Error (401):**
```json
{
  "error": "Unauthorized"
}
```

**Error (500):**
```json
{
  "success": false,
  "recordsUpdated": 0,
  "agencies": [],
  "error": "Database connection timeout"
}
```

## Environment Variables

- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase
- `SUPABASE_FUNCTION_KEY` - Custom API key (set via `supabase secrets set`)

## Monitoring

### View Logs

```bash
# Tail logs in real-time
supabase functions logs update-installment-statuses --tail

# View last 100 lines
supabase functions logs update-installment-statuses --limit 100
```

### Check Execution History

```sql
SELECT * FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;
```

## Troubleshooting

See [Troubleshooting Runbook](../../../docs/runbooks/status-update-job-failures.md) for common issues and solutions.
```

#### 2. API Key Management Guide

**File: `docs/operations/api-key-management.md`**

```markdown
# API Key Management for Status Update Job

## Overview

The status update job uses API key authentication to protect the Edge Function endpoint. Only pg_cron and authorized administrators can trigger the job.

## Initial Setup

### 1. Generate API Key

```bash
# Option 1: UUID v4
uuidgen | tr '[:upper:]' '[:lower:]'

# Option 2: Random hex string (32 characters)
openssl rand -hex 16
```

### 2. Store in Supabase Secrets

```bash
supabase secrets set SUPABASE_FUNCTION_KEY="<generated-key>"

# Verify (shows masked value)
supabase secrets list
```

### 3. Update PostgreSQL Setting

```sql
ALTER DATABASE postgres SET app.supabase_function_key = '<generated-key>';

-- Verify
SELECT current_setting('app.supabase_function_key');
```

## API Key Rotation

### When to Rotate

- Scheduled rotation (recommended: every 90 days)
- After suspected compromise
- When access requirements change
- Before/after team member departure

### Rotation Procedure (Zero Downtime)

1. **Generate new key:**
   ```bash
   NEW_KEY=$(uuidgen | tr '[:upper:]' '[:lower:]')
   echo "New key: $NEW_KEY"
   ```

2. **Update Supabase secret:**
   ```bash
   supabase secrets set SUPABASE_FUNCTION_KEY="$NEW_KEY"
   ```

3. **Redeploy Edge Function:**
   ```bash
   supabase functions deploy update-installment-statuses
   ```

4. **Update PostgreSQL setting:**
   ```sql
   ALTER DATABASE postgres SET app.supabase_function_key = '<new-key>';
   ```

5. **Test:**
   ```bash
   curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
     -H "X-API-Key: $NEW_KEY"
   ```

6. **Monitor next scheduled run:**
   ```sql
   SELECT * FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
   ORDER BY started_at DESC LIMIT 1;
   ```

## Security Best Practices

- Never commit API keys to version control
- Store keys only in Supabase secrets vault
- Rotate keys every 90 days
- Use different keys for different environments (dev, staging, prod)
- Audit key usage via jobs_log table

## Troubleshooting

### Key Mismatch Error

**Symptoms:** Job fails with 401 Unauthorized

**Solution:**
1. Verify secret is set: `supabase secrets list`
2. Verify database setting: `SELECT current_setting('app.supabase_function_key');`
3. Ensure both match
4. Redeploy Edge Function if changed
```

#### 3. Operations Guide

**File: `docs/operations/status-update-job.md`**

```markdown
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
```

#### 4. Update Architecture Documentation

**File: `docs/architecture.md` (append to Pattern 3 section)**

```markdown
## Pattern 3: Automated Status State Machine - Operations

### Deployment Checklist

- [ ] Deploy Edge Function: `supabase functions deploy update-installment-statuses`
- [ ] Set API key secret: `supabase secrets set SUPABASE_FUNCTION_KEY="<key>"`
- [ ] Apply migration: `supabase db push`
- [ ] Verify pg_cron schedule: `SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';`
- [ ] Test manual execution
- [ ] Monitor first scheduled run

### Operational Procedures

**Daily Health Check:**
```sql
SELECT * FROM jobs_log WHERE job_name = 'update-installment-statuses' ORDER BY started_at DESC LIMIT 5;
```

**Manual Trigger:**
```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <key>"
```

**Emergency Disable:**
```sql
SELECT cron.unschedule('update-installment-statuses-daily');
```

### Monitoring Metrics

- **Success Rate:** > 99%
- **Average Duration:** < 10 seconds
- **Max Retries:** 3 per execution
- **Alert Latency:** < 5 minutes

### Testing Procedures

For testing changes to the status update logic:

1. Deploy to staging environment first
2. Create test agencies and installments with various due dates
3. Run manually: `SELECT * FROM update_installment_statuses();`
4. Verify results in jobs_log and installments tables
5. Test Edge Function: `curl ... -H "X-API-Key: <staging-key>"`
6. Monitor one full scheduled run
7. Deploy to production following deployment checklist

### Rollback Procedures

If issues arise after deployment:

1. **Disable schedule:** `SELECT cron.unschedule('update-installment-statuses-daily');`
2. **Roll back migration:** `supabase db reset` or apply down migration
3. **Roll back Edge Function:** Deploy previous version
4. **Investigate issue:** Review logs, jobs_log table, error messages
5. **Fix and redeploy:** Follow deployment checklist again
```

---

## Implementation Checklist

### Documentation Files Created

- [ ] `supabase/functions/update-installment-statuses/README.md`
- [ ] `docs/operations/api-key-management.md`
- [ ] `docs/operations/status-update-job.md`
- [ ] `docs/runbooks/status-update-job-failures.md` (from Task 8)
- [ ] `docs/monitoring/status-update-job-queries.sql` (from Task 8)
- [ ] Updated `docs/architecture.md` with operational procedures

### Code Comments Added

- [ ] Edge Function (index.ts): Comments explaining retry logic, API key validation
- [ ] SQL Function: Comments explaining timezone handling, cutoff logic
- [ ] Migration file: Section headers, purpose comments

### Testing Documentation

- [ ] Unit test procedures (Task 7)
- [ ] Integration test procedures (Task 7)
- [ ] Manual testing steps

---

## Next Steps

1. Create all documentation files listed above
2. Add inline code comments to Edge Function and SQL function
3. Update architecture.md with operational procedures
4. Review documentation for completeness and accuracy
5. Have team member review documentation
6. When Task 10 is complete:
   - Update `MANIFEST.md`: Set Task 10 status to "Completed" with completion date
   - Set overall story status to "Completed"
   - Add all documentation file paths to "Files Created"
   - Celebrate! Story 5.1 is complete! 🎉

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)

---

## Story Completion

Congratulations! You've completed all 10 tasks for Story 5.1: Automated Status Detection Job.

### What You've Built

- ✅ SQL function for timezone-aware status updates
- ✅ Jobs log table for execution tracking
- ✅ Supabase Edge Function with retry logic
- ✅ pg_cron scheduled job (daily at 7:00 AM UTC)
- ✅ API key authentication
- ✅ Agency timezone and cutoff time configuration
- ✅ Comprehensive test suite
- ✅ Monitoring and alerting infrastructure
- ✅ Complete migration file
- ✅ Operational documentation

### Next Stories

Story 5.1 lays the foundation for Epic 5: Intelligent Status Automation. Next stories include:

- **Story 5.2:** Due Soon Flags (uses `due_soon_threshold_days` field added in Task 6)
- **Story 5.3:** Overdue Payment Alerts (uses status updates from this story)
- **Story 5.4:** Overdue List View (displays installments marked overdue)
- **Story 5.5:** Email Notifications (triggered when status changes)

### Final Verification

Before moving to the next story, verify:

1. All acceptance criteria met
2. All tests passing
3. Migration applied successfully
4. Job running on schedule
5. Documentation complete
6. MANIFEST.md updated with all completed tasks

---

**🎉 Story 5.1 Complete! Ready to move to Story 5.2!**
