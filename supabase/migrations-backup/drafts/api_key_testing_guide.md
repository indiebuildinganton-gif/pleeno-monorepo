# API Key Authentication Testing Guide

## Overview

This guide provides comprehensive testing procedures for verifying API key authentication is working correctly for the `update-installment-statuses` Edge Function. All tests should pass before considering Task 5 complete.

## Testing Environment Setup

### Prerequisites

Before running tests:

- [ ] API key generated (see [api_key_setup_guide.md](api_key_setup_guide.md))
- [ ] Supabase secret `SUPABASE_FUNCTION_KEY` configured
- [ ] Database setting `app.supabase_function_key` configured
- [ ] Edge Function deployed to Supabase
- [ ] pg_cron job scheduled
- [ ] Database connection available
- [ ] curl or similar HTTP client installed

### Environment Variables

Set these for easier testing:

```bash
# Your Supabase project reference
export PROJECT_REF="your-project-ref"

# Your API key (use the actual generated key)
export API_KEY="5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba"

# Edge Function URL
export FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses"
```

## Test Suite

### Test Category 1: API Key Authentication (Edge Function)

These tests verify the Edge Function correctly validates API keys.

#### Test 1.1: Valid API Key Returns 200 OK

**Purpose**: Verify requests with valid API key are accepted

**Test Command**:
```bash
curl -X POST "$FUNCTION_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n" \
  -v
```

**Expected Result**:
- HTTP Status: `200 OK`
- Response body contains:
  ```json
  {
    "success": true,
    "recordsUpdated": <number>,
    "agencies": [...]
  }
  ```
- No "Unauthorized" error
- jobs_log table shows new entry with status 'success' or 'failed' (depending on database state)

**Verification**:
```sql
-- Check jobs_log for the execution
SELECT
  started_at,
  completed_at,
  status,
  records_updated
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;

-- Expected: Recent entry within last minute
```

**Pass Criteria**: ✅ HTTP 200 + JSON success response + jobs_log entry created

---

#### Test 1.2: Invalid API Key Returns 401 Unauthorized

**Purpose**: Verify requests with wrong API key are rejected

**Test Command**:
```bash
curl -X POST "$FUNCTION_URL" \
  -H "X-API-Key: invalid-wrong-key-12345" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result**:
- HTTP Status: `401 Unauthorized`
- Response body:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- No entry in jobs_log (authentication failed before job started)

**Verification**:
```sql
-- Verify no new jobs_log entry in last minute
SELECT COUNT(*) as recent_jobs
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND started_at > NOW() - INTERVAL '1 minute';

-- Expected: 0 (or same count as before test)
```

**Pass Criteria**: ✅ HTTP 401 + "Unauthorized" message + no jobs_log entry

---

#### Test 1.3: Missing API Key Returns 401 Unauthorized

**Purpose**: Verify requests without API key header are rejected

**Test Command**:
```bash
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result**:
- HTTP Status: `401 Unauthorized`
- Response body:
  ```json
  {
    "error": "Unauthorized"
  }
  ```
- No entry in jobs_log

**Pass Criteria**: ✅ HTTP 401 + "Unauthorized" message + no jobs_log entry

---

#### Test 1.4: Empty API Key Returns 401 Unauthorized

**Purpose**: Verify requests with empty API key value are rejected

**Test Command**:
```bash
curl -X POST "$FUNCTION_URL" \
  -H "X-API-Key: " \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result**:
- HTTP Status: `401 Unauthorized`
- Response body:
  ```json
  {
    "error": "Unauthorized"
  }
  ```

**Pass Criteria**: ✅ HTTP 401 + "Unauthorized" message

---

#### Test 1.5: Case-Sensitive API Key Validation

**Purpose**: Verify API key comparison is case-sensitive (if using hex keys)

**Test Command**:
```bash
# Convert key to uppercase (should fail)
UPPER_KEY=$(echo "$API_KEY" | tr '[:lower:]' '[:upper:]')

curl -X POST "$FUNCTION_URL" \
  -H "X-API-Key: $UPPER_KEY" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected Result**:
- HTTP Status: `401 Unauthorized`
- Authentication fails due to case mismatch

