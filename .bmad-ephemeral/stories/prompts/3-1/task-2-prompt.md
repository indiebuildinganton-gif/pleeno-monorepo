# Story 3-1: College Registry - Task 2
## Create Branches Schema

**Story**: As an Agency Admin, I want to create and manage a registry of colleges, their branch locations, and contact information, so that I can associate students and payment plans with specific institutions, track commissions by branch, monitor GST status, and maintain contact details for each college.

### Task 2 of 21: Create branches schema

**Previous Task**: Task 1 (Create colleges domain database schema) - ✅ Should be completed

---

## Task Details

**Objective**: Create the branches table with automatic commission rate inheritance from colleges.

### Subtasks
- [ ] Create supabase/migrations/002_entities_domain/002_branches_schema.sql
- [ ] Create branches table with fields:
  - id UUID PRIMARY KEY
  - college_id UUID REFERENCES colleges(id) ON DELETE CASCADE
  - agency_id UUID REFERENCES agencies(id)
  - name TEXT NOT NULL
  - city TEXT NOT NULL
  - commission_rate_percent DECIMAL(5,2) (overrides college default if set)
  - created_at, updated_at TIMESTAMPTZ
- [ ] Add RLS policies for agency_id filtering
- [ ] Add index on college_id for join performance
- [ ] Create trigger to auto-populate commission_rate from college default on INSERT

### Acceptance Criteria Addressed
- AC 5: Admin can add branches with name and city
- AC 6: Default commission rate auto-filled for new branches (editable)
- AC 7: Branches displayed as clickable links: "College Name — Branch City"
- AC 8: Each branch has associated commission rate (percentage)

---

## Context

### Database Schema Reference

```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  commission_rate_percent DECIMAL(5,2),  -- Overrides college default if set
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_branches_college ON branches(college_id);
CREATE INDEX idx_branches_agency ON branches(agency_id);

-- Trigger to auto-populate commission rate from college default
CREATE OR REPLACE FUNCTION set_branch_default_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commission_rate_percent IS NULL THEN
    SELECT default_commission_rate_percent INTO NEW.commission_rate_percent
    FROM colleges WHERE id = NEW.college_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branch_default_commission_trigger
  BEFORE INSERT ON branches
  FOR EACH ROW
  EXECUTE FUNCTION set_branch_default_commission();
```

### RLS Policies

Apply similar RLS policies to branches:
- SELECT: All users in the agency can view
- INSERT/UPDATE/DELETE: Admin-only operations

### Key Constraints
- Branch commission rate can override college default
- If not specified, trigger automatically copies from college
- Cascade delete when college is deleted
- Commission rate still must be 0-100% if provided

### Dependencies
- Requires colleges table (Task 1)
- Requires agencies table
- Requires users table with role field

---

## Manifest Update Instructions

**Before implementing**, update the manifest:

1. Open: `.bmad-ephemeral/stories/prompts/3-1/manifest.md`

2. Update Task 1:
   ```markdown
   ### Task 1: Create colleges domain database schema
   - Status: Completed
   - Started: [Date from Task 1]
   - Completed: [Today's Date]
   - Notes: [Any notes from Task 1 implementation]
   ```

3. Update Task 2:
   ```markdown
   ### Task 2: Create branches schema
   - Status: In Progress
   - Started: [Today's Date]
   - Completed:
   - Notes: Creating branches table with auto-commission inheritance
   ```

---

## Implementation Steps

1. **Update manifest** (see instructions above)

2. **Create migration file**: `supabase/migrations/002_entities_domain/002_branches_schema.sql`

3. **Implement**:
   - Branches table with all fields
   - Foreign keys to colleges and agencies with CASCADE delete
   - Commission rate field (nullable, can override college default)
   - Trigger function to auto-populate commission rate
   - Indexes for performance
   - RLS policies for admin-only modifications
   - Updated_at trigger

4. **Test**:
   - Create a branch without specifying commission rate (should inherit from college)
   - Create a branch with explicit commission rate (should use provided value)
   - Verify cascade delete works when college is deleted
   - Test RLS policies

5. **Update manifest**: Mark Task 2 as completed

---

## Implementation Notes

**What was completed in Task 1**:
- Colleges table with all core fields
- RLS policies for multi-tenant isolation
- Admin-only modification policies
- Unique constraint on college names within agency

**How Task 2 builds on Task 1**:
- Branches reference colleges via foreign key
- Branches inherit commission rate from their college
- Branches follow same RLS pattern as colleges

**Dependencies on previous work**:
- Requires colleges.id for foreign key
- Requires colleges.default_commission_rate_percent for trigger

---

## Next Steps

After completing this task:

1. **Update manifest**: Mark Task 2 as completed
2. **Move to Task 3**: Open `task-3-prompt.md` to create college contacts schema
3. **Continue sequentially**: The next task adds contact management

---

## Success Criteria

Task 2 is complete when:
- ✅ Migration file exists at 002_branches_schema.sql
- ✅ Branches table created with all fields
- ✅ Foreign keys properly reference colleges and agencies
- ✅ Trigger automatically populates commission rate from college
- ✅ Can still override commission rate if explicitly provided
- ✅ Cascade delete works (deleting college deletes branches)
- ✅ RLS policies restrict modifications to admins
- ✅ Manifest updated with Task 2 completion
