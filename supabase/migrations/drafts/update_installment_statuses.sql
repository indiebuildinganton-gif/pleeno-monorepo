-- =====================================================================
-- Function: update_installment_statuses()
-- Purpose: Automated status detection for installments
-- Description: Updates installment statuses from 'pending' to 'overdue'
--              based on due dates and agency timezone settings.
--              Only processes installments linked to active payment plans.
-- =====================================================================

CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_record RECORD;
  current_time_in_zone TIMESTAMPTZ;
  pending_to_overdue INT;
BEGIN
  -- Loop through each agency (handle different timezones)
  FOR agency_record IN
    SELECT
      id,
      timezone,
      overdue_cutoff_time
    FROM agencies
  LOOP
    -- Get current time in agency's timezone
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments: pending → overdue
    -- Conditions:
    --   1. Installment is linked to an active payment plan
    --   2. Current status is 'pending'
    --   3. Either:
    --      a. student_due_date is before today, OR
    --      b. student_due_date is today AND current time > cutoff time
    WITH updated AS (
      UPDATE installments i
      SET
        status = 'overdue',
        updated_at = now()
      FROM payment_plans pp
      WHERE
        -- Join condition
        i.payment_plan_id = pp.id
        -- Agency filter
        AND pp.agency_id = agency_record.id
        -- Active plans only
        AND pp.status = 'active'
        -- Current status is pending
        AND i.status = 'pending'
        -- Due date conditions
        AND (
          -- Past due date
          i.student_due_date < CURRENT_DATE
          OR
          -- Due date is today AND past cutoff time
          (
            i.student_due_date = CURRENT_DATE
            AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
          )
        )
      RETURNING i.id
    )
    SELECT COUNT(*) INTO pending_to_overdue FROM updated;

    -- Return results for this agency
    RETURN QUERY SELECT
      agency_record.id,
      pending_to_overdue,
      jsonb_build_object('pending_to_overdue', pending_to_overdue);
  END LOOP;
END;
$$;

-- =====================================================================
-- Security Notes:
-- - SECURITY DEFINER allows function to update records across all agencies
-- - RLS policies still apply to queries within the function
-- - Function should be owned by service role or equivalent privileged user
-- =====================================================================

-- =====================================================================
-- Performance Considerations:
-- - Function loops through agencies (not installments) for efficiency
-- - Single UPDATE query per agency with JOIN to payment_plans
-- - Recommended indexes:
--   CREATE INDEX IF NOT EXISTS idx_installments_status_due_date
--     ON installments(payment_plan_id, status, student_due_date)
--     WHERE status = 'pending';
--   CREATE INDEX IF NOT EXISTS idx_payment_plans_agency_status
--     ON payment_plans(agency_id, status)
--     WHERE status = 'active';
-- =====================================================================

-- Grant execute permission to authenticated users
-- (Actual permissions may be restricted further based on your security model)
GRANT EXECUTE ON FUNCTION update_installment_statuses() TO authenticated;
GRANT EXECUTE ON FUNCTION update_installment_statuses() TO service_role;

-- =====================================================================
-- Usage Example:
-- SELECT * FROM update_installment_statuses();
--
-- Expected output:
-- agency_id                              | updated_count | transitions
-- ---------------------------------------|---------------|---------------------------
-- a1234567-89ab-cdef-0123-456789abcdef |             5 | {"pending_to_overdue": 5}
-- b2345678-9abc-def0-1234-56789abcdef0 |             2 | {"pending_to_overdue": 2}
-- =====================================================================
