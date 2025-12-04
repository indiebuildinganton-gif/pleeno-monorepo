-- ======================================
-- Migration 2: Agency Domain - Core Tables
-- ======================================

BEGIN;

-- Combining agency domain migrations...

-- Source: 001_agencies_schema.sql

-- Migration 001: Create agencies table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  currency TEXT DEFAULT 'AUD' NOT NULL,
  timezone TEXT DEFAULT 'Australia/Brisbane' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agencies_updated_at
  BEFORE UPDATE ON agencies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add index for common queries
CREATE INDEX idx_agencies_name ON agencies(name);

-- Add comments for documentation
COMMENT ON TABLE agencies IS 'Multi-tenant agencies - each represents a separate commission agency with isolated data';
COMMENT ON COLUMN agencies.id IS 'Primary tenant identifier used for RLS policies across all tenant-scoped tables';
COMMENT ON COLUMN agencies.currency IS 'Default currency for all financial calculations (ISO 4217 code)';
COMMENT ON COLUMN agencies.timezone IS 'Agency timezone for date/time display (IANA timezone identifier)';


-- Source: 002_users_schema.sql

-- Migration 002: Create users table with agency_id foreign key
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

CREATE TABLE users (
  -- Link to Supabase Auth user
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- User profile
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,

  -- Role-based access control
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'agency_user')),

  -- Account status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Performance indexes (critical for RLS queries)
