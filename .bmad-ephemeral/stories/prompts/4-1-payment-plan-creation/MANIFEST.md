# Story 4.1: Payment Plan Creation - Task Execution Manifest

## Story Information

- **Story ID**: 4.1
- **Epic**: 4 - Payment Plan Engine
- **Title**: Payment Plan Creation
- **Status**: ready-for-dev
- **Story File**: [4-1-payment-plan-creation.md](../../4-1-payment-plan-creation.md)
- **Context File**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)

## Task Execution Tracking

### Task 1: Database Schema Implementation
- **Status**: ⏳ Not Started
- **Prompt File**: [task-01-database-schema.md](./task-01-database-schema.md)
- **Depends On**: Story 3.3 (enrollments table)
- **Blocks**: Task 2, Task 3
- **Estimated Effort**: 2 hours
- **Files to Create**:
  - `supabase/migrations/003_payments_domain/001_payment_plans_schema.sql`
- **Notes**:

---

### Task 2: Commission Calculation Function
- **Status**: ⏳ Not Started
- **Prompt File**: [task-02-commission-calculation.md](./task-02-commission-calculation.md)
- **Depends On**: Task 1
- **Blocks**: Task 5
- **Estimated Effort**: 1.5 hours
- **Files to Create**:
  - `supabase/migrations/003_payments_domain/002_payment_plans_triggers.sql`
  - `packages/utils/src/commission-calculator.ts`
  - `packages/utils/src/commission-calculator.test.ts`
- **Notes**:

---

### Task 3: Payment Plan API Routes
- **Status**: ⏳ Not Started
- **Prompt File**: [task-03-api-routes.md](./task-03-api-routes.md)
- **Depends On**: Task 1, Task 2
- **Blocks**: Task 4, Task 6
- **Estimated Effort**: 3 hours
- **Files to Create**:
  - `apps/payments/app/api/payment-plans/route.ts`
  - `apps/payments/app/api/payment-plans/[id]/route.ts`
- **Notes**:

---

### Task 4: Payment Plan Form Component
- **Status**: ⏳ Not Started
- **Prompt File**: [task-04-payment-plan-form.md](./task-04-payment-plan-form.md)
- **Depends On**: Task 3, Task 7
- **Blocks**: Task 6
- **Estimated Effort**: 3 hours
- **Files to Create**:
  - `apps/payments/app/plans/new/page.tsx`
  - `apps/payments/app/plans/new/components/PaymentPlanForm.tsx`
  - `packages/validations/src/payment-plan.schema.ts`
- **Notes**:

---

### Task 5: Real-Time Commission Preview
- **Status**: ⏳ Not Started
- **Prompt File**: [task-05-commission-preview.md](./task-05-commission-preview.md)
- **Depends On**: Task 2
- **Used By**: Task 4
- **Estimated Effort**: 1.5 hours
- **Files to Create**:
  - `apps/payments/app/plans/new/components/PaymentPlanSummary.tsx`
  - `packages/utils/src/formatters.ts` (if doesn't exist)
- **Notes**:

---

### Task 6: Payment Plan Creation Mutation
- **Status**: ⏳ Not Started
- **Prompt File**: [task-06-creation-mutation.md](./task-06-creation-mutation.md)
- **Depends On**: Task 3, Task 4
- **Blocks**: None
- **Estimated Effort**: 2 hours
- **Files to Create**:
  - `apps/payments/hooks/useCreatePaymentPlan.ts`
- **Notes**:

---

### Task 7: Enrollment Dropdown Component
- **Status**: ⏳ Not Started
- **Prompt File**: [task-07-enrollment-dropdown.md](./task-07-enrollment-dropdown.md)
- **Depends On**: Story 3.3 (enrollments API)
- **Used By**: Task 4
- **Estimated Effort**: 2 hours
- **Files to Create**:
  - `apps/payments/app/plans/new/components/EnrollmentSelect.tsx`
  - `apps/payments/hooks/useEnrollments.ts`
- **Notes**:

---

### Task 8: Payment Plan Status Enum
- **Status**: ⏳ Not Started
- **Prompt File**: [task-08-status-enum.md](./task-08-status-enum.md)
- **Depends On**: Task 1
- **Used By**: Task 4, Task 6
- **Estimated Effort**: 1 hour
- **Files to Create**:
  - `supabase/migrations/003_payments_domain/003_payment_plans_status.sql`
  - `apps/payments/components/PaymentPlanStatusBadge.tsx`
- **Notes**:

---

### Task 9: Audit Logging
- **Status**: ⏳ Not Started
- **Prompt File**: [task-09-audit-logging.md](./task-09-audit-logging.md)
- **Depends On**: Task 3
- **Blocks**: None
- **Estimated Effort**: 1.5 hours
- **Files to Modify**:
  - `apps/payments/app/api/payment-plans/route.ts`
- **Files to Create** (if doesn't exist):
  - `packages/utils/src/audit-logger.ts`
- **Notes**:

---

### Task 10: Testing
- **Status**: ⏳ Not Started
- **Prompt File**: [task-10-testing.md](./task-10-testing.md)
- **Depends On**: All previous tasks
- **Blocks**: None
- **Estimated Effort**: 4 hours
- **Files to Create**:
  - `__tests__/integration/payment-plans.test.ts`
  - `__tests__/e2e/payment-plan-creation.spec.ts`
  - `apps/payments/components/__tests__/EnrollmentSelect.test.tsx`
- **Notes**:

---

## Progress Summary

- **Total Tasks**: 10
- **Completed**: 0
- **In Progress**: 0
- **Not Started**: 10
- **Blocked**: 0

## Execution Order

### Phase 1: Foundation (Tasks 1-3, 8)
Execute these tasks first as they establish the database schema and core API:
1. Task 1: Database Schema Implementation
2. Task 8: Payment Plan Status Enum (can run parallel with Task 2)
3. Task 2: Commission Calculation Function
4. Task 3: Payment Plan API Routes

### Phase 2: UI Components (Tasks 5, 7)
Execute these tasks to build reusable UI components:
5. Task 5: Real-Time Commission Preview (can run parallel with Task 7)
6. Task 7: Enrollment Dropdown Component

### Phase 3: Form & Mutation (Tasks 4, 6)
Execute these tasks to complete the creation flow:
7. Task 4: Payment Plan Form Component
8. Task 6: Payment Plan Creation Mutation

### Phase 4: Enhancement & Testing (Tasks 9, 10)
Execute these tasks to add audit logging and comprehensive testing:
9. Task 9: Audit Logging
10. Task 10: Testing

## Notes

- Each task prompt file contains detailed implementation notes, code examples, and testing checklists
- Follow the execution order above to minimize dependencies and blockers
- Update task status in this manifest as you complete each task
- Refer to the story context file for comprehensive requirements and constraints

## Status Legend

- ⏳ Not Started
- 🔄 In Progress
- ✅ Completed
- ⛔ Blocked
- ⚠️ Issues/Concerns
