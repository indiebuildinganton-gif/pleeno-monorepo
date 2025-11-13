# Task 3: Create Payment Plans Report API Route

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #1, #3, #4, #6, #7, #8, #9

---

## Task Overview

Create a POST API route that generates payment plans reports with flexible filtering, pagination, sorting, and contract expiration tracking.

---

## Requirements

### API Route

Create `apps/reports/app/api/reports/payment-plans/route.ts`

### Request Schema

```typescript
interface PaymentPlansReportRequest {
  filters: {
    date_from?: string
    date_to?: string
    college_ids?: string[]
    branch_ids?: string[]
    student_ids?: string[]
    status?: ('pending' | 'paid' | 'overdue' | 'cancelled')[]
    contract_expiration_from?: string
    contract_expiration_to?: string
  }
  columns: string[]
  pagination: {
    page: number
    page_size: number
  }
  sort?: {
    column: string
    direction: 'asc' | 'desc'
  }
}
```

### Response Schema

```typescript
interface PaymentPlansReportResponse {
  data: PaymentPlanReportRow[]
  pagination: {
    page: number
    page_size: number
    total_count: number
    total_pages: number
  }
  summary: {
    total_plan_amount: number
    total_paid_amount: number
    total_commission: number
  }
}
```

### Implementation Details

1. **Database Query**
   - Base table: `payment_plans`
   - Joins: `enrollments`, `students`, `colleges`, `branches`
   - Apply filters dynamically based on request
   - RLS auto-filters by `agency_id` (automatic)

2. **Computed Fields**
   ```sql
   -- Calculate in SQL query:
   - total_paid: SUM of paid installments
   - total_remaining: plan_amount - total_paid
   - earned_commission: Use commission calculator
   - days_until_contract_expiration: contract_expiration_date - CURRENT_DATE
   - contract_status: CASE WHEN < 30 days THEN 'expiring_soon' ELSE 'active' END
   ```

3. **Pagination**
   - Use LIMIT/OFFSET for server-side pagination
   - Calculate total_count and total_pages

4. **Summary Totals**
   - Calculate in separate query or use window functions:
     - total_plan_amount: SUM of all plan amounts
     - total_paid_amount: SUM of all paid amounts
     - total_commission: SUM of all commissions

5. **Validation**
   - Use Zod to validate request body
   - Return 400 for invalid requests
   - Return 500 for server errors

---

## Technical Constraints

- **RLS Enforcement:** All queries auto-filtered by `agency_id` (use `packages/database` server client)
- **Server-Side Pagination:** Use LIMIT/OFFSET to reduce data transfer
- **TypeScript:** Define request/response types in `types.ts`
- **Supabase Client:** Import from `packages/database/server`
- **Commission Calculator:** Use utility from `packages/utils/commission-calculator.ts`

---

## Database Schema Notes

```sql
-- Query structure:
SELECT
  payment_plans.id,
  payment_plans.total_amount AS plan_amount,
  payment_plans.status,
  students.name AS student_name,
  colleges.name AS college_name,
  branches.name AS branch_name,
  enrollments.contract_expiration_date,
  (enrollments.contract_expiration_date - CURRENT_DATE) AS days_until_contract_expiration,
  CASE
    WHEN enrollments.contract_expiration_date < CURRENT_DATE THEN 'expired'
    WHEN enrollments.contract_expiration_date < CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
    ELSE 'active'
  END AS contract_status,
  (SELECT SUM(amount) FROM installments WHERE payment_plan_id = payment_plans.id AND status = 'paid') AS total_paid
FROM payment_plans
INNER JOIN enrollments ON payment_plans.enrollment_id = enrollments.id
INNER JOIN students ON enrollments.student_id = students.id
INNER JOIN colleges ON enrollments.college_id = colleges.id
LEFT JOIN branches ON enrollments.branch_id = branches.id
WHERE payment_plans.agency_id = auth.uid()  -- RLS auto-applied
-- Dynamic filters applied here
ORDER BY payment_plans.created_at DESC
LIMIT {page_size} OFFSET {(page - 1) * page_size};
```

---

## Acceptance Criteria

✅ POST /api/reports/payment-plans route created
✅ Request validation with Zod
✅ Dynamic query building with all filters
✅ Computed fields: total_paid, earned_commission, days_until_contract_expiration, contract_status
✅ Pagination (LIMIT/OFFSET)
✅ Sorting by column and direction
✅ Summary totals calculation
✅ RLS enforcement (only agency's data)
✅ Error handling (400/500 responses)

---

## Reference Code

See story markdown for:
- Database query structure (lines 397-437)
- TypeScript types (lines 444-510)
- API route implementation notes (lines 71-138)

---

## Output

After implementing:
1. Show the API route code
2. Show the TypeScript types
3. Test API with sample request:
   - Filters: date_from, college_ids
   - Columns: student_name, college_name, plan_amount
   - Pagination: page 1, page_size 10
4. Verify response includes data, pagination, summary
5. Verify RLS enforcement (only current agency's data)
