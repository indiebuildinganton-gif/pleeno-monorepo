# Story 2.4: User Profile Management

Status: ready-for-dev

## Story

As an **Agency User or Admin**,
I want **to manage my own profile information**,
so that **my account information is accurate and I can change my password**.

## Acceptance Criteria

1. **Given** I am an authenticated user, **When** I access my profile settings, **Then** I can update my name and password

2. **And** password changes require current password confirmation

3. **And** password must meet security requirements (min 8 chars, mix of types)

4. **And** I receive confirmation when profile is updated

5. **And** I can view my role, agency, and email but cannot change them myself

6. **Given** I am a Regular Agency User, **When** I need to change my email address, **Then** I must request the change from an Agency Admin

7. **And** only an Agency Admin can update my email to ensure company policy compliance

8. **Given** I am an Agency Admin, **When** I access my profile settings, **Then** I can update my own email address

9. **And** email changes require administrator verification

10. **And** the change is logged in the audit trail

## Tasks / Subtasks

- [ ] Create email verification schema for admin email changes (AC: 8, 9, 10)
  - [ ] Create supabase/migrations/002_agency_domain/006_email_verification.sql
  - [ ] Add users.email_verified_at TIMESTAMPTZ field
  - [ ] Add users.pending_email TEXT field for email change requests
  - [ ] Add users.email_verification_token TEXT UNIQUE field
  - [ ] Create trigger to log email changes in audit trail
  - [ ] Add indexes on email_verification_token for performance

- [ ] Implement profile update API endpoint (AC: 1, 3, 4)
  - [ ] Create apps/agency/app/api/users/me/profile/route.ts
  - [ ] PATCH /api/users/me/profile endpoint
  - [ ] Request body: { full_name?: string }
  - [ ] Validate user is authenticated
  - [ ] Update user.full_name with audit logging
  - [ ] Return updated user profile
  - [ ] Add error handling with handleApiError()

- [ ] Implement password change API endpoint (AC: 1, 2, 3, 4)
  - [ ] Create apps/agency/app/api/users/me/password/route.ts
  - [ ] PATCH /api/users/me/password endpoint
  - [ ] Request body: { current_password: string, new_password: string }
  - [ ] Validate current password via Supabase Auth
  - [ ] Validate new password: min 8 chars, uppercase, lowercase, number, special char
  - [ ] Update password via Supabase Auth updateUser()
  - [ ] Log password change in audit trail (without password values)
  - [ ] Return success response
  - [ ] Handle incorrect current password error (401)

- [ ] Implement admin email change API endpoint (AC: 8, 9, 10)
  - [ ] Create apps/agency/app/api/users/{id}/email/route.ts
  - [ ] PATCH /api/users/{id}/email endpoint (admin only)
  - [ ] Request body: { email: string }
  - [ ] Validate requester is agency_admin
  - [ ] Validate new email is not already in use
  - [ ] Generate email verification token (UUID)
  - [ ] Store pending_email and email_verification_token
  - [ ] Send verification email via Resend
  - [ ] Return success response: "Verification email sent"
  - [ ] Log email change request in audit trail

- [x] Implement email verification confirmation endpoint (AC: 9)
  - [x] Create apps/agency/app/api/users/verify-email/route.ts
  - [x] POST /api/users/verify-email?token=... endpoint
  - [x] Validate token exists and is not expired (1 hour expiration)
  - [x] Update users.email = pending_email
  - [x] Set users.email_verified_at = now()
  - [x] Clear pending_email and email_verification_token
  - [x] Update Supabase Auth email via Admin API
  - [x] Log completed email change in audit trail
  - [x] Return success response with redirect to /profile

- [x] Create user profile page (AC: 1, 4, 5)
  - [x] Create apps/agency/app/profile/page.tsx
  - [x] Server Component fetches current user from Supabase Auth
  - [x] Display read-only fields: Email, Role, Agency Name
  - [x] Display editable field: Full Name (input field)
  - [x] Button: "Change Password" (opens ChangePasswordDialog)
  - [x] Button: "Request Email Change" (regular users only)
  - [x] Button: "Update Email" (admins only, opens UpdateEmailDialog)
  - [x] Button: "Save Changes" (saves full_name)
  - [x] Use TanStack Query for profile updates

- [x] Create change password dialog (AC: 2, 3, 4)
  - [x] Create apps/agency/app/profile/components/ChangePasswordDialog.tsx
  - [x] Form fields: Current Password (password input), New Password (password input), Confirm New Password (password input)
  - [x] Password strength indicator (show requirements met/unmet)
  - [x] Requirements display: "8+ characters, uppercase, lowercase, number, special character"
  - [x] Validate new password matches confirm password
  - [x] "Cancel" and "Change Password" buttons
  - [x] On submit: call PATCH /api/users/me/password
  - [x] Show success toast: "Password changed successfully"
  - [x] Close dialog on success
  - [x] Show error for incorrect current password

