# Story 3.3: Student-College Enrollment Linking

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to link students to their enrolled colleges through payment plan creation with supporting documentation**,
So that **I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments**.

## Acceptance Criteria

1. **Enrollment Creation via Payment Plan**
   - When creating a payment plan, select a student from dropdown
   - Select a college/branch from dropdown
   - Specify the program/course name
   - Attach official offer letter (PDF/image) to the enrollment
   - Student-college enrollment automatically created/linked when payment plan is saved

2. **Enrollment Display and Navigation**
   - View all enrollments for a student with attached documents on student detail page
   - View all enrolled students for a college/branch on college detail page
   - View/download/maximize offer letter from both student and college detail pages

3. **Multiple Enrollment Support**
   - Student can have multiple payment plans for different colleges/branches
   - Student can have multiple payment plans for same college/branch (different courses)
   - Incomplete student information (e.g., missing phone) can be added/updated later manually

4. **Enrollment Status Management**
   - Mark enrollment as completed or cancelled from student or college detail page
   - Status options: 'active', 'completed', 'cancelled'

5. **Document Management**
   - Upload offer letters during payment plan creation
   - Support PDF and image formats
   - View/download/maximize documents from student and college detail pages
   - RLS policies protect documents (users can only access their agency's documents)

6. **Duplicate Enrollment Handling**
   - If student-branch-program combination exists, reuse enrollment
   - Otherwise create new enrollment record
   - Allow partial student data (mark required vs optional fields)

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Implementation** (AC: 1, 3, 4, 6)
  - [ ] Create `enrollments` table: id, agency_id, student_id, branch_id, program_name, offer_letter_url, offer_letter_filename, status ENUM ('active', 'completed', 'cancelled'), created_at, updated_at
  - [ ] Add foreign key from `payment_plans` table to `enrollments` table (enrollment_id column)
  - [ ] Enable RLS policies on enrollments table filtering by agency_id
  - [ ] Configure Supabase Storage bucket: enrollment-documents with RLS
  - [ ] Create indexes on (agency_id, student_id) and (agency_id, branch_id) for performance
  - [ ] Add unique constraint on (student_id, branch_id, program_name) for duplicate prevention

- [ ] **Task 2: Enrollment API Routes** (AC: 1, 4, 6)
  - [ ] Implement POST /api/enrollments (called internally by payment plan creation)
  - [ ] Implement GET /api/enrollments/[id] (enrollment detail)
  - [ ] Implement PATCH /api/enrollments/[id] (update status: completed/cancelled)
  - [ ] Implement GET /api/students/[id]/enrollments (all enrollments for student)
  - [ ] Implement GET /api/branches/[id]/enrollments (all enrolled students for branch)
  - [ ] Validate: student and branch must exist and belong to same agency
  - [ ] Handle duplicate enrollment logic: check (student_id, branch_id, program_name), reuse if exists

- [ ] **Task 3: Offer Letter Upload API** (AC: 1, 5)
  - [ ] Implement POST /api/enrollments/[id]/offer-letter (file upload)
  - [ ] Use Supabase Storage with path pattern: enrollment-documents/{enrollment_id}/{filename}
  - [ ] Validate file type (PDF, JPEG, PNG only)
  - [ ] Validate file size (max 10MB)
  - [ ] Store file metadata: offer_letter_url and offer_letter_filename in enrollments table
  - [ ] Implement RLS policies on storage bucket filtering by agency_id

- [ ] **Task 4: Offer Letter Download API** (AC: 2, 5)
  - [ ] Implement GET /api/enrollments/[id]/offer-letter (download)
  - [ ] Serve file with proper Content-Type and Content-Disposition headers
  - [ ] Check RLS permissions before serving file
  - [ ] Support streaming for large files

- [ ] **Task 5: Payment Plan Creation Integration** (AC: 1)
  - [ ] Update payment plan creation wizard (Step 1) to include:
    - Student selection dropdown
    - College/branch selection dropdown
    - Program/course name input field
    - Offer letter upload component
  - [ ] On payment plan save, create enrollment record first
  - [ ] Link payment_plan.enrollment_id to created enrollment
  - [ ] Handle enrollment creation errors gracefully (rollback payment plan if enrollment fails)

- [ ] **Task 6: Student Detail Page - Enrollments Section** (AC: 2, 3)
  - [ ] Add Enrollments section to /entities/students/[id] page
  - [ ] Display enrollment list: College - Branch (City), Program, Status badge, Offer Letter link
  - [ ] Add "View Offer Letter" link that opens document viewer/maximizer
  - [ ] Show enrollment status with color-coded badges (active=green, completed=blue, cancelled=gray)
  - [ ] Add "Change Status" dropdown per enrollment (active/completed/cancelled)

- [ ] **Task 7: College Detail Page - Enrolled Students Section** (AC: 2)
  - [ ] Add Enrolled Students section to /entities/colleges/[id] page
  - [ ] Display student list: Student Name, Program, Status, Offer Letter link
  - [ ] Make student names clickable (navigate to student detail page)
  - [ ] Show enrollment count and active enrollment count
  - [ ] Add "View Offer Letter" link per student

- [ ] **Task 8: Document Viewer Component** (AC: 2, 5)
  - [ ] Create DocumentViewer component for offer letters
  - [ ] Support PDF preview with maximize/fullscreen option
  - [ ] Support image preview (JPEG, PNG)
  - [ ] Add download button
  - [ ] Add close/minimize button
  - [ ] Handle loading and error states

- [ ] **Task 9: Enrollment Status Management UI** (AC: 4)
  - [ ] Create status change dropdown component
  - [ ] Implement status update mutation with TanStack Query
  - [ ] Show confirmation dialog for status changes
  - [ ] Update UI optimistically on status change
  - [ ] Display success/error toast notifications
  - [ ] Log status changes to audit_logs table

- [ ] **Task 10: Duplicate Enrollment Handling Logic** (AC: 6)
  - [ ] Before creating enrollment, query existing: `SELECT id FROM enrollments WHERE student_id=? AND branch_id=? AND program_name=?`
  - [ ] If found and status='active', reuse enrollment_id
  - [ ] If found and status='cancelled', create new enrollment (allow re-enrollment)
  - [ ] If not found, create new enrollment
  - [ ] Display message to user if enrollment reused: "Using existing active enrollment"

- [ ] **Task 11: Audit Logging** (AC: All)
  - [ ] Log enrollment creation to audit_logs
  - [ ] Log enrollment status changes with old → new values
  - [ ] Log offer letter uploads with file metadata
  - [ ] Log offer letter deletions
  - [ ] Include user_id, timestamp, entity_type='enrollment'

- [ ] **Task 12: Testing** (AC: All)
  - [ ] Write integration tests for enrollment API endpoints
  - [ ] Test duplicate enrollment handling (reuse vs create new)
  - [ ] Test file upload with valid/invalid file types
  - [ ] Test file upload with oversized files
  - [ ] Test RLS policies (users cannot access other agencies' enrollments/documents)
  - [ ] Write E2E test for payment plan creation → enrollment creation flow
  - [ ] Test document viewer component with PDF and image files
  - [ ] Test enrollment status change flow

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Zone Architecture:**
- Enrollment management spans two zones:
  - `apps/entities/` for student and college detail pages with enrollment sections
  - `apps/payments/` for payment plan creation which triggers enrollment creation
- Share enrollment components via `packages/ui/src/components/enrollments/`
- Use `packages/database` for Supabase client and enrollment queries

**Database Patterns:**
- Row-Level Security (RLS) enforces multi-tenant isolation via agency_id
- Foreign key from payment_plans → enrollments creates 1:1 relationship
- Enrollments table uses composite uniqueness: (student_id, branch_id, program_name)
- Support multiple enrollments per student (different colleges or courses)

**File Upload Pattern (Reuse from Story 3.2):**
- Use Supabase Storage for offer letters
- Storage path: `enrollment-documents/{enrollment_id}/{filename}`
- Validate file type (PDF, JPEG, PNG only)
- Validate file size (max 10MB)
- Store metadata in enrollments table (offer_letter_url, offer_letter_filename)
- Implement RLS policies on storage bucket to enforce agency_id isolation

**Duplicate Enrollment Handling Pattern:**
- Before creating enrollment, check if (student_id, branch_id, program_name) exists
- If found with status='active', reuse the enrollment_id
- If found with status='cancelled', create new enrollment (allow re-enrollment)
- If not found, create new enrollment
- This prevents duplicate enrollments for the same student-college-program combination

**State Management:**
- Use TanStack Query for enrollment data (list, detail)
- Use React Hook Form for payment plan wizard state
- Use Zustand for document viewer UI state (maximize/minimize)

**Date Handling:**
- Use `packages/utils/src/date-helpers.ts` for date formatting
- Store enrollment_date in UTC
- Display in agency's configured timezone

### Project Structure Notes

**Enrollment Components Location:**
```
apps/entities/
├── app/
│   ├── students/
│   │   └── [id]/
│   │       └── components/
│   │           └── EnrollmentsSection.tsx     # NEW
│   └── colleges/
│       └── [id]/
│           └── components/
│               └── EnrolledStudentsSection.tsx # NEW

apps/payments/
├── app/
│   └── plans/
│       └── new/
│           └── components/
│               ├── PaymentPlanWizard.tsx       # UPDATED: Add enrollment creation
│               └── OfferLetterUpload.tsx      # NEW

packages/ui/src/components/enrollments/
├── DocumentViewer.tsx                          # NEW: Reusable document viewer
├── EnrollmentStatusBadge.tsx                   # NEW
└── EnrollmentCard.tsx                          # NEW
```

**Shared Utilities:**
```
packages/utils/src/
├── file-upload.ts                              # UPDATED: Add uploadOfferLetter()
└── enrollment-helpers.ts                       # NEW: findOrCreateEnrollment()
```

**Database Migrations:**
```
supabase/migrations/002_entities_domain/
├── 006_enrollments_schema.sql                  # NEW: Enrollments table
├── 007_enrollments_rls.sql                     # NEW: RLS policies
└── 008_payment_plans_fk.sql                    # NEW: Add enrollment_id FK to payment_plans
```

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-3.3-Student-College-Enrollment-Linking]
- Full acceptance criteria detailed in Epic 3, Story 3.3 (lines 593-632)

**Architecture:**
- [Source: docs/architecture.md#Entities-Domain]
- Enrollments schema defined in "Entities Domain (Epic 3)" section
- File upload pattern: "File Upload Pattern" section (reused from Story 3.2)
- Duplicate enrollment handling: "Duplicate Enrollment Handling Pattern" section (lines 1258-1320 referenced in Story 3.2 Dev Notes)

**PRD Requirements:**
- Multi-tenant data isolation requirement
- Enrollment tracking as foundational data entity
- Support for multiple enrollments per student

**Technical Decisions:**
- Next.js 15 with App Router (Server Components for list/detail, Client Components for forms)
- Supabase PostgreSQL with RLS for multi-tenancy
- Supabase Storage for offer letter uploads
- TanStack Query for client-side caching
- React Hook Form + Zod for payment plan wizard validation
- Shadcn UI components (Badge, Dialog, Card)

### Learnings from Previous Story

**From Story 3.2: Student Registry (Status: drafted)**

Story 3.2 established the student entity foundation that Story 3.3 builds upon:

- **Student Schema Created**: `students` table with fields: id, agency_id, full_name, email, phone, passport_number, visa_status, date_of_birth, nationality
- **Student Enrollments Table**: `student_enrollments` table already defined in Story 3.2 (id, student_id, college_id, branch_id, agency_id, enrollment_date)
- **Document Management Pattern**: File upload utilities created in `packages/utils/src/file-upload.ts` with Supabase Storage integration
- **RLS Policies**: Agency-level data isolation established on students table
- **UI Components**: Student detail page structure at `/entities/students/[id]/page.tsx` ready for enrollment section addition

**Key Interfaces to Reuse:**
- Student detail page layout (Story 3.2) - add Enrollments section below existing sections
- Document upload component from Story 3.2 - adapt for offer letter upload in payment plan wizard
- Student search/selection dropdown from Story 3.2 - reuse in payment plan creation

**Architectural Continuity:**
- Follow same RLS pattern: agency_id filtering on enrollments table
- Follow same file storage pattern: `enrollment-documents/{enrollment_id}/{filename}`
- Follow same audit logging pattern: log all enrollment CRUD operations

**Notes from Story 3.2:**
- Story 3.2 defined `student_enrollments` table but Story 3.3 will create the actual `enrollments` table (different schema: includes program_name, offer_letter_url, status)
- Student documents API from Story 3.2 (`/api/students/[id]/documents`) provides reference for offer letter API implementation
- Document viewer component from Story 3.2 can be reused for enrollment offer letters

[Source: stories/3-2-student-registry.md]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml](.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
