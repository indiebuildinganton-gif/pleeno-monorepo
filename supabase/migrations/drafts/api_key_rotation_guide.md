# API Key Rotation Procedure
## Story 5-1, Task 5: API Key Authentication

### Overview
This document outlines the procedure for rotating the API key used to authenticate requests to the `update-installment-statuses` Edge Function. Proper key rotation is a critical security practice that minimizes the impact of key compromise and maintains compliance with security policies.

---

## When to Rotate API Keys

### Scheduled Rotation
- **Recommended frequency**: Every 90 days
- **Industry best practice**: Rotate before expiration to maintain security posture
- **Compliance requirements**: May be required by organizational security policies

### Unscheduled Rotation (Immediate)
Rotate immediately if:
- 🚨 **Suspected compromise**: Key may have been exposed or accessed by unauthorized parties
- 🚨 **Security incident**: Breach or security event affecting the system
- 🚨 **Personnel changes**: Team member with key access leaves the organization
- 🚨 **Access pattern anomalies**: Unusual or suspicious API usage detected
- 🚨 **Compliance audit**: Required by security audit or compliance review

### Access Change Rotation
Rotate when:
- Changing access patterns or authorization requirements
- Migrating to new infrastructure or deployment model
- Updating security policies or authentication mechanisms

---

## Rotation Strategy: Zero-Downtime Approach

This procedure ensures continuous operation during key rotation by:
1. Keeping the old key active while deploying the new key
2. Updating the Edge Function first (accepts new key)
3. Updating pg_cron second (sends new key)
4. No interruption to scheduled or manual job executions

### Prerequisites
- Access to Supabase CLI and dashboard
- PostgreSQL superuser access
- Ability to deploy Edge Functions
- Secure location to store new API key

---

## Step-by-Step Rotation Procedure

### Step 1: Generate New API Key

Generate a new secure API key using OpenSSL:

```bash
# Generate new 64-character hex key
NEW_KEY=$(openssl rand -hex 32)

# Display the new key (save this securely!)
echo "New API Key: $NEW_KEY"

# Example output:
# New API Key: 9f3e8a1b4c2d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
```

**⚠️ CRITICAL**: Save this key in a secure password manager or secrets vault immediately. You'll need it for the following steps.

### Step 2: Update Supabase Secrets

Set the new API key in Supabase secrets vault:

```bash
# Set new secret (replaces old value)
supabase secrets set SUPABASE_FUNCTION_KEY="$NEW_KEY"

# Or manually:
supabase secrets set SUPABASE_FUNCTION_KEY="9f3e8a1b4c2d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f"

# Verify new secret is set (value will be masked)
supabase secrets list
```

**Expected output:**
```
NAME                      VALUE
SUPABASE_FUNCTION_KEY     9f3e****************************9e0f
```

### Step 3: Redeploy Edge Function

Deploy the Edge Function to pick up the new API key:

```bash
# Deploy the function (reads new secret)
supabase functions deploy update-installment-statuses

# Verify deployment succeeded
supabase functions list
```

**Expected output:**
```
NAME                          STATUS    UPDATED
update-installment-statuses   deployed  2025-11-13 14:23:45
```

**Note**: The Edge Function now accepts the new API key, but still accepts the old key (stored in the database setting) until we update it.

### Step 4: Test New API Key

Verify the Edge Function accepts the new key before updating pg_cron:

```bash
# Replace <project-ref> with your Supabase project reference
# Test with new API key
curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $NEW_KEY" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected response (200 OK):**
```json
{
  "success": true,
  "recordsUpdated": <count>,
  "agencies": [...]
}
HTTP Status: 200
```

**If this fails (401 Unauthorized):**
- Check that the secret was set correctly: `supabase secrets list`
- Verify the function was redeployed: `supabase functions list`
- Review Edge Function logs for errors

### Step 5: Update PostgreSQL Database Setting

Update the database setting to use the new API key:

```sql
-- Connect to your Supabase PostgreSQL database
-- Update the database setting with the new key
ALTER DATABASE postgres SET app.supabase_function_key = '<new-api-key>';

