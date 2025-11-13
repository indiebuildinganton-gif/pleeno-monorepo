# API Key Setup Guide for update-installment-statuses Edge Function

## Overview

This guide documents the process for setting up API key authentication for the `update-installment-statuses` Edge Function. The API key protects the endpoint from unauthorized access and ensures only the pg_cron job or authorized administrators can trigger the status update job.

## Security Best Practices

### Why API Key Authentication?

- **Machine-to-Machine Communication**: API keys are ideal for automated system clients like pg_cron
- **Simple Management**: Single key for single client, no token expiration complexity
- **Sufficient Security**: Appropriate for internal system-to-system communication
- **Easy Rotation**: Straightforward rotation procedure without service interruption

### Key Generation Requirements

- **Entropy**: Minimum 128 bits of entropy (32 hex characters or UUID v4)
- **Randomness**: Use cryptographically secure random generator
- **Uniqueness**: Generate a new unique key for each environment (dev, staging, prod)
- **Format**: Hexadecimal string or UUID format for easy handling

## Step 1: Generate Secure API Key

Choose one of the following methods:

### Method 1: Using OpenSSL (Recommended)

```bash
# Generate 64-character hexadecimal string (256 bits entropy)
openssl rand -hex 32

# Example output:
# 5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba
```

### Method 2: Using UUID v4

```bash
# Generate UUID v4 (128 bits entropy)
uuidgen | tr '[:upper:]' '[:lower:]'

# Example output:
# a1b2c3d4-e5f6-7890-1234-567890abcdef
```

### Method 3: Using Node.js Crypto

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Example output:
# 8f3c1e9a7b2d4f6e8c1a5b9d3e7f1a4c6e8b2d4f7a9c1e3b5d7f9a1c3e5b7d9f
```

**IMPORTANT**: Save the generated key securely. You will need it for the next steps.

## Step 2: Store API Key in Supabase Secrets

Supabase provides a secure secrets vault for storing sensitive environment variables.

### Using Supabase CLI

```bash
# Set the secret
supabase secrets set SUPABASE_FUNCTION_KEY="YOUR_GENERATED_API_KEY_HERE"

# Example:
# supabase secrets set SUPABASE_FUNCTION_KEY="5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba"
```

### Verify Secret is Set

```bash
# List all secrets (values will be masked)
supabase secrets list

# Expected output:
# NAME                      VALUE
# SUPABASE_FUNCTION_KEY     5ba550fa-****-****-****-************
```

### Using Supabase Dashboard

Alternatively, you can set secrets via the Supabase Dashboard:

1. Navigate to **Project Settings** → **API** → **Secrets**
2. Click **Add Secret**
3. Name: `SUPABASE_FUNCTION_KEY`
4. Value: Your generated API key
5. Click **Save**

## Step 3: Update PostgreSQL Database Setting

The pg_cron job needs to access the API key to include it in HTTP requests. Store the key in a PostgreSQL custom setting:

```sql
-- Set the API key in PostgreSQL configuration
ALTER DATABASE postgres SET app.supabase_function_key = 'YOUR_GENERATED_API_KEY_HERE';

-- Example:
-- ALTER DATABASE postgres SET app.supabase_function_key = '5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba';

-- Verify the setting
SELECT current_setting('app.supabase_function_key');

-- Expected output:
-- 5ba550fafbf9fba13e32225e87ace745340eef8028462a919c2d1372de98efba
```

### Security Considerations

- The database setting is accessible only to superuser and service roles
- This approach keeps the key out of migration files and version control
- The key is stored encrypted at rest in the PostgreSQL database
- RLS policies ensure regular users cannot access this setting

## Step 4: Deploy Edge Function

After setting the secret, redeploy the Edge Function to ensure it picks up the new environment variable:

```bash
# Deploy the Edge Function
supabase functions deploy update-installment-statuses

# Expected output:
# Deploying function update-installment-statuses...
# Function deployed successfully!
# URL: https://<project-ref>.supabase.co/functions/v1/update-installment-statuses
```

**Note**: The Edge Function code already includes API key validation (implemented in Task 3):

```typescript
// From supabase/functions/update-installment-statuses/index.ts:6
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

// From supabase/functions/update-installment-statuses/index.ts:70-77
const apiKey = req.headers.get("X-API-Key");
if (apiKey !== FUNCTION_API_KEY) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

## Step 5: Update pg_cron Configuration

The pg_cron scheduled job automatically uses the database setting to authenticate requests. No additional configuration is needed as the job command already includes:

```sql
-- From configure_pg_cron_schedule.sql
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);
```

The `current_setting('app.supabase_function_key')` dynamically retrieves the API key at runtime.

## Verification Checklist

After completing the setup, verify everything is working:

