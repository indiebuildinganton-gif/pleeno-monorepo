# Story 4.2: Flexible Installment Structure - Prompt Files

**Story ID:** 4.2
**Epic:** 4 - Payment Plans & Commissions
**Status:** ready-for-dev
**Generated:** 2025-11-13

## Overview

This directory contains 13 task-specific prompt files for implementing Story 4.2: Flexible Installment Structure. Each prompt is designed to be copy-pasted into Claude Code Web for sequential execution.

## What This Story Implements

A comprehensive 3-step payment plan wizard that allows education agencies to:

1. **Define flexible installment schedules** (monthly, quarterly, custom)
2. **Configure non-commissionable fees** (materials, admin, other)
3. **Set up dual timelines** (student vs college due dates)
4. **Handle GST calculations** (inclusive vs exclusive)
5. **Preview installments in real-time** before final creation
6. **Create payment plans atomically** (plan + all installments in one transaction)

## User Journey

```
┌──────────────────────────────────────────────────────────────┐
│  Step 1: General Information                                 │
│  ├─ Select student                                           │
│  ├─ Enter course details (name, value, dates)               │
│  └─ Configure commission rate                               │
│                                    ↓                         │
│  Step 2: Payment Structure                                   │
│  ├─ Configure initial payment (optional)                    │
│  ├─ Set number of installments & frequency                  │
│  ├─ Enter non-commissionable fees                          │
│  ├─ Define due date timeline (college + student lead time) │
│  ├─ Set GST preference                                     │
│  └─ View real-time commission summary                      │
│                                    ↓                         │
│  Step 3: Review & Confirmation                              │
│  ├─ Review payment plan summary                            │
│  ├─ Preview installment schedule table                     │
│  ├─ Validate amounts reconcile                             │
│  ├─ Edit previous steps if needed                          │
│  └─ Create payment plan (atomic transaction)               │
└──────────────────────────────────────────────────────────────┘
```

## Prompt Files

### Foundation Layer

1. **`task-01-database-schema-installments.md`**
   - Creates installments table
   - Sets up RLS policies
   - Adds indexes for performance
   - **Time:** 30-45 min

2. **`task-02-payment-plans-extensions.md`**
   - Extends payment_plans table with new columns
   - Supports fees, timeline, GST, frequency
   - **Time:** 20-30 min

3. **`task-03-commission-calculation-functions.md`**
   - SQL functions: calculate_commissionable_value, calculate_expected_commission
   - Database triggers for auto-calculation
   - TypeScript utilities for client-side preview
   - **Time:** 45-60 min

4. **`task-04-due-date-utilities.md`**
   - Date calculation helpers (student vs college due dates)
   - Installment due date generation (monthly/quarterly)
   - **Time:** 30-45 min

### API Layer

