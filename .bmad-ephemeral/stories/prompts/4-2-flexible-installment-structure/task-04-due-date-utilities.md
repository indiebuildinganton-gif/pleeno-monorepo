# Task 4: Due Date Calculation Utilities

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 6
**Status:** pending

## Context

This task implements date calculation utilities for the dual timeline pattern (student due dates vs college due dates) and installment schedule generation for monthly/quarterly payment frequencies.

## Task Description

Create TypeScript utilities that:
1. Calculate student due dates based on college due dates and lead time buffer
2. Calculate college due dates from student due dates (reverse calculation)
3. Generate arrays of due dates for monthly/quarterly installment schedules

## Subtasks

- [ ] Create file: `packages/utils/src/date-helpers.ts`
- [ ] Export function: `calculateStudentDueDate(collegeDueDate: Date, studentLeadTimeDays: number): Date`
  - Formula: `subDays(collegeDueDate, studentLeadTimeDays)`
  - Uses date-fns subDays function
- [ ] Export function: `calculateCollegeDueDate(studentDueDate: Date, studentLeadTimeDays: number): Date`
  - Formula: `addDays(studentDueDate, studentLeadTimeDays)`
  - Uses date-fns addDays function
- [ ] Export function: `generateInstallmentDueDates(firstDueDate: Date, count: number, frequency: 'monthly' | 'quarterly'): Date[]`
  - Monthly: use date-fns addMonths(date, n) for each installment
  - Quarterly: use date-fns addMonths(date, n * 3) for each installment
  - Return array of Date objects
- [ ] Add JSDoc comments with examples
- [ ] Add input validation (count > 0, valid dates, valid frequency)
- [ ] Create unit tests in `packages/utils/src/__tests__/date-helpers.test.ts`

## Technical Requirements

**Dependencies:**
- date-fns 4.1.0 (already in project)
- Import: `addDays`, `subDays`, `addMonths` from 'date-fns'

**Function Signatures:**

```typescript
/**
 * Calculates when student must pay based on college due date and lead time buffer.
 *
 * @param collegeDueDate - Date when agency must pay college
 * @param studentLeadTimeDays - Number of days before college due date
 * @returns Date when student must pay agency
 *
 * @example
 * calculateStudentDueDate(new Date('2025-03-15'), 7)
 * // Returns: Date('2025-03-08') - student pays 7 days before college due date
 */
export function calculateStudentDueDate(
  collegeDueDate: Date,
  studentLeadTimeDays: number
): Date

/**
 * Calculates when agency must pay college based on student payment date and lead time.
 *
 * @param studentDueDate - Date when student must pay agency
 * @param studentLeadTimeDays - Number of days buffer for agency
 * @returns Date when agency must pay college
 *
 * @example
 * calculateCollegeDueDate(new Date('2025-03-08'), 7)
 * // Returns: Date('2025-03-15') - agency pays 7 days after student pays
 */
export function calculateCollegeDueDate(
  studentDueDate: Date,
  studentLeadTimeDays: number
): Date

/**
 * Generates an array of due dates for installments based on frequency.
 *
 * @param firstDueDate - The first installment due date
 * @param count - Number of installments (excluding initial payment)
 * @param frequency - 'monthly' or 'quarterly'
 * @returns Array of Date objects for each installment
 *
 * @example
 * generateInstallmentDueDates(new Date('2025-02-01'), 3, 'monthly')
 * // Returns: [
 * //   Date('2025-02-01'),  // Installment 1
 * //   Date('2025-03-01'),  // Installment 2
 * //   Date('2025-04-01')   // Installment 3
 * // ]
 *
 * @example
 * generateInstallmentDueDates(new Date('2025-02-01'), 3, 'quarterly')
 * // Returns: [
 * //   Date('2025-02-01'),  // Installment 1
 * //   Date('2025-05-01'),  // Installment 2 (3 months later)
 * //   Date('2025-08-01')   // Installment 3 (3 months later)
 * // ]
 */
export function generateInstallmentDueDates(
  firstDueDate: Date,
  count: number,
  frequency: 'monthly' | 'quarterly'
): Date[]
```

## Acceptance Criteria

✅ **AC 6:** Due Date Configuration
- Calculate student_due_date = college_due_date - student_lead_time_days
- Calculate college_due_date = student_due_date + student_lead_time_days
- Generate due dates for monthly frequency (1 month intervals)
- Generate due dates for quarterly frequency (3 month intervals)

## References

**From Story Context:**
- Architecture: Dual Timeline Pattern (student vs college due dates)
- PRD Section: FR-5.2 Flexible Installment Structure

## Testing Checklist

### Unit Tests

- [ ] Test calculateStudentDueDate():
  - With lead time = 7 days
  - With lead time = 14 days
  - With lead time = 30 days
  - Edge case: lead time = 0 (should return same date)
  - Verify uses subDays from date-fns

- [ ] Test calculateCollegeDueDate():
  - With lead time = 7 days
  - Verify reverse calculation: calculateCollegeDueDate(calculateStudentDueDate(date, n), n) === date
  - Edge case: lead time = 0

- [ ] Test generateInstallmentDueDates():
  - Monthly with count = 1 (single installment)
  - Monthly with count = 11 (typical)
  - Quarterly with count = 4
  - Verify dates are exactly 1 month apart (monthly)
  - Verify dates are exactly 3 months apart (quarterly)
  - Edge case: count = 0 (should return empty array or throw error)
  - Invalid frequency (should throw error)

### Integration Tests

- [ ] Test with real calendar dates including:
  - Month boundaries (Jan 31 → Feb 28/29)
  - Leap years
  - End of year transitions

## Dev Notes

**Dual Timeline Pattern:**

The dual timeline ensures agencies have buffer time to collect payments from students before paying colleges:

```
Timeline:
┌─────────────────────────────────────────┐
│ Student Lead Time (e.g., 7 days)        │
├──────────────────┬──────────────────────┤
│ Student pays     │ Agency pays college  │
│ agency           │                      │
└──────────────────┴──────────────────────┘
   March 8            March 15
   (student_due_date) (college_due_date)
```

**Why This Matters:**
- Agencies need time to receive and clear student payments
- Cash flow management: don't pay college before receiving student payment
- Risk mitigation: if student doesn't pay, agency has warning before college due date

**Monthly vs Quarterly:**
- **Monthly:** Smaller payment amounts, more frequent, easier for students
- **Quarterly:** Larger payment amounts, less frequent, fewer transactions

**Date Handling with date-fns:**
- date-fns handles edge cases (month boundaries, leap years) automatically
- addMonths(new Date('2025-01-31'), 1) → Feb 28, 2025 (date-fns handles this correctly)
- Use date-fns functions consistently throughout the codebase

**Usage in Wizard:**
These utilities are used in Step 2 of the payment plan wizard:
1. User enters first_college_due_date and student_lead_time_days
2. System calculates student_due_date for preview
3. User selects number_of_installments and frequency
4. System generates all due dates for preview in Step 3
