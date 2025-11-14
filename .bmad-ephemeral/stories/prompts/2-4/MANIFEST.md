# Development Manifest: Story 2-4

**Story:** # Story 2.4: User Profile Management

**Generated:** 2025-11-13T06:48:29.250Z

**Status:** In Progress

## Task Prompts

### 1. Create email verification schema for admin email changes
- [x] Prompt: `01-create-email-verification-schema-for-admin-email-c.md`
- [x] Implementation complete
- [ ] Tests written
- [ ] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)
- **Verified:** 2025-11-14 - Migration file confirmed present and correct

### 2. Implement profile update API endpoint
- [x] Prompt: `02-implement-profile-update-api-endpoint.md`
- [x] Implementation complete
- [ ] Tests written
- [ ] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 3. Implement password change API endpoint
- [x] Prompt: `03-implement-password-change-api-endpoint.md`
- [x] Implementation complete
- [ ] Tests written
- [ ] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 4. Implement admin email change API endpoint
- [x] Prompt: `04-implement-admin-email-change-api-endpoint.md`
- [x] Implementation complete
- [ ] Tests written
- [ ] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 5. Implement email verification confirmation endpoint
- [ ] Prompt: `05-implement-email-verification-confirmation-endpoint.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

### 6. Create user profile page
- [ ] Prompt: `06-create-user-profile-page.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

### 7. Create change password dialog
- [ ] Prompt: `07-create-change-password-dialog.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

### 8. Create update email dialog (admin only)
- [x] Prompt: `08-create-update-email-dialog-admin-only-.md`
- [x] Implementation complete
- [ ] Tests written
- [ ] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 9. Create request email change dialog (regular user)
- [x] Prompt: `09-create-request-email-change-dialog-regular-user-.md`
- [x] Implementation complete
- [ ] Tests written
- [ ] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 10. Create email verification page
- [x] Prompt: `10-create-email-verification-page.md`
- [x] Implementation complete
- [ ] Tests written
- [x] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 11. Create email verification email template
- [x] Prompt: `11-create-email-verification-email-template.md`
- [x] Implementation complete
- [ ] Tests written
- [x] Story file updated
- **Status:** Completed (Started: 2025-11-13, Completed: 2025-11-13)

### 12. Create validation schemas
- [ ] Prompt: `12-create-validation-schemas.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

### 13. Add navigation link to profile
- [ ] Prompt: `13-add-navigation-link-to-profile.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

### 14. Implement password strength validator utility
- [ ] Prompt: `14-implement-password-strength-validator-utility.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

### 15. Write tests for profile management
- [ ] Prompt: `15-write-tests-for-profile-management.md`
- [ ] Implementation complete
- [ ] Tests written
- [ ] Story file updated

## Progress Tracking

- Total tasks: 15
- Completed: 8
- In progress: 0
- Remaining: 7

## Notes

Add notes here as you work through the tasks:
- **Task 1 (2025-11-13):** Created email verification schema migration (006_email_verification.sql)
  - Added audit_logs table (needed early for email change tracking, defined in architecture.md for Epic 8)
  - Added email_verified_at, pending_email, email_verification_token fields to users table
  - Implemented consistency constraint ensuring pending_email and token are set together or both NULL
  - Created index on email_verification_token for performance (partial index, only non-NULL values)
  - Implemented log_email_changes() function with automatic audit logging for email change requests and completions
  - Created trigger to automatically log all email changes to audit trail
  - All changes follow architecture.md specifications and RLS patterns
- **Task 2 (2025-11-13):** Implemented profile update API endpoint
  - Created ProfileUpdateSchema in packages/validations/src/user.schema.ts with validation for full_name field
  - Exported schema from validations package index
  - Created PATCH /api/users/me/profile endpoint at apps/agency/app/api/users/me/profile/route.ts
  - Implemented authentication check using Supabase Auth
  - Added request body validation using ProfileUpdateSchema (Zod)
  - Updates users.full_name with automatic updated_at timestamp
  - Returns updated user profile on success
  - Proper error handling with handleApiError() utility
  - RLS policies ensure users can only update their own profile
  - Follows architecture.md API route patterns and security guidelines
