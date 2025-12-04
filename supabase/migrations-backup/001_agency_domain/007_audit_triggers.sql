-- Migration 007: Create audit logging triggers for user profiles and task assignments
-- Epic 2: Agency & User Management
-- Story 2.2: User Invitation and Task Assignment System
-- Acceptance Criteria: AC 8
-- Task 02: Create audit logging schema for user profile changes

BEGIN;

-- ============================================================
-- STEP 1: Create Trigger Functions
-- ============================================================

-- Function: audit_user_changes()
-- Automatically logs changes to user profiles (email, full_name, role, status)
-- Captures before/after values in JSONB format for complete audit trail
CREATE OR REPLACE FUNCTION audit_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
  action_type TEXT;
  actor_id UUID;
BEGIN
  -- Determine action type
  IF (TG_OP = 'DELETE') THEN
    action_type := 'delete';
    actor_id := auth.uid();

    -- For DELETE, store the deleted record
    changes := jsonb_build_object(
      'before', row_to_json(OLD)::JSONB,
      'after', NULL
    );

    -- Insert audit log entry
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json)
    VALUES ('user', OLD.id, actor_id, action_type, changes);

    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    action_type := 'update';
    actor_id := auth.uid();

    -- Only log if relevant fields changed
    IF (OLD.email IS DISTINCT FROM NEW.email OR
        OLD.full_name IS DISTINCT FROM NEW.full_name OR
        OLD.role IS DISTINCT FROM NEW.role OR
        OLD.status IS DISTINCT FROM NEW.status) THEN

      -- Build changes object with only changed fields
      changes := jsonb_build_object(
        'before', jsonb_build_object(
          'email', OLD.email,
          'full_name', OLD.full_name,
          'role', OLD.role,
          'status', OLD.status
        ),
        'after', jsonb_build_object(
          'email', NEW.email,
          'full_name', NEW.full_name,
          'role', NEW.role,
          'status', NEW.status
        )
      );

      -- Insert audit log entry
      INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json)
      VALUES ('user', NEW.id, actor_id, action_type, changes);
    END IF;

    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    action_type := 'create';
    actor_id := auth.uid();

    -- For INSERT, store the new record
    changes := jsonb_build_object(
      'before', NULL,
      'after', jsonb_build_object(
        'email', NEW.email,
        'full_name', NEW.full_name,
        'role', NEW.role,
        'status', NEW.status
      )
    );

    -- Insert audit log entry
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json)
    VALUES ('user', NEW.id, actor_id, action_type, changes);

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: audit_task_assignment_changes()
-- Automatically logs changes to task assignments (assign/revoke tasks)
-- Captures task_id and assigned_by for complete audit trail
CREATE OR REPLACE FUNCTION audit_task_assignment_changes()
RETURNS TRIGGER AS $$
DECLARE
  changes JSONB;
  action_type TEXT;
  actor_id UUID;
BEGIN
  -- Determine action type
  IF (TG_OP = 'DELETE') THEN
    action_type := 'delete';
    actor_id := auth.uid();

    -- For DELETE, store the deleted assignment with task details
    changes := jsonb_build_object(
      'before', jsonb_build_object(
        'user_id', OLD.user_id,
        'task_id', OLD.task_id,
        'assigned_by', OLD.assigned_by,
        'assigned_at', OLD.assigned_at
      ),
      'after', NULL
    );

    -- Insert audit log entry (use user_id as entity_id for grouping)
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json)
    VALUES ('user_task_assignment', OLD.user_id, actor_id, action_type, changes);

    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    action_type := 'update';
    actor_id := auth.uid();

    -- Build changes object
    changes := jsonb_build_object(
      'before', jsonb_build_object(
        'user_id', OLD.user_id,
        'task_id', OLD.task_id,
        'assigned_by', OLD.assigned_by,
        'assigned_at', OLD.assigned_at
      ),
      'after', jsonb_build_object(
        'user_id', NEW.user_id,
        'task_id', NEW.task_id,
        'assigned_by', NEW.assigned_by,
        'assigned_at', NEW.assigned_at
      )
    );

    -- Insert audit log entry
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json)
    VALUES ('user_task_assignment', NEW.user_id, actor_id, action_type, changes);

    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    action_type := 'create';
    actor_id := auth.uid();

    -- For INSERT, store the new assignment
    changes := jsonb_build_object(
      'before', NULL,
      'after', jsonb_build_object(
        'user_id', NEW.user_id,
        'task_id', NEW.task_id,
        'assigned_by', NEW.assigned_by,
        'assigned_at', NEW.assigned_at
      )
    );

    -- Insert audit log entry
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json)
    VALUES ('user_task_assignment', NEW.user_id, actor_id, action_type, changes);

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Create Triggers
-- ============================================================

-- Trigger: Audit user profile changes
-- Fires AFTER INSERT, UPDATE, or DELETE on users table
-- Logs all changes to email, full_name, role, and status fields
CREATE TRIGGER audit_user_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION audit_user_changes();

-- Trigger: Audit task assignment changes
-- Fires AFTER INSERT, UPDATE, or DELETE on user_task_assignments table
-- Logs all task assignments and revocations
CREATE TRIGGER audit_task_assignment_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON user_task_assignments
  FOR EACH ROW
  EXECUTE FUNCTION audit_task_assignment_changes();

-- ============================================================
-- STEP 3: Add Documentation
-- ============================================================

COMMENT ON FUNCTION audit_user_changes() IS
  'Trigger function that automatically logs all changes to user profiles (email, full_name, role, status) to the audit_log table. Captures before/after values in JSONB format.';

COMMENT ON FUNCTION audit_task_assignment_changes() IS
  'Trigger function that automatically logs all task assignment changes (create, update, delete) to the audit_log table. Tracks which admin assigned/revoked tasks and when.';

COMMENT ON TRIGGER audit_user_changes_trigger ON users IS
  'Automatically logs user profile changes to audit_log table for compliance and security tracking (AC 8)';

COMMENT ON TRIGGER audit_task_assignment_changes_trigger ON user_task_assignments IS
  'Automatically logs task assignment changes to audit_log table for admin oversight and accountability (AC 8)';

COMMIT;
