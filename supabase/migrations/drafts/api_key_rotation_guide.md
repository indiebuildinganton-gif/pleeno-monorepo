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