-- Example:
ALTER DATABASE postgres SET app.supabase_function_key = '9f3e8a1b4c2d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f';

-- Reload PostgreSQL configuration
SELECT pg_reload_conf();

-- Verify the new setting is active
SELECT current_setting('app.supabase_function_key');
```

**Expected output:**
```
                         current_setting
--------------------------------------------------------------------
 9f3e8a1b4c2d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f
```

### Step 6: Test pg_cron with New Key

Manually trigger the pg_cron job to verify it can authenticate with the new key:

```sql
-- Manual trigger (simulates pg_cron execution)
# API Key Rotation Guide

## Overview

This guide provides a comprehensive procedure for rotating the API key used to authenticate requests to the `update-installment-statuses` Edge Function. Regular key rotation is a security best practice that limits the impact of potential key compromise.

## When to Rotate Keys

### Scheduled Rotation

- **Recommended Frequency**: Every 90 days (quarterly)
- **Best Practice**: Align with organizational security audit cycles
- **Calendar Reminder**: Set up automatic reminders 7 days before rotation date

### Unscheduled Rotation

Rotate immediately if:

- ✅ Key suspected to be compromised or leaked
- ✅ Security audit identifies exposure risk
- ✅ Staff changes (developer with key access leaves organization)
- ✅ After security incident or breach investigation
- ✅ Compliance requirements mandate rotation
- ✅ Key accidentally committed to version control or shared insecurely

## Zero-Downtime Rotation Strategy

The rotation procedure is designed for **zero downtime** by ensuring both the Edge Function and pg_cron job remain operational throughout the process.

### Key Principle

Both components must always use the same key:
1. **Edge Function** validates requests using `SUPABASE_FUNCTION_KEY` (from secrets vault)
2. **pg_cron Job** sends requests using `app.supabase_function_key` (from database setting)

The rotation sequence ensures these stay synchronized.

## Pre-Rotation Checklist

Before starting rotation:

- [ ] Verify current system is operational
- [ ] Check jobs_log for recent successful executions
- [ ] Review Edge Function logs for any issues
- [ ] Prepare rollback plan (keep old key documented temporarily)
- [ ] Schedule rotation during low-activity period if possible
- [ ] Notify relevant team members
- [ ] Have access to:
  - Supabase CLI (authenticated)
  - Database access (superuser privileges)
  - Secure storage for new key

## Rotation Procedure

### Step 1: Generate New API Key

Generate a cryptographically secure key using one of these methods:

```bash
# Method 1: OpenSSL (Recommended - 64 character hex)
openssl rand -hex 32

# Method 2: UUID v4
uuidgen | tr '[:upper:]' '[:lower:]'

# Method 3: Node.js Crypto
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example Output**:
```
8f3c1e9a7b2d4f6e8c1a5b9d3e7f1a4c6e8b2d4f7a9c1e3b5d7f9a1c3e5b7d9f
```

**IMPORTANT**:
- Save this key securely (password manager, secrets vault)
- Document the generation date
- Keep the old key accessible for 48 hours (for emergency rollback)

### Step 2: Update Supabase Secrets Vault

Update the Edge Function's environment variable:

```bash
# Set the new secret
supabase secrets set SUPABASE_FUNCTION_KEY="<NEW_API_KEY_HERE>"

# Example:
# supabase secrets set SUPABASE_FUNCTION_KEY="8f3c1e9a7b2d4f6e8c1a5b9d3e7f1a4c6e8b2d4f7a9c1e3b5d7f9a1c3e5b7d9f"
```

Verify the secret was set:

```bash
supabase secrets list | grep SUPABASE_FUNCTION_KEY

# Expected output (value masked):
# SUPABASE_FUNCTION_KEY     8f3c1e9a-****-****-****-************
```

### Step 3: Redeploy Edge Function

The Edge Function must be redeployed to pick up the new secret:

```bash
# Deploy the Edge Function
supabase functions deploy update-installment-statuses

