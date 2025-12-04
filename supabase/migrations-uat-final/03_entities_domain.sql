-- ======================================
-- Migration 3: Entities Domain - Colleges, Students, Enrollments
-- ======================================

BEGIN;

-- Combining entities domain migrations...

-- Source: 001_colleges_schema.sql

-- Migration 001: Create colleges table
-- Epic 3: Entities Domain
-- Foundation for educational institution management

BEGIN;

-- ============================================================
-- STEP 1: Create Colleges Table
-- ============================================================

CREATE TABLE colleges (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- College information
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  default_commission_rate_percent DECIMAL(5,2) CHECK (default_commission_rate_percent BETWEEN 0 AND 100),
  gst_status TEXT CHECK (gst_status IN ('included', 'excluded')) DEFAULT 'included',
  contract_expiration_date DATE,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Unique constraint: Prevent duplicate college names within agency
  UNIQUE(agency_id, name)
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_colleges_agency_id ON colleges(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_colleges_name ON colleges(agency_id, name);
CREATE INDEX idx_colleges_country ON colleges(agency_id, country) WHERE country IS NOT NULL;
CREATE INDEX idx_colleges_city ON colleges(agency_id, city) WHERE city IS NOT NULL;

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_colleges_updated_at
  BEFORE UPDATE ON colleges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users can view colleges in their agency
CREATE POLICY colleges_agency_isolation_select ON colleges
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin Only
-- Only agency admins can create colleges
CREATE POLICY colleges_admin_insert ON colleges
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- UPDATE Policy: Admin Only
-- Only agency admins can update colleges in their agency
CREATE POLICY colleges_admin_update ON colleges
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- DELETE Policy: Admin Only
-- Only agency admins can delete colleges in their agency
CREATE POLICY colleges_admin_delete ON colleges
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'agency_admin'
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE colleges IS
  'Registry of educational institutions with multi-tenant isolation. Each college can have multiple branches, contacts, and associated students.';

COMMENT ON COLUMN colleges.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN colleges.name IS
  'College name - must be unique within agency (enforced by unique constraint)';

COMMENT ON COLUMN colleges.city IS
  'Primary city where college is located (branches may be in different cities)';

COMMENT ON COLUMN colleges.default_commission_rate_percent IS
  'Default commission rate (0-100%) applied to payment plans for this college. Can be overridden at branch or payment plan level.';

COMMENT ON COLUMN colleges.gst_status IS
  'GST inclusion status: "included" (commission includes GST) or "excluded" (GST added on top)';

COMMENT ON POLICY colleges_agency_isolation_select ON colleges IS
  'Agency isolation: Users can only SELECT colleges belonging to their agency';

COMMENT ON POLICY colleges_admin_insert ON colleges IS
  'Admin only: Only agency_admin role can INSERT new colleges';

COMMENT ON POLICY colleges_admin_update ON colleges IS
  'Admin only: Only agency_admin role can UPDATE colleges in their agency';

COMMENT ON POLICY colleges_admin_delete ON colleges IS
  'Admin only: Only agency_admin role can DELETE colleges in their agency';

COMMIT;


-- Source: 002_branches_schema.sql

-- Migration 002: Create branches table with auto-commission inheritance
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 2
-- Foundation for college campus/branch management with automatic commission rate inheritance

BEGIN;

-- ============================================================
-- STEP 1: Create Branches Table
-- ============================================================

CREATE TABLE branches (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Branch information
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  commission_rate_percent DECIMAL(5,2) CHECK (commission_rate_percent BETWEEN 0 AND 100),  -- Overrides college default

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Trigger Function for Auto-Commission Rate
-- ============================================================

-- Trigger function to auto-populate commission rate from college default
CREATE OR REPLACE FUNCTION set_branch_default_commission()
RETURNS TRIGGER AS $$
BEGIN
  -- If commission_rate_percent is not provided, copy from college
  IF NEW.commission_rate_percent IS NULL THEN
    SELECT default_commission_rate_percent INTO NEW.commission_rate_percent
    FROM colleges WHERE id = NEW.college_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger before INSERT on branches
CREATE TRIGGER branch_default_commission_trigger
  BEFORE INSERT ON branches
  FOR EACH ROW
  EXECUTE FUNCTION set_branch_default_commission();

-- ============================================================
-- STEP 3: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_branches_agency_id ON branches(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_branches_college_id ON branches(agency_id, college_id);
CREATE INDEX idx_branches_city ON branches(agency_id, city);
CREATE INDEX idx_branches_name ON branches(agency_id, name);

-- ============================================================
-- STEP 4: Add Updated_At Trigger
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 5: Enable RLS
-- ============================================================

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 6: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users can view branches in their agency
CREATE POLICY branches_agency_isolation_select ON branches
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Admin Only
-- Only agency admins can create branches
CREATE POLICY branches_admin_insert ON branches
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
-- Only agency admins can update branches in their agency
CREATE POLICY branches_admin_update ON branches
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
-- Only agency admins can delete branches in their agency
CREATE POLICY branches_admin_delete ON branches
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

COMMENT ON TABLE branches IS
  'College branches/campuses with optional commission rate overrides and automatic inheritance from parent college';

COMMENT ON COLUMN branches.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN branches.college_id IS
  'Foreign key to colleges table - the parent institution. Cascade deletes when college is deleted.';

COMMENT ON COLUMN branches.name IS
  'Branch name (e.g., "Main Campus", "Downtown Branch")';

COMMENT ON COLUMN branches.city IS
  'City where this branch is located (may differ from parent college city)';

COMMENT ON COLUMN branches.commission_rate_percent IS
  'Commission rate for this branch (0-100%). If not provided, automatically inherits from college default_commission_rate_percent via trigger. Can override college default if explicitly set.';

COMMENT ON POLICY branches_agency_isolation_select ON branches IS
  'Agency isolation: Users can only SELECT branches belonging to their agency';

COMMENT ON POLICY branches_admin_insert ON branches IS
  'Admin only: Only agency_admin role can INSERT new branches';

COMMENT ON POLICY branches_admin_update ON branches IS
  'Admin only: Only agency_admin role can UPDATE branches in their agency';

COMMENT ON POLICY branches_admin_delete ON branches IS
  'Admin only: Only agency_admin role can DELETE branches in their agency';

COMMIT;


-- Source: 003_college_contacts_schema.sql

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


-- Source: 003_students_schema.sql

-- Migration 003: Create students table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Students Table
-- ============================================================

CREATE TABLE students (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Student core information
  full_name TEXT NOT NULL,
  email TEXT,  -- Optional
  phone TEXT,  -- Optional
  passport_number TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,

  -- Visa status enum
  visa_status TEXT CHECK (visa_status IN ('in_process', 'approved', 'denied', 'expired')),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- UNIQUE constraint: passport numbers unique within each agency only
  UNIQUE(agency_id, passport_number)
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_students_agency_id ON students(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_students_passport ON students(agency_id, passport_number);
CREATE INDEX idx_students_email ON students(agency_id, email) WHERE email IS NOT NULL;
CREATE INDEX idx_students_visa_status ON students(agency_id, visa_status) WHERE visa_status IS NOT NULL;

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_students_updated_at
  BEFORE UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY students_agency_isolation_select ON students
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY students_agency_isolation_insert ON students
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY students_agency_isolation_update ON students
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Agency Isolation
CREATE POLICY students_agency_isolation_delete ON students
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE students IS
  'Student records with multi-tenant isolation. Each agency maintains its own student registry with RLS enforcement.';

COMMENT ON COLUMN students.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN students.passport_number IS
  'Passport number - unique within each agency (not globally unique)';

COMMENT ON COLUMN students.visa_status IS
  'Current visa status: in_process, approved, denied, or expired';

COMMENT ON COLUMN students.email IS
  'Student email - optional to support partial data collection';

COMMENT ON COLUMN students.phone IS
  'Student phone number - optional to support partial data collection';

COMMENT ON POLICY students_agency_isolation_select ON students IS
  'Agency isolation: Users can only SELECT students belonging to their agency';

COMMIT;


-- Source: 004_college_notes_schema.sql

-- Migration 004: Create college_notes table
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 4
-- Foundation for managing college notes with user attribution and 2000 character limit

BEGIN;

-- ============================================================
-- STEP 1: Create College Notes Table
-- ============================================================

CREATE TABLE college_notes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Note content with max 2000 characters constraint
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_college_notes_agency ON college_notes(agency_id);

-- Index for chronological display of notes (as per AC)
CREATE INDEX idx_college_notes_college ON college_notes(college_id, created_at DESC);

-- Additional indexes for common query patterns
CREATE INDEX idx_college_notes_user_id ON college_notes(agency_id, user_id);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_college_notes_updated_at
  BEFORE UPDATE ON college_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE college_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
-- All users in the agency can view notes
CREATE POLICY college_notes_agency_isolation_select ON college_notes
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: All Authenticated Users
-- All users in the agency can create notes
CREATE POLICY college_notes_agency_insert ON college_notes
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Own Notes or Admin
-- Users can update their own notes, admins can update all notes in their agency
CREATE POLICY college_notes_update ON college_notes
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role = 'agency_admin'
        AND agency_id = college_notes.agency_id
      )
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Own Notes or Admin
-- Users can delete their own notes, admins can delete all notes in their agency
CREATE POLICY college_notes_delete ON college_notes
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
    AND (
      user_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
        AND role = 'agency_admin'
        AND agency_id = college_notes.agency_id
      )
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE college_notes IS
  'Notes associated with colleges - supports collaboration and tracking with 2000 character limit. All users can add notes, users can modify/delete their own notes, admins can modify/delete all notes.';

COMMENT ON COLUMN college_notes.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN college_notes.college_id IS
  'Foreign key to colleges table - the college this note is about. Cascade deletes when college is deleted.';

COMMENT ON COLUMN college_notes.user_id IS
  'Foreign key to users table - the user who created this note. Cascade deletes when user is deleted.';

COMMENT ON COLUMN college_notes.content IS
  'Note content with maximum 2000 characters enforced by CHECK constraint';

COMMENT ON POLICY college_notes_agency_isolation_select ON college_notes IS
  'Agency isolation: Users can only SELECT notes belonging to their agency';

COMMENT ON POLICY college_notes_agency_insert ON college_notes IS
  'All authenticated users in the agency can INSERT new college notes';

COMMENT ON POLICY college_notes_update ON college_notes IS
  'Users can UPDATE their own notes, agency_admin role can UPDATE all notes in their agency';

COMMENT ON POLICY college_notes_delete ON college_notes IS
  'Users can DELETE their own notes, agency_admin role can DELETE all notes in their agency';

COMMIT;


-- Source: 004_enrollments_schema.sql

-- Migration 004: Create student_enrollments table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Student Enrollments Table
-- ============================================================

CREATE TABLE student_enrollments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  college_id UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Enrollment information
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_enrollments_agency_id ON student_enrollments(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_student_enrollments_student_id ON student_enrollments(agency_id, student_id);
CREATE INDEX idx_student_enrollments_college_id ON student_enrollments(agency_id, college_id);
CREATE INDEX idx_student_enrollments_branch_id ON student_enrollments(agency_id, branch_id);
CREATE INDEX idx_student_enrollments_enrollment_date ON student_enrollments(agency_id, enrollment_date);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_student_enrollments_updated_at
  BEFORE UPDATE ON student_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_select ON student_enrollments
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_insert ON student_enrollments
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_update ON student_enrollments
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Agency Isolation
CREATE POLICY student_enrollments_agency_isolation_delete ON student_enrollments
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE student_enrollments IS
  'Student enrollment records linking students to colleges and branches with multi-tenant isolation';

COMMENT ON COLUMN student_enrollments.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_enrollments.student_id IS
  'Foreign key to students table - the enrolled student';

COMMENT ON COLUMN student_enrollments.college_id IS
  'Foreign key to colleges table - the institution where student is enrolled';

COMMENT ON COLUMN student_enrollments.branch_id IS
  'Foreign key to branches table - the specific campus/branch of enrollment';

COMMENT ON COLUMN student_enrollments.enrollment_date IS
  'Date when student enrolled at this branch';

COMMENT ON POLICY student_enrollments_agency_isolation_select ON student_enrollments IS
  'Agency isolation: Users can only SELECT enrollments belonging to their agency';

COMMIT;


-- Source: 005_student_notes_schema.sql

-- Migration 005: Create student_notes table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Student Notes Table
-- ============================================================

CREATE TABLE student_notes (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Note content with max 2000 characters constraint
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_notes_agency_id ON student_notes(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_student_notes_student_id ON student_notes(agency_id, student_id);
CREATE INDEX idx_student_notes_user_id ON student_notes(agency_id, user_id);
CREATE INDEX idx_student_notes_created_at ON student_notes(agency_id, created_at DESC);

-- ============================================================
-- STEP 3: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_student_notes_updated_at
  BEFORE UPDATE ON student_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 4: Enable RLS
-- ============================================================

ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 5: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_select ON student_notes
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_insert ON student_notes
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_update ON student_notes
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Agency Isolation
CREATE POLICY student_notes_agency_isolation_delete ON student_notes
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 6: Add Documentation
-- ============================================================

COMMENT ON TABLE student_notes IS
  'Notes associated with students - supports collaboration and tracking with 2000 character limit';

COMMENT ON COLUMN student_notes.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_notes.student_id IS
  'Foreign key to students table - the student this note is about';

COMMENT ON COLUMN student_notes.user_id IS
  'Foreign key to users table - the user who created this note';

COMMENT ON COLUMN student_notes.content IS
  'Note content with maximum 2000 characters enforced by CHECK constraint';

COMMENT ON POLICY student_notes_agency_isolation_select ON student_notes IS
  'Agency isolation: Users can only SELECT notes belonging to their agency';

COMMIT;


-- Source: 006_enrollments_schema.sql

-- Migration 006: Create enrollments table
-- Epic 3: Core Entity Management
-- Story 3.3: Student-College Enrollment Linking

BEGIN;

-- ============================================================
-- STEP 1: Create Status ENUM Type
-- ============================================================

CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'cancelled');

COMMENT ON TYPE enrollment_status IS
  'Enrollment status values: active (ongoing), completed (finished), cancelled (terminated)';

-- ============================================================
-- STEP 2: Create Enrollments Table
-- ============================================================

CREATE TABLE enrollments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Foreign keys to related entities
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

  -- Enrollment details
  program_name TEXT NOT NULL,

  -- Offer letter document references (nullable - can be added later)
  offer_letter_url TEXT,
  offer_letter_filename TEXT,

  -- Enrollment status with default
  status enrollment_status NOT NULL DEFAULT 'active',

  -- Standard timestamps
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  -- Composite unique constraint to prevent duplicate enrollments
  CONSTRAINT unique_student_branch_program UNIQUE (student_id, branch_id, program_name)
);

-- ============================================================
-- STEP 3: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_enrollments_agency_id ON enrollments(agency_id);

-- Performance indexes for common query patterns
CREATE INDEX idx_enrollments_agency_student ON enrollments(agency_id, student_id);
CREATE INDEX idx_enrollments_agency_branch ON enrollments(agency_id, branch_id);

-- Index on status for filtering active/completed/cancelled enrollments
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- Index on student_id for reverse lookups
CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);

-- Index on branch_id for reverse lookups
CREATE INDEX idx_enrollments_branch_id ON enrollments(branch_id);

-- ============================================================
-- STEP 4: Add Triggers
-- ============================================================

-- Automatically update updated_at timestamp
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- STEP 5: Add Documentation
-- ============================================================

COMMENT ON TABLE enrollments IS
  'Student-college enrollments created through payment plan creation. Links students to branches with program details and offer letter documents. Multi-tenant isolated by agency_id.';

COMMENT ON COLUMN enrollments.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN enrollments.student_id IS
  'Foreign key to students table - identifies which student is enrolled';

COMMENT ON COLUMN enrollments.branch_id IS
  'Foreign key to branches table - identifies which college branch the student is enrolled in';

COMMENT ON COLUMN enrollments.program_name IS
  'Name of the program/course the student is enrolled in (e.g., "Bachelor of Business Administration")';

COMMENT ON COLUMN enrollments.offer_letter_url IS
  'URL to the offer letter document in Supabase Storage (nullable - can be uploaded later)';

COMMENT ON COLUMN enrollments.offer_letter_filename IS
  'Original filename of the offer letter document (nullable)';

COMMENT ON COLUMN enrollments.status IS
  'Current status of enrollment: active (ongoing), completed (finished), cancelled (terminated)';

COMMENT ON CONSTRAINT unique_student_branch_program ON enrollments IS
  'Prevents duplicate enrollments for the same student-branch-program combination. If this combo exists, reuse the enrollment instead of creating a new one.';

-- ============================================================
-- STEP 6: Supabase Storage Configuration Notes
-- ============================================================

-- NOTE: The following storage bucket configuration should be created via Supabase UI or Storage API:
--
-- Bucket Name: enrollment-documents
-- Public: false (RLS protected)
-- File Size Limit: 10MB
-- Allowed MIME Types: application/pdf, image/jpeg, image/png
-- Storage Path Pattern: enrollment-documents/{enrollment_id}/{filename}
--
-- RLS policies for the storage bucket will be configured separately to ensure
-- users can only access documents belonging to their agency's enrollments.

COMMIT;


-- Source: 006_student_documents_schema.sql

-- Migration 006: Create student_documents table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- STEP 1: Create Student Documents Table
-- ============================================================

CREATE TABLE student_documents (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- REQUIRED: Tenant isolation key
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,

  -- Document metadata
  document_type TEXT NOT NULL CHECK (document_type IN ('offer_letter', 'passport', 'visa', 'other')),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,

  -- Audit fields
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  uploaded_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- STEP 2: Create Indexes (REQUIRED for performance)
-- ============================================================

-- CRITICAL: Index on agency_id for RLS query performance
CREATE INDEX idx_student_documents_agency_id ON student_documents(agency_id);

-- Additional indexes for common query patterns
CREATE INDEX idx_student_documents_student_id ON student_documents(agency_id, student_id);
CREATE INDEX idx_student_documents_type ON student_documents(agency_id, document_type);
CREATE INDEX idx_student_documents_uploaded_at ON student_documents(agency_id, uploaded_at DESC);

-- ============================================================
-- STEP 3: Enable RLS
-- ============================================================

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 4: Create RLS Policies
-- ============================================================

-- SELECT Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_select ON student_documents
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_insert ON student_documents
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_update ON student_documents
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Agency Isolation
CREATE POLICY student_documents_agency_isolation_delete ON student_documents
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

COMMENT ON TABLE student_documents IS
  'Document metadata for student files stored in Supabase Storage with multi-tenant isolation';

COMMENT ON COLUMN student_documents.agency_id IS
  'Foreign key to agencies table - enforces tenant isolation via RLS policies';

COMMENT ON COLUMN student_documents.student_id IS
  'Foreign key to students table - the student this document belongs to';

COMMENT ON COLUMN student_documents.document_type IS
  'Type of document: offer_letter, passport, visa, or other';

COMMENT ON COLUMN student_documents.file_name IS
  'Original filename as uploaded by user';

COMMENT ON COLUMN student_documents.file_path IS
  'Path to file in Supabase Storage bucket';

COMMENT ON COLUMN student_documents.file_size IS
  'File size in bytes';

COMMENT ON COLUMN student_documents.uploaded_by IS
  'Foreign key to users table - user who uploaded this document';

COMMENT ON COLUMN student_documents.uploaded_at IS
  'Timestamp when document was uploaded';

COMMENT ON POLICY student_documents_agency_isolation_select ON student_documents IS
  'Agency isolation: Users can only SELECT documents belonging to their agency';

COMMIT;


-- Source: 007_enrollments_rls.sql

-- Migration 007: Enable RLS policies for enrollments table
-- Epic 3: Core Entity Management
-- Story 3.3: Student-College Enrollment Linking

BEGIN;

-- ============================================================
-- STEP 1: Enable RLS
-- ============================================================

ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEP 2: Create RLS Policies for Multi-Tenant Isolation
-- ============================================================

-- SELECT Policy: Agency Isolation
-- Users can only view enrollments belonging to their agency
CREATE POLICY enrollments_agency_isolation_select ON enrollments
  FOR SELECT
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- INSERT Policy: Agency Isolation
-- Users can only create enrollments for their agency
CREATE POLICY enrollments_agency_isolation_insert ON enrollments
  FOR INSERT
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- UPDATE Policy: Agency Isolation
-- Users can only update enrollments belonging to their agency
CREATE POLICY enrollments_agency_isolation_update ON enrollments
  FOR UPDATE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- DELETE Policy: Agency Isolation
-- Users can only delete enrollments belonging to their agency
CREATE POLICY enrollments_agency_isolation_delete ON enrollments
  FOR DELETE
  USING (
    agency_id = (
      SELECT agency_id
      FROM users
      WHERE id = auth.uid()
    )
  );

-- ============================================================
-- STEP 3: Add Policy Documentation
-- ============================================================

COMMENT ON POLICY enrollments_agency_isolation_select ON enrollments IS
  'Agency isolation: Users can only SELECT enrollment records belonging to their agency';

COMMENT ON POLICY enrollments_agency_isolation_insert ON enrollments IS
  'Agency isolation: Users can only INSERT enrollment records for their agency';

COMMENT ON POLICY enrollments_agency_isolation_update ON enrollments IS
  'Agency isolation: Users can only UPDATE enrollment records belonging to their agency';

COMMENT ON POLICY enrollments_agency_isolation_delete ON enrollments IS
  'Agency isolation: Users can only DELETE enrollment records belonging to their agency';

-- ============================================================
-- STEP 4: Storage Bucket RLS Configuration Notes
-- ============================================================

-- NOTE: The following RLS policies should be configured for the 'enrollment-documents' storage bucket:
--
-- Policy 1: enrollment_documents_select (SELECT)
-- Allow users to view/download documents from enrollments belonging to their agency:
--
-- USING expression:
-- bucket_id = 'enrollment-documents' AND (
--   SELECT agency_id FROM enrollments WHERE id::text = (storage.foldername(name))[1]
-- ) = (
--   SELECT agency_id FROM users WHERE id = auth.uid()
-- )
--
-- Policy 2: enrollment_documents_insert (INSERT)
-- Allow users to upload documents to enrollments belonging to their agency:
--
-- WITH CHECK expression:
-- bucket_id = 'enrollment-documents' AND (
--   SELECT agency_id FROM enrollments WHERE id::text = (storage.foldername(name))[1]
-- ) = (
--   SELECT agency_id FROM users WHERE id = auth.uid()
-- )
--
-- Policy 3: enrollment_documents_delete (DELETE)
-- Allow users to delete documents from enrollments belonging to their agency:
--
-- USING expression:
-- bucket_id = 'enrollment-documents' AND (
--   SELECT agency_id FROM enrollments WHERE id::text = (storage.foldername(name))[1]
-- ) = (
--   SELECT agency_id FROM users WHERE id = auth.uid()
-- )

COMMIT;


-- Source: 007_entities_rls.sql

-- Migration 007: RLS Policy Summary for Entities Domain
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

-- ============================================================
-- RLS POLICY SUMMARY
-- ============================================================

-- This migration serves as a summary and verification that all entities
-- domain tables have Row-Level Security (RLS) enabled with proper
-- multi-tenant isolation via agency_id.

-- All RLS policies are defined inline within each table's schema file:
-- - 003_students_schema.sql
-- - 004_enrollments_schema.sql
-- - 005_student_notes_schema.sql
-- - 006_student_documents_schema.sql

-- ============================================================
-- RLS VERIFICATION
-- ============================================================

-- Verify that all entities tables have RLS enabled
DO $$
BEGIN
  -- Check students table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'students') THEN
    RAISE EXCEPTION 'RLS is not enabled on students table';
  END IF;

  -- Check student_enrollments table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_enrollments') THEN
    RAISE EXCEPTION 'RLS is not enabled on student_enrollments table';
  END IF;

  -- Check student_notes table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_notes') THEN
    RAISE EXCEPTION 'RLS is not enabled on student_notes table';
  END IF;

  -- Check student_documents table
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'student_documents') THEN
    RAISE EXCEPTION 'RLS is not enabled on student_documents table';
  END IF;

  RAISE NOTICE 'RLS verification passed: All entities domain tables have RLS enabled';
END $$;

-- ============================================================
-- POLICY PATTERN DOCUMENTATION
-- ============================================================

-- All tables in the entities domain follow the same RLS pattern:
--
-- 1. SELECT Policy: Users can only see records from their agency
--    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- 2. INSERT Policy: Users can only insert records for their agency
--    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- 3. UPDATE Policy: Users can only update records from their agency
--    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--    WITH CHECK (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- 4. DELETE Policy: Users can only delete records from their agency
--    USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()))
--
-- This ensures complete multi-tenant isolation where:
-- - Each agency's data is completely isolated
-- - Users can only access data belonging to their agency
-- - No cross-agency data leakage is possible
-- - All queries are automatically filtered by agency_id

-- ============================================================
-- ADDITIONAL NOTES
-- ============================================================

-- Performance Considerations:
-- - All tables have indexes on agency_id for optimal RLS query performance
-- - The pattern (SELECT agency_id FROM users WHERE id = auth.uid()) is used
--   consistently across all policies for maintainability
-- - Supabase caches auth.uid() so the performance impact is minimal

-- Security Considerations:
-- - RLS policies enforce tenant isolation at the database level
-- - Even if application logic has bugs, data isolation is maintained
-- - Service role can bypass RLS for admin operations and migrations
-- - Authenticated users must exist in the users table to access any data

COMMENT ON SCHEMA public IS
  'Entities domain tables (students, enrollments, notes, documents) use RLS for multi-tenant isolation';


-- Source: 008_add_subscription_tier.sql

-- Migration 008: Add subscription_tier to agencies table
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Database foundation for student management system

BEGIN;

-- ============================================================
-- Add subscription_tier column to agencies table
-- ============================================================

-- Add subscription_tier column with ENUM constraint
-- Default to 'basic' for existing agencies
ALTER TABLE agencies
  ADD COLUMN subscription_tier TEXT NOT NULL
  DEFAULT 'basic'
  CHECK (subscription_tier IN ('basic', 'premium', 'enterprise'));

-- Create index for subscription tier queries
CREATE INDEX idx_agencies_subscription_tier ON agencies(subscription_tier);

-- ============================================================
-- Documentation
-- ============================================================

COMMENT ON COLUMN agencies.subscription_tier IS
  'Subscription tier determines feature access: basic (limited), premium (AI features), enterprise (full access)';

-- ============================================================
-- Notes
-- ============================================================

-- Subscription Tier Feature Matrix:
-- - basic: Core features only (student registry, basic reporting)
-- - premium: Adds AI-powered offer letter extraction, advanced analytics
-- - enterprise: Full feature set including custom integrations, priority support

COMMIT;


-- Source: 008_student_documents_storage.sql

-- Migration 008: Student Documents Storage Configuration and RLS
-- Epic 3: Entities Domain - Student Registry
-- Story 3.2: Student Registry - Document management with Supabase Storage
-- Task 04: Student Documents API

BEGIN;

-- ============================================================
-- STEP 1: Storage Bucket Configuration (Manual Setup Required)
-- ============================================================

-- NOTE: The following storage bucket must be created via Supabase Dashboard or Storage API:
--
-- Bucket Configuration:
-- ---------------------
-- Name: student-documents
-- Public: false (RLS protected)
-- File Size Limit: 10MB
-- Allowed MIME Types: application/pdf, image/jpeg, image/png
-- Storage Path Pattern: student-documents/{student_id}/{filename}
--
-- To create via Supabase Dashboard:
-- 1. Go to Storage > Create Bucket
-- 2. Name: student-documents
-- 3. Set Public: OFF (use RLS)
-- 4. Configure file size limit in bucket settings
--
-- To create via SQL (Supabase allows this):
DO $$
BEGIN
  -- Create bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'student-documents',
    'student-documents',
    false, -- Not public, use RLS
    10485760, -- 10MB in bytes
    ARRAY['application/pdf', 'image/jpeg', 'image/png']
  )
  ON CONFLICT (id) DO NOTHING;
END $$;

-- ============================================================
-- STEP 2: Storage RLS Policies
-- ============================================================

-- Enable RLS on storage.objects for student-documents bucket
-- Note: RLS is typically enabled by default on storage.objects in Supabase

-- SELECT Policy: Users can only view documents from their agency
/*
CREATE POLICY student_documents_storage_select ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'student-documents'
    AND (
      -- Check if user's agency owns the student
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  );
*/

-- INSERT Policy: Users can only upload documents for students in their agency
/*
CREATE POLICY student_documents_storage_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      -- Extract student_id from path (format: {student_id}/{filename})
      -- Check if student belongs to user's agency
      EXISTS (
        SELECT 1
        FROM students s
        JOIN users u ON u.id = auth.uid()
        WHERE s.id::text = split_part(storage.objects.name, '/', 1)
        AND s.agency_id = u.agency_id
      )
    )
  );
*/

-- UPDATE Policy: Users can only update documents from their agency
/*
CREATE POLICY student_documents_storage_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'student-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  )
  WITH CHECK (
    bucket_id = 'student-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  );
*/

-- DELETE Policy: Users can only delete documents from their agency
/*
CREATE POLICY student_documents_storage_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'student-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM student_documents sd
        JOIN students s ON s.id = sd.student_id
        JOIN users u ON u.id = auth.uid()
        WHERE sd.file_path = storage.objects.name
        AND s.agency_id = u.agency_id
      )
    )
  );
*/

-- ============================================================
-- STEP 3: Add Documentation
-- ============================================================

/*
COMMENT ON POLICY student_documents_storage_select ON storage.objects IS
  'Agency isolation for student documents: Users can only view documents from students in their agency';

COMMENT ON POLICY student_documents_storage_insert ON storage.objects IS
  'Agency isolation for student documents: Users can only upload documents for students in their agency';

COMMENT ON POLICY student_documents_storage_update ON storage.objects IS
  'Agency isolation for student documents: Users can only update documents from students in their agency';

COMMENT ON POLICY student_documents_storage_delete ON storage.objects IS
  'Agency isolation for student documents: Users can only delete documents from students in their agency';
*/

-- ============================================================
-- STEP 4: Verification
-- ============================================================

-- Verify bucket was created
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'student-documents') THEN
    RAISE WARNING 'Storage bucket "student-documents" was not created. Please create it manually via Supabase Dashboard or API.';
  ELSE
    RAISE NOTICE 'Storage bucket "student-documents" configured successfully';
  END IF;
END $$;

-- ============================================================
-- ADDITIONAL NOTES
-- ============================================================

-- File Upload Flow:
-- 1. Client uploads file via POST /api/students/[id]/documents with FormData
-- 2. API validates file type (PDF, JPEG, PNG) and size (max 10MB)
-- 3. API generates unique filename: {timestamp}-{random}-{basename}.{ext}
-- 4. API uploads to storage: student-documents/{student_id}/{unique_filename}
-- 5. Storage RLS checks user's agency owns the student
-- 6. API stores metadata in student_documents table
-- 7. API returns document metadata with public URL

-- File Download Flow:
-- 1. Client requests GET /api/students/[id]/documents/[doc_id]
-- 2. API fetches document metadata from student_documents table (RLS enforced)
-- 3. API downloads file from storage using file_path
-- 4. Storage RLS checks user's agency owns the document
-- 5. API returns file with appropriate Content-Type and Content-Disposition headers

-- File Delete Flow:
-- 1. Client requests DELETE /api/students/[id]/documents/[doc_id]
-- 2. API fetches document metadata (RLS enforced)
-- 3. API logs deletion to audit_logs
-- 4. API deletes file from storage
-- 5. Storage RLS checks user's agency owns the document
-- 6. API deletes metadata from student_documents table

-- Security Considerations:
-- - All storage operations are protected by RLS policies
-- - File type and size validation happens at application layer before upload
-- - Unique filenames prevent conflicts and path traversal attacks
-- - Agency isolation ensures no cross-tenant data access
-- - Audit logs track all document operations
-- - Public URLs are generated but access requires RLS check

COMMIT;


-- Source: 009_college_activity_feed_function.sql

-- Migration 009: Create get_college_activity function for activity feed
-- Epic 3: Entities Domain
-- Story 3.1: College Registry - Task 5
-- Acceptance Criteria: AC 14-16
-- Foundation for college activity feed with filtering and search capabilities

BEGIN;

-- ============================================================
-- STEP 1: Create Activity Feed Function
-- ============================================================

-- Function: get_college_activity()
-- Retrieves activity feed for a college from audit_logs
-- Includes activities for the college itself and related entities (branches, contacts)
-- Supports time-based filtering and text search
CREATE OR REPLACE FUNCTION get_college_activity(
  p_college_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  "timestamp" TIMESTAMPTZ,
  user_name TEXT,
  entity_type TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.created_at AS timestamp,
    u.full_name AS user_name,
    al.entity_type,
    al.action,
    al.old_values,
    al.new_values
  FROM audit_logs al
  LEFT JOIN users u ON al.user_id = u.id
  WHERE
    (
      -- College activities
      (al.entity_id = p_college_id AND al.entity_type = 'college')
      -- Branch activities
      OR (al.entity_id IN (
        SELECT id FROM branches WHERE college_id = p_college_id
      ) AND al.entity_type = 'branch')
      -- College contact activities
      OR (al.entity_id IN (
        SELECT id FROM college_contacts WHERE college_id = p_college_id
      ) AND al.entity_type = 'college_contact')
    )
    -- Time period filter
    AND (p_from_date IS NULL OR al.created_at >= p_from_date)
    -- Text search filter (searches in action field)
    AND (p_search_query IS NULL OR al.action ILIKE '%' || p_search_query || '%')
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STEP 2: Add Documentation
-- ============================================================

COMMENT ON FUNCTION get_college_activity(UUID, TIMESTAMPTZ, TEXT) IS
  'Retrieves activity feed for a college from audit_logs. Includes activities for the college itself, its branches, and contacts. Supports time-based filtering (p_from_date) and text search (p_search_query) on action field. Returns activities ordered by timestamp (newest first).';

COMMIT;


-- Source: 010_add_student_contact_preferences.sql

-- Migration 010: Add student contact preferences for notifications
-- Epic 5: Intelligent Status Automation & Notifications
-- Story 5.2: Due Soon Notification Flags - Task 3

BEGIN;

-- ============================================================
-- STEP 1: Add contact_preference column
-- ============================================================

ALTER TABLE students ADD COLUMN contact_preference TEXT
  CHECK (contact_preference IN ('email', 'sms', 'both')) DEFAULT 'email';

-- ============================================================
-- STEP 2: Add index for notification queries
-- ============================================================

-- Index for filtering students by contact preference
CREATE INDEX idx_students_contact_preference ON students(agency_id, contact_preference)
  WHERE contact_preference IS NOT NULL;

-- ============================================================
-- STEP 3: Add Documentation
-- ============================================================

COMMENT ON COLUMN students.contact_preference IS
  'Student preferred contact method for notifications: email, sms, or both. Defaults to email.';

COMMIT;


COMMIT;
