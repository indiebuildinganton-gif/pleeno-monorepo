-- Migration 003: Add metadata column to audit_logs table
-- Epic 4: Payments Domain
-- Story 4.1: Payment Plan Creation
-- Task 09: Audit Logging
--
-- This migration adds a metadata column to the audit_logs table to support
-- additional context such as commission calculation parameters and enrollment details.
--
-- The metadata column stores supplementary information that helps with:
-- - Transparency: Commission calculation formulas and parameters
-- - Context: Enrollment details (student, college, program)
-- - Compliance: Additional audit trail information
-- - Troubleshooting: Extra context for debugging issues

BEGIN;

-- ============================================================================
-- Add metadata column to audit_logs table
-- ============================================================================

-- Add metadata column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'audit_logs'
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE audit_logs ADD COLUMN metadata JSONB;
  END IF;
END $$;

-- Add comment explaining the purpose of the metadata column
COMMENT ON COLUMN audit_logs.metadata IS 'Additional context for the audit entry (e.g., commission calculations, enrollment details, system information)';

-- ============================================================================
-- Create index for metadata queries (optional but recommended)
-- ============================================================================

-- Create GIN index on metadata column for efficient JSONB queries
-- This allows fast lookups like: WHERE metadata @> '{"commission_calculation": {}}'
CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
  ON audit_logs USING GIN (metadata);

COMMENT ON INDEX idx_audit_logs_metadata IS 'GIN index for efficient JSONB queries on audit log metadata';

-- ============================================================================
-- Example metadata structures for documentation
-- ============================================================================

COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all entity changes across the system

Example metadata structures:

1. Payment Plan Creation:
{
  "commission_calculation": {
    "formula": "total_amount * (commission_rate_percent / 100)",
    "total_amount": 10000,
    "commission_rate_percent": 15,
    "expected_commission": 1500
  },
  "enrollment": {
    "enrollment_id": "uuid",
    "student_name": "John Doe",
    "college_name": "University of Sydney",
    "branch_city": "Sydney",
    "program_name": "Master of Business Administration"
  }
}

2. Other entities can add their own metadata structures as needed
';

COMMIT;
