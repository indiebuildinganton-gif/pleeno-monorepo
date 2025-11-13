# Story 5-1: Automated Status Detection Job - Task 7

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 7: Testing

### Description
Write comprehensive tests for all components: SQL function, Edge Function, API authentication, retry logic, and pg_cron scheduling. Verify all acceptance criteria are met through automated and manual tests.

### Implementation Checklist

**Unit Tests:**
- [ ] Test `update_installment_statuses()` SQL function
  - [ ] Installment due yesterday → status changes to overdue
  - [ ] Installment due today before cutoff → status remains pending
  - [ ] Installment due today after cutoff → status changes to overdue
  - [ ] Multi-agency: each agency uses its own timezone
  - [ ] Only active payment plans processed
  - [ ] Inactive payment plans ignored

**Integration Tests:**
- [ ] Test Edge Function endpoint
  - [ ] Mock database with test installments
  - [ ] Call Edge Function endpoint
  - [ ] Verify installments updated correctly
  - [ ] Verify jobs_log entry created

**API Key Authentication Tests:**
- [ ] Call endpoint without API key → 401 Unauthorized
- [ ] Call endpoint with wrong API key → 401 Unauthorized
- [ ] Call endpoint with correct API key → 200 Success

**Retry Logic Tests:**
- [ ] Mock transient database error → verify retry attempts
- [ ] Mock permanent error → verify no retry, log error
- [ ] Verify exponential backoff timing (1s, 2s, 4s)

**Manual Tests:**
- [ ] Trigger cron job manually via SQL
- [ ] Verify Edge Function called
- [ ] Verify installments updated
- [ ] Check jobs_log for execution record

### Acceptance Criteria
All acceptance criteria from Story 5.1 are verified through tests:
- AC 1: Automated Status Detection
- AC 2: Scheduled Execution
- AC 3: Execution Logging and Monitoring
- AC 4: Reliability and Error Handling
- AC 5: Security and Access Control

### Test File Structure

```
supabase/
├── tests/
│   └── update_installment_statuses.test.sql      # SQL function tests
├── functions/
│   └── update-installment-statuses/
│       └── test/
│           └── index.test.ts                      # Edge Function tests
__tests__/
└── integration/
    └── jobs/
        └── status-update.test.ts                  # Integration tests
```

### SQL Function Tests

**File: `supabase/tests/update_installment_statuses.test.sql`**

```sql
-- Test setup
BEGIN;

-- Create test agencies
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time)
VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Brisbane Test Agency', 'Australia/Brisbane', '17:00:00'),
  ('a2000000-0000-0000-0000-000000000002', 'LA Test Agency', 'America/Los_Angeles', '17:00:00');

-- Create test payment plans
INSERT INTO payment_plans (id, agency_id, status, expected_commission)
VALUES
  ('p1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'active', 1000),
  ('p2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 'active', 2000),
  ('p3000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'cancelled', 500);

-- Test Case 1: Installment due yesterday → overdue
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount)
VALUES ('i1', 'p1000000-0000-0000-0000-000000000001', 'pending', CURRENT_DATE - INTERVAL '1 day', 100);

-- Test Case 2: Installment due today, before cutoff → pending
-- (This test depends on current time, may need mocking)
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount)
VALUES ('i2', 'p1000000-0000-0000-0000-000000000001', 'pending', CURRENT_DATE, 100);

-- Test Case 3: Installment due tomorrow → pending
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount)
VALUES ('i3', 'p1000000-0000-0000-0000-000000000001', 'pending', CURRENT_DATE + INTERVAL '1 day', 100);

-- Test Case 4: Installment in cancelled plan → ignored
INSERT INTO installments (id, payment_plan_id, status, student_due_date, amount)
VALUES ('i4', 'p3000000-0000-0000-0000-000000000003', 'pending', CURRENT_DATE - INTERVAL '1 day', 100);

-- Run function
SELECT * FROM update_installment_statuses();

-- Assertions
SELECT
  i.id,
  i.status,
  CASE
    WHEN i.id = 'i1' AND i.status = 'overdue' THEN 'PASS'
    WHEN i.id = 'i2' AND i.status = 'pending' THEN 'PASS'
    WHEN i.id = 'i3' AND i.status = 'pending' THEN 'PASS'
    WHEN i.id = 'i4' AND i.status = 'pending' THEN 'PASS'  -- Unchanged (cancelled plan)
    ELSE 'FAIL'
  END AS test_result
FROM installments i
WHERE i.id IN ('i1', 'i2', 'i3', 'i4');

-- Cleanup
ROLLBACK;
```

### Edge Function Tests

**File: `supabase/functions/update-installment-statuses/test/index.test.ts`**

```typescript
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

Deno.test("Edge Function - Valid API Key", async () => {
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: {
      "X-API-Key": Deno.env.get("SUPABASE_FUNCTION_KEY")!,
      "Content-Type": "application/json",
    },
  });

  // Mock handler response
  // (Full implementation would require mocking Supabase client)
  const expectedStatus = 200;

  assertEquals(req.headers.get("X-API-Key"), Deno.env.get("SUPABASE_FUNCTION_KEY"));
});

Deno.test("Edge Function - Invalid API Key", async () => {
  const req = new Request("http://localhost:8000", {
    method: "POST",
    headers: {
      "X-API-Key": "invalid-key",
      "Content-Type": "application/json",
    },
  });

  // Mock validation
  const isValid = req.headers.get("X-API-Key") === Deno.env.get("SUPABASE_FUNCTION_KEY");
  assertEquals(isValid, false);
});

Deno.test("Retry Logic - Transient Error", async () => {
  let attempt = 0;
  const mockFn = async () => {
    attempt++;
    if (attempt < 3) {
      throw { message: "connection timeout" };
    }
    return "success";
  };

  // Test executeWithRetry function
  const result = await executeWithRetry(mockFn);
  assertEquals(result, "success");
  assertEquals(attempt, 3);
});
```