- **Task 3 (2025-11-13):** Implemented password change API endpoint
  - Created PasswordChangeSchema in packages/validations/src/user.schema.ts with comprehensive password validation
  - Password requirements: min 8 chars, uppercase, lowercase, number, special character
  - Added confirm_password field with refine() validation to ensure passwords match
  - Created PATCH /api/users/me/password endpoint at apps/agency/app/api/users/me/password/route.ts
  - Verifies current password using supabase.auth.signInWithPassword() before allowing change
  - Updates password using supabase.auth.updateUser() (Supabase handles bcrypt hashing)
  - Logs password change to audit_log table with action 'password_changed' (NO password values logged)
  - Returns success message on completion
  - Proper error handling: UnauthorizedError for auth failures, ValidationError for incorrect current password
  - Follows architecture.md security patterns and audit trail requirements
- **Task 4 (2025-11-13):** Implemented admin email change API endpoint
  - Installed resend package (v6.4.2) in apps/agency via pnpm
  - Created EmailUpdateSchema in packages/validations/src/user.schema.ts with email validation (lowercase, trim, max 255 chars)
  - Created stub email verification template at apps/agency/emails/email-verification.tsx (to be replaced by Task 11)
  - Created PATCH /api/users/{id}/email endpoint at apps/agency/app/api/users/[id]/email/route.ts
  - Verifies requester is agency_admin with proper role and agency_id checks
  - Validates new email is not already in use (checks users table for existing email)
  - Generates secure verification token using crypto.randomUUID()
  - Updates pending_email and email_verification_token in database
  - RLS policies + explicit agency_id check ensure admin can only update users in their agency
  - Sends verification email via Resend (using HTML template; Task 11 will implement React Email)
  - Email configuration: from='noreply@pleeno.com', verification link expires in 1 hour
  - Audit logging handled automatically by log_email_changes() trigger from Task 1
  - Environment variables required: RESEND_API_KEY, NEXT_PUBLIC_APP_URL
  - Proper error handling: UnauthorizedError (401), ForbiddenError (403), ValidationError (400)
  - Follows architecture.md patterns for admin-only operations and email verification workflow
- **Task 8 (2025-11-13):** Created UpdateEmailDialog component (admin-only)
  - Created component at apps/agency/app/profile/components/UpdateEmailDialog.tsx
  - Uses React Hook Form with zodResolver for EmailUpdateSchema validation
  - Imports EmailUpdateSchema from @pleeno/validations package
  - Warning message in yellow alert box about verification requirement
  - New email address input field with validation error display
  - Success toast displays "Verification email sent to [new email]" with 7-second duration
  - Instructions in blue info box: "Check your new email inbox and click the verification link"
  - Mentions 1-hour expiration for verification link
  - Cancel and "Send Verification Email" buttons with proper loading states
  - Calls PATCH /api/users/{userId}/email endpoint (from Task 4)
  - Resets form and closes dialog on success
  - Proper error handling with toast notifications
  - Follows AC8 and AC9: Admin can update email with verification workflow
- **Task 9 (2025-11-13):** Created RequestEmailChangeDialog component (regular users)
  - Created component at apps/agency/app/profile/components/RequestEmailChangeDialog.tsx
  - Imports UI components from @pleeno/ui package (Dialog, Button, Input, Label, useToast)
  - Custom alert-style divs using Tailwind CSS (no Alert component needed)
  - Uses lucide-react AlertCircle icon for visual emphasis
  - Yellow warning alert: "Email changes must be approved by an Agency Admin"
  - Form field: Requested Email Address (email input, required)
  - Form field: Reason for Change (textarea, optional) - native HTML textarea with Tailwind styling
  - Blue informational note about MVP limitations
  - Cancel and "Acknowledge" buttons
  - On submit: Shows toast message directing user to contact Agency Admin (8-second duration)
  - Resets form and closes dialog after submission
  - For MVP: No actual request submission (future: notification system)
  - Follows AC6 and AC7: Regular users must request email changes from Agency Admin
