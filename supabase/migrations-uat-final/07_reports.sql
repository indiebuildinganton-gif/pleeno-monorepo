-- ======================================
-- Migration 7: Reports and Activity Log
-- ======================================

BEGIN;

-- Reports domain tables and functions

-- Source: 001_activity_log_schema.sql

-- Migration 001: Create activity_log table with RLS
-- Epic: 6 - Business Intelligence Dashboard
-- Story: 6.4 - Recent Activity Feed
-- Task: 1 - Create Activity Log Database Schema

BEGIN;

-- ============================================================
-- STEP 1: Create Table
-- ============================================================

CREATE TABLE activity_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- User who performed the action (null for system actions)
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Entity information
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,

  -- Action details
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,

  -- Additional context (student name, amount, etc.)
  metadata JSONB,

  -- Timestamp (immutable - no updated_at)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT valid_entity_type CHECK (
    entity_type IN ('payment', 'payment_plan', 'student', 'enrollment', 'installment')
  ),
  CONSTRAINT valid_action CHECK (
    action IN ('created', 'recorded', 'updated', 'marked_overdue', 'deleted')
  )
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id and created_at DESC for feed queries
CREATE INDEX idx_activity_log_agency_created ON activity_log(agency_id, created_at DESC);

-- Index on entity for quick lookups of activity by entity
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);

-- Index on user_id for user-specific activity queries
CREATE INDEX idx_activity_log_user ON activity_log(user_id) WHERE user_id IS NOT NULL;

-- ============================================================
-- STEP 3: Enable RLS
-- ============================================================

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY activity_log_agency_isolation_select ON activity_log
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY activity_log_agency_isolation_insert ON activity_log
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Deny all updates (activity log is immutable)
CREATE POLICY activity_log_deny_update ON activity_log
  FOR UPDATE
  USING (false);

-- DELETE Policy: Agency Isolation (for data cleanup/retention)
CREATE POLICY activity_log_agency_isolation_delete ON activity_log
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 5: Add Documentation
-- ============================================================

COMMENT ON TABLE activity_log IS
  'Activity log tracking all significant user and system actions across the application with multi-tenant isolation. Immutable audit trail for agency activity feed.';

COMMENT ON COLUMN activity_log.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN activity_log.user_id IS
  'Foreign key to users table - null for system-generated activities';

COMMENT ON COLUMN activity_log.entity_type IS
  'Type of entity affected: payment, payment_plan, student, enrollment, installment';

COMMENT ON COLUMN activity_log.entity_id IS
  'UUID of the affected entity';

COMMENT ON COLUMN activity_log.action IS
  'Action performed: created, recorded, updated, marked_overdue, deleted';

COMMENT ON COLUMN activity_log.description IS
  'Human-readable activity description for display in feed';

COMMENT ON COLUMN activity_log.metadata IS
  'Additional context stored as JSON (student name, amount, etc.)';

COMMENT ON POLICY activity_log_agency_isolation_select ON activity_log IS
  'Agency isolation: Users can only SELECT activity logs belonging to their agency';

COMMENT ON POLICY activity_log_agency_isolation_insert ON activity_log IS
  'Agency isolation: Users can only INSERT activity logs for their agency';

COMMENT ON POLICY activity_log_deny_update ON activity_log IS
  'Immutability: Activity logs cannot be updated once created';

COMMENT ON POLICY activity_log_agency_isolation_delete ON activity_log IS
  'Agency isolation: Users can only DELETE activity logs belonging to their agency';

COMMIT;


-- Source: 002_update_installment_status_with_activity_logging.sql

-- Migration 002: Update installment status function with activity logging
-- Epic: 6 - Business Intelligence Dashboard
-- Story: 6.4 - Recent Activity Feed
-- Task: 2 - Implement Activity Logging in Existing API Routes

BEGIN;

-- ============================================================
-- Update the update_installment_statuses function to log activities
-- ============================================================

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
  updated_count INT;
  installment_record RECORD;
