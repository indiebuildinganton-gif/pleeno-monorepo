# Story 7-4: Commission Report by College - Task 1

## Story Context

**As an** Agency Admin
**I want** to generate commission reports grouped by college/branch with location details
**So that** I can track what commissions are owed to me, distinguish between multiple branches, and use for claim submissions

## Task 1: Create Commissions Report Page

**Acceptance Criteria**: #1, #4

### Task Description

Create the main commissions report page with a report builder UI that allows users to filter by date range and city.

### Subtasks Checklist

- [ ] Create `/reports/commissions` page with report builder UI
- [ ] Add date range filter component:
  - Date from/to inputs with date pickers
  - Preset options: "Last 30 days", "Last 90 days", "This year", "Custom"
  - Default to "This year"
- [ ] Add optional city filter dropdown (populated from branches table)
- [ ] Add "Generate Report" button to trigger API call
- [ ] Create placeholder table to display results
- [ ] Add loading state while report generates
- [ ] Test: Navigate to /reports/commissions → See report builder UI

## Context

### Relevant Acceptance Criteria

1. **Given** I am viewing the reports page
   **When** I generate a commission report
   **Then** I see commission breakdown by college and branch for a selected time period

4. **And** the report includes date range filter

### Key Constraints

- **Reporting Zone Architecture**: Commission report page at `apps/reports/app/reports/commissions/page.tsx`, API routes at `apps/reports/app/api/reports/commissions/`
- **Multi-Tenant Security**: All queries MUST filter by agency_id. RLS enforced on all tables.
- **Performance**: Use database indexes on installments.due_date and branches.city

### Interfaces to Implement

**Commission Report API** (you'll create this in Task 2, but design the frontend to call it):
- Endpoint: `POST /api/reports/commissions`
- Body: `{ date_from, date_to, city? }`
- Returns: `{ data: CommissionRow[], summary: { total_paid, total_earned, total_outstanding } }`

### Dependencies

Required packages (ensure these are installed):
- `date-fns` (^4.1.0) - Date formatting and manipulation for report filters
- `@tanstack/react-table` (^8.21.3) - Table component for commission display (if not already installed)

### Reference Documentation

- Context File: `.bmad-ephemeral/stories/7-4-commission-report-by-college.context.xml`
- Epic Documentation: `docs/epics.md` (Story 7.4 section)
- Architecture: `docs/architecture.md` (Reporting Zone section)
- Related Story: `.bmad-ephemeral/stories/7-2-csv-export-functionality.md` (CSV export patterns)

## CRITICAL: Manifest Creation

Before you begin implementation, you MUST create a manifest file to track progress through all 8 tasks.

**Create file**: `.bmad-ephemeral/stories/prompts/7-4-commission-report-by-college/manifest.md`

**Use this structure**:

```markdown
# Story 7-4 Implementation Manifest

**Story**: Commission Report by College
**Status**: In Progress
**Started**: [Today's Date]

## Task Progress

### Task 1: Create Commissions Report Page
- Status: In Progress
- Started: [Today's Date]
- Completed:
- Notes:

### Task 2: Implement Commission Report API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Display Commission Report Results
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Add CSV Export for Commissions Report
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Create Professional PDF Template for Commissions
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Implement PDF Export API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Add City Grouping/Filtering
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Testing and Validation
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

## Implementation Notes

This is the first task in the story. You are creating the foundation for the commission reporting system.

**Key Implementation Points**:
1. Create the page at `apps/reports/app/reports/commissions/page.tsx`
2. Use Next.js App Router patterns (server components where possible, client components for interactive elements)
3. Implement date range picker with preset options for common ranges
4. City filter should fetch available cities from the branches table (consider using a server action or API call)
5. Add proper loading states using Suspense or loading.tsx
6. Use TypeScript for type safety
7. Follow existing patterns from `apps/reports/app/reports/payment-plans/page.tsx` if it exists

**Architecture Notes**:
- Reports zone uses Next.js with API routes
- This page will call the API route you'll create in Task 2
- Design the UI now, but it will display mock/empty data until Task 2 is complete

## Next Steps

After completing this task:

1. **Update the manifest**:
   - Set Task 1 status to "Completed" with today's date
   - Add any implementation notes (e.g., decisions made, challenges faced)

2. **Move to Task 2**:
   - Open file: `task-2-prompt.md`
   - Task 2 will implement the API route that this page calls
   - Copy and paste the contents into Claude Code Web

3. **Testing**:
   - Navigate to `/reports/commissions`
   - Verify the UI renders with filters and a "Generate Report" button
   - Verify date range defaults to "This year"
   - Verify city dropdown is populated (or shows loading state)
   - Clicking "Generate Report" will not work yet (API not implemented)

## Tips

- Look for existing date picker components in your codebase to reuse
- Check if there's a shared filter component you can extend
- Use Tailwind CSS for styling (following project patterns)
- Ensure proper error boundaries and loading states
- Test the UI before moving to the next task
