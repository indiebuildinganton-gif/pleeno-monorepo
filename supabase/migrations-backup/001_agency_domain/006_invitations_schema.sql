-- Migration 006: Create invitations and task assignment tables with RLS
-- Epic 2: Agency & User Management
-- Story 2.2: User Invitation and Task Assignment System
-- Acceptance Criteria: AC 1, 2, 5, 8

BEGIN;

-- ============================================================
-- STEP 1: Create Tables
-- ============================================================

-- Table: invitations
-- Stores invitation tokens for new users to join agencies
-- Linked to agency for multi-tenant isolation
CREATE TABLE invitations (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Invitation details
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'agency_user')),
  token TEXT UNIQUE NOT NULL,

  -- Tracking
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: master_tasks
-- Global lookup table for task types that can be assigned to users
-- Not tenant-scoped (visible to all agencies)
CREATE TABLE master_tasks (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Task details
  task_name TEXT NOT NULL,
  task_code TEXT UNIQUE NOT NULL,
  description TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Table: user_task_assignments
-- Links users to their assigned tasks (many-to-many relationship)
-- Inherits tenant isolation through user_id FK
CREATE TABLE user_task_assignments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relationships
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES master_tasks(id) ON DELETE CASCADE,

  -- Tracking
  assigned_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Ensure one assignment per user-task pair
  UNIQUE(user_id, task_id)
);

-- Table: audit_log
-- Immutable audit trail for tracking changes to users and task assignments
-- Linked indirectly to agency through user_id
CREATE TABLE audit_log (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Audit details
  entity_type TEXT NOT NULL,  -- 'user', 'user_task_assignment', 'invitation', etc.
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,  -- 'create', 'update', 'delete'
  changes_json JSONB,

  -- Timestamp (no updates allowed - immutable audit trail)
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- Invitations indexes
CREATE INDEX idx_invitations_agency_id ON invitations(agency_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
CREATE INDEX idx_invitations_agency_email ON invitations(agency_id, email);

-- Master tasks indexes
CREATE INDEX idx_master_tasks_task_code ON master_tasks(task_code);

-- User task assignments indexes
CREATE INDEX idx_user_task_assignments_user_id ON user_task_assignments(user_id);
CREATE INDEX idx_user_task_assignments_task_id ON user_task_assignments(task_id);

-- Audit log indexes
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);

-- ============================================================
-- STEP 3: Enable RLS
-- ============================================================

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE master_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS Policies
-- ============================================================

-- ===== Invitations RLS Policies =====
-- Only agency_admin can manage invitations for their agency

CREATE POLICY invitations_admin_all ON invitations
  FOR ALL
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  )
  WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

-- ===== Master Tasks RLS Policies =====
-- All authenticated users can view master tasks (global lookup table)
-- Only system/admin can insert/update/delete (not covered by app-level RLS)

CREATE POLICY master_tasks_select_all ON master_tasks
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- ===== User Task Assignments RLS Policies =====
-- Users can view task assignments for users in their agency
-- Only agency_admin can manage task assignments

CREATE POLICY user_task_assignments_select ON user_task_assignments
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );

CREATE POLICY user_task_assignments_admin_insert ON user_task_assignments
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY user_task_assignments_admin_update ON user_task_assignments
  FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY user_task_assignments_admin_delete ON user_task_assignments
  FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

-- ===== Audit Log RLS Policies =====
-- Only agency_admin can view audit logs for their agency
-- Audit logs are immutable (no UPDATE or DELETE policies)

CREATE POLICY audit_log_admin_select ON audit_log
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY audit_log_insert ON audit_log
  FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM users
      WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );

-- ============================================================
-- STEP 5: Add Email Format Constraint
-- ============================================================

ALTER TABLE invitations ADD CONSTRAINT invitations_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

-- Invitations table comments
COMMENT ON TABLE invitations IS
  'Invitation tokens for new users to join agencies - expires after 7 days, single-use only';

COMMENT ON COLUMN invitations.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN invitations.token IS
  'Cryptographically secure UUID v4 token for invitation link - must be unique across all invitations';

COMMENT ON COLUMN invitations.expires_at IS
  'Expiration timestamp - invitations expire 7 days after creation';

COMMENT ON COLUMN invitations.used_at IS
  'Timestamp when invitation was used - prevents token reuse';

-- Master tasks table comments
COMMENT ON TABLE master_tasks IS
  'Global lookup table for task types that can be assigned to agency users (e.g., data entry, document verification)';

COMMENT ON COLUMN master_tasks.task_code IS
  'Unique code identifier for task type - used in application logic (e.g., DATA_ENTRY, DOC_VERIFY)';

-- User task assignments table comments
COMMENT ON TABLE user_task_assignments IS
  'Many-to-many relationship linking users to their assigned tasks - inherits tenant isolation through user_id';

COMMENT ON COLUMN user_task_assignments.assigned_by IS
  'Foreign key to users table - tracks which admin assigned the task';

-- Audit log table comments
COMMENT ON TABLE audit_log IS
  'Immutable audit trail for tracking changes to users, task assignments, and invitations - insert-only';

COMMENT ON COLUMN audit_log.changes_json IS
  'JSONB field storing before/after values for audit trail - format: {"before": {...}, "after": {...}}';

-- Policy comments
COMMENT ON POLICY invitations_admin_all ON invitations IS
  'Agency isolation: Only agency_admin can manage invitations for their agency';

COMMENT ON POLICY master_tasks_select_all ON master_tasks IS
  'All authenticated users can view master tasks - global lookup table';

COMMENT ON POLICY user_task_assignments_select ON user_task_assignments IS
  'Agency isolation: Users can view task assignments for users in their agency';

COMMENT ON POLICY user_task_assignments_admin_insert ON user_task_assignments IS
  'Agency isolation: Only agency_admin can assign tasks to users in their agency';

COMMENT ON POLICY audit_log_admin_select ON audit_log IS
  'Agency isolation: Only agency_admin can view audit logs for their agency';

COMMENT ON POLICY audit_log_insert ON audit_log IS
  'All authenticated users can insert audit logs for their agency';

COMMIT;