**Pass Criteria**: ✅ HTTP 401 (confirms case-sensitive validation)

**Note**: If using UUID format, case sensitivity may differ based on implementation.

---

### Test Category 2: PostgreSQL Database Setting

These tests verify the API key is correctly stored and accessible in PostgreSQL.

#### Test 2.1: Database Setting Exists

**Purpose**: Verify API key is configured in database

**Test Command**:
```sql
-- Check if setting exists and is not empty
SELECT
  current_setting('app.supabase_function_key') AS api_key,
  length(current_setting('app.supabase_function_key')) AS key_length;
```

**Expected Result**:
```
api_key                                                          | key_length
-----------------------------------------------------------------|-----------
5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba | 64
```

**Pass Criteria**: ✅ Setting exists, length matches generated key (64 for hex, 36 for UUID)

---

#### Test 2.2: Setting Not Set to Placeholder

**Purpose**: Verify actual API key was configured (not placeholder)

**Test Command**:
```sql
SELECT
  CASE
    WHEN current_setting('app.supabase_function_key', true) = 'placeholder-api-key-to-be-configured-in-task-5'
    THEN '❌ FAIL: Still using placeholder'
    WHEN current_setting('app.supabase_function_key', true) IS NULL
    THEN '❌ FAIL: Setting is NULL'
    WHEN length(current_setting('app.supabase_function_key', true)) < 32
    THEN '❌ FAIL: Key too short (insufficient entropy)'
    ELSE '✅ PASS: Real API key configured'
  END AS test_result;
```

**Expected Result**:
```
test_result
--------------------------------
✅ PASS: Real API key configured
```

**Pass Criteria**: ✅ Returns "PASS" message

---

#### Test 2.3: Setting Accessible to Superuser

**Purpose**: Verify superuser can access the setting

**Test Command**:
```sql
-- Run as superuser (default postgres connection)
SELECT
  current_user AS connected_as,
  current_setting('app.supabase_function_key') IS NOT NULL AS can_access_key;
```

**Expected Result**:
```
connected_as | can_access_key
-------------+----------------
postgres     | t
```

**Pass Criteria**: ✅ can_access_key = true

---

#### Test 2.4: Setting Not Accessible to Regular Users (Security Test)

**Purpose**: Verify regular users cannot access the API key setting

**Test Command**:
```sql
-- Test as authenticated user (if available)
SET ROLE authenticated;

SELECT
  current_user AS connected_as,
  current_setting('app.supabase_function_key', true) AS key_value,
  current_setting('app.supabase_function_key', true) IS NULL AS key_is_null;

RESET ROLE;
```

**Expected Result**:
```
connected_as  | key_value | key_is_null
--------------+-----------+-------------
authenticated | <null>    | t
```

**Pass Criteria**: ✅ key_is_null = true (regular users cannot access the setting)

**Note**: This confirms proper security isolation of the API key.

---

### Test Category 3: pg_cron Integration

These tests verify pg_cron can access the API key and authenticate successfully.

#### Test 3.1: pg_cron Job Can Read API Key

**Purpose**: Verify pg_cron job has access to the database setting

**Test Command**:
```sql
-- Simulate what pg_cron does when the job runs
DO $$
DECLARE
  v_api_key text;
BEGIN
  v_api_key := current_setting('app.supabase_function_key');

  IF v_api_key IS NULL OR v_api_key = '' THEN
    RAISE EXCEPTION '❌ FAIL: API key not accessible';
  END IF;

  IF v_api_key = 'placeholder-api-key-to-be-configured-in-task-5' THEN
    RAISE EXCEPTION '❌ FAIL: Still using placeholder key';
  END IF;

  RAISE NOTICE '✅ PASS: pg_cron can access API key (length: %)', length(v_api_key);
END $$;
```

**Expected Result**:
```
NOTICE: ✅ PASS: pg_cron can access API key (length: 64)
DO
```

**Pass Criteria**: ✅ NOTICE shows success, no EXCEPTION raised

---

#### Test 3.2: pg_cron Job Configuration Uses API Key

**Purpose**: Verify scheduled job command includes API key

**Test Command**:
```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  command LIKE '%current_setting(''app.supabase_function_key'')%' AS uses_api_key,
  command LIKE '%X-API-Key%' AS includes_api_header
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';
```

