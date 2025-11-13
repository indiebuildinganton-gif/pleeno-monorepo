# Story 3.2: Student Registry

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to create and manage a database of students with flexible data entry options**,
So that **I can track which students are enrolled where, monitor their visa status, and link them to payment plans**.

## Acceptance Criteria

1. **Student List View**
   - Display all students in agency in table format with columns: Full Name, Email, Visa Status, College/Branch, Updated
   - Visa status displayed as colored badges (red for Denied, blue for In Process, green for Approved, gray for Expired)
   - College/Branch displayed as "College Name" (first line) and "Branch (City)" (second line)
   - Relative timestamps for updates (e.g., "4 days ago")
   - Search functionality in top right corner
   - "Export CSV" button to export all students
   - "+ Add Student" button for creating new students

2. **Student Form (Create/Edit)**
   - Required fields: Full name, passport number
   - Optional fields: Email, phone, date of birth, nationality
   - Visa status dropdown: "In Process", "Approved", "Denied", "Expired"
   - College and branch association
   - Unique passport number per agency enforcement
   - Document attachment capability for offer letters and other documents
   - View/download/maximize attached documents

3. **Student Detail Page**
   - Student full name as page heading
   - Action buttons: "Edit Info", "+ New Payment Plan", "Delete"
   - Student information fields: Email, Phone, Visa Status (colored badge), College/Branch (clickable link to college detail)
   - College/Branch format: "College - Branch (City)" (e.g., "Imagine - Imagine (Brisbane)")

4. **Notes Section**
   - Text area for adding notes (max 2,000 characters)
   - Character counter display (e.g., "0 / 2,000")
   - "Post Note" button to save notes
   - List of existing notes with relative timestamps
   - Edit/delete icons for each note

5. **Activity Feed**
   - Timeline/activity panel on right side showing all changes
   - Display: enrollment changes (College & Branch with before → after), email updates, note additions, field changes
   - Each entry shows: event type (Update, Note), description with old → new values, relative timestamp
   - Filter by time period dropdown (e.g., "Last 30 days")
   - Search within activity log
   - Auto-refresh to show latest changes

6. **Data Import/Export**
   - Manual student creation via form
   - CSV export of all students with all fields
   - CSV bulk upload for agency onboarding
   - CSV import wizard with field mapping interface
   - Data validation and error reporting during import
   - Support partial data import (missing fields can be added later)
   - Email notification to admin after import listing students with incomplete critical data (especially phone)
   - Email includes clickable links to edit incomplete records
   - Import changes logged to audit trail

7. **Document Management**
   - Upload offer letters and documents to student profiles
   - View/download attached documents
   - Maximize documents for reading
   - Support PDF and image formats

8. **Premium Feature (AI-Powered Extraction)**
   - Upload PDF offer letter to auto-extract: student name, passport number, school/college, branch, course, dates, tuition, payment schedule
   - Pre-populate student, enrollment, and payment plan forms for review/approval
   - User reviews and edits extracted data before saving
   - Match extracted school/course to existing colleges/branches
   - Create new college/branch if no match found
   - Generate draft installments from extracted payment schedule
   - Feature gated by agency subscription tier (disabled for basic plan)
   - Fallback to manual entry if extraction fails
   - Log extraction accuracy metrics

## Tasks / Subtasks

- [ ] **Task 1: Database Schema Implementation** (AC: 1, 2, 3)
  - [ ] Create `students` table with fields: id, agency_id, full_name, email, phone, passport_number, visa_status, date_of_birth, nationality, created_at, updated_at
  - [ ] Add unique constraint on (agency_id, passport_number)
  - [ ] Create `student_enrollments` table: id, student_id, college_id, branch_id, agency_id, enrollment_date, created_at, updated_at
  - [ ] Create `student_notes` table: id, student_id, agency_id, user_id, content (max 2000 chars), created_at, updated_at
  - [ ] Create `student_documents` table: id, student_id, agency_id, document_type ENUM, file_name, file_path, file_size, uploaded_by, uploaded_at
  - [ ] Enable RLS policies on all tables filtering by agency_id
  - [ ] Add agencies.subscription_tier field: ENUM ('basic', 'premium', 'enterprise')
  - [ ] Create indexes on agency_id for all tables