# Wait for deployment to complete (usually 10-30 seconds)
```

Verify deployment:

```bash
# Check function status
supabase functions list

# Expected output should show update-installment-statuses as deployed
```

**At this point**: The Edge Function now validates using the NEW key, but pg_cron still sends the OLD key. The system is temporarily in a transition state where manual requests with the new key work, but the scheduled job will fail until Step 4 is complete.

### Step 4: Update Database Setting

Update the PostgreSQL database setting used by pg_cron:

```sql
-- Connect to the database
-- psql -h <db-host> -U postgres -d postgres

-- Update the API key setting
ALTER DATABASE postgres SET app.supabase_function_key = '<NEW_API_KEY_HERE>';

-- Example:
-- ALTER DATABASE postgres SET app.supabase_function_key = '8f3c1e9a7b2d4f6e8c1a5b9d3e7f1a4c6e8b2d4f7a9c1e3b5d7f9a1c3e5b7d9f';

-- Verify the setting was updated
SELECT current_setting('app.supabase_function_key');

-- Expected output: 8f3c1e9a7b2d4f6e8c1a5b9d3e7f1a4c6e8b2d4f7a9c1e3b5d7f9a1c3e5b7d9f
```

**Note**: The setting takes effect immediately for new database connections. Existing connections (including pg_cron) will use the new setting on their next execution.

**At this point**: Both components now use the NEW key. The system is fully operational with the rotated key.

### Step 5: Test the Rotation

Verify the rotation was successful:

#### Test 5.1: Manual Edge Function Test

```bash
# Test with curl (replace <project-ref> and <new-api-key>)
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <NEW_API_KEY>" \
  -H "Content-Type: application/json"

# Expected: 200 OK with JSON response
# {"success":true,"recordsUpdated":N,"agencies":[...]}
```

#### Test 5.2: Test with Old Key (Should Fail)

```bash
# Test with old key (should return 401)
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <OLD_API_KEY>" \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
# {"error":"Unauthorized"}
```

#### Test 5.3: Test pg_cron Configuration

```sql
-- Test that pg_cron can access the new key
SELECT current_setting('app.supabase_function_key') AS key_configured;

-- Should return the new key

-- Test the full pg_cron command
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);

-- Verify success in jobs_log table
SELECT
  id,
  job_name,
) AS http_response;

-- Expected: status = 200, content shows success
```

#### Test 5.4: Verify jobs_log

```sql
-- Check that the test execution was logged
SELECT
  started_at,
  completed_at,
  status,
  records_updated,
  error_message
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 1;
```

**Expected result:**
```
job_name: update-installment-statuses
status: success
records_updated: <count>
error_message: NULL
```

### Step 7: Monitor for 24-48 Hours

After rotation, monitor the system to ensure:
- pg_cron scheduled job continues to run successfully
- No authentication errors in Edge Function logs
- jobs_log table shows successful executions
- No alerts or anomalies detected

**Monitoring queries:**

```sql
-- Check recent job executions
SELECT
  started_at,
  status,
  records_updated,
  error_message
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND started_at > NOW() - INTERVAL '48 hours'
ORDER BY started_at DESC;

-- Check pg_cron run history

-- Expected: status = 'success', no error_message
```

### Step 6: Monitor Next Scheduled Run

Wait for the next scheduled pg_cron execution (7:00 AM UTC daily) and verify:

```sql
-- Check cron job run history
SELECT
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
  AND start_time > NOW() - INTERVAL '48 hours'
