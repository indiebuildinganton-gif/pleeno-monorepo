-- Migration: 007_student_payment_history
-- Generated: Thu Dec  4 15:27:31 AEST 2025

-- Source: 001_get_student_payment_history_function.sql

-- Migration: Create get_student_payment_history function
-- Epic 7: Reporting & Analytics
-- Story 7.5: Student Payment History Report
-- Task 2: Fetch Payment History Data

-- ============================================================
-- FUNCTION: get_student_payment_history
-- ============================================================
-- Retrieves complete payment history for a student with installments
-- grouped by payment plan, filtered by agency and optional date range.
--
-- Parameters:
--   p_student_id: UUID - Student identifier
--   p_agency_id: UUID - Agency identifier (for RLS enforcement)
--   p_date_from: DATE - Optional start date filter
--   p_date_to: DATE - Optional end date filter
--
-- Returns: Table with flattened payment plan and installment data
--
-- Security: SECURITY DEFINER with explicit agency_id filtering

CREATE OR REPLACE FUNCTION get_student_payment_history(
  p_student_id UUID,
  p_agency_id UUID,
  p_date_from DATE DEFAULT NULL,
  p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
  -- Payment Plan fields
  payment_plan_id UUID,
  plan_total_amount DECIMAL(12,2),
  plan_start_date DATE,
  plan_status TEXT,

  -- Enrollment/Program fields
  college_name TEXT,
  branch_name TEXT,
  program_name TEXT,

  -- Installment fields
  installment_id UUID,
  installment_number INTEGER,
  amount DECIMAL(12,2),
  due_date DATE,
  paid_at DATE,
  paid_amount DECIMAL(12,2),
  status TEXT
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Payment Plan
    pp.id AS payment_plan_id,
    pp.total_amount AS plan_total_amount,
    pp.start_date AS plan_start_date,
    pp.status::TEXT AS plan_status,

    -- Enrollment/Program
    c.name AS college_name,
    b.name AS branch_name,
    e.program_name AS program_name,

    -- Installment
    i.id AS installment_id,
    i.installment_number,
    i.amount,
    i.student_due_date AS due_date,
    i.paid_date AS paid_at,
    i.paid_amount,
    i.status::TEXT AS status

  FROM payment_plans pp

  -- Join to enrollments to get student and program info
  INNER JOIN enrollments e ON e.id = pp.enrollment_id

  -- Join to branches (via enrollments)
  INNER JOIN branches b ON b.id = e.branch_id

  -- Join to colleges (via branches)
  INNER JOIN colleges c ON c.id = b.college_id

  -- Join to installments
  LEFT JOIN installments i ON i.payment_plan_id = pp.id

  WHERE
    -- SECURITY: Filter by agency
    pp.agency_id = p_agency_id
    AND e.agency_id = p_agency_id

    -- Filter by student
    AND e.student_id = p_student_id

    -- Optional date range filter (on installment due date)
    AND (
      p_date_from IS NULL
      OR i.student_due_date IS NULL
      OR i.student_due_date >= p_date_from
    )
    AND (
      p_date_to IS NULL
      OR i.student_due_date IS NULL
      OR i.student_due_date <= p_date_to
    )

  ORDER BY
    pp.start_date DESC,
    pp.id,
    i.installment_number ASC;
END;
$$;

COMMENT ON FUNCTION get_student_payment_history(UUID, UUID, DATE, DATE) IS
  'Retrieves complete payment history for a student with installments grouped by payment plan. Filters by agency for RLS and supports optional date range filtering.';


