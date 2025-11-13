# Story 4.3: Payment Plan List and Detail Views - Task 7

## Story Context

**As an** Agency User
**I want** to view all payment plans and drill into individual plan details
**So that** I can quickly find plans and see their payment status

## Task 7: Installments List Component

### Description
Create InstallmentsList component displaying all installments in table format with status indicators.

### Acceptance Criteria
- AC 4: Payment Plan Detail Page (installments section)

### Subtasks
- [ ] Create InstallmentsList component
- [ ] Display installments in table format:
  - Installment # (1, 2, 3...)
  - Amount (currency formatted)
  - Student Due Date
  - College Due Date
  - Status (badge: pending/paid/overdue/cancelled)
  - Paid Date (if status = paid)
  - Action button: "Mark as Paid" (links to Story 4.4)
- [ ] Sort installments by student_due_date ASC
- [ ] Highlight overdue installments (red background or icon)
- [ ] Highlight next pending installment (blue highlight)
- [ ] Show initial payment (installment_number = 0) separately if exists
- [ ] Display commission vs non-commission breakdown per installment (if generates_commission field exists)

## Context

### Previous Task Completion
Tasks 1-6 should now be complete. You should have:
- Payment Plan Detail page structure (Task 6)
- GET /api/payment-plans/[id] returning installments array (Task 2)
- Status badge patterns established

### Key Constraints
- Client Components: Use 'use client' for interactive table
- Responsive Design: Table must work on mobile and desktop
- Visual Indicators: Clear highlighting for overdue and next pending

### Component to Create
**apps/payments/app/plans/components/InstallmentsList.tsx**
- Receives installments array as prop
- Table rendering with Shadcn Table
- Status-based styling and highlighting
- Action buttons (placeholder for Task 4.4)

### Dependencies
- Shadcn UI components: Table, Badge, Button
- date-fns (latest) - Date formatting, comparison (isAfter, isPast)
- packages/utils/src/formatters.ts - formatCurrency utility

### Installment Data Structure
```typescript
interface Installment {
  id: string
  payment_plan_id: string
  installment_number: number
  amount: number
  student_due_date: string
  college_due_date: string
  is_initial_payment: boolean
  generates_commission: boolean
  status: 'pending' | 'paid' | 'overdue' | 'cancelled' | 'draft'
  paid_date?: string
  paid_amount?: number
  created_at: string
  updated_at: string
}
```

### Relevant Documentation
- [docs/architecture.md - Database Schema](docs/architecture.md) - installments table structure

## Manifest Update Instructions

1. Open `.bmad-ephemeral/stories/prompts/4-3/MANIFEST.md`
2. Update Task 6:
   - Status: Completed
   - Completed: [Current Date]
   - Notes: [Any relevant implementation notes]
3. Update Task 7:
   - Status: In Progress
   - Started: [Current Date]

## Implementation Approach

### Step 1: Create Installments List Component
```typescript
// apps/payments/app/plans/components/InstallmentsList.tsx
'use client'

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format, isPast } from 'date-fns'
import { formatCurrency } from '@/packages/utils/src/formatters'

interface Props {
  installments: Installment[]
  currency: string
}

export function InstallmentsList({ installments, currency }: Props) {
  // Sort by student_due_date ASC
  const sortedInstallments = [...installments].sort((a, b) =>
    new Date(a.student_due_date).getTime() - new Date(b.student_due_date).getTime()
  )

  // Find initial payment (installment_number = 0)
  const initialPayment = sortedInstallments.find(i => i.is_initial_payment)
  const regularInstallments = sortedInstallments.filter(i => !i.is_initial_payment)

  // Find next pending installment
  const nextPending = regularInstallments.find(i => i.status === 'pending')

  return (
    <div className="space-y-4">
      <h2>Installments</h2>

      {initialPayment && (
        <div>
          <h3>Initial Payment</h3>
          <InstallmentRow
            installment={initialPayment}
            currency={currency}
            isNextPending={false}
          />
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Student Due Date</TableHead>
            <TableHead>College Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Paid Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {regularInstallments.map((installment) => (
            <InstallmentRow
              key={installment.id}
              installment={installment}
              currency={currency}
              isNextPending={installment.id === nextPending?.id}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
```

