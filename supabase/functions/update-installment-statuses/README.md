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
