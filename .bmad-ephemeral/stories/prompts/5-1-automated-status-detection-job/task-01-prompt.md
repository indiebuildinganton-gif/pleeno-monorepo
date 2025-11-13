# Story 5-1: Automated Status Detection Job - Task 1

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 1: Create Status Update Database Function

### Description
Create a PostgreSQL function that updates installment statuses based on due dates and agency timezone settings. This function handles timezone-aware status transitions from "pending" to "overdue" for multiple agencies.

### Implementation Checklist
- [ ] Create SQL function: `update_installment_statuses()`
- [ ] Function returns: TABLE(agency_id UUID, updated_count INT, transitions JSONB)
- [ ] Loop through each agency (handle different timezones)
- [ ] For each agency:
  - [ ] Get current time in agency's timezone
  - [ ] Update installments WHERE status = 'pending' AND student_due_date < CURRENT_DATE
  - [ ] Update installments WHERE status = 'pending' AND student_due_date = CURRENT_DATE AND current_time > overdue_cutoff_time
  - [ ] Only process installments linked to payment_plans with status = 'active'
  - [ ] Count transitions: { pending_to_overdue: count }
- [ ] Wrap all updates in database transaction (BEGIN/COMMIT or ROLLBACK on error)
- [ ] Ensure RLS policies apply (agency_id filtering automatic via existing policies)
- [ ] Add error handling with meaningful error messages

### Acceptance Criteria
- **AC 1**: Automated Status Detection
  - All installments with status "pending" and student_due_date < CURRENT_DATE are marked as "overdue"
  - Job only processes installments for active payment plans
  - Job respects agency timezone and cutoff time (5:00 PM default)

- **AC 3**: Execution Logging and Monitoring
  - Log includes count of status transitions per agency (returned in transitions JSONB)

### Key Constraints
- Database Transaction: All updates must be atomic (wrapped in BEGIN/COMMIT)
- RLS Enforcement: Function respects existing RLS policies on installments table
- Timezone Awareness: Use agency.timezone field with AT TIME ZONE operator
- Cutoff Time: Use agency.overdue_cutoff_time field (default '17:00')
- Active Plans Only: Filter installments by payment_plans.status = 'active'
- Return Format: TABLE(agency_id UUID, updated_count INT, transitions JSONB)

### Function Signature

```sql
CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
-- Implementation here
$$;
```

### Timezone Handling Pattern

From architecture.md:

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

### Function Logic Outline

```sql
BEGIN
  -- For each agency
  FOR agency_record IN SELECT id, timezone, overdue_cutoff_time FROM agencies LOOP
    -- Get current time in agency timezone
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments past due date
    WITH updated AS (
      UPDATE installments i
      SET status = 'overdue'
      FROM payment_plans pp
      WHERE i.payment_plan_id = pp.id
        AND pp.agency_id = agency_record.id
        AND pp.status = 'active'
        AND i.status = 'pending'
        AND (
          i.student_due_date < CURRENT_DATE
          OR (i.student_due_date = CURRENT_DATE AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time)
        )
      RETURNING i.id
    )
    SELECT count(*) INTO updated_count FROM updated;

    -- Return results
    RETURN QUERY SELECT
      agency_record.id,
      updated_count,
      jsonb_build_object('pending_to_overdue', updated_count);
  END LOOP;
END;
```

### Dependencies
- PostgreSQL 12+ (for AT TIME ZONE support)
- Existing tables: `agencies`, `installments`, `payment_plans`
- Existing RLS policies on installments and payment_plans tables

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) Pattern 3: Automated Status State Machine (lines 669-843)
- Database schema: Assumes agencies table has `timezone` and `overdue_cutoff_time` fields (added in Task 6)

### Testing Approach

After implementing, test the function:

```sql
-- Create test data
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time)
VALUES
  ('a1...', 'Brisbane Agency', 'Australia/Brisbane', '17:00'),
  ('a2...', 'LA Agency', 'America/Los_Angeles', '17:00');

-- Create test installments with various due dates
-- Run function
SELECT * FROM update_installment_statuses();

-- Verify results
SELECT agency_id, COUNT(*) FROM installments WHERE status = 'overdue' GROUP BY agency_id;
```

---

## Implementation Notes

### Database Location
Create this function in the migration file that will be assembled in Task 9:
- File: `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql`

For now, you can create a draft SQL file or include it directly in the migration:
- Draft location: `supabase/migrations/drafts/update_installment_statuses.sql`

### Security Considerations
- Use `SECURITY DEFINER` to allow function to update records across all agencies
- RLS policies still apply to queries within the function
- Function should be owned by service role or equivalent privileged user

### Performance Considerations
- Function loops through agencies (not installments) for efficiency
- Single UPDATE query per agency with JOIN to payment_plans
- Index requirements:
  - `installments(payment_plan_id, status, student_due_date)`
  - `payment_plans(agency_id, status)`

---

## Next Steps

1. Implement the SQL function following the outline above
2. Test locally with sample data
3. Verify timezone handling works correctly for multiple agencies
4. When Task 1 is complete:
   - Update `MANIFEST.md`: Set Task 1 status to "Completed" with completion date
   - Add file path to "Files Created"
   - Add any implementation notes
   - Move to `task-02-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