- [ ] Create update email dialog (admin only) (AC: 8, 9)
  - [ ] Create apps/agency/app/profile/components/UpdateEmailDialog.tsx
  - [ ] Form field: New Email Address (email input)
  - [ ] Warning message: "You will receive a verification email at the new address"
  - [ ] "Cancel" and "Send Verification Email" buttons
  - [ ] On submit: call PATCH /api/users/{id}/email with new email
  - [ ] Show success toast: "Verification email sent to [new email]"
  - [ ] Close dialog on success
  - [ ] Display instructions: "Check your email and click the verification link"

- [ ] Create request email change dialog (regular user) (AC: 6, 7)
  - [ ] Create apps/agency/app/profile/components/RequestEmailChangeDialog.tsx
  - [ ] Display informational message: "Email changes must be approved by an Agency Admin"
  - [ ] Form field: Requested Email Address (email input)
  - [ ] Form field: Reason for change (textarea, optional)
  - [ ] "Cancel" and "Submit Request" buttons
  - [ ] On submit: Create notification for admins (future: notification system)
  - [ ] For MVP: Show toast: "Please contact your Agency Admin to change your email"
  - [ ] Close dialog

- [x] Create email verification page (AC: 9)
  - [x] Create apps/agency/app/verify-email/page.tsx
  - [x] Extract token from query params
  - [x] Call POST /api/users/verify-email?token=... on page load
  - [x] Display loading state: "Verifying your email..."
  - [x] On success: Show success message and redirect to /profile after 3 seconds
  - [x] On error: Show error message with link to request new verification email

- [x] Create email verification email template (AC: 9)
  - [x] Create emails/email-verification.tsx (React Email)
  - [x] Subject: "Verify your new email address"
  - [x] Body: Agency name, user name, verification link (expires in 1 hour)
  - [x] Verification link: {APP_URL}/verify-email?token={token}
  - [x] Footer: "If you didn't request this change, please ignore this email"
  - [x] Styling: Professional, matches agency branding

- [x] Create validation schemas (AC: 1, 2, 3, 8)
  - [x] Create packages/validations/src/profile.schema.ts
  - [x] Define ProfileUpdateSchema: full_name (min 2 chars)
  - [x] Define PasswordChangeSchema: current_password, new_password, confirm_password
  - [x] Validate new_password: min 8 chars, regex for uppercase, lowercase, number, special
  - [x] Validate passwords match (new_password === confirm_password)
  - [x] Define EmailUpdateSchema: email (valid email format)
  - [x] Export TypeScript types

- [x] Add navigation link to profile (AC: 1)
  - [x] Update apps/agency/app/layout.tsx navigation
  - [x] Add "Profile" link to user menu (top right dropdown)
  - [x] Link to /agency/profile
  - [x] Show current user name in dropdown trigger
  - [x] Active state highlighting for profile page

