# Story 4.2: Flexible Installment Structure

Status: ready-for-dev

## Story

As an **Agency User**,
I want **to define flexible installment schedules for each payment plan**,
So that **I can accommodate different payment arrangements (monthly, quarterly, custom) with separate commission and non-commission fees**.

## Acceptance Criteria

### Step 1: General Information

1. **Student and Enrollment Selection**
   - Select a student from a dropdown pre-populated with agency's students
   - College/branch is automatically assigned from the student's branch
   - Enter or select a course name
   - Enter the total course value
   - Enter the commission rate (0-1 decimal format, e.g., 0.15 for 15%)
   - See helper text showing example rates (0.1 = 10%, 0.3 = 30%)
   - Select course start date
   - Select course end date
   - Proceed to Step 2 when all required fields are completed

### Step 2: Payment Structure

2. **Initial Payment Configuration**
   - Enter an initial payment amount (separate from installments)
   - Specify an initial payment due date
   - Toggle "Has the initial payment already been paid?" to mark it as paid immediately
   - Initial payment is installment_number = 0

3. **Installment Configuration**
   - Enter number of installments (e.g., 11)
   - Select payment frequency from dropdown: Monthly, Quarterly, or Custom
   - For Monthly/Quarterly: system auto-calculates installment amounts and due dates based on course dates
   - For Custom: manually configure each installment

4. **Non-Commissionable Fees**
   - Enter optional Non-Commissionable Fees in separate fields:
     - Materials Cost
     - Admin Fees
     - Other Fees
   - These fees are excluded from commission calculations

5. **Real-Time Payment Summary**
   - Display a real-time Payment Summary showing:
     - Total Commission (in green, calculated from commissionable value)
     - Remaining after initial payment
     - Amount per installment
   - Summary updates as user enters values

6. **Due Date Configuration**
   - Enter First Installment College Due Date (drives college payment schedule)
   - Enter Student Lead Time in days (how many days before college due date the student must pay)
   - System auto-calculates student due dates as: `college_due_date - student_lead_time`
   - Both student_due_date and college_due_date are stored for each installment

7. **GST Handling**
   - Toggle GST Inclusive to indicate whether amounts include GST
   - GST status affects commission calculation base

### Step 3: Review & Confirmation

8. **Summary Display**
   - See a Summary section displaying:
     - Selected Student
     - Course
     - Total Value
     - Total Commission (green highlight)
     - Commission Rate
     - GST Inclusive status

9. **Installment Schedule Table**
   - See an Installment Schedule table showing:
     - Initial Payment row with amount, student due date, college due date, and paid status badge
     - Rows for each installment (Installment 1, 2, 3...) showing:
       - Amount
       - Student due date
       - College due date
       - Draft status dropdown
   - Commission-eligible amounts are styled/calculated separately from non-commissionable fees

10. **Validation and Confirmation**
    - The sum of (initial payment + all installments) equals the total course value including any non-commissionable fees
    - Receive validation warnings if amounts don't reconcile
    - Navigate back to edit installment structure before final confirmation
    - Final save creates payment plan with all installments

## Tasks / Subtasks

- [ ] **Task 1: Database Schema - Installments Table** (AC: 2, 3, 6, 9)
  - [ ] Create `installments` table: id, payment_plan_id (FK), agency_id (FK), installment_number (0 for initial, 1-N for installments), amount (decimal), student_due_date, college_due_date, is_initial_payment BOOLEAN, generates_commission BOOLEAN, status ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled'), paid_date, paid_amount, created_at, updated_at
  - [ ] Add foreign key constraint: payment_plan_id → payment_plans(id) ON DELETE CASCADE
  - [ ] Add CHECK constraint: installment_number >= 0
  - [ ] Add CHECK constraint: amount > 0
  - [ ] Add NOT NULL constraints on: payment_plan_id, agency_id, installment_number, amount, generates_commission, status
  - [ ] Enable RLS policies on installments table filtering by agency_id
  - [ ] Create indexes on (payment_plan_id, installment_number) and (agency_id, status) for performance