- [ ] **Task 2: Student API Routes** (AC: 1, 2, 3)
  - [ ] Implement GET /api/students (list with search)
  - [ ] Implement POST /api/students (create)
  - [ ] Implement GET /api/students/[id] (detail with joins)
  - [ ] Implement PATCH /api/students/[id] (update)
  - [ ] Implement DELETE /api/students/[id]
  - [ ] Implement GET /api/students?search=query (search functionality)
  - [ ] Validate required fields: full_name, passport_number
  - [ ] Make email and phone optional

- [ ] **Task 3: Student Notes API** (AC: 4)
  - [ ] Implement GET /api/students/[id]/notes
  - [ ] Implement POST /api/students/[id]/notes
  - [ ] Implement PATCH /api/students/[id]/notes/[note_id]
  - [ ] Implement DELETE /api/students/[id]/notes/[note_id]
  - [ ] Validate content max length: 2000 characters
  - [ ] Return notes with user attribution and timestamps

- [ ] **Task 4: Student Documents API** (AC: 7)
  - [ ] Implement POST /api/students/[id]/documents (file upload)
  - [ ] Implement GET /api/students/[id]/documents/[doc_id] (download)
  - [ ] Implement DELETE /api/students/[id]/documents/[doc_id]
  - [ ] Configure Supabase Storage bucket: student-documents
  - [ ] Implement RLS policies for storage bucket
  - [ ] Support PDF and image formats (offer_letter, passport, visa, other)
  - [ ] Store file metadata in student_documents table

- [ ] **Task 5: Activity Feed API** (AC: 5)
  - [ ] Implement GET /api/students/[id]/activity
  - [ ] Query audit_logs filtered by student_id and related entities
  - [ ] Support time period filter (Last 30 days, etc.)
  - [ ] Support search within activity
  - [ ] Return formatted activity entries with old → new values
  - [ ] Include enrollment changes, email updates, note additions, visa status changes

- [ ] **Task 6: CSV Import/Export API** (AC: 6)
  - [ ] Implement GET /api/students/export (CSV file generation)
  - [ ] Implement POST /api/students/import (CSV upload)
  - [ ] Create CSV import wizard with field mapping
  - [ ] Validate data during import with error reporting
  - [ ] Support partial data import (missing optional fields)
  - [ ] Generate email notification to admin listing incomplete student records
  - [ ] Include clickable links to edit incomplete students in email
  - [ ] Log all import changes to audit_log table

- [ ] **Task 7: AI Extraction API (Premium Feature)** (AC: 8)
  - [ ] Implement POST /api/students/extract-from-offer-letter
  - [ ] Check agency subscription_tier before processing
  - [ ] Use OCR + LLM for extraction (OpenAI GPT-4 Vision, Claude, or specialized service)
  - [ ] Extract structured data: student_name, passport_number, college_name, branch_name, program_name, dates, amounts, payment_schedule
  - [ ] Return JSON with extracted fields and confidence scores
  - [ ] Implement fuzzy matching for existing colleges/branches
  - [ ] Handle extraction failures with clear error messages
  - [ ] Store extraction metadata for analytics

- [ ] **Task 8: Student List UI Component** (AC: 1)
  - [ ] Create /entities/students page with table view
  - [ ] Implement columns: Full Name, Email, Visa Status, College/Branch, Updated
  - [ ] Create visa status badge components with color coding (red/blue/green/gray)
  - [ ] Display College/Branch as two-line format
  - [ ] Implement relative timestamp display (e.g., "4 days ago")
  - [ ] Add search box in top right
  - [ ] Add "Export CSV" button
  - [ ] Add "+ Add Student" button
  - [ ] Make rows clickable to navigate to detail page

