# Task 2: Create Report Builder UI

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #1, #2, #8

---

## Task Overview

Create a `ReportBuilder` component with a multi-section filter form, column selection, and contract expiration quick filters.

---

## Requirements

### Component Structure

Create `apps/reports/app/components/ReportBuilder.tsx` with the following sections:

1. **Filter Section**
   - Date range picker (from/to)
   - College/branch multi-select dropdown
   - Student search/select (typeahead)
   - Payment status multi-select (pending, paid, overdue, cancelled)
   - Contract expiration date range picker

2. **Column Selection Section**
   - Checkboxes for available columns:
     - Default: Student Name, College, Branch, Plan Amount, Total Paid, Status, Commission, Contract Expiration
     - Optional: Created Date, Payment Frequency, Installments Count, Days Until/Overdue
   - Validation: At least one column required

3. **Contract Expiration Quick Filters**
   - Preset buttons: "Expiring in 30 days", "Expiring in 60 days", "Expiring in 90 days", "Already expired"
   - Active preset visually highlighted

4. **Actions Section**
   - "Generate Report" button
   - "Reset Filters" button

### Implementation Details

1. **Form Management**
   - Use React Hook Form + Zod for validation
   - Create Zod schema: `apps/reports/app/validations/report-builder.schema.ts`
   - Validate date ranges (from <= to)
   - Validate at least one column selected

2. **Preset Filter Logic**
   ```typescript
   handlePresetFilter = (preset: 'expiring_30' | 'expiring_60' | 'expiring_90' | 'expired') => {
     const today = new Date()
     switch (preset) {
       case 'expiring_30':
         filters.contract_expiration_from = today
         filters.contract_expiration_to = today + 30 days
         break
       // ... etc
     }
   }
   ```

3. **Styling**
   - Use Shadcn UI components (Form, Select, DatePicker, Checkbox, Button)
   - Desktop: Two-column filter layout
   - Use responsive grid layout

4. **TypeScript Types**
   - Define `ReportBuilderFormData` interface
   - Props: `{ onGenerate: (data: ReportBuilderFormData) => void }`

---

## Technical Constraints

- **Form Validation:** React Hook Form 7.66.0 + Zod 4
- **UI Components:** Shadcn UI (from `packages/ui`)
- **TypeScript:** Strict mode enabled
- **Date Handling:** Use `date-fns` 4.1.0 for date manipulation

---

## Acceptance Criteria

✅ ReportBuilder component with all filter inputs
✅ Column selection checkboxes with validation
✅ Contract expiration preset buttons working
✅ Form validation (at least one column, valid date ranges)
✅ "Generate Report" calls onGenerate prop
✅ "Reset Filters" clears form

---

## Reference Code

See story markdown for detailed component structure:
- `.bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.md` (lines 548-658)

---

## Output

After implementing:
1. Show the ReportBuilder component code
2. Show the Zod validation schema
3. Demonstrate form submission handling
4. Test: Fill filters → Click Generate → Verify onGenerate called with correct data