5. **`task-05-installment-generation-logic.md`**
   - API endpoint: POST /api/payment-plans/[id]/generate-installments
   - Generates draft installments for preview (doesn't save)
   - **Time:** 45-60 min

9. **`task-09-payment-plan-creation-api.md`**
   - Enhanced POST /api/payment-plans endpoint
   - Atomic creation: payment plan + all installments
   - **Time:** 60-90 min

### UI Layer

6. **`task-06-wizard-step-1.md`**
   - Wizard orchestrator page
   - Step 1: General information form
   - Student selection, course details, commission rate
   - **Time:** 60-90 min

7. **`task-07-wizard-step-2.md`**
   - Step 2: Payment structure form
   - Initial payment, installments, fees, timeline, GST
   - Real-time payment summary component
   - **Time:** 90-120 min

10. **`task-10-installment-table-component.md`**
    - Reusable InstallmentTable component
    - Displays installment schedule with formatting
    - **Time:** 45-60 min

8. **`task-08-wizard-step-3.md`**
   - Step 3: Review & confirmation
   - Summary display + installment table
   - Validation + navigation to edit
   - **Time:** 60-90 min

### Infrastructure

11. **`task-11-validation-schema.md`**
    - Zod schemas for all wizard steps
    - Custom refinements for cross-field validation
    - **Time:** 45-60 min

12. **`task-12-audit-logging.md`**
    - Audit logging for payment plan creation
    - Logs all wizard data and commission calculations
    - **Time:** 30-45 min

### Testing

13. **`task-13-testing.md`**
    - Comprehensive test suite
    - Unit, integration, component, E2E tests
    - **Time:** 120-180 min

## How to Use

### Step 1: Preparation

Before starting, ensure:
- [ ] Story 4.1 (Payment Plan Creation) is complete
- [ ] You have access to Claude Code Web
- [ ] Your development environment is set up
- [ ] You understand the story context

### Step 2: Sequential Execution

1. Open `MANIFEST.md` to track your progress
2. For each task in order:
   - Open the task prompt file
   - Copy the entire contents
   - Paste into Claude Code Web
   - Let Claude Code complete the task
   - Review the implementation
   - Test the functionality
   - Mark task as complete in MANIFEST.md
3. Continue to next task

### Step 3: Testing & Verification

After completing all implementation tasks:
1. Run full test suite (Task 13)
2. Test wizard flow manually in browser
3. Verify commission calculations are correct
4. Check database records (payment plans + installments)
5. Review audit logs
6. Verify RLS policies work

### Step 4: Finalization

- [ ] Mark all tasks complete in MANIFEST.md
- [ ] Update story status to "completed"
- [ ] Create PR (if using git workflow)
- [ ] Request QA review
- [ ] Deploy to staging

## Task Execution Order

**Recommended Sequential Order:**
1 → 2 → 3 → 4 → 5 → 6 → 7 → 10 → 8 → 9 → 11 → 12 → 13

**Critical Dependencies:**
- Task 2 requires Task 1 (database tables)
- Task 3 requires Task 2 (extended schema)
- Task 5 requires Tasks 3, 4 (utilities)
- Task 7 requires Tasks 3, 4 (for real-time calculations)
- Task 8 requires Tasks 7, 10 (wizard flow + table component)
- Task 9 requires Tasks 1-5 (full foundation)
- Task 12 requires Task 9 (API endpoint to log)
- Task 13 requires all previous tasks (testing everything)

## Key Features Implemented

### Multi-Step Wizard
- 3-step flow with state management
- Navigation between steps
- Data persistence across steps
- Validation at each step

### Commission Calculation
- **Commissionable Value** = Total - Materials - Admin - Other
- **Expected Commission** = Commissionable Value × Rate
- GST handling (inclusive vs exclusive)
- Real-time preview

### Dual Timeline Pattern
- **Student Due Date:** When student pays agency
- **College Due Date:** When agency pays college
- **Lead Time Buffer:** Days between student and college payments
- Ensures cash flow management

### Installment Structure
- Initial payment (optional, installment_number = 0)
- Regular installments (numbered 1-N)
- Flexible frequency (monthly, quarterly, custom)
- Auto-generated due dates

### Data Integrity
- Atomic transaction (payment plan + installments)
- Validation: installments sum = total course value
- RLS policies for multi-tenancy
- Audit logging for traceability

## Architecture Highlights

### Database Schema
```
payment_plans (extended from Story 4.1)
  ├─ basic fields (from 4.1)
  ├─ initial_payment_* fields
  ├─ fee fields (materials, admin, other)
  ├─ timeline fields (first_due_date, lead_time)
  ├─ gst_inclusive
  └─ payment_frequency

installments (new table)
  ├─ payment_plan_id (FK)
  ├─ installment_number (0 = initial, 1-N = regular)
  ├─ amount
  ├─ student_due_date
  ├─ college_due_date
  ├─ is_initial_payment
  ├─ generates_commission
  └─ status (draft, pending, paid, overdue, cancelled)
```

### API Endpoints
```
POST /api/payment-plans/[id]/generate-installments
  → Generates draft installments for preview

POST /api/payment-plans
  → Creates payment plan + all installments atomically
```

### UI Components
```
apps/payments/app/plans/new/
  ├── page.tsx (wizard orchestrator)
  └── components/
      ├── PaymentPlanWizardStep1.tsx
      ├── PaymentPlanWizardStep2.tsx
      ├── PaymentPlanWizardStep3.tsx
      ├── PaymentPlanSummary.tsx
      ├── InstallmentTable.tsx
      └── WizardStepper.tsx
```

### Shared Utilities
```
packages/utils/src/
  ├── commission-calculator.ts
  │   ├── calculateCommissionableValue()
  │   └── calculateExpectedCommission()
  └── date-helpers.ts
      ├── calculateStudentDueDate()
      ├── calculateCollegeDueDate()
      └── generateInstallmentDueDates()
```

## Technical Stack

- **Frontend:** React, Next.js 15, TypeScript
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Shadcn UI (Form, Input, Select, DatePicker, Table, Badge, Switch)
- **State Management:** Zustand or useState (wizard state)
- **API:** Next.js API routes
- **Database:** Supabase (PostgreSQL)
- **Date Handling:** date-fns 4.1.0
- **Testing:** Vitest, React Testing Library, Playwright

## Estimated Time

- **Total:** 11-17 hours
- **Foundation:** 2-3 hours
- **API:** 2-3 hours
- **UI:** 4-6 hours
- **Infrastructure:** 1-2 hours
- **Testing:** 2-3 hours

## Success Criteria

Story is complete when:
- [ ] All 13 tasks implemented
- [ ] All tests passing (unit, integration, component, E2E)
- [ ] Wizard flow works end-to-end
- [ ] Commission calculations verified correct
- [ ] Installments created in database
- [ ] Audit logs captured
- [ ] RLS policies enforced
- [ ] Code reviewed (if applicable)

## Troubleshooting

### Database Issues
- Ensure Story 4.1 migrations ran successfully
- Check that payment_plans table exists
- Verify Supabase connection

### API Issues
- Check authentication (JWT token)
- Verify RLS policies allow operations
- Test with Postman/Insomnia before UI integration

### UI Issues
- Verify wizard state management working
- Check form validation rules
- Test real-time calculations with console.log

### Testing Issues
- Set up test database separately
- Use test fixtures for consistent data
- Mock external dependencies

## Related Documentation

- **Story File:** `.bmad-ephemeral/stories/4-2-flexible-installment-structure.md`
- **Context XML:** `.bmad-ephemeral/stories/4-2-flexible-installment-structure.context.xml`
- **Epic:** `docs/epics.md` (Epic 4, Story 4.2)
- **PRD:** `docs/PRD.md` (FR-5.1, FR-5.5)
- **Architecture:** `docs/architecture.md` (Commission Calculation Engine)

## Next Steps

After completing Story 4.2:
1. Proceed to **Story 4.3** (next story in Epic 4)
2. Or integrate with other epics as needed
3. Consider UX improvements based on user feedback

## Support

If you encounter issues:
1. Review task References section
2. Check story context XML
3. Consult architecture documentation
4. Review Story 4.1 implementation for patterns

---

**Good luck with the implementation!** 🚀

Execute tasks sequentially, test thoroughly, and maintain the high quality standards established in previous stories.