**Expected Result**:
```
jobid | jobname                           | schedule  | active | uses_api_key | includes_api_header
------+-----------------------------------+-----------+--------+--------------+---------------------
1     | update-installment-statuses-daily | 0 7 * * * | t      | t            | t
```

**Pass Criteria**: ✅ uses_api_key = true AND includes_api_header = true

---

#### Test 3.3: Manual pg_cron Command Execution

**Purpose**: Manually execute the pg_cron command to verify authentication works

**Test Command**:
```sql
-- Execute the same command that pg_cron will run
-- IMPORTANT: Replace <project-ref> with actual project reference

SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS http_response;
```

**Expected Result**:
```json
{
  "status": 200,
  "content": "{\"success\":true,\"recordsUpdated\":N,\"agencies\":[...]}"
}
```

**Pass Criteria**: ✅ status = 200 AND content includes "success":true

**Verification**:
```sql
-- Verify execution was logged
SELECT
  started_at,
  completed_at,
  status,
  records_updated
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;

-- Expected: Recent entry with status 'success'
```

---

#### Test 3.4: Verify pg_cron Job is Active

**Purpose**: Ensure scheduled job is enabled and will run automatically

**Test Command**:
```sql
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database,
  nodename,
  CASE
    WHEN active = true THEN '✅ Job is active'
    ELSE '❌ Job is inactive'
  END AS status
FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';
```

**Expected Result**:
```
jobid | jobname                           | schedule  | active | database | nodename | status
------+-----------------------------------+-----------+--------+----------+----------+------------------
1     | update-installment-statuses-daily | 0 7 * * * | t      | postgres | /tmp     | ✅ Job is active
```

**Pass Criteria**: ✅ active = true

---

### Test Category 4: End-to-End Authentication Flow

These tests verify the complete authentication flow from pg_cron to Edge Function.

#### Test 4.1: Complete Job Execution Flow

**Purpose**: Verify entire flow works: pg_cron → HTTP request → API key validation → job execution → logging

**Test Steps**:

1. **Trigger manual execution**:
```sql
-- Reset job log before test (optional)
-- DELETE FROM jobs_log WHERE job_name = 'update-installment-statuses' AND started_at > NOW() - INTERVAL '1 minute';

-- Execute job manually
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
) AS http_response;
```

2. **Verify HTTP response**:
- Check response status = 200
- Check response content includes "success":true

3. **Verify jobs_log entry**:
```sql
SELECT
  started_at,
  completed_at,
  status,
  records_updated,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;
```

4. **Verify execution timing**:
```sql
SELECT
  started_at,
  completed_at,
  (completed_at - started_at) AS execution_duration,
  CASE
    WHEN completed_at - started_at < INTERVAL '10 seconds' THEN '✅ Fast execution'
    WHEN completed_at - started_at < INTERVAL '30 seconds' THEN '⚠️ Acceptable execution'
    ELSE '❌ Slow execution (investigate)'
  END AS performance
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;
```

**Pass Criteria**:
- ✅ HTTP status 200
- ✅ jobs_log entry created
- ✅ status = 'success' (or 'failed' if no overdue installments, which is also valid)
- ✅ no error_message (unless legitimate database error)
- ✅ execution_duration < 30 seconds

---

#### Test 4.2: Authentication Failure Handling

**Purpose**: Verify system handles authentication failures gracefully

**Test Command**:
```sql
-- Deliberately use wrong API key
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', 'deliberately-wrong-key-for-testing'
  ),
  body := '{}'::jsonb
) AS http_response;
```

**Expected Result**:
```json
{
  "status": 401,
  "content": "{\"error\":\"Unauthorized\"}"
}
```

**Verification**:
```sql
-- Verify no jobs_log entry was created
SELECT COUNT(*) as failed_auth_jobs
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND started_at > NOW() - INTERVAL '1 minute';

-- Expected: 0 (authentication failed before job start)
```

**Pass Criteria**: ✅ HTTP 401 + no jobs_log entry (correct failure handling)

---

### Test Category 5: Security and Edge Cases

These tests verify security properties and edge cases.