### Step 2: Create Installment Row Component
```typescript
interface InstallmentRowProps {
  installment: Installment
  currency: string
  isNextPending: boolean
}

function InstallmentRow({ installment, currency, isNextPending }: InstallmentRowProps) {
  const isOverdue = installment.status === 'pending' &&
    isPast(new Date(installment.student_due_date))

  const rowClassName = cn(
    isOverdue && 'bg-red-50 border-l-4 border-red-500',
    isNextPending && 'bg-blue-50 border-l-4 border-blue-500'
  )

  return (
    <TableRow className={rowClassName}>
      <TableCell>{installment.installment_number}</TableCell>
      <TableCell>
        {formatCurrency(installment.amount, currency)}
        {installment.generates_commission && (
          <span className="text-xs text-muted-foreground ml-2">(+commission)</span>
        )}
      </TableCell>
      <TableCell>{format(new Date(installment.student_due_date), 'MMM dd, yyyy')}</TableCell>
      <TableCell>{format(new Date(installment.college_due_date), 'MMM dd, yyyy')}</TableCell>
      <TableCell>
        <InstallmentStatusBadge status={installment.status} />
      </TableCell>
      <TableCell>
        {installment.paid_date
          ? format(new Date(installment.paid_date), 'MMM dd, yyyy')
          : '-'}
      </TableCell>
      <TableCell>
        {installment.status === 'pending' && (
          <Button variant="outline" size="sm" disabled>
            Mark as Paid
            <span className="text-xs ml-2">(Story 4.4)</span>
          </Button>
        )}
      </TableCell>
    </TableRow>
  )
}
```

### Step 3: Create Installment Status Badge
```typescript
function InstallmentStatusBadge({ status }: { status: Installment['status'] }) {
  const variants = {
    pending: 'secondary',
    paid: 'default',
    overdue: 'destructive',
    cancelled: 'outline',
    draft: 'outline',
  }

  return <Badge variant={variants[status]}>{status}</Badge>
}
```

### Step 4: Highlighting Logic

1. **Overdue Installments**
   - Status = 'pending'
   - Student due date is in the past
   - Red background or border
   - Optional: Red warning icon

2. **Next Pending Installment**
   - First installment with status = 'pending'
   - Blue highlight or border
   - Helps user identify next payment

3. **Initial Payment**
   - installment_number = 0 or is_initial_payment = true
   - Display separately above regular installments
   - Different styling (e.g., Card instead of table row)

### Step 5: Commission Indicator
If `generates_commission` field exists and is true:
- Show "(+commission)" next to amount
- OR use a different color/icon
- Helps user identify which installments contribute to commission

### Step 6: Mobile Responsive Layout
- Desktop: Full table
- Mobile: Card layout (stack columns vertically)
- Use responsive classes or separate mobile component

## Building on Previous Work

- Integrate into PaymentPlanDetail component (Task 6)
- Use installments data from Task 2 API
- Follow status badge patterns from Task 3
- Use formatCurrency utility

## Integration with Task 6

Update PaymentPlanDetail to include InstallmentsList:

```typescript
// In PaymentPlanDetail.tsx
<div className="space-y-6">
  {/* ... other sections ... */}
  <InstallmentsList
    installments={plan.installments}
    currency={plan.currency}
  />
</div>
```

## Next Steps

After completing this task:
1. Update the manifest (Task 7 → Completed)
2. Move to `task-8-prompt.md` (Payment Plan Status Calculation)
3. Task 8 will implement backend status calculation logic

## Testing Checklist

- [ ] Test installments display in table format
- [ ] Test all columns render correctly
- [ ] Test currency formatting
- [ ] Test date formatting
- [ ] Test status badges with correct colors
- [ ] Test sorting by student_due_date ASC
- [ ] Test overdue highlighting (red background/border)
- [ ] Test next pending highlighting (blue background/border)
- [ ] Test initial payment displays separately (if exists)
- [ ] Test paid date shows for paid installments
- [ ] Test paid date shows "-" for unpaid
- [ ] Test commission indicator displays (if applicable)
- [ ] Test "Mark as Paid" button shows for pending only
- [ ] Test responsive layout (desktop table, mobile cards)
- [ ] Test empty state (no installments)
