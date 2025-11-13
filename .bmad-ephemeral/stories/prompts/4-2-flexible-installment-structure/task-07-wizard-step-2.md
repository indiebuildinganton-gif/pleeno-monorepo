# Task 7: Multi-Step Payment Plan Wizard - Step 2

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 2, 3, 4, 5, 6, 7
**Status:** pending

## Context

This task creates Step 2 of the payment plan wizard, which handles payment structure configuration including initial payment, installment setup, non-commissionable fees, due date timelines, and GST settings. It includes a real-time payment summary that updates as users enter values.

## Task Description

Create Step 2 component with form sections for payment configuration and a real-time summary panel showing commission calculations.

## Subtasks

### Step 2 Main Component

- [ ] Create file: `apps/payments/app/plans/new/components/PaymentPlanWizardStep2.tsx`
- [ ] Set up React Hook Form with Zod validation
- [ ] Import Step 1 data from wizard state
- [ ] Create form sections (detailed below)
- [ ] Implement real-time calculation updates (useEffect or form.watch())
- [ ] Enable "Generate Installments" button when form is valid
- [ ] On submit: call generate-installments API and navigate to Step 3
- [ ] Add "Back" button to return to Step 1

### Form Section 1: Initial Payment

- [ ] Add section heading: "Initial Payment"
- [ ] Add form fields:
  - **Initial Payment Amount:**
    - Currency input
    - Validation: 0 <= amount < total_course_value
    - Default: 0 (optional initial payment)
  - **Initial Payment Due Date:**
    - Date picker
    - Enabled only if initial_payment_amount > 0
    - Validation: cannot be in the past
  - **Has the initial payment already been paid?**
    - Toggle/Switch component
    - Enabled only if initial_payment_amount > 0
    - Default: false

### Form Section 2: Installment Configuration

- [ ] Add section heading: "Installments"
- [ ] Add form fields:
  - **Number of Installments:**
    - Number input (integer)
    - Validation: 1 <= count <= 24
    - Helper text: "Regular installments (not including initial payment)"
  - **Payment Frequency:**
    - Dropdown/RadioGroup: Monthly, Quarterly, Custom
    - Default: Monthly
    - Helper text:
      - Monthly: "Installments due every month"
      - Quarterly: "Installments due every 3 months"
      - Custom: "Manually configure due dates" (future feature)

### Form Section 3: Non-Commissionable Fees

- [ ] Add section heading: "Non-Commissionable Fees"
- [ ] Add helper text: "These fees are excluded from commission calculations"
- [ ] Add form fields:
  - **Materials Cost:**
    - Currency input
    - Validation: >= 0
    - Default: 0
  - **Admin Fees:**
    - Currency input
    - Validation: >= 0
    - Default: 0
  - **Other Fees:**
    - Currency input
    - Validation: >= 0
    - Default: 0

### Form Section 4: Due Date Timeline

- [ ] Add section heading: "Payment Timeline"
- [ ] Add form fields:
  - **First Installment College Due Date:**
    - Date picker
    - Validation: must be after course_start_date
    - Helper text: "When the first payment is due to the college"
  - **Student Lead Time (days):**
    - Number input (integer)
    - Validation: >= 0
    - Default: 7
    - Helper text: "How many days before college due date must students pay"
  - **Preview: First Student Due Date:**
    - Display field (read-only, calculated)
    - Shows: first_college_due_date - student_lead_time_days
    - Updates in real-time as user changes values

### Form Section 5: GST Configuration

- [ ] Add section heading: "GST"
- [ ] Add form field:
  - **GST Inclusive:**
    - Toggle/Switch component
    - Default: true
    - Helper text:
      - When true: "Amounts already include GST"
      - When false: "GST will be calculated separately"

### Real-Time Payment Summary Component

- [ ] Create `PaymentPlanSummary.tsx` component
- [ ] Display in sidebar or panel next to form
- [ ] Show real-time calculations:
  - **Total Course Value:** (from Step 1)
  - **Non-Commissionable Fees:**
    - Materials: $XXX
    - Admin: $XXX
    - Other: $XXX
    - Total Fees: $XXX
  - **Commissionable Value:** (total_course_value - total_fees)
    - Displayed prominently
  - **Commission Rate:** (from Step 1)
  - **Expected Commission:** (in green, calculated)
  - **Initial Payment:** $XXX
  - **Remaining for Installments:** (commissionable_value - initial_payment)
  - **Number of Installments:** N
  - **Amount per Installment:** $XXX
- [ ] Use `calculateCommissionableValue()` from Task 3
- [ ] Use `calculateExpectedCommission()` from Task 3
- [ ] Update summary in real-time using form.watch()

### Form Validation Schema

- [ ] Create Zod schema for Step 2:
  ```typescript
  const step2Schema = z.object({
    initial_payment_amount: z.number().nonnegative().default(0),
    initial_payment_due_date: z.date().optional(),
    initial_payment_paid: z.boolean().default(false),
    number_of_installments: z.number().int().min(1).max(24),
    payment_frequency: z.enum(['monthly', 'quarterly', 'custom']),
    materials_cost: z.number().nonnegative().default(0),
    admin_fees: z.number().nonnegative().default(0),
    other_fees: z.number().nonnegative().default(0),
    first_college_due_date: z.date(),
    student_lead_time_days: z.number().int().nonnegative(),
    gst_inclusive: z.boolean().default(true)
  }).refine(data => {
    // If initial payment amount > 0, due date is required
    if (data.initial_payment_amount > 0 && !data.initial_payment_due_date) {
      return false
    }
    return true
  }, {
    message: 'Initial payment due date is required when amount is specified',
    path: ['initial_payment_due_date']
  }).refine(data => {
    // Total fees cannot exceed total course value
    const totalFees = data.materials_cost + data.admin_fees + data.other_fees
    return totalFees < step1Data.total_course_value
  }, {
    message: 'Total fees cannot exceed course value',
    path: ['materials_cost']
  })
  ```

