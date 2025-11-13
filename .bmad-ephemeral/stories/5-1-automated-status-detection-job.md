# Story 5.1: Automated Status Detection Job

Status: ready-for-dev

## Story

As a **system**,
I want **a scheduled job that runs daily to update installment statuses**,
So that **overdue payments are automatically detected without manual checking**.

## Acceptance Criteria

1. **Automated Status Detection**
   - **Given** installments exist with due dates
   - **When** the daily status check job runs
   - **Then** all installments with status "pending" and student_due_date < CURRENT_DATE are marked as "overdue"
   - **And** the job only processes installments for active payment plans
   - **And** the job respects agency timezone and cutoff time (5:00 PM default)

2. **Scheduled Execution**
   - **Given** the system is operational
   - **When** the scheduled time arrives (7:00 AM UTC = 5:00 PM Brisbane time)
   - **Then** the job runs automatically every day at this time
   - **And** the job executes via Supabase Edge Function invoked by pg_cron
   - **And** the cron schedule is: `0 7 * * *` (daily at 7:00 AM UTC)

3. **Execution Logging and Monitoring**
   - **Given** the status update job runs
   - **When** the job completes (success or failure)
   - **Then** execution details are logged to jobs_log table with:
     - job_name, started_at, completed_at, records_updated, status, error_message
   - **And** the log includes count of status transitions per agency
   - **And** monitoring/alerting is configured if job fails

4. **Reliability and Error Handling**
   - **Given** the job encounters an error (database timeout, network issue)
   - **When** the error occurs
   - **Then** the job logs the error with full context (error message, stack trace)
   - **And** the job retries on transient errors (max 3 retries with exponential backoff)
   - **And** the job does not leave installments in inconsistent state (atomic updates)
   - **And** failed executions trigger alerts to system administrators

5. **Security and Access Control**
   - **Given** the Edge Function endpoint is exposed
   - **When** external requests attempt to invoke it
   - **Then** the endpoint is protected by API key authentication
   - **And** only authorized cron job or system administrators can trigger the job
   - **And** the API key is stored securely in Supabase secrets

## Tasks / Subtasks

- [ ] **Task 1: Create Status Update Database Function** (AC: 1, 3)
  - [ ] Create SQL function: update_installment_statuses() in migration file
  - [ ] Function logic:
    - Loop through each agency (handle different timezones)
    - Get current time in agency's timezone
    - Update installments WHERE status = 'pending' AND student_due_date < CURRENT_DATE
    - Update installments WHERE status = 'pending' AND student_due_date = CURRENT_DATE AND current_time > overdue_cutoff_time
    - Only process installments linked to payment_plans with status = 'active'
  - [ ] Function returns: TABLE(agency_id UUID, updated_count INT, transitions JSONB)
  - [ ] Transitions JSONB includes: { pending_to_overdue: count }
  - [ ] Ensure RLS policies apply (agency_id filtering)
  - [ ] Add transaction handling: BEGIN/COMMIT or ROLLBACK on error

- [ ] **Task 2: Create Jobs Log Table** (AC: 3)
  - [ ] Create jobs_log table in migration:
    - id UUID PRIMARY KEY
    - job_name TEXT NOT NULL
    - started_at TIMESTAMPTZ NOT NULL
    - completed_at TIMESTAMPTZ
    - records_updated INT DEFAULT 0
    - status TEXT CHECK (status IN ('running', 'success', 'failed'))
    - error_message TEXT
    - metadata JSONB (for storing agency-level results)
    - created_at TIMESTAMPTZ DEFAULT now()
  - [ ] Add index: CREATE INDEX idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC)
  - [ ] RLS: Admin-only read access (no agency_id needed, system-wide logs)

- [ ] **Task 3: Create Supabase Edge Function** (AC: 2, 4, 5)
  - [ ] Create Edge Function: supabase/functions/update-installment-statuses/index.ts
  - [ ] Function structure:
    - Validate API key from request headers (X-API-Key)
    - Log job start to jobs_log table
    - Call update_installment_statuses() database function
    - Collect results from all agencies
    - Log job completion with total records_updated and metadata
    - Error handling: Try/catch with retry logic (max 3 retries, exponential backoff)
  - [ ] Retry logic:
    - Retry on transient errors: network timeout, database connection error
    - Do not retry on: authentication error, validation error
    - Exponential backoff: wait 1s, 2s, 4s between retries
  - [ ] Response: { success: boolean, recordsUpdated: number, agencies: AgencyResult[] }

