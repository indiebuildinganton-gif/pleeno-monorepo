# Story 4-4: Manual Payment Recording - Task 1

## Story Context
**As a** Agency User
**I want** to manually record when an installment is paid
**So that** I can keep the system up-to-date and track which payments have been received

## Task 1: Record Payment API

### Description
Create the API endpoint for recording installment payments.

### Implementation Checklist
- [ ] Create API route at `apps/payments/app/api/installments/[id]/record-payment/route.ts`
- [ ] Implement Zod validation schema in `packages/validations/src/installment.schema.ts`
- [ ] Validate paid_date cannot be in the future
- [ ] Validate paid_amount is positive, non-zero, max 2 decimals
- [ ] Validate paid_amount <= installment.amount * 1.1 (allow 10% overpayment)
- [ ] Validate notes max 500 characters (optional field)
- [ ] Implement database transaction with Supabase
- [ ] Update installment record with paid_date, paid_amount, status, payment_notes
- [ ] Calculate and update installment status ("paid" if paid_amount >= amount, "partial" if less)
- [ ] Check if all installments for payment_plan are paid
- [ ] If all paid, update payment_plan.status to "completed"
- [ ] Recalculate payment_plan.earned_commission based on paid installments
- [ ] Return updated installment and payment_plan data
- [ ] Implement RLS enforcement via agency_id filtering
- [ ] Add audit logging for payment recording (user_id, timestamp, old/new values)
- [ ] Handle error cases: 404 (not found), 400 (validation), 403 (wrong agency)

### Acceptance Criteria
- **AC 1**: Mark Installment as Paid - User can mark pending installments as paid, recording payment date, actual amount paid, with validation (no future dates, positive amounts). Status changes to "paid".
- **AC 2**: Partial Payment Support - User can record partial payments where paid_amount < installment.amount. System tracks outstanding balance.
- **AC 3**: Payment Notes - User can add optional notes (max 500 chars) to payment record. Notes stored and visible in payment history.
- **AC 4**: Payment Plan Status Auto-Update - When all installments paid → payment_plan.status changes to "completed". Auto-update triggers after each payment.
- **AC 7**: Data Isolation - All operations filtered by agency_id via RLS. Users can only record payments for their agency's installments.

### Key Constraints
- API Routes: Use POST /api/installments/[id]/record-payment (not Server Actions) for consistency
- RLS Enforcement: All mutations filtered by agency_id via Supabase RLS policies
- Server-Side Validation: Zod schema validation on API route (paid_date not future, paid_amount positive)
- Audit Logging: Log all payment recordings with user context (user_id, timestamp, old/new values)
- Commission Recalculation: Update payment_plan.earned_commission after each payment
- Database Transaction: UPDATE installment + UPDATE payment_plan (if all paid) must be atomic
- Path Format: Use project-relative paths only (not absolute paths)
- Date Handling: Store paid_date in UTC, display in agency timezone using date-helpers.ts

### Interface Definition

**POST /api/installments/[id]/record-payment**

Request Body:
```typescript
{
  paid_date: string;        // ISO date format (YYYY-MM-DD), cannot be future
  paid_amount: number;      // Positive, max 2 decimals, <= installment.amount * 1.1
  notes?: string;           // Optional, max 500 chars
}
```

Response (200):
```typescript
{
  installment: {
    id: string;
    payment_plan_id: string;
    installment_number: number;
    amount: number;
    paid_date: string;
    paid_amount: number;
    status: "paid" | "partial" | "pending";
    payment_notes: string | null;
  },
  payment_plan: {
    id: string;
    status: string;
    earned_commission: number;
  }
}
```

Errors:
- 404: Installment not found
- 400: Validation failed (paid_date in future, paid_amount invalid)
- 403: Forbidden (installment belongs to different agency)

**RecordPaymentSchema (Zod)**
```typescript
z.object({
  paid_date: z.string().refine(date => new Date(date) <= new Date(), "Payment date cannot be in the future"),
  paid_amount: z.number().positive().refine(n => Number.isInteger(n * 100), "Max 2 decimal places"),
  notes: z.string().max(500).optional()
})
```

### Dependencies
- `@supabase/supabase-js` - Supabase client for database mutations with RLS
- `zod` (4.x) - Schema validation for payment recording request
- `date-fns` (4.1.0) - Date manipulation and validation
- Existing utilities: `packages/database/src/client.ts` for Supabase client

### Relevant Artifacts
- Database client: [packages/database/src/client.ts](packages/database/src/client.ts)
- Architecture reference: Commission calculation formula in [docs/architecture.md](docs/architecture.md)

### Commission Calculation Formula
From architecture docs:
```
earned_commission = (SUM(paid_amount WHERE status='paid') / total_amount) * expected_commission
```

Recalculate after each payment recording.

---

## CRITICAL: Create Implementation Manifest

Before starting implementation, create a manifest file to track progress across all tasks.

**Create file**: `.bmad-ephemeral/stories/prompts/4-4-manual-payment-recording/manifest.md`

**Content template**:
```markdown
# Story 4-4 Implementation Manifest

**Story**: Manual Payment Recording
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Record Payment API
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Mark as Paid UI Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: TanStack Query Mutation for Payment Recording
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Payment Plan Detail Page Updates
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Dashboard Widget Updates
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Partial Payment Display
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Audit Logging
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Commission Recalculation
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 10: Payment History Timeline (Optional)
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

---

## Next Steps

1. Create the manifest file as shown above
2. Implement Task 1 following the checklist
3. Test the API endpoint locally
4. When Task 1 is complete:
   - Update manifest: Set Task 1 status to "Completed" with completion date
   - Add any implementation notes
   - Move to `task-2-prompt.md`

**Reference**: For full story context, see `.bmad-ephemeral/stories/4-4-manual-payment-recording.context.xml`
