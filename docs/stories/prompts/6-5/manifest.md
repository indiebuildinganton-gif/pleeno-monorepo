# Story 6-5 Implementation Manifest

**Story**: Overdue Payments Summary Widget
**Status**: Not Started
**Started**:
**Epic**: 6 - Business Intelligence Dashboard

## Story Overview

Create a dedicated widget highlighting all overdue payments with urgency-based color coding, enabling agency users to immediately focus on the most urgent follow-ups.

## Task Progress

### Task 1: Create Overdue Payments API Route
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-1-prompt.md](task-1-prompt.md)
- **Key Deliverables**:
  - API route at `apps/dashboard/app/api/dashboard/overdue-payments/route.ts`
  - Query returns overdue installments with student/college details
  - Days overdue calculation in SQL
  - RLS filtering by agency_id
  - 5-minute cache configuration
- **Notes**:

### Task 2: Create OverduePaymentsWidget Component
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-2-prompt.md](task-2-prompt.md)
- **Key Deliverables**:
  - Component at `apps/dashboard/app/components/OverduePaymentsWidget.tsx`
  - Hook at `apps/dashboard/app/hooks/useOverduePayments.ts`
  - TanStack Query integration with 5-min refresh
  - Color-coded urgency display (yellow/orange/red)
  - Clickable navigation to payment plan details
  - Responsive layout (table desktop, cards mobile)
- **Notes**:

### Task 3: Implement Empty State
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-3-prompt.md](task-3-prompt.md)
- **Key Deliverables**:
  - `OverduePaymentsEmpty` component
  - Celebration styling (green accent, success message)
  - Animation (optional)
  - "Last checked" timestamp
- **Notes**:
- **Design Choice**: (Option A/B/C - document which was chosen)

### Task 4: Add Loading and Error States
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-4-prompt.md](task-4-prompt.md)
- **Key Deliverables**:
  - `OverduePaymentsSkeleton` component
  - `OverduePaymentsError` component with retry
  - Smooth state transitions
  - Error logging
- **Notes**:

### Task 5: Integrate Widget into Dashboard
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-5-prompt.md](task-5-prompt.md)
- **Key Deliverables**:
  - Widget imported in `apps/dashboard/app/page.tsx`
  - Prominent positioning (top/sidebar/below KPIs)
  - Responsive layout verified
  - Above-the-fold visibility
- **Notes**:
- **Placement Choice**: (Option A/B/C - document which was chosen)

### Task 6: Add Auto-Refresh for Real-Time Updates
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-6-prompt.md](task-6-prompt.md)
- **Key Deliverables**:
  - 5-minute auto-refresh interval
  - Window focus refetch
  - Visual indicator for new overdue payments
  - Change detection logic (useRef + useEffect)
- **Notes**:
- **Visual Indicator Choice**: (Option A/B/C - document which was chosen)

### Task 7: Testing
- **Status**: Not Started
- **Started**:
- **Completed**:
- **Prompt File**: [task-7-prompt.md](task-7-prompt.md)
- **Key Deliverables**:
  - API route unit tests (Vitest)
  - Component tests (React Testing Library)
  - E2E tests (Playwright)
  - RLS verification tests
  - Color coding tests
  - Auto-refresh tests
- **Notes**:
- **Test Coverage**: __%

## Implementation Notes

### Architecture Decisions

**TanStack Query Configuration**:
- `staleTime: 300000` (5 minutes)
- `refetchInterval: 300000` (5 minutes)
- `refetchOnWindowFocus: true`
- Shorter interval than other widgets due to urgency

**Color Coding Strategy**:
- 1-7 days overdue: Yellow (warning)
- 8-30 days overdue: Orange (alert)
- 30+ days overdue: Red (critical)

**Database Query Performance**:
- Days overdue calculated in SQL for efficiency
- RLS auto-filters by agency_id
- Index on `(status, agency_id, due_date)` for optimization

### Dependencies Added

