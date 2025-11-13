-- Migration 003: Create college_contacts table with audit logging
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 3
-- Foundation for managing college contact persons with audit trail

BEGIN;

-- ============================================================
-- STEP 1: Create College Contacts Table
-- ============================================================

CREATE TABLE college_contacts (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Contact information
  name TEXT NOT NULL,
  role_department TEXT,
  position_title TEXT,
  email TEXT,
  phone TEXT,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_college_contacts_agency ON college_contacts(agency_id);

-- Index on college_id for lookups
CREATE INDEX idx_college_contacts_college ON college_contacts(college_id);

-- Composite index for common query patterns
CREATE INDEX idx_college_contacts_agency_college ON college_contacts(agency_id, college_id);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_college_contacts_updated_at
  BEFORE UPDATE ON college_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Create Audit Logging Function and Trigger
-- ============================================================

-- Function to log all college contact changes to audit_logs
CREATE OR REPLACE FUNCTION log_college_contact_changes()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
BEGIN
  -- Determine action type
  IF (TG_OP = 'DELETE') THEN
    action_type := 'contact_deleted';

    -- Log the deletion
    INSERT INTO audit_logs (
      agency_id,
      user_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values
    )
    VALUES (
      OLD.agency_id,
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      'college_contact',
      OLD.id,
      action_type,
      jsonb_build_object(
        'id', OLD.id,
        'college_id', OLD.college_id,
        'name', OLD.name,
        'role_department', OLD.role_department,
        'position_title', OLD.position_title,
        'email', OLD.email,
        'phone', OLD.phone
      ),
      NULL
    );

    RETURN OLD;

  ELSIF (TG_OP = 'UPDATE') THEN
    action_type := 'contact_updated';

    -- Log the update with old and new values
    INSERT INTO audit_logs (
      agency_id,
      user_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values
    )
    VALUES (
      NEW.agency_id,
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      'college_contact',
      NEW.id,
      action_type,
      jsonb_build_object(
        'name', OLD.name,
        'role_department', OLD.role_department,
        'position_title', OLD.position_title,
        'email', OLD.email,
        'phone', OLD.phone
      ),
      jsonb_build_object(
        'name', NEW.name,
        'role_department', NEW.role_department,
        'position_title', NEW.position_title,
        'email', NEW.email,
        'phone', NEW.phone
      )
    );

    RETURN NEW;

  ELSIF (TG_OP = 'INSERT') THEN
    action_type := 'contact_created';

    -- Log the insertion
    INSERT INTO audit_logs (
      agency_id,
      user_id,
      entity_type,
      entity_id,
      action,
      old_values,
      new_values
    )
    VALUES (
      NEW.agency_id,
      NULLIF(current_setting('app.current_user_id', TRUE), '')::UUID,
      'college_contact',
      NEW.id,
      action_type,
      NULL,
      jsonb_build_object(
        'id', NEW.id,
        'college_id', NEW.college_id,
        'name', NEW.name,
        'role_department', NEW.role_department,
        'position_title', NEW.position_title,
        'email', NEW.email,
        'phone', NEW.phone
      )
    );

    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically log all contact changes
CREATE TRIGGER college_contacts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON college_contacts
  FOR EACH ROW
  EXECUTE FUNCTION log_college_contact_changes();

-- ============================================================
-- STEP 5: Enable RLS
-- ============================================================

ALTER TABLE college_contacts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users can view contacts in their agency
CREATE POLICY college_contacts_agency_isolation_select ON college_contacts
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin Only
-- Only agency admins can create contacts
CREATE POLICY college_contacts_admin_insert ON college_contacts
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- UPDATE Policy: Admin Only
-- Only agency admins can update contacts in their agency
CREATE POLICY college_contacts_admin_update ON college_contacts
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- DELETE Policy: Admin Only
-- Only agency admins can delete contacts in their agency
CREATE POLICY college_contacts_admin_delete ON college_contacts
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 7: Add Documentation
-- ============================================================

COMMENT ON TABLE college_contacts IS
  'Contact persons for colleges with multi-tenant isolation and complete audit trail. Cascade deletes when parent college is deleted.';

COMMENT ON COLUMN college_contacts.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN college_contacts.college_id IS
  'Foreign key to colleges table - the parent institution. Cascade deletes when college is deleted.';

COMMENT ON COLUMN college_contacts.name IS
  'Full name of the contact person';

COMMENT ON COLUMN college_contacts.role_department IS
  'Role or department of the contact (e.g., "Admissions", "International Office")';

COMMENT ON COLUMN college_contacts.position_title IS
  'Job title of the contact (e.g., "Director of International Admissions")';

COMMENT ON COLUMN college_contacts.email IS
  'Email address of the contact';

COMMENT ON COLUMN college_contacts.phone IS
  'Phone number of the contact';

COMMENT ON FUNCTION log_college_contact_changes() IS
  'Trigger function that automatically logs all college contact changes (create, update, delete) to the audit_logs table for compliance tracking';

COMMENT ON TRIGGER college_contacts_audit_trigger ON college_contacts IS
  'Automatically logs all contact changes to audit_logs table for complete audit trail';

COMMENT ON POLICY college_contacts_agency_isolation_select ON college_contacts IS
  'Agency isolation: Users can only SELECT college contacts belonging to their agency';

COMMENT ON POLICY college_contacts_admin_insert ON college_contacts IS
  'Admin only: Only agency_admin role can INSERT new college contacts';

COMMENT ON POLICY college_contacts_admin_update ON college_contacts IS
  'Admin only: Only agency_admin role can UPDATE college contacts in their agency';

COMMENT ON POLICY college_contacts_admin_delete ON college_contacts IS
  'Admin only: Only agency_admin role can DELETE college contacts in their agency';

COMMIT;