- [ ] **Task 9: Student Form Component** (AC: 2)
  - [ ] Create /entities/students/new page with form
  - [ ] Create /entities/students/[id]/edit page with form
  - [ ] Implement React Hook Form with Zod validation
  - [ ] Add fields: full_name (required), passport_number (required)
  - [ ] Add optional fields: email, phone, date_of_birth, nationality
  - [ ] Add visa status dropdown with four options
  - [ ] Add college and branch selection dropdowns
  - [ ] Implement file upload for documents
  - [ ] Show validation errors
  - [ ] Handle unique constraint violation (duplicate passport)

- [ ] **Task 10: Student Detail Page** (AC: 3)
  - [ ] Create /entities/students/[id] page
  - [ ] Display student name as heading
  - [ ] Add "Back to Students" navigation link
  - [ ] Add action buttons: "Edit Info", "+ New Payment Plan", "Delete"
  - [ ] Display student info: Email, Phone, Visa Status (badge), College/Branch (link)
  - [ ] Format College/Branch as "College - Branch (City)"
  - [ ] Make College/Branch clickable to college detail page

- [ ] **Task 11: Notes Section UI** (AC: 4)
  - [ ] Create Notes component for student detail page
  - [ ] Add text area with max 2,000 character validation
  - [ ] Display character counter (e.g., "0 / 2,000")
  - [ ] Add "Post Note" button
  - [ ] List existing notes with relative timestamps
  - [ ] Add edit/delete icons for each note
  - [ ] Implement note editing modal
  - [ ] Handle note deletion with confirmation

- [ ] **Task 12: Activity Feed UI** (AC: 5)
  - [ ] Create Activity panel component for right side
  - [ ] Add refresh icon
  - [ ] Add time period filter dropdown
  - [ ] Add search activity input box
  - [ ] Display activity feed showing Updates and Notes
  - [ ] Format field changes with old → new values
  - [ ] Show event type labels (Update, Note)
  - [ ] Display relative timestamps
  - [ ] Implement auto-refresh (optional)

- [ ] **Task 13: CSV Import Wizard UI** (AC: 6)
  - [ ] Create /entities/students/import page
  - [ ] Implement CSV file upload component
  - [ ] Create field mapping interface
  - [ ] Display data validation errors
  - [ ] Show import progress
  - [ ] Display import completion summary
  - [ ] Show email notification sent confirmation

- [ ] **Task 14: Document Viewer Component** (AC: 7)
  - [ ] Create document list component
  - [ ] Add file upload button
  - [ ] Implement document download
  - [ ] Create PDF preview with maximize/fullscreen option
  - [ ] Support image preview
  - [ ] Add delete document functionality

- [ ] **Task 15: AI Extraction Wizard (Premium)** (AC: 8)
  - [ ] Create /entities/students/new/extract page (gated by subscription tier)
  - [ ] Implement offer letter upload
  - [ ] Show extraction progress spinner
  - [ ] Display extracted data in review form
  - [ ] Allow editing of extracted data
  - [ ] Implement college/branch matching UI
  - [ ] Show "Create New College/Branch" option if no match
  - [ ] Display confidence scores
  - [ ] Handle extraction errors gracefully

- [ ] **Task 16: Audit Logging** (AC: All)
  - [ ] Log all student CRUD operations to audit_logs
  - [ ] Log visa status changes
  - [ ] Log enrollment changes
  - [ ] Log email updates
  - [ ] Log note additions
  - [ ] Include user_id, timestamp, old/new values

- [ ] **Task 17: Testing** (AC: All)
  - [ ] Write unit tests for commission calculator utilities
  - [ ] Write integration tests for student API endpoints
  - [ ] Write integration tests for notes API
  - [ ] Write integration tests for documents API
  - [ ] Write integration tests for activity feed
  - [ ] Write integration tests for CSV import
  - [ ] Write E2E test for student creation flow
  - [ ] Write E2E test for document upload
  - [ ] Test RLS policies for data isolation

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Zone Architecture:**
- Student management lives in the `apps/entities/` zone
- All student routes under `/entities/students`
- Share UI components via `packages/ui`
- Use `packages/database` for Supabase client