- [ ] API key generated using cryptographically secure method
- [ ] Secret `SUPABASE_FUNCTION_KEY` set in Supabase secrets vault
- [ ] Database setting `app.supabase_function_key` configured
- [ ] Edge Function deployed successfully
- [ ] Manual test with valid API key returns 200 OK
- [ ] Manual test with invalid API key returns 401 Unauthorized
- [ ] Manual test with missing API key returns 401 Unauthorized
- [ ] pg_cron job can successfully authenticate and execute
- [ ] jobs_log table shows successful executions

## Testing the Setup

See [api_key_testing_guide.md](api_key_testing_guide.md) for comprehensive testing procedures.

## Environment-Specific Keys

**IMPORTANT**: Use different API keys for each environment:

| Environment | Secret Name | Database Setting | Purpose |
|------------|-------------|------------------|---------|
| Development | `SUPABASE_FUNCTION_KEY` | `app.supabase_function_key` | Local testing |
| Staging | `SUPABASE_FUNCTION_KEY` | `app.supabase_function_key` | Pre-production testing |
| Production | `SUPABASE_FUNCTION_KEY` | `app.supabase_function_key` | Live system |

**Never reuse API keys across environments.** Each environment should have its own unique key.

## Security Warnings

### DO NOT

- ❌ Commit API keys to version control (git)
- ❌ Include API keys in migration files
- ❌ Share API keys via email or chat
- ❌ Use the same key across multiple environments
- ❌ Store API keys in plaintext files
- ❌ Hard-code API keys in application code

### DO

- ✅ Use Supabase secrets vault for Edge Function environment variables
- ✅ Use PostgreSQL custom settings for pg_cron access
- ✅ Generate new unique keys for each environment
- ✅ Rotate keys regularly (recommended: every 90 days)
- ✅ Use cryptographically secure random generators
- ✅ Document key rotation procedures
- ✅ Monitor API key usage via jobs_log and Edge Function logs

## Troubleshooting

### Edge Function Returns 401 Unauthorized

**Symptoms**: All requests to Edge Function fail with 401, even with correct key

**Possible Causes**:
1. Secret not set in Supabase secrets vault
2. Edge Function not redeployed after setting secret
3. Typo in secret name (must be exactly `SUPABASE_FUNCTION_KEY`)

**Solutions**:
```bash
# Verify secret is set
supabase secrets list | grep SUPABASE_FUNCTION_KEY

# If missing, set it:
supabase secrets set SUPABASE_FUNCTION_KEY="YOUR_KEY_HERE"

# Redeploy Edge Function
supabase functions deploy update-installment-statuses
```

### pg_cron Job Fails with Authentication Error

**Symptoms**: jobs_log shows "Unauthorized" error messages

**Possible Causes**:
1. Database setting not configured
2. Wrong API key in database setting
3. API key mismatch between secrets vault and database setting

**Solutions**:
```sql
-- Check if setting exists
SELECT current_setting('app.supabase_function_key');
-- If error "unrecognized configuration parameter", setting is not configured

-- Set or update the setting
ALTER DATABASE postgres SET app.supabase_function_key = 'YOUR_KEY_HERE';

-- Verify it matches the secret vault key
-- (Compare first 8 characters only for security)
SELECT substring(current_setting('app.supabase_function_key'), 1, 8);
```

### Cannot Access Database Setting

**Symptoms**: `current_setting()` returns error or empty result

**Possible Causes**:
1. Using wrong database name (should be `postgres`)
2. Insufficient privileges to read setting
3. Setting not applied yet (needs reconnection)

**Solutions**:
```sql
-- Reconnect to database to pick up new settings
\c postgres

-- Or use RESET and SHOW to verify
SHOW app.supabase_function_key;

-- If still not working, check privileges
SELECT has_database_privilege(current_user, 'postgres', 'CONNECT');
```

## Next Steps

After completing this setup:

1. Proceed to [api_key_testing_guide.md](api_key_testing_guide.md) for testing procedures
2. Review [api_key_rotation_guide.md](api_key_rotation_guide.md) for rotation procedures
3. Update project documentation with API key management procedures
4. Schedule first key rotation date (90 days from now)
5. Configure monitoring alerts for authentication failures

## References

- [Supabase Secrets Documentation](https://supabase.com/docs/guides/functions/secrets)
- [PostgreSQL Custom Settings](https://www.postgresql.org/docs/current/runtime-config-custom.html)
- [API Key Best Practices](https://cloud.google.com/docs/authentication/api-keys)
- Story 5-1 Task 3: Edge Function Implementation (includes validation code)
- Story 5-1 Task 4: pg_cron Configuration (includes key usage)

---

**Document Version**: 1.0
**Last Updated**: 2025-11-13
**Author**: System Implementation Team
**Status**: Production Ready
