# Story 6.3: Commission Breakdown by College - Task Prompts

This directory contains task-specific prompts for implementing Story 6.3: Commission Breakdown by College.

## Story Overview
**Goal**: Enable Agency Admins to see commission breakdown by college/branch with tax details to identify valuable institutions and prioritize relationships.

## Task Execution Order

Execute these tasks **sequentially** in the order listed below. Each task builds on the previous ones.

### Task 1: Create Commission Breakdown API Route
**File**: [task-1-prompt.md](./task-1-prompt.md)
**Estimated Time**: 3-4 hours
**Description**: Create the backend API endpoint that queries and aggregates commission data with GST calculations.

**Deliverables**:
- API route: `apps/dashboard/app/api/commission-by-college/route.ts`
- Query parameters: `period`, `college_id`, `branch_id`
- Commission aggregation by college/branch
- GST calculation logic (inclusive and exclusive modes)
- Unit tests

### Task 2: Create CommissionBreakdownTable Component
**File**: [task-2-prompt.md](./task-2-prompt.md)
**Estimated Time**: 4-5 hours
**Description**: Create the main React table component using TanStack Table with sorting and data display.

**Deliverables**:
- Component: `apps/dashboard/app/components/CommissionBreakdownTable.tsx`
- TanStack Table configuration with 8 columns
- Column sorting (default: earned commission DESC)
- Currency formatting
- Top 3 performer highlighting
- Loading, error, and empty states
- Component tests

### Task 3: Implement Filter Controls
**File**: [task-3-prompt.md](./task-3-prompt.md)
**Estimated Time**: 3-4 hours
**Description**: Add filtering UI (time period, college, branch) with Zustand state management.

**Deliverables**:
- Zustand store: `packages/stores/src/dashboard-store.ts`
- Time period dropdown (4 options)
- College filter dropdown
- Branch filter dropdown (filtered by college)
- "Clear Filters" button
- Active filter count badge
- Date range indicator
- Component tests

### Task 4: Implement Drill-Down to Payment Plans
**File**: [task-4-prompt.md](./task-4-prompt.md)
**Estimated Time**: 2-3 hours
**Description**: Make college/branch names clickable and add "View Payment Plans" action.

**Deliverables**:
- Clickable college name links → college detail page
- Clickable branch name links → college detail with branch filter
- "View Payment Plans" action → payment plans page with filters
- Payment plan count display
- Hover states and tooltips
- Component tests

### Task 5: Add Summary Metrics
**File**: [task-5-prompt.md](./task-5-prompt.md)
**Estimated Time**: 3-4 hours
**Description**: Display aggregate summary cards (total commissions, GST, total amount, outstanding).

**Deliverables**:
- Summary card component
- 4 summary cards: Commissions Earned, GST, Total Amount, Outstanding
- Calculations from filtered data
- Percentage breakdowns
- Color coding (green, blue, red)
- Icons
- Responsive grid layout
- Component tests

### Task 6: Add Widget Header and Controls
**File**: [task-6-prompt.md](./task-6-prompt.md)
**Estimated Time**: 2-3 hours
**Description**: Wrap components in widget container with header, title, and refresh button.

**Deliverables**:
- Widget container component
- Header with title
- Refresh button (with loading animation)
- Export button placeholder (disabled)
- Date range indicator
- Consistent widget styling
- Component tests

### Task 7: Integrate GST Calculation Logic
**File**: [task-7-prompt.md](./task-7-prompt.md)
**Estimated Time**: 2-3 hours
**Description**: Create reusable utility functions for GST and commission calculations.

**Deliverables**:
- Utility: `packages/utils/src/commission-calculator.ts`
- Function: `calculateGST(amount, rate, inclusive)`
- Function: `calculateTotalWithGST(amount, rate, inclusive)`
- Function: `calculateEarnedCommission(paid, total, expected)`
- Comprehensive JSDoc comments
- Unit tests with 100% coverage

### Task 8: Integrate into Dashboard Page
**File**: [task-8-prompt.md](./task-8-prompt.md)
**Estimated Time**: 1-2 hours
**Description**: Add commission breakdown widget to main dashboard page.

**Deliverables**:
- Edit: `apps/dashboard/app/page.tsx`
- Import and render CommissionBreakdownWidget
- Position below Cash Flow Chart
- Full-width layout
- Section heading (optional)
- Integration tests

### Task 9: Testing
**File**: [task-9-prompt.md](./task-9-prompt.md)
**Estimated Time**: 4-5 hours
**Description**: Comprehensive testing for all components, utilities, and integration points.

**Deliverables**:
- Unit tests for commission calculator (100% coverage)
- API route tests
- Component tests (table, filters, drill-down, summary)
- E2E integration tests
- Test coverage: 80%+ overall
- All acceptance criteria validated

## Total Estimated Time
**28-37 hours** for complete story implementation

## Prerequisites
Before starting, ensure:
- [ ] Story 6.2 (Cash Flow Projection Chart) is complete
- [ ] Dashboard zone structure exists at `apps/dashboard/`
- [ ] Supabase database schema includes required tables (payment_plans, installments, enrollments, branches, colleges, agencies)
- [ ] TanStack Query and Zustand are installed
- [ ] Testing framework (Vitest, Playwright) is configured

## Context Files
- **Story File**: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.md`
- **Context File**: `.bmad-ephemeral/stories/6-3-commission-breakdown-by-college.context.xml`

## Manifest Tracking
Use [manifest.md](./manifest.md) to track progress through each task.

## Usage in Claude Code Web

### For Sequential Execution
1. Open [task-1-prompt.md](./task-1-prompt.md)
2. Copy the entire prompt
3. Paste into Claude Code Web
4. Let Claude Code implement Task 1
5. Verify Task 1 is complete
6. Move to Task 2, repeat

### For Parallel Execution (Advanced)
If you have multiple Claude Code Web sessions:
- Tasks 1 and 7 can be done in parallel (no dependencies)
- Tasks 2-6 depend on Task 1 (API route)
- Task 8 depends on Tasks 2-6 (all components)
- Task 9 can run concurrently with implementation (write tests alongside)

## Success Criteria
All acceptance criteria from Story 6.3 must be met:
- [x] AC #1: Dashboard displays commission breakdown widget
- [x] AC #2: All columns display correctly (college, branch, commissions, GST, totals, expected, earned, outstanding)
- [x] AC #3: Table is sortable by any column
- [x] AC #4: Filters work (time period, college, branch)
- [x] AC #5: Drill-down navigation works (college detail, payment plans)
- [x] AC #6: Top performers highlighted
- [x] AC #7: GST calculations correct (inclusive and exclusive modes)

## Notes
- Each prompt is self-contained with full context
- Prompts include implementation guidance, examples, and test cases
- Follow the sequential order for smooth implementation
- Mark tasks complete in manifest.md as you finish them
