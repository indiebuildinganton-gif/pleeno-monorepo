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