- [ ] **Task 2: Database Schema - Payment Plans Extensions** (AC: 4, 6, 7)
  - [ ] Add columns to `payment_plans` table:
    - initial_payment_amount DECIMAL
    - initial_payment_due_date DATE
    - initial_payment_paid BOOLEAN DEFAULT false
    - materials_cost DECIMAL DEFAULT 0
    - admin_fees DECIMAL DEFAULT 0
    - other_fees DECIMAL DEFAULT 0
    - first_college_due_date DATE
    - student_lead_time_days INT
    - gst_inclusive BOOLEAN DEFAULT true
    - number_of_installments INT
    - payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'custom'))
  - [ ] Create migration to add these columns with proper defaults
  - [ ] Update existing payment plans to have default values

- [ ] **Task 3: Commission Calculation Functions** (AC: 4, 5, 9)
  - [ ] Create SQL function: `calculate_commissionable_value(total_value, materials, admin, other) RETURNS DECIMAL`
    - Formula: `total_value - materials - admin - other`
  - [ ] Create SQL function: `calculate_expected_commission(commissionable_value, commission_rate, gst_inclusive) RETURNS DECIMAL`
    - If gst_inclusive: base = commissionable_value
    - If not gst_inclusive: base = commissionable_value / 1.10
    - Formula: `base * commission_rate`
  - [ ] Create database trigger to auto-update commissionable_value and expected_commission on payment_plans INSERT/UPDATE
  - [ ] Add TypeScript utility functions in `packages/utils/src/commission-calculator.ts` for client-side preview:
    - `calculateCommissionableValue()`
    - `calculateExpectedCommission()`

- [ ] **Task 4: Due Date Calculation Utilities** (AC: 6)
  - [ ] Create TypeScript utility in `packages/utils/src/date-helpers.ts`:
    - `calculateStudentDueDate(collegeDueDate: Date, studentLeadTimeDays: number): Date`
      - Formula: `subDays(collegeDueDate, studentLeadTimeDays)`
    - `calculateCollegeDueDate(studentDueDate: Date, studentLeadTimeDays: number): Date`
      - Formula: `addDays(studentDueDate, studentLeadTimeDays)`
    - `generateInstallmentDueDates(firstDueDate: Date, count: number, frequency: 'monthly' | 'quarterly'): Date[]`
      - Monthly: add 1 month per installment
      - Quarterly: add 3 months per installment

