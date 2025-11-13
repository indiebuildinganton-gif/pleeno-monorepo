# Story 3-1: College Registry - Task 1
## Create Colleges Domain Database Schema

**Story**: As an Agency Admin, I want to create and manage a registry of colleges, their branch locations, and contact information, so that I can associate students and payment plans with specific institutions, track commissions by branch, monitor GST status, and maintain contact details for each college.

### Task 1 of 21: Create colleges domain database schema

This is the **first task** in implementing the College Registry feature. You will create the core database schema for colleges.

---

## Task Details

**Objective**: Create the colleges table with proper constraints, indexes, and Row-Level Security (RLS) policies.

### Subtasks
- [ ] Create supabase/migrations/002_entities_domain/001_colleges_schema.sql
- [ ] Create colleges table with fields:
  - id UUID PRIMARY KEY
  - agency_id UUID REFERENCES agencies(id)
  - name TEXT NOT NULL
  - city TEXT
  - default_commission_rate_percent DECIMAL(5,2) CHECK (0-100)
  - gst_status TEXT CHECK IN ('included', 'excluded') DEFAULT 'included'
  - created_at, updated_at TIMESTAMPTZ
- [ ] Create unique index on (agency_id, name) to prevent duplicate colleges
- [ ] Add RLS policies for agency_id filtering
- [ ] Create admin-only RLS policy for INSERT/UPDATE/DELETE operations

### Acceptance Criteria Addressed
- AC 1: Admin can view all colleges in their agency
- AC 2: Admin can create college with name, city, commission rate, GST status
- AC 3: Admin can edit existing college information
- AC 4: Admin can toggle GST status between "Included" and "Excluded"

---

## Context

### Key Constraints
- Multi-tenant isolation: All queries filtered by agency_id via Row-Level Security (RLS)
- Admin-only operations: Only agency_admin role can create/edit/delete colleges
- Commission rate validation: Must be between 0-100%
- GST status validation: Must be 'included' or 'excluded'
- College names must be unique within an agency

### Database Schema Reference

```sql
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  default_commission_rate_percent DECIMAL(5,2) CHECK (default_commission_rate_percent BETWEEN 0 AND 100),
  gst_status TEXT CHECK (gst_status IN ('included', 'excluded')) DEFAULT 'included',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)  -- Prevent duplicate college names within agency
);

CREATE INDEX idx_colleges_agency ON colleges(agency_id);
CREATE INDEX idx_colleges_name ON colleges(agency_id, name);
```

### RLS Policies

```sql
-- Colleges: View access for all users, modify access for admins only
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view colleges in their agency"
  ON colleges FOR SELECT
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can create colleges"
  ON colleges FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY "Admins can update colleges"
  ON colleges FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY "Admins can delete colleges"
  ON colleges FOR DELETE
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );
```

### Dependencies
- Requires existing agencies table (from Epic 2)
- Requires existing users table with role field (from Epic 1)
- Requires audit_logs infrastructure (from Epic 2)

### Related Documentation
- Architecture: docs/architecture.md - Entities Domain section
- PRD: docs/PRD.md - FR-3: College Management
- Epic breakdown: docs/epics.md - Epic 3: Core Entity Management

---

## Manifest Instructions (CRITICAL - First Task Only)

**Before you start coding**, create a manifest file to track your progress through all 21 tasks:

1. Create file: `.bmad-ephemeral/stories/prompts/3-1/manifest.md`

2. Use this template:

```markdown
# Story 3-1 Implementation Manifest

**Story**: College Registry
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Create colleges domain database schema
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes: Creating colleges table with RLS policies

### Task 2: Create branches schema
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Create college contacts schema
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Create college notes schema
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Create activity feed infrastructure
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Implement colleges API endpoints
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Implement college detail API endpoint
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Implement branches API endpoints
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Implement contacts API endpoints
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 10: Implement notes API endpoints
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 11: Implement activity API endpoint
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 12: Create college list page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 13: Create college detail page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 14: Create college form component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 15: Create branch form component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 16: Create contact form component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 17: Create activity feed component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 18: Create notes section component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 19: Create validation schemas
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 20: Add admin permission checks
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 21: Write tests for college management
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

3. **After completing this task**, update the manifest:
   - Change Task 1 status to "Completed"
   - Add completion date
   - Add any relevant notes about the implementation

---

## Implementation Steps

1. **Create manifest file** (see instructions above)

2. **Create migration directory**:
   ```bash
   mkdir -p supabase/migrations/002_entities_domain
   ```

3. **Create migration file**: `supabase/migrations/002_entities_domain/001_colleges_schema.sql`

4. **Implement the SQL schema** with:
   - Table definition with all fields
   - Check constraints for commission_rate and gst_status
   - Unique constraint on (agency_id, name)
   - Indexes for performance
   - RLS policies for security
   - Triggers for updated_at timestamp

5. **Test the migration**:
   - Run the migration locally
   - Verify table was created
   - Verify constraints work correctly
   - Test RLS policies

6. **Update manifest**: Mark Task 1 as completed with date

---

## Next Steps

After completing this task:

1. **Update the manifest** in `.bmad-ephemeral/stories/prompts/3-1/manifest.md`
   - Mark Task 1 as "Completed" with today's date
   - Add notes about any challenges or decisions made

2. **Move to Task 2**: Open `task-2-prompt.md` to create the branches schema

3. **Continue sequentially**: Each task builds on the previous ones

---

## Success Criteria

You will know Task 1 is complete when:
- ✅ Migration file exists at supabase/migrations/002_entities_domain/001_colleges_schema.sql
- ✅ Colleges table created with all required fields
- ✅ Constraints are in place (commission rate 0-100, GST status enum)
- ✅ Unique index prevents duplicate college names within agency
- ✅ RLS policies allow agency users to view, admins to modify
- ✅ Migration runs successfully without errors
- ✅ Manifest file created and Task 1 marked as completed

Good luck! This is the foundation for the entire College Registry feature.