CREATE INDEX idx_users_agency_id ON users(agency_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(agency_id, status);

-- Updated_at trigger
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add constraints
ALTER TABLE users ADD CONSTRAINT users_email_format_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add comments
COMMENT ON TABLE users IS 'Application users linked to Supabase Auth, scoped to agencies for multi-tenant isolation';
COMMENT ON COLUMN users.agency_id IS 'Foreign key to agencies table - enforces tenant isolation via RLS policies';
COMMENT ON COLUMN users.id IS 'References auth.users(id) from Supabase Auth - single source of truth for authentication';
COMMENT ON COLUMN users.role IS 'User role within their agency: agency_admin (full access) or agency_user (limited access)';


-- Source: 003_agency_rls.sql

-- Migration 003: Enable RLS and create policies for agencies table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Enable Row-Level Security on agencies table
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Policy 1: Agency Isolation (SELECT)
-- Users can only SELECT their own agency's data
CREATE POLICY agency_isolation_select ON agencies
  FOR SELECT
  USING (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Policy 2: Agency Isolation (INSERT)
-- Prevent users from creating new agencies via application
-- Only service role can insert agencies (e.g., via admin API)
CREATE POLICY agency_isolation_insert ON agencies
  FOR INSERT
  WITH CHECK (false);  -- Block all INSERTs from anon/authenticated users

-- Policy 3: Agency Isolation (UPDATE)
-- Agency admins can update their own agency data
CREATE POLICY agency_isolation_update ON agencies
  FOR UPDATE
  USING (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'  -- Only admins can update agency
    )
  )
  WITH CHECK (
    id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- Policy 4: Agency Isolation (DELETE)
-- Prevent agency deletion via application
-- Only service role can delete agencies
CREATE POLICY agency_isolation_delete ON agencies
  FOR DELETE
  USING (false);  -- Block all DELETEs from anon/authenticated users

-- Add policy comments for documentation
COMMENT ON POLICY agency_isolation_select ON agencies IS
  'Users can only view their own agency data - enforced via auth.uid() lookup in users table';

COMMENT ON POLICY agency_isolation_update ON agencies IS
  'Only agency_admin role can update their agency settings - prevents regular users from modifying agency data';

COMMIT;


-- Source: 004_users_rls.sql

-- Migration 004: Enable RLS and create policies for users table
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Enable Row-Level Security on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- SELECT POLICIES
-- ============================================================

-- Policy 1: User Agency Isolation (SELECT)
-- Users can view other users in their agency
CREATE POLICY users_agency_isolation_select ON users
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- Policy 2: User Self-Access (SELECT)
-- Users can always view their own profile
-- This provides a fallback if agency context is missing
CREATE POLICY users_self_access_select ON users
  FOR SELECT
  USING (id = auth.uid());

-- Note: Both SELECT policies apply with OR logic
-- Result: User sees their profile + all users in their agency

-- ============================================================
-- INSERT POLICIES
-- ============================================================

-- Policy 3: Prevent User Creation (INSERT)
-- Users cannot create new user records via application
-- New users created via Supabase Auth signup + trigger
CREATE POLICY users_prevent_insert ON users
  FOR INSERT
  WITH CHECK (false);

-- ============================================================
-- UPDATE POLICIES
-- ============================================================

-- Policy 4: User Self-Update (UPDATE)
-- Users can update their own profile fields
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- Prevent users from changing their agency_id or role
    AND agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND role = (SELECT role FROM users WHERE id = auth.uid())
  );

-- Policy 5: Admin User Management (UPDATE)
-- Agency admins can update users in their agency
CREATE POLICY users_admin_update ON users
  FOR UPDATE
  USING (
    -- Admin is in same agency as target user
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    -- Ensure updated user stays in same agency
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- DELETE POLICIES
-- ============================================================

-- Policy 6: Admin User Deletion (DELETE)
-- Agency admins can delete users in their agency
CREATE POLICY users_admin_delete ON users
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
    -- Prevent admins from deleting themselves
    AND id != auth.uid()
  );

-- Add policy comments for documentation
COMMENT ON POLICY users_agency_isolation_select ON users IS
  'Users can view all users in their agency - enforced via agency_id match';

COMMENT ON POLICY users_self_access_select ON users IS
  'Users can always view their own profile - provides fallback access';

COMMENT ON POLICY users_self_update ON users IS
  'Users can update their own profile but cannot change agency_id or role';

COMMENT ON POLICY users_admin_update ON users IS
  'Agency admins can update users in their agency including role changes';

COMMENT ON POLICY users_admin_delete ON users IS
  'Agency admins can delete users in their agency but not themselves';

COMMIT;


-- Source: 005_context_functions.sql

-- Migration 005: Create helper functions for agency context setting
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.2: Multi-Tenant Database Schema with RLS

BEGIN;

-- Function: Extract agency_id from JWT and set session variable
CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS VOID AS $$
DECLARE
  user_agency_id UUID;
BEGIN
  -- Get current user's agency_id from users table
  SELECT agency_id INTO user_agency_id
  FROM users
  WHERE id = auth.uid();

  -- Set session variable for use by RLS policies
  IF user_agency_id IS NOT NULL THEN
    PERFORM set_config(
      'app.current_agency_id',
      user_agency_id::text,
      true  -- true = local to transaction (important for security)
    );
  ELSE
    -- Clear context if no agency found
    PERFORM set_config('app.current_agency_id', '', true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get current agency context (helper for debugging)
CREATE OR REPLACE FUNCTION get_agency_context()
RETURNS UUID AS $$
BEGIN
  RETURN current_setting('app.current_agency_id', true)::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Verify user belongs to agency (helper for testing)
CREATE OR REPLACE FUNCTION verify_agency_access(target_agency_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_agency UUID;
BEGIN
  SELECT agency_id INTO user_agency
  FROM users
  WHERE id = auth.uid();

  RETURN user_agency = target_agency_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION set_agency_context() IS
  'Extracts agency_id from current user and sets PostgreSQL session variable app.current_agency_id';

COMMENT ON FUNCTION get_agency_context() IS
  'Returns current agency_id from session variable (useful for debugging)';

COMMENT ON FUNCTION verify_agency_access(UUID) IS
  'Checks if current user belongs to specified agency (useful for application logic)';

COMMIT;


-- Source: 005_rls_helpers.sql

-- Migration 005: RLS Helper Functions for Agency Context
-- Epic 1: Foundation & Multi-Tenant Security
-- Story 1.3: Authentication & Authorization Framework
-- Task 6: Implement Agency Context Setting

BEGIN;

-- ============================================================
-- Function: set_agency_context()
-- ============================================================
-- Sets the agency context from JWT claims for Row-Level Security filtering
-- Extracts agency_id from JWT app_metadata and sets PostgreSQL session variable
--
-- This function is called at the start of server-side data fetching operations
-- to ensure RLS policies can filter data by the authenticated user's agency.
--
-- The session variable is LOCAL to the current transaction and automatically
-- cleaned up when the transaction completes.
--
-- Usage: CALL set_agency_context() or SELECT set_agency_context()

CREATE OR REPLACE FUNCTION set_agency_context()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Get agency_id from JWT claims (app_metadata)
  -- The request.jwt.claims setting contains the decoded JWT
  -- Structure: {"sub": "user-id", "app_metadata": {"agency_id": "uuid", "role": "..."}}
  PERFORM set_config(
    'app.current_agency_id',
    COALESCE(
      -- Extract agency_id from JWT claims
      -- First get the full claims JSON, then navigate to app_metadata.agency_id
      (current_setting('request.jwt.claims', true)::json->'app_metadata'->>'agency_id'),
      ''
    ),
    true  -- true = LOCAL to current transaction (auto cleanup)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION set_agency_context() TO authenticated;

COMMENT ON FUNCTION set_agency_context() IS
'Sets the agency context from JWT app_metadata for Row-Level Security filtering. Call this at the start of server-side data operations.';


-- ============================================================
-- Function: get_current_agency_id()
-- ============================================================
-- Helper function to retrieve the current agency context value
-- Useful for debugging RLS issues and verifying context is set correctly
--
-- Returns: UUID of current agency or NULL if not set
-- Usage: SELECT get_current_agency_id()

CREATE OR REPLACE FUNCTION get_current_agency_id()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_id_text text;
BEGIN
  -- Get the session variable value
  agency_id_text := current_setting('app.current_agency_id', true);

  -- Return NULL if empty or not set
  IF agency_id_text IS NULL OR agency_id_text = '' THEN
    RETURN NULL;
  END IF;

  -- Cast to UUID and return
  RETURN agency_id_text::uuid;

EXCEPTION
  WHEN OTHERS THEN
    -- If any error (e.g., invalid UUID format), return NULL
    RETURN NULL;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_current_agency_id() TO authenticated;

COMMENT ON FUNCTION get_current_agency_id() IS
'Returns the current agency ID from session variable. Used for debugging RLS context.';

COMMIT;


-- Source: 006_email_verification.sql

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
CREATE POLICY "Audit logs are insert-only"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
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


-- Source: 006_invitations_schema.sql

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


-- Source: 006_users_status.sql

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


-- Source: 007_audit_triggers.sql

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


-- Source: 008_seed_master_tasks.sql

-- Migration 008: Seed master tasks list with common agency tasks
-- Epic 2: Agency & User Management
-- Story 2.2: User Invitation and Task Assignment System
-- Acceptance Criteria: AC 5
-- Task 03: Seed master tasks list with common agency tasks

BEGIN;

-- ============================================================
-- STEP 1: Insert Master Tasks
-- ============================================================

-- Insert common agency tasks that can be assigned to users
-- These tasks represent typical responsibilities in education agencies
INSERT INTO master_tasks (task_name, task_code, description) VALUES
  ('Data Entry', 'DATA_ENTRY', 'Enter student and payment plan information into the system'),
  ('Document Verification', 'DOC_VERIFY', 'Verify student documents and offer letters for accuracy and completeness'),
  ('Payment Processing', 'PAYMENT_PROC', 'Record and track payment installments, update payment status'),
  ('Student Communication', 'STUDENT_COMM', 'Communicate with students about payments, deadlines, and status updates'),
  ('College Liaison', 'COLLEGE_LIAISON', 'Coordinate with college partners on student placements and documentation'),
  ('Reporting', 'REPORTING', 'Generate and export reports for agency management and analysis')
ON CONFLICT (task_code) DO NOTHING;  -- Idempotent: skip if tasks already exist

-- ============================================================
-- STEP 2: Verify Seed Data
-- ============================================================

-- Ensure all 6 tasks were inserted
DO $$
DECLARE
  task_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO task_count FROM master_tasks;

  IF task_count < 6 THEN
    RAISE WARNING 'Expected 6 master tasks but found only %. Some tasks may not have been inserted.', task_count;
  ELSE
    RAISE NOTICE 'Successfully seeded % master tasks', task_count;
  END IF;
END $$;

COMMIT;


-- Source: 009_add_task_ids_to_invitations.sql

-- Migration 009: Add task_ids to invitations table
-- Epic 2: Agency & User Management
-- Story 2.2: User Invitation and Task Assignment System
-- Task 11: Display pending invitations in user management

-- Add task_ids column to store assigned task IDs with invitation
-- This allows us to:
-- 1. Display assigned tasks in pending invitations list
-- 2. Resend invitation emails with the same task assignments
-- 3. Maintain consistency between original invitation and resent invitations

BEGIN;

-- Add task_ids column as JSONB to store array of task UUIDs
ALTER TABLE invitations
ADD COLUMN task_ids JSONB DEFAULT '[]'::jsonb;

-- Add comment explaining the column
COMMENT ON COLUMN invitations.task_ids IS 'JSON array of task UUIDs assigned in this invitation. Used to display assigned tasks and resend invitations with same tasks.';

-- Add index for querying invitations by task_ids (GIN index for JSONB)
CREATE INDEX idx_invitations_task_ids ON invitations USING gin(task_ids);

COMMIT;


-- Source: 010_add_agency_timezone_fields.sql

-- Migration 010: Add agency timezone and cutoff time fields
-- Epic 5: Automated Installment Status Management
-- Story 5.1: Automated Status Detection Job
-- Task 6: Add Agency Timezone and Cutoff Time Fields

-- Add overdue cutoff time column (time of day when installments become overdue)
ALTER TABLE agencies
ADD COLUMN overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00';

-- Add due soon threshold column (for future Story 5.2)
ALTER TABLE agencies
ADD COLUMN due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add check constraint for timezone (valid IANA timezone names)
-- Note: timezone column already exists from migration 001, adding constraint here
ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  -- Australian timezones
  'Australia/Brisbane',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Adelaide',
  'Australia/Darwin',
  'Australia/Hobart',
  'Australia/Canberra',
  -- Americas
  'America/Los_Angeles',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  -- Europe
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Brussels',
  'Europe/Vienna',
  'Europe/Stockholm',
  'Europe/Dublin',
  -- Asia
  'Asia/Tokyo',
  'Asia/Singapore',
  'Asia/Hong_Kong',
  'Asia/Shanghai',
  'Asia/Seoul',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Jakarta',
  'Asia/Manila',
  -- Pacific
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Guam',
  'Pacific/Honolulu',
  -- Others
  'UTC'
));

-- Add check constraint for overdue cutoff time (must be valid time between 00:00 and 23:59)
ALTER TABLE agencies
ADD CONSTRAINT agencies_cutoff_time_check
CHECK (overdue_cutoff_time BETWEEN '00:00:00' AND '23:59:59');

-- Add check constraint for due soon days (must be between 1 and 30)
ALTER TABLE agencies
ADD CONSTRAINT agencies_due_soon_days_check
CHECK (due_soon_threshold_days BETWEEN 1 AND 30);

-- Update column comments for documentation
COMMENT ON COLUMN agencies.timezone IS 'IANA timezone name for agency location (e.g., Australia/Brisbane). Used for timezone-aware overdue detection.';
COMMENT ON COLUMN agencies.overdue_cutoff_time IS 'Time of day when pending installments become overdue in agency local time (default 5:00 PM). Used by automated status detection job.';
COMMENT ON COLUMN agencies.due_soon_threshold_days IS 'Number of days before due date to flag installments as "due soon" (default 4 days). Used for future Story 5.2.';

-- Backfill is handled by DEFAULT values, but verify existing agencies have proper values
-- (This is defensive - DEFAULT should have already set values for existing rows)
UPDATE agencies
SET
  overdue_cutoff_time = COALESCE(overdue_cutoff_time, '17:00:00'),
  due_soon_threshold_days = COALESCE(due_soon_threshold_days, 4)
WHERE overdue_cutoff_time IS NULL OR due_soon_threshold_days IS NULL;


-- Source: 002_agency_domain/005_users_status.sql

-- Migration 005: User Status Management and Authentication Control
-- Epic 2: Agency Setup and User Management
-- Story 2.3: User Management Interface (AC 3, 4)
--
-- This migration adds:
-- 1. Status field to users table (if not exists)
-- 2. Trigger to prevent inactive users from logging in
-- 3. Audit logging trigger for status and role changes
-- 4. RLS policy updates to check status for authentication

BEGIN;

-- ============================================================================
-- ADD STATUS FIELD TO USERS TABLE
-- ============================================================================

-- Add status field to users table (idempotent - column may already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users'
    AND column_name = 'status'
  ) THEN
    ALTER TABLE users ADD COLUMN status TEXT
      CHECK (status IN ('active', 'inactive'))
      DEFAULT 'active';

    COMMENT ON COLUMN users.status IS 'User account status: active (can log in) or inactive (blocked from login)';
  END IF;
END $$;

-- Create index for efficient status queries if not exists
CREATE INDEX IF NOT EXISTS idx_users_status_lookup ON users(status) WHERE status = 'inactive';

-- ============================================================================
-- TRIGGER: Prevent Inactive Users from Logging In
-- ============================================================================

-- Function to check user status on authentication
-- Note: Supabase Auth manages sessions in auth.sessions table (auth schema)
-- Direct triggers on auth.sessions may not be supported in all Supabase versions
-- This function should be called from middleware/API layer during authentication
CREATE OR REPLACE FUNCTION check_user_active()
RETURNS TRIGGER AS $$
DECLARE
  user_status TEXT;
BEGIN
  -- Get user status from public.users table
  SELECT status INTO user_status
  FROM public.users
  WHERE id = NEW.user_id;

  -- If user not found or inactive, prevent session creation
  IF user_status IS NULL THEN
    RAISE EXCEPTION 'User not found in users table';
  END IF;

  IF user_status = 'inactive' THEN
    RAISE EXCEPTION 'User account is deactivated. Please contact your agency administrator.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_active IS 'Validates that a user is active before allowing session creation. Raises exception if user is inactive.';

-- Attempt to create trigger on auth.sessions
-- NOTE: This may fail if auth.sessions is not accessible
-- In that case, status checking should be enforced at the API/middleware level
DO $$
BEGIN
  -- Drop trigger if it exists
  DROP TRIGGER IF EXISTS check_user_active_trigger ON auth.sessions;

  -- Create trigger to check user status on session creation
  CREATE TRIGGER check_user_active_trigger
    BEFORE INSERT ON auth.sessions
    FOR EACH ROW
    EXECUTE FUNCTION check_user_active();
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot create trigger on auth.sessions (insufficient privileges). User status checking must be enforced at API/middleware level.';
  WHEN undefined_table THEN
    RAISE NOTICE 'auth.sessions table not accessible. User status checking must be enforced at API/middleware level.';
END $$;

-- ============================================================================
-- TRIGGER: Audit Logging for User Changes
-- ============================================================================

-- Function to log status and role changes to audit_log table
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
DECLARE
  acting_user_id UUID;
BEGIN
  -- Get the current user ID from session or use the updated user's ID
  acting_user_id := COALESCE(
    NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
    auth.uid(),
    NEW.id  -- Fallback to the user being updated
  );

  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      acting_user_id,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'changed_at', now(),
        'user_email', NEW.email,
        'user_name', NEW.full_name
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
      acting_user_id,
      'role_change',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'changed_at', now(),
        'user_email', NEW.email,
        'user_name', NEW.full_name
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_user_changes IS 'Automatically logs status and role changes to audit_log table for compliance and tracking';

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS user_changes_audit_trigger ON users;

CREATE TRIGGER user_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();

-- ============================================================================
-- RLS POLICY UPDATES
-- ============================================================================

-- Update existing RLS policies to consider user status
-- Users should only be able to interact with active users (except admins)

-- Policy for selecting users - allow viewing inactive users for admin
-- (This assumes existing RLS policies already check agency_id)
DROP POLICY IF EXISTS "Users can view active users in their agency" ON users;

CREATE POLICY "Users can view active users in their agency"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    -- Users can view users in their own agency
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (
      -- Either the user is active
      status = 'active'
      -- OR the viewing user is an admin (can see all users)
      OR (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
    )
  );

-- ============================================================================
-- HELPER FUNCTION FOR API LAYER
-- ============================================================================

-- Function to validate user status (for use in API/middleware)
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
    RAISE EXCEPTION 'User account is % and cannot log in. Please contact your agency administrator.', user_status;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION check_user_active_status IS 'Validates that a user is active before allowing authentication. Call from middleware/API layer. Returns TRUE if active, raises exception if inactive.';

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================

-- 1. The status field may already exist in the users table from the original schema.
--    This migration ensures it exists and has proper constraints.
--
-- 2. Preventing inactive user logins MUST be enforced at multiple levels:
--    a) Database trigger on auth.sessions (if supported)
--    b) API/middleware level by calling check_user_active_status()
--    c) Client-side checks (for UX, not security)
--
-- 3. Constraint to prevent admin from deactivating themselves should be
--    enforced at the API level, not database level, for better error messages.
--
-- 4. To set the current_user_id for audit logging, use:
--    SELECT set_config('app.current_user_id', auth.uid()::text, false);
--    This should be called at the start of API routes that modify users.
--
-- 5. The audit_log table must exist before this migration runs.
--    It should be created in an earlier migration (e.g., 001_agency_domain/006_users_status.sql)
--
-- 6. RLS policies are updated to allow admins to view inactive users while
--    regular users can only see active users.
--
-- 7. For API implementation, use check_user_active_status() during authentication
--    to ensure inactive users cannot log in:
--
--    Example middleware:
--    ```typescript
--    const { data, error } = await supabase.rpc('check_user_active_status', {
--      user_uuid: user.id
--    });
--    if (error) {
--      throw new Error('Account is deactivated');
--    }
--    ```

COMMIT;

COMMIT;
