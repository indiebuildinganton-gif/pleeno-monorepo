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
