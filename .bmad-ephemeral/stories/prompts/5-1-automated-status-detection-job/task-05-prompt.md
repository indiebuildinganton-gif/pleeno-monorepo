# Story 5-1: Automated Status Detection Job - Task 5

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 5: Implement API Key Authentication

### Description
Generate and configure a secure API key for the Edge Function endpoint. This ensures only authorized requests (from pg_cron or system administrators) can trigger the status update job.

### Implementation Checklist
- [ ] Generate secure API key (UUID or strong random string)
- [ ] Store API key in Supabase secrets vault
- [ ] Configure Edge Function to read key from environment variable
- [ ] Implement validation in Edge Function (already done in Task 3)
- [ ] Update pg_cron configuration to use the API key
- [ ] Test authentication: valid key → 200, invalid key → 401
- [ ] Document API key rotation procedure

### Acceptance Criteria
- **AC 5**: Security and Access Control
  - Endpoint is protected by API key authentication
  - Only authorized cron job or system administrators can trigger the job
  - API key is stored securely in Supabase secrets

### Key Constraints
- Key Security: Never commit API key to version control
- Key Format: Use UUID v4 or cryptographically secure random string (32+ characters)
- Storage: Use Supabase secrets (not environment files)
- Validation: Compare in constant-time to prevent timing attacks
- Rotation: Document procedure for key rotation without downtime

### Implementation Steps

**Step 1: Generate API Key**

```bash
# Generate UUID v4 as API key
uuidgen | tr '[:upper:]' '[:lower:]'

# Example output: a1b2c3d4-e5f6-7890-1234-567890abcdef

# OR generate 32-character random string
openssl rand -hex 16

# Example output: a1b2c3d4e5f67890123456789 0abcdef
```

**Step 2: Store in Supabase Secrets**

```bash
# Set secret via Supabase CLI
supabase secrets set SUPABASE_FUNCTION_KEY="a1b2c3d4-e5f6-7890-1234-567890abcdef"

# Verify secret is set (will show masked value)
supabase secrets list

# Expected output:
# NAME                      VALUE
# SUPABASE_FUNCTION_KEY     a1b2c3d4-****-****-****-************
```

**Step 3: Update PostgreSQL Setting**

```sql
-- Update the database setting with the actual API key
ALTER DATABASE postgres SET app.supabase_function_key = 'a1b2c3d4-e5f6-7890-1234-567890abcdef';

-- Verify setting
SELECT current_setting('app.supabase_function_key');
```

**Step 4: Verify Edge Function Configuration**

The Edge Function from Task 3 already reads the key:

```typescript
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

// In handler:
const apiKey = req.headers.get("X-API-Key");
if (apiKey !== FUNCTION_API_KEY) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401, headers: { "Content-Type": "application/json" } }
  );
}
```

No code changes needed - just ensure secret is set.

### Testing API Key Authentication

**Test 1: Valid API Key**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: a1b2c3d4-e5f6-7890-1234-567890abcdef" \
  -H "Content-Type: application/json"

# Expected: 200 OK with job results
```

**Test 2: Invalid API Key**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: wrong-key" \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
# Response: {"error":"Unauthorized"}
```

**Test 3: Missing API Key**

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "Content-Type: application/json"

# Expected: 401 Unauthorized
# Response: {"error":"Unauthorized"}
```

**Test 4: pg_cron with API Key**

```sql
-- Test that pg_cron can access the key and call endpoint
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);

-- Check jobs_log for successful execution
SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 1;
```

### API Key Rotation Procedure

**When to Rotate:**
- Scheduled rotation (every 90 days recommended)
- After suspected compromise
- When access needs change

**Rotation Steps (Zero Downtime):**

1. Generate new API key
2. Set new key in Supabase secrets (keeps old key in database)
3. Deploy Edge Function (picks up new key from secrets)
4. Update database setting with new key
5. Test pg_cron execution
6. Monitor for 24 hours
7. Old key is now obsolete

```bash
# Step 1: Generate new key
NEW_KEY=$(uuidgen | tr '[:upper:]' '[:lower:]')

# Step 2: Update Supabase secret
supabase secrets set SUPABASE_FUNCTION_KEY="$NEW_KEY"

# Step 3: Redeploy Edge Function (picks up new secret)
supabase functions deploy update-installment-statuses

# Step 4: Update database setting
psql -h <db-host> -U postgres -d postgres \
  -c "ALTER DATABASE postgres SET app.supabase_function_key = '$NEW_KEY';"

# Step 5: Test manual execution
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: $NEW_KEY"

# Step 6: Wait for next scheduled run, verify success
```

### Dependencies
- Supabase CLI for secrets management
- Edge Function from Task 3
- pg_cron configuration from Task 4

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) Security considerations

---

## Implementation Notes

### Why API Key vs JWT?

**API Key Advantages:**
- Simpler for machine-to-machine communication
- No token expiration (single rotation procedure)
- Easier to manage for single automated client (pg_cron)

**When to Use JWT:**
- Multiple clients with different permissions
- User-facing endpoints requiring scoped access
- Short-lived sessions

For this use case (single system client), API key is sufficient.

### Security Best Practices

**Key Generation:**
- Use cryptographically secure random generator
- Minimum 128 bits of entropy (32 hex characters)
- Avoid predictable patterns

**Key Storage:**
- Never commit to git
- Use Supabase secrets vault (encrypted at rest)
- Database setting accessible only to superuser

**Key Validation:**
- Use constant-time comparison to prevent timing attacks
- TypeScript: `apiKey === FUNCTION_API_KEY` is acceptable (V8 optimizes)
- For paranoid security, use `crypto.timingSafeEqual()`

### Constant-Time Comparison (Optional Enhancement)

```typescript
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";

const apiKey = req.headers.get("X-API-Key");
const expectedKey = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

const apiKeyBuffer = new TextEncoder().encode(apiKey || "");
const expectedKeyBuffer = new TextEncoder().encode(expectedKey);

// Pad shorter buffer to match length
const maxLength = Math.max(apiKeyBuffer.length, expectedKeyBuffer.length);
const paddedApiKey = new Uint8Array(maxLength);
const paddedExpectedKey = new Uint8Array(maxLength);
paddedApiKey.set(apiKeyBuffer);
paddedExpectedKey.set(expectedKeyBuffer);

const isValid = apiKey &&
  apiKeyBuffer.length === expectedKeyBuffer.length &&
  timingSafeEqual(paddedApiKey, paddedExpectedKey);

if (!isValid) {
  return new Response(
    JSON.stringify({ error: "Unauthorized" }),
    { status: 401 }
  );
}
```

### Monitoring API Key Usage

```sql
-- Query jobs_log to verify successful authenticated calls
SELECT
  started_at,
  status,
  error_message
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;

-- Failed auth attempts should show in Edge Function logs
-- Access via Supabase Dashboard > Edge Functions > Logs
```

---

## Next Steps

1. Generate a secure API key
2. Store key in Supabase secrets
3. Update PostgreSQL database setting
4. Test authentication with curl (valid/invalid keys)
5. Test pg_cron can access and use the key
6. Document the API key and rotation procedure
7. When Task 5 is complete:
   - Update `MANIFEST.md`: Set Task 5 status to "Completed" with completion date
   - Add documentation to "Files Created"
   - Add any implementation notes (DO NOT include actual API key)
   - Move to `task-06-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
