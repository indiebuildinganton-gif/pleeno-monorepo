# Story 7-5: Student Payment History Report - Task 1

**Story**: Student Payment History Report
**Task**: Add Payment History Section to Student Detail Page
**Acceptance Criteria**: AC #1

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Add a new "Payment History" tab/section to the student detail page that will display payment history and provide export functionality. This task focuses on the UI structure and layout - the data fetching and display will be implemented in subsequent tasks.

## Subtasks Checklist

- [ ] Add "Payment History" tab/section to `/apps/entities/app/students/[id]/page.tsx`
- [ ] Create PaymentHistorySection component at `/apps/entities/app/students/[id]/components/PaymentHistorySection.tsx`:
  - Date range filter (All Time, This Year, Custom)
  - "Generate Report" button
  - "Export PDF" button
  - Loading state while fetching data
- [ ] Display message when no payment plans exist: "No payment history available"
- [ ] Test: Navigate to student detail → See Payment History section

## Acceptance Criteria

**AC #1**: Given I am viewing a student's detail page, When I request a payment history report, Then I see a chronological list of all payment plans and installments for that student

## Context & Constraints

### Key Constraints
- **Multi-Tenant Security**: All queries MUST filter by agency_id via RLS. Never expose data from other agencies.
- **UI Consistency**: Follow existing design patterns from student detail page
- **Accessibility**: Use semantic HTML and ARIA labels for screen readers
- **Responsive Design**: Payment history must work on desktop and tablet views

### Architecture Context

**Entities Zone (Students):**
- Student detail page: `apps/entities/app/students/[id]/page.tsx`
- Payment History section: `apps/entities/app/students/[id]/components/PaymentHistorySection.tsx`
- API route (Task 2): `apps/entities/app/api/students/[id]/payment-history/route.ts`

**Design Pattern:**
This follows the same pattern as other entity detail pages with tabbed sections or collapsible panels.

### Dependencies

**Required NPM Packages:**
- `react` (19) - React library with concurrent features
- `next` (15.x) - Next.js framework with App Router
- `typescript` (5.x) - TypeScript for type safety
- `lucide-react` - Icon library for UI elements
- `tailwindcss` (4.x) - Utility-first CSS framework

### Artifacts & References

**Documentation:**
- `docs/epics.md` - Epic 7: Reporting & Export - Story 7.5 details
- `docs/architecture.md` - Entities Zone architecture (apps/entities/)
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context

**Code References:**
- `apps/entities/app/students/[id]/page.tsx` - Student detail page to extend
- Similar patterns in other entity detail pages (colleges, branches, etc.)

## CRITICAL: Create Implementation Manifest

Before starting implementation, create a manifest file to track progress across all tasks:

**Location**: `.bmad-ephemeral/stories/prompts/7-5/manifest.md`

**Content Template**:
```markdown
# Story 7-5 Implementation Manifest

**Story**: Student Payment History Report
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Add Payment History Section to Student Detail Page
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Implement Payment History API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Display Payment History Timeline
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Create Student Payment Statement PDF Template
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Implement PDF Export API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Add Date Range Filtering
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Reuse Export Utilities from Story 7.2 and 7.4
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Add Payment History Link from Student List
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 9: Testing and Validation
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

## Implementation Guidelines

1. **Review Existing Student Detail Page**: Study the current structure of `apps/entities/app/students/[id]/page.tsx`
2. **Add Tab or Section**: Decide whether to use tabs or a collapsible section based on existing patterns
3. **Create PaymentHistorySection Component**: Start with a skeleton that displays placeholder content
4. **Add Filter UI Elements**: Implement date range filter buttons (All Time, This Year, Custom)
5. **Add Action Buttons**: Place "Generate Report" and "Export PDF" buttons (they won't work yet - that's Tasks 2 and 5)
6. **Add Empty State**: Show "No payment history available" when appropriate
7. **Style with Tailwind**: Follow existing design system for consistency

## Component Structure Example

```tsx
// apps/entities/app/students/[id]/components/PaymentHistorySection.tsx

'use client'

import { useState } from 'react'
import { FileDown, RefreshCw } from 'lucide-react'

interface PaymentHistorySectionProps {
  studentId: string
}

export function PaymentHistorySection({ studentId }: PaymentHistorySectionProps) {
  const [dateFilter, setDateFilter] = useState<'all' | 'thisYear' | 'custom'>('all')
  const [isLoading, setIsLoading] = useState(false)

  // TODO: Task 2 will implement data fetching
  const paymentHistory = [] // Placeholder

  return (
    <div className="space-y-6">
      {/* Header with filters and actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Payment History</h2>

        <div className="flex items-center gap-4">
          {/* Date Range Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setDateFilter('all')}
              className={`px-4 py-2 rounded-md ${
                dateFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setDateFilter('thisYear')}
              className={`px-4 py-2 rounded-md ${
                dateFilter === 'thisYear'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              This Year
            </button>
            <button
              onClick={() => setDateFilter('custom')}
              className={`px-4 py-2 rounded-md ${
                dateFilter === 'custom'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700'
              }`}
            >
              Custom
            </button>
          </div>

          {/* Action Buttons */}
          <button
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4" />
            Generate Report
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={isLoading || paymentHistory.length === 0}
          >
            <FileDown className="h-4 w-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && paymentHistory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No payment history available</p>
        </div>
      )}

      {/* Payment History Display - Task 3 will implement this */}
      {!isLoading && paymentHistory.length > 0 && (
        <div>
          {/* PaymentHistoryTimeline component will go here in Task 3 */}
          <p className="text-gray-600">Payment history timeline will be displayed here</p>
        </div>
      )}
    </div>
  )
}
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 1 as "Completed" with date
2. Add implementation notes about any challenges or decisions
3. Move to `task-2-prompt.md` to implement the Payment History API route
4. The API route will provide the data that this UI section will display

## Testing Checklist

- [ ] Payment History section visible on student detail page
- [ ] Date range filter buttons render correctly
- [ ] "Generate Report" button is present (disabled or enabled based on data)
- [ ] "Export PDF" button is present (disabled when no data)
- [ ] Empty state displays: "No payment history available"
- [ ] Loading state displays spinner animation
- [ ] UI follows existing design patterns and Tailwind styling
- [ ] Component is responsive on desktop and tablet
- [ ] No console errors or warnings
