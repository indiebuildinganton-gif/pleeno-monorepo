#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Fixing Migrations for Clean UAT Deployment${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Create clean migrations directory
CLEAN_DIR="supabase/migrations-clean"
mkdir -p $CLEAN_DIR

echo -e "${GREEN}Creating clean, separated migration files...${NC}"
echo ""

# ===========================
# Migration 1: Foundation
# ===========================
cat > $CLEAN_DIR/01_foundation.sql << 'EOF'
-- Migration 01: Foundation
-- Just a placeholder for initial setup

SELECT 'Foundation schema placeholder' as message;
EOF
echo -e "${GREEN}✓ Created 01_foundation.sql${NC}"

# ===========================
# Migration 2: Extensions
# ===========================
cat > $CLEAN_DIR/02_extensions.sql << 'EOF'
-- Migration 02: Enable Required Extensions
-- These are needed for UUID, cron jobs, and HTTP requests

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable HTTP extension for Edge Functions
CREATE EXTENSION IF NOT EXISTS "http";

-- Enable pg_cron for scheduled jobs
-- Note: This may already be enabled by Supabase
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- Enable pg_net for network requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

COMMIT;
EOF
echo -e "${GREEN}✓ Created 02_extensions.sql${NC}"

# ===========================
# Migration 3: Extract and fix agency domain
# ===========================
echo -e "${YELLOW}Processing agency domain migration...${NC}"

# Extract the main content from 001_agency_domain
# Remove any DROP statements, fix any issues
# This is complex, so we'll create a cleaned version

cat > $CLEAN_DIR/03_agency_domain.sql << 'EOF'
-- Migration 03: Agency Domain
-- Creates core tables: agencies, users, branches
-- Note: This is a simplified extraction. You'll need to copy the actual content
-- from supabase/migrations/20241204000001_001_agency_domain.sql
-- Remove any DROP statements and ensure CREATE statements use IF NOT EXISTS

BEGIN;

-- Placeholder: Copy the actual agency domain tables here
-- Make sure to:
-- 1. Remove any DROP statements
-- 2. Add IF NOT EXISTS to all CREATE TABLE statements
-- 3. Remove any permission GRANT statements for cron schema

SELECT 'Copy agency domain tables from migration 001' as todo;

COMMIT;
EOF
echo -e "${GREEN}✓ Created 03_agency_domain.sql (needs content)${NC}"

# ===========================
# Migration 4: Extract entities domain
# ===========================
cat > $CLEAN_DIR/04_entities_domain.sql << 'EOF'
-- Migration 04: Entities Domain
-- Creates: colleges, courses, students, enrollments
-- Note: Copy from supabase/migrations/20241204000003_002_entities_domain.sql

BEGIN;

-- Placeholder: Copy the actual entities domain tables here
-- Make sure to:
-- 1. Remove any DROP statements
-- 2. Add IF NOT EXISTS to all CREATE TABLE statements

SELECT 'Copy entities domain tables from migration 003' as todo;

COMMIT;
EOF
echo -e "${GREEN}✓ Created 04_entities_domain.sql (needs content)${NC}"

# ===========================
# Migration 5: Extract payments domain
# ===========================
cat > $CLEAN_DIR/05_payments_domain.sql << 'EOF'
-- Migration 05: Payments Domain
-- Creates: payment_plans, installments, payments
-- Note: Copy from supabase/migrations/20241204000004_003_payments_domain.sql

BEGIN;

-- Placeholder: Copy the actual payments domain tables here

SELECT 'Copy payments domain tables from migration 004' as todo;

COMMIT;
EOF
echo -e "${GREEN}✓ Created 05_payments_domain.sql (needs content)${NC}"

# ===========================
# Migration 6: Jobs Infrastructure (cleaned)
# ===========================
cat > $CLEAN_DIR/06_jobs_infrastructure.sql << 'EOF'
-- Migration 06: Jobs Infrastructure
-- Creates jobs_log table and related functions
-- This is extracted from the notifications migration

BEGIN;

-- Create jobs_log table
CREATE TABLE IF NOT EXISTS jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  records_updated INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_log_status ON jobs_log(status) WHERE status = 'failed';

-- Enable RLS
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

-- Add agency configuration fields
ALTER TABLE agencies
ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'Australia/Brisbane',
ADD COLUMN IF NOT EXISTS overdue_cutoff_time TIME NOT NULL DEFAULT '17:00:00',
ADD COLUMN IF NOT EXISTS due_soon_threshold_days INT NOT NULL DEFAULT 4;

