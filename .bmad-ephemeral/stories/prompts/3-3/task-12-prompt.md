# Story 3-3: Student-College Enrollment Linking
## Task 12: Testing (Final Task)

**Previous Tasks:**
- Tasks 1-11: Complete Enrollment System with Audit Logging - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Comprehensive testing of the entire enrollment system including unit tests, integration tests, E2E tests, and RLS policy verification to ensure all acceptance criteria are met and the system is production-ready.

## Subtasks Checklist

- [ ] Unit tests for enrollment-helpers utility functions
- [ ] Unit tests for file upload validation
- [ ] Integration tests for enrollment API endpoints
- [ ] Integration tests for payment plan → enrollment flow
- [ ] E2E test for full payment plan creation with enrollment
- [ ] E2E test for document viewer functionality
- [ ] RLS policy tests (cross-agency access denial)
- [ ] Performance tests for enrollment queries
- [ ] Verify all acceptance criteria are met

## Acceptance Criteria

This task verifies:
- **AC1**: Enrollment Creation via Payment Plan ✅
- **AC2**: Enrollment Display and Navigation ✅
- **AC3**: Multiple Enrollment Support ✅
- **AC4**: Enrollment Status Management ✅
- **AC5**: Document Management ✅
- **AC6**: Duplicate Enrollment Handling ✅

## Test Coverage Requirements

1. **Unit Tests**: enrollment-helpers, file-upload utilities, validation schemas
2. **Integration Tests**: All API endpoints, RLS policies, duplicate handling
3. **E2E Tests**: Payment plan creation flow, document viewer, status management
4. **Performance Tests**: Query performance with large datasets
5. **Security Tests**: RLS enforcement, file upload validation

## Test Locations

```
packages/utils/src/__tests__/enrollment-helpers.test.ts           # Unit tests
packages/utils/src/__tests__/file-upload.test.ts                  # Unit tests
apps/entities/__tests__/enrollments-api.test.ts                   # Integration tests
apps/payments/__tests__/payment-plan-enrollment-integration.test.ts  # Integration tests
__tests__/e2e/enrollment-creation-flow.spec.ts                    # E2E tests
```

## Test Ideas (from Story Context)

### Unit & Integration Tests

1. **Enrollment creation via payment plan** - verify enrollment record created with correct student/branch/program
2. **Duplicate enrollment handling** - create enrollment twice with same student-branch-program, verify second reuses first
3. **Cancelled enrollment re-enrollment** - create enrollment, cancel it, create again with same combo, verify new enrollment created
4. **Offer letter upload** - upload PDF, verify stored in correct path, metadata saved in table
5. **Offer letter upload validation** - try invalid file types (DOC, TXT), oversized file (>10MB), verify rejected
6. **Offer letter download** - upload document, download via API, verify correct Content-Type headers
7. **Student enrollments list** - create multiple enrollments for student, fetch via API, verify all returned
8. **Branch enrollments list** - create enrollments for multiple students at same branch, verify all returned
9. **Enrollment status update** - change status from active to completed, verify saved and logged in audit_logs
10. **Multiple enrollments per student** - create 3 enrollments for same student (different colleges/programs), verify all accessible
11. **RLS policies** - create agency A enrollment, attempt access from agency B user, verify forbidden
12. **RLS on storage** - upload offer letter for agency A, attempt download from agency B user, verify forbidden

### E2E Tests

1. **Full payment plan creation flow** - select student, college/branch, upload offer letter, save plan, verify enrollment created
2. **Document viewer** - click "View Offer Letter" on student detail page, verify PDF opens in modal with maximize option

## Dependencies

- All previous tasks (1-11)
- Vitest for unit/integration tests
- React Testing Library for component tests
- Playwright for E2E tests
- Test database with sample data

## Artifacts & References

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 285-310)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 11 as "Completed" with today's date
2. Add notes about Task 11 (audit logging complete, all operations tracked)
3. Mark Task 12 as "In Progress" with today's date

