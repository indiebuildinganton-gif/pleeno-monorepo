-- Migration 08: Activity Log and Reports
-- From the reports domain migration

BEGIN;

-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT valid_entity_type CHECK (
    entity_type IN ('payment', 'payment_plan', 'student', 'enrollment', 'installment', 'report')
  ),
  CONSTRAINT valid_action CHECK (
    action IN ('created', 'recorded', 'updated', 'marked_overdue', 'deleted', 'exported')
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_log_agency_created ON activity_log(agency_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

COMMIT;
