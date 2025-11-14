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
- Status: Completed
- Started: 2025-11-14
- Completed: 2025-11-14
- Notes: Successfully implemented automated student notification system with database schema for tracking notifications, scheduled job execution via pg_cron, React email template, Resend API integration, and comprehensive unit tests.

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

### Created Files (Task 3):
1. `supabase/migrations/002_entities_domain/010_add_student_contact_preferences.sql` - Migration to add contact_preference to students
2. `supabase/migrations/004_notifications_domain/003_student_notifications_schema.sql` - Student notifications table and RLS
3. `supabase/migrations/004_notifications_domain/004_schedule_due_soon_notifications.sql` - pg_cron scheduled job
4. `emails/payment-reminder.tsx` - React Email template for payment reminders
5. `supabase/functions/send-due-soon-notifications/index.ts` - Edge Function for sending notifications
6. `packages/utils/src/__tests__/email-helpers.test.ts` - Unit tests for email helper functions

### Modified Files (Task 3):
1. `packages/utils/src/email-helpers.ts` - Added sendPaymentReminderEmail function

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

### Task 3 Details

**Database Migrations:**

1. **Student Contact Preferences** (`supabase/migrations/002_entities_domain/010_add_student_contact_preferences.sql`):
   - Added `contact_preference` column to students table
   - CHECK constraint: values must be 'email', 'sms', or 'both'
   - Default value: 'email'
   - Created index for notification queries

2. **Student Notifications Table** (`supabase/migrations/004_notifications_domain/003_student_notifications_schema.sql`):
   - Created `student_notifications` table with fields: id, student_id, installment_id, agency_id, notification_type, sent_at, delivery_status, error_message
   - UNIQUE constraint on (installment_id, notification_type) to prevent duplicate notifications
   - notification_type CHECK constraint: 'due_soon' or 'overdue'
   - delivery_status CHECK constraint: 'sent', 'failed', or 'pending'
   - Comprehensive RLS policies for agency isolation and service role access
   - Indexes for agency_id, student_id, installment_id, notification_type, and failed status

3. **pg_cron Scheduled Job** (`supabase/migrations/004_notifications_domain/004_schedule_due_soon_notifications.sql`):
   - Scheduled job to run daily at 7:00 PM UTC (5:00 AM Brisbane next day)
   - Job name: 'send-due-soon-notifications'
   - Calls Supabase Edge Function via HTTP POST with API key authentication
   - Timing ensures 36-hour advance notice before 5:00 PM cutoff on due date

**Email Template:**

**Payment Reminder Email** (`emails/payment-reminder.tsx`):
- React Email component with professional styling
- Displays: student name, amount due (highlighted in amber), due date, payment instructions
- Optional agency contact information (email and phone)
- Responsive design with consistent color scheme
- Uses @react-email/components for cross-email-client compatibility

**Notification Helper Functions:**

**sendPaymentReminderEmail** (`packages/utils/src/email-helpers.ts`):
- Function signature: `sendPaymentReminderEmail(params): Promise<SendPaymentReminderEmailResult>`
- Parameters: to, studentName, amount, dueDate, paymentInstructions, agencyName, agencyContactEmail, agencyContactPhone
- Returns: `{ success: boolean, messageId?: string, error?: string }`
- Integrates with Resend API for email sending
- Graceful error handling - returns error object instead of throwing
- Validates RESEND_API_KEY environment variable
- Uses RESEND_FROM_EMAIL or defaults to 'Pleeno <noreply@pleeno.com>'
- Comprehensive logging for debugging and monitoring

**Supabase Edge Function:**

**send-due-soon-notifications** (`supabase/functions/send-due-soon-notifications/index.ts`):
- Deno-based Edge Function for scheduled notification sending
- API key authentication via X-API-Key header
- Query logic:
  - Selects installments with status='pending' and student_due_date = CURRENT_DATE + 1 day
  - Joins with payment_plans, enrollments, students, and agencies tables
  - Filters by student contact preference (email or both)
- Duplicate prevention:
  - Checks student_notifications table for existing notification
  - Unique constraint prevents duplicate sends at database level
- Email sending:
  - Generates inline HTML email template (Deno-compatible)
  - Sends via Resend API with exponential backoff retry logic (1s, 2s, 4s)
  - Handles transient errors (network, timeout) vs permanent errors
- Notification logging:
  - Logs all attempts to student_notifications table
  - Tracks delivery_status: 'sent', 'failed', or 'pending'
  - Stores error_message for failed notifications
- Job logging:
  - Creates jobs_log entry at start with status='running'
  - Updates on completion with status='success' or 'failed'
  - Metadata includes: installments_processed, notifications_sent, notifications_failed, errors array

**Unit Tests:**

**email-helpers.test.ts** (`packages/utils/src/__tests__/email-helpers.test.ts`):
- 21 comprehensive unit tests for sendPaymentReminderEmail function
- Test categories:
  - Successful email sending (5 tests)
  - Error handling (7 tests)
  - Edge cases (9 tests)
- Mocks Resend API and React Email template
- Tests include:
  - All required fields
  - Optional agency contact information
  - Currency formatting in subject line
  - Default from email
  - Missing RESEND_API_KEY error
  - Resend API error responses
  - Missing message ID handling
  - Network and timeout errors
  - Non-Error exceptions
  - Large payment amounts
  - Decimal amount formatting
  - Long payment instructions
  - Special characters and unicode in names

**Key Implementation Decisions:**

1. **Timezone Handling:**
   - pg_cron job runs at 7:00 PM UTC = 5:00 AM Brisbane next day
   - Queries installments where student_due_date = CURRENT_DATE + 1 day
   - Provides 36-hour advance notice before 5:00 PM cutoff

2. **Duplicate Prevention:**
   - Database-level unique constraint on (installment_id, notification_type)
   - Application-level check before sending
   - Two-layer protection ensures no duplicate notifications

3. **Error Handling:**
   - Graceful degradation - failures don't crash the job
   - All errors logged to student_notifications table
   - Retry logic for transient errors only
   - Permanent errors (bad email, etc.) logged but not retried

4. **Email vs SMS:**
   - Currently implemented email-only notifications
   - Database schema supports SMS via contact_preference field
   - SMS implementation can be added in future sprint

## Next Steps

Task 3 completed. Ready to proceed with Task 4: Testing and validation
- Run database migrations in test environment
- Test Edge Function locally and in staging
- Verify pg_cron scheduling
- Test end-to-end notification flow
- See task-4-prompt.md for testing procedures