ORDER BY start_time DESC;
```

### Step 8: Document Rotation

Record the rotation in your security log:
- **Date and time of rotation**
- **Person who performed rotation**
- **Reason for rotation** (scheduled, incident, etc.)
- **Next scheduled rotation date** (current date + 90 days)

Example log entry:
```
Date: 2025-11-13 14:30 UTC
Performed by: John Doe
Reason: Scheduled 90-day rotation
Previous key last 8 chars: ...8554a3
New key last 8 chars: ...8d9e0f
Next rotation due: 2026-02-11
Status: Successful - no downtime
```

### Step 9: Secure Disposal of Old Key

After 24-48 hours of successful operation:
- Remove old key from password managers or secrets vaults
- Update team documentation with new key location
- Revoke old key from any backup or recovery systems

**⚠️ IMPORTANT**: Do not delete the old key immediately. Wait at least 24-48 hours to ensure the new key is working correctly across all systems.

---

## Rollback Procedure

If issues occur after rotation, you can rollback to the old key:

### Quick Rollback Steps

1. **Update Supabase secret** with old key:
   ```bash
   supabase secrets set SUPABASE_FUNCTION_KEY="<old-api-key>"
   ```

2. **Redeploy Edge Function**:
   ```bash
   supabase functions deploy update-installment-statuses
   ```

3. **Update database setting** with old key:
   ```sql
   ALTER DATABASE postgres SET app.supabase_function_key = '<old-api-key>';
   SELECT pg_reload_conf();
   ```

4. **Verify rollback**:
   ```bash
   curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \
     -H "X-API-Key: <old-api-key>"
   ```

### After Rollback
- Investigate the issue that caused the need for rollback
- Fix the underlying problem
- Attempt rotation again following the procedure

---

## Common Rotation Issues and Solutions

### Issue 1: 401 Unauthorized After Step 3

**Symptom**: New API key rejected by Edge Function

**Cause**: Secret not properly set or function not redeployed

**Solution**:
```bash
# Verify secret
supabase secrets list

# Re-set secret if needed
supabase secrets set SUPABASE_FUNCTION_KEY="<new-key>"

# Redeploy
supabase functions deploy update-installment-statuses

# Test again
curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \
  -H "X-API-Key: <new-key>"
```

### Issue 2: pg_cron Job Fails After Step 5

**Symptom**: Scheduled job returns 401 error

**Cause**: Database setting not updated or not reloaded

**Solution**:
```sql
-- Verify current setting
SELECT current_setting('app.supabase_function_key');

-- If incorrect, update and reload
ALTER DATABASE postgres SET app.supabase_function_key = '<new-key>';
SELECT pg_reload_conf();

-- Test manual trigger
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object('X-API-Key', current_setting('app.supabase_function_key')),
  body := '{}'::jsonb
);
```

### Issue 3: Edge Function Deployment Fails

**Symptom**: `supabase functions deploy` returns error

**Cause**: Network issues, authentication problems, or code errors

**Solution**:
```bash
# Check Supabase CLI authentication
supabase status

# Re-authenticate if needed
supabase login

# Retry deployment
supabase functions deploy update-installment-statuses --no-verify-jwt

# Check function logs for errors
supabase functions logs update-installment-statuses
```

### Issue 4: Lost New API Key

**Symptom**: New key was generated but not saved

**Cause**: Failed to copy/save the new key after generation

**Solution**:
```bash
# Retrieve current key from database setting
psql -h <db-host> -U postgres -d postgres \
  -c "SELECT current_setting('app.supabase_function_key');"

# Save this key securely
# Then update Supabase secret to match
supabase secrets set SUPABASE_FUNCTION_KEY="<retrieved-key>"
supabase functions deploy update-installment-statuses
```

---

## Automation Considerations

For organizations with frequent rotations, consider automating this process:

### Automated Rotation Script (Example)

```bash
#!/bin/bash
# api_key_rotation.sh
# Automated API key rotation for update-installment-statuses

set -e  # Exit on error

# Configuration
PROJECT_REF="<your-project-ref>"
DB_HOST="<your-db-host>"
DB_USER="postgres"

# Step 1: Generate new key
echo "Generating new API key..."
NEW_KEY=$(openssl rand -hex 32)
echo "New key generated (last 8 chars): ...${NEW_KEY: -8}"

# Step 2: Update Supabase secret
echo "Updating Supabase secret..."
supabase secrets set SUPABASE_FUNCTION_KEY="$NEW_KEY"

