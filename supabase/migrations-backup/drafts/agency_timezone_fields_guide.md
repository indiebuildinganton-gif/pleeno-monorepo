# Agency Timezone Fields Migration Guide

**Epic 5: Intelligent Status Automation**
**Story 5.1: Automated Status Detection Job - Task 6**

## Overview

This migration adds timezone and cutoff time fields to the `agencies` table to enable timezone-aware overdue detection. Each agency can have its own timezone and cutoff time for when installments are marked overdue.

## What's Included

### Files Created

1. **add_agency_timezone_fields.sql** - Main migration file
2. **test_add_agency_timezone_fields.sql** - Comprehensive test suite (15 tests)
3. **agency_timezone_fields_guide.md** - This guide

### Database Changes

The migration adds the following to the `agencies` table:

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `timezone` | TEXT | 'Australia/Brisbane' | IANA timezone name (already exists, adds validation) |
| `overdue_cutoff_time` | TIME | '17:00:00' | Time when installments become overdue |
| `due_soon_threshold_days` | INT | 4 | Days before due date for "due soon" flag |

### Check Constraints

1. **agencies_timezone_check** - Validates IANA timezone names (50+ supported timezones)
2. **agencies_cutoff_time_check** - Ensures time is between 00:00:00 and 23:59:59
3. **agencies_due_soon_days_check** - Ensures days are between 1 and 30

## How to Apply Migration

### Option 1: Local Development (Recommended for Testing)

```bash
# 1. Start local Supabase instance
npx supabase start

# 2. Move migration to permanent location (when ready)
cp supabase/migrations/drafts/add_agency_timezone_fields.sql \
   supabase/migrations/004_reports_domain/002_agency_timezone_fields.sql

# 3. Apply all migrations
npx supabase db reset

# 4. Verify migration applied
npx supabase db diff
```

### Option 2: Apply Draft Migration Directly

```bash
# 1. Start local Supabase instance
npx supabase start

# 2. Apply migration directly to local database
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/drafts/add_agency_timezone_fields.sql

# 3. Verify changes
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -c "\d+ agencies"
```

### Option 3: Production Deployment

```bash
# 1. Move migration to final location
mv supabase/migrations/drafts/add_agency_timezone_fields.sql \
   supabase/migrations/004_reports_domain/002_agency_timezone_fields.sql

# 2. Push to production
npx supabase db push

# 3. Verify deployment
npx supabase db diff
```

## Running Tests

### Full Test Suite (15 Tests)

The test suite includes comprehensive validation:
- Schema verification (columns, types, defaults, nullability)
- Check constraint validation (valid/invalid values)
- Data backfill verification
- Timezone conversion tests
- Integration tests
- Documentation tests
- Idempotency tests

```bash
# Run full test suite
psql postgresql://postgres:postgres@localhost:54322/postgres \
  -f supabase/migrations/drafts/test_add_agency_timezone_fields.sql
```

Expected output:
```
NOTICE:  TEST 1: Schema Verification - Columns Exist ✓ PASSED
NOTICE:  TEST 2: Schema Verification - Column Types and Defaults ✓ PASSED
NOTICE:  TEST 3: Schema Verification - NOT NULL Constraints ✓ PASSED
...
NOTICE:  ========================================
NOTICE:  TEST SUMMARY: All 15 tests PASSED ✓
NOTICE:  ========================================
```

### Quick Manual Verification

```sql
-- 1. Check columns exist
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days');

-- 2. Check constraints exist
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'agencies'::regclass
  AND (conname LIKE '%timezone%' OR conname LIKE '%cutoff%' OR conname LIKE '%due_soon%');

-- 3. View agencies with timezone settings
SELECT
  id,
  name,
  timezone,
  overdue_cutoff_time,
  due_soon_threshold_days
FROM agencies
ORDER BY name;

-- 4. Test timezone conversion
SELECT
  name,
  timezone,
  now() AT TIME ZONE 'UTC' AS utc_now,
  now() AT TIME ZONE timezone AS agency_local_time,
  (now() AT TIME ZONE timezone)::TIME AS local_time_only,
  overdue_cutoff_time,
  CASE
    WHEN (now() AT TIME ZONE timezone)::TIME > overdue_cutoff_time
    THEN 'Past cutoff - mark overdue'
    ELSE 'Before cutoff - still pending'
  END AS status_logic
FROM agencies
LIMIT 5;
```

