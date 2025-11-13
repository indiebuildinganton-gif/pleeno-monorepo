-- Migration 010: Add agency timezone and cutoff time fields
-- Epic 5: Automated Installment Status Management
-- Story 5.1: Automated Status Detection Job
-- Task 6: Add Agency Timezone and Cutoff Time Fields

-- Add overdue cutoff time column (time of day when installments become overdue)
ALTER TABLE agencies
ADD COLUMN overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00';

-- Add due soon threshold column (for future Story 5.2)
ALTER TABLE agencies
ADD COLUMN due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add check constraint for timezone (valid IANA timezone names)
-- Note: timezone column already exists from migration 001, adding constraint here
ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  -- Australian timezones
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Darwin',
  'Australia/Hobart',
  'Australia/Canberra',
  -- Americas
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
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
  -- Asia
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Jakarta',
  'Asia/Manila',
  -- Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  -- Others
  'UTC'
));

-- Add check constraint for overdue cutoff time (must be valid time between 00:00 and 23:59)
ALTER TABLE agencies
ADD CONSTRAINT agencies_cutoff_time_check
CHECK (overdue_cutoff_time BETWEEN '00:00:00' AND '23:59:59');

-- Add check constraint for due soon days (must be between 1 and 30)
ALTER TABLE agencies
ADD CONSTRAINT agencies_due_soon_days_check
CHECK (due_soon_threshold_days BETWEEN 1 AND 30);

-- Update column comments for documentation
COMMENT ON COLUMN agencies.timezone IS 'IANA timezone name for agency location (e.g., Australia/Brisbane). Used for timezone-aware overdue detection.';
COMMENT ON COLUMN agencies.overdue_cutoff_time IS 'Time of day when pending installments become overdue in agency local time (default 5:00 PM). Used by automated status detection job.';
COMMENT ON COLUMN agencies.due_soon_threshold_days IS 'Number of days before due date to flag installments as "due soon" (default 4 days). Used for future Story 5.2.';

-- Backfill is handled by DEFAULT values, but verify existing agencies have proper values
-- (This is defensive - DEFAULT should have already set values for existing rows)
UPDATE agencies
SET
  overdue_cutoff_time = COALESCE(overdue_cutoff_time, '17:00:00'),
  due_soon_threshold_days = COALESCE(due_soon_threshold_days, 4)
WHERE overdue_cutoff_time IS NULL OR due_soon_threshold_days IS NULL;
