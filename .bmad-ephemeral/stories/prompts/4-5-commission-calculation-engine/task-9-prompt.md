# Story 4.5: Commission Calculation Engine - Task 9

## Story Context
**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Previous Task**: Task 8 - Dashboard Commission Summary Widget (Completed)

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

---

## Task 9: Non-Commissionable Fees Handling

### Acceptance Criteria
AC 6: Non-Commissionable Fees Exclusion
- Commission calculations exclude non-commissionable fees (materials_cost, admin_fees, other_fees)
- Commissionable amount = total_amount - (materials_cost + admin_fees + other_fees)
- Installments linked to non-commissionable fees (generates_commission = false) excluded from calculations
- UI clearly distinguishes commission-eligible vs non-commission items

### Task Description
Implement the handling of non-commissionable fees throughout the system. This includes updating the payment plan creation workflow, installment generation logic, commission display, and UI to clearly show which amounts are commission-eligible.

### Subtasks Checklist
- [ ] Update payment plan creation to store materials_cost, admin_fees, other_fees (fields added in Story 4.2)
- [ ] Update installments table to include generates_commission BOOLEAN field (default: true)
- [ ] When creating installments:
  - Installments for tuition: generates_commission = true
  - Installments for fees (materials, admin, other): generates_commission = false
- [ ] Update calculateEarnedCommission to filter: WHERE generates_commission = true
- [ ] Update commission display:
  - Show "Commission-Eligible Amount: $X" (total_amount - fees)
  - Show "Non-Commissionable Fees: $Y" (materials + admin + other)
  - Show "Total Course Value: $Z" (total_amount)
- [ ] Installments table shows "Commission" column: "Yes" or "No" badge

---

## Context & Constraints

### Key Constraints
- Commission calculations ONLY on commission-eligible amounts
- generates_commission flag on installments determines eligibility
- UI transparency: Clearly show what is/isn't commission-eligible
- Non-commissionable fees: materials_cost, admin_fees, other_fees
- Commissionable amount = total_amount - (materials_cost + admin_fees + other_fees)

### Dependencies
```json
{
  "@supabase/supabase-js": "latest",
  "zod": "4.x"
}
```

---

## Manifest Update Instructions

Before starting:
1. Open: `.bmad-ephemeral/stories/prompts/4-5-commission-calculation-engine/MANIFEST.md`
2. Update Task 8:
   - Status: "Completed"
   - Completed: [Date]
   - Notes: [Implementation notes from Task 8]
3. Update Task 9:
   - Status: "In Progress"
   - Started: [Current Date]

---

## Implementation Steps

### Step 1: Update Payment Plan Creation Form
Modify: `apps/payments/app/plans/new/components/PaymentPlanWizard.tsx`

Add fields for non-commissionable fees in Step 1 (Basic Info):

```typescript
// Add to form schema
const paymentPlanSchema = z.object({
  // ... existing fields
  total_amount: z.number().positive(),
  materials_cost: z.number().min(0).default(0),
  admin_fees: z.number().min(0).default(0),
  other_fees: z.number().min(0).default(0),
  commission_rate: z.number().min(0).max(100),
});

// Add form fields in UI
<FormField
  control={form.control}
  name="materials_cost"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Materials Cost (Non-Commissionable)</FormLabel>
      <FormControl>
        <Input type="number" {...field} />
      </FormControl>
      <FormDescription>
        Materials costs are excluded from commission calculations
      </FormDescription>
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="admin_fees"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Admin Fees (Non-Commissionable)</FormLabel>
      <FormControl>
        <Input type="number" {...field} />
      </FormControl>
    </FormItem>
  )}
/>

<FormField
  control={form.control}
  name="other_fees"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Other Fees (Non-Commissionable)</FormLabel>
      <FormControl>
        <Input type="number" {...field} />
      </FormControl>
    </FormItem>
  )}
/>

// Show commissionable amount calculation
<div className="p-4 bg-muted rounded-lg">
  <p className="text-sm text-muted-foreground">Commissionable Amount</p>
  <p className="text-lg font-semibold">
    {formatCurrency(
      form.watch('total_amount') -
      (form.watch('materials_cost') + form.watch('admin_fees') + form.watch('other_fees'))
    )}
  </p>
  <p className="text-xs text-muted-foreground">
    Total Amount - Non-Commissionable Fees
  </p>
</div>
```

### Step 2: Update Installment Generation
Modify: `packages/utils/src/commission-calculator.ts`

Update calculateInstallmentSchedule to handle generates_commission flag:

```typescript
interface DraftInstallment {
  installment_number: number;
  amount: number;
  student_due_date: Date;
  college_due_date: Date;
  status: 'draft';
  generates_commission: boolean; // NEW
}

export function calculateInstallmentSchedule({
  total_amount,
  number_of_installments,
  frequency,
  start_date,
  student_lead_time_days,
  materials_cost = 0,
  admin_fees = 0,
  other_fees = 0,
}: CalculateInstallmentScheduleParams): DraftInstallment[] {
  // Calculate commissionable amount (tuition only)
  const commissionable_amount = total_amount - (materials_cost + admin_fees + other_fees);
  const non_commissionable_total = materials_cost + admin_fees + other_fees;

  // Generate installments for commissionable amount (tuition)
  const tuition_installments = generateInstallments({
    amount: commissionable_amount,
    count: number_of_installments,
    generates_commission: true,
    // ... other params
  });

  // If there are non-commissionable fees, create separate installments
  const fee_installments = non_commissionable_total > 0
    ? [{
        installment_number: tuition_installments.length + 1,
        amount: non_commissionable_total,
        student_due_date: tuition_installments[0].student_due_date, // Due with first installment
        college_due_date: tuition_installments[0].college_due_date,
        status: 'draft' as const,
        generates_commission: false, // Non-commissionable
      }]
    : [];

  return [...tuition_installments, ...fee_installments];
}
```

