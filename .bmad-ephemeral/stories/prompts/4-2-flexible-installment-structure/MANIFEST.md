# Story 4.2: Flexible Installment Structure - Task Execution Manifest

**Generated:** 2025-11-13
**Story Status:** ready-for-dev
**Total Tasks:** 13

## Execution Order

Execute these tasks sequentially in Claude Code Web. Copy-paste each prompt file in order, complete the task, then mark it done before proceeding to the next.

## Task List

### Foundation Layer (Database & Utilities)

- [ ] **Task 1: Database Schema - Installments Table**
  - File: `task-01-database-schema-installments.md`
  - Dependencies: Story 4.1 (payment_plans table)
  - Creates: installments table with RLS
  - Estimated Time: 30-45 minutes
  - Status: pending

- [ ] **Task 2: Database Schema - Payment Plans Extensions**
  - File: `task-02-payment-plans-extensions.md`
  - Dependencies: Task 1
  - Creates: New columns on payment_plans table
  - Estimated Time: 20-30 minutes
  - Status: pending

- [ ] **Task 3: Commission Calculation Functions**
  - File: `task-03-commission-calculation-functions.md`
  - Dependencies: Task 2
  - Creates: SQL functions, triggers, TypeScript utilities
  - Estimated Time: 45-60 minutes
  - Status: pending

- [ ] **Task 4: Due Date Calculation Utilities**
  - File: `task-04-due-date-utilities.md`
  - Dependencies: None (standalone utility)
  - Creates: TypeScript date helper functions
  - Estimated Time: 30-45 minutes
  - Status: pending

### API Layer

- [ ] **Task 5: Installment Generation Logic**
  - File: `task-05-installment-generation-logic.md`
  - Dependencies: Tasks 3, 4
  - Creates: POST /api/payment-plans/[id]/generate-installments
  - Estimated Time: 45-60 minutes
  - Status: pending

- [ ] **Task 9: Payment Plan Creation with Installments**
  - File: `task-09-payment-plan-creation-api.md`
  - Dependencies: Tasks 1, 2, 3, 5
  - Creates: Enhanced POST /api/payment-plans endpoint
  - Estimated Time: 60-90 minutes
  - Status: pending

### UI Layer - Wizard Components

- [ ] **Task 6: Multi-Step Payment Plan Wizard - Step 1**
  - File: `task-06-wizard-step-1.md`
  - Dependencies: None (UI only)
  - Creates: Wizard page + Step 1 component
  - Estimated Time: 60-90 minutes
  - Status: pending

- [ ] **Task 7: Multi-Step Payment Plan Wizard - Step 2**
  - File: `task-07-wizard-step-2.md`
  - Dependencies: Tasks 3, 4, 6
  - Creates: Step 2 component + real-time summary
  - Estimated Time: 90-120 minutes
  - Status: pending

- [ ] **Task 10: Installment Table Component**
  - File: `task-10-installment-table-component.md`
  - Dependencies: None (reusable component)
  - Creates: InstallmentTable component
  - Estimated Time: 45-60 minutes
  - Status: pending

- [ ] **Task 8: Multi-Step Payment Plan Wizard - Step 3**
  - File: `task-08-wizard-step-3.md`
  - Dependencies: Tasks 7, 10
  - Creates: Step 3 review & confirmation component
  - Estimated Time: 60-90 minutes
  - Status: pending

### Validation & Infrastructure

- [ ] **Task 11: Validation Schema**
  - File: `task-11-validation-schema.md`
  - Dependencies: None (validation rules)
  - Creates: Zod schemas for all wizard steps
  - Estimated Time: 45-60 minutes
  - Status: pending

- [ ] **Task 12: Audit Logging**
  - File: `task-12-audit-logging.md`
  - Dependencies: Task 9
  - Creates: Audit logging for payment plan creation
  - Estimated Time: 30-45 minutes
  - Status: pending

### Testing

- [ ] **Task 13: Testing**
  - File: `task-13-testing.md`
  - Dependencies: All previous tasks
  - Creates: Comprehensive test suite
  - Estimated Time: 120-180 minutes
  - Status: pending

## Execution Notes

### Recommended Execution Strategy

**Phase 1: Database Foundation (Tasks 1-4)**
Complete all database and utility tasks first. These are foundational and don't have UI dependencies.

**Phase 2: API Layer (Tasks 5, 9)**
Implement API endpoints. Task 5 can be done before or after UI, but Task 9 should be done after wizard UI is complete.