#### Test 5.1: Timing Attack Resistance (Optional)

**Purpose**: Verify API key comparison doesn't leak timing information

**Test Command**:
```bash
# Test multiple invalid keys and measure response time
# All invalid keys should take similar time regardless of how many characters match

for i in {1..5}; do
  echo "Test $i:"
  time curl -X POST "$FUNCTION_URL" \
    -H "X-API-Key: wrong-key-$i" \
    -H "Content-Type: application/json" \
    -o /dev/null -s -w "HTTP %{http_code}\n"
done
```

**Expected Result**:
- All requests return 401
- Response times are similar (within ~50ms variance)
- No timing pattern correlates with key similarity

**Pass Criteria**: ✅ Consistent timing for all invalid keys (prevents timing attacks)

**Note**: The Edge Function uses simple `===` comparison which is generally timing-safe in V8, but for paranoid security, constant-time comparison could be added (see Task 5 prompt notes).

---

#### Test 5.2: API Key Persistence After Database Restart

**Purpose**: Verify API key setting survives database restart

**Test Command**:
```sql
-- Check setting persistence
SHOW app.supabase_function_key;

-- Expected: Shows the configured API key
```

**Pass Criteria**: ✅ Setting persists (ALTER DATABASE sets persistent configuration)

---

#### Test 5.3: Concurrent Request Handling

**Purpose**: Verify multiple requests can be authenticated concurrently

**Test Command**:
```bash
# Send 5 concurrent requests
for i in {1..5}; do
  curl -X POST "$FUNCTION_URL" \
    -H "X-API-Key: $API_KEY" \
    -H "Content-Type: application/json" \
    -w "\nRequest $i: HTTP %{http_code}\n" &
done
wait
```

**Expected Result**:
- All 5 requests return 200 OK
- jobs_log shows 5 entries (or fewer if requests processed very quickly and deduplicated)

**Pass Criteria**: ✅ All requests authenticated successfully

---

### Test Category 6: Monitoring and Observability

These tests verify you can monitor API key usage.

#### Test 6.1: Track Successful Authentications

**Purpose**: Verify successful authentications are logged

**Test Command**:
```sql
-- View successful job executions (authenticated requests)
SELECT
  started_at,
  completed_at,
  status,
  records_updated,
  (completed_at - started_at) AS duration
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
ORDER BY started_at DESC
LIMIT 10;
```

**Expected Result**: List of recent successful executions

**Pass Criteria**: ✅ Successful executions are logged with timestamps

---

#### Test 6.2: Track Failed Authentications (Edge Function Logs)

**Purpose**: Verify failed auth attempts can be detected

**Test Steps**:

1. Generate failed authentication:
```bash
curl -X POST "$FUNCTION_URL" \
  -H "X-API-Key: invalid-key" \
  -H "Content-Type: application/json"
```

2. Check Edge Function logs (via Supabase Dashboard):
   - Navigate to **Edge Functions** → **update-installment-statuses** → **Logs**
   - Look for 401 responses

**Expected Result**: Failed auth attempts visible in Edge Function logs

**Pass Criteria**: ✅ Failed attempts logged and detectable

---

#### Test 6.3: Monitor pg_cron Execution History

**Purpose**: Verify pg_cron execution history is available

**Test Command**:
```sql
-- View recent pg_cron job runs
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
LIMIT 10;
```

**Expected Result**: List of recent pg_cron executions with status

**Pass Criteria**: ✅ Execution history available and shows successful runs

---

## Test Results Summary

Use this checklist to track test completion:

### Authentication Tests
- [ ] Test 1.1: Valid API key → 200 OK
- [ ] Test 1.2: Invalid API key → 401 Unauthorized
- [ ] Test 1.3: Missing API key → 401 Unauthorized
- [ ] Test 1.4: Empty API key → 401 Unauthorized
- [ ] Test 1.5: Case-sensitive validation

### Database Setting Tests
- [ ] Test 2.1: Database setting exists
- [ ] Test 2.2: Not using placeholder
- [ ] Test 2.3: Accessible to superuser
- [ ] Test 2.4: Not accessible to regular users (security)