# Step 3: Deploy function
echo "Deploying Edge Function..."
supabase functions deploy update-installment-statuses

# Step 4: Test new key
echo "Testing new API key..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses" \
  -H "X-API-Key: $NEW_KEY")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
if [ "$HTTP_CODE" -ne 200 ]; then
  echo "Error: New API key test failed with HTTP $HTTP_CODE"
  exit 1
fi
echo "New API key test successful"

# Step 5: Update database setting
echo "Updating database setting..."
psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
  -c "ALTER DATABASE postgres SET app.supabase_function_key = '$NEW_KEY';"
psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
  -c "SELECT pg_reload_conf();"

# Step 6: Test pg_cron
echo "Testing pg_cron with new key..."
psql -h "$DB_HOST" -U "$DB_USER" -d postgres \
  -c "SELECT net.http_post(
    url := 'https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses',
    headers := jsonb_build_object('X-API-Key', current_setting('app.supabase_function_key')),
    body := '{}'::jsonb
  );"

echo "API key rotation completed successfully!"
echo "New key (last 8 chars): ...${NEW_KEY: -8}"
echo "Please save this key securely: $NEW_KEY"
echo "Next rotation due: $(date -d '+90 days' '+%Y-%m-%d')"
```

**⚠️ WARNING**: Automated scripts must be secured properly:
- Store in secure location with restricted access
- Use secure credential management (not hardcoded passwords)
- Log rotation events for audit purposes
- Test thoroughly in non-production environments first

---

## Compliance and Audit Considerations

### Documentation Requirements
For compliance audits, maintain records of:
- **Rotation schedule**: Planned rotation dates
- **Rotation history**: Date, performer, reason for each rotation
- **Access logs**: Who has accessed the API key
- **Incident response**: How compromises were handled

### Audit Trail Query

```sql
-- Query jobs_log to show API key was working before/after rotation
SELECT
  DATE(started_at) as execution_date,
  COUNT(*) as total_executions,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND started_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY execution_date DESC;
```

### Compliance Checklist
- [ ] Rotation performed on schedule (every 90 days)
- [ ] Rotation documented in security log
- [ ] No downtime during rotation
- [ ] Old key securely disposed after grace period
- [ ] Team members notified of rotation
- [ ] Monitoring confirms successful operation
- [ ] Next rotation date scheduled

---

## Related Documentation

- **API Key Setup Guide**: `supabase/migrations/drafts/api_key_setup_guide.md`
- **Authentication Test Suite**: `supabase/migrations/drafts/test_api_key_authentication.sql`
- **Edge Function Implementation**: `supabase/functions/update-installment-statuses/index.ts`
- **pg_cron Configuration**: `supabase/migrations/drafts/configure_pg_cron_schedule.sql`

---

**Last Updated**: 2025-11-13
**Task**: 5-1-T5 (API Key Authentication)
**Rotation Schedule**: Every 90 days
**Next Review**: 2026-02-11
ORDER BY start_time DESC
LIMIT 5;

-- Expected: Latest run shows successful status

-- Check jobs_log for detailed results
SELECT * FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 5;

-- Expected: Latest entry shows 'success' status
```

### Step 7: Document Rotation

Record the rotation in your security documentation:

```markdown
## API Key Rotation Log

| Date | Environment | Rotated By | Reason | Old Key ID | New Key ID | Verified |
|------|-------------|------------|--------|------------|------------|----------|
| 2025-11-13 | Production | Admin | Scheduled 90-day rotation | key-001 | key-002 | ✅ |
```

**Store Securely**:
- New key in password manager/secrets vault
- Rotation date and reason
- Person who performed rotation
- Verification checklist completion

### Step 8: Secure Old Key

After 48 hours of successful operation with the new key:

- ✅ Remove old key from temporary secure storage
- ✅ Update any documentation referencing the old key
- ✅ Mark old key as "rotated" in key management system
- ✅ Schedule next rotation date (90 days from now)

