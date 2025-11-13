# Story 7-5: Student Payment History Report - Task 8

**Story**: Student Payment History Report
**Task**: Add Payment History Link from Student List
**Acceptance Criteria**: AC #1

## User Story Context

**As an** Agency User
**I want** to view and export complete payment history for individual students
**So that** I can answer student inquiries and maintain records for dispute resolution

## Task Description

Add navigation links and access points to the Payment History feature from the student list page and student detail page header. This task integrates the payment history feature into the application's navigation flow.

## Subtasks Checklist

- [ ] Add "View Payment History" action to student list table
- [ ] Add quick-access link in student detail page header:
  - Icon button: "Payment History" with receipt/document icon
  - Click → Navigate to Payment History tab
- [ ] Add breadcrumb navigation:
  - Students → [Student Name] → Payment History
- [ ] Test: Click "View Payment History" → Navigate to payment history section

## Acceptance Criteria

**AC #1**: Given I am viewing a student's detail page, When I request a payment history report, Then I see a chronological list of all payment plans and installments for that student

## Context & Constraints

### Key Constraints
- **Consistent Navigation**: Follow existing navigation patterns from other entity pages
- **Accessibility**: Use proper ARIA labels and keyboard navigation
- **Visual Hierarchy**: Payment History link should be prominent but not overwhelming
- **Responsive Design**: Navigation must work on desktop and tablet

### Navigation Pattern

Follow the established entity detail page pattern:
- Action menu in list table rows
- Quick-access buttons in detail page header
- Breadcrumb trail for context
- Tab or section-based navigation within detail page

### Dependencies

**Required NPM Packages:**
- `next/link` - Next.js navigation
- `lucide-react` - Icons (Receipt, FileText, History)
- UI components for buttons and menus

**Related Components:**
- Student list page: `apps/entities/app/students/page.tsx`
- Student detail page: `apps/entities/app/students/[id]/page.tsx`

### Artifacts & References

**Documentation:**
- `.bmad-ephemeral/stories/7-5-student-payment-history-report.context.xml` - Full story context
- Existing entity pages for navigation patterns

## Implementation Guidelines

### Step 1: Update Student List Page

**File**: `apps/entities/app/students/page.tsx`

Add "Payment History" action to the student table row menu:

```tsx
import { MoreHorizontal, Eye, Edit, Receipt } from 'lucide-react'
import Link from 'next/link'

// Inside student table row component
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <button className="p-2 hover:bg-gray-100 rounded">
      <MoreHorizontal className="h-4 w-4" />
    </button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem asChild>
      <Link href={`/students/${student.id}`}>
        <Eye className="h-4 w-4 mr-2" />
        View Details
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href={`/students/${student.id}/edit`}>
        <Edit className="h-4 w-4 mr-2" />
        Edit Student
      </Link>
    </DropdownMenuItem>
    <DropdownMenuItem asChild>
      <Link href={`/students/${student.id}#payment-history`}>
        <Receipt className="h-4 w-4 mr-2" />
        Payment History
      </Link>
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Alternatively, add a dedicated button in the table row:

```tsx
<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <div className="flex items-center justify-end gap-2">
    <Link
      href={`/students/${student.id}`}
      className="text-blue-600 hover:text-blue-900"
    >
      View
    </Link>
    <Link
      href={`/students/${student.id}#payment-history`}
      className="text-green-600 hover:text-green-900 flex items-center gap-1"
    >
      <Receipt className="h-4 w-4" />
      Payments
    </Link>
  </div>
</td>
```

### Step 2: Update Student Detail Page Header

**File**: `apps/entities/app/students/[id]/page.tsx`

Add quick-access button to Payment History in the page header:

```tsx
import { Receipt, FileText, Edit } from 'lucide-react'

export default async function StudentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  // ... existing data fetching ...

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{student.full_name}</h1>
          <p className="text-gray-600">
            Passport: {student.passport_number} • Email: {student.email}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const section = document.getElementById('payment-history')
              section?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Receipt className="h-4 w-4" />
            Payment History
          </button>

          <Link
            href={`/students/${student.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Edit className="h-4 w-4" />
            Edit Student
          </Link>
        </div>
      </div>

      {/* Breadcrumb */}
      <nav className="text-sm text-gray-600">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/students" className="hover:text-blue-600">
              Students
            </Link>
          </li>
          <li>→</li>
          <li className="font-medium text-gray-900">{student.full_name}</li>
        </ol>
      </nav>

      {/* Tab Navigation or Sections */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => {
              const section = document.getElementById('student-info')
              section?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Student Information
          </button>
          <button
            onClick={() => {
              const section = document.getElementById('enrollments')
              section?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
          >
            Enrollments
          </button>
          <button
            onClick={() => {
              const section = document.getElementById('payment-history')
              section?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2"
          >
            <Receipt className="h-4 w-4" />
            Payment History
          </button>
        </nav>
      </div>

      {/* Student Info Section */}
      <section id="student-info">
        {/* ... existing student info ... */}
      </section>

      {/* Enrollments Section */}
      <section id="enrollments">
        {/* ... existing enrollments ... */}
      </section>

      {/* Payment History Section */}
      <section id="payment-history">
        <PaymentHistorySection studentId={student.id} />
      </section>
    </div>
  )
}
```

### Step 3: Add Breadcrumb Component (Optional)

Create a reusable breadcrumb component:

**File**: `apps/entities/app/components/Breadcrumb.tsx`

```tsx
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="text-sm text-gray-600" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
            )}
            {item.href ? (
              <Link
                href={item.href}
                className="hover:text-blue-600 transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="font-medium text-gray-900">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

// Usage in StudentDetailPage:
<Breadcrumb
  items={[
    { label: 'Students', href: '/students' },
    { label: student.full_name },
  ]}
/>
```

### Step 4: Add URL Hash Navigation

Support direct navigation via URL hash (e.g., `/students/123#payment-history`):

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function useHashNavigation() {
  const router = useRouter()

  useEffect(() => {
    // Scroll to section on mount if hash is present
    const hash = window.location.hash
    if (hash) {
      const element = document.getElementById(hash.substring(1))
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [])
}

// In StudentDetailPage component:
useHashNavigation()
```

## Next Steps

After completing this task:
1. Update manifest.md - mark Task 8 as "Completed" with date
2. Test all navigation paths to Payment History
3. Move to `task-9-prompt.md` for comprehensive testing
4. Task 9 will validate the entire feature with unit, integration, and E2E tests

## Testing Checklist

- [ ] "Payment History" link visible in student list table actions
- [ ] Clicking link navigates to student detail page Payment History section
- [ ] Quick-access button visible in student detail page header
- [ ] Clicking header button scrolls to Payment History section
- [ ] Breadcrumb displays correct navigation path
- [ ] Tab navigation shows Payment History tab
- [ ] URL hash navigation works (#payment-history)
- [ ] Smooth scrolling to Payment History section
- [ ] Icons display correctly (Receipt, FileText)
- [ ] Navigation works on desktop and tablet
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] ARIA labels present for accessibility
- [ ] Hover states work on links and buttons
- [ ] Active tab state shows when in Payment History section
- [ ] No console errors or warnings