- [ ] **Task 4: Configure pg_cron Schedule** (AC: 2)
  - [ ] Create SQL migration to set up pg_cron job
  - [ ] Install pg_cron extension if not already enabled: CREATE EXTENSION IF NOT EXISTS pg_cron
  - [ ] Schedule job:
    ```sql
    SELECT cron.schedule(
      'update-installment-statuses-daily',
      '0 7 * * *',  -- 7:00 AM UTC daily
      $$
      SELECT net.http_post(
        url := 'https://<project-ref>.supabase.co/functions/v1/update-installment-statuses',
        headers := jsonb_build_object('X-API-Key', current_setting('app.supabase_function_key')),
        body := '{}'::jsonb
      )
      $$
    );
    ```
  - [ ] Store API key in Supabase secrets: app.supabase_function_key
  - [ ] Test cron job manually: SELECT cron.schedule_in_database(...)

- [ ] **Task 5: Implement API Key Authentication** (AC: 5)
  - [ ] Generate secure API key (UUID or JWT)
  - [ ] Store API key in Supabase secrets vault
  - [ ] Edge Function validates X-API-Key header:
    - Read expected key from environment: Deno.env.get('SUPABASE_FUNCTION_KEY')
    - Compare request header to expected key
    - Return 401 Unauthorized if mismatch
  - [ ] Document API key rotation procedure for future

- [ ] **Task 6: Add Agency Timezone and Cutoff Time Fields** (AC: 1)
  - [ ] Add fields to agencies table (if not already present from architecture):
    - timezone TEXT DEFAULT 'Australia/Brisbane'
    - overdue_cutoff_time TIME DEFAULT '17:00'
    - due_soon_threshold_days INT DEFAULT 4 (for future story 5.2)
  - [ ] Backfill existing agencies with default values
  - [ ] Update agency settings UI to allow admin to configure timezone and cutoff time

- [ ] **Task 7: Testing** (AC: All)
  - [ ] Write unit test for update_installment_statuses() SQL function:
    - Test with installment due yesterday → status changes to overdue
    - Test with installment due today before cutoff → status remains pending
    - Test with installment due today after cutoff → status changes to overdue
    - Test multi-agency: each agency uses its own timezone
    - Test only active payment plans processed
  - [ ] Write integration test for Edge Function:
    - Mock database with test installments
    - Call Edge Function endpoint
    - Verify installments updated correctly
    - Verify jobs_log entry created
  - [ ] Write integration test for API key authentication:
    - Call endpoint without API key → 401 Unauthorized
    - Call endpoint with wrong API key → 401 Unauthorized
    - Call endpoint with correct API key → 200 Success
  - [ ] Write integration test for retry logic:
    - Mock transient database error → verify retry attempts
    - Mock permanent error → verify no retry, log error
  - [ ] Manual test of pg_cron scheduling:
    - Trigger cron job manually via SQL
    - Verify Edge Function called
    - Verify installments updated
    - Check jobs_log for execution record

- [ ] **Task 8: Monitoring and Alerting Setup** (AC: 3, 4)
  - [ ] Set up monitoring dashboard in Supabase or external tool (e.g., Sentry)
  - [ ] Create alert rule: If job status = 'failed' → send email/Slack notification to admin
  - [ ] Create alert rule: If job hasn't run in 25 hours → send alert (missed execution)
  - [ ] Log job execution metrics: duration, records_updated, errors
  - [ ] Document monitoring procedures in README or operations guide

- [ ] **Task 9: Migration File Creation** (AC: All)
  - [ ] Create migration: supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql
  - [ ] Migration includes:
    - pg_cron extension installation
    - jobs_log table creation
    - update_installment_statuses() function
    - Agency table updates (timezone, cutoff_time, due_soon_threshold_days)
    - pg_cron job schedule configuration
  - [ ] Test migration on local Supabase instance
  - [ ] Verify rollback procedure (if migration fails, how to revert)

