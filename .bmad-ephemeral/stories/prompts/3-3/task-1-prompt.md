# Story 3-3: Student-College Enrollment Linking
## Task 1: Database Schema Implementation

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Implement the database schema for enrollment tracking, including the enrollments table, foreign key relationships, RLS policies, and Supabase Storage configuration for offer letter documents.

## Subtasks Checklist

- [ ] Create `enrollments` table: id, agency_id, student_id, branch_id, program_name, offer_letter_url, offer_letter_filename, status ENUM ('active', 'completed', 'cancelled'), created_at, updated_at
- [ ] Add foreign key from `payment_plans` table to `enrollments` table (enrollment_id column)
- [ ] Enable RLS policies on enrollments table filtering by agency_id
- [ ] Configure Supabase Storage bucket: enrollment-documents with RLS
- [ ] Create indexes on (agency_id, student_id) and (agency_id, branch_id) for performance
- [ ] Add unique constraint on (student_id, branch_id, program_name) for duplicate prevention

## Acceptance Criteria

This task addresses:
- **AC1**: Enrollment Creation via Payment Plan
- **AC3**: Multiple Enrollment Support
- **AC4**: Enrollment Status Management
- **AC6**: Duplicate Enrollment Handling

## Key Constraints

1. **Row-Level Security (RLS)**: All queries automatically filtered by agency_id. Apply RLS to enrollments table and enrollment-documents storage bucket.
2. **Composite Uniqueness**: Enrollments table uses (student_id, branch_id, program_name) for duplicate prevention. Check before creating new enrollment.
3. **Status Enum**: Enrollment status must be one of: 'active', 'completed', 'cancelled'. Default to 'active' on creation.
4. **Foreign Key Relationship**: payment_plans.enrollment_id → enrollments.id creates 1:1 relationship. Enrollment must be created BEFORE payment plan.
5. **File Upload Constraints**: Supabase Storage path enrollment-documents/{enrollment_id}/{filename}. Validate file type (PDF, JPEG, PNG), max size 10MB.

## Interfaces to Implement

### Enrollments Table Schema
```sql
CREATE TABLE enrollments (
  id UUID,
  agency_id UUID,
  student_id UUID,
  branch_id UUID,
  program_name TEXT,
  offer_letter_url TEXT,
  offer_letter_filename TEXT,
  status ENUM('active','completed','cancelled'),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(student_id, branch_id, program_name)
)
```

**Notes**: Composite unique constraint prevents duplicate student-branch-program combinations. Foreign keys to students and branches tables.

## Implementation Location

**Database Migrations:**
```
supabase/migrations/002_entities_domain/
├── 006_enrollments_schema.sql      # NEW: Enrollments table
├── 007_enrollments_rls.sql         # NEW: RLS policies
└── 008_payment_plans_fk.sql        # NEW: Add enrollment_id FK to payment_plans
```

## Dependencies

- PostgreSQL with Supabase extensions
- Existing students table (from Story 3.2)
- Existing branches table (from Epic 3)
- Existing payment_plans table (from Epic 2)

## Artifacts & References

**Documentation:**
- [docs/epics.md] - Epic 3, Story 3.3 (lines 593-632)
- [docs/architecture.md] - Entities Domain section
- [.bmad-ephemeral/stories/3-2-student-registry.md] - Previous story establishing students table

**Code References:**
- Students table schema from Story 3.2 (for foreign key reference)
- RLS pattern from Story 3.2 (agency_id filtering)

---

## 🔴 CRITICAL: Manifest Creation

**Before starting implementation**, you MUST create a manifest file to track progress through all 12 tasks.

### Create Manifest File

Create a new file at: `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`

Use this template:

```markdown
# Story 3-3 Implementation Manifest

**Story**: Student-College Enrollment Linking
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Database Schema Implementation
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Enrollment API Routes
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Offer Letter Upload API
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Offer Letter Download API
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Payment Plan Creation Integration
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Student Detail Page - Enrollments Section
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: College Detail Page - Enrolled Students Section
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Document Viewer Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Enrollment Status Management UI
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 10: Duplicate Enrollment Handling Logic
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 11: Audit Logging
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 12: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

### Update Manifest After Task 1

When you complete Task 1, update the manifest:
1. Change Task 1 Status to "Completed"
2. Add Completed date
3. Add any implementation notes (table names, key decisions, issues encountered)
4. Save the manifest

---

## Implementation Instructions

1. **Create the migration files** in `supabase/migrations/002_entities_domain/`
2. **Define the enrollments table** with all required columns and constraints
3. **Add the foreign key** from payment_plans to enrollments
4. **Implement RLS policies** for multi-tenant isolation
5. **Configure Supabase Storage bucket** for enrollment documents with RLS
6. **Create indexes** for query performance
7. **Test the migrations** locally before committing

### Testing

- Verify enrollments table created successfully
- Test RLS policies (users can only access their agency's enrollments)
- Verify unique constraint prevents duplicate (student_id, branch_id, program_name)
- Test indexes are created correctly

---

## Next Steps

After completing Task 1:
1. ✅ Update manifest.md (mark Task 1 complete, add notes)
2. 📄 Move to `task-2-prompt.md` - Enrollment API Routes
3. 🔄 Continue sequential execution

**Ready to implement?** Start with creating the manifest file, then proceed with the database schema implementation.
