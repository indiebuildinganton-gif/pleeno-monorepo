# Task 2 Deployment Guide: Generate Notifications When Installments Become Overdue

## Overview
This guide provides step-by-step instructions for deploying Task 2 of Story 5.3: Overdue Payment Alerts.

## Changes Made

### 1. Database Migration
**File:** `supabase/migrations/004_notifications_domain/002_add_metadata.sql`

Adds a metadata JSONB column to the notifications table for storing structured data (installment_id, etc.) and enables efficient deduplication.

### 2. Edge Function Enhancement
**File:** `supabase/functions/update-installment-statuses/index.ts`

Enhanced the status updater Edge Function to:
- Detect newly overdue installments (updated in last 2 minutes)
- Generate notifications for each newly overdue installment
- Implement deduplication using metadata.installment_id
- Include comprehensive error handling
- Return notification metrics in response

### 3. Unit Tests
**File:** `supabase/functions/update-installment-statuses/test/index.test.ts`

Added 8 new unit tests covering:
- Single and multiple overdue installment notifications
- Notification deduplication logic
- Message formatting with various amounts and dates
- Error handling for missing student data
- Response format validation

## Deployment Steps

### Step 1: Apply Database Migration

```bash
# Apply the metadata column migration
supabase db push
```

**What this does:**
- Adds `metadata` JSONB column to `notifications` table
- Creates GIN index for efficient JSONB queries
- Adds documentation comments

**Verification:**
```sql
-- Verify metadata column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'notifications' AND column_name = 'metadata';

-- Verify index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'notifications' AND indexname = 'idx_notifications_metadata';
```

### Step 2: Deploy Updated Edge Function

```bash
# Deploy the enhanced Edge Function
supabase functions deploy update-installment-statuses
```

**What this does:**
- Deploys updated Edge Function code with notification generation
- Maintains existing functionality (status updates, retry logic)
- Adds new notification generation after status updates

**Verification:**
```bash
# Check function deployment status
supabase functions list

# View function logs
supabase functions logs update-installment-statuses
```

### Step 3: Manual Test - Trigger Notification Generation

```bash
# Manually invoke the Edge Function to test notification generation
supabase functions invoke update-installment-statuses \
  --header "X-API-Key: <YOUR_FUNCTION_API_KEY>"
```

**Expected Response:**
```json
{
  "success": true,
  "recordsUpdated": <number>,
  "notificationsCreated": <number>,
  "agencies": [...]
}
```

### Step 4: Verify Notification Creation in Database

```sql
-- Check for newly created overdue notifications
SELECT
  n.id,
  n.type,
  n.message,
  n.link,
  n.is_read,
  n.metadata->>'installment_id' as installment_id,
  n.created_at
FROM notifications n
WHERE n.type = 'overdue_payment'
ORDER BY n.created_at DESC
LIMIT 10;

-- Verify notification count matches response
SELECT agency_id, COUNT(*) as notification_count
FROM notifications
WHERE type = 'overdue_payment'
  AND created_at >= NOW() - INTERVAL '5 minutes'
GROUP BY agency_id;
```

### Step 5: Test Deduplication

**Create a test scenario:**
1. Run the Edge Function to generate notifications
2. Run the Edge Function again immediately
3. Verify no duplicate notifications are created

```sql
-- Count notifications before second run
SELECT COUNT(*) as before_count
FROM notifications
WHERE type = 'overdue_payment';

-- Run Edge Function again (manually trigger)
-- Then check count again

SELECT COUNT(*) as after_count
FROM notifications
WHERE type = 'overdue_payment';

-- before_count should equal after_count (no duplicates)
```

### Step 6: Monitor Job Logs

```sql
-- Check job logs for notification metrics
SELECT
  id,
  job_name,
  status,
  records_updated,
  metadata->>'notifications_created' as notifications_created,
  metadata->>'notification_errors' as notification_errors,
  started_at,
  completed_at
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 5;
```

## Testing Scenarios

### Scenario 1: New Overdue Installment

**Setup:**
```sql
-- Create a test installment that's overdue
INSERT INTO installments (payment_plan_id, amount, student_due_date, status)
VALUES ('<payment_plan_id>', 500.00, CURRENT_DATE - INTERVAL '1 day', 'pending');
```

**Action:**
- Trigger the Edge Function manually
- OR wait for the scheduled job to run (7:00 AM UTC daily)

**Expected:**
- Installment status changes to 'overdue'
- Notification created with message: "Payment overdue: {Student Name} - $500.00 due {formatted_date}"
- Notification link: `/payments/plans?status=overdue`
- Notification metadata includes installment_id

**Verification:**
```sql
SELECT * FROM notifications
WHERE metadata->>'installment_id' = '<installment_id>';
```