## Emergency Rollback Procedure

If issues occur after rotation:

### Symptoms Requiring Rollback

- pg_cron jobs failing with authentication errors
- Edge Function returning 401 for valid requests
- jobs_log showing consistent failures
- System unable to process status updates

### Rollback Steps

```bash
# Step 1: Restore old key in Supabase secrets
supabase secrets set SUPABASE_FUNCTION_KEY="<OLD_API_KEY>"

# Step 2: Redeploy Edge Function
supabase functions deploy update-installment-statuses

# Step 3: Restore database setting
# psql -h <db-host> -U postgres -d postgres
```

```sql
ALTER DATABASE postgres SET app.supabase_function_key = '<OLD_API_KEY>';

-- Verify rollback
SELECT current_setting('app.supabase_function_key');
```

```bash
# Step 4: Test manually
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <OLD_API_KEY>" \
  -H "Content-Type: application/json"

# Expected: 200 OK
```

**After Rollback**:
- Investigate root cause of rotation failure
- Document the issue
- Plan corrective action
- Retry rotation after resolving issues

## Rotation Automation (Advanced)

For organizations with multiple environments or frequent rotations, consider automating:

### Automated Rotation Script

```bash
#!/bin/bash
# rotate-api-key.sh

set -e

# Configuration
PROJECT_REF="your-project-ref"
DB_HOST="db.your-project-ref.supabase.co"

echo "Starting API key rotation..."

# Generate new key
NEW_KEY=$(openssl rand -hex 32)
echo "Generated new key: ${NEW_KEY:0:8}..."

# Update Supabase secrets
echo "Updating Supabase secrets..."
supabase secrets set SUPABASE_FUNCTION_KEY="$NEW_KEY"

# Redeploy Edge Function
echo "Redeploying Edge Function..."
supabase functions deploy update-installment-statuses

# Update database setting
echo "Updating database setting..."
psql -h "$DB_HOST" -U postgres -d postgres -c \
  "ALTER DATABASE postgres SET app.supabase_function_key = '$NEW_KEY';"

# Test the rotation
echo "Testing rotation..."
RESPONSE=$(curl -s -X POST \
  "https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses" \
  -H "X-API-Key: $NEW_KEY" \
  -H "Content-Type: application/json")

if echo "$RESPONSE" | grep -q "\"success\":true"; then
  echo "✅ Rotation successful!"
  echo "New key: $NEW_KEY"
  echo "Please store this key securely."
else
  echo "❌ Rotation failed. Response: $RESPONSE"
  exit 1
fi

echo "Don't forget to:"
echo "1. Store new key in password manager"
echo "2. Update rotation log"
echo "3. Monitor next scheduled run"
echo "4. Schedule next rotation (90 days)"
```

### Usage

```bash
# Make script executable
chmod +x rotate-api-key.sh

# Run rotation
./rotate-api-key.sh
```

**Security Warning**: This script contains sensitive operations. Store it securely and restrict access.

## Multi-Environment Rotation

When managing multiple environments:

| Environment | Rotation Schedule | Key Lifespan | Priority |
|-------------|-------------------|--------------|----------|
| Development | As needed | N/A | Low |
| Staging | Every 90 days | Same as prod | Medium |
| Production | Every 90 days | Maximum 90 days | High |

**Best Practice**: Rotate staging and production keys on the same schedule to maintain parity.

### Parallel Rotation Procedure

```bash
# Rotate staging
supabase link --project-ref staging-ref
supabase secrets set SUPABASE_FUNCTION_KEY="<staging-key>"
supabase functions deploy update-installment-statuses
# Update staging database setting

# Wait 24 hours, verify staging

# Rotate production
supabase link --project-ref prod-ref
supabase secrets set SUPABASE_FUNCTION_KEY="<prod-key>"
supabase functions deploy update-installment-statuses
# Update production database setting
```

## Compliance and Audit

### Audit Trail Requirements

