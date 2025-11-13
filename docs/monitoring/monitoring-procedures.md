# Status Update Job Monitoring Procedures

## Overview

This document describes how to monitor the `update-installment-statuses` job, configure alerts, and maintain the monitoring infrastructure.

**Job Name:** `update-installment-statuses`
**Schedule:** Daily at 2:00 AM (agency timezone dependent)
**Monitoring Level:** Production-critical system job

## Table of Contents

1. [Monitoring Architecture](#monitoring-architecture)
2. [Dashboard Setup](#dashboard-setup)
3. [Alert Configuration](#alert-configuration)
4. [Daily Monitoring Tasks](#daily-monitoring-tasks)
5. [Performance Baselines](#performance-baselines)
6. [Notification Channels](#notification-channels)
7. [Testing Procedures](#testing-procedures)

---

## Monitoring Architecture

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring System                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐     ┌──────────────────┐            │
│  │   jobs_log       │────▶│  pg_notify       │            │
│  │   Table          │     │  Trigger         │            │
│  └──────────────────┘     └──────────────────┘            │
│           │                        │                        │
│           │                        ▼                        │
│           │              ┌──────────────────┐              │
│           │              │ Notification     │              │
│           │              │ Listeners        │              │
│           │              └──────────────────┘              │
│           │                        │                        │
│           │              ┌─────────┴─────────┐             │
│           │              ▼                   ▼             │
│           │         ┌────────┐         ┌────────┐         │
│           │         │ Slack  │         │ Email  │         │
│           │         └────────┘         └────────┘         │
│           │                                                 │
│           ▼                                                 │
│  ┌──────────────────┐     ┌──────────────────┐           │
│  │ check-job-health │     │  job-metrics     │           │
│  │ Edge Function    │     │  API             │           │
│  └──────────────────┘     └──────────────────┘           │
│           │                        │                        │
│           │                        ▼                        │
│           ▼              ┌──────────────────┐              │
│  ┌──────────────────┐   │  External        │              │
│  │  Scheduled       │   │  Dashboards      │              │
│  │  Health Checks   │   │  (Grafana, etc)  │              │
│  └──────────────────┘   └──────────────────┘              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Job Execution:** Edge Function runs and logs to `jobs_log` table
2. **Immediate Alerts:** pg_notify trigger fires on job failure
3. **Periodic Health Checks:** `check-job-health` function runs hourly
4. **Metrics Export:** `job-metrics` API provides data for dashboards
5. **Notification Delivery:** Slack/email notifications sent to administrators

---

## Dashboard Setup

### Option 1: Supabase Dashboard (Recommended for Quick Setup)

**Advantages:**
- Free, built-in
- No additional infrastructure
- Direct SQL access

**Setup Steps:**

1. Navigate to Supabase Dashboard → SQL Editor
2. Create favorite queries from `docs/monitoring/status-update-job-queries.sql`:

   a. **Recent Executions**
   ```sql
   -- Save as "Job: Recent Executions"
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
   ```

   b. **Health Status**
   ```sql
   -- Save as "Job: Health Check"
   WITH latest_run AS (
     SELECT
       started_at,
       completed_at,
       status,
       error_message,
       records_updated
     FROM jobs_log
     WHERE job_name = 'update-installment-statuses'
     ORDER BY started_at DESC
     LIMIT 1
   )
   SELECT
     CASE
       WHEN lr.status = 'failed' THEN 'CRITICAL'
       WHEN now() - lr.started_at > INTERVAL '25 hours' THEN 'WARNING'
       WHEN lr.status = 'success' THEN 'OK'
       ELSE 'UNKNOWN'
     END AS health_status,
     lr.started_at AS last_run,
     lr.status AS last_status,
     lr.records_updated,
     lr.error_message
   FROM latest_run lr;
   ```

   c. **Success Rate (Last 30 Days)**
   ```sql
   -- Save as "Job: Success Rate"
   SELECT
     COUNT(*) AS total_runs,
     COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
     COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
     ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) AS success_rate
   FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
     AND started_at > now() - INTERVAL '30 days';
   ```

3. Access queries from: SQL Editor → Favorites

**Dashboard Checklist:**
- [ ] Recent Executions query saved
- [ ] Health Status query saved
- [ ] Success Rate query saved
- [ ] Failed Jobs query saved
- [ ] Performance metrics query saved

---

### Option 2: External Dashboard (Grafana, Metabase)

**Advantages:**
- Rich visualizations
- Historical trending
- Custom alerts

**Setup with Grafana:**

1. **Install Grafana** (if not already running)
   ```bash
   docker run -d -p 3000:3000 --name=grafana grafana/grafana
   ```

2. **Add PostgreSQL Data Source:**
   - Go to Configuration → Data Sources → Add data source
   - Select PostgreSQL
   - Enter Supabase database credentials:
     - Host: `db.<project-ref>.supabase.co`
     - Database: `postgres`
     - User: `postgres`
     - Password: [from Supabase Settings → Database]
     - SSL Mode: `require`

3. **Import Job Metrics Dashboard:**
   - Create new dashboard
   - Add panel: "Job Success Rate"
     ```sql
     SELECT
       DATE(started_at) as time,
       ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) AS success_rate
     FROM jobs_log
     WHERE job_name = 'update-installment-statuses'
       AND started_at > now() - INTERVAL '30 days'
       AND $__timeFilter(started_at)
     GROUP BY DATE(started_at)
     ORDER BY time;
     ```

   - Add panel: "Execution Duration Trend"
     ```sql
     SELECT
       started_at as time,
       EXTRACT(EPOCH FROM (completed_at - started_at)) AS duration_seconds
     FROM jobs_log
     WHERE job_name = 'update-installment-statuses'
       AND status = 'success'
       AND $__timeFilter(started_at)
     ORDER BY time;
     ```

   - Add panel: "Records Updated per Day"
     ```sql
     SELECT
       DATE(started_at) as time,
       SUM(records_updated) AS total_records
     FROM jobs_log
     WHERE job_name = 'update-installment-statuses'
       AND status = 'success'
       AND $__timeFilter(started_at)
     GROUP BY DATE(started_at)
     ORDER BY time;
     ```

4. **Alternative: Use Job Metrics API**
   - Add JSON API data source
   - URL: `https://<project-ref>.supabase.co/functions/v1/job-metrics`
   - Parse JSON and create visualizations

---

## Alert Configuration

### Alert 1: Job Failure (Immediate)

**Trigger:** Job status changes to 'failed'
**Latency:** < 1 minute
**Method:** PostgreSQL pg_notify + listener

**Setup:**

1. **Deploy Database Trigger:**
   ```bash
   psql -f supabase/migrations/drafts/job_failure_alerts.sql
   ```

2. **Set Up Notification Listener (Choose One):**

   **Option A: Slack Webhook**
   ```bash
   # Set environment variable in Supabase dashboard
   # Settings → Edge Functions → Secrets
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

   **Option B: Email via Resend**
   ```bash
   # Set environment variables
   RESEND_API_KEY=re_xxxxxxxxxxxxx
   ALERT_EMAIL_TO=admin@yourdomain.com
   ALERT_EMAIL_FROM=alerts@yourdomain.com
   ```

3. **Deploy Notification Listener:**

   Create a Node.js listener script (runs on your server or container):
   ```javascript
   // listener.js
   const { Client } = require('pg');
   const fetch = require('node-fetch');

   const client = new Client({
     connectionString: process.env.DATABASE_URL,
   });

   async function sendSlackAlert(payload) {
     await fetch(process.env.SLACK_WEBHOOK_URL, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         text: `:rotating_light: Job Failed: ${payload.job_name}`,
         blocks: [
           {
             type: 'section',
             text: {
               type: 'mrkdwn',
               text: `*Error:* ${payload.error_message}\n*Time:* ${payload.alert_time}`,
             },
           },
         ],
       }),
     });
   }

   async function main() {
     await client.connect();
     await client.query('LISTEN job_failure');

     console.log('Listening for job failure notifications...');

     client.on('notification', async (msg) => {
       const payload = JSON.parse(msg.payload);
       console.log('Job failure detected:', payload);

       try {
         await sendSlackAlert(payload);
         console.log('Alert sent successfully');
       } catch (error) {
         console.error('Failed to send alert:', error);
       }
     });

     // Keep alive
     setInterval(() => client.query('SELECT 1'), 60000);
   }

   main().catch(console.error);
   ```

   Run as a service:
   ```bash
   # Using systemd
   sudo nano /etc/systemd/system/job-alert-listener.service
   ```

   ```ini
   [Unit]
   Description=Job Alert Listener
   After=network.target

   [Service]
   Type=simple
   User=pleeno
   WorkingDirectory=/opt/pleeno
   Environment="DATABASE_URL=postgresql://..."
   Environment="SLACK_WEBHOOK_URL=https://..."
   ExecStart=/usr/bin/node listener.js
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```

   ```bash
   sudo systemctl enable job-alert-listener
   sudo systemctl start job-alert-listener
   ```

---

### Alert 2: Missed Execution (Hourly Check)

**Trigger:** No job execution in > 25 hours
**Latency:** Up to 1 hour (depends on check frequency)
**Method:** Scheduled Edge Function

**Setup:**

1. **Deploy Health Check Function:**
   ```bash
   supabase functions deploy check-job-health
   ```

2. **Set Environment Variables:**
   ```bash
   supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxx
   supabase secrets set ALERT_EMAIL_TO=admin@yourdomain.com
   ```

3. **Schedule Hourly Execution (Choose One):**

   **Option A: External Cron Service (cron-job.org)**
   - URL: `https://<project-ref>.supabase.co/functions/v1/check-job-health`
   - Schedule: Every hour (`0 * * * *`)
   - Method: GET

   **Option B: GitHub Actions**
   ```yaml
   # .github/workflows/job-health-check.yml
   name: Job Health Check
   on:
     schedule:
       - cron: '0 * * * *'  # Every hour
   jobs:
     health-check:
       runs-on: ubuntu-latest
       steps:
         - name: Check Job Health
           run: |
             curl -f https://${{ secrets.SUPABASE_PROJECT_REF }}.supabase.co/functions/v1/check-job-health \
               -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
   ```

   **Option C: AWS EventBridge / Google Cloud Scheduler**
   - Create scheduled event every hour
   - Target: HTTP endpoint
   - URL: `https://<project-ref>.supabase.co/functions/v1/check-job-health`

4. **Test Health Check:**
   ```bash
   curl https://<project-ref>.supabase.co/functions/v1/check-job-health
   ```

---

## Daily Monitoring Tasks

### Morning Check (5 minutes)

**Task:** Verify overnight job execution

1. **Check Dashboard:**
   - Open Supabase Dashboard → SQL Editor → Favorites
   - Run "Job: Health Check" query
   - Verify status is "OK"

2. **Review Last Run:**
   - Run "Job: Recent Executions" query
   - Verify last run was within 24 hours
   - Check `records_updated` is reasonable (not 0 if expecting updates)

3. **Check for Failures:**
   - Run "Job: Failed Jobs (Last 7 Days)" query
   - If any failures, review error messages
   - Follow runbook if action needed

**Expected Results:**
- ✅ Health status: "OK"
- ✅ Last run: Within 24 hours
- ✅ Status: "success"
- ✅ No failures in last 24 hours

---

### Weekly Review (15 minutes)

**Task:** Analyze job performance trends

1. **Success Rate:**
   ```sql
   -- Should be >95%
   SELECT
     COUNT(*) AS total_runs,
     COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
     ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) AS success_rate
   FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
     AND started_at > now() - INTERVAL '7 days';
   ```

2. **Performance Metrics:**
   ```sql
   -- Average duration should be consistent
   SELECT
     AVG(completed_at - started_at) AS avg_duration,
     MAX(completed_at - started_at) AS max_duration
   FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
     AND status = 'success'
     AND started_at > now() - INTERVAL '7 days';
   ```

3. **Records Updated Trend:**
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

**Action Items:**
- If success rate < 95%: Investigate recurring issues
- If duration increasing: Check database performance
- If records_updated dropping: Verify data pipeline

---

### Monthly Audit (30 minutes)

**Task:** Comprehensive health check and optimization

1. **Run All Monitoring Queries:**
   - Execute all queries in `docs/monitoring/status-update-job-queries.sql`
   - Export results for records

2. **Test Alert System:**
   - Simulate job failure (see Testing Procedures below)
   - Verify alerts received within 5 minutes

3. **Review Runbook:**
   - Update based on new failure scenarios encountered
   - Add any new troubleshooting steps

4. **Database Maintenance:**
   - Consider archiving old job logs (>90 days)
   ```sql
   -- Archive old logs (optional)
   DELETE FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
     AND started_at < now() - INTERVAL '90 days';
   ```

---

## Performance Baselines

### Normal Operating Parameters

| Metric | Expected Value | Alert Threshold |
|--------|---------------|-----------------|
| Success Rate (30 days) | >98% | <95% |
| Execution Duration | 5-30 seconds | >60 seconds |
| Records Updated (per run) | 0-100 (varies) | N/A (data-dependent) |
| Execution Frequency | Every 24±1 hours | >25 hours |
| Error Rate | <2% | >5% |

### Performance Degradation Indicators

- **Duration increasing trend:** May indicate database performance issues
- **Success rate declining:** Check for infrastructure or code issues
- **Zero updates for multiple days:** Verify data pipeline is feeding installments

---

## Notification Channels

### Slack Alerts

**Channel:** `#job-alerts` (recommended) or `#engineering-alerts`

**Message Format:**
```
🚨 Job Failed: update-installment-statuses
Job Name: update-installment-statuses
Error: Connection timeout after 3 retries
Time: 2025-11-13T02:05:00Z
[View Logs]
```

**Setup:**
1. Create incoming webhook: Slack Settings → Apps → Incoming Webhooks
2. Set `SLACK_WEBHOOK_URL` in Edge Function secrets
3. Test with: `curl -X POST <webhook-url> -d '{"text":"Test alert"}'`

---

### Email Alerts

**Recipients:** Primary on-call engineer, backup contact

**Email Format:**
- Subject: "ALERT: Job Failed - update-installment-statuses"
- Body: HTML formatted with error details, action buttons

**Setup:**
1. Sign up for Resend: https://resend.com
2. Verify sending domain
3. Get API key
4. Set environment variables (see Alert Configuration above)

---

## Testing Procedures

### Test 1: Simulate Job Failure

**Purpose:** Verify failure alerts are sent correctly

**Steps:**

1. Insert a test failed job:
   ```sql
   INSERT INTO jobs_log (job_name, started_at, completed_at, status, error_message)
   VALUES (
     'update-installment-statuses',
     now(),
     now(),
     'failed',
     'TEST ALERT - Please ignore this simulated failure'
   );
   ```

2. Verify alert received:
   - Check Slack channel for alert within 1 minute
   - Check email inbox for alert within 5 minutes

3. Clean up test data:
   ```sql
   DELETE FROM jobs_log
   WHERE error_message = 'TEST ALERT - Please ignore this simulated failure';
   ```

**Expected Result:**
- ✅ Slack alert received within 1 minute
- ✅ Email alert received within 5 minutes
- ✅ Alert contains correct job name and error message

---

### Test 2: Simulate Missed Execution

**Purpose:** Verify health check detects missed runs

**Steps:**

1. Stop scheduled job temporarily:
   ```sql
   SELECT cron.unschedule('update-installment-statuses-daily');
   ```

2. Wait >25 hours (or manually call health check):
   ```bash
   curl https://<project-ref>.supabase.co/functions/v1/check-job-health
   ```

3. Verify alert sent

4. Re-enable scheduled job:
   ```sql
   -- Re-run migration to recreate schedule
   \i supabase/migrations/drafts/pg_cron_schedule.sql
   ```

**Expected Result:**
- ✅ Health check returns status: "critical"
- ✅ Alert sent via configured channels
- ✅ Alert indicates hours since last run

---

### Test 3: End-to-End Job Execution

**Purpose:** Verify full job pipeline works

**Steps:**

1. Create test data (pending installment past due):
   ```sql
   -- Use existing test agency or create one
   INSERT INTO installments (payment_plan_id, amount, student_due_date, status)
   VALUES (
     '<test-payment-plan-id>',
     100.00,
     CURRENT_DATE - INTERVAL '2 days',  -- Past due
     'pending'
   );
   ```

2. Manually trigger job:
   ```bash
   curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
     -H "Authorization: Bearer <service-role-key>"
   ```

3. Verify results:
   ```sql
   -- Check job log
   SELECT * FROM jobs_log
   WHERE job_name = 'update-installment-statuses'
   ORDER BY started_at DESC
   LIMIT 1;

   -- Check installment updated
   SELECT * FROM installments
   WHERE id = '<test-installment-id>';
   ```

4. Clean up test data

**Expected Result:**
- ✅ Job completes successfully
- ✅ Installment status updated to 'overdue'
- ✅ Job log shows records_updated >= 1

---

## Maintenance Schedule

| Task | Frequency | Duration | Owner |
|------|-----------|----------|-------|
| Morning health check | Daily | 5 min | On-call engineer |
| Weekly performance review | Weekly | 15 min | DevOps team |
| Monthly audit | Monthly | 30 min | System admin |
| Alert system test | Monthly | 15 min | DevOps team |
| Runbook review | Quarterly | 30 min | Engineering lead |

---

## Troubleshooting

For detailed troubleshooting procedures, see:
**[Status Update Job Troubleshooting Runbook](../runbooks/status-update-job-failures.md)**

Quick reference:
- Job failures → Check runbook Section 1-7
- Alert not received → Test notification channels
- Dashboard not updating → Verify data source connection

---

## Related Documentation

- [Monitoring Queries](./status-update-job-queries.sql)
- [Troubleshooting Runbook](../runbooks/status-update-job-failures.md)
- [Edge Function Source](../../supabase/functions/update-installment-statuses/index.ts)
- [Job Metrics API](../../supabase/functions/job-metrics/index.ts)
- [Health Check Function](../../supabase/functions/check-job-health/index.ts)

---

**Last Updated:** 2025-11-13
**Document Owner:** DevOps Team
**Next Review Date:** 2025-12-13
