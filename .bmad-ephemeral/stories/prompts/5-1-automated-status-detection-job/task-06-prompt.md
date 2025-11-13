# Story 5-1: Automated Status Detection Job - Task 6

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 6: Add Agency Timezone and Cutoff Time Fields

### Description
Add timezone and cutoff time fields to the agencies table to enable timezone-aware overdue detection. Each agency can have its own timezone and cutoff time for when installments are marked overdue.

### Implementation Checklist
- [ ] Add `timezone` column to agencies table (TEXT, default 'Australia/Brisbane')
- [ ] Add `overdue_cutoff_time` column to agencies table (TIME, default '17:00')
- [ ] Add `due_soon_threshold_days` column to agencies table (INT, default 4) - for future Story 5.2
- [ ] Backfill existing agencies with default values
- [ ] Add check constraint on timezone (valid IANA timezone names)
- [ ] Add check constraint on overdue_cutoff_time (between '00:00' and '23:59')
- [ ] Add check constraint on due_soon_threshold_days (between 1 and 30)
- [ ] Update agencies table documentation/comments
- [ ] (Optional) Create agency settings UI for admin to configure these values

### Acceptance Criteria
- **AC 1**: Automated Status Detection
  - Job respects agency timezone and cutoff time (5:00 PM default)
  - Multiple agencies can have different timezones and cutoff times

### Key Constraints
- Timezone Format: Must use IANA timezone names (e.g., 'Australia/Brisbane', 'America/Los_Angeles')
- Cutoff Time Format: TIME type (HH:MM:SS), default '17:00:00'
- Due Soon Days: Integer between 1 and 30 days
- Backward Compatibility: Existing agencies get default values via backfill
- RLS Policies: Existing agency_id filtering applies automatically

### SQL Migration

```sql
-- Add timezone column
ALTER TABLE agencies
ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Australia/Brisbane';

-- Add overdue cutoff time column
ALTER TABLE agencies
ADD COLUMN overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00';

-- Add due soon threshold column (for future Story 5.2)
ALTER TABLE agencies
ADD COLUMN due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add check constraints
ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  -- Common timezones (expand as needed)
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Adelaide',
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'Europe/London',
  'Europe/Paris',
  'Asia/Tokyo',
  'Asia/Singapore',
  'Pacific/Auckland',
  'UTC'
));

ALTER TABLE agencies
ADD CONSTRAINT agencies_cutoff_time_check
CHECK (overdue_cutoff_time BETWEEN '00:00:00' AND '23:59:59');

ALTER TABLE agencies
ADD CONSTRAINT agencies_due_soon_days_check
CHECK (due_soon_threshold_days BETWEEN 1 AND 30);

-- Add column comments
COMMENT ON COLUMN agencies.timezone IS 'IANA timezone name for agency location (e.g., Australia/Brisbane)';
COMMENT ON COLUMN agencies.overdue_cutoff_time IS 'Time of day when pending installments become overdue (default 5:00 PM)';
COMMENT ON COLUMN agencies.due_soon_threshold_days IS 'Days before due date to flag as "due soon" (default 4 days)';

-- Backfill existing agencies (already handled by DEFAULT, but explicit for clarity)
UPDATE agencies
SET
  timezone = 'Australia/Brisbane',
  overdue_cutoff_time = '17:00:00',
  due_soon_threshold_days = 4
WHERE timezone IS NULL;
```

### Timezone Reference

**Common IANA Timezones:**

| Location | Timezone | UTC Offset |
|----------|----------|------------|
| Brisbane | Australia/Brisbane | UTC+10 |
| Sydney | Australia/Sydney | UTC+10/+11 |
| Perth | Australia/Perth | UTC+8 |
| Los Angeles | America/Los_Angeles | UTC-8/-7 |
| New York | America/New_York | UTC-5/-4 |
| London | Europe/London | UTC+0/+1 |
| Tokyo | Asia/Tokyo | UTC+9 |

**Verify Timezone Support:**

```sql
-- PostgreSQL supports IANA timezones via `pg_timezone_names` view
SELECT * FROM pg_timezone_names WHERE name LIKE '%Brisbane%';

-- Test timezone conversion
SELECT now() AT TIME ZONE 'Australia/Brisbane' AS brisbane_time;
```

### Usage in Status Update Function

The timezone fields are used by Task 1's `update_installment_statuses()` function:

```sql
-- Get current time in agency's timezone
current_time_in_zone := (now() AT TIME ZONE agency.timezone);

-- Check if past cutoff time
IF student_due_date < CURRENT_DATE OR
   (student_due_date = CURRENT_DATE AND current_time_in_zone::TIME > agency.overdue_cutoff_time)
THEN
  UPDATE installments SET status = 'overdue' WHERE ...;
END IF;
```

