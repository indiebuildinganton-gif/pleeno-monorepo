# Story 5-2 Implementation Manifest

**Story**: Due Soon Notification Flags
**Status**: In Progress
**Started**: 2025-11-13

## Task Progress

### Task 1: Implement "due soon" computed field logic
- Status: Completed
- Started: 2025-11-13
- Completed: 2025-11-13
- Notes: All subtasks completed successfully. Database field already existed from Story 5.1, added isDueSoon utility function with comprehensive tests, and created agency settings API route.

### Task 2: Update UI to display "due soon" badges
- Status: Completed
- Started: 2025-11-13
- Completed: 2025-11-13
- Notes: Successfully implemented all UI components for due soon badges, dashboard widget, and payment plan filters with comprehensive test coverage.

### Task 3: Create student notification system
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Testing and validation
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

### Task 1 Details

**Database Schema:**
- The `agencies.due_soon_threshold_days` field (INT, default: 4, constrained 1-30) was already added in migration 010 from Story 5.1
- No new migration was required

**isDueSoon Utility Function:**
- Implemented in `packages/utils/src/date-helpers.ts`
- Signature: `isDueSoon(dueDate: Date | string, thresholdDays: number = 4, timezone: string = 'UTC'): boolean`
- Features:
  - Timezone-aware date calculations using date-fns-tz
  - Handles string and Date object inputs
  - Checks if due date is between today and today + thresholdDays (inclusive)
  - Returns false for past dates or null/undefined inputs
  - Uses start-of-day comparisons for consistent results

**Validation Schema:**
- Added `AgencySettingsUpdateSchema` to `packages/validations/src/agency.schema.ts`
- Validates `due_soon_threshold_days` as optional integer between 1-30

**API Route:**
- Created `apps/agency/app/api/agencies/[id]/settings/route.ts`
- PATCH endpoint for updating agency settings
- Secured with requireRole(['agency_admin'])
- Validates user can only update their own agency
- Returns updated agency data on success

**RLS Policies:**
- Existing RLS policies in migration 003 already cover the new field
- UPDATE policy restricts access to agency_admin role only
- Row-level security automatically applies to all columns

**Tests:**
- Added 19 comprehensive unit tests for isDueSoon function
- All 44 tests in date-helpers.test.ts pass successfully
- Test coverage includes:
  - Default 4-day threshold
  - Different threshold values (2, 7, 30 days)
  - Timezone handling (Brisbane, New York)
  - Edge cases (past dates, today, end-of-day, null inputs)
  - Weekend dates
  - Boundary conditions

## Database Migrations Applied

- [x] agencies.due_soon_threshold_days field added (already existed from Story 5.1 - migration 010)
- [x] RLS policies verified (existing policies cover all fields automatically)
- [x] API route for settings configuration created

## Files Created/Modified

### Created Files (Task 1):
1. `.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/MANIFEST.md` - Implementation tracking manifest
2. `apps/agency/app/api/agencies/[id]/settings/route.ts` - Agency settings API endpoint (PATCH)

### Modified Files (Task 1):
1. `packages/utils/src/date-helpers.ts` - Added isDueSoon utility function
2. `packages/utils/src/__tests__/date-helpers.test.ts` - Added 19 unit tests for isDueSoon
3. `packages/validations/src/agency.schema.ts` - Added AgencySettingsUpdateSchema

### Created Files (Task 2):
1. `apps/dashboard/app/components/DueSoonBadge.tsx` - Reusable due soon badge component
2. `apps/dashboard/app/components/DueSoonWidget.tsx` - Dashboard widget showing count and total
3. `apps/dashboard/app/api/dashboard/due-soon-count/route.ts` - API endpoint for due soon count
4. `apps/payments/app/plans/components/InstallmentStatusBadge.tsx` - Installment status badge with due soon support
5. `apps/payments/app/plans/page.tsx` - Payment plans list page with filtering
6. `apps/dashboard/app/components/__tests__/DueSoonBadge.test.tsx` - DueSoonBadge component tests
7. `apps/dashboard/app/components/__tests__/DueSoonWidget.test.tsx` - DueSoonWidget component tests
8. `apps/payments/app/plans/components/__tests__/InstallmentStatusBadge.test.tsx` - InstallmentStatusBadge component tests

### Task 2 Details

**UI Components:**

1. **DueSoonBadge Component** (`apps/dashboard/app/components/DueSoonBadge.tsx`):
   - Reusable badge component with yellow/amber (warning) styling
   - Props: `daysUntilDue`, `size`, `showIcon`, `className`
   - Uses Badge component from @pleeno/ui with variant="warning"
   - Shows optional countdown: "Due Soon (3d)"
   - Includes Clock icon from lucide-react

2. **DueSoonWidget Component** (`apps/dashboard/app/components/DueSoonWidget.tsx`):
   - Dashboard widget showing count of due soon installments
   - Displays total amount due soon with currency formatting
   - Three states: loading skeleton, data display, empty state
   - Uses React Query with 5-minute cache
   - Links to filtered payment plans view: `/plans?filter=due-soon`
   - Amber color scheme for warning state, green for empty state

3. **InstallmentStatusBadge Component** (`apps/payments/app/plans/components/InstallmentStatusBadge.tsx`):
   - Handles all installment statuses: draft, pending, paid, overdue, cancelled
   - Special handling for "due soon" as computed flag on pending status
   - Color coding: gray (draft/cancelled), blue (pending), warning (due soon), destructive (overdue), success (paid)
   - Icons: Clock (due soon), AlertTriangle (overdue), CheckCircle (paid), XCircle (cancelled)
   - Helper functions: `getInstallmentStatusLabel()`, `getAllInstallmentStatuses()`

4. **Payment Plans List Page** (`apps/payments/app/plans/page.tsx`):
   - Filter tabs: All, Due Soon, Overdue, Pending
   - URL-based filtering: `/plans?filter=due-soon`
   - Payment plan cards showing installments with status badges
   - Displays count of due soon and overdue installments per plan
   - Uses InstallmentStatusBadge for each installment

**API Endpoint:**

**GET /api/dashboard/due-soon-count** (`apps/dashboard/app/api/dashboard/due-soon-count/route.ts`):
- Returns count and total_amount of installments due soon
- Queries installments with status='pending' and student_due_date within threshold
- Uses agency timezone and due_soon_threshold_days configuration
- Security: RLS policies, requires agency_admin or agency_user role
- Caching: 5-minute revalidate via Next.js
- Date range: `today <= student_due_date <= today + threshold_days`

**Tests:**
- DueSoonBadge: 11 tests covering rendering, sizes, icons, days countdown
- DueSoonWidget: 12 tests covering loading, data display, empty state, error handling, formatting
- InstallmentStatusBadge: 35+ tests covering all statuses, due soon flag, icons, color coding, helper functions

**Color Coding Consistency:**
- Yellow/Amber (warning variant): Due soon status - bg-amber-100, text-amber-800
- Red (destructive variant): Overdue status - bg-red-100, text-red-800
- Green (success variant): Paid status - bg-green-100, text-green-800
- Blue (blue variant): Pending status - bg-blue-100, text-blue-800
- Gray (gray variant): Draft/Cancelled status - bg-gray-100, text-gray-800

## Next Steps

Task 2 completed. Ready to proceed with Task 3: Create student notification system
- Requires implementing scheduled job for sending due soon notifications
- Will create student_notifications table for tracking
- Integrate with Resend API for email sending
- See task-3-prompt.md for implementation details