### Integration Tests

**File: `__tests__/integration/jobs/status-update.test.ts`**

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const functionKey = process.env.SUPABASE_FUNCTION_KEY!;

describe('Status Update Job Integration', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseServiceKey);
  });

  it('should update overdue installments', async () => {
    // Setup: Create test data
    const { data: agency } = await supabase
      .from('agencies')
      .insert({ name: 'Test Agency', timezone: 'Australia/Brisbane' })
      .select()
      .single();

    const { data: plan } = await supabase
      .from('payment_plans')
      .insert({ agency_id: agency.id, status: 'active' })
      .select()
      .single();

    await supabase
      .from('installments')
      .insert({
        payment_plan_id: plan.id,
        status: 'pending',
        student_due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        amount: 100,
      });

    // Execute: Call Edge Function
    const response = await fetch(`${supabaseUrl}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': functionKey,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    // Assert: Verify results
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.recordsUpdated).toBeGreaterThan(0);

    // Verify installment status changed
    const { data: installments } = await supabase
      .from('installments')
      .select('status')
      .eq('payment_plan_id', plan.id);

    expect(installments![0].status).toBe('overdue');

    // Verify jobs_log entry
    const { data: logs } = await supabase
      .from('jobs_log')
      .select('*')
      .eq('job_name', 'update-installment-statuses')
      .order('started_at', { ascending: false })
      .limit(1);

    expect(logs![0].status).toBe('success');
    expect(logs![0].records_updated).toBeGreaterThan(0);
  });

  it('should reject invalid API key', async () => {
    const response = await fetch(`${supabaseUrl}/functions/v1/update-installment-statuses`, {
      method: 'POST',
      headers: {
        'X-API-Key': 'invalid-key',
        'Content-Type': 'application/json',
      },
    });

    expect(response.status).toBe(401);
  });

  afterAll(async () => {
    // Cleanup test data
  });
});
```

### Manual Testing Checklist

**Test 1: Manual Cron Trigger**

```sql
-- Manually invoke the same SQL that pg_cron runs
SELECT net.http_post(
  url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'X-API-Key', current_setting('app.supabase_function_key')
  ),
  body := '{}'::jsonb
);

-- Check jobs_log
SELECT * FROM jobs_log ORDER BY started_at DESC LIMIT 1;

-- Verify installments updated
SELECT COUNT(*) FROM installments WHERE status = 'overdue';
```

**Test 2: Verify Scheduled Job**

```sql
-- Check job is scheduled
SELECT * FROM cron.job WHERE jobname = 'update-installment-statuses-daily';

-- Check recent runs
SELECT * FROM cron.job_run_details
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'update-installment-statuses-daily')
ORDER BY start_time DESC
LIMIT 5;
```

**Test 3: Multi-Agency Timezone Test**

```sql
-- Create agencies in different timezones
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time)
VALUES
  (gen_random_uuid(), 'Brisbane Agency', 'Australia/Brisbane', '17:00:00'),
  (gen_random_uuid(), 'LA Agency', 'America/Los_Angeles', '17:00:00'),
  (gen_random_uuid(), 'Tokyo Agency', 'Asia/Tokyo', '17:00:00');

-- Create test installments for each agency
-- Run job
-- Verify each agency's timezone was respected
```

### Test Running Instructions

**SQL Tests:**
```bash
# Run SQL tests via psql
psql -h localhost -p 54322 -U postgres -d postgres \
  -f supabase/tests/update_installment_statuses.test.sql
```

**Deno Tests:**
```bash
# Run Edge Function tests
cd supabase/functions/update-installment-statuses
deno test --allow-env --allow-net test/
```

**Integration Tests:**
```bash
# Run integration tests with Vitest
npm test __tests__/integration/jobs/status-update.test.ts
```

---

## Implementation Notes

### Test Data Setup

**Use Transactions:**
- Wrap tests in BEGIN/ROLLBACK
- Keeps database clean
- Allows parallel test execution

**Use Unique IDs:**
- Use predictable UUIDs for test data
- Makes assertions easier
- Avoids conflicts with real data

### Mocking Considerations

**Edge Function Mocking:**
- Deno supports mocking via `https://deno.land/x/mock/`
- Mock Supabase client for unit tests
- Use real Supabase for integration tests

**Time-Dependent Tests:**
- Current time affects cutoff time logic
- Options:
  1. Mock system time (complex in PostgreSQL)
  2. Test with fixed dates in past
  3. Test only date-based logic (not time-based)

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Status Update Job

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: supabase/setup-cli@v1
      - run: supabase start
      - run: psql -f supabase/tests/update_installment_statuses.test.sql
      - run: npm test
```

---

## Next Steps

1. Write SQL function tests
2. Write Edge Function tests
3. Write integration tests
4. Run all tests and verify they pass
5. Perform manual testing
6. Document test results
7. When Task 7 is complete:
   - Update `MANIFEST.md`: Set Task 7 status to "Completed" with completion date
   - Add test file paths to "Files Created"
   - Add test results summary to implementation notes
   - Move to `task-08-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