## Testing Scenarios

### Test 1: Valid Timezones

```sql
-- All these should succeed
INSERT INTO agencies (id, name, timezone) VALUES
  (gen_random_uuid(), 'Test 1', 'Australia/Brisbane'),
  (gen_random_uuid(), 'Test 2', 'America/Los_Angeles'),
  (gen_random_uuid(), 'Test 3', 'Europe/London'),
  (gen_random_uuid(), 'Test 4', 'Asia/Tokyo'),
  (gen_random_uuid(), 'Test 5', 'UTC');
```

### Test 2: Invalid Timezones

```sql
-- These should fail with check constraint violation
INSERT INTO agencies (id, name, timezone)
VALUES (gen_random_uuid(), 'Invalid', 'Invalid/Timezone');

INSERT INTO agencies (id, name, timezone)
VALUES (gen_random_uuid(), 'Fake', 'America/FakeCity');
```

### Test 3: Valid Cutoff Times

```sql
-- Boundary values should succeed
INSERT INTO agencies (id, name, overdue_cutoff_time) VALUES
  (gen_random_uuid(), 'Midnight', '00:00:00'),
  (gen_random_uuid(), 'Noon', '12:00:00'),
  (gen_random_uuid(), 'End of Day', '23:59:59');
```

### Test 4: Invalid Cutoff Times

```sql
-- These should fail
INSERT INTO agencies (id, name, overdue_cutoff_time)
VALUES (gen_random_uuid(), 'Invalid', '25:00:00');  -- Invalid hour

INSERT INTO agencies (id, name, overdue_cutoff_time)
VALUES (gen_random_uuid(), 'Invalid', '12:60:00');  -- Invalid minute
```

### Test 5: Valid Due Soon Days

```sql
-- Boundary values should succeed
INSERT INTO agencies (id, name, due_soon_threshold_days) VALUES
  (gen_random_uuid(), 'Min', 1),
  (gen_random_uuid(), 'Mid', 15),
  (gen_random_uuid(), 'Max', 30);
```

### Test 6: Invalid Due Soon Days

```sql
-- These should fail with check constraint violation
INSERT INTO agencies (id, name, due_soon_threshold_days)
VALUES (gen_random_uuid(), 'Too Low', 0);

INSERT INTO agencies (id, name, due_soon_threshold_days)
VALUES (gen_random_uuid(), 'Too High', 31);

INSERT INTO agencies (id, name, due_soon_threshold_days)
VALUES (gen_random_uuid(), 'Negative', -5);
```

## Integration with Status Update Function

The timezone fields are used by the `update_installment_statuses()` function (Task 1):

```sql
-- Example logic from update_installment_statuses()
FOR agency_record IN
  SELECT id, timezone, overdue_cutoff_time
  FROM agencies
LOOP
  -- Get current time in agency's timezone
  current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

  -- Mark installments as overdue if past cutoff
  UPDATE installments
  SET status = 'overdue'
  WHERE agency_id = agency_record.id
    AND status = 'pending'
    AND (
      student_due_date < CURRENT_DATE OR
      (student_due_date = CURRENT_DATE AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time)
    );
END LOOP;
```

## Supported Timezones

The migration includes 50+ common IANA timezone names:

### Australia & Pacific
- Australia/Brisbane, Australia/Sydney, Australia/Melbourne, Australia/Perth, Australia/Adelaide
- Pacific/Auckland, Pacific/Fiji, Pacific/Honolulu

### Americas
- America/Los_Angeles, America/New_York, America/Chicago, America/Denver
- America/Toronto, America/Vancouver, America/Mexico_City
- America/Sao_Paulo, America/Buenos_Aires