- **Task 10 (2025-11-13):** Created email verification page
  - Created client component at apps/agency/app/verify-email/page.tsx
  - Uses useSearchParams from next/navigation to extract verification token from query params
  - Automatically calls POST /api/users/verify-email?token=... on page load via useEffect
  - Implements three distinct UI states: loading, success, error
  - Loading state: Animated Loader2 spinner icon, "Verifying Your Email" message with wait text
  - Success state: CheckCircle2 icon in green, "Email Verified Successfully!" message
  - Success countdown: 3-second timer with visual countdown display ("Redirecting in X seconds...")
  - Auto-redirect to /profile after countdown completes
  - Manual "Go to Profile Now" button for immediate navigation
  - Error state: XCircle icon in red, displays specific error message from API response
  - Detailed error explanations based on error type:
    - MISSING_TOKEN: Verification link is incomplete
    - Expired/Invalid: Link expired (1 hour), already used, or corrupted
    - NETWORK_ERROR: Connection issues with server
  - Error help section: Explanatory list of possible causes with "What happened?" heading
  - Link back to profile page with Mail icon: "Go to Profile"
  - Instructions to request new verification email from profile page
  - Uses Card components from @pleeno/ui for consistent styling
  - Responsive design: max-w-md container, centered layout on gray-50 background
  - All icons from lucide-react (Loader2, CheckCircle2, XCircle, Mail)
  - Professional, clean appearance matching existing UI patterns
  - Story file updated with completion notes and changelog entry
  - Manifest file updated with task completion status
  - Follows AC9: Email changes require verification with user-friendly flow
- **Task 11 (2025-11-13):** Created email verification email template
  - Created React Email template at emails/email-verification.tsx
  - Implemented EmailVerificationEmail component with TypeScript interface (EmailVerificationProps)
  - Uses @react-email/components: Html, Head, Body, Container, Section, Text, Button, Hr
  - Professional email design matching agency branding, consistent with invitation.tsx template
  - Brand color #0066ff for CTA button, clean modern design with white card on #f6f9fc background
  - Email content includes:
    - Subject: "Verify your new email address" (displayed in heading)
    - Personalized greeting with user name
    - Agency name prominently mentioned in body text
    - Clear explanation of email verification request
    - Primary CTA button: "Verify Email Address" with prominent styling
    - Fallback verification link in styled code block (copy/paste option)
    - Security notice: "This verification link will expire in 1 hour"
    - Disclaimer footer: "If you didn't request this change, please ignore this email"
    - Automated message notice at bottom
  - Template props interface:
    - agencyName: string - Agency name from database (fetched via join)
    - userName: string - Full name of user
    - verificationUrl: string - Complete URL with token ({APP_URL}/verify-email?token={token})
  - Updated API endpoint apps/agency/app/api/users/[id]/email/route.ts:
    - Imported EmailVerificationEmail template using relative path from monorepo root
    - Updated database query to join agencies table: .select('full_name, email, agencies(name)')
    - Extracted agency name from join result with fallback to 'Your Agency'
    - Replaced simple HTML email with React Email template
    - Uses resend.emails.send() with 'react' property instead of 'html'
    - Passes agencyName, userName (targetUser.full_name), and verificationUrl to template
  - Story file updated with completion notes in Dev Agent Record section
  - Manifest file updated with task completion status and detailed notes
  - Follows AC9: Email changes require administrator verification via professional email template

## Issues / Blockers

Document any issues or blockers encountered:
-

---
*Update this file as you complete each task*
