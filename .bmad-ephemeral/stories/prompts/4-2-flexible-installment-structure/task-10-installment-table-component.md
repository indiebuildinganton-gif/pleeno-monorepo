# Task 10: Installment Table Component

**Story:** 4.2 Flexible Installment Structure
**Acceptance Criteria:** AC 9
**Status:** pending

## Context

This task creates a reusable InstallmentTable component for displaying installment schedules in a structured, sortable table format. Used in Step 3 of the wizard and future payment plan detail views.

## Task Description

Create a presentational table component that displays installment data with proper formatting, styling, and status badges.

## Subtasks

- [ ] Create file: `apps/payments/app/plans/new/components/InstallmentTable.tsx`
- [ ] Define component props interface
- [ ] Implement TanStack Table for column configuration and sorting
- [ ] Create column definitions for: #, Amount, Student Due Date, College Due Date, Status
- [ ] Format currency values using utility function
- [ ] Format dates using date-fns
- [ ] Render status badges with appropriate colors
- [ ] Style initial payment row (installment_number = 0) differently
- [ ] Add commission-eligible indicator (green checkmark icon)
- [ ] Add table footer with total row
- [ ] Make component responsive (mobile-friendly)
- [ ] Add sorting capability on columns (optional but recommended)
- [ ] Export component for reuse

## Technical Requirements

**Component Props:**
```typescript
interface InstallmentTableProps {
  installments: Installment[]
  readonly?: boolean  // For future edit capability
  showTotal?: boolean // Show total row in footer
}

interface Installment {
  installment_number: number
  amount: number
  student_due_date: string | Date
  college_due_date: string | Date
  is_initial_payment: boolean
  generates_commission: boolean
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled'
}
```

**Table Columns:**

1. **Installment #:**
   - Display "Initial Payment" for installment_number = 0
   - Display "Installment 1", "Installment 2", etc. for others
   - Centered alignment

2. **Amount:**
   - Currency formatted: $2,000.00
   - Right-aligned
   - Bold for initial payment

3. **Student Due Date:**
   - Date formatted: "Mar 8, 2025"
   - Use date-fns format function
   - Centered alignment

4. **College Due Date:**
   - Date formatted: "Mar 15, 2025"
   - Centered alignment

5. **Status:**
   - Badge component
   - Color coding:
     - draft: Gray
     - pending: Blue
     - paid: Green
     - overdue: Red
     - cancelled: Gray with strikethrough
   - Show checkmark icon for 'paid' status

**Table Styling:**

- Initial payment row:
  - Bold text
  - Light background color (e.g., bg-blue-50)
  - Border or visual separator

- Regular installment rows:
  - Standard table row styling
  - Hover effect

- Commission-eligible indicator:
  - Green checkmark icon (✓) or badge
  - Tooltip: "Generates commission"
  - All rows show this (since generates_commission = true for all)

**Table Footer (if showTotal = true):**
```
┌────────────────────────────────────────┐
│ Total            $10,000.00            │
└────────────────────────────────────────┘
```

**TanStack Table Configuration:**
```typescript
const columns: ColumnDef<Installment>[] = [
  {
    accessorKey: 'installment_number',
    header: '#',
    cell: ({ row }) => {
      const num = row.original.installment_number
      return num === 0 ? 'Initial Payment' : `Installment ${num}`
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    cell: ({ row }) => formatCurrency(row.original.amount),
  },
  {
    accessorKey: 'student_due_date',
    header: 'Student Due Date',
    cell: ({ row }) => formatDate(row.original.student_due_date),
  },
  {
    accessorKey: 'college_due_date',
    header: 'College Due Date',
    cell: ({ row }) => formatDate(row.original.college_due_date),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
  },
]
```

## Acceptance Criteria

✅ **AC 9:** Installment Schedule Table
- Display table with columns: #, Amount, Student Due Date, College Due Date, Status
- Initial Payment row (installment_number = 0) with paid status badge
- Regular installment rows (1-N) with draft status badge
- Commission-eligible amounts indicated (all rows)
- Initial payment row visually distinct (bold, background)

## References

**From Story Context:**
- Task 8: Step 3 uses this component
- Shadcn UI: Table component patterns
- TanStack Table: Column definitions and sorting

**Dependencies:**
- @tanstack/react-table 8.21.3
- Shadcn UI: Table, Badge components
- date-fns for date formatting
- Currency formatter utility

## Testing Checklist

### Component Tests

- [ ] Renders empty state when installments = []
- [ ] Renders initial payment row correctly:
  - Shows "Initial Payment" instead of "Installment 0"
  - Applies bold styling
  - Shows paid status badge (if paid)
- [ ] Renders regular installments correctly:
  - Shows "Installment 1", "Installment 2", etc.
  - Shows draft status badge
- [ ] Formats currency correctly:
  - $2,000.00 format
  - Negative amounts (if applicable)
- [ ] Formats dates correctly:
  - "Mar 8, 2025" format
  - Handles different date formats (ISO strings, Date objects)
- [ ] Status badges:
  - Correct colors for each status
  - Correct labels
  - Checkmark icon for 'paid'
- [ ] Table footer:
  - Shows total when showTotal = true
  - Calculates sum correctly
  - Hidden when showTotal = false

### Visual Regression Tests

- [ ] Initial payment row stands out visually
- [ ] Table is responsive on mobile
- [ ] Table columns align correctly
- [ ] Hover states work

### Integration Tests

- [ ] Used in Step 3 wizard correctly
- [ ] Displays generated installments from API
- [ ] Total matches expected value

## Dev Notes

**Currency Formatting:**
Create or reuse utility function:
```typescript
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}
```

**Date Formatting:**
Use date-fns for consistency:
```typescript
import { format, parseISO } from 'date-fns'

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  return format(dateObj, 'MMM d, yyyy')
}
```

**Status Badge Component:**
```typescript
const statusConfig = {
  draft: { color: 'gray', label: 'Draft' },
  pending: { color: 'blue', label: 'Pending' },
  paid: { color: 'green', label: 'Paid', icon: CheckIcon },
  overdue: { color: 'red', label: 'Overdue' },
  cancelled: { color: 'gray', label: 'Cancelled' },
}

function StatusBadge({ status }: { status: InstallmentStatus }) {
  const config = statusConfig[status]
  return (
    <Badge variant={config.color}>
      {config.icon && <config.icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
```

**Initial Payment Row Styling:**
Use Shadcn Table row variant or custom className:
```typescript
<TableRow className={row.original.is_initial_payment ? 'bg-blue-50 font-bold' : ''}>
```

**Responsive Design:**
On mobile, consider:
- Stacking columns vertically
- Horizontal scroll for table
- Simplified view with fewer columns

**Sorting:**
TanStack Table supports sorting out of the box:
```typescript
const table = useReactTable({
  data: installments,
  columns,
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
})
```

**Reusability:**
This component will be reused in:
- Step 3 wizard preview (this story)
- Payment plan detail page (future story)
- Installment tracking dashboard (future story)

Design it to be flexible and reusable.

**Empty State:**
If installments array is empty, show message:
"No installments generated. Please configure payment structure."

**Loading State:**
If data is loading, show skeleton rows:
```tsx
{isLoading && (
  <TableRow>
    <TableCell colSpan={5}>
      <Skeleton className="h-8 w-full" />
    </TableCell>
  </TableRow>
)}
```

**Accessibility:**
- Use semantic table elements (thead, tbody, th, td)
- Add aria-labels for status badges
- Ensure keyboard navigation works
- Screen reader friendly (proper row/column headers)