### Step 3: Update Commission Calculation (Already Implemented in Task 3)
The calculateEarnedCommission function from Task 3 already filters by generates_commission:

```typescript
// This was already implemented in Task 3
const total_paid = installments
  .filter(i => i.status === 'paid' && i.generates_commission === true)
  .reduce((sum, i) => sum + (i.paid_amount || 0), 0);
```

Ensure this logic is correct and working.

### Step 4: Update Installments Display
Modify: `apps/payments/app/plans/[id]/components/InstallmentsList.tsx`

Add "Commission" column to show generates_commission status:

```typescript
const columns: ColumnDef<Installment>[] = [
  // ... existing columns (number, amount, due date, status)

  {
    accessorKey: 'generates_commission',
    header: 'Commission',
    cell: ({ row }) => (
      <Badge variant={row.original.generates_commission ? 'default' : 'secondary'}>
        {row.original.generates_commission ? 'Yes' : 'No'}
      </Badge>
    ),
  },
];
```

### Step 5: Update Commission Summary Display
Modify: `apps/payments/app/plans/[id]/components/CommissionSummary.tsx`

Add breakdown of commissionable vs non-commissionable amounts:

```typescript
export function CommissionSummary({
  expectedCommission,
  earnedCommission,
  totalAmount,
  materialsCost = 0,
  adminFees = 0,
  otherFees = 0,
  currency = 'AUD',
}: CommissionSummaryProps) {
  const nonCommissionableFees = materialsCost + adminFees + otherFees;
  const commissionableAmount = totalAmount - nonCommissionableFees;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Commission Tracking</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Amount Breakdown */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b">
          <div>
            <p className="text-sm text-muted-foreground">Total Course Value</p>
            <p className="text-lg font-semibold">
              {formatCurrency(totalAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Commission-Eligible</p>
            <p className="text-lg font-semibold text-blue-600">
              {formatCurrency(commissionableAmount, currency)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Non-Commissionable Fees</p>
            <p className="text-lg font-semibold text-gray-600">
              {formatCurrency(nonCommissionableFees, currency)}
            </p>
          </div>
        </div>

        {/* Commission Amounts */}
        {/* ... existing commission display code ... */}
      </CardContent>
    </Card>
  );
}
```

### Step 6: Update Validation
Add validation to ensure fees don't exceed total amount:

```typescript
const paymentPlanSchema = z.object({
  total_amount: z.number().positive(),
  materials_cost: z.number().min(0),
  admin_fees: z.number().min(0),
  other_fees: z.number().min(0),
  commission_rate: z.number().min(0).max(100),
}).refine(
  (data) => {
    const fees = data.materials_cost + data.admin_fees + data.other_fees;
    return fees < data.total_amount;
  },
  {
    message: "Non-commissionable fees cannot equal or exceed total amount",
    path: ["materials_cost"],
  }
);
```

---

## Database Schema Note

The generates_commission field will be added to the installments table in Task 12 (Migration). For now, ensure the code is ready to use this field when it's available.

---

## Testing Requirements

### Unit Tests
Update: `packages/utils/src/commission-calculator.test.ts`

Test cases:
1. Installments with generates_commission = false are excluded from commission calculation
2. Non-commissionable fees reduce commissionable amount
3. Commission calculation only on commission-eligible amounts
4. Installment generation creates separate fee installments with generates_commission = false

### Component Tests
Test cases:
1. Payment plan form shows commissionable amount calculation
2. Installments table shows "Commission" column
3. Commission badge shows "Yes" for commission-eligible installments
4. Commission badge shows "No" for fee installments
5. Commission summary displays amount breakdown
6. Form validation prevents fees from exceeding total

### Integration Tests
Test cases:
1. Create payment plan with non-commissionable fees
2. Verify fee installments have generates_commission = false
3. Record payment for fee installment
4. Verify earned commission doesn't increase
5. Record payment for tuition installment
6. Verify earned commission increases correctly

---

## Context References

### Story Context File
Full context: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Related Files
- Wizard: `apps/payments/app/plans/new/components/PaymentPlanWizard.tsx` (MODIFY)
- Calculator: `packages/utils/src/commission-calculator.ts` (MODIFY)
- Installments List: `apps/payments/app/plans/[id]/components/InstallmentsList.tsx` (MODIFY)
- Commission Summary: `apps/payments/app/plans/[id]/components/CommissionSummary.tsx` (MODIFY)

### Dependencies from Previous Tasks
- Task 1: calculateInstallmentSchedule function
- Task 3: calculateEarnedCommission function (already filters by generates_commission)
- Task 5: CommissionSummary component
- Story 4.2: Payment plan schema with fee fields

---

## Next Steps

After completing Task 9:
1. Update MANIFEST.md:
   - Task 9 status: "Completed"
   - Task 9 completed date
   - Add notes: Non-commissionable fees handling implemented
2. Test with various fee scenarios
3. Move to Task 10: Database View for Real-Time Commission Calculation (Optional)
4. Reference file: `task-10-prompt.md`

---

## Success Criteria

Task 9 is complete when:
- [x] Payment plan form includes materials_cost, admin_fees, other_fees fields
- [x] Form shows commissionable amount calculation
- [x] Validation prevents fees from exceeding total
- [x] Installment generation handles generates_commission flag
- [x] Fee installments created with generates_commission = false
- [x] Commission calculation filters by generates_commission
- [x] Installments table shows "Commission" column
- [x] Commission summary shows amount breakdown
- [x] Unit tests pass
- [x] Integration tests pass
- [x] MANIFEST.md updated with Task 9 completion
