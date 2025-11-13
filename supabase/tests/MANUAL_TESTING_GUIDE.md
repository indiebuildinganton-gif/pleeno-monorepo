# Manual Testing Guide: Automated Status Detection Job

This guide provides step-by-step instructions for manually testing the automated status detection job components.

## Prerequisites

- Supabase CLI installed and configured
- Local Supabase instance running (`supabase start`)
- Access to Supabase Studio (http://localhost:54323)
- PostgreSQL client (psql) access

## Table of Contents

1. [SQL Function Manual Testing](#1-sql-function-manual-testing)
2. [Edge Function Manual Testing](#2-edge-function-manual-testing)
3. [pg_cron Schedule Testing](#3-pg_cron-schedule-testing)
4. [API Key Authentication Testing](#4-api-key-authentication-testing)
5. [Multi-Agency Timezone Testing](#5-multi-agency-timezone-testing)
6. [Error Handling and Retry Logic Testing](#6-error-handling-and-retry-logic-testing)
7. [Monitoring and Logging Testing](#7-monitoring-and-logging-testing)

---

## 1. SQL Function Manual Testing

### Test 1.1: Basic Function Execution

**Objective**: Verify the `update_installment_statuses()` function executes successfully.

**Steps**:

```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Execute the function
SELECT * FROM update_installment_statuses();
```

**Expected Result**:
- Function returns rows with `agency_id`, `updated_count`, and `transitions`
- No errors thrown

### Test 1.2: Installment Status Transitions

**Objective**: Verify installments transition from `pending` to `overdue` correctly.

**Steps**:

```sql
-- 1. Create test agency
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time)
VALUES (
  'manual-test-agency-001',
  'Manual Test Agency',
  'Australia/Brisbane',
  '17:00'
);

-- 2. Create active payment plan
INSERT INTO payment_plans (id, agency_id, status, expected_commission)
VALUES (
  'manual-test-plan-001',
  'manual-test-agency-001',
  'active',
  1000.00
);

-- 3. Create overdue installment (due yesterday)
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount)
VALUES (
  'manual-test-inst-001',
  'manual-test-plan-001',
  'pending',
  CURRENT_DATE - INTERVAL '1 day',
  100.00
);

-- 4. Check initial status
SELECT status FROM installments WHERE id = 'manual-test-inst-001';
-- Expected: 'pending'

-- 5. Run function
SELECT * FROM update_installment_statuses()
WHERE agency_id = 'manual-test-agency-001';

-- 6. Check updated status
SELECT status FROM installments WHERE id = 'manual-test-inst-001';
-- Expected: 'overdue'

-- 7. Cleanup
DELETE FROM installments WHERE id = 'manual-test-inst-001';
DELETE FROM payment_plans WHERE id = 'manual-test-plan-001';
DELETE FROM agencies WHERE id = 'manual-test-agency-001';
```

**Expected Result**:
- Status changes from `pending` to `overdue`
- Function returns `updated_count = 1` for the test agency

### Test 1.3: Inactive Plans Ignored

**Objective**: Verify installments for cancelled/inactive plans are not updated.

**Steps**:

```sql
-- 1. Create test agency
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time)
VALUES ('manual-test-agency-002', 'Test Agency 2', 'Australia/Brisbane', '17:00');

-- 2. Create CANCELLED payment plan
INSERT INTO payment_plans (id, agency_id, status, expected_commission)
VALUES ('manual-test-plan-002', 'manual-test-agency-002', 'cancelled', 1000.00);

-- 3. Create overdue installment for cancelled plan
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount)
VALUES (
  'manual-test-inst-002',
  'manual-test-plan-002',
  'pending',
  CURRENT_DATE - INTERVAL '5 days',
  100.00
);

-- 4. Run function
SELECT * FROM update_installment_statuses();

-- 5. Check status (should remain 'pending')
SELECT status FROM installments WHERE id = 'manual-test-inst-002';
-- Expected: 'pending' (NOT 'overdue')

-- 6. Cleanup
DELETE FROM installments WHERE id = 'manual-test-inst-002';
DELETE FROM payment_plans WHERE id = 'manual-test-plan-002';
DELETE FROM agencies WHERE id = 'manual-test-agency-002';
```

**Expected Result**:
- Status remains `pending` (not updated to `overdue`)

---

## 2. Edge Function Manual Testing

### Test 2.1: Deploy Edge Function

**Steps**:

```bash
# Deploy the Edge Function
supabase functions deploy update-installment-statuses

# Verify deployment
supabase functions list
```

**Expected Result**:
- Function listed as deployed
- No deployment errors

### Test 2.2: Invoke Edge Function via CLI

**Steps**:

```bash
# Get function API key from environment
echo $SUPABASE_FUNCTION_KEY

# Invoke function
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/update-installment-statuses' \
  --header "Authorization: Bearer $SUPABASE_ANON_KEY" \
  --header "X-API-Key: $SUPABASE_FUNCTION_KEY" \
  --header 'Content-Type: application/json'
```

**Expected Result**:
- HTTP 200 status code
- JSON response with:
  ```json
  {
    "success": true,
    "recordsUpdated": <number>,
    "agencies": [...]
  }
  ```

### Test 2.3: Edge Function Response Structure

**Objective**: Verify response includes all required fields.

**Steps**:

```bash
# Invoke and parse response
curl --location --request POST \
  'http://localhost:54321/functions/v1/update-installment-statuses' \
  --header "X-API-Key: $SUPABASE_FUNCTION_KEY" \
  --header 'Content-Type: application/json' | jq
```

**Expected Result**:

```json
{
  "success": true,
  "recordsUpdated": 5,
  "agencies": [
    {
      "agency_id": "...",
      "updated_count": 3,
      "transitions": {
        "pending_to_overdue": 3
      }
    },
    {
      "agency_id": "...",
      "updated_count": 2,
      "transitions": {
        "pending_to_overdue": 2
      }
    }
  ]
}
```

---

## 3. pg_cron Schedule Testing

### Test 3.1: Verify pg_cron Extension Enabled

**Steps**:

```sql
-- Check pg_cron extension
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
```

**Expected Result**:
- pg_cron extension is installed

### Test 3.2: Verify Scheduled Job Exists

**Steps**:

```sql
-- List all cron jobs
SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';
```

**Expected Result**:
- Job exists with schedule `0 7 * * *` (7:00 AM UTC daily)

### Test 3.3: Manual Cron Job Trigger

**Objective**: Manually trigger the cron job to test end-to-end flow.

**Steps**:

```sql
-- Manually invoke the same HTTP call that pg_cron makes
SELECT net.http_post(
  url := 'http://localhost:54321/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS result;

-- Check jobs_log for execution
SELECT * FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;
```

**Expected Result**:
- HTTP call succeeds (status 200)
- jobs_log entry created with status `success`

### Test 3.4: Verify Recent Cron Runs

**Steps**:

```sql
-- Check cron job execution history
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC
LIMIT 5;
```

**Expected Result**:
- Recent execution records visible
- Status shows success or error details

---

## 4. API Key Authentication Testing

### Test 4.1: Valid API Key → Success

**Steps**:

```bash
# Call with valid API key
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/update-installment-statuses' \
  --header "X-API-Key: $SUPABASE_FUNCTION_KEY" \
  --header 'Content-Type: application/json'
```

**Expected Result**:
- HTTP 200 status code
- Successful response with data

### Test 4.2: Invalid API Key → 401 Unauthorized

**Steps**:

```bash
# Call with invalid API key
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/update-installment-statuses' \
  --header "X-API-Key: invalid-key-12345" \
  --header 'Content-Type: application/json'
```

**Expected Result**:
- HTTP 401 status code
- Error message: `{"error": "Unauthorized"}`

### Test 4.3: Missing API Key → 401 Unauthorized

**Steps**:

```bash
# Call without API key header
curl -i --location --request POST \
  'http://localhost:54321/functions/v1/update-installment-statuses' \
  --header 'Content-Type: application/json'
```

**Expected Result**:
- HTTP 401 status code
- Error message: `{"error": "Unauthorized"}`

---

## 5. Multi-Agency Timezone Testing

### Test 5.1: Multiple Agencies with Different Timezones

**Objective**: Verify function correctly handles agencies in different timezones.

**Steps**:

```sql
-- 1. Create agencies in different timezones
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time) VALUES
  ('tz-test-brisbane', 'Brisbane Agency', 'Australia/Brisbane', '17:00'),
  ('tz-test-la', 'LA Agency', 'America/Los_Angeles', '17:00'),
  ('tz-test-tokyo', 'Tokyo Agency', 'Asia/Tokyo', '17:00');

-- 2. Create active payment plans for each
INSERT INTO payment_plans (id, agency_id, status, expected_commission) VALUES
  ('tz-plan-brisbane', 'tz-test-brisbane', 'active', 1000),
  ('tz-plan-la', 'tz-test-la', 'active', 1000),
  ('tz-plan-tokyo', 'tz-test-tokyo', 'active', 1000);

-- 3. Create overdue installments for each agency
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount) VALUES
  ('tz-inst-brisbane', 'tz-plan-brisbane', 'pending', CURRENT_DATE - INTERVAL '2 days', 100),
  ('tz-inst-la', 'tz-plan-la', 'pending', CURRENT_DATE - INTERVAL '2 days', 100),
  ('tz-inst-tokyo', 'tz-plan-tokyo', 'pending', CURRENT_DATE - INTERVAL '2 days', 100);

-- 4. Run function
SELECT * FROM update_installment_statuses()
WHERE agency_id IN ('tz-test-brisbane', 'tz-test-la', 'tz-test-tokyo')
ORDER BY agency_id;

-- 5. Verify all installments updated
SELECT
  a.name,
  a.timezone,
  i.status
FROM installments i
JOIN payment_plans pp ON i.payment_plan_id = pp.id
JOIN agencies a ON pp.agency_id = a.id
WHERE a.id IN ('tz-test-brisbane', 'tz-test-la', 'tz-test-tokyo');

-- 6. Cleanup
DELETE FROM installments WHERE id IN ('tz-inst-brisbane', 'tz-inst-la', 'tz-inst-tokyo');
DELETE FROM payment_plans WHERE id IN ('tz-plan-brisbane', 'tz-plan-la', 'tz-plan-tokyo');
DELETE FROM agencies WHERE id IN ('tz-test-brisbane', 'tz-test-la', 'tz-test-tokyo');
```

**Expected Result**:
- Function returns 3 rows (one per agency)
- All installments transition to `overdue`
- Each agency processed with its own timezone

---

## 6. Error Handling and Retry Logic Testing

### Test 6.1: Transient Error Simulation

**Objective**: Verify retry logic activates for transient errors.

**Note**: This requires temporarily modifying the Edge Function or database to simulate errors.

**Steps**:

1. Modify Edge Function to inject error:
```typescript
// In index.ts, before database call
if (Math.random() < 0.5) {
  throw new Error("connection timeout");
}
```

2. Deploy and invoke function multiple times
3. Check Edge Function logs for retry attempts

**Expected Result**:
- Function retries up to 3 times
- Exponential backoff observed (1s, 2s, 4s delays)
- Eventually succeeds or logs error

### Test 6.2: Permanent Error (No Retry)

**Steps**:

1. Call function with invalid authentication (permanent error)
2. Check logs for retry behavior

**Expected Result**:
- No retry attempts
- Immediate failure response

---

## 7. Monitoring and Logging Testing

### Test 7.1: jobs_log Table Entries

**Steps**:

```sql
-- Query recent job executions
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
LIMIT 10;
```

**Expected Result**:
- Each job execution has an entry
- Entries include:
  - `started_at` timestamp
  - `completed_at` timestamp
  - `records_updated` count
  - `status`: 'success' or 'failed'
  - `metadata` with agency-level details

### Test 7.2: Job Execution Duration

**Steps**:

```sql
-- Calculate job execution durations
SELECT
  job_name,
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
ORDER BY started_at DESC
LIMIT 10;
```

**Expected Result**:
- Duration values are reasonable (typically < 5 seconds)
- No jobs stuck in `running` state

### Test 7.3: Failed Jobs Detection

**Steps**:

```sql
-- Find failed job executions
SELECT
  job_name,
  started_at,
  error_message,
  metadata
FROM jobs_log
WHERE status = 'failed'
ORDER BY started_at DESC;
```

**Expected Result**:
- Failed jobs (if any) have descriptive error messages
- Error stack traces available in metadata

### Test 7.4: Agency-Level Results in Metadata

**Steps**:

```sql
-- Extract agency-level results from metadata
SELECT
  started_at,
  metadata->'total_agencies_processed' AS total_agencies,
  jsonb_pretty(metadata->'agencies') AS agency_details
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
ORDER BY started_at DESC
LIMIT 1;
```

**Expected Result**:
- Metadata contains `total_agencies_processed` count
- Metadata contains `agencies` array with per-agency results

---

## Test Results Checklist

Use this checklist to track manual testing progress:

### SQL Function Tests
- [ ] Function executes without errors
- [ ] Installments transition from pending → overdue
- [ ] Inactive/cancelled plans ignored
- [ ] Future due dates remain pending
- [ ] Already overdue/paid installments unchanged

### Edge Function Tests
- [ ] Function deploys successfully
- [ ] Function invocation via curl succeeds
- [ ] Response structure is correct
- [ ] CORS headers present

### API Authentication Tests
- [ ] Valid API key → 200 OK
- [ ] Invalid API key → 401 Unauthorized
- [ ] Missing API key → 401 Unauthorized

### pg_cron Tests
- [ ] Scheduled job exists
- [ ] Manual trigger succeeds
- [ ] jobs_log entry created
- [ ] Recent execution history visible

### Multi-Agency Tests
- [ ] Multiple agencies processed
- [ ] Different timezones respected
- [ ] Per-agency results returned

### Error Handling Tests
- [ ] Transient errors trigger retries
- [ ] Permanent errors don't retry
- [ ] Exponential backoff observed

### Monitoring Tests
- [ ] jobs_log entries created
- [ ] Execution duration reasonable
- [ ] Failed jobs logged with errors
- [ ] Metadata structure correct

---

## Troubleshooting

### Issue: Function not found
**Solution**: Ensure SQL migration has been applied:
```bash
supabase db reset
```

### Issue: Edge Function 401 error with valid key
**Solution**: Check environment variables:
```bash
supabase functions deploy update-installment-statuses --no-verify-jwt
```

### Issue: pg_cron job not running
**Solution**: Check pg_cron extension and job schedule:
```sql
SELECT cron.schedule('update-installment-statuses-daily', '0 7 * * *', $$...$$);
```

### Issue: No jobs_log entries
**Solution**: Verify jobs_log table exists and RLS policies allow inserts from service_role.

---

## Next Steps

After completing manual testing:

1. Document any issues found in GitHub issues
2. Update MANIFEST.md with test results
3. Proceed to Task 8: Monitoring and Alerting Setup
