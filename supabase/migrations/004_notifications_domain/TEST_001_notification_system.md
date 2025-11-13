# Test Plan: Notification System Migration

**Migration File:** `001_notification_system.sql`

**Story:** 5.5 - Automated Email Notifications (Multi-Stakeholder)

## Pre-Migration Checklist

- [ ] Verify existing tables (users, students, installments) exist
- [ ] Verify update_updated_at_column() function exists
- [ ] Backup database before running migration

## Migration Verification

### 1. Schema Creation Tests

Run these queries after migration to verify schema:

```sql
-- Verify new columns added to existing tables
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'email_notifications_enabled';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'students' AND column_name = 'assigned_user_id';

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'installments' AND column_name = 'last_notified_date';

-- Verify new tables created
SELECT table_name FROM information_schema.tables
WHERE table_name IN ('notification_rules', 'email_templates', 'notification_log');

-- Verify foreign key constraints
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('notification_rules', 'email_templates', 'notification_log');
```

### 2. Index Verification

```sql
-- Verify all indexes created
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('notification_rules', 'email_templates', 'notification_log', 'users', 'students', 'installments')
  AND indexname LIKE 'idx_%notification%' OR indexname LIKE 'idx_%email%' OR indexname LIKE 'idx_%assigned%';
```

### 3. RLS Policy Tests

#### Test Setup

Create test agency and users:

```sql
-- Create test agency
INSERT INTO agencies (id, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Test Agency 1');

-- Create test admin user
INSERT INTO users (id, agency_id, email, full_name, role, email_notifications_enabled)
VALUES
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'admin@test.com', 'Admin User', 'agency_admin', true);

-- Create test regular user
INSERT INTO users (id, agency_id, email, full_name, role, email_notifications_enabled)
VALUES
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'user@test.com', 'Regular User', 'agency_user', false);
```

#### Test 3.1: notification_rules RLS

**Expected Behavior:**
- Agency admins can CREATE, READ, UPDATE, DELETE rules
- Agency users can READ rules only (no CREATE/UPDATE/DELETE)

```sql
-- Test as admin (should succeed)
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims.sub TO '11111111-1111-1111-1111-111111111111';

INSERT INTO notification_rules (agency_id, recipient_type, event_type, is_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', 'student', 'overdue', true)
RETURNING id;

-- Test as regular user (should fail)
SET LOCAL request.jwt.claims.sub TO '22222222-2222-2222-2222-222222222222';

INSERT INTO notification_rules (agency_id, recipient_type, event_type, is_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', 'student', 'due_soon', true)
RETURNING id;
-- Expected: Permission denied

-- Test SELECT as regular user (should succeed)
SELECT * FROM notification_rules
WHERE agency_id = '00000000-0000-0000-0000-000000000001';
-- Expected: Returns rules for Test Agency 1
```

#### Test 3.2: email_templates RLS

**Expected Behavior:**
- Agency admins can CREATE, READ, UPDATE, DELETE templates
- Agency users can READ templates only

```sql
-- Test as admin (should succeed)
SET LOCAL request.jwt.claims.sub TO '11111111-1111-1111-1111-111111111111';

INSERT INTO email_templates (agency_id, template_type, subject, body_html)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'overdue_student',
  'Payment Overdue',
  '<p>Dear {{student.name}}, your payment is overdue.</p>'
)
RETURNING id;

-- Test as regular user (should fail)
SET LOCAL request.jwt.claims.sub TO '22222222-2222-2222-2222-222222222222';

INSERT INTO email_templates (agency_id, template_type, subject, body_html)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'due_soon_student',
  'Payment Due Soon',
  '<p>Dear {{student.name}}, your payment is due soon.</p>'
)
RETURNING id;
-- Expected: Permission denied
```

#### Test 3.3: notification_log RLS

**Expected Behavior:**
- Agency users can READ logs for their agency's installments
- Regular users CANNOT INSERT logs (service role only)

