# Task 6: Multi-Step Payment Plan Wizard - Step 1

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 1
**Status:** pending

## Context

This task creates the first step of the 3-step payment plan wizard, which collects general information about the student, course, and commission structure.

## Task Description

Create the wizard page orchestrator and Step 1 component that handles student selection, course details, commission rate configuration, and course dates.

## Subtasks

### Wizard Page Orchestrator

- [ ] Create file: `apps/payments/app/plans/new/page.tsx`
- [ ] Set up multi-step wizard state management (Zustand store or useState)
- [ ] Implement step navigation (currentStep state)
- [ ] Create wizard data state (step1Data, step2Data, step3Data)
- [ ] Render appropriate step component based on currentStep
- [ ] Handle navigation between steps
- [ ] Add WizardStepper component showing progress (Step 1, 2, 3)

### Step 1 Component

- [ ] Create file: `apps/payments/app/plans/new/components/PaymentPlanWizardStep1.tsx`
- [ ] Set up React Hook Form with Zod validation
- [ ] Add form fields:
  - **Student Selection:**
    - Dropdown/Combobox to select student
    - Query GET /api/students filtered by agency_id
    - Display: student name
    - Search functionality for large lists
  - **College/Branch:**
    - Display field (read-only)
    - Auto-populated from selected student's branch
  - **Course Name:**
    - Text input with autocomplete
    - Load previous course names from payment plans for suggestions
  - **Total Course Value:**
    - Currency input (formatted)
    - Validation: must be positive number
  - **Commission Rate:**
    - Number input (decimal 0-1 format)
    - Helper text: "Examples: 0.1 = 10%, 0.15 = 15%, 0.3 = 30%"
    - Validation: 0 <= rate <= 1
  - **Course Start Date:**
    - Date picker component
    - Validation: cannot be in the past
  - **Course End Date:**
    - Date picker component
    - Validation: must be after start date
- [ ] Enable "Next" button only when all required fields are valid
- [ ] On "Next": save Step 1 data to wizard state and navigate to Step 2
- [ ] Add "Cancel" button to exit wizard (with confirmation dialog)

### Form Validation

- [ ] Create Zod schema for Step 1:
  ```typescript
  const step1Schema = z.object({
    student_id: z.string().uuid(),
    course_name: z.string().min(1, 'Course name is required'),
    total_course_value: z.number().positive('Must be a positive amount'),
    commission_rate: z.number().min(0).max(1, 'Must be between 0 and 1'),
    course_start_date: z.date(),
    course_end_date: z.date()
  }).refine(data => data.course_end_date > data.course_start_date, {
    message: 'End date must be after start date',
    path: ['course_end_date']
  })
  ```

## Technical Requirements

**Project Structure:**
```
apps/payments/app/plans/new/
├── page.tsx                          # Wizard orchestrator
└── components/
    ├── PaymentPlanWizard.tsx         # Main wizard component
    ├── PaymentPlanWizardStep1.tsx    # Step 1 (this task)
    ├── PaymentPlanWizardStep2.tsx    # Step 2 (Task 7)
    ├── PaymentPlanWizardStep3.tsx    # Step 3 (Task 8)
    └── WizardStepper.tsx             # Progress indicator
```

**Dependencies:**
- React Hook Form 7.66.0
- Zod 4.x
- Shadcn UI components: Form, Input, Select, DatePicker, Button, Label, Combobox
- TanStack Query for fetching students

**State Management Options:**

*Option 1: Zustand Store*
```typescript
// stores/payment-plan-wizard.store.ts
interface PaymentPlanWizardState {
  currentStep: 1 | 2 | 3
  step1Data: Step1FormData | null
  step2Data: Step2FormData | null
  generatedInstallments: Installment[] | null
  setCurrentStep: (step: 1 | 2 | 3) => void
  setStep1Data: (data: Step1FormData) => void
  setStep2Data: (data: Step2FormData) => void
  setGeneratedInstallments: (installments: Installment[]) => void
  reset: () => void
}
```

*Option 2: useState in page.tsx*
```typescript
const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
const [step1Data, setStep1Data] = useState<Step1FormData | null>(null)
const [step2Data, setStep2Data] = useState<Step2FormData | null>(null)
```

Choose based on complexity preference. Zustand is recommended for cleaner state management across steps.

## Acceptance Criteria

✅ **AC 1:** Student and Enrollment Selection
- Select student from dropdown pre-populated with agency's students
- College/branch auto-assigned from student's branch
- Enter course name (text input)
- Enter total course value (currency input)
- Enter commission rate (0-1 decimal with helper text)
- Select course start date (date picker)
- Select course end date (date picker)
- All required fields completed to proceed to Step 2

## References

**From Story Context:**
- Epic 4: Story 4.2 multi-step wizard specification
- PRD Section: FR-5.1 Payment Plan Creation Wizard
- Shadcn UI: Form patterns and components

**UI/UX Patterns:**
- Follow Shadcn UI form patterns
- Use Form, FormField, FormItem, FormLabel, FormControl, FormMessage components
- Implement consistent spacing and layout
- Show validation errors inline

## Testing Checklist

### Component Tests

- [ ] Form validation:
  - Empty required fields show validation errors
  - Invalid commission rate (< 0 or > 1) shows error
  - End date before start date shows error
  - Valid form enables "Next" button

- [ ] Student selection:
  - Dropdown loads students from API
  - Selecting student auto-populates college/branch
  - Search functionality filters students

- [ ] Commission rate helper:
  - Helper text displays examples
  - Decimal input accepts 0.1, 0.15, etc.

- [ ] Navigation:
  - "Next" button saves data and proceeds to Step 2
  - "Cancel" button shows confirmation dialog

### Integration Tests

- [ ] GET /api/students returns students filtered by agency_id
- [ ] Wizard state persists between step navigation
- [ ] Can navigate back from Step 2 to Step 1 with data preserved

### E2E Tests

- [ ] Complete Step 1 form with all valid data
- [ ] Verify navigation to Step 2
- [ ] Navigate back to Step 1, verify data persisted

## Dev Notes

**Student Dropdown:**
Use Shadcn Combobox component for better UX with large student lists. Include search/filter functionality.

**Course Name Autocomplete:**
Query existing payment plans to suggest previously used course names. This improves data consistency and reduces typos.

**Commission Rate Input:**
Display as decimal (0-1) but show percentage in helper text for clarity. Users familiar with percentages can easily convert (15% → 0.15).

**Date Picker Considerations:**
- Use Shadcn DatePicker component
- Default course_start_date to today
- Default course_end_date to today + 1 year (adjustable)
- Disable past dates for start date

**Responsive Design:**
Ensure form works on mobile devices. Stack fields vertically on small screens.

**Accessibility:**
- Proper label associations
- ARIA attributes for validation errors
- Keyboard navigation support
- Focus management

**Error Handling:**
- Show API errors if student fetch fails
- Provide retry mechanism
- Display user-friendly error messages

**Wizard Progress Indicator:**
```
┌────────────────────────────────────────┐
│  Step 1: General Info  →  Step 2  →  Step 3  │
│      (active)                          │
└────────────────────────────────────────┘
```

Use different styles for active, completed, and upcoming steps.