### pg_cron Integration Tests
- [ ] Test 3.1: pg_cron can read API key
- [ ] Test 3.2: Job command uses API key
- [ ] Test 3.3: Manual command execution succeeds
- [ ] Test 3.4: Job is active

### End-to-End Tests
- [ ] Test 4.1: Complete job execution flow
- [ ] Test 4.2: Authentication failure handling

### Security Tests
- [ ] Test 5.1: Timing attack resistance
- [ ] Test 5.2: Persistence after restart
- [ ] Test 5.3: Concurrent request handling

### Monitoring Tests
- [ ] Test 6.1: Track successful authentications
- [ ] Test 6.2: Track failed authentications
- [ ] Test 6.3: Monitor pg_cron history

## Regression Testing

Run these tests after:

- ✅ API key rotation
- ✅ Edge Function redeployment
- ✅ Database migration
- ✅ pg_cron configuration changes
- ✅ Supabase platform updates
- ✅ Major code changes to Edge Function

## Automated Testing Script

For CI/CD integration, create an automated test script:

```bash
#!/bin/bash
# test-api-key-auth.sh

set -e

PROJECT_REF="${PROJECT_REF:-your-project-ref}"
API_KEY="${API_KEY:-}"
FUNCTION_URL="https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses"

echo "Starting API Key Authentication Tests..."

# Test 1: Valid key
echo "Test 1: Valid API key"
RESPONSE=$(curl -s -X POST "$FUNCTION_URL" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}")
STATUS=$(echo "$RESPONSE" | tail -n1)
if [ "$STATUS" -eq 200 ]; then
  echo "✅ PASS: Valid key accepted"
else
  echo "❌ FAIL: Expected 200, got $STATUS"
  exit 1
fi

# Test 2: Invalid key
echo "Test 2: Invalid API key"
STATUS=$(curl -s -X POST "$FUNCTION_URL" \
  -H "X-API-Key: invalid-key" \
  -H "Content-Type: application/json" \
  -o /dev/null -w "%{http_code}")
if [ "$STATUS" -eq 401 ]; then
  echo "✅ PASS: Invalid key rejected"
else
  echo "❌ FAIL: Expected 401, got $STATUS"
  exit 1
fi

# Test 3: Missing key
echo "Test 3: Missing API key"
STATUS=$(curl -s -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -o /dev/null -w "%{http_code}")
if [ "$STATUS" -eq 401 ]; then
  echo "✅ PASS: Missing key rejected"
else
  echo "❌ FAIL: Expected 401, got $STATUS"
  exit 1
fi

echo ""
echo "✅ All tests passed!"
```

## Troubleshooting Failed Tests

### Test 1.1 Fails (Valid Key Returns 401)

**Possible Causes**:
- API key mismatch between secrets vault and test command
- Edge Function not redeployed after secret update
- Secret name typo (must be exactly `SUPABASE_FUNCTION_KEY`)

**Solutions**:
```bash
# Verify secret
supabase secrets list | grep SUPABASE_FUNCTION_KEY

# Redeploy function
supabase functions deploy update-installment-statuses

# Retry test
```

### Test 3.3 Fails (pg_cron Command Fails)

**Possible Causes**:
- Database setting not configured
- Wrong project reference in URL
- Network connectivity issue

**Solutions**:
```sql
-- Verify setting
SELECT current_setting('app.supabase_function_key');

-- Check URL (look for placeholder)
SELECT jobname, command FROM cron.job
WHERE jobname = 'update-installment-statuses-daily';

-- Update URL if needed
SELECT cron.unschedule('update-installment-statuses-daily');
-- Then re-run configure_pg_cron_schedule.sql with correct URL
```

### Test 4.1 Shows 'failed' Status

**This may be normal**:
- If there are no overdue installments, the job completes successfully but updates 0 records
- Check `error_message` in jobs_log:
  - If NULL → Normal (no overdue installments)
  - If error present → Investigate database issue

## References

- [API Key Setup Guide](api_key_setup_guide.md)
- [API Key Rotation Guide](api_key_rotation_guide.md)
- Edge Function Code: `supabase/functions/update-installment-statuses/index.ts:70-77`
- pg_cron Configuration: `supabase/migrations/drafts/configure_pg_cron_schedule.sql`

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Status**: Production Ready
