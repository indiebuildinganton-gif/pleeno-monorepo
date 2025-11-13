# Story 3-3: Student-College Enrollment Linking
## Task 11: Audit Logging

**Previous Tasks:**
- Tasks 1-10: Complete Enrollment System Implementation - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Implement comprehensive audit logging for all enrollment CRUD operations, including creation, status updates, and offer letter uploads, to maintain a complete history of enrollment changes.

## Subtasks Checklist

- [ ] Add audit log entry on enrollment creation
- [ ] Add audit log entry on enrollment status updates
- [ ] Add audit log entry on offer letter uploads
- [ ] Include user_id, timestamp, entity_type='enrollment', action type
- [ ] Store old and new values for updates in audit_logs table
- [ ] Verify audit logs are written for all enrollment operations
- [ ] Create audit log query utilities for reporting

## Acceptance Criteria

This task addresses:
- **AC (all)**: Audit logging for compliance and tracking

## Key Constraints

1. **Audit Logging**: Log all enrollment CRUD operations to audit_logs table. Include user_id, timestamp, entity_type='enrollment', old/new values.
2. **Comprehensive Coverage**: Log creation, updates, status changes, document uploads

## Implementation Locations

```
apps/payments/app/api/enrollments/route.ts                        # UPDATE: Add audit log on create
apps/entities/app/api/enrollments/[id]/route.ts                   # UPDATE: Add audit log on update
apps/entities/app/api/enrollments/[id]/offer-letter/route.ts     # UPDATE: Add audit log on upload
packages/utils/src/audit-helpers.ts                               # UPDATE: Enrollment audit utilities
```

## Dependencies

- audit_logs table (from previous epics)
- Task 2: Enrollment API routes
- Task 3: Offer letter upload API

## Artifacts & References

**Code References:**
- Existing audit_logs table and helper functions
- Audit logging pattern from previous stories

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 209)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 10 as "Completed" with today's date
2. Add notes about Task 10 (duplicate handling logic working, tests passing)
3. Mark Task 11 as "In Progress" with today's date

---

## Implementation Instructions

1. **Update enrollment creation endpoint**:
   - Add audit log after successful enrollment creation
   - Log: entity_type='enrollment', action='create', new_value=enrollment_data
2. **Update enrollment status endpoint**:
   - Fetch old enrollment data before update
   - Add audit log after successful update
   - Log: entity_type='enrollment', action='update', old_value=old_status, new_value=new_status
3. **Update offer letter upload endpoint**:
   - Add audit log after successful upload
   - Log: entity_type='enrollment_document', action='upload', new_value=document_url
4. **Create audit helper functions** (if needed):
   ```typescript
   // packages/utils/src/audit-helpers.ts
   async function logEnrollmentCreate(enrollment_id, enrollment_data)
   async function logEnrollmentUpdate(enrollment_id, old_data, new_data)
   async function logOfferLetterUpload(enrollment_id, document_url)
   ```
5. **Test audit logging**:
   - Create enrollment, verify audit log entry
   - Update enrollment status, verify audit log with old/new values
   - Upload offer letter, verify audit log entry
6. **Create audit query utilities** (optional):
   - Function to fetch enrollment history
   - Function to fetch document upload history

### Testing

- Test audit log created on enrollment creation
- Test audit log created on status update with old/new values
- Test audit log created on offer letter upload
- Test user_id captured correctly in audit logs
- Test timestamp accuracy in audit logs
- Query audit_logs table to verify all entries

---

## Next Steps

After completing Task 11:
1. ✅ Update manifest.md (mark Task 11 complete, add notes)
2. 📄 Move to `task-12-prompt.md` - Testing (Final Task)
3. 🔄 Continue sequential execution