Maintain records for:
- Key generation date and method
- Rotation date and time
- Person who performed rotation
- Reason for rotation (scheduled vs. emergency)
- Verification test results
- Any incidents during rotation

### Compliance Considerations

- **SOC 2**: Document key rotation procedures and maintain audit logs
- **ISO 27001**: Implement key lifecycle management per Information Security Policy
- **PCI DSS**: If processing payment data, key rotation may be required quarterly
- **HIPAA**: Maintain access control documentation including key management

## Troubleshooting

### Issue: Secrets Set but Function Still Uses Old Key

**Cause**: Edge Function not redeployed

**Solution**:
```bash
supabase functions deploy update-installment-statuses
```

### Issue: Database Setting Not Updating

**Cause**: Connected to wrong database or insufficient privileges

**Solution**:
```sql
-- Verify current database
SELECT current_database();

-- Should return 'postgres'

-- Verify privileges
SELECT has_database_privilege(current_user, 'postgres', 'CREATE');

-- Reconnect and retry
\c postgres
ALTER DATABASE postgres SET app.supabase_function_key = '<new-key>';
```

### Issue: pg_cron Still Failing After Rotation

**Cause**: Database setting updated but pg_cron hasn't re-read it

**Solution**:
```sql
-- Force configuration reload
SELECT pg_reload_conf();

-- Or wait for next cron run (picks up new setting automatically)
```

### Issue: Rotation Completed but Manual Tests Fail

**Cause**: Keys might not match between secrets vault and database setting

**Solution**:
```bash
# Verify Supabase secret
supabase secrets list | grep SUPABASE_FUNCTION_KEY

# Compare with database setting (first 8 characters)
psql -c "SELECT substring(current_setting('app.supabase_function_key'), 1, 8);"

# If they don't match, repeat Steps 2-4
```

## Best Practices Summary

✅ **DO**:
- Rotate keys every 90 days minimum
- Test thoroughly after each rotation
- Maintain audit logs of all rotations
- Use secure key generation methods
- Store keys in secure vaults only
- Document rotation procedures
- Schedule rotations during low-activity periods
- Keep old key accessible for 48 hours (rollback safety)

❌ **DON'T**:
- Skip testing after rotation
- Reuse old keys
- Share keys via insecure channels
- Store keys in version control
- Rotate during peak usage times
- Delete old keys immediately (keep for rollback)
- Use predictable key patterns
- Forget to document the rotation

## Key Rotation Checklist

Use this checklist for each rotation:

```markdown
## API Key Rotation Checklist - [Date]

### Pre-Rotation
- [ ] Current system operational
- [ ] Backup/rollback plan ready
- [ ] Team notified
- [ ] Access verified (Supabase CLI, database)

### Rotation Steps
- [ ] New key generated (Method: _________)
- [ ] Supabase secret updated
- [ ] Edge Function redeployed
- [ ] Database setting updated
- [ ] Manual test with new key: PASSED
- [ ] Manual test with old key: FAILED (401)
- [ ] pg_cron configuration test: PASSED
- [ ] jobs_log verification: SUCCESS

### Post-Rotation
- [ ] Next scheduled run verified
- [ ] Rotation documented in audit log
- [ ] New key stored securely
- [ ] Old key marked for deletion (after 48h)
- [ ] Next rotation scheduled

### Sign-Off
- Performed by: _______________
- Date/Time: _______________
- Verified by: _______________
- Status: ✅ Complete / ⚠️ Issues / ❌ Rolled Back
```

## References

- [API Key Setup Guide](api_key_setup_guide.md)
- [API Key Testing Guide](api_key_testing_guide.md)
- [Supabase Secrets Management](https://supabase.com/docs/guides/functions/secrets)
- [PostgreSQL Custom Settings](https://www.postgresql.org/docs/current/runtime-config-custom.html)
- Story 5-1 Task 3: Edge Function Implementation
- Story 5-1 Task 4: pg_cron Configuration

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Next Review Date**: 2026-02-11 (90 days)
**Status**: Production Ready
