# Story 3-3: Student-College Enrollment Linking
## Task 10: Duplicate Enrollment Handling Logic

**Previous Tasks:**
- Tasks 1-9: Database, APIs, UI Components, Status Management - COMPLETED ✅

**Story Context:**
- **As a** Agency User
- **I want** to link students to their enrolled colleges through payment plan creation with supporting documentation
- **So that** I can track where each student is studying, store official offer letters, and manage payments for multiple enrollments

---

## Task Description

Implement and test the duplicate enrollment handling logic in the findOrCreateEnrollment utility function to prevent duplicate enrollments while supporting multiple payment plans per enrollment.

## Subtasks Checklist

- [ ] Implement findOrCreateEnrollment function in enrollment-helpers.ts
- [ ] Check for existing enrollment by (student_id, branch_id, program_name)
- [ ] If found with status='active', return existing enrollment_id
- [ ] If found with status='cancelled', create new enrollment
- [ ] If not found, create new enrollment
- [ ] Add unit tests for all duplicate scenarios
- [ ] Add integration tests for payment plan → enrollment flow
- [ ] Document function behavior with examples

## Acceptance Criteria

This task addresses:
- **AC6**: Duplicate Enrollment Handling (reuse enrollment if exists, create new otherwise)

## Key Constraints

1. **Composite Uniqueness**: Check (student_id, branch_id, program_name) combination
2. **Status-Based Logic**: Reuse 'active' enrollments, create new for 'cancelled'
3. **Multiple Payment Plans**: Same enrollment can be linked to multiple payment plans

## Function to Implement

### findOrCreateEnrollment
```typescript
// packages/utils/src/enrollment-helpers.ts
async function findOrCreateEnrollment(
  student_id: string,
  branch_id: string,
  program_name: string
): Promise<string> // returns enrollment_id
```

**Notes**: Checks if enrollment exists. If found with status='active', returns existing id. If 'cancelled', creates new. If not found, creates new.

## Implementation Location

```
packages/utils/src/enrollment-helpers.ts                           # NEW: Enrollment helper functions
packages/utils/src/__tests__/enrollment-helpers.test.ts            # NEW: Unit tests
apps/payments/__tests__/payment-plan-enrollment-integration.test.ts  # NEW: Integration tests
```

## Dependencies

- Task 1: enrollments table with unique constraint
- Task 2: POST /api/enrollments endpoint
- Supabase client
- Vitest for testing

## Artifacts & References

**Code References:**
- `packages/utils/src/enrollment-helpers.ts` (lines new) - NEW utility function

**Story Context:** `.bmad-ephemeral/stories/3-3-student-college-enrollment-linking.context.xml` (lines 263-268)

---

## 📋 Update Manifest

**Before starting**, update `.bmad-ephemeral/stories/prompts/3-3/MANIFEST.md`:

1. Mark Task 9 as "Completed" with today's date
2. Add notes about Task 9 (status management UI working, confirmations added)
3. Mark Task 10 as "In Progress" with today's date

---

## Implementation Instructions

1. **Create enrollment-helpers.ts**:
   - Export `findOrCreateEnrollment` function
   - Use Supabase client to query enrollments table
   - Query: `WHERE student_id = $1 AND branch_id = $2 AND program_name = $3`
2. **Implement logic**:
   ```typescript
   // Pseudocode
   const existing = await supabase
     .from('enrollments')
     .select('id, status')
     .match({ student_id, branch_id, program_name })
     .single()

   if (existing && existing.status === 'active') {
     return existing.id  // Reuse active enrollment
   }

   // Create new enrollment (not found or cancelled)
   const newEnrollment = await supabase
     .from('enrollments')
     .insert({ student_id, branch_id, program_name, status: 'active' })
     .select('id')
     .single()

   return newEnrollment.id
   ```
3. **Write unit tests**:
   - Test: New enrollment created when none exists
   - Test: Existing active enrollment reused
   - Test: New enrollment created when existing is cancelled
   - Test: New enrollment created when existing is completed
4. **Write integration tests**:
   - Test: Create payment plan with new student-branch-program
   - Test: Create second payment plan with same student-branch-program (reuses enrollment)
   - Test: Create payment plan after cancelling enrollment (creates new)
5. **Update PaymentPlanWizard** (if needed):
   - Ensure it calls findOrCreateEnrollment before creating payment plan
6. **Document function**:
   - Add JSDoc comments
   - Include usage examples

### Testing

- Test duplicate enrollment detection (same student-branch-program)
- Test active enrollment reuse
- Test cancelled enrollment doesn't prevent new enrollment
- Test multiple payment plans can link to same enrollment
- Test concurrent enrollment creation (race conditions)
- Integration test: Full payment plan creation flow with duplicates

---

## Next Steps

After completing Task 10:
1. ✅ Update manifest.md (mark Task 10 complete, add notes)
2. 📄 Move to `task-11-prompt.md` - Audit Logging
3. 🔄 Continue sequential execution