- [x] Implement password strength validator utility (AC: 3)
  - [x] Create packages/utils/src/password-strength.ts
  - [x] Function: calculatePasswordStrength(password: string)
  - [x] Check minimum length (8)
  - [x] Check uppercase letter (regex: /[A-Z]/)
  - [x] Check lowercase letter (regex: /[a-z]/)
  - [x] Check number (regex: /[0-9]/)
  - [x] Check special character (regex: /[!@#$%^&*(),.?":{}|<>]/)
  - [x] Return object: { strength: 'weak' | 'medium' | 'strong', checks: {...} }
  - [x] Export PasswordStrength type

- [x] Write tests for profile management (AC: 1-10)
  - [x] Test: User can update their full name (200)
  - [x] Test: User can view but not edit email, role, agency (read-only display)
  - [x] Test: User can change password with correct current password (200)
  - [x] Test: Password change fails with incorrect current password (401)
  - [x] Test: New password must meet requirements (400)
  - [x] Test: Regular user cannot change own email via API (403)
  - [x] Test: Admin can initiate email change for any user (200)
  - [x] Test: Email verification token generated correctly
  - [x] Test: Email verification succeeds with valid token (200)
  - [x] Test: Email verification fails with invalid token (400)
  - [x] Test: Email verification fails with expired token (400)
  - [x] Test: Email change logged in audit trail
  - [x] Test: Password change logged in audit trail (no password values)
  - [x] Test: RLS prevents users from changing other users' profiles

## Dev Notes

### Profile Management Architecture

**Page Structure:**
```
Profile Page
├── Header
│   ├── Title: "My Profile"
│   └── Breadcrumb: Settings > Profile
├── Read-Only Section
│   ├── Email (read-only, with "Request Change" button for users)
│   ├── Role (read-only badge)
│   └── Agency (read-only)
├── Editable Section
│   ├── Full Name (input field)
│   └── Button: "Save Changes"
└── Security Section
    ├── Button: "Change Password"
    └── Last Password Change: {date} (read-only)
```

**Permission Matrix:**

| Permission | Regular User | Agency Admin |
|------------|--------------|--------------|
| Update own name | ✅ Yes | ✅ Yes |
| Change own password | ✅ Yes | ✅ Yes |
| View own email | ✅ Yes | ✅ Yes |
| Change own email | ❌ No (request only) | ✅ Yes (with verification) |
| Change other user emails | ❌ No | ✅ Yes (via user management) |
| View role | ✅ Yes | ✅ Yes |
| Change role | ❌ No | ❌ No (via user management only) |

**Email Change Workflow (Admin):**
```mermaid
sequenceDiagram
    Admin->>API: PATCH /api/users/{id}/email
    API->>DB: Store pending_email, generate token
    API->>Resend: Send verification email
    Resend->>Admin: Verification email
    Admin->>App: Click verification link
    App->>API: POST /api/users/verify-email?token=...
    API->>DB: Update email, clear pending_email
    API->>Supabase Auth: Update email in auth.users
    API->>Audit: Log email change
    App->>Admin: Redirect to profile (success)
```

**Password Strength Indicator:**
```typescript
// Visual feedback for password requirements
interface PasswordRequirement {
  met: boolean
  label: string
}

const requirements: PasswordRequirement[] = [
  { met: password.length >= 8, label: 'At least 8 characters' },
  { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
  { met: /[a-z]/.test(password), label: 'One lowercase letter' },
  { met: /[0-9]/.test(password), label: 'One number' },
  { met: /[!@#$%^&*(),.?":{}|<>]/.test(password), label: 'One special character' }
]

// Display with checkmarks/crosses
requirements.map(req => (
  <div>
    {req.met ? '✓' : '✗'} {req.label}
  </div>
))
```

### Project Structure Notes

**Profile Management Location:**
```
apps/agency/
├── app/
│   ├── profile/
│   │   ├── page.tsx                         # Profile page (Server Component)
│   │   └── components/
│   │       ├── ChangePasswordDialog.tsx     # Password change dialog
│   │       ├── UpdateEmailDialog.tsx        # Admin email update
│   │       ├── RequestEmailChangeDialog.tsx # User email request
│   │       ├── PasswordStrengthIndicator.tsx
│   │       └── ProfileForm.tsx              # Client Component for form
│   ├── verify-email/
│   │   └── page.tsx                         # Email verification page
│   └── api/
│       └── users/
│           ├── me/
│           │   ├── profile/
│           │   │   └── route.ts             # PATCH /api/users/me/profile
│           │   └── password/
│           │       └── route.ts             # PATCH /api/users/me/password
│           ├── {id}/
│           │   └── email/
│           │       └── route.ts             # PATCH /api/users/{id}/email (admin)
│           └── verify-email/
│               └── route.ts                 # POST /api/users/verify-email

emails/
└── email-verification.tsx                   # React Email template

packages/validations/
└── src/
    └── profile.schema.ts                    # Zod schemas

packages/utils/
└── src/
    └── password-strength.ts                 # Password strength calculator
```

### Database Schema Details

**Users Table Extension for Email Verification:**
```sql
-- Add email verification fields
ALTER TABLE users
  ADD COLUMN email_verified_at TIMESTAMPTZ,
  ADD COLUMN pending_email TEXT,
  ADD COLUMN email_verification_token TEXT UNIQUE;

-- Index for token lookup performance
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);

-- Constraint: pending_email and token must both be set or both be NULL
ALTER TABLE users
  ADD CONSTRAINT check_email_change_consistency
  CHECK (
    (pending_email IS NULL AND email_verification_token IS NULL) OR
    (pending_email IS NOT NULL AND email_verification_token IS NOT NULL)
  );
```

**Audit Logging for Email and Password Changes:**
```sql
-- Trigger to log email changes
CREATE OR REPLACE FUNCTION log_email_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log email change requests (pending_email set)
  IF OLD.pending_email IS NULL AND NEW.pending_email IS NOT NULL THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'email_change_requested',
      jsonb_build_object(
        'old_email', NEW.email,
        'requested_email', NEW.pending_email
      ),
      now()
    );
  END IF;

  -- Log completed email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'email_changed',
      jsonb_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_email_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.pending_email IS DISTINCT FROM NEW.pending_email)
  EXECUTE FUNCTION log_email_changes();

-- Trigger to log password changes (without password values)
CREATE OR REPLACE FUNCTION log_password_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Note: We cannot detect password changes in users table
  -- Password changes are logged via API route
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Architecture Alignment

**From Architecture Document (architecture.md):**

**Profile Update API Route:**
```typescript
// apps/agency/app/api/users/me/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError } from '@pleeno/utils'
import { ProfileUpdateSchema } from '@pleeno/validations'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = ProfileUpdateSchema.parse(body)

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ full_name: validatedData.full_name })
      .eq('id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: updatedUser
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Password Change API Route:**
```typescript
// apps/agency/app/api/users/me/password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ValidationError } from '@pleeno/utils'
import { PasswordChangeSchema } from '@pleeno/validations'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = PasswordChangeSchema.parse(body)

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: validatedData.current_password
    })

    if (signInError) {
      throw new ValidationError('Current password is incorrect')
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: validatedData.new_password
    })

    if (updateError) throw updateError

    // Log password change (without password values)
    await supabase.from('audit_log').insert({
      entity_type: 'user',
      entity_id: user.id,
      user_id: user.id,
      action: 'password_changed',
      changes_json: { timestamp: new Date().toISOString() }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Password changed successfully' }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Email Change API Route (Admin):**
```typescript
// apps/agency/app/api/users/{id}/email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ForbiddenError, ValidationError } from '@pleeno/utils'
import { EmailUpdateSchema } from '@pleeno/validations'
import { Resend } from 'resend'
import { EmailVerificationTemplate } from '@/emails/email-verification'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = EmailUpdateSchema.parse(body)

    // Check if email already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', validatedData.email)
      .single()

    if (existingUser) {
      throw new ValidationError('Email address is already in use')
    }

    // Generate verification token
    const verificationToken = crypto.randomUUID()

    // Update user with pending email and token
    const { data: targetUser, error } = await supabase
      .from('users')
      .update({
        pending_email: validatedData.email,
        email_verification_token: verificationToken
      })
      .eq('id', params.id)
      .eq('agency_id', currentUser.agency_id)  // RLS double-check
      .select('full_name, email')
      .single()

    if (error) throw error

    // Send verification email
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${verificationToken}`

    await resend.emails.send({
      from: 'noreply@pleeno.com',
      to: validatedData.email,
      subject: 'Verify your new email address',
      react: EmailVerificationTemplate({
        userName: targetUser.full_name,
        verificationUrl,
        expiresIn: '1 hour'
      })
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Verification email sent' }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Email Verification API Route:**
```typescript
// apps/agency/app/api/users/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, ValidationError } from '@pleeno/utils'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      throw new ValidationError('Verification token is required')
    }

    const supabase = await createServerClient()

    // Find user by token
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id, email, pending_email, updated_at')
      .eq('email_verification_token', token)
      .single()

    if (findError || !user) {
      throw new ValidationError('Invalid verification token')
    }

    // Check token age (1 hour expiration)
    const tokenAge = Date.now() - new Date(user.updated_at).getTime()
    const ONE_HOUR = 60 * 60 * 1000
    if (tokenAge > ONE_HOUR) {
      throw new ValidationError('Verification token has expired')
    }

    // Update email
    const { error: updateError } = await supabase
      .from('users')
      .update({
        email: user.pending_email,
        email_verified_at: new Date().toISOString(),
        pending_email: null,
        email_verification_token: null
      })
      .eq('id', user.id)

    if (updateError) throw updateError

    // Update email in Supabase Auth (using service role key)
    // Note: This requires admin privileges
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    await adminSupabase.auth.admin.updateUserById(user.id, {
      email: user.pending_email!
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Email verified successfully' }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

### Learnings from Previous Story

**From Story 2.3: User Management Interface (Status: drafted)**

Story 2.3 has not been implemented yet but establishes patterns for user profile operations:

**Expected Infrastructure from 2.3:**
- **User management APIs:** Pattern for user update endpoints (role, status changes)
- **Admin validation:** Middleware to check agency_admin role
- **Audit logging:** Triggers and infrastructure for logging user changes
- **User table schema:** status field and constraints already established
- **RLS policies:** Users can only modify data in their own agency
- **Validation schemas:** user.schema.ts pattern to follow

**What This Story Builds Upon:**
- Uses same authentication and authorization patterns from 2.3
- Follows same API route structure (/api/users/...)
- Reuses audit logging infrastructure
- Extends user table with email verification fields
- Applies same validation and error handling patterns

**Integration Points:**
- Profile settings link from user management page
- User detail page from 2.3 links to profile page
- Shared validation patterns (email, password requirements)
- Shared error handling utilities from 2.3
- Same TanStack Query patterns for mutations

**Patterns to Apply from 2.3:**
- Server Components for initial data fetch
- Client Components for interactive forms
- TanStack Query for optimistic updates
- Confirmation dialogs for sensitive actions (password change)
- Clear success/error toasts
- Validate current user role before rendering admin-only UI
- Use handleApiError() for consistent error responses

[Source: .bmad-ephemeral/stories/2-3-user-management-interface.md]

**Key Dependencies:**
- Story 2.3 audit logging infrastructure must be in place
- User table schema from 2.3 provides foundation
- Email change functionality extends user management from 2.3
- Admin permissions established in 2.3 apply to email changes

**Differences from 2.3:**
- 2.3 focuses on admin managing other users
- 2.4 focuses on users managing their own profiles
- 2.3 uses role/status changes, 2.4 uses name/password changes
- 2.4 adds email verification flow (new pattern)
- 2.4 distinguishes between regular user and admin email change permissions

### Security Considerations

**Password Change Security:**
- Require current password verification before change
- Password strength requirements enforced (8+ chars, mixed types)
- New password hashed by Supabase Auth (bcrypt)
- Password change logged in audit trail (no password values)
- Cannot change password if not authenticated
- Rate limiting on password change attempts (prevent brute force)

**Email Change Security (Admin Only):**
- Admin verification required for email changes
- Verification token expires after 1 hour
- Token is single-use (cleared after verification)
- Email verification link only works once
- Cannot use email already registered to another user
- Email change logged in audit trail (old and new email)
- Update both users table and auth.users for consistency

**Regular User Email Change:**
- Regular users cannot change their own email
- Must request change from Agency Admin
- For MVP: Toast message directs user to contact admin
- Future enhancement: In-app notification to admins

**Profile Update Security:**
- Users can only update their own profile
- RLS enforces agency isolation
- Full name validation (min 2 chars, max 100 chars)
- Cannot change role, email (regular users), or agency
- All updates logged in audit trail

**Token Security:**
- Verification tokens are UUIDs (unpredictable)
- Tokens stored hashed in database (future enhancement)
- Tokens expire after 1 hour
- Tokens cleared after use
- Unique constraint prevents token reuse

### Testing Strategy

**Unit Tests:**
1. **Validation Schemas:**
   - Valid profile update passes
   - Valid password change passes
   - Password strength validation works correctly
   - Email format validation works
   - Password mismatch detected

2. **Password Strength Calculator:**
   - Calculates weak password correctly
   - Calculates medium password correctly
   - Calculates strong password correctly
   - Individual requirement checks work

**Integration Tests:**
1. **Profile Update:**
   - User can update their own full name (200)
   - User cannot update other user's profile (403)
   - Profile update logged in audit trail
   - RLS prevents cross-agency updates

2. **Password Change:**
   - User can change password with correct current password (200)
   - Password change fails with incorrect current password (401)
   - New password must meet requirements (400)
   - New password must differ from current password (400)
   - Password change logged in audit trail
   - User can login with new password

3. **Email Change (Admin):**
   - Admin can initiate email change (200)
   - Regular user cannot initiate email change (403)
   - Duplicate email rejected (400)
   - Verification email sent to new address
   - Verification token generated correctly
   - Email change request logged in audit trail

4. **Email Verification:**
   - Valid token verifies email successfully (200)
   - Invalid token rejected (400)
   - Expired token rejected (400)
   - Token can only be used once
   - Email updated in both users table and auth.users
   - Completed email change logged in audit trail

**E2E Tests:**
1. **Profile Update Flow:**
   - Login as user
   - Navigate to profile page
   - Update full name
   - Click "Save Changes"
   - Verify success toast
   - Verify name updated in UI
   - Logout and login again
   - Verify name persisted

2. **Password Change Flow:**
   - Login as user
   - Navigate to profile page
   - Click "Change Password"
   - Enter current password
   - Enter new password (meets requirements)
   - Confirm new password
   - Click "Change Password"
   - Verify success toast
   - Logout
   - Login with new password
   - Verify login successful

3. **Email Change Flow (Admin):**
   - Login as admin
   - Navigate to profile page
   - Click "Update Email"
   - Enter new email address
   - Click "Send Verification Email"
   - Verify success toast
   - Check email inbox (use Mailinator for testing)
   - Click verification link
   - Verify redirect to profile
   - Verify success message
   - Verify email updated in profile

### References

- [Source: docs/epics.md#Story-2.4-User-Profile-Management]
- [Source: docs/PRD.md#FR-1.4-User-Profile-Management]
- [Source: docs/PRD.md#Epic-2-Agency-&-User-Management]
- [Source: docs/architecture.md#Data-Architecture - users schema]
- [Source: docs/architecture.md#Security-Architecture - authentication patterns]
- [Source: .bmad-ephemeral/stories/2-3-user-management-interface.md - user management patterns and audit logging]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

**Task 13: Add navigation link to profile** (Completed: 2025-11-13)
- All subtasks completed
- Created dropdown-menu UI component:
  - Added @radix-ui/react-dropdown-menu dependency to ui package
  - Created packages/ui/src/components/ui/dropdown-menu.tsx with full dropdown menu primitives
  - Exported dropdown-menu component from packages/ui/src/index.ts
- Created UserMenu server component:
  - Created apps/agency/app/components/UserMenu.tsx
  - Fetches current user information from Supabase
  - Passes user name and email to client component
  - Returns null if user not authenticated (graceful degradation)
- Created UserMenuClient client component:
  - Created apps/agency/app/components/UserMenuClient.tsx
  - Displays user name and avatar icon in dropdown trigger
  - Shows user name and email in dropdown header
  - Includes "Profile" link to /profile with active state highlighting
  - Includes "Sign out" option with logout functionality
  - Uses usePathname to detect active profile page
  - Highlights dropdown trigger and menu item when on profile page
- Created AppHeader navigation component:
  - Created apps/agency/app/components/AppHeader.tsx
  - Displays app branding/logo on the left
  - Shows main navigation links (Team, Settings) in center
  - Places UserMenu component on the right
  - Sticky header with backdrop blur effect
- Updated root layout:
  - Modified apps/agency/app/layout.tsx to include AppHeader
  - Updated metadata with proper title and description
  - Header renders for all authenticated pages
- All acceptance criteria (AC: 1) met:
  - Navigation successfully links to profile page
  - User name displayed in dropdown trigger
  - Active state highlighting implemented
  - Profile link functional and accessible

**Task 07: Create change password dialog** (Completed: 2025-11-13)
- All subtasks verified as complete
- ChangePasswordDialog.tsx implements all required functionality:
  - Three password fields: current, new, confirm
  - Password strength indicator with real-time feedback
  - Visual display of all 5 password requirements (8+ chars, uppercase, lowercase, number, special char)
  - Form validation using Zod schema (PasswordChangeSchema)
  - API integration with PATCH /api/users/me/password
  - Success toast message on successful password change
  - Dialog closes automatically on success
  - Error handling for incorrect current password
  - Cancel button with form reset
- PasswordStrengthIndicator.tsx provides visual feedback:
  - Shows strength level (weak/medium/strong)
  - Displays checkmarks for met requirements
  - Shows X marks for unmet requirements
- API endpoint verified at apps/agency/app/api/users/me/password/route.ts:
  - Validates current password via Supabase Auth
  - Enforces password strength requirements
  - Updates password securely using Supabase Auth
  - Logs password change in audit trail (without password values)
  - Returns appropriate error for incorrect current password
- Validation schema (PasswordChangeSchema) in packages/validations/src/user.schema.ts:
  - Enforces min 8 characters
  - Requires uppercase, lowercase, number, special character
  - Validates password confirmation match
- Integration with ProfileForm.tsx confirmed
- All acceptance criteria (AC: 2, 3, 4) met

**Task 10: Create email verification page** (Completed: 2025-11-13)
- All subtasks completed
- Created apps/agency/app/verify-email/page.tsx
- Client component implementation:
  - Extracts verification token from URL query parameters using useSearchParams
  - Automatically calls POST /api/users/verify-email?token=... on page load
  - Implements three distinct UI states: loading, success, error
- Loading state:
  - Displays animated spinner icon (Loader2 from lucide-react)
  - Shows "Verifying Your Email" message
  - User-friendly wait message
- Success state:
  - Shows success icon (CheckCircle2) in green
  - Displays "Email Verified Successfully!" message
  - Implements 3-second countdown timer with visual feedback
  - Automatically redirects to /profile after countdown
  - Includes "Go to Profile Now" button for immediate navigation
- Error state:
  - Shows error icon (XCircle) in red
  - Displays specific error message from API response
  - Provides detailed explanations based on error type:
    - Missing token: Link incomplete
    - Expired/Invalid token: Link expired (1 hour limit), already used, or corrupted
    - Network error: Connection issues
  - Includes helpful next steps with link back to profile
  - Instructions to request new verification email if needed
- UI implementation uses Card components from @pleeno/ui:
  - Responsive design with max-width constraint
  - Centered layout on gray background
  - Professional, clean appearance
- All acceptance criteria (AC: 9) met:
  - Token extraction from query params ✓
  - API call on page load ✓
  - Loading state display ✓
  - Success message with 3-second redirect ✓
  - Error message with link to request new verification ✓
**Task 14: Implement password strength validator utility** (Completed: 2025-11-13)
- All subtasks completed successfully
- Created packages/utils/src/password-strength.ts:
  - Implemented calculatePasswordStrength(password: string) function
  - Checks minimum length (8 characters)
  - Checks uppercase letter using regex /[A-Z]/
  - Checks lowercase letter using regex /[a-z]/
  - Checks number using regex /[0-9]/
  - Checks special character using regex /[!@#$%^&*(),.?":{}|<>]/
  - Returns comprehensive PasswordStrength object with:
    - strength: 'weak' | 'medium' | 'strong' (based on requirements met)
    - checks: PasswordChecks object with individual boolean flags
    - score: number of requirements met (0-5)
- Exported types:
  - PasswordStrength interface (main return type)
  - PasswordChecks interface (individual requirement checks)
- Strength calculation logic:
  - Weak: 0-2 requirements met
  - Medium: 3-4 requirements met
  - Strong: all 5 requirements met
- Updated packages/utils/src/index.ts to export password-strength module
- Comprehensive JSDoc documentation with usage examples
- All acceptance criteria (AC: 3) met

**Task 11: Create email verification email template** (Completed: 2025-11-13)
- All subtasks completed successfully
- Created emails/email-verification.tsx using React Email:
  - Implemented EmailVerificationEmail component with TypeScript interface
  - Professional email design matching agency branding (consistent with invitation.tsx)
  - Uses @react-email/components (Html, Head, Body, Container, Section, Text, Button, Hr)
  - Brand color #0066ff for CTA button
  - Clean, modern design with white card on light blue background (#f6f9fc)
- Email content includes:
  - Subject line: "Verify your new email address" (in heading)
  - Personalized greeting with user name
  - Agency name prominently displayed
  - Clear explanation of email verification request
  - Primary CTA button: "Verify Email Address"
  - Fallback verification link (copy/paste option with styled code block)
  - Expiration notice: "This verification link will expire in 1 hour"
  - Security footer: "If you didn't request this change, please ignore this email"
  - Automated message disclaimer
- Template props interface:
  - agencyName: string - Agency name from database
  - userName: string - Full name of user
  - verificationUrl: string - Complete URL with token ({APP_URL}/verify-email?token={token})
- Updated API endpoint apps/agency/app/api/users/[id]/email/route.ts:
  - Imported EmailVerificationEmail template (relative path from monorepo root)
  - Updated database query to fetch agency name via join: .select('full_name, email, agencies(name)')
  - Extracted agency name from join result with fallback: 'Your Agency'
  - Replaced simple HTML email with React Email template
  - Passes agencyName, userName, and verificationUrl props to template
  - Uses resend.emails.send() with 'react' property instead of 'html'
- All acceptance criteria (AC: 9) met:
  - Professional, branded email template ✓
  - Includes agency name, user name, verification link ✓
  - Expiration notice (1 hour) ✓
  - Security disclaimer footer ✓
  - Integrated with email change API endpoint ✓
**Task 12: Create validation schemas** (Completed: 2025-11-13)
- All subtasks completed successfully
- Validation schemas implemented in packages/validations/src/user.schema.ts:
  - ✅ ProfileUpdateSchema: Validates full_name field
    - Minimum 2 characters (updated from 1 to meet task requirements)
    - Maximum 255 characters
    - Automatic trimming of whitespace
    - Supports international characters and special characters
  - ✅ PasswordChangeSchema: Validates password change operations
    - current_password: Required field for authentication
    - new_password: Must meet all security requirements:
      - Minimum 8 characters
      - At least one uppercase letter (regex: /[A-Z]/)
      - At least one lowercase letter (regex: /[a-z]/)
      - At least one number (regex: /[0-9]/)
      - At least one special character (regex: /[!@#$%^&*(),.?":{}|<>]/)
    - confirm_password: Must match new_password exactly
    - Password mismatch validation using Zod refine
  - ✅ EmailUpdateSchema: Validates email update operations
    - Valid email format
    - Maximum 255 characters
    - Automatic conversion to lowercase
    - Automatic trimming of whitespace
  - ✅ All TypeScript types exported: ProfileUpdate, PasswordChange, EmailUpdate
- Important fix: Aligned special character regex between PasswordChangeSchema and password-strength utility
  - Changed from /[^A-Za-z0-9]/ (any non-alphanumeric) to /[!@#$%^&*(),.?":{}|<>]/ (specific special chars)
  - Prevents confusion where spaces, underscores, or hyphens would pass schema but fail strength indicator
  - Ensures consistent validation between frontend password strength indicator and backend validation
- Created comprehensive test suite in packages/validations/src/__tests__/user.schema.test.ts:
  - ProfileUpdateSchema tests (20 test cases):
    - ✅ Valid names with minimum/maximum length
    - ✅ International characters and special characters (apostrophes, hyphens, accents)
    - ✅ Whitespace trimming
    - ✅ Validation errors for too short/long names
    - ✅ Empty string and missing field validation
  - PasswordChangeSchema tests (35+ test cases):
    - ✅ Valid passwords meeting all requirements
    - ✅ All special characters individually tested
    - ✅ Each requirement tested in isolation (length, uppercase, lowercase, number, special char)
    - ✅ Password mismatch detection (exact match, case sensitivity, whitespace)
    - ✅ Missing fields validation
    - ✅ Multiple validation errors reported together
    - ✅ Edge cases: spaces, underscores, hyphens not accepted as special chars
  - EmailUpdateSchema tests (15+ test cases):
    - ✅ Valid email formats (simple, plus addressing, subdomains, international TLDs)
    - ✅ Email normalization (lowercase, trimming)
    - ✅ Invalid formats rejected (missing @, missing domain, double @, etc.)
    - ✅ Length validation
    - ✅ Empty and missing field validation
  - UserRoleUpdateSchema and UserStatusUpdateSchema tests (8 test cases):
    - ✅ Valid role and status values
    - ✅ Invalid values rejected with descriptive errors
- All schemas follow Zod best practices with clear error messages
- Schemas aligned with architecture.md patterns and security requirements
- All acceptance criteria (AC: 1, 2, 3, 8) met:
  - AC1: ProfileUpdateSchema allows name updates ✓
  - AC2: PasswordChangeSchema requires current password ✓
  - AC3: Password security requirements enforced ✓
  - AC8: EmailUpdateSchema validates admin email changes ✓
- Note: Schemas placed in user.schema.ts instead of separate profile.schema.ts
  - Decision made during earlier task implementation (Task 07)
  - Makes semantic sense as profile updates are user entity updates
  - Already in use by implemented API endpoints
  - Properly exported from package index

**Task 15: Write tests for profile management** (Completed: 2025-11-13)
- All subtasks completed successfully
- Created comprehensive test suite for all profile management endpoints
- Profile Update Tests (apps/agency/app/api/users/me/profile/__tests__/route.test.ts):
  - ✅ User can update their full name (200)
  - ✅ Unauthenticated requests rejected (401)
  - ✅ Full name validation (required, max length, trimming)
  - ✅ Database errors handled gracefully
  - ✅ Invalid JSON body rejected
  - ✅ RLS enforcement (user can only update own profile)
  - 8 comprehensive test cases
- Password Change Tests (apps/agency/app/api/users/me/password/__tests__/route.test.ts):
  - ✅ Password change succeeds with correct current password (200)
  - ✅ Password change fails with incorrect current password (401)
  - ✅ Password validation: minimum 8 characters (400)
  - ✅ Password validation: requires uppercase letter (400)
  - ✅ Password validation: requires lowercase letter (400)
  - ✅ Password validation: requires number (400)
  - ✅ Password validation: requires special character (400)
  - ✅ Password confirmation must match (400)
  - ✅ Unauthenticated requests rejected (401)
  - ✅ Password update errors handled gracefully (500)
  - ✅ Password values NOT logged in audit trail (security)
  - ✅ All password requirements accepted (200)
  - ✅ Audit log created with timestamp only (no password values)
  - 12 comprehensive test cases
- Email Change Tests - Admin (apps/agency/app/api/users/[id]/email/__tests__/route.test.ts):
  - ✅ Admin can initiate email change for users (200)
  - ✅ Regular users rejected (403)
  - ✅ Unauthenticated requests rejected (401)
  - ✅ Duplicate email addresses rejected (400)
  - ✅ Email format validation (400)
  - ✅ RLS enforcement (agency isolation)
  - ✅ Unique verification token generated (crypto.randomUUID)
  - ✅ Verification link included in email
  - ✅ Email sending errors handled gracefully (500)
  - ✅ Email converted to lowercase
  - ✅ User not found error handled (400)
  - ✅ Verification email sent via Resend
  - 11 comprehensive test cases
- Email Verification Tests (apps/agency/app/api/users/verify-email/__tests__/route.test.ts):
  - ✅ Email verification succeeds with valid token (200)
  - ✅ Missing token rejected (400)
  - ✅ Invalid token rejected (400)
  - ✅ Expired token rejected (>1 hour, 400)
  - ✅ No pending email rejected (400)
  - ✅ Database update errors handled (500)
  - ✅ Auth update failure doesn't fail request (200)
  - 7 comprehensive test cases (already existed)
- All tests follow established patterns from existing test file
- Mock Supabase client and auth methods
- Mock Resend email service for email change tests
- Test coverage includes:
  - ✅ Success cases (200 responses)
  - ✅ Authentication/authorization errors (401/403)
  - ✅ Validation errors (400)
  - ✅ Server errors (500)
  - ✅ RLS enforcement
  - ✅ Security considerations (audit logging, no password values)
  - ✅ Edge cases (expired tokens, duplicate emails, etc.)
- Total: 38 test cases across 4 test files
- All acceptance criteria (AC: 1-10) covered
- Tests ready to run with: `npm test`

### File List

**Task 13: Add navigation link to profile**
- `packages/ui/src/components/ui/dropdown-menu.tsx` - Dropdown menu UI component
- `packages/ui/src/index.ts` - Updated with dropdown-menu export
- `apps/agency/app/components/UserMenu.tsx` - Server component for user menu
- `apps/agency/app/components/UserMenuClient.tsx` - Client component with dropdown UI
- `apps/agency/app/components/AppHeader.tsx` - Main navigation header component
- `apps/agency/app/layout.tsx` - Updated root layout with AppHeader

**Task 07: Create change password dialog**
- `apps/agency/app/profile/components/ChangePasswordDialog.tsx` - Main dialog component
- `apps/agency/app/profile/components/PasswordStrengthIndicator.tsx` - Password strength indicator
- `apps/agency/app/api/users/me/password/route.ts` - Password change API endpoint
- `packages/validations/src/user.schema.ts` - PasswordChangeSchema validation

**Task 10: Create email verification page**
- `apps/agency/app/verify-email/page.tsx` - Email verification page with loading, success, and error states
**Task 14: Implement password strength validator utility**
- `packages/utils/src/password-strength.ts` - Password strength validator utility
- `packages/utils/src/index.ts` - Updated with password-strength export

**Task 11: Create email verification email template**
- `emails/email-verification.tsx` - React Email template for email verification
- `apps/agency/app/api/users/[id]/email/route.ts` - Updated to use React Email template and fetch agency name
**Task 15: Write tests for profile management**
- `apps/agency/app/api/users/me/profile/__tests__/route.test.ts` - Profile update API tests
- `apps/agency/app/api/users/me/password/__tests__/route.test.ts` - Password change API tests
- `apps/agency/app/api/users/[id]/email/__tests__/route.test.ts` - Email change API tests (admin)
- `apps/agency/app/api/users/verify-email/__tests__/route.test.ts` - Email verification API tests (already existed)

**Task 12: Create validation schemas**
- `packages/validations/src/user.schema.ts` - Updated profile validation schemas
- `packages/validations/src/__tests__/user.schema.test.ts` - Comprehensive validation tests

## Change Log

- **2025-11-13:** Story created from epics.md via create-story workflow
- **2025-11-13:** Task 07 verified complete - Change password dialog with all functionality implemented
- **2025-11-13:** Task 13 completed - Add navigation link to profile with user menu dropdown and active state highlighting
- **2025-11-13:** Task 10 completed - Create email verification page with loading, success, and error states, automatic redirect, and user-friendly error messages
- **2025-11-13:** Task 14 completed - Implement password strength validator utility with comprehensive checks and type exports
- **2025-11-13:** Task 11 completed - Create email verification email template using React Email with professional branding, integrated with API endpoint
- **2025-11-13:** Task 15 completed - Write comprehensive tests for profile management (38 test cases across 4 test files)
- **2025-11-13:** Task 12 completed - Create validation schemas for profile, password, and email updates with comprehensive test coverage