- [ ] **Task 10: Documentation** (AC: All)
  - [ ] Document Edge Function deployment procedure
  - [ ] Document API key configuration and rotation
  - [ ] Document how to manually trigger status update job (for testing/debugging)
  - [ ] Document monitoring and alerting setup
  - [ ] Document troubleshooting: What to do if job fails
  - [ ] Add inline code comments explaining timezone handling and cutoff logic

## Dev Notes

### Architecture Patterns and Constraints

**Background Job Architecture:**

Based on [architecture.md#Pattern-3-Automated-Status-State-Machine](architecture.md), the status automation system uses:

1. **pg_cron Extension**: PostgreSQL-native job scheduling
   - Runs inside Supabase database
   - Cron expression: `0 7 * * *` (7:00 AM UTC daily)
   - Calls Supabase Edge Function via HTTP POST

2. **Supabase Edge Function**: Business logic execution
   - Deno-based serverless function
   - Handles retry logic and error handling
   - Calls PostgreSQL function for status updates

3. **PostgreSQL Function**: Data manipulation
   - update_installment_statuses() performs actual updates
   - Handles multi-agency timezone logic
   - Returns results for logging

**Timezone Handling Pattern:**

```sql
-- Get current time in agency's timezone
current_time_in_zone := (now() AT TIME ZONE agency.timezone);

-- Check if past cutoff time
IF student_due_date < CURRENT_DATE OR
   (student_due_date = CURRENT_DATE AND current_time_in_zone::TIME > agency.overdue_cutoff_time)
THEN
  -- Mark as overdue
END IF;
```

**Status Transition Logic:**

From architecture.md Pattern 3:
- `draft` → `pending`: When due date arrives
- `pending` → `overdue`: When past due date + cutoff time
- Manual transitions: `pending` → `paid`, `overdue` → `paid`

Story 5.1 focuses on `pending` → `overdue` automated transition.

**Error Handling and Retry:**

```typescript
// Edge Function retry logic
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

async function executeWithRetry(fn: () => Promise<any>, retries = 0): Promise<any> {
  try {
    return await fn();
  } catch (error) {
    if (retries >= MAX_RETRIES || !isTransientError(error)) {
      throw error; // Permanent error or max retries reached
    }
    const delay = INITIAL_DELAY * Math.pow(2, retries); // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries + 1);
  }
}

function isTransientError(error: any): boolean {
  // Network errors, timeouts, temporary database issues
  return error.code === 'ECONNRESET' ||
         error.code === 'ETIMEDOUT' ||
         error.message.includes('connection');
}
```

**Atomic Updates:**

All status updates wrapped in database transaction:
```sql
BEGIN;
  UPDATE installments SET status = 'overdue' WHERE ...;
  INSERT INTO audit_logs (...);
COMMIT;
```

If any step fails, entire transaction rolls back (no partial updates).

**Security Considerations:**

- Edge Function endpoint protected by API key (X-API-Key header)
- API key stored in Supabase secrets (not in code)
- RLS policies enforce agency_id filtering on installments table
- jobs_log table access restricted to admins only

### Project Structure Notes

**Database Structure:**

```
supabase/migrations/
├── 004_notifications_domain/
│   └── 001_jobs_infrastructure.sql              # NEW: pg_cron + jobs_log + update function
```

**Edge Functions:**

```
supabase/functions/
├── update-installment-statuses/
│   ├── index.ts                                  # NEW: Main function logic
│   └── deno.json                                 # NEW: Dependencies config
```

**Related Tables:**

- `agencies`: timezone, overdue_cutoff_time, due_soon_threshold_days (NEW fields)
- `installments`: status (updated by job)
- `jobs_log`: execution tracking (NEW table)
- `audit_logs`: status change audit trail (existing, updated by trigger)

**Deployment:**

```bash
# Deploy Edge Function
supabase functions deploy update-installment-statuses

# Apply migration (creates pg_cron job)
supabase db push
```

### Learnings from Previous Story

**From Story 4.5: Commission Calculation Engine (Status: drafted)**

Story 4.5 implemented the commission calculation logic that tracks earned vs expected commission. Story 5.1 introduces automated status updates that will affect commission calculations:

- **Payment Plan Status Dependencies**: Story 4.5 calculates commission only for `status = 'active'` payment plans. Story 5.1 respects this by only processing installments for active plans.
- **Installment Status Enum**: Story 4.5 references `status = 'paid'` for commission calculation. Story 5.1 adds automated `pending` → `overdue` transition, expanding the status state machine.
- **Query Invalidation Pattern**: Story 4.5 uses TanStack Query invalidation when payments recorded. Story 5.1 automated updates will require similar invalidation for dashboard widgets showing overdue counts.

**Database Context from Story 4.5:**

- `installments` table includes: id, payment_plan_id, status, student_due_date, college_due_date, paid_amount
- `payment_plans` table includes: id, status ('active', 'completed', 'cancelled'), agency_id
- RLS policies enforce agency_id filtering on all queries

**Architectural Continuity:**

- Follow RLS pattern: All installment updates filtered by agency_id automatically
- Use same audit_logs pattern: Status changes logged with timestamp, user_id (NULL for automated)
- Agency settings pattern: Add timezone and cutoff_time to agencies table (similar to commission settings)

**Key Interfaces:**

- `installments.status`: Enum includes 'draft', 'pending', 'overdue', 'paid', 'completed'
- `payment_plans.status`: Only 'active' plans processed by status update job
- `agencies.timezone`: Used for timezone-aware overdue detection
- `agencies.overdue_cutoff_time`: Default 17:00 (5 PM), configurable per agency

**Files Created in Story 4.5 (Reference):**

- `packages/utils/src/commission-calculator.ts`: Commission calculation utilities
- `apps/payments/app/plans/[id]/components/CommissionSummary.tsx`: Displays commission status
- `supabase/migrations/003_payments_domain/007_commission_calculations.sql`: Commission fields

**New Files for Story 5.1:**

- `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql`: Job scheduling setup
- `supabase/functions/update-installment-statuses/index.ts`: Edge Function for status updates
- No frontend components (system automation only)

**Integration Points:**

- Dashboard widgets from Epic 6 will query overdue installments count (Story 5.3, 5.4)
- Notification system from Story 5.5 will trigger emails when status changes to overdue
- Story 5.1 lays foundation for automated status tracking used throughout Epic 5

**Important Notes:**

- Story 5.1 is backend-only (no UI changes)
- Sets up infrastructure for Epic 5 stories: 5.2 (due soon flags), 5.3 (overdue alerts), 5.5 (email notifications)
- Automated status updates enable proactive agency workflows (the "wow moment" of Epic 5)
- Timezone handling ensures accurate overdue detection across international agencies

[Source: architecture.md#Pattern-3-Automated-Status-State-Machine, lines 669-843]

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-5.1-Automated-Status-Detection-Job]
- Full acceptance criteria: lines 850-877
- Prerequisites: Story 4.5 (Commission Calculation Engine)

**Architecture:**
- [Source: docs/architecture.md#Pattern-3-Automated-Status-State-Machine]
- Status transition logic: lines 685-705
- Automated update function: lines 715-781
- pg_cron scheduling: lines 783-788
- Timezone handling: lines 730-732

**PRD Requirements:**
- Epic 5 Goal: "Implement the automated status tracking bot that eliminates manual work and provides proactive alerts"
- FR-5.1: Automated status detection running daily at 7:00 AM UTC
- FR-5.1: Overdue payments automatically flagged without manual intervention

**Technical Decisions:**
- **Scheduling**: pg_cron extension (PostgreSQL-native, built into Supabase)
- **Execution**: Supabase Edge Functions (Deno-based serverless)
- **Timezone Awareness**: Agencies table stores timezone, status updates respect agency-local time
- **Cutoff Time**: Default 5:00 PM, configurable per agency (allows same-day grace period)
- **Error Handling**: Retry logic with exponential backoff, comprehensive logging
- **Security**: API key authentication for Edge Function endpoint

## Dev Agent Record

### Context Reference

- [5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
