# Task 1: Database Schema Implementation

## Context
Story 3.2: Student Registry - Database foundation for student management system

## Acceptance Criteria Coverage
- AC 1, 2, 3: Student data storage foundation

## Task Description
Implement database schema for student management including students table, enrollments, notes, and documents.

## Subtasks
1. Create `students` table with fields: id, agency_id, full_name, email, phone, passport_number, visa_status, date_of_birth, nationality, created_at, updated_at
2. Add unique constraint on (agency_id, passport_number)
3. Create `student_enrollments` table: id, student_id, college_id, branch_id, agency_id, enrollment_date, created_at, updated_at
4. Create `student_notes` table: id, student_id, agency_id, user_id, content (max 2000 chars), created_at, updated_at
5. Create `student_documents` table: id, student_id, agency_id, document_type ENUM, file_name, file_path, file_size, uploaded_by, uploaded_at
6. Enable RLS policies on all tables filtering by agency_id
7. Add agencies.subscription_tier field: ENUM ('basic', 'premium', 'enterprise')
8. Create indexes on agency_id for all tables

## Technical Requirements
- Location: `supabase/migrations/002_entities_domain/`
- Files to create:
  - `003_students_schema.sql`
  - `004_enrollments_schema.sql`
  - `005_student_notes_schema.sql`
  - `006_student_documents_schema.sql`
  - `007_entities_rls.sql`
- RLS must enforce multi-tenant isolation
- Visa status ENUM: 'in_process', 'approved', 'denied', 'expired'
- Document type ENUM: 'offer_letter', 'passport', 'visa', 'other'

## Constraints
- Multi-tenant isolation via RLS - ALL queries auto-filtered by agency_id
- Passport numbers unique within each agency only
- Email and phone OPTIONAL (support partial data)
- Notes max 2,000 characters
- All dates stored in UTC

## Reference Files
- Architecture: `docs/architecture.md` lines 1484-1580 (Entities Domain schema)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md`

## Definition of Done
- [ ] All tables created with correct schema
- [ ] RLS policies enabled and tested
- [ ] Unique constraints working
- [ ] Indexes created
- [ ] TypeScript types can be regenerated from schema
- [ ] Migration runs successfully
