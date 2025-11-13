# Task 4: Create Report Results Table Component

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #3, #4, #9

---

## Task Overview

Create a `ReportResultsTable` component using TanStack Table with sorting, pagination, contract expiration highlighting, and summary totals.

---

## Requirements

### Component Structure

Create `apps/reports/app/components/ReportResultsTable.tsx`

### Props Interface

```typescript
interface ReportResultsTableProps {
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
  onPageChange: (page: number) => void
  onSort: (column: string, direction: 'asc' | 'desc') => void
}
```

### Implementation Details

1. **Table Setup (TanStack Table)**
   - Define columns based on selected columns from report
   - Enable sorting on all columns
   - Use manual pagination (server-side)

2. **Column Definitions**
   ```typescript
   const columns = [
     { accessorKey: 'student_name', header: 'Student Name' },
     { accessorKey: 'college_name', header: 'College' },
     { accessorKey: 'plan_amount', header: 'Plan Amount', cell: formatCurrency },
     { accessorKey: 'total_paid', header: 'Total Paid', cell: formatCurrency },
     { accessorKey: 'earned_commission', header: 'Commission', cell: formatCurrency },
     { accessorKey: 'status', header: 'Status', cell: StatusBadge },
     { accessorKey: 'contract_expiration_date', header: 'Contract Expiration', cell: ExpirationCell },
   ]
   ```

3. **Contract Expiration Highlighting (AC #9)**
   - Row highlighting based on `contract_status`:
     - **Expired**: Red background (`bg-red-100 border-red-300`)
     - **< 7 days**: Orange background (`bg-orange-100 border-orange-300`)
     - **< 30 days**: Yellow background (`bg-yellow-100 border-yellow-300`)
     - **Active**: No highlighting
   - Add warning icon/badge for expiring contracts

4. **Summary Totals Footer (AC #4)**
   - Sticky footer row with bold styling
   - Display: Total Plan Amount, Total Paid, Total Commission
   - Format as currency using `formatCurrency()` from `packages/utils`

5. **Pagination Controls (AC #3)**
   - Page size selector (10, 25, 50, 100)
   - Previous/Next buttons
   - Page number input
   - "Showing X-Y of Z results" text

6. **Loading/Empty States**
   - Loading: Skeleton table rows
   - Empty: "No payment plans match the selected filters"

### ContractExpirationBadge Component

Create `apps/reports/app/components/ContractExpirationBadge.tsx`:

```typescript
export function ContractExpirationBadge({ days }: { days: number }) {
  if (days < 0) {
    return <Badge variant="destructive">Expired {Math.abs(days)} days ago</Badge>
  }
  if (days < 7) {
    return <Badge variant="destructive" className="bg-orange-600">{days} days left</Badge>
  }
  if (days < 30) {
    return <Badge variant="warning" className="bg-yellow-600">{days} days left</Badge>
  }
  return <Badge variant="outline">{days} days left</Badge>
}
```

---

## Technical Constraints

- **TanStack Table:** Version 8.21.3 for table functionality
- **Formatting:** Use `formatCurrency()` from `packages/utils/src/formatters.ts`
- **Date Formatting:** Use `date-fns` `format()` for dates
- **UI Components:** Shadcn UI (Badge, Button, Table)
- **Responsive Design:** Table on desktop, cards on mobile (implement in Task 9)

---

## Acceptance Criteria

✅ ReportResultsTable component using TanStack Table
✅ Table columns with proper formatting (currency, dates, status)
✅ Sorting on all columns (click header)
✅ Pagination controls (page size, prev/next, page input)
✅ Contract expiration highlighting (yellow/orange/red rows)
✅ ContractExpirationBadge with urgency indicators
✅ Summary totals footer row (sticky, bold)
✅ Loading state (skeleton rows)
✅ Empty state message

---

## Reference Code

See story markdown for:
- Component structure (lines 660-770)
- ContractExpirationBadge (lines 772-809)
- Row highlighting logic (lines 701-706)

---

## Output

After implementing:
1. Show ReportResultsTable component code
2. Show ContractExpirationBadge component code
3. Test with mock data:
   - Mix of expired, expiring soon, and active contracts
   - Verify row highlighting colors
   - Verify badge displays correctly
   - Test sorting by clicking column headers
   - Test pagination controls
4. Verify summary totals display and format correctly