### Testing Approach

**Test 1: Verify Columns Added**

```sql
-- Check schema
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agencies'
  AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days');

-- Expected:
-- timezone             | text | 'Australia/Brisbane' | NO
-- overdue_cutoff_time  | time | '17:00:00'           | NO
-- due_soon_threshold_days | integer | 4             | NO
```

**Test 2: Verify Constraints**

```sql
-- Test valid timezone
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time, due_soon_threshold_days)
VALUES (gen_random_uuid(), 'Test Agency', 'Australia/Sydney', '18:00:00', 3);
-- Should succeed

-- Test invalid timezone
INSERT INTO agencies (id, name, timezone)
VALUES (gen_random_uuid(), 'Test Agency 2', 'Invalid/Timezone');
-- Should fail with check constraint violation

-- Test invalid cutoff time
INSERT INTO agencies (id, name, overdue_cutoff_time)
VALUES (gen_random_uuid(), 'Test Agency 3', '25:00:00');
-- Should fail with check constraint violation

-- Test invalid due soon days
INSERT INTO agencies (id, name, due_soon_threshold_days)
VALUES (gen_random_uuid(), 'Test Agency 4', 40);
-- Should fail with check constraint violation
```

**Test 3: Verify Backfill**

```sql
-- Check existing agencies have defaults
SELECT id, name, timezone, overdue_cutoff_time, due_soon_threshold_days
FROM agencies;

-- All rows should have non-null values
```

**Test 4: Test Timezone Conversion**

```sql
-- Create agencies with different timezones
INSERT INTO agencies (id, name, timezone, overdue_cutoff_time)
VALUES
  (gen_random_uuid(), 'Brisbane Agency', 'Australia/Brisbane', '17:00:00'),
  (gen_random_uuid(), 'LA Agency', 'America/Los_Angeles', '17:00:00');

-- Test timezone-aware time conversion
SELECT
  name,
  timezone,
  now() AS utc_now,
  now() AT TIME ZONE timezone AS local_now,
  (now() AT TIME ZONE timezone)::TIME AS local_time_only,
  overdue_cutoff_time,
  CASE
    WHEN (now() AT TIME ZONE timezone)::TIME > overdue_cutoff_time
    THEN 'Past cutoff'
    ELSE 'Before cutoff'
  END AS status
FROM agencies;
```

### Dependencies
- Existing agencies table
- PostgreSQL timezone support (pg_timezone_names)

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) Pattern 3: Automated Status State Machine
- Task 1 reference: Status update function uses these fields

---

## Implementation Notes

### Why IANA Timezones?

**Advantages:**
- Handles daylight saving time automatically
- Standard format across systems
- PostgreSQL has built-in support
- JavaScript/Deno also support IANA timezones

**Example:**
- `Australia/Sydney` automatically adjusts for AEDT/AEST
- `America/Los_Angeles` automatically adjusts for PDT/PST

### Why TIME Type for Cutoff?

**TIME vs TIMETZ:**
- TIME: Just the time (e.g., '17:00:00'), no timezone
- TIMETZ: Time with timezone (e.g., '17:00:00+10')

We use TIME because:
- Cutoff is relative to agency's local timezone
- Agency timezone is stored separately
- Simpler to compare: `current_time::TIME > cutoff_time`

### Extensibility for Future Stories

**due_soon_threshold_days:**
- Added now for future Story 5.2 (Due Soon Flags)
- Story 5.2 will use this field to determine when to flag installments as "due soon"
- Default 4 days matches Epic 5 requirements

### Optional: Agency Settings UI

If implementing UI for agency settings:

**Location:** `apps/payments/app/settings/agency/page.tsx`

**Form Fields:**
- Timezone: Dropdown with common IANA timezones
- Overdue Cutoff Time: Time picker (default 17:00)
- Due Soon Threshold: Number input (1-30 days)

**Validation:**
- Client-side: Zod schema matching database constraints
- Server-side: Database constraints enforce rules

**Example Zod Schema:**

```typescript
const agencySettingsSchema = z.object({
  timezone: z.enum([
    'Australia/Brisbane',
    'Australia/Sydney',
    'America/Los_Angeles',
    // ... add all supported timezones
  ]),
  overdue_cutoff_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/),
  due_soon_threshold_days: z.number().int().min(1).max(30),
});
```

---

## Next Steps

1. Add the three columns to agencies table
2. Add check constraints
3. Verify backfill with default values
4. Test timezone conversion with sample data
5. Test constraints with invalid data
6. (Optional) Create agency settings UI
7. When Task 6 is complete:
   - Update `MANIFEST.md`: Set Task 6 status to "Completed" with completion date
   - Add SQL migration to "Files Created"
   - Add any implementation notes
   - Move to `task-07-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
