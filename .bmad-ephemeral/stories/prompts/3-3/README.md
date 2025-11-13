# Story 3-3: Student-College Enrollment Linking
## Implementation Prompt Guide

This directory contains **12 sequential task prompts** for implementing Story 3-3: Student-College Enrollment Linking in Claude Code Web.

---

## 📋 Story Overview

**Epic**: 3 - Core Entity Management
**Story**: 3.3 - Student-College Enrollment Linking
**Status**: Ready for Implementation

**User Story:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## 📁 Generated Files

This directory contains the following prompt files:

1. **task-1-prompt.md** - Database Schema Implementation (includes manifest creation)
2. **task-2-prompt.md** - Enrollment API Routes
3. **task-3-prompt.md** - Offer Letter Upload API
4. **task-4-prompt.md** - Offer Letter Download API
5. **task-5-prompt.md** - Payment Plan Creation Integration
6. **task-6-prompt.md** - Student Detail Page - Enrollments Section
7. **task-7-prompt.md** - College Detail Page - Enrolled Students Section
8. **task-8-prompt.md** - Document Viewer Component
9. **task-9-prompt.md** - Enrollment Status Management UI
10. **task-10-prompt.md** - Duplicate Enrollment Handling Logic
11. **task-11-prompt.md** - Audit Logging
12. **task-12-prompt.md** - Testing (Final Task)

---

## 🚀 How to Use These Prompts

