# Story 5-1: Automated Status Detection Job - Task 3

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 3: Create Supabase Edge Function

### Description
Create a Supabase Edge Function (Deno-based serverless function) that orchestrates the status update job. The function validates API key authentication, calls the database function from Task 1, logs execution to Task 2's table, and implements retry logic for reliability.

### Implementation Checklist
- [ ] Create Edge Function directory: `supabase/functions/update-installment-statuses/`
- [ ] Create `index.ts` with main function logic
- [ ] Create `deno.json` with dependencies configuration
- [ ] Implement API key validation from request headers (X-API-Key)
- [ ] Create Supabase client with service role credentials
- [ ] Log job start to jobs_log table (status='running')
- [ ] Call `update_installment_statuses()` database function
- [ ] Collect results from all agencies
- [ ] Calculate total records_updated
- [ ] Log job completion with metadata (status='success' or 'failed')
- [ ] Implement error handling with try/catch
- [ ] Implement retry logic with exponential backoff (max 3 retries)
- [ ] Return JSON response with results
- [ ] Handle CORS headers for HTTP requests

### Acceptance Criteria
- **AC 2**: Scheduled Execution
  - Job executes via Supabase Edge Function invoked by pg_cron

- **AC 4**: Reliability and Error Handling
  - Job logs errors with full context (error message, stack trace)
  - Job retries on transient errors (max 3 retries with exponential backoff)
  - Job does not leave installments in inconsistent state (atomic updates in Task 1)
  - Failed executions trigger alerts to system administrators (status='failed' in logs)

- **AC 5**: Security and Access Control
  - Endpoint protected by API key authentication
  - Only authorized cron job or system administrators can trigger the job

### Key Constraints
- Deno Runtime: Must use Deno imports (not Node.js)
- Service Role: Use Supabase service_role key for database access (bypasses RLS)
- Retry Logic: Only retry transient errors (network, timeout), not auth/validation errors
- Exponential Backoff: Wait 1s, 2s, 4s between retries
- Atomic Updates: Database function (Task 1) handles transaction atomicity
- API Key: Read from environment variable `SUPABASE_FUNCTION_KEY`

### Edge Function Structure

**File: `supabase/functions/update-installment-statuses/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

interface AgencyResult {
  agency_id: string;
  updated_count: number;
  transitions: {
    pending_to_overdue: number;
  };
}

interface UpdateResponse {
  success: boolean;
  recordsUpdated: number;
  agencies: AgencyResult[];
  error?: string;
}

// Retry logic
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries >= MAX_RETRIES || !isTransientError(error)) {
      throw error;
    }
    const delay = INITIAL_DELAY * Math.pow(2, retries);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries + 1);
  }
}

function isTransientError(error: any): boolean {
  // Network errors, timeouts, temporary database issues
  const transientPatterns = [
    "ECONNRESET",
    "ETIMEDOUT",
    "connection",
    "timeout",
    "ECONNREFUSED",
  ];
  const errorMessage = error?.message?.toLowerCase() || "";
  return transientPatterns.some((pattern) =>
    errorMessage.includes(pattern.toLowerCase())
  );
}

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      },
    });
  }

  // Validate API key
  const apiKey = req.headers.get("X-API-Key");
  if (apiKey !== FUNCTION_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Log job start
  const { data: jobLog, error: insertError } = await supabase
    .from("jobs_log")
    .insert({
      job_name: "update-installment-statuses",
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select()
    .single();

  if (insertError || !jobLog) {
    console.error("Failed to insert job log:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to start job logging" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Call database function with retry
    const results = await executeWithRetry(async () => {
      const { data, error } = await supabase.rpc("update_installment_statuses");
      if (error) throw error;
      return data as AgencyResult[];
    });

    // Calculate totals
    const totalUpdated = results.reduce((sum, r) => sum + r.updated_count, 0);

    // Log job success
    await supabase
      .from("jobs_log")
      .update({
        completed_at: new Date().toISOString(),
        status: "success",
        records_updated: totalUpdated,
        metadata: {
          agencies: results,
          total_agencies_processed: results.length,
        },
      })
      .eq("id", jobLog.id);

    const response: UpdateResponse = {
      success: true,
      recordsUpdated: totalUpdated,
      agencies: results,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log job failure
    await supabase
      .from("jobs_log")
      .update({
        completed_at: new Date().toISOString(),
        status: "failed",
        error_message: error.message,
        metadata: {
          error_stack: error.stack,
        },
      })
      .eq("id", jobLog.id);

    console.error("Job failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        recordsUpdated: 0,
        agencies: [],
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

**File: `supabase/functions/update-installment-statuses/deno.json`**

```json
{
  "imports": {
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
```

### Environment Variables

The Edge Function requires these environment variables:
- `SUPABASE_URL` - Auto-provided by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-provided by Supabase
- `SUPABASE_FUNCTION_KEY` - Custom API key (set in Task 5)

### Dependencies
- Deno Standard Library: `https://deno.land/std@0.168.0/http/server.ts`
- Supabase JS Client: `@supabase/supabase-js@2`

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) Pattern 3: Automated Status State Machine
- Retry logic pattern: See story Dev Notes section for reference implementation

### Testing Approach

After implementing, test the Edge Function locally:

```bash
# Start local Supabase
supabase start

# Serve Edge Function locally
supabase functions serve update-installment-statuses

# Test with curl (use actual API key from .env)
curl -X POST http://localhost:54321/functions/v1/update-installment-statuses \
  -H "X-API-Key: your-test-api-key" \
  -H "Content-Type: application/json"

# Check jobs_log table
psql -h localhost -p 54322 -U postgres -d postgres \
  -c "SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 5;"
```

---

## Implementation Notes

### Deno vs Node.js

Key differences:
- Use Deno imports: `https://deno.land/std/...` or `https://esm.sh/...`
- No `require()` - only ES modules
- Environment variables: `Deno.env.get()` not `process.env`
- Top-level await supported

### Error Handling Strategy

**Transient Errors (retry):**
- Network timeouts
- Connection resets
- Temporary database unavailability

**Permanent Errors (no retry):**
- Authentication failures (401)
- Validation errors (400)
- Not found errors (404)

### Service Role vs Anon Key

This function uses **service_role** key:
- Bypasses RLS policies
- Required for system-level operations
- Allows writing to jobs_log table
- Enables cross-agency status updates

### Deployment

```bash
# Deploy to Supabase
supabase functions deploy update-installment-statuses

# Set environment variable (API key)
supabase secrets set SUPABASE_FUNCTION_KEY=<generated-key>

# Test deployed function
curl -X POST https://<project-ref>.supabase.co/functions/v1/update-installment-statuses \
  -H "X-API-Key: <generated-key>"
```

---

## Next Steps

1. Create the Edge Function directory and files
2. Implement the function logic with retry and error handling
3. Test locally with `supabase functions serve`
4. Verify API key authentication works
5. Verify retry logic on simulated errors
6. When Task 3 is complete:
   - Update `MANIFEST.md`: Set Task 3 status to "Completed" with completion date
   - Add file paths to "Files Created"
   - Add any implementation notes
   - Move to `task-04-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