---

## Implementation Instructions

### Phase 1: Unit Tests

1. **Test enrollment-helpers.ts**:
   - Test findOrCreateEnrollment with no existing enrollment
   - Test findOrCreateEnrollment with existing active enrollment
   - Test findOrCreateEnrollment with existing cancelled enrollment
   - Test findOrCreateEnrollment with existing completed enrollment
2. **Test file-upload utilities**:
   - Test uploadOfferLetter with valid PDF
   - Test uploadOfferLetter with valid image
   - Test file type validation rejection
   - Test file size validation rejection

### Phase 2: Integration Tests

3. **Test enrollment APIs**:
   - POST /api/enrollments - create new enrollment
   - POST /api/enrollments - duplicate handling
   - GET /api/enrollments/[id] - fetch with joins
   - PATCH /api/enrollments/[id] - status update
   - GET /api/students/[id]/enrollments - student list
   - GET /api/branches/[id]/enrollments - branch list
4. **Test offer letter APIs**:
   - POST /api/enrollments/[id]/offer-letter - upload
   - GET /api/enrollments/[id]/offer-letter - download
5. **Test RLS policies**:
   - Verify cross-agency enrollment access denied
   - Verify cross-agency storage access denied
6. **Test payment plan integration**:
   - Full flow: create payment plan with enrollment
   - Verify enrollment_id linked correctly

### Phase 3: E2E Tests

7. **E2E: Payment plan creation**:
   - Navigate to payment plan wizard
   - Select student from dropdown
   - Select college/branch from dropdown
   - Enter program name
   - Upload offer letter
   - Save payment plan
   - Verify enrollment created
   - Verify enrollment visible on student detail page
8. **E2E: Document viewer**:
   - Navigate to student detail page
   - Click "View Offer Letter"
   - Verify DocumentViewer modal opens
   - Verify PDF/image displays
   - Test maximize button
   - Test download button
   - Test close button

### Phase 4: Verification

9. **Verify all acceptance criteria**:
   - Go through each AC and verify with tests
   - Document any gaps or issues
10. **Performance tests** (optional):
    - Test query performance with 1000+ enrollments
    - Test concurrent enrollment creation
11. **Run full test suite**:
    ```bash
    # Unit tests
    npm test packages/utils/src/__tests__/enrollment-helpers.test.ts
    npm test packages/utils/src/__tests__/file-upload.test.ts

    # Integration tests
    npm test apps/entities/__tests__/enrollments-api.test.ts
    npm test apps/payments/__tests__/payment-plan-enrollment-integration.test.ts

    # E2E tests
    npx playwright test __tests__/e2e/enrollment-creation-flow.spec.ts
    ```

### Testing Checklist

- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] RLS policies verified
- [ ] File upload validation working
- [ ] Duplicate handling working
- [ ] Status management working
- [ ] Audit logging working
- [ ] All acceptance criteria verified

---

## 🎉 Final Steps

After completing Task 12:

1. ✅ Update manifest.md:
   - Mark Task 12 as "Completed" with today's date
   - Mark Story Status as "Completed"
   - Add final implementation notes
2. 📋 Final Verification:
   - All 6 acceptance criteria met ✅
   - All 12 tasks complete ✅
   - All tests passing ✅
   - Audit logging in place ✅
3. 🚀 **Story 3-3 is COMPLETE!**

---

## Congratulations!

You've successfully implemented the Student-College Enrollment Linking feature! 🎊

**Summary of what was built:**
- ✅ Enrollment database schema with RLS
- ✅ Complete REST API for enrollment CRUD
- ✅ Offer letter upload/download with storage
- ✅ Payment plan integration
- ✅ Student and college detail page sections
- ✅ Document viewer component
- ✅ Status management UI
- ✅ Duplicate enrollment handling
- ✅ Comprehensive audit logging
- ✅ Full test coverage

**Next Story:** Move on to the next story in Epic 3 or Epic 4!