BEGIN
  -- Loop through each agency
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    -- Get current time in agency's timezone
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    -- Update installments past due date or past cutoff time today
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
    SELECT count(*) INTO updated_count
    FROM installments i
    JOIN payment_plans pp ON pp.id = i.payment_plan_id
    WHERE pp.agency_id = agency_record.id
      AND i.status = 'overdue'
      AND i.updated_at > (now() - INTERVAL '1 minute'); -- Updated in the last minute

    -- Return results for this agency
    RETURN QUERY SELECT
      agency_record.id,
      COALESCE(updated_count, 0),
      jsonb_build_object('pending_to_overdue', COALESCE(updated_count, 0));
  END LOOP;
END;
$$;

COMMENT ON FUNCTION update_installment_statuses IS 'Updates installment statuses to overdue based on due dates and agency timezones, and logs activities to activity_log table';

COMMIT;


-- Source: 003_activity_log_report_support.sql

-- Migration 003: Add 'report' entity type and 'exported' action to activity_log
-- Epic: 7 - Enhanced Reporting Module
-- Story: 7.3 - PDF Export Functionality
-- Task: 8 - Add Export Tracking

BEGIN;

-- ============================================================
-- STEP 1: Drop existing constraints
-- ============================================================

ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS valid_entity_type;
ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS valid_action;

-- ============================================================
-- STEP 2: Add updated constraints with 'report' and 'exported'
-- ============================================================

-- Add 'report' to valid entity types
ALTER TABLE activity_log ADD CONSTRAINT valid_entity_type CHECK (
  entity_type IN ('payment', 'payment_plan', 'student', 'enrollment', 'installment', 'report')
);

-- Add 'exported' to valid actions
ALTER TABLE activity_log ADD CONSTRAINT valid_action CHECK (
  action IN ('created', 'recorded', 'updated', 'marked_overdue', 'deleted', 'exported')
);

-- ============================================================
-- STEP 3: Add documentation
-- ============================================================

COMMENT ON CONSTRAINT valid_entity_type ON activity_log IS
  'Valid entity types: payment, payment_plan, student, enrollment, installment, report';

COMMENT ON CONSTRAINT valid_action ON activity_log IS
  'Valid actions: created, recorded, updated, marked_overdue, deleted, exported';

COMMIT;


-- Source: 004_commission_report_function.sql

-- Migration 004: Create commission report function
-- Epic 7: Agency Reports and Analytics
-- Story 7.4: Commission Report by College
-- Task 2: Implement Commission Report API Route
--
-- This function generates commission reports grouped by college and branch
-- with support for date range and city filtering. Returns aggregated commission
-- data including drill-down details of student payment plans.

BEGIN;

-- ============================================================
-- STEP 1: Create Commission Report Function
-- ============================================================