### API Integration

- [ ] On "Generate Installments" button click:
  - Combine Step 1 + Step 2 data
  - Call POST /api/payment-plans/generate-installments (from Task 5)
  - Handle loading state (show spinner)
  - Handle success: save generated installments to wizard state, navigate to Step 3
  - Handle errors: display error message, keep user on Step 2

## Technical Requirements

**Dependencies:**
- React Hook Form 7.66.0
- Zod validation
- Shadcn UI: Form, Input, Select, DatePicker, Switch, Label, Card
- TanStack Query for API call
- Commission calculator utilities from Task 3
- Date calculation utilities from Task 4

**Layout:**
```
┌────────────────────────────────────────────────────────┐
│  Step 2: Payment Structure                             │
├──────────────────────────────┬─────────────────────────┤
│  Form Sections               │  Payment Summary        │
│  ├─ Initial Payment          │  ┌───────────────────┐  │
│  ├─ Installment Config       │  │ Total Value: $XX  │  │
│  ├─ Non-Comm. Fees           │  │ Fees: $XX         │  │
│  ├─ Due Date Timeline        │  │ Commissionable:   │  │
│  └─ GST Config               │  │   $XX             │  │
│                              │  │ Commission: $XX   │  │
│  [Back]  [Generate]          │  └───────────────────┘  │
└──────────────────────────────┴─────────────────────────┘
```

## Acceptance Criteria

✅ **AC 2:** Initial Payment Configuration
- Enter initial payment amount
- Specify initial payment due date
- Toggle "already paid" status

✅ **AC 3:** Installment Configuration
- Enter number of installments
- Select payment frequency (monthly, quarterly, custom)
- For monthly/quarterly: system will auto-calculate (in Task 5 API)

✅ **AC 4:** Non-Commissionable Fees
- Enter materials cost, admin fees, other fees
- Fees excluded from commission calculation

✅ **AC 5:** Real-Time Payment Summary
- Display total commission (green)
- Show remaining after initial payment
- Show amount per installment
- Updates as user enters values

✅ **AC 6:** Due Date Configuration
- Enter first college due date
- Enter student lead time (days)
- Preview calculated student due date

✅ **AC 7:** GST Handling
- Toggle GST inclusive
- Affects commission calculation base

## References

**From Story Context:**
- Task 3: Commission calculation utilities (import)
- Task 4: Date calculation utilities (import)
- Task 5: generate-installments API endpoint

**UI/UX:**
- Group related fields into sections with clear headings
- Use helper text to explain complex fields
- Real-time preview builds confidence before proceeding

## Testing Checklist

### Component Tests

- [ ] Form validation:
  - Initial payment due date required when amount > 0
  - Total fees cannot exceed course value
  - Number of installments between 1-24
  - Student lead time >= 0

- [ ] Real-time summary updates:
  - Change total_course_value (from Step 1) → commission updates
  - Change materials_cost → commissionable value decreases
  - Change commission_rate → expected commission updates
  - Toggle gst_inclusive → commission changes

- [ ] Conditional field enabling:
  - Initial payment due date disabled when amount = 0
  - Initial payment paid toggle disabled when amount = 0

- [ ] Date preview:
  - First student due date = first_college_due_date - student_lead_time_days
  - Updates in real-time

### Integration Tests

- [ ] API call to generate-installments:
  - Success: installments returned and saved to wizard state
  - Error: error message displayed
  - Loading state: button shows spinner

- [ ] Navigation:
  - "Back" button returns to Step 1 with data preserved
  - "Generate Installments" proceeds to Step 3 with data

### E2E Tests

- [ ] Complete Step 2 with various configurations:
  - With initial payment
  - Without initial payment
  - With all fees
  - GST inclusive vs exclusive
- [ ] Verify summary calculations are correct
- [ ] Proceed to Step 3 and verify installments generated

## Dev Notes

**Real-Time Calculation Pattern:**

Use `form.watch()` to subscribe to form value changes:
```typescript
const formValues = form.watch()

useEffect(() => {
  const commissionableValue = calculateCommissionableValue({
    total_course_value: step1Data.total_course_value,
    materials_cost: formValues.materials_cost,
    admin_fees: formValues.admin_fees,
    other_fees: formValues.other_fees
  })

  const expectedCommission = calculateExpectedCommission({
    commissionable_value: commissionableValue,
    commission_rate: step1Data.commission_rate,
    gst_inclusive: formValues.gst_inclusive
  })

  setSummary({
    commissionableValue,
    expectedCommission,
    // ... other summary fields
  })
}, [formValues, step1Data])
```

**Amount Distribution Preview:**
Show users how their installments will be structured:
- Initial payment: $2,000
- Remaining: $8,000
- 4 installments: $2,000 each

**Custom Frequency:**
For "custom" frequency, show message: "Custom due dates will be configured in the next step" (future feature beyond this story).

**GST Impact Example:**
Help users understand GST impact with tooltip:
- GST Inclusive ($10,000): Commission calculated on $10,000
- GST Exclusive ($10,000): Commission calculated on $9,090.91 ($10,000 / 1.10)

**Validation UX:**
- Show validation errors inline
- Disable "Generate Installments" button when form invalid
- Highlight which fields need attention
