-- Migration 009: Add columns for manual payment recording
-- Epic 4: Payment Management & Tracking
-- Story 4.4: Manual Payment Recording
-- Task 1: Database Schema Extensions

-- ============================================================
-- PREREQUISITES
-- ============================================================
-- This migration requires:
-- - installments table (from 003_payments_domain/004_installments_schema.sql)
-- - payment_plans table (from 003_payments_domain/001_payment_plans_schema.sql)
--
-- This migration adds:
-- - payment_notes column to installments table (for recording payment notes)
-- - earned_commission column to payment_plans table (for tracking actual earned commission)
-- - partial payment status support

BEGIN;

-- ============================================================
-- STEP 1: Add payment_notes Column to Installments Table
-- ============================================================
-- Stores optional notes when recording a payment
-- Max 500 characters as per AC3

ALTER TABLE installments
  ADD COLUMN payment_notes TEXT;

-- Add constraint for max 500 characters
ALTER TABLE installments
  ADD CONSTRAINT chk_payment_notes_max_length
  CHECK (payment_notes IS NULL OR length(payment_notes) <= 500);

COMMENT ON COLUMN installments.payment_notes IS
  'Optional notes recorded when payment is received. Max 500 characters. Visible in payment history.';

-- ============================================================
-- STEP 2: Add earned_commission Column to Payment Plans Table
-- ============================================================
-- Tracks actual commission earned based on paid installments
-- Formula: (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission

ALTER TABLE payment_plans
  ADD COLUMN earned_commission DECIMAL(12,2) DEFAULT 0 NOT NULL;

-- Add constraint to ensure earned_commission is non-negative
ALTER TABLE payment_plans
  ADD CONSTRAINT chk_earned_commission_non_negative
  CHECK (earned_commission >= 0);

COMMENT ON COLUMN payment_plans.earned_commission IS
  'Actual commission earned based on paid installments. Formula: (SUM(paid_amount WHERE status=paid) / total_amount) * expected_commission. Updated after each payment recording. Defaults to 0.';

-- ============================================================
-- STEP 3: Update Installment Status Enum for Partial Payments
-- ============================================================
-- Add 'partial' status to support partial payment tracking (AC2)
-- A partial payment is when paid_amount < installment.amount

ALTER TYPE installment_status ADD VALUE IF NOT EXISTS 'partial' AFTER 'paid';

COMMENT ON TYPE installment_status IS
  'Status values for installments: draft (not yet active), pending (awaiting payment), partial (partial payment received), paid (full payment received), overdue (past due date), cancelled (installment cancelled)';

-- ============================================================
-- STEP 4: Backfill earned_commission for Existing Payment Plans
-- ============================================================
-- Calculate earned_commission for any existing payment plans based on paid installments

UPDATE payment_plans pp
SET earned_commission = (
  SELECT COALESCE(
    CASE
      WHEN pp.total_amount > 0 THEN
        (SUM(i.paid_amount) / pp.total_amount) * pp.expected_commission
      ELSE 0
    END,
    0
  )
  FROM installments i
  WHERE i.payment_plan_id = pp.id
    AND i.status = 'paid'
    AND i.paid_amount IS NOT NULL
);

-- Handle payment plans with no installments
UPDATE payment_plans
SET earned_commission = 0
WHERE earned_commission IS NULL;

COMMIT;
