# Story 3-3: Student-College Enrollment Linking
## Task 2: Enrollment API Routes

**Previous Task:** Task 1 (Database Schema Implementation) - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Implement RESTful API routes for enrollment CRUD operations, including creating enrollments, fetching enrollment details, updating enrollment status, and retrieving enrollments for students and branches.

## Subtasks Checklist

- [ ] POST /api/enrollments - Create new enrollment with duplicate check logic
- [ ] GET /api/enrollments/[id] - Get enrollment details with populated student/branch/college data
- [ ] PATCH /api/enrollments/[id] - Update enrollment status (active/completed/cancelled)
- [ ] GET /api/students/[id]/enrollments - Get all enrollments for a student
- [ ] GET /api/branches/[id]/enrollments - Get all enrolled students for a branch
- [ ] Implement error handling and validation for all routes
- [ ] Add audit logging for enrollment operations

## Acceptance Criteria

This task addresses:
- **AC1**: Enrollment Creation via Payment Plan
- **AC4**: Enrollment Status Management
- **AC6**: Duplicate Enrollment Handling

## Key Constraints

1. **Row-Level Security**: All queries automatically filtered by agency_id via RLS
2. **Duplicate Handling**: Check (student_id, branch_id, program_name) before creating enrollment
3. **Foreign Key Relationship**: Enrollment must exist before payment plan creation
4. **Audit Logging**: Log all enrollment CRUD operations to audit_logs table

## Interfaces to Implement

### POST /api/enrollments
```typescript
POST /api/enrollments
Body: { student_id, branch_id, program_name, offer_letter_file? }
Response: { enrollment_id, ...enrollment_data }
```
**Notes**: Handles duplicate check - if (student_id, branch_id, program_name) exists with status='active', reuse enrollment_id.

### GET /api/enrollments/[id]
```typescript
GET /api/enrollments/[id]
Response: { enrollment_id, student, branch, college, program_name, status, offer_letter_url }
```
**Notes**: Returns enrollment with populated student and branch/college data.

### PATCH /api/enrollments/[id]
```typescript
PATCH /api/enrollments/[id]
Body: { status: 'completed' | 'cancelled' }
Response: { enrollment_id, status }
```
**Notes**: Updates enrollment status. Logs change to audit_logs.

### GET /api/students/[id]/enrollments
```typescript
GET /api/students/[id]/enrollments
Response: { enrollments: [...] }
```

### GET /api/branches/[id]/enrollments
```typescript
GET /api/branches/[id]/enrollments
Response: { enrollments: [...] }
```

## Implementation Locations

```
apps/payments/app/api/enrollments/route.ts              # NEW: POST /api/enrollments
apps/entities/app/api/enrollments/[id]/route.ts         # NEW: GET, PATCH /api/enrollments/[id]
apps/entities/app/api/students/[id]/enrollments/route.ts  # NEW: GET student enrollments
apps/entities/app/api/branches/[id]/enrollments/route.ts  # NEW: GET branch enrollments
```

## Dependencies

- Task 1: Database schema (enrollments table, RLS policies)
- Supabase client from `@supabase/supabase-js`
- TanStack Query for data fetching
- Zod for request validation

## Artifacts & References

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 213-283)

---

## 📋 Update Manifest

**Before starting**, update the manifest at `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 1 as "Completed" with today's date
2. Add notes about Task 1 (migration files created, tables confirmed)
3. Mark Task 2 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create API route files** in the specified locations
2. **Implement POST /api/enrollments** with duplicate check logic using findOrCreateEnrollment helper
3. **Implement GET /api/enrollments/[id]** with Supabase joins for student/branch data
4. **Implement PATCH /api/enrollments/[id]** for status updates with audit logging
5. **Implement GET /api/students/[id]/enrollments** to fetch all enrollments for a student
6. **Implement GET /api/branches/[id]/enrollments** to fetch enrolled students for a branch
7. **Add Zod schemas** for request validation
8. **Test all routes** with curl or API client

### Testing

- Test POST creates new enrollment
- Test POST reuses existing active enrollment (duplicate check)
- Test GET returns correct enrollment data with joins
- Test PATCH updates status and logs to audit_logs
- Test student/branch enrollment lists return correct data
- Verify RLS enforces agency isolation

---

## Next Steps

After completing Task 2:
1. ✅ Update manifest.md (mark Task 2 complete, add notes)
2. 📄 Move to `task-3-prompt.md` - Offer Letter Upload API
3. 🔄 Continue sequential execution
