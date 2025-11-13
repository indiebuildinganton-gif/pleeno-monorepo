# Story 7-5: Student Payment History Report - Task 3

**Story**: Student Payment History Report
**Task**: Display Payment History Timeline
**Acceptance Criteria**: AC #2, #3

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Create a PaymentHistoryTimeline component that displays installments in a chronological, grouped format with visual status indicators, summary cards, and collapsible payment plan sections.

## Subtasks Checklist

- [ ] Create PaymentHistoryTimeline component
- [ ] Display installments in chronological order (newest first)
- [ ] For each installment, show:
  - Due date (formatted: "Jan 15, 2025")
  - Payment plan reference (e.g., "Payment Plan #PP-123")
  - College/Branch (e.g., "Imagine - Brisbane")
  - Amount (formatted currency)
  - Payment status badge (Paid/Pending/Overdue/Cancelled)
  - Paid date (if applicable): "Paid on Jan 10, 2025"
- [ ] Group by payment plan with collapsible sections
- [ ] Add summary card at top showing Total Paid, Total Outstanding, Percentage Paid
- [ ] Format currency amounts with agency currency symbol
- [ ] Show relative timestamps for recent payments: "Paid 3 days ago"
- [ ] Test: View payment history → See chronological timeline grouped by plan

## Acceptance Criteria

**AC #2**: And each entry shows: date, payment plan, college/branch, amount, payment status, paid date

**AC #3**: And the report shows total paid to date and total outstanding

## Context & Constraints

### Key Constraints
- **Visual Hierarchy**: Clear grouping by payment plan with expandable/collapsible sections
- **Status Colors**: Consistent color coding for payment status (green=paid, blue=pending, red=overdue, gray=cancelled)
- **Currency Formatting**: Use agency's configured currency symbol (default: AUD $)
- **Date Formatting**: Clear, readable date formats with relative times for recent payments
- **Responsive Design**: Timeline must work on desktop and tablet views

### Design Pattern

This component follows a card-based timeline design with:
- Summary statistics at the top
- Collapsible payment plan sections
- Individual installment rows within each plan
- Color-coded status badges
- Relative timestamps for recent activity

### Dependencies

**Required NPM Packages:**
- `react` (19) - React library with hooks
- `lucide-react` - Icons (ChevronDown, ChevronRight for expand/collapse)
- `date-fns` (^4.1.0) - Date formatting
- `date-fns-tz` - Timezone support

**Related Components:**
- PaymentHistorySection (Task 1) - Parent component that will use this
- API route from Task 2 - Provides data

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- `docs/architecture.md` - UI component patterns

## Implementation Guidelines

### Component Structure

**File**: `apps/entities/app/students/[id]/components/PaymentHistoryTimeline.tsx`

```tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { formatCurrency, formatDate, formatRelativeTime } from '@/lib/formatters'
import type { PaymentHistoryItem, PaymentSummary } from '@/types/payment-history'

interface PaymentHistoryTimelineProps {
  paymentHistory: PaymentHistoryItem[]
  summary: PaymentSummary
}

interface GroupedPaymentPlan {
  payment_plan_id: string
  college_name: string
  branch_name: string
  branch_city: string
  program_name: string
  plan_total_amount: number
  plan_start_date: string
  installments: PaymentHistoryItem[]
}

export function PaymentHistoryTimeline({
  paymentHistory,
  summary,
}: PaymentHistoryTimelineProps) {
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set())

  const togglePlan = (planId: string) => {
    const newExpanded = new Set(expandedPlans)
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId)
    } else {
      newExpanded.add(planId)
    }
    setExpandedPlans(newExpanded)
  }

  // Group installments by payment plan
  const groupedByPlan = paymentHistory.reduce((acc, inst) => {
    const key = inst.payment_plan_id
    if (!acc[key]) {
      acc[key] = {
        payment_plan_id: inst.payment_plan_id,
        college_name: inst.college_name,
        branch_name: inst.branch_name,
        branch_city: inst.branch_city,
        program_name: inst.program_name,
        plan_total_amount: inst.plan_total_amount,
        plan_start_date: inst.plan_start_date,
        installments: [],
      }
    }
    acc[key].installments.push(inst)
    return acc
  }, {} as Record<string, GroupedPaymentPlan>)

  const getStatusBadge = (status: string) => {
    const styles = {
      paid: 'bg-green-100 text-green-800 border-green-200',
      pending: 'bg-blue-100 text-blue-800 border-blue-200',
      overdue: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    }

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium border ${
          styles[status as keyof typeof styles] || styles.pending
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
        <div>
          <p className="text-sm text-gray-600 mb-1">Total Paid</p>
          <p className="text-3xl font-bold text-green-600">
            {formatCurrency(summary.total_paid)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
          <p className={`text-3xl font-bold ${
            summary.total_outstanding > 0 ? 'text-red-600' : 'text-gray-400'
          }`}>
            {formatCurrency(summary.total_outstanding)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Completion</p>
          <p className="text-3xl font-bold text-gray-900">
            {summary.percentage_paid.toFixed(1)}%
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${summary.percentage_paid}%` }}
            />
          </div>
        </div>
      </div>

      {/* Payment Plans */}
      {Object.values(groupedByPlan).map((plan) => (
        <div key={plan.payment_plan_id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
          {/* Plan Header */}
          <div
            className="bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={() => togglePlan(plan.payment_plan_id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {expandedPlans.has(plan.payment_plan_id) ? (
                  <ChevronDown className="h-5 w-5 text-blue-600" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">
                    {plan.college_name} - {plan.branch_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {plan.program_name} • Started {formatDate(plan.plan_start_date)} • {plan.installments.length} installments
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-xl font-semibold text-gray-900">
                  {formatCurrency(plan.plan_total_amount)}
                </p>
              </div>
            </div>
          </div>

          {/* Installments */}
          {expandedPlans.has(plan.payment_plan_id) && (
            <div className="divide-y bg-white">
              {plan.installments.map((inst) => (
                <div key={inst.installment_id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">
                          Installment #{inst.installment_number}
                        </p>
                        {getStatusBadge(inst.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        Due: {formatDate(inst.due_date)}
                      </p>
                      {inst.status === 'paid' && inst.paid_at && (
                        <p className="text-sm text-green-600 font-medium">
                          Paid {formatRelativeTime(inst.paid_at)} on {formatDate(inst.paid_at)}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-gray-900">
                        {formatCurrency(inst.amount)}
                      </p>
                      {inst.paid_amount && inst.paid_amount !== inst.amount && (
                        <p className="text-sm text-gray-600">
                          Paid: {formatCurrency(inst.paid_amount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Helper Functions

Create or update formatters in `packages/utils/src/formatters.ts`:

```typescript
import { format, formatDistanceToNow } from 'date-fns'

export function formatCurrency(amount: number, currencyCode: string = 'AUD'): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currencyCode,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, 'MMM d, yyyy')
}

export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(dateObj, { addSuffix: true })
}
```

### Integration with PaymentHistorySection

Update `PaymentHistorySection.tsx` (from Task 1) to use the Timeline:

```tsx
import { PaymentHistoryTimeline } from './PaymentHistoryTimeline'

// Inside the component, replace the placeholder with:
{!isLoading && paymentHistory.length > 0 && (
  <PaymentHistoryTimeline
    paymentHistory={paymentHistory}
    summary={summary}
  />
)}
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 3 as "Completed" with date
2. Test the timeline display with various payment scenarios
3. Move to `task-4-prompt.md` to create the PDF template
4. The PDF template will reuse similar layout patterns from this timeline

## Testing Checklist

- [ ] Timeline displays grouped by payment plan
- [ ] Payment plans are collapsible/expandable
- [ ] Summary card shows correct totals and percentage
- [ ] Progress bar reflects percentage_paid
- [ ] Installments display in order (newest first within each plan)
- [ ] Status badges use correct colors (green/blue/red/gray)
- [ ] Currency amounts formatted with $ symbol
- [ ] Dates formatted as "Jan 15, 2025"
- [ ] Relative timestamps show "3 days ago" for recent payments
- [ ] Empty state works when no payment history
- [ ] Responsive design works on different screen sizes
- [ ] Expand/collapse icons animate correctly
- [ ] Hover states work on interactive elements
- [ ] No console errors or warnings