- ✅ `@tanstack/react-query`: 5.90.7 (already installed)
- ✅ `date-fns`: 4.1.0 (already installed)
- ✅ `tailwindcss`: 4.x (already installed)
- ✅ Shadcn UI components (already installed)

### Known Issues / Technical Debt

_Document any issues discovered during implementation_

### Future Enhancements

_Ideas for future stories:_
- Browser notifications for new overdue payments
- Sound alerts (user preference)
- Bulk actions ("Send reminder email to all")
- Quick payment recording (inline)
- Export to CSV for follow-up campaigns
- Filter/search by college, student, amount range

## Acceptance Criteria Verification

- [ ] **AC #1**: Widget displays on dashboard showing all overdue installments
- [ ] **AC #2**: Widget shows student name, college, amount, days overdue
- [ ] **AC #3**: List sorted by days overdue (most urgent first)
- [ ] **AC #4**: Each item clickable, navigates to payment plan detail
- [ ] **AC #5**: Widget shows total count and total amount overdue
- [ ] **AC #6**: Empty state shows success message when no overdue payments

## Definition of Done

- [ ] All 7 tasks completed
- [ ] All acceptance criteria met
- [ ] All tests passing (unit, component, E2E)
- [ ] Code reviewed and approved
- [ ] Widget deployed to staging
- [ ] Widget verified on desktop, tablet, mobile
- [ ] RLS verified (no cross-agency data leakage)
- [ ] Auto-refresh verified (5-minute interval + window focus)
- [ ] Documentation updated
- [ ] Story marked as "done" in sprint status

## Demo Checklist

_What to show stakeholders:_
- [ ] Widget on dashboard (with overdue items)
- [ ] Urgency color coding (yellow/orange/red)
- [ ] Total count and amount display
- [ ] Clickable navigation to payment plan
- [ ] Empty state celebration (when no overdue)
- [ ] Auto-refresh demonstration
- [ ] Responsive layout (mobile view)

## Timeline

- **Estimated Effort**: 2-3 days
- **Task 1**: ~2 hours (API route + tests)
- **Task 2**: ~4 hours (Main widget component)
- **Task 3**: ~1 hour (Empty state)
- **Task 4**: ~2 hours (Loading/error states)
- **Task 5**: ~1 hour (Dashboard integration)
- **Task 6**: ~2 hours (Auto-refresh + visual indicators)
- **Task 7**: ~4 hours (Comprehensive testing)

**Total**: ~16 hours

## Related Files

### Created Files
- `apps/dashboard/app/api/dashboard/overdue-payments/route.ts`
- `apps/dashboard/app/api/dashboard/overdue-payments/route.test.ts`
- `apps/dashboard/app/components/OverduePaymentsWidget.tsx`
- `apps/dashboard/app/components/OverduePaymentsWidget.test.tsx`
- `apps/dashboard/app/hooks/useOverduePayments.ts`
- `apps/dashboard/app/hooks/useOverduePayments.test.ts`
- `tests/e2e/dashboard/overdue-payments.spec.ts`

### Modified Files
- `apps/dashboard/app/page.tsx` (widget integration)

### Reference Files
- `.bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.md`
- `.bmad-ephemeral/stories/6-5-overdue-payments-summary-widget.context.xml`
- `docs/epics.md` (Epic 6, Story 6.5)
- `docs/architecture.md` (Dashboard Zone, TanStack Query)

---

**Instructions for Use**:

1. **Start with Task 1**: Read [task-1-prompt.md](task-1-prompt.md) and begin implementation
2. **Update Progress**: Mark tasks as "In Progress" when started, "Completed" when done
3. **Document Decisions**: Add notes for architecture choices (especially for Tasks 3, 5, 6)
4. **Track Issues**: Document any blockers or technical debt discovered
5. **Verify AC**: Check off acceptance criteria as they're satisfied
6. **Complete DoD**: Ensure all Definition of Done items are met before marking story complete

**Next Step**: Open [task-1-prompt.md](task-1-prompt.md) to begin implementation!
