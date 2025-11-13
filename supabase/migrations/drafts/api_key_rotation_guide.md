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