- [ ] **Task 5: Installment Generation Logic** (AC: 3, 5, 6, 9)
  - [ ] Create API route: POST /api/payment-plans/[id]/generate-installments
  - [ ] Accept request body:
    ```typescript
    {
      initial_payment_amount: number
      initial_payment_due_date: Date
      initial_payment_paid: boolean
      number_of_installments: number
      payment_frequency: 'monthly' | 'quarterly' | 'custom'
      first_college_due_date: Date
      student_lead_time_days: number
      materials_cost: number
      admin_fees: number
      other_fees: number
      gst_inclusive: boolean
    }
    ```
  - [ ] Calculate commissionable_value = total_course_value - materials_cost - admin_fees - other_fees
  - [ ] Distribute commissionable_value across initial_payment + installments
  - [ ] Generate installment due dates based on frequency and first_college_due_date
  - [ ] Calculate student_due_date for each installment using student_lead_time_days
  - [ ] Create draft installments with generates_commission = true for commission-eligible amounts
  - [ ] Return generated installments as JSON for preview (don't save yet)

- [ ] **Task 6: Multi-Step Payment Plan Wizard - Step 1** (AC: 1)
  - [ ] Create `/payments/plans/new/page.tsx` with multi-step wizard component
  - [ ] Create `PaymentPlanWizardStep1.tsx` component with form fields:
    - Student selection dropdown (query GET /api/students filtered by agency_id)
    - Course name input (text field with autocomplete from previous plans)
    - Total course value input (currency formatted)
    - Commission rate input (decimal 0-1 format with helper text)
    - Course start date picker
    - Course end date picker
  - [ ] Use React Hook Form + Zod validation for Step 1
  - [ ] Display helper text: "Examples: 0.1 = 10%, 0.15 = 15%, 0.3 = 30%"
  - [ ] Auto-populate college/branch from selected student's enrollment
  - [ ] Enable "Next" button only when all required fields are valid
  - [ ] Store Step 1 data in wizard state (Zustand or useState)

- [ ] **Task 7: Multi-Step Payment Plan Wizard - Step 2** (AC: 2, 3, 4, 5, 6, 7)
  - [ ] Create `PaymentPlanWizardStep2.tsx` component with form sections:

    **Initial Payment Section:**
    - Initial payment amount input (currency)
    - Initial payment due date picker
    - "Has the initial payment already been paid?" toggle

    **Installment Configuration Section:**
    - Number of installments input (integer)
    - Payment frequency dropdown (Monthly, Quarterly, Custom)

    **Non-Commissionable Fees Section:**
    - Materials Cost input (currency, optional)
    - Admin Fees input (currency, optional)
    - Other Fees input (currency, optional)

    **Due Date Timeline Section:**
    - First Installment College Due Date picker
    - Student Lead Time input (days, integer)
    - Display calculated student due date preview

    **GST Configuration:**
    - "GST Inclusive" toggle

  - [ ] Create `PaymentPlanSummary` component displaying real-time calculations:
    - Total Commission (green highlight)
    - Remaining after initial payment
    - Amount per installment
  - [ ] Update summary in real-time as user changes values
  - [ ] Use `calculateCommissionableValue()` and `calculateExpectedCommission()` utilities
  - [ ] Enable "Generate Installments" button to proceed to Step 3

- [ ] **Task 8: Multi-Step Payment Plan Wizard - Step 3** (AC: 8, 9, 10)
  - [ ] Create `PaymentPlanWizardStep3.tsx` component with review sections:

    **Summary Section:**
    - Display selected student name
    - Display course name
    - Display total course value
    - Display total commission (green)
    - Display commission rate
    - Display GST inclusive status

    **Installment Schedule Table:**
    - Table columns: Installment #, Amount, Student Due Date, College Due Date, Status
    - Row 0: Initial Payment with amount, due dates, paid status badge
    - Rows 1-N: Installments with amounts, due dates, "draft" status
    - Highlight commission-eligible vs non-commissionable fees visually

  - [ ] Implement validation:
    - SUM(initial_payment + all installments) = total_course_value
    - Display error banner if amounts don't reconcile
  - [ ] Add "Edit" buttons to navigate back to Step 1 or Step 2
  - [ ] Add "Create Payment Plan" button to finalize and save

- [ ] **Task 9: Payment Plan Creation with Installments** (AC: 10)
  - [ ] Implement API route: POST /api/payment-plans (enhanced from Story 4.1)
  - [ ] Accept full wizard payload including installments
  - [ ] Use database transaction to create:
    1. Payment plan record with all Step 1 and Step 2 data
    2. Initial payment installment (installment_number = 0) if initial_payment_amount > 0
    3. Regular installments (installment_number = 1..N)
  - [ ] Set generates_commission = true for all installments
  - [ ] If initial_payment_paid = true, set initial installment status = 'paid' and paid_date = today
  - [ ] Otherwise, set all installments status = 'draft'
  - [ ] Return created payment plan with installments
  - [ ] Handle errors: rollback transaction on any failure

- [ ] **Task 10: Installment Table Component** (AC: 9)
  - [ ] Create `InstallmentTable.tsx` reusable component
  - [ ] Props: `installments: Installment[]`, `readonly: boolean`
  - [ ] Display table with columns:
    - Installment # (0 = "Initial Payment", 1-N = number)
    - Amount (currency formatted)
    - Student Due Date (date formatted)
    - College Due Date (date formatted)
    - Status (badge component)
  - [ ] Use TanStack Table for sorting
  - [ ] Style initial payment row differently (bold or highlighted)
  - [ ] Show commission-eligible indicator (green checkmark icon)

- [ ] **Task 11: Validation Schema** (AC: 10)
  - [ ] Create Zod schema in `packages/validations/src/payment-plan-wizard.schema.ts`:
    ```typescript
    const step1Schema = z.object({
      student_id: z.string().uuid(),
      course_name: z.string().min(1),
      total_course_value: z.number().positive(),
      commission_rate: z.number().min(0).max(1),
      course_start_date: z.date(),
      course_end_date: z.date()
    })

    const step2Schema = z.object({
      initial_payment_amount: z.number().nonnegative(),
      initial_payment_due_date: z.date(),
      initial_payment_paid: z.boolean(),
      number_of_installments: z.number().int().positive(),
      payment_frequency: z.enum(['monthly', 'quarterly', 'custom']),
      materials_cost: z.number().nonnegative().default(0),
      admin_fees: z.number().nonnegative().default(0),
      other_fees: z.number().nonnegative().default(0),
      first_college_due_date: z.date(),
      student_lead_time_days: z.number().int().positive(),
      gst_inclusive: z.boolean()
    })

    const installmentSchema = z.object({
      installment_number: z.number().int().nonnegative(),
      amount: z.number().positive(),
      student_due_date: z.date(),
      college_due_date: z.date(),
      is_initial_payment: z.boolean(),
      generates_commission: z.boolean()
    })

    export const paymentPlanWizardSchema = step1Schema
      .merge(step2Schema)
      .extend({
        installments: z.array(installmentSchema).min(1)
      })
      .refine(data => {
        // Validate total reconciliation
        const installmentTotal = data.installments.reduce((sum, i) => sum + i.amount, 0)
        return Math.abs(installmentTotal - data.total_course_value) < 0.01
      }, { message: "Installment amounts must sum to total course value" })
    ```

- [ ] **Task 12: Audit Logging** (AC: All)
  - [ ] Log payment plan creation with installments to audit_logs table
  - [ ] Include: user_id, timestamp, entity_type='payment_plan', entity_id, action='create_with_installments'
  - [ ] Log all wizard data in new_values (JSONB)
  - [ ] Log each installment creation separately for traceability
  - [ ] Include commission calculation parameters in audit log

- [ ] **Task 13: Testing** (AC: All)
  - [ ] Write unit tests for commission calculation utilities:
    - Test calculateCommissionableValue() with various fee combinations
    - Test calculateExpectedCommission() with GST inclusive/exclusive
  - [ ] Write unit tests for due date calculation utilities:
    - Test calculateStudentDueDate() with various lead times
    - Test generateInstallmentDueDates() for monthly and quarterly frequencies
  - [ ] Write integration tests for POST /api/payment-plans with installments:
    - Test creating plan with initial payment paid
    - Test creating plan with draft installments
    - Test validation errors (amounts don't reconcile)
    - Test commission calculation correctness
  - [ ] Write E2E tests for full wizard flow:
    - Complete all 3 steps and create payment plan
    - Verify installments are created correctly
    - Verify commission calculations are accurate
    - Test navigation between steps (edit previous step)
  - [ ] Test RLS policies on installments table

## Dev Notes

### Architecture Patterns and Constraints

**Multi-Step Wizard Pattern:**
- Step 1: Basic Information (student, course, commission rate)
- Step 2: Payment Structure (initial payment, installments, fees, due dates, GST)
- Step 3: Review & Confirmation (summary, installment table, validation)
- Use Zustand store or useState to maintain wizard state across steps
- Validate each step before allowing progression
- Allow editing previous steps

**Commission Calculation Pattern:**
- **Commissionable Value** = Total Course Value - Materials Cost - Admin Fees - Other Fees
- **Expected Commission** = Commissionable Value * Commission Rate (adjusted for GST if exclusive)
- **GST Handling**:
  - If gst_inclusive = true: use commissionable_value as base
  - If gst_inclusive = false: base = commissionable_value / 1.10 (remove 10% GST)
- All installments are commission-eligible (generates_commission = true)
- Non-commissionable fees are tracked separately but included in total course value

**Dual Timeline Pattern (Student vs College Due Dates):**
- Each installment has TWO due dates:
  - `student_due_date`: When student must pay to agency
  - `college_due_date`: When agency must pay to college
- Calculation: `student_due_date = college_due_date - student_lead_time_days`
- Example: If college due date is March 15 and student lead time is 7 days, student must pay by March 8
- This ensures agency has buffer time to collect from student before paying college

**Installment Numbering:**
- Initial payment: `installment_number = 0`, `is_initial_payment = true`
- Regular installments: `installment_number = 1, 2, 3, ... N`
- All installments sorted by installment_number for display

**Database Transaction Pattern:**
- Use single transaction to create payment_plan + all installments atomically
- If any installment fails, rollback entire payment plan creation
- Ensures data consistency

**State Management:**
- Wizard state stored in Zustand store or component useState
- Step 1 data → Step 2 (for summary calculations)
- Step 2 data → Step 3 (for installment generation and review)
- API mutation only triggered on final "Create Payment Plan" in Step 3

### Project Structure Notes

**Payment Plan Wizard Components Location:**
```
apps/payments/
├── app/
│   ├── plans/
│   │   ├── page.tsx                            # Payment plans list (future)
│   │   ├── [id]/
│   │   │   └── page.tsx                        # Payment plan detail (future)
│   │   └── new/
│   │       ├── page.tsx                        # NEW: Multi-step wizard page
│   │       └── components/
│   │           ├── PaymentPlanWizard.tsx       # NEW: Wizard orchestrator
│   │           ├── PaymentPlanWizardStep1.tsx  # NEW: General info
│   │           ├── PaymentPlanWizardStep2.tsx  # NEW: Payment structure
│   │           ├── PaymentPlanWizardStep3.tsx  # NEW: Review & confirm
│   │           ├── PaymentPlanSummary.tsx      # NEW: Real-time summary
│   │           ├── InstallmentTable.tsx        # NEW: Installment schedule table
│   │           └── WizardStepper.tsx           # NEW: Step indicator
```

**Shared Utilities:**
```
packages/utils/src/
├── commission-calculator.ts                    # EXTENDED from 4.1
│   ├── calculateCommissionableValue()          # NEW
│   ├── calculateExpectedCommission()           # NEW
│   └── calculateEarnedCommission()             # (from 4.1)
├── date-helpers.ts                             # NEW
│   ├── calculateStudentDueDate()
│   ├── calculateCollegeDueDate()
│   └── generateInstallmentDueDates()
└── formatters.ts                               # EXISTING: Currency formatting
```

**Database Migrations:**
```
supabase/migrations/003_payments_domain/
├── 001_payment_plans_schema.sql                # FROM 4.1
├── 002_payment_plans_triggers.sql              # FROM 4.1
├── 003_payment_plans_rls.sql                   # FROM 4.1
├── 004_installments_schema.sql                 # NEW: Installments table
├── 005_payment_plans_extensions.sql            # NEW: Add columns to payment_plans
├── 006_commission_functions.sql                # NEW: Commission calculation functions
├── 007_commission_triggers.sql                 # NEW: Auto-calculate triggers
└── 008_installments_rls.sql                    # NEW: RLS policies
```

**Validation Schemas:**
```
packages/validations/src/
├── payment-plan.schema.ts                      # FROM 4.1
└── payment-plan-wizard.schema.ts               # NEW: Multi-step wizard validation
```

### References

**Epic Breakdown:**
- [Source: docs/epics.md#Story-4.2-Flexible-Installment-Structure]
- Full acceptance criteria detailed in Epic 4, Story 4.2 (lines 670-729)
- Three-step wizard flow with comprehensive payment structure configuration

**Architecture:**
- [Source: docs/architecture.md#Pattern-2-Commission-Calculation-Engine]
- Commission calculation pattern with non-commissionable fees (lines 462-656)
- Database functions for calculateCommissionableValue() and calculateExpectedCommission()
- TypeScript utilities for client-side preview calculations

**PRD Requirements:**
- Payment plan flexible installment structure: FR-5.2 (lines 754-778)
- Dual timeline (student vs college due dates)
- Commission calculation engine: FR-5.5 (lines 816-836)
- GST handling (inclusive vs exclusive)

**Technical Decisions:**
- Multi-step wizard using React Hook Form for each step
- Zustand or useState for wizard state management across steps
- Database triggers for auto-calculating commissionable_value and expected_commission
- TanStack Query for API mutations (payment plan creation)
- Shadcn UI components (Form, Input, Select, DatePicker, Toggle, Table, Badge)
- date-fns for date calculations (addDays, subDays, addMonths)

### Learnings from Previous Story

**From Story 4.1: Payment Plan Creation (Status: drafted)**

Story 4.1 established the payment plan foundation that Story 4.2 builds upon:

- **Payment Plans Table Created**: `payment_plans` table with core fields: id, enrollment_id, agency_id, total_amount, currency, start_date, commission_rate_percent, expected_commission, status, notes, reference_number
- **Commission Calculation**: Basic formula implemented: `expected_commission = total_amount * (commission_rate_percent / 100)`
- **Database Triggers**: Auto-calculate expected_commission on INSERT/UPDATE
- **RLS Policies**: Agency-level data isolation on payment_plans table
- **Enrollment Integration**: Payment plan links to one enrollment via enrollment_id FK

**Key Interfaces to Reuse:**
- Payment plan creation API route: POST /api/payment-plans (will be enhanced in 4.2)
- Commission calculator utility: `packages/utils/src/commission-calculator.ts` (will be extended)
- PaymentPlanSummary component pattern for real-time calculations
- Form validation pattern with React Hook Form + Zod

**Story 4.2 Enhancements:**
Story 4.2 EXTENDS Story 4.1 by adding:
1. **Multi-step wizard** (vs single-step form in 4.1)
2. **Installments table** (child records of payment_plans)
3. **Non-commissionable fees** (materials, admin, other)
4. **Dual timeline** (student_due_date and college_due_date)
5. **Initial payment** (installment_number = 0)
6. **Payment frequency options** (monthly, quarterly, custom)
7. **GST handling** (inclusive vs exclusive affects commission calculation)

**Database Dependencies:**
- Story 4.2 requires payment_plans table from Story 4.1
- Story 4.2 adds new columns to payment_plans table
- Story 4.2 creates installments table with FK to payment_plans

**Architectural Continuity:**
- Follow same RLS pattern: agency_id filtering on installments table
- Follow same audit logging pattern: log payment plan creation with installments
- Follow same validation pattern: Zod schemas for each wizard step
- Follow same commission calculation pattern: database triggers + TypeScript utilities

**Commission Calculation Evolution:**
- **Story 4.1**: Simple calculation: `total_amount * commission_rate`
- **Story 4.2**: Complex calculation:
  1. Calculate commissionable_value = total_course_value - materials_cost - admin_fees - other_fees
  2. Adjust for GST if exclusive: base = commissionable_value / 1.10
  3. Apply commission rate: expected_commission = base * commission_rate
  4. Distribute across initial payment + installments

**Important Notes:**
- Story 4.1 created payment plans WITHOUT installments (just metadata)
- Story 4.2 creates payment plans WITH installments (actual payment schedule)
- Installments are created in the same transaction as the payment plan
- All installments initially have status = 'draft' (unless initial payment marked as paid)
- Installments will transition to 'pending' → 'due_soon' → 'overdue' → 'paid' via automated job (Epic 5)

[Source: stories/4-1-payment-plan-creation.md]

**Files Created by Story 4.1 (to reference and extend):**
- Supabase migration: `003_payments_domain/001_payment_plans_schema.sql`
- Supabase migration: `003_payments_domain/002_payment_plans_triggers.sql`
- API route: POST /api/payment-plans (will be enhanced)
- Component: `PaymentPlanForm.tsx` (will be replaced with multi-step wizard)
- Component: `PaymentPlanSummary.tsx` (will be reused and enhanced)
- Utility: `packages/utils/src/commission-calculator.ts` (will be extended)

**Patterns to Follow:**
- Database trigger pattern for auto-calculation (extend for commissionable_value)
- Real-time validation and preview (extend to wizard steps)
- Transaction pattern for atomic creation (payment plan + installments)
- RLS enforcement at database level (add for installments table)

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/4-2-flexible-installment-structure.context.xml](.bmad-ephemeral/stories/4-2-flexible-installment-structure.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
