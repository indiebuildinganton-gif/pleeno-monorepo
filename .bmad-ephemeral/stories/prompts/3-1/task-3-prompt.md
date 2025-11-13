# Story 3-1: College Registry - Task 3
## Create College Contacts Schema

**Task 3 of 21**: Create college contacts schema with audit logging

**Previous**: Task 2 (Create branches schema) - ✅ Should be completed

---

## Task Details

### Subtasks
- [ ] Create supabase/migrations/002_entities_domain/003_college_contacts_schema.sql
- [ ] Create college_contacts table with fields:
  - id, college_id, agency_id, name, role_department, position_title, email, phone
  - created_at, updated_at
- [ ] Add RLS policies for agency_id filtering
- [ ] Add index on college_id
- [ ] Create audit trigger to log contact changes

### Acceptance Criteria: AC 9-13

**Schema**:
```sql
CREATE TABLE college_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_department TEXT,
  position_title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_college_contacts_college ON college_contacts(college_id);
CREATE INDEX idx_college_contacts_agency ON college_contacts(agency_id);
```

**RLS**: Admin-only INSERT/UPDATE/DELETE, all users can SELECT

**Audit Trigger**: Log all contact changes to audit_logs table

---

## Manifest Update

Update Task 2 → Completed, Task 3 → In Progress

---

## Success Criteria

- ✅ College_contacts table created
- ✅ Audit trigger logs all changes
- ✅ RLS policies in place
- ✅ Cascade delete when college deleted

**Next**: Task 4 - Create college notes schema
