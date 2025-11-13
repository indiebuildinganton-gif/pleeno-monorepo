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