```sql
-- Create test installment first
INSERT INTO payment_plans (id, agency_id, student_id, total_amount, currency)
VALUES ('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', '44444444-4444-4444-4444-444444444444', 10000.00, 'AUD');

INSERT INTO installments (id, payment_plan_id, agency_id, installment_number, amount, status)
VALUES ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 1, 1000.00, 'pending');

-- Test INSERT as regular user (should fail)
SET LOCAL request.jwt.claims.sub TO '22222222-2222-2222-2222-222222222222';

INSERT INTO notification_log (installment_id, recipient_type, recipient_email, event_type)
VALUES ('55555555-5555-5555-5555-555555555555', 'student', 'student@test.com', 'overdue');
-- Expected: Permission denied (only service role can insert)

-- Test SELECT as regular user (should succeed)
SELECT * FROM notification_log
WHERE installment_id = '55555555-5555-5555-5555-555555555555';
-- Expected: Returns logs for installments in Test Agency 1
```

### 4. UNIQUE Constraint Test

**Test duplicate notification prevention:**

```sql
-- Using service role (bypasses RLS)
-- First insert should succeed
INSERT INTO notification_log (installment_id, recipient_type, recipient_email, event_type)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'student',
  'student@test.com',
  'overdue'
);

-- Second insert with same values should fail
INSERT INTO notification_log (installment_id, recipient_type, recipient_email, event_type)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'student',
  'student@test.com',
  'overdue'
);
-- Expected: ERROR: duplicate key value violates unique constraint
```

### 5. CASCADE Delete Tests

```sql
-- Test CASCADE on notification_rules when agency is deleted
DELETE FROM agencies WHERE id = '00000000-0000-0000-0000-000000000001';

-- Verify all related records deleted
SELECT COUNT(*) FROM notification_rules WHERE agency_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 0

SELECT COUNT(*) FROM email_templates WHERE agency_id = '00000000-0000-0000-0000-000000000001';
-- Expected: 0

SELECT COUNT(*) FROM notification_log WHERE installment_id IN (
  SELECT id FROM installments WHERE agency_id = '00000000-0000-0000-0000-000000000001'
);
-- Expected: 0
```

### 6. Trigger Tests

```sql
-- Test updated_at trigger on notification_rules
INSERT INTO notification_rules (agency_id, recipient_type, event_type, is_enabled)
VALUES ('00000000-0000-0000-0000-000000000001', 'student', 'overdue', false)
RETURNING id, created_at, updated_at;

-- Wait 1 second
SELECT pg_sleep(1);

-- Update the rule
UPDATE notification_rules
SET is_enabled = true
WHERE agency_id = '00000000-0000-0000-0000-000000000001'
  AND recipient_type = 'student'
  AND event_type = 'overdue'
RETURNING id, created_at, updated_at;

-- Verify updated_at changed
-- Expected: updated_at > created_at
```

## Performance Tests

```sql
-- Test index usage for common queries
EXPLAIN ANALYZE
SELECT * FROM notification_rules
WHERE agency_id = '00000000-0000-0000-0000-000000000001'
  AND is_enabled = true
  AND recipient_type = 'student';
-- Expected: Uses idx_notification_rules_agency or idx_notification_rules_lookup

EXPLAIN ANALYZE
SELECT * FROM notification_log
WHERE installment_id = '55555555-5555-5555-5555-555555555555'
  AND recipient_email = 'student@test.com';
-- Expected: Uses idx_notification_log_installment
```

## Cleanup

```sql
-- Clean up test data
DELETE FROM agencies WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Definition of Done

- [ ] All tables created successfully
- [ ] All indexes created successfully
- [ ] RLS policies applied and tested
- [ ] Admin can CREATE/READ/UPDATE/DELETE rules and templates
- [ ] Regular users can READ rules and templates
- [ ] Regular users CANNOT CREATE/UPDATE/DELETE rules and templates
- [ ] Service role can INSERT into notification_log
- [ ] Regular users CANNOT INSERT into notification_log
- [ ] UNIQUE constraint prevents duplicate notifications
- [ ] CASCADE deletes work correctly
- [ ] Triggers update timestamps correctly
- [ ] Indexes improve query performance
- [ ] All foreign key constraints work correctly

## Known Limitations

- This migration cannot be run against a local database without:
  - Supabase CLI installed
  - Local Supabase instance running
  - Or connection to a remote Supabase project

## Manual Testing Instructions

When a database is available:

1. Run the migration:
   ```bash
   supabase migration up
   ```

2. Execute each test section above in order

3. Verify all expected behaviors

4. Document any failures or unexpected results
