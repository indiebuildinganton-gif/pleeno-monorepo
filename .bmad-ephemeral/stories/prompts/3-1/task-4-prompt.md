# Story 3-1: College Registry - Task 4
## Create College Notes Schema

**Task 4 of 21**: Create college notes schema with character limit

**Previous**: Task 3 (Create college contacts schema) - ✅ Should be completed

---

## Task Details

### Subtasks
- [ ] Create supabase/migrations/002_entities_domain/004_college_notes_schema.sql
- [ ] Create college_notes table with fields:
  - id, college_id, agency_id, user_id, content (max 2000 chars)
  - created_at, updated_at
- [ ] Add RLS policies for agency_id filtering
- [ ] Add index on (college_id, created_at DESC) for notes display

### Acceptance Criteria: AC 17-19

**Schema**:
```sql
CREATE TABLE college_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_college_notes_college ON college_notes(college_id, created_at DESC);
CREATE INDEX idx_college_notes_agency ON college_notes(agency_id);
```

**Key Constraint**: Content must be 2000 characters or less (enforced at DB level)

**RLS**: All authenticated users can INSERT notes, users can UPDATE/DELETE own notes, admins can UPDATE/DELETE all

---

## Manifest Update

Update Task 3 → Completed, Task 4 → In Progress

---

## Success Criteria

- ✅ College_notes table with 2000 char limit
- ✅ RLS allows all users to add notes
- ✅ Index for efficient chronological queries
- ✅ User attribution via user_id

**Next**: Task 5 - Create activity feed infrastructure
