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
- Status: Not Started
- Started:
- Completed:
- Notes:

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

### Created Files:
1. `.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/MANIFEST.md` - Implementation tracking manifest
2. `apps/agency/app/api/agencies/[id]/settings/route.ts` - Agency settings API endpoint (PATCH)

### Modified Files:
1. `packages/utils/src/date-helpers.ts` - Added isDueSoon utility function
2. `packages/utils/src/__tests__/date-helpers.test.ts` - Added 19 unit tests for isDueSoon
3. `packages/validations/src/agency.schema.ts` - Added AgencySettingsUpdateSchema

## Next Steps

Ready to proceed with Task 2: Update UI to display "due soon" badges
- Requires implementing visual indicators in payment plan and dashboard views
- Will use the isDueSoon utility function to determine which installments to flag
- See task-2-prompt.md for implementation details
