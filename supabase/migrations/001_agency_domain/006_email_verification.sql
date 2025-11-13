-- Migration 006: Email Verification Schema for Admin Email Changes
-- Epic 2: Agency Onboarding and User Provisioning
-- Story 2.4: User Profile Management

-- ============================================================================
-- SECTION 1: Create audit_logs table (if not exists)
-- ============================================================================
-- Note: This table is defined in architecture.md for Epic 8, but needed early
-- for email change audit trail. Creating here to support Story 2.4.

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),  -- NULL for automated actions
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes for performance (only create if table was just created)
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON audit_logs(agency_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
  ON audit_logs(agency_id, created_at DESC);

-- RLS policies for audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert audit logs
CREATE POLICY IF NOT EXISTS "Audit logs are insert-only"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can view audit logs
CREATE POLICY IF NOT EXISTS "Admins can view audit logs"
  ON audit_logs FOR SELECT
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

-- Add comments
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all entity changes across the system';
COMMENT ON COLUMN audit_logs.user_id IS 'User who made the change (NULL for system/automated actions)';
COMMENT ON COLUMN audit_logs.entity_type IS 'Type of entity changed (e.g., user, payment_plan, student)';
COMMENT ON COLUMN audit_logs.action IS 'Action performed (e.g., email_change_requested, email_changed, status_updated)';

-- ============================================================================
-- SECTION 2: Add email verification fields to users table
-- ============================================================================

-- Add email verification columns
ALTER TABLE users
  ADD COLUMN email_verified_at TIMESTAMPTZ,
  ADD COLUMN pending_email TEXT,
  ADD COLUMN email_verification_token TEXT UNIQUE;

-- Add consistency constraint: pending_email and token must both be set or both be NULL
ALTER TABLE users
  ADD CONSTRAINT check_email_change_consistency
  CHECK (
    (pending_email IS NULL AND email_verification_token IS NULL) OR
    (pending_email IS NOT NULL AND email_verification_token IS NOT NULL)
  );

-- Index for token lookup performance
CREATE INDEX idx_users_email_verification_token
  ON users(email_verification_token)
  WHERE email_verification_token IS NOT NULL;

-- Add comments
COMMENT ON COLUMN users.email_verified_at IS 'Timestamp when current email was verified';
COMMENT ON COLUMN users.pending_email IS 'New email address pending verification (NULL when no change in progress)';
COMMENT ON COLUMN users.email_verification_token IS 'Single-use token for email verification (expires after 1 hour)';

-- ============================================================================
-- SECTION 3: Create audit logging trigger for email changes
-- ============================================================================

-- Function to log email changes
CREATE OR REPLACE FUNCTION log_email_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log email change requests (pending_email set)
  IF OLD.pending_email IS NULL AND NEW.pending_email IS NOT NULL THEN
    INSERT INTO audit_logs (
      agency_id,
      entity_type,
      entity_id,
      user_id,
      action,
      old_values,
      new_values,
      created_at
    )
    VALUES (
      NEW.agency_id,
      'user',
      NEW.id,
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      'email_change_requested',
      jsonb_build_object('email', NEW.email),
      jsonb_build_object('requested_email', NEW.pending_email),
      now()
    );
  END IF;

  -- Log completed email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO audit_logs (
      agency_id,
      entity_type,
      entity_id,
      user_id,
      action,
      old_values,
      new_values,
      created_at
    )
    VALUES (
      NEW.agency_id,
      'user',
      NEW.id,
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      'email_changed',
      jsonb_build_object('email', OLD.email),
      jsonb_build_object('email', NEW.email),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log email changes
CREATE TRIGGER user_email_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.pending_email IS DISTINCT FROM NEW.pending_email
  )
  EXECUTE FUNCTION log_email_changes();

-- Add comments
COMMENT ON FUNCTION log_email_changes() IS 'Logs email change requests and completions to audit_logs table';
COMMENT ON TRIGGER user_email_changes_audit_trigger ON users IS 'Automatically logs email changes to audit trail';
