# Migration 010: Agency Timezone and Cutoff Time Fields

**Epic:** 5 - Automated Installment Status Management
**Story:** 5.1 - Automated Status Detection Job
**Task:** 6 - Add Agency Timezone and Cutoff Time Fields

## Overview

This migration adds three fields to the `agencies` table to enable timezone-aware overdue detection:

1. **overdue_cutoff_time** (TIME): Time of day when installments become overdue (default: 17:00:00)
2. **due_soon_threshold_days** (INT): Days before due date to flag as "due soon" (default: 4)
3. **timezone** constraint: Validates IANA timezone names (column already exists from migration 001)

## Changes

### New Columns

| Column | Type | Default | Constraint |
|--------|------|---------|------------|
| overdue_cutoff_time | TIME | '17:00:00' | Between 00:00:00 and 23:59:59 |
| due_soon_threshold_days | INT | 4 | Between 1 and 30 |

### Check Constraints

1. **agencies_timezone_check**: Validates timezone against list of common IANA timezone names
2. **agencies_cutoff_time_check**: Ensures cutoff time is valid (00:00:00 to 23:59:59)
3. **agencies_due_soon_days_check**: Ensures threshold days is between 1 and 30

### Supported Timezones

The migration includes support for 50+ IANA timezones including:

- **Australia**: Brisbane, Sydney, Melbourne, Perth, Adelaide, Darwin, Hobart, Canberra
- **Americas**: Los Angeles, New York, Chicago, Denver, Phoenix, Toronto, Vancouver
- **Europe**: London, Paris, Berlin, Rome, Madrid, Amsterdam, Brussels, Vienna
- **Asia**: Tokyo, Singapore, Hong Kong, Shanghai, Seoul, Bangkok, Dubai, Kolkata
- **Pacific**: Auckland, Fiji, Guam, Honolulu
- **Other**: UTC

## Running the Migration

### Local Development

```bash
# Start Supabase (if not running)
npx supabase start

# Apply migration
npx supabase db reset

# Or apply this specific migration
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/migrations/001_agency_domain/010_add_agency_timezone_fields.sql
```

### Production

Migrations are applied automatically via Supabase deployment pipeline.

## Testing

Comprehensive test suite available at: `supabase/tests/test-agency-timezone-fields.sql`

### Run Tests

```bash
# After applying migration, run tests
psql postgresql://postgres:postgres@localhost:54322/postgres < supabase/tests/test-agency-timezone-fields.sql
```

### Test Coverage

The test script includes 10 comprehensive tests:

1. ✅ Column schema verification (data types, defaults, nullability)
2. ✅ Check constraints existence
3. ✅ Column comments verification
4. ✅ Valid values insertion (5 test scenarios)
5. ✅ Invalid timezone rejection
6. ✅ Invalid cutoff time rejection
7. ✅ Invalid due soon days rejection (too low and too high)
8. ✅ Timezone conversion functionality
9. ✅ Existing agencies have default values
10. ✅ New inserts receive default values

### Quick Manual Test

```sql
-- Verify columns exist
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days');

-- Test timezone conversion
SELECT
  now() AS utc_time,
  now() AT TIME ZONE 'Australia/Brisbane' AS brisbane_time,
  now() AT TIME ZONE 'America/Los_Angeles' AS la_time;
```

## Usage Example

### How Status Update Function Uses These Fields

```sql
-- Example from update_installment_statuses() function
-- (Task 1 of Story 5.1)

FOR agency_rec IN
  SELECT id, timezone, overdue_cutoff_time, due_soon_threshold_days
  FROM agencies
LOOP
  -- Get current time in agency's timezone
  current_time_in_zone := (now() AT TIME ZONE agency_rec.timezone);

  -- Check if past cutoff time
  IF student_due_date < CURRENT_DATE OR
     (student_due_date = CURRENT_DATE AND
      current_time_in_zone::TIME > agency_rec.overdue_cutoff_time)
  THEN
    -- Mark as overdue
    UPDATE installments
    SET status = 'overdue', updated_at = now()
    WHERE agency_id = agency_rec.id
      AND status = 'pending'
      AND due_date <= student_due_date;
  END IF;
END LOOP;
```

### Updating Agency Settings

```sql
-- Set custom timezone and cutoff for an agency
UPDATE agencies
SET
  timezone = 'America/New_York',
  overdue_cutoff_time = '18:00:00',
  due_soon_threshold_days = 5
WHERE id = 'agency-uuid-here';
```

## Future Enhancements

### Story 5.2: Due Soon Flags

The `due_soon_threshold_days` field is added now but will be used in future Story 5.2:

```sql
-- Future usage (Story 5.2)
SELECT *
FROM installments
WHERE status = 'pending'
  AND due_date BETWEEN CURRENT_DATE
    AND (CURRENT_DATE + (
      SELECT due_soon_threshold_days
      FROM agencies
      WHERE id = installments.agency_id
    ));
```

### Optional: Admin UI

Future enhancement could include admin UI for managing agency settings:

**Location**: `apps/agency/app/settings/page.tsx`

**Fields**:
- Timezone: Dropdown selector
- Overdue Cutoff Time: Time picker
- Due Soon Threshold: Number input (1-30)

## Database Impact

- **Existing agencies**: Backfilled with default values
- **New agencies**: Automatically receive default values
- **Storage**: Minimal (~12 bytes per row)
- **Performance**: No indexes needed (fields used in batch jobs, not queries)

## Rollback

If needed, rollback can be done via:

```sql
-- Remove constraints
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_cutoff_time_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_due_soon_days_check;

-- Remove columns
ALTER TABLE agencies DROP COLUMN IF EXISTS overdue_cutoff_time;
ALTER TABLE agencies DROP COLUMN IF EXISTS due_soon_threshold_days;
```

**Note**: Rollback will not remove the timezone column as it was added in migration 001.

## References

- **Architecture**: [docs/architecture.md](../../docs/architecture.md) - Pattern 3: Automated Status State Machine
- **Story Context**: [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](../../.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
- **Related Tasks**:
  - Task 1: `update_installment_statuses()` function (uses these fields)
  - Task 5.2: Due Soon Flags (will use `due_soon_threshold_days`)

## Support

For questions or issues:
- Check test output: `supabase/tests/test-agency-timezone-fields.sql`
- Review IANA timezone names: [Wikipedia - IANA Time Zone Database](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones)
- Verify PostgreSQL timezone support: `SELECT * FROM pg_timezone_names;`