**Database Patterns:**
- Row-Level Security (RLS) enforces multi-tenant isolation via agency_id
- All queries automatically filtered by user's agency
- Use Supabase Storage with RLS for document uploads
- Storage path pattern: `student-documents/{student_id}/{filename}`

**State Management:**
- Use TanStack Query for server state (student list, detail)
- Use React Hook Form for form state
- Use Zustand for client state (filters, UI state) if needed

**File Upload Pattern:**
- Use Supabase Storage for offer letters and documents
- Validate file type (PDF, JPEG, PNG only)
- Validate file size (max 10MB)
- Store metadata in student_documents table
- Implement RLS policies on storage bucket

**Commission Calculation:**
- Reference `packages/utils/src/commission-calculator.ts`
- Commissionable value = total_course_value - (materials_cost + admin_fees + other_fees)
- Expected commission accounts for GST inclusive/exclusive setting

**Date Handling:**
- Use `packages/utils/src/date-helpers.ts` for date formatting
- Use `formatRelativeTime()` for "4 days ago" timestamps
- Store all dates in UTC
- Display in agency's configured timezone

### Project Structure Notes

**Student Components Location:**
```
apps/entities/
├── app/
│   └── students/
│       ├── page.tsx                    # Student list (Server Component)
│       ├── [id]/
│       │   └── page.tsx                # Student detail (Server Component)
│       ├── new/
│       │   └── page.tsx                # Create student form
│       ├── import/
│       │   └── page.tsx                # CSV import wizard
│       └── components/
│           ├── StudentTable.tsx        # Client Component
│           ├── StudentForm.tsx         # Client Component
│           ├── NotesSection.tsx        # Client Component
│           ├── ActivityFeed.tsx        # Client Component
│           └── DocumentViewer.tsx      # Client Component
```

**Shared Utilities:**
```
packages/utils/src/
├── date-helpers.ts                     # formatRelativeTime(), formatDateInAgencyTimezone()
├── file-upload.ts                      # uploadDocument(), deleteDocument()
└── formatters.ts                       # formatCurrency(), formatPhone()
```

**Database Migrations:**
```
supabase/migrations/002_entities_domain/
├── 003_students_schema.sql             # Students table
├── 004_enrollments_schema.sql          # Student enrollments table
├── 005_student_notes_schema.sql        # NEW: Student notes
├── 006_student_documents_schema.sql    # NEW: Student documents
└── 007_entities_rls.sql                # RLS policies
```

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-3.2-Student-Registry]
- Full acceptance criteria detailed in Epic 3, Story 3.2 (lines 430-590)

**Architecture:**
- [Source: docs/architecture.md#Entities-Domain]
- Students schema defined in "Entities Domain (Epic 3)" section (lines 1484-1580)
- File upload pattern: "File Upload Pattern" section (lines 1199-1254)
- Duplicate enrollment handling: "Duplicate Enrollment Handling Pattern" section (lines 1258-1320)

**PRD Requirements:**
- Multi-tenant data isolation requirement
- Student registry as core entity
- CSV import for agency onboarding
- AI extraction as premium feature

**Technical Decisions:**
- Next.js 15 with App Router (Server Components for list/detail, Client Components for forms)
- Supabase PostgreSQL with RLS for multi-tenancy
- Supabase Storage for file uploads
- TanStack Query for client-side caching
- React Hook Form + Zod for form validation
- Shadcn UI components (Table, Form, Badge, Dialog)

### Learnings from Previous Story

First story in epic - no predecessor context

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/3-2-student-registry.context.xml](.bmad-ephemeral/stories/3-2-student-registry.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