### Europe
- Europe/London, Europe/Paris, Europe/Berlin, Europe/Rome
- Europe/Madrid, Europe/Amsterdam, Europe/Stockholm

### Asia
- Asia/Tokyo, Asia/Shanghai, Asia/Hong_Kong, Asia/Singapore
- Asia/Seoul, Asia/Bangkok, Asia/Dubai, Asia/Kolkata

### Other
- UTC (for global/default timezone)

**Need to add a timezone?** Edit the check constraint in the migration file and re-apply.

## Troubleshooting

### Problem: Migration fails with "column already exists"

**Solution:** The migration uses `IF NOT EXISTS` for idempotency. If you see this error, check if you're running an old version without `IF NOT EXISTS`. Update to the latest migration file.

### Problem: Check constraint violation on existing agency

**Solution:** Some agencies might have been created with invalid values before constraints were added. Fix with:

```sql
-- Find agencies with issues
SELECT id, name, timezone, overdue_cutoff_time, due_soon_threshold_days
FROM agencies
WHERE timezone NOT IN ('Australia/Brisbane', 'Australia/Sydney', ...)
   OR overdue_cutoff_time NOT BETWEEN '00:00:00' AND '23:59:59'
   OR due_soon_threshold_days NOT BETWEEN 1 AND 30;

-- Update to valid values
UPDATE agencies
SET timezone = 'Australia/Brisbane'
WHERE timezone NOT IN ('Australia/Brisbane', 'Australia/Sydney', ...);
```

### Problem: PostgreSQL doesn't support a timezone

**Solution:** PostgreSQL uses the IANA timezone database. To check available timezones:

```sql
-- List all available timezones
SELECT name FROM pg_timezone_names ORDER BY name;

-- Search for specific timezone
SELECT name FROM pg_timezone_names WHERE name LIKE '%Brisbane%';
```

### Problem: Test suite shows failures

**Solution:**
1. Ensure migration has been applied first
2. Check that Supabase is running (`npx supabase status`)
3. Verify database connection string is correct
4. Review error messages for specific constraint violations

## Rollback Procedure

If you need to rollback the migration:

```sql
-- Remove check constraints
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_cutoff_time_check;
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_due_soon_days_check;

-- Remove columns (WARNING: This deletes data!)
ALTER TABLE agencies DROP COLUMN IF EXISTS overdue_cutoff_time;
ALTER TABLE agencies DROP COLUMN IF EXISTS due_soon_threshold_days;

-- Note: timezone column existed before this migration, so don't drop it
```

**⚠️ WARNING:** Rollback will delete data in `overdue_cutoff_time` and `due_soon_threshold_days` columns. Only perform rollback if absolutely necessary.

## Next Steps

After applying this migration:

1. ✅ **Task 6 Complete** - Agency timezone fields added
2. 📋 **Task 7** - Run comprehensive testing
3. 📋 **Task 9** - Finalize migration file (move from drafts)
4. 📋 **Task 10** - Update documentation

## Production Checklist

Before deploying to production:

- [ ] Migration tested in local development environment
- [ ] All 15 tests passing in test suite
- [ ] Existing agencies verified to have valid default values
- [ ] Status update function (Task 1) tested with new fields
- [ ] Edge Function (Task 3) tested with timezone-aware logic
- [ ] pg_cron job (Task 4) tested with multiple agencies
- [ ] Database backup created before migration
- [ ] Rollback procedure documented and tested
- [ ] Monitoring alerts configured for constraint violations

## References

- **Migration File:** `supabase/migrations/drafts/add_agency_timezone_fields.sql`
- **Test Suite:** `supabase/migrations/drafts/test_add_agency_timezone_fields.sql`
- **Story Context:** `.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml`
- **Architecture:** `docs/architecture.md` (Pattern 3: Automated Status State Machine)
- **IANA Timezones:** https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

## Support

For questions or issues:
1. Check troubleshooting section above
2. Review test suite for examples
3. Consult Story 5.1 task prompts in `.bmad-ephemeral/stories/prompts/5-1-automated-status-detection-job/`
