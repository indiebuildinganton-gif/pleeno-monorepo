-- Migration 006: User Status Management and Audit Logging
-- Epic 2: Agency Setup and User Management
-- Story 2.3: User Management Interface (AC 3, 4)
--
-- This migration adds:
-- 1. Audit log table for tracking user changes
-- 2. Trigger to prevent inactive users from logging in
-- 3. Trigger to log status and role changes

BEGIN;

-- ============================================================================
-- AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Entity information
  entity_type TEXT NOT NULL CHECK (entity_type IN ('user', 'agency', 'entity', 'payment', 'task')),
  entity_id UUID NOT NULL,

  -- Actor information
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL,
  changes_json JSONB,

  -- Metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Comments
COMMENT ON TABLE audit_log IS 'Immutable audit trail for all significant changes across the platform';
COMMENT ON COLUMN audit_log.entity_type IS 'Type of entity being audited (user, agency, entity, payment, task)';
COMMENT ON COLUMN audit_log.entity_id IS 'ID of the entity being audited';
COMMENT ON COLUMN audit_log.user_id IS 'User who performed the action (NULL for system actions)';
COMMENT ON COLUMN audit_log.action IS 'Action performed (e.g., status_change, role_change, created, deleted)';
COMMENT ON COLUMN audit_log.changes_json IS 'JSON object containing old and new values';

-- ============================================================================
-- TRIGGER: Prevent Inactive Users from Logging In
-- ============================================================================

-- Note: Supabase Auth manages sessions in auth.sessions table
-- We'll create a function that can be called during authentication flow
-- This will be enforced at the API/middleware level

CREATE OR REPLACE FUNCTION check_user_active_status(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_status TEXT;
BEGIN
  SELECT status INTO user_status
  FROM users
  WHERE id = user_uuid;

  IF user_status IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  IF user_status != 'active' THEN
    RAISE EXCEPTION 'User account is % and cannot log in', user_status;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_active_status IS 'Validates that a user is active before allowing authentication. Call from middleware/API layer.';

-- ============================================================================
-- TRIGGER: Audit Logging for User Changes
-- ============================================================================

CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      COALESCE(
        NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
        NEW.id  -- If no current_user_id is set, assume self-update
      ),
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', now()
      ),
      now()
    );
  END IF;

  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      COALESCE(
        NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
        NEW.id  -- If no current_user_id is set, assume self-update
      ),
      'role_change',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_at', now()
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_user_changes IS 'Automatically logs status and role changes to audit_log table';

-- Create trigger on users table
DROP TRIGGER IF EXISTS user_changes_audit_trigger ON users;
CREATE TRIGGER user_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();

-- ============================================================================
-- RLS POLICIES FOR AUDIT LOG
-- ============================================================================

-- Enable RLS on audit_log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Agency admins can view audit logs for their agency's users
CREATE POLICY audit_log_select_policy ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    -- Only agency admins can view audit logs
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
    AND
    -- Allow users to see audit logs for entities in their agency
    CASE entity_type
      WHEN 'user' THEN
        entity_id IN (
          SELECT id FROM users u
          WHERE u.agency_id = (
            SELECT agency_id FROM users WHERE id = auth.uid()
          )
        )
      WHEN 'agency' THEN
        entity_id = (
          SELECT agency_id FROM users WHERE id = auth.uid()
        )
      -- Add more entity types as needed
      ELSE false
    END
  );

-- No one can update or delete audit logs (immutable)
-- INSERT is handled by triggers only

COMMENT ON POLICY audit_log_select_policy ON audit_log IS 'Agency admins can view audit logs for their agency';

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================

-- 1. The status field already exists in the users table with values:
--    ('active', 'inactive', 'suspended')
--
-- 2. Preventing inactive user logins should be enforced at the API/middleware level
--    by calling check_user_active_status() function during authentication
--
-- 3. Constraint to prevent admin from deactivating themselves should be
--    enforced at the API level, not database level, for better error messages
--
-- 4. To set the current_user_id for audit logging, use:
--    SELECT set_config('app.current_user_id', auth.uid()::text, false);
--
-- 5. The audit_log table is designed to be immutable - no UPDATE or DELETE policies

COMMIT;