**Phase 3: UI Layer (Tasks 6, 7, 10, 8)**
Build wizard components in order. Task 10 can be done in parallel with Tasks 6-7 or before Task 8.

**Phase 4: Infrastructure (Tasks 11, 12)**
Validation can be done anytime. Audit logging should be done after Task 9.

**Phase 5: Testing (Task 13)**
Complete after all implementation tasks.

### Parallel Execution Opportunities

If working with multiple AI agents or developers:
- **Group A:** Tasks 1-4 (database + utilities)
- **Group B:** Tasks 6, 7, 10 (UI components)
- **Group C:** Task 11 (validation schemas)

Then merge and continue with Tasks 5, 8, 9, 12, 13 sequentially.

### Task Dependencies Graph

```
Task 1 (Installments Table)
  ↓
Task 2 (Payment Plans Extensions)
  ↓
Task 3 (Commission Functions) ←─────┐
  ↓                                  │
Task 5 (Generate API) ───────────────┤
  ↓                                  │
Task 9 (Create API)                  │
  ↓                                  │
Task 12 (Audit Logging)              │
                                     │
Task 4 (Date Helpers) ───────────────┤
  ↓                                  │
Task 7 (Wizard Step 2) ←─────────────┘
  ↓
Task 8 (Wizard Step 3) ←── Task 10 (Installment Table)
  ↓
Task 13 (Testing) ←── Task 11 (Validation)

Task 6 (Wizard Step 1) ──→ Task 7
```

## Progress Tracking

### Completion Status

- [ ] 0/13 tasks completed
- [ ] 0% progress

### Time Estimates

- **Foundation Layer:** 2-3 hours (Tasks 1-4)
- **API Layer:** 2-3 hours (Tasks 5, 9)
- **UI Layer:** 4-6 hours (Tasks 6-8, 10)
- **Infrastructure:** 1-2 hours (Tasks 11-12)
- **Testing:** 2-3 hours (Task 13)

**Total Estimated Time:** 11-17 hours

### Checkpoints

Mark these milestones as you complete them:

- [ ] **Checkpoint 1:** Database schema complete (Tasks 1-2)
- [ ] **Checkpoint 2:** Utilities complete (Tasks 3-4)
- [ ] **Checkpoint 3:** API endpoints complete (Tasks 5, 9)
- [ ] **Checkpoint 4:** Wizard UI complete (Tasks 6-8, 10)
- [ ] **Checkpoint 5:** Validation & audit complete (Tasks 11-12)
- [ ] **Checkpoint 6:** All tests passing (Task 13)
- [ ] **Checkpoint 7:** Story ready for QA

## Testing Strategy

After each checkpoint, run relevant tests:

- **After Checkpoint 1:** Test database migrations
- **After Checkpoint 2:** Run utility unit tests
- **After Checkpoint 3:** Run API integration tests
- **After Checkpoint 4:** Run component tests
- **After Checkpoint 5:** Run validation tests
- **After Checkpoint 6:** Run full E2E test suite

## Troubleshooting

### Common Issues

1. **Database migration fails:** Check that Story 4.1 payment_plans table exists
2. **API tests fail:** Ensure test database is set up with correct schema
3. **Wizard navigation broken:** Verify wizard state management is working
4. **Commission calculations wrong:** Double-check GST handling logic
5. **RLS policies blocking queries:** Verify agency_id is set correctly in JWT

### Getting Help

If stuck on a task:
1. Review the task's References section
2. Check the story context XML file
3. Review related documentation (PRD, Architecture)
4. Consult previous task implementations

## Final Verification

Before marking story complete:

- [ ] All 13 tasks completed
- [ ] All tests passing (unit, integration, component, E2E)
- [ ] Database migrations run successfully
- [ ] Wizard flow works end-to-end in dev environment
- [ ] Commission calculations verified correct
- [ ] Audit logs created for test payment plans
- [ ] RLS policies tested and working
- [ ] Code reviewed (if applicable)
- [ ] Documentation updated (if needed)

## Notes

Use this manifest to track your progress through Story 4.2. Update the checkboxes as you complete each task and checkpoint.

**Next Steps After Completion:**
1. Mark story as "completed" in story file
2. Create PR (if using git workflow)
3. Request QA review
4. Deploy to staging environment
5. Proceed to Story 4.3 or next story in Epic 4