-- Add constraints
ALTER TABLE agencies DROP CONSTRAINT IF EXISTS agencies_timezone_check;
ALTER TABLE agencies
ADD CONSTRAINT agencies_timezone_check
CHECK (timezone IN (
  'Australia/Brisbane', 'Australia/Sydney', 'Australia/Melbourne',
  'Australia/Perth', 'Australia/Adelaide', 'America/Los_Angeles',
  'America/New_York', 'America/Chicago', 'Europe/London',
  'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore',
  'Pacific/Auckland', 'UTC'
));

-- Status update function
CREATE OR REPLACE FUNCTION update_installment_statuses()
RETURNS TABLE(
  agency_id UUID,
  updated_count INT,
  transitions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_record RECORD;
  current_time_in_zone TIMESTAMPTZ;
  updated_count INT;
BEGIN
  FOR agency_record IN
    SELECT id, timezone, overdue_cutoff_time
    FROM agencies
  LOOP
    current_time_in_zone := (now() AT TIME ZONE agency_record.timezone);

    WITH updated AS (
      UPDATE installments i
      SET status = 'overdue'
      FROM payment_plans pp
      WHERE i.payment_plan_id = pp.id
        AND pp.agency_id = agency_record.id
        AND pp.status = 'active'
        AND i.status = 'pending'
        AND (
          i.student_due_date < CURRENT_DATE
          OR (
            i.student_due_date = CURRENT_DATE
            AND current_time_in_zone::TIME > agency_record.overdue_cutoff_time
          )
        )
      RETURNING i.id
    )
    SELECT count(*) INTO updated_count FROM updated;

    RETURN QUERY SELECT
      agency_record.id,
      updated_count,
      jsonb_build_object('pending_to_overdue', updated_count);
  END LOOP;
END;
$$;

COMMIT;
EOF
echo -e "${GREEN}✓ Created 06_jobs_infrastructure.sql${NC}"

# ===========================
# Migration 7: Notifications tables
# ===========================
cat > $CLEAN_DIR/07_notifications_tables.sql << 'EOF'
-- Migration 07: Notification Tables
-- Creates all notification-related tables

BEGIN;

-- Add email notification preferences to users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN DEFAULT false;

-- Add sales agent assignment to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Add notification tracking to installments
ALTER TABLE installments
  ADD COLUMN IF NOT EXISTS last_notified_date TIMESTAMPTZ;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('overdue_payment', 'due_soon', 'payment_received', 'system')),
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_agency_id ON notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC)
  WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_metadata ON notifications USING GIN (metadata);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create student_notifications table
CREATE TABLE IF NOT EXISTS student_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  installment_id UUID NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('due_soon', 'overdue')),
  sent_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  delivery_status TEXT NOT NULL CHECK (delivery_status IN ('sent', 'failed', 'pending')) DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(installment_id, notification_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_student_notifications_agency_id ON student_notifications(agency_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_student_id ON student_notifications(student_id);
CREATE INDEX IF NOT EXISTS idx_student_notifications_installment_id ON student_notifications(installment_id);

-- Enable RLS
ALTER TABLE student_notifications ENABLE ROW LEVEL SECURITY;

COMMIT;
EOF
echo -e "${GREEN}✓ Created 07_notifications_tables.sql${NC}"

# ===========================
# Migration 8: Activity Log & Reports
# ===========================
cat > $CLEAN_DIR/08_activity_log_reports.sql << 'EOF'
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
EOF
echo -e "${GREEN}✓ Created 08_activity_log_reports.sql${NC}"

# ===========================
# Migration 9: Fixes
# ===========================
cat > $CLEAN_DIR/09_fixes.sql << 'EOF'
-- Migration 09: Various fixes and updates
-- From migration 005_fixes and 007_student_payment_history

BEGIN;

-- Add any fixes here from the original migrations

SELECT 'Apply any fixes from migrations 007 and 008' as todo;

COMMIT;
EOF
echo -e "${GREEN}✓ Created 09_fixes.sql${NC}"

# ===========================
# Summary
# ===========================
echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Clean Migration Files Created${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}Files created in: $CLEAN_DIR${NC}"
ls -la $CLEAN_DIR/*.sql | awk '{print "  - " $NF}'
echo ""
echo -e "${YELLOW}IMPORTANT NEXT STEPS:${NC}"
echo "1. The files 03, 04, and 05 need actual table definitions"
echo "2. Copy content from the original migration files"
echo "3. Remove any DROP statements"
echo "4. Add IF NOT EXISTS to all CREATE statements"
echo "5. Remove problematic GRANT statements"
echo ""
echo -e "${YELLOW}To use these migrations:${NC}"
echo "1. Review and complete the placeholder files"
echo "2. Run them in order: 01, 02, 03, 04, 05, 06, 07, 08, 09"
echo "3. Each file should run without errors"