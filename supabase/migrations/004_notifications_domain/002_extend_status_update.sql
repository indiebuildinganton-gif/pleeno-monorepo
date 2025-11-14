-- Migration 002: Extend Status Update Function for Email Notifications
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.5: Automated Email Notifications (Multi-Stakeholder)
-- Task 5: Notification Job - Extend Status Update Function

-- ============================================================
-- OVERVIEW
-- ============================================================
-- This migration extends the update_installment_statuses() function to:
-- 1. Return IDs of newly overdue installments for notification processing
-- 2. Only update installments that haven't been notified today (prevent duplicates)
-- 3. Maintain backward compatibility with existing job monitoring

BEGIN;

-- ============================================================
-- Update the update_installment_statuses function
-- ============================================================
-- Key changes from previous version:
-- 1. Added last_notified_date filter to prevent duplicate processing
-- 2. Returns newly_overdue_ids array for notification processing
-- 3. Maintains activity logging for BI dashboard

CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB,
  newly_overdue_ids UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_record RECORD;
  current_time_in_zone TIMESTAMPTZ;
  updated_count INT;
  installment_record RECORD;
  overdue_ids UUID[];
BEGIN
  -- Loop through each agency
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    -- Get current time in agency's timezone
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments past due date or past cutoff time today
    -- IMPORTANT: Only update if last_notified_date IS NULL or is from a previous day
    -- This prevents duplicate notification processing on subsequent runs
    -- and collect the updated records for activity logging
    FOR installment_record IN
      WITH updated AS (
        UPDATE installments i
        SET status = 'overdue'
        FROM payment_plans pp
        WHERE i.payment_plan_id = pp.id
          AND pp.agency_id = agency_record.id
          AND pp.status = 'active'
          AND i.status = 'pending'
          -- KEY CHANGE: Only update if not notified today
          AND (i.last_notified_date IS NULL OR i.last_notified_date::date < CURRENT_DATE)
          AND (
            i.student_due_date < CURRENT_DATE
            OR (
              i.student_due_date = CURRENT_DATE
              AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
            )
          )
        RETURNING i.id, i.payment_plan_id, i.amount, i.student_due_date
      )
      SELECT
        u.id,
        u.payment_plan_id,
        u.amount,
        u.student_due_date,
        s.full_name as student_name,
        pp.agency_id
      FROM updated u
      JOIN payment_plans pp ON pp.id = u.payment_plan_id
      JOIN enrollments e ON e.id = pp.enrollment_id
      JOIN students s ON s.id = e.student_id
    LOOP
      -- Log activity for each overdue installment (Story 6.4)
      -- user_id is NULL for system actions
      INSERT INTO activity_log (
        agency_id,
        user_id,
        entity_type,
        entity_id,
        action,
        description,
        metadata
      ) VALUES (
        installment_record.agency_id,
        NULL, -- System action, no user
        'installment',
        installment_record.id,
        'marked_overdue',
        'System marked installment ' || installment_record.amount::TEXT || ' as overdue for ' || installment_record.student_name,
        jsonb_build_object(
          'student_name', installment_record.student_name,
          'amount', installment_record.amount,
          'installment_id', installment_record.id,
          'payment_plan_id', installment_record.payment_plan_id,
          'original_due_date', installment_record.student_due_date
        )
      );
    END LOOP;

    -- Count how many installments were updated for this agency
    -- and collect their IDs for notification processing
    SELECT
      count(*),
      array_agg(i.id)
    INTO updated_count, overdue_ids
    FROM installments i
    JOIN payment_plans pp ON pp.id = i.payment_plan_id
    WHERE pp.agency_id = agency_record.id
      AND i.status = 'overdue'
      AND i.updated_at > (now() - INTERVAL '1 minute'); -- Updated in the last minute

    -- Return results for this agency
    RETURN QUERY SELECT
      agency_record.id,
      COALESCE(updated_count, 0),
      jsonb_build_object('pending_to_overdue', COALESCE(updated_count, 0)),
      COALESCE(overdue_ids, ARRAY[]::UUID[]);
  END LOOP;
END;
$$;

COMMENT ON FUNCTION update_installment_statuses IS
  'Updates installment statuses to overdue based on due dates and agency timezones.
  Only processes installments that have not been notified today (prevents duplicates).
  Returns newly overdue installment IDs for email notification processing.
  Logs activities to activity_log table for BI dashboard.';

COMMIT;