CREATE OR REPLACE FUNCTION get_commission_report(
  p_agency_id UUID,
  p_date_from DATE,
  p_date_to DATE,
  p_city TEXT DEFAULT NULL
)
RETURNS TABLE (
  college_id UUID,
  college_name TEXT,
  branch_id UUID,
  branch_name TEXT,
  branch_city TEXT,
  commission_rate_percent DECIMAL(5,2),
  total_payment_plans BIGINT,
  total_students BIGINT,
  total_paid DECIMAL(12,2),
  earned_commission DECIMAL(12,2),
  outstanding_commission DECIMAL(12,2),
  payment_plans JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS college_id,
    c.name AS college_name,
    b.id AS branch_id,
    b.name AS branch_name,
    b.city AS branch_city,
    b.commission_rate_percent,
    COUNT(DISTINCT pp.id) AS total_payment_plans,
    COUNT(DISTINCT e.student_id) AS total_students,

    -- Total paid: sum of all installments that have been paid (paid_date IS NOT NULL)
    COALESCE(
      SUM(i.paid_amount) FILTER (WHERE i.paid_date IS NOT NULL),
      0
    )::DECIMAL(12,2) AS total_paid,

    -- Earned commission: commission on paid installments that generate commission
    COALESCE(
      SUM(i.paid_amount * (b.commission_rate_percent / 100))
        FILTER (WHERE i.paid_date IS NOT NULL AND i.generates_commission = true),
      0
    )::DECIMAL(12,2) AS earned_commission,

    -- Outstanding commission: commission on unpaid overdue installments that generate commission
    COALESCE(
      SUM(i.amount * (b.commission_rate_percent / 100))
        FILTER (
          WHERE i.paid_date IS NULL
          AND i.student_due_date < CURRENT_DATE
          AND i.generates_commission = true
          AND i.status NOT IN ('cancelled', 'draft')
        ),
      0
    )::DECIMAL(12,2) AS outstanding_commission,

    -- Drill-down data: aggregate student payment plans for this branch
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'student_id', s.id,
            'student_name', s.name,
            'payment_plan_id', pp_inner.id,
            'total_amount', pp_inner.total_amount,
            'paid_amount', COALESCE(
              (
                SELECT SUM(i_inner.paid_amount)
                FROM installments i_inner
                WHERE i_inner.payment_plan_id = pp_inner.id
                  AND i_inner.paid_date IS NOT NULL
              ),
              0
            ),
            'commission_earned', COALESCE(
              (
                SELECT SUM(i_inner.paid_amount * (b.commission_rate_percent / 100))
                FROM installments i_inner
                WHERE i_inner.payment_plan_id = pp_inner.id
                  AND i_inner.paid_date IS NOT NULL
                  AND i_inner.generates_commission = true
              ),
              0
            )
          )
        )
        FROM payment_plans pp_inner
        INNER JOIN enrollments e_inner ON pp_inner.enrollment_id = e_inner.id
        INNER JOIN students s ON e_inner.student_id = s.id
        WHERE e_inner.branch_id = b.id
          AND pp_inner.agency_id = p_agency_id
      ),
      '[]'::jsonb
    ) AS payment_plans

  FROM colleges c
  INNER JOIN branches b ON c.id = b.college_id
  INNER JOIN enrollments e ON b.id = e.branch_id
  INNER JOIN payment_plans pp ON e.id = pp.enrollment_id
  INNER JOIN installments i ON pp.id = i.payment_plan_id
  WHERE
    -- Agency isolation (RLS enforcement)
    pp.agency_id = p_agency_id
    AND c.agency_id = p_agency_id
    AND b.agency_id = p_agency_id
    AND e.agency_id = p_agency_id
    AND i.agency_id = p_agency_id

    -- Date range filter (using student_due_date from installments)
    AND i.student_due_date >= p_date_from
    AND i.student_due_date <= p_date_to

    -- Optional city filter
    AND (p_city IS NULL OR b.city = p_city)

  GROUP BY c.id, c.name, b.id, b.name, b.city, b.commission_rate_percent
  ORDER BY c.name, b.name;
END;
$$;

-- ============================================================
-- STEP 2: Add Documentation
-- ============================================================

COMMENT ON FUNCTION get_commission_report(UUID, DATE, DATE, TEXT) IS
  'Generates commission report grouped by college and branch with date range and optional city filtering.
  Returns aggregated commission data including total paid, earned commission, outstanding commission,
  and drill-down details of student payment plans. Enforces RLS by requiring agency_id parameter.

  Parameters:
  - p_agency_id: UUID of the agency (for RLS enforcement)
  - p_date_from: Start date for installment due date range (inclusive)
  - p_date_to: End date for installment due date range (inclusive)
  - p_city: Optional city filter for branches

  Returns one row per branch with:
  - College and branch information
  - Aggregated counts (payment plans, students)
  - Financial totals (total paid, earned commission, outstanding commission)
  - JSONB array of student payment plans for drill-down

  Commission calculations:
  - earned_commission: Sum of (paid_amount * rate) for paid installments that generate commission
  - outstanding_commission: Sum of (amount * rate) for overdue unpaid installments that generate commission

  Security: SECURITY DEFINER function with explicit agency_id filtering on all tables';

COMMIT;


COMMIT;
