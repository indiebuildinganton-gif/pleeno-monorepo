# API Key Authentication Setup Guide
## Story 5-1, Task 5: Implement API Key Authentication

### Overview
This guide provides step-by-step instructions for generating, configuring, and securing the API key used to protect the `update-installment-statuses` Edge Function endpoint.

### Security Model
The Edge Function endpoint is protected by API key authentication to ensure:
- Only authorized requests (from pg_cron or system administrators) can trigger the status update job
- Protection against unauthorized access and abuse
- Simple machine-to-machine authentication suitable for a single system client

### Prerequisites
- Supabase CLI installed and configured
- Access to Supabase project dashboard with admin privileges
- PostgreSQL superuser access for database configuration
- Edge Function deployed (Task 3 completed)

---

## Step 1: Generate Secure API Key

### Method 1: Using OpenSSL (Recommended)

Generate a 64-character hexadecimal string (256 bits of entropy):

```bash
openssl rand -hex 32
```

**Example output:**
```
6b6a8f392250b0bdc8ae48489d9c4f92f5b0dd4def68da5aae4b70fbe78554a3
```

### Method 2: Using UUID v4

If uuidgen is available:

```bash
uuidgen | tr '[:upper:]' '[:lower:]'
```

**Example output:**
```
a1b2c3d4-e5f6-7890-1234-567890abcdef
```

### Security Requirements
- **Minimum entropy**: 128 bits (32 hexadecimal characters)
- **Character set**: Hexadecimal (0-9, a-f) or UUID format
- **Generator**: Cryptographically secure random number generator
- **Avoid**: Predictable patterns, dictionary words, or sequential values

**⚠️ IMPORTANT**: Save the generated key securely. You'll need it for the next steps.

---

## Step 2: Store API Key in Supabase Secrets

### Using Supabase CLI

The Supabase secrets vault provides encrypted at-rest storage for sensitive values.

```bash
# Set the secret
supabase secrets set SUPABASE_FUNCTION_KEY="<your-generated-api-key>"

# Example:
supabase secrets set SUPABASE_FUNCTION_KEY="6b6a8f392250b0bdc8ae48489d9c4f92f5b0dd4def68da5aae4b70fbe78554a3"
```

### Verify Secret is Set

```bash
# List all secrets (values are masked for security)
supabase secrets list
```

**Expected output:**
```
NAME                      VALUE
SUPABASE_FUNCTION_KEY     6b6a****************************54a3
```

### Using Supabase Dashboard (Alternative)

1. Navigate to: **Project Settings** → **Edge Functions** → **Secrets**
2. Click **Add Secret**
3. Name: `SUPABASE_FUNCTION_KEY`
4. Value: `<your-generated-api-key>`
5. Click **Save**

### Important Notes
- Secrets are environment variables available to Edge Functions
- Secrets are encrypted at rest in Supabase's secrets vault
- Secrets are not logged or exposed in function listings
- Changes to secrets require redeploying the Edge Function to take effect

---

## Step 3: Configure PostgreSQL Database Setting

pg_cron needs access to the API key to authenticate requests to the Edge Function. Store the key as a PostgreSQL custom setting.

### Set the Database Setting

```sql
-- Connect to your Supabase PostgreSQL database
-- Replace <your-generated-api-key> with the actual key

ALTER DATABASE postgres SET app.supabase_function_key = '<your-generated-api-key>';

-- Example:
ALTER DATABASE postgres SET app.supabase_function_key = '6b6a8f392250b0bdc8ae48489d9c4f92f5b0dd4def68da5aae4b70fbe78554a3';
```

### Verify the Setting

```sql
-- Check that the setting is configured (retrieves the actual value)
SELECT current_setting('app.supabase_function_key');
```

**Expected output:**
```
                         current_setting
--------------------------------------------------------------------
 6b6a8f392250b0bdc8ae48489d9c4f92f5b0dd4def68da5aae4b70fbe78554a3
```

### Security Considerations
- The `app.*` namespace is reserved for application-specific settings
- Only database owner/superuser can modify these settings
- The setting persists across database restarts
- The setting is accessible via `current_setting()` function in SQL

---

## Step 4: Redeploy Edge Function

After setting the secret, redeploy the Edge Function to pick up the new environment variable.

```bash
# Deploy the Edge Function
supabase functions deploy update-installment-statuses

# Verify deployment
supabase functions list
```

**Expected output:**
```
NAME                          STATUS    UPDATED
update-installment-statuses   deployed  2025-11-13 12:34:56
```

### Verification
The Edge Function will now read `SUPABASE_FUNCTION_KEY` from the environment:

```typescript
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;
```

---

## Step 5: Update pg_cron Job (If Already Scheduled)

If you already configured pg_cron in Task 4 with a placeholder API key, you may need to reload the configuration or reschedule the job.

### Option 1: Reload Configuration (Recommended)

```sql
-- Reload PostgreSQL configuration to pick up the new setting
SELECT pg_reload_conf();
```

### Option 2: Reschedule the Job

```sql
-- Unschedule the existing job
SELECT cron.unschedule('update-installment-statuses-daily');

-- Reschedule with the updated configuration
-- Replace <project-ref> with your actual Supabase project reference
SELECT cron.schedule(
  'update-installment-statuses-daily',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-API-Key', current_setting('app.supabase_function_key')
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

---

## Step 6: Verify End-to-End Authentication

### Test 1: Valid API Key (Success Case)

```bash
# Replace <project-ref> with your Supabase project reference
# Replace <your-api-key> with your actual API key

curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: <your-api-key>" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected response (200 OK):**
```json
{
  "success": true,
  "recordsUpdated": 5,
  "agencies": [
    {
      "agency_id": "uuid-here",
      "updated_count": 5,
      "transitions": {
        "pending_to_overdue": 5
      }
    }
  ]
}
HTTP Status: 200
```

### Test 2: Invalid API Key (Failure Case)

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: wrong-key-12345" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
HTTP Status: 401
```

### Test 3: Missing API Key (Failure Case)

```bash
curl -X POST "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses" \
  -H "Content-Type: application/json" \
  -w "\nHTTP Status: %{http_code}\n"
```

**Expected response (401 Unauthorized):**
```json
{
  "error": "Unauthorized"
}
HTTP Status: 401
```

### Test 4: pg_cron Execution

```sql
-- Manually trigger the scheduled job to verify pg_cron can authenticate
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);

-- Check the jobs_log table for successful execution
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

---

## Troubleshooting

### Issue: "Unauthorized" Error (401)

**Possible causes:**
1. API key mismatch between Supabase secrets and database setting
2. Edge Function not redeployed after setting secret
3. Typo in API key value

**Solution:**
```bash
# Verify secret is set
supabase secrets list

# Check database setting
psql -h <db-host> -U postgres -d postgres -c "SELECT current_setting('app.supabase_function_key');"

# Ensure both match exactly, then redeploy
supabase functions deploy update-installment-statuses
```

### Issue: "Environment variable not found" Error

**Possible cause:** Secret not set in Supabase

**Solution:**
```bash
# Set the secret
supabase secrets set SUPABASE_FUNCTION_KEY="<your-api-key>"

# Redeploy
supabase functions deploy update-installment-statuses
```

### Issue: pg_cron Job Fails with Auth Error

**Possible cause:** Database setting not configured or incorrect

**Solution:**
```sql
-- Verify setting
SELECT current_setting('app.supabase_function_key');

-- If NULL or incorrect, update it
ALTER DATABASE postgres SET app.supabase_function_key = '<your-api-key>';

-- Reload configuration
SELECT pg_reload_conf();
```

### Issue: Cannot Connect to Edge Function

**Possible causes:**
1. Incorrect project reference in URL
2. Edge Function not deployed
3. Network connectivity issues

**Solution:**
```bash
# List deployed functions
supabase functions list

# Get project reference
# Navigate to: Supabase Dashboard > Settings > API
# Copy the "Reference ID"

# Test direct HTTPS access
curl -I "https://<project-ref>.supabase.co/functions/v1/update-installment-statuses"
```

---

## Security Best Practices

### Key Storage
✅ **DO:**
- Store API key in Supabase secrets vault (encrypted at rest)
- Store API key in PostgreSQL custom setting (superuser access only)
- Use environment variables in local development (.env.local, gitignored)

❌ **DON'T:**
- Commit API key to version control (git)
- Store API key in plain text files
- Share API key via email, chat, or unencrypted channels
- Log API key values in application logs

### Key Generation
✅ **DO:**
- Use cryptographically secure random generators (openssl, uuidgen)
- Ensure minimum 128 bits of entropy (32 hex characters)
- Generate new keys for each environment (dev, staging, prod)

❌ **DON'T:**
- Use predictable patterns or sequential values
- Reuse keys across environments or projects
- Use weak or short keys (< 32 characters)

### Access Control
✅ **DO:**
- Limit API key access to authorized systems only (pg_cron, admins)
- Use separate keys for different environments
- Monitor API key usage via jobs_log table
- Implement rate limiting if exposing to multiple clients

❌ **DON'T:**
- Expose API key in client-side code (JavaScript, mobile apps)
- Share a single API key across multiple services
- Allow unauthenticated access to sensitive endpoints

### Key Rotation
✅ **DO:**
- Rotate keys on a regular schedule (every 90 days recommended)
- Rotate immediately after suspected compromise
- Document rotation procedure (see api_key_rotation_guide.md)
- Test after rotation to ensure no downtime

❌ **DON'T:**
- Skip rotation for extended periods (> 1 year)
- Rotate without testing in non-production first
- Delete old keys immediately (allow grace period)

---

## Production Deployment Checklist

Before deploying to production, ensure:

- [ ] API key generated using cryptographically secure method
- [ ] API key stored in Supabase secrets vault (`SUPABASE_FUNCTION_KEY`)
- [ ] Database setting configured (`app.supabase_function_key`)
- [ ] Edge Function redeployed after setting secret
- [ ] Authentication tested with curl (valid/invalid/missing key)
- [ ] pg_cron job tested with manual execution
- [ ] jobs_log table shows successful execution
- [ ] API key documented in secure location (password manager, secrets vault)
- [ ] Rotation schedule established (recommended: 90 days)
- [ ] Team members trained on key management procedures
- [ ] Monitoring/alerting configured for failed auth attempts

---

## Related Documentation

- **Edge Function Implementation**: `supabase/functions/update-installment-statuses/index.ts`
- **pg_cron Configuration**: `supabase/migrations/drafts/configure_pg_cron_schedule.sql`
- **API Key Rotation Guide**: `supabase/migrations/drafts/api_key_rotation_guide.md`
- **Authentication Test Suite**: `supabase/migrations/drafts/test_api_key_authentication.sql`
- **Story Context**: `.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml`

---

**Last Updated**: 2025-11-13
**Task**: 5-1-T5 (API Key Authentication)
**Author**: System