### Scenario 2: Multiple Overdue Installments

**Setup:**
```sql
-- Create multiple test installments that are overdue
INSERT INTO installments (payment_plan_id, amount, student_due_date, status)
VALUES
  ('<plan1_id>', 500.00, CURRENT_DATE - INTERVAL '2 days', 'pending'),
  ('<plan2_id>', 1250.00, CURRENT_DATE - INTERVAL '3 days', 'pending'),
  ('<plan3_id>', 750.00, CURRENT_DATE - INTERVAL '1 day', 'pending');
```

**Expected:**
- 3 notifications created (one per installment)
- Each notification has unique message and metadata

### Scenario 3: Deduplication Test

**Setup:**
- Existing overdue installment with notification already created

**Action:**
- Run Edge Function again

**Expected:**
- No duplicate notification created
- Console log: "Notification already exists for installment {id}"

### Scenario 4: Missing Student Data

**Setup:**
- Installment with orphaned payment plan (no student data)

**Expected:**
- Error logged: "Installment {id}: Missing student data"
- Error included in response.notificationErrors array
- Job continues processing other installments
- Job status remains 'success' (errors don't fail the job)

## Rollback Procedure

If issues are encountered, follow these steps to rollback:

### 1. Rollback Edge Function
```bash
# Redeploy the previous version
git checkout HEAD~1 -- supabase/functions/update-installment-statuses/index.ts
supabase functions deploy update-installment-statuses
```

### 2. Rollback Database Migration (if needed)
```sql
-- Remove metadata column and index
DROP INDEX IF EXISTS idx_notifications_metadata;
ALTER TABLE notifications DROP COLUMN IF EXISTS metadata;
```

## Monitoring and Troubleshooting

### Monitor Edge Function Logs
```bash
# Follow logs in real-time
supabase functions logs update-installment-statuses --follow

# Filter for notification-related logs
supabase functions logs update-installment-statuses | grep -i "notification"
```

### Common Issues

**Issue 1: No notifications created (notificationsCreated: 0)**

**Possible causes:**
- No installments were marked overdue in the last 2 minutes
- All overdue installments already have notifications (deduplication working)
- Query for newly overdue installments returned no results

**Troubleshooting:**
```sql
-- Check for recent status updates
SELECT id, status, updated_at
FROM installments
WHERE status = 'overdue'
  AND updated_at >= NOW() - INTERVAL '5 minutes'
ORDER BY updated_at DESC;
```

**Issue 2: Notification errors in response**

**Possible causes:**
- Missing student data in payment plan
- Missing agency_id in payment plan
- Database connection issues

**Troubleshooting:**
- Review error messages in response.notificationErrors
- Check job logs for detailed error stack traces
- Verify data integrity in installments/payment_plans/students tables

**Issue 3: Duplicate notifications**

**Possible causes:**
- Metadata column not properly indexed
- Race condition if job runs multiple times simultaneously
- Deduplication query not working correctly

**Troubleshooting:**
```sql
-- Find duplicate notifications
SELECT
  metadata->>'installment_id' as installment_id,
  COUNT(*) as notification_count
FROM notifications
WHERE type = 'overdue_payment'
GROUP BY metadata->>'installment_id'
HAVING COUNT(*) > 1;

-- Delete duplicate notifications (keep oldest)
DELETE FROM notifications n1
WHERE n1.type = 'overdue_payment'
  AND EXISTS (
    SELECT 1
    FROM notifications n2
    WHERE n2.type = 'overdue_payment'
      AND n1.metadata->>'installment_id' = n2.metadata->>'installment_id'
      AND n1.id > n2.id
  );
```

## Success Criteria Checklist

- [ ] Database migration applied successfully
- [ ] Edge Function deployed without errors
- [ ] Manual test shows notifications being created
- [ ] Notification message format is correct
- [ ] Notification link points to `/payments/plans?status=overdue`
- [ ] Deduplication works (no duplicate notifications on re-run)
- [ ] Job logs show notification metrics
- [ ] Error handling works (missing data doesn't fail job)
- [ ] Unit tests pass (once Deno is available)

## Next Steps

After successful deployment and verification:

1. Monitor the scheduled job runs (7:00 AM UTC daily)
2. Review job logs for notification creation metrics
3. Verify agency users can see notifications in the UI (Task 3)
4. Update MANIFEST.md to mark Task 2 as complete
5. Proceed to Task 3: Build notification UI components

## Support and Documentation

- **Job Operations:** `docs/operations/status-update-job.md`
- **Troubleshooting:** `docs/runbooks/status-update-job-failures.md`
- **Story Context:** `.bmad-ephemeral/stories/5-3-overdue-payment-alerts.context.xml`
- **Architecture:** `docs/architecture.md` (Multi-Stakeholder Notification System)
