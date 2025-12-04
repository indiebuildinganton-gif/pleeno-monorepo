-- Migration: Add Agency Timezone and Cutoff Time Fields
-- Epic 5: Intelligent Status Automation
-- Story 5.1: Automated Status Detection Job - Task 6
--
-- Purpose: Add timezone and cutoff time fields to agencies table to enable
--          timezone-aware overdue detection. Each agency can have its own
--          timezone and cutoff time for when installments are marked overdue.
--
-- Changes:
--   1. Add overdue_cutoff_time column (TIME, default '17:00:00')
--   2. Add due_soon_threshold_days column (INT, default 4)
--   3. Add check constraints for timezone validation (IANA format)
--   4. Add check constraints for cutoff time validation (00:00-23:59)
--   5. Add check constraints for due soon days validation (1-30)
--   6. Update column comments for documentation
--
-- Note: The timezone column already exists in agencies table (from migration 001)
--       with default 'Australia/Brisbane'. We're adding a check constraint to it.

-- ============================================================================
-- Add New Columns
-- ============================================================================

-- Add overdue cutoff time column
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00';

-- Add due soon threshold column (for future Story 5.2)
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- ============================================================================
-- Add Check Constraints
-- ============================================================================

-- Add timezone check constraint (IANA timezone names)
-- Note: This is a comprehensive list of common timezones. Can be expanded as needed.
ALTER TABLE agencies
DROP CONSTRAINT IF EXISTS agencies_timezone_check;

ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  -- Australia & Pacific
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Hobart',
  'Australia/Darwin',
  'Australia/Canberra',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',

  -- Americas
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Phoenix',
  'America/Anchorage',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',

  -- Europe
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Dublin',
  'Europe/Lisbon',
  'Europe/Warsaw',

  -- Asia
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Jakarta',
  'Asia/Manila',
  'Asia/Kuala_Lumpur',

  -- Middle East & Africa
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Nairobi',
  'Africa/Lagos',

  -- UTC
  'UTC'
));

-- Add cutoff time check constraint
ALTER TABLE agencies
DROP CONSTRAINT IF EXISTS agencies_cutoff_time_check;

ALTER TABLE agencies
ADD CONSTRAINT agencies_cutoff_time_check
CHECK (overdue_cutoff_time BETWEEN '00:00:00' AND '23:59:59');

-- Add due soon days check constraint
ALTER TABLE agencies
DROP CONSTRAINT IF EXISTS agencies_due_soon_days_check;

ALTER TABLE agencies
ADD CONSTRAINT agencies_due_soon_days_check
CHECK (due_soon_threshold_days BETWEEN 1 AND 30);

-- ============================================================================
-- Add Column Comments
-- ============================================================================

-- Update timezone column comment (already exists, updating for clarity)
COMMENT ON COLUMN agencies.timezone IS 'IANA timezone name for agency location (e.g., Australia/Brisbane). Used for timezone-aware status detection.';

-- Add overdue cutoff time column comment
COMMENT ON COLUMN agencies.overdue_cutoff_time IS 'Time of day when pending installments become overdue (default 5:00 PM local time). Format: HH:MM:SS';

-- Add due soon threshold column comment
COMMENT ON COLUMN agencies.due_soon_threshold_days IS 'Days before due date to flag as "due soon" (default 4 days). Used for proactive payment notifications in Story 5.2.';

-- ============================================================================
-- Backfill Existing Agencies
-- ============================================================================

-- Backfill existing agencies with default values
-- (Most agencies will already have timezone from initial schema)
-- This ensures all agencies have the new columns populated
UPDATE agencies
SET
  overdue_cutoff_time = COALESCE(overdue_cutoff_time, '17:00:00'),
  due_soon_threshold_days = COALESCE(due_soon_threshold_days, 4)
WHERE overdue_cutoff_time IS NULL OR due_soon_threshold_days IS NULL;

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify columns exist with correct types and defaults
-- Run: SELECT * FROM information_schema.columns WHERE table_name = 'agencies' AND column_name IN ('timezone', 'overdue_cutoff_time', 'due_soon_threshold_days');
-- Expected:
-- timezone             | text    | 'Australia/Brisbane' | NO
-- overdue_cutoff_time  | time    | '17:00:00'           | NO
-- due_soon_threshold_days | integer | 4                 | NO

-- Verify constraints exist
-- Run: SELECT conname, pg_get_constraintdef(oid) FROM pg_constraint WHERE conrelid = 'agencies'::regclass AND conname LIKE '%timezone%' OR conname LIKE '%cutoff%' OR conname LIKE '%due_soon%';

-- Verify all agencies have non-null values
-- Run: SELECT COUNT(*) FROM agencies WHERE timezone IS NULL OR overdue_cutoff_time IS NULL OR due_soon_threshold_days IS NULL;
-- Expected: 0

-- ============================================================================
-- Usage Example
-- ============================================================================

-- Example: Update agency timezone and cutoff settings
-- UPDATE agencies
-- SET
--   timezone = 'America/Los_Angeles',
--   overdue_cutoff_time = '18:00:00',
--   due_soon_threshold_days = 7
-- WHERE id = 'agency-uuid-here';

-- Example: Test timezone conversion
-- SELECT
--   name,
--   timezone,
--   now() AT TIME ZONE 'UTC' AS utc_now,
--   now() AT TIME ZONE timezone AS agency_local_time,
--   (now() AT TIME ZONE timezone)::TIME AS agency_time_only,
--   overdue_cutoff_time,
--   CASE
--     WHEN (now() AT TIME ZONE timezone)::TIME > overdue_cutoff_time
--     THEN 'Past cutoff - mark overdue'
--     ELSE 'Before cutoff - still pending'
--   END AS status_logic
-- FROM agencies
-- LIMIT 5;

-- ============================================================================
-- Production Deployment Notes
-- ============================================================================

-- 1. This migration is safe to run on production (uses IF NOT EXISTS)
-- 2. Migration is idempotent - can be run multiple times safely
-- 3. Existing data is preserved and backfilled with defaults
-- 4. Check constraints only allow valid IANA timezone names
-- 5. Cutoff time must be valid 24-hour time (00:00:00 to 23:59:59)
-- 6. Due soon days must be between 1 and 30 days
-- 7. The timezone column already exists; this migration adds validation
-- 8. Edge Function (Task 3) and status update function (Task 1) use these fields

-- ============================================================================
-- Rollback Instructions (if needed)
-- ============================================================================

-- To rollback this migration:
--
-- ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
-- ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_cutoff_time_check;
-- ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_due_soon_days_check;
-- ALTER TABLE agencies DROP COLUMN IF EXISTS overdue_cutoff_time;
-- ALTER TABLE agencies DROP COLUMN IF EXISTS due_soon_threshold_days;
--
-- Note: Only rollback if absolutely necessary. Existing data will be lost.
