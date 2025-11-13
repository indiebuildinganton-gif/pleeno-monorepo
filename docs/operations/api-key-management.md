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