### Step 1: Open Claude Code Web
Navigate to [Claude Code Web](https://claude.ai/code) and ensure you're in the correct project workspace.

### Step 2: Start with Task 1
1. Open `task-1-prompt.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Let Claude execute the task

**IMPORTANT**: Task 1 will create `MANIFEST.md` to track progress through all 12 tasks. This manifest is critical for maintaining context across tasks.

### Step 3: Verify Manifest Creation
After Task 1 completes:
- Check that `MANIFEST.md` was created in this directory
- Verify Task 1 is marked as "Completed" with date and notes
- Confirm Task 2 is marked as "In Progress"

### Step 4: Continue Sequential Execution
For Tasks 2-12:
1. Open the next task prompt file
2. Copy the entire contents
3. Paste into Claude Code Web (same session or new session)
4. Claude will:
   - Read the manifest to understand progress
   - Update manifest (mark previous task complete, current task in progress)
   - Implement the task
   - Add implementation notes to manifest

### Step 5: Track Progress
The `MANIFEST.md` file will be continuously updated to track:
- Which tasks are completed
- Current task in progress
- Implementation notes and decisions
- Issues encountered

---

## 📊 Manifest Tracking

The manifest file (`MANIFEST.md`) will be created by Task 1 and maintained throughout:

```markdown
# Story 3-3 Implementation Manifest

**Story**: Student-College Enrollment Linking
**Status**: In Progress
**Started**: [Date from Task 1]

## Task Progress

### Task 1: Database Schema Implementation
- Status: Completed
- Started: 2025-11-13
- Completed: 2025-11-13
- Notes: Created enrollments table, RLS policies, storage bucket

### Task 2: Enrollment API Routes
- Status: In Progress
- Started: 2025-11-13
- Completed:
- Notes:

[... continues for all 12 tasks]
```

---

## ⚙️ Implementation Architecture

### Database Migrations
```
supabase/migrations/002_entities_domain/
├── 006_enrollments_schema.sql
├── 007_enrollments_rls.sql
└── 008_payment_plans_fk.sql
```

### API Routes
```
apps/payments/app/api/enrollments/route.ts
apps/entities/app/api/enrollments/[id]/route.ts
apps/entities/app/api/students/[id]/enrollments/route.ts
apps/entities/app/api/branches/[id]/enrollments/route.ts
apps/entities/app/api/enrollments/[id]/offer-letter/route.ts
```

### UI Components
```
apps/entities/app/students/[id]/components/EnrollmentsSection.tsx
apps/entities/app/colleges/[id]/components/EnrolledStudentsSection.tsx
apps/payments/app/plans/new/components/PaymentPlanWizard.tsx
apps/payments/app/plans/new/components/OfferLetterUpload.tsx
packages/ui/src/components/enrollments/DocumentViewer.tsx
packages/ui/src/components/enrollments/EnrollmentStatusBadge.tsx
packages/ui/src/components/enrollments/EnrollmentStatusMenu.tsx
```

### Utilities
```
packages/utils/src/enrollment-helpers.ts
packages/utils/src/file-upload.ts (updated)
```

---

## ✅ Acceptance Criteria

This story implements the following acceptance criteria:

**AC1: Enrollment Creation via Payment Plan**
- Select student and college/branch from dropdowns
- Specify program/course name
- Attach official offer letter (PDF/image)
- Enrollment automatically created when payment plan saved

**AC2: Enrollment Display and Navigation**
- View all enrollments on student detail page
- View all enrolled students on college detail page
- View/download/maximize offer letters

**AC3: Multiple Enrollment Support**
- Multiple payment plans for different colleges
- Multiple payment plans for same college (different courses)
- Incomplete student info can be updated later

**AC4: Enrollment Status Management**
- Mark as completed or cancelled
- Status options: active, completed, cancelled

**AC5: Document Management**
- Upload offer letters (PDF, JPEG, PNG)
- View/download/maximize documents
- RLS policies protect documents

**AC6: Duplicate Enrollment Handling**
- Reuse enrollment if student-branch-program exists
- Create new enrollment otherwise
- Allow partial student data

---

## 🔑 Key Constraints & Patterns

### Multi-Zone Architecture
Enrollment management spans `apps/entities/` and `apps/payments/` zones. Shared components live in `packages/ui/src/components/enrollments/`.

### Row-Level Security (RLS)
All queries automatically filtered by `agency_id`. RLS applied to:
- enrollments table
- enrollment-documents storage bucket

### Foreign Key Relationship
`payment_plans.enrollment_id` → `enrollments.id` creates 1:1 relationship. Enrollment must be created BEFORE payment plan.

### Composite Uniqueness
Enrollments use `(student_id, branch_id, program_name)` for duplicate prevention. Check before creating new enrollment.

### File Upload Constraints
- Storage path: `enrollment-documents/{enrollment_id}/{filename}`
- Validate file type: PDF, JPEG, PNG
- Max size: 10MB
- Store metadata in enrollments table

### Status Enum
Enrollment status: 'active', 'completed', 'cancelled'. Default to 'active' on creation.

---

## 🧪 Testing Strategy

### Unit Tests
- enrollment-helpers utility functions
- file upload validation
- Zod schemas

### Integration Tests
- All API endpoints
- RLS policy enforcement
- Duplicate enrollment handling
- Payment plan → enrollment flow

### E2E Tests
- Full payment plan creation with enrollment
- Document viewer functionality
- Status management from UI

---

## 🎯 Tips for Success

1. **Execute in Order**: Tasks have dependencies. Don't skip ahead.
2. **Update Manifest**: Always update manifest after completing each task.
3. **Reference Story Context**: If needed, refer to `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml`
4. **Test as You Go**: Run tests after implementing each task to catch issues early.
5. **Check RLS**: Verify RLS policies work correctly (cross-agency access denied).

---

## 📞 Need Help?

If you encounter issues:
1. Check the manifest for context on what's been completed
2. Review the story context XML file for additional details
3. Verify previous tasks completed successfully before proceeding
4. Check that database migrations ran successfully

---

## 🎉 Completion

After Task 12 (Testing) is complete:
- All 12 tasks marked complete in manifest ✅
- All 6 acceptance criteria verified ✅
- Full test coverage achieved ✅
- Story status updated to "Completed" ✅

**Ready to begin?** Start with `task-1-prompt.md` and follow the sequential execution pattern!

Good luck, anton! 🚀
