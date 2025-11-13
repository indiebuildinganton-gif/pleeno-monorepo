# Story 7-4: Commission Report by College - Task 3

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 3: Display Commission Report Results

**Acceptance Criteria**: #2-3, #7

**Previous Tasks**:
- Task 1 - Created the report page UI with filters
- Task 2 - Implemented the API route that returns commission data

### Task Description

Create a table component to display commission data grouped by college and branch with expandable drill-down to show student payment plans.

### Subtasks Checklist

- [ ] Create CommissionReportTable component
- [ ] Display columns:
  - College (grouped header spanning all branches)
  - Branch
  - City
  - Total Paid (sum of paid installments)
  - Commission Rate (%)
  - Earned Commission (calculated)
  - Outstanding Commission (overdue installments)
- [ ] Group rows by college with visual separation
- [ ] Add expandable drill-down per branch:
  - Shows list of students with payment plans
  - Displays: Student Name, Payment Plan ID, Total Amount, Paid Amount, Commission Earned
- [ ] Add summary totals row at bottom:
  - Total Paid across all colleges
  - Total Earned Commission
  - Total Outstanding Commission
- [ ] Format currency values with proper symbols and decimals
- [ ] Highlight outstanding commissions in red/warning color
- [ ] Test: Generate report → See grouped commission breakdown with drill-down

## Context

### Relevant Acceptance Criteria

2. **And** each row shows: college, branch, city, total paid by students, commission rate, earned commission, outstanding commission

3. **And** the city field helps distinguish between multiple branches of the same school (e.g., multiple branches in one city or branches in different cities)

7. **And** the report shows supporting details: list of students and payment plans contributing to commission

### Key Constraints

- **Reporting Zone Architecture**: Component at `apps/reports/app/components/CommissionReportTable.tsx`
- **Multi-Tenant Security**: Data already filtered by API, but ensure no client-side data leaks

### Component Interface

The component will receive data from the API in this shape:

```typescript
interface CommissionRow {
  college_id: string;
  college_name: string;
  branch_id: string;
  branch_name: string;
  city: string;
  commission_rate_percent: number;
  total_payment_plans: number;
  total_students: number;
  total_paid: number;
  earned_commission: number;
  outstanding_commission: number;
  payment_plans: Array<{
    student_id: string;
    student_name: string;
    payment_plan_id: string;
    total_amount: number;
    paid_amount: number;
    commission_earned: number;
  }>;
}

interface CommissionSummary {
  total_paid: number;
  total_earned: number;
  total_outstanding: number;
}

interface CommissionReportTableProps {
  data: CommissionRow[];
  summary: CommissionSummary;
}
```

### Dependencies

- `@tanstack/react-table` (^8.21.3) - Table component with sorting, grouping, drill-down (if using this library)
- `lucide-react` - Icons for expand/collapse (ChevronDown, ChevronRight)

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Story Dev Notes: See "UI Components" section with CommissionReportTable example code
- Architecture: `docs/architecture.md` (Reporting Zone components)

## Manifest Update Instructions

Before starting implementation:

1. **Read the manifest**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`
2. **Update Task 2**:
   - Status: Completed
   - Completed: [Today's Date]
   - Notes: [Add any notes from Task 2, e.g., "Created database function and API route, commission calculations working correctly"]
3. **Update Task 3**:
   - Status: In Progress
   - Started: [Today's Date]

## Implementation Notes

**Building on Previous Tasks**: Tasks 1-2 created the page and API. This task creates the visual display of commission data.

**Key Implementation Points**:

1. **File Location**:
   - Create `apps/reports/app/components/CommissionReportTable.tsx`
   - Consider also creating a types file: `apps/reports/app/types/commission-report.ts`

2. **Component Structure**:
   - Use React state to track expanded branches (Set or array of branch IDs)
   - Group data by college before rendering
   - Each college gets a header row (blue background, bold text)
   - Each branch gets a data row (clickable to expand)
   - Expanded state shows nested table with student payment plans

3. **College Grouping**:
   - Group rows by `college_name` using reduce or similar
   - Render college header with distinct styling
   - List all branches under each college

4. **Expandable Drill-Down**:
   - Use ChevronRight (collapsed) and ChevronDown (expanded) icons
   - Toggle expand/collapse on row click
   - Show nested table inside expanded row with student details
   - Student table columns: Student Name, Payment Plan ID, Total Amount, Paid Amount, Commission Earned

5. **Currency Formatting**:
   - Create or use existing `formatCurrency()` helper
   - Display with currency symbol (e.g., "$1,234.56")
   - Consider locale-aware formatting

6. **Visual Design**:
   - College headers: Light blue background (#e6f3ff or similar)
   - Branch rows: Hover state for interactivity
   - Outstanding commission: Red or warning color (#dc2626 or similar)
   - Earned commission: Green or success color (#16a34a or similar)
   - Summary row: Gray background with bold text
   - Use Tailwind CSS classes following project patterns

7. **Table Structure**:
   - Use semantic HTML (`<table>`, `<thead>`, `<tbody>`, `<tfoot>`)
   - Ensure accessibility (proper th/td, scope attributes)
   - Responsive design (consider horizontal scroll on mobile)

8. **Integration with Page**:
   - Update the commissions page from Task 1 to use this component
   - Pass API response data to the component
   - Show component only when data is available (after "Generate Report")

**Example Pattern** (from story Dev Notes):
```typescript
const [expandedBranches, setExpandedBranches] = useState<Set<string>>(new Set())

const toggleBranch = (branchId: string) => {
  const newExpanded = new Set(expandedBranches)
  if (newExpanded.has(branchId)) {
    newExpanded.delete(branchId)
  } else {
    newExpanded.add(branchId)
  }
  setExpandedBranches(newExpanded)
}

// Group data by college
const grouped = data.reduce((acc, row) => {
  if (!acc[row.college_name]) {
    acc[row.college_name] = []
  }
  acc[row.college_name].push(row)
  return acc
}, {} as Record<string, typeof data>)
```

## Next Steps

After completing this task:

1. **Test the Display**:
   - Generate a commission report from the UI
   - Verify data displays in grouped table
   - Click to expand/collapse branches
   - Verify drill-down shows student payment plans
   - Check currency formatting
   - Verify summary totals row

2. **Update the manifest**:
   - Set Task 3 status to "Completed" with today's date
   - Add implementation notes (e.g., "Created table component with expandable drill-down")

3. **Verify Full Flow**:
   - Go to `/reports/commissions`
   - Select date range and optional city filter
   - Click "Generate Report"
   - See commission data grouped by college/branch
   - Expand branches to see student details
   - Verify all acceptance criteria #1-4, #7 are met

4. **Move to Task 4**:
   - Open file: `task-4-prompt.md`
   - Task 4 will add CSV export functionality
   - Copy and paste the contents into Claude Code Web

## Tips

- Look at the story markdown Dev Notes for complete component example code
- Reuse existing table styling patterns from other reports in your codebase
- Test with edge cases: one college with many branches, one branch with many students
- Ensure expandable rows work smoothly (no layout shifts)
- Consider adding sort functionality to columns if needed
- Test with various data sizes to ensure performance is good
- Use React DevTools to verify state management is working correctly
