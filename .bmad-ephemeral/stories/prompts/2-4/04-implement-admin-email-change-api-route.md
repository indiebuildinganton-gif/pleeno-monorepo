# Story 2-4: User Profile Management
## Task 4: Implement admin email change API endpoint

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

**Previous Tasks:** Tasks 1-3 completed ✅

---

## Task Details

### Task Description
Implement the API endpoint that allows agency admins to initiate email changes for users, which triggers a verification email workflow.

### Subtasks Checklist
- [ ] Create `apps/agency/app/api/users/[id]/email/route.ts`
- [ ] Implement PATCH `/api/users/{id}/email` endpoint (admin only)
- [ ] Request body: `{ email: string }`
- [ ] Validate requester is `agency_admin`
- [ ] Validate new email is not already in use
- [ ] Generate email verification token (UUID)
- [ ] Store `pending_email` and `email_verification_token`
- [ ] Send verification email via Resend
- [ ] Return success response: "Verification email sent"
- [ ] Log email change request in audit trail

### Relevant Acceptance Criteria
- **AC7:** Only Agency Admins can update user emails
- **AC8:** Admin can update their own email address
- **AC9:** Email changes require administrator verification via email link
- **AC10:** Email changes are logged in audit trail

---

## Context

### Key Constraints
- **Multi-Tenant Security:** Admin-only operations require role validation; RLS enforces agency isolation
- **Authentication & Authorization:** Email verification tokens expire after 1 hour; tokens are single-use
- **API Route Patterns:** Server-side validation using Zod schemas; consistent error handling with handleApiError()
- **Database Patterns:** Update both users table and auth.users for email changes (consistency)

### API Endpoint Interface
```typescript
// PATCH /api/users/{id}/email
// Request: { email: string }
// Response: { success: true, data: { message: "Verification email sent" } }
// Auth: Required - agency_admin only
```

### Architecture Reference Code Pattern
From [docs/architecture.md](docs/architecture.md) - Admin Email Change Pattern:
```typescript
// apps/agency/app/api/users/[id]/email/route.ts
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

---

## 📋 MANIFEST UPDATE

Before starting implementation:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 3:** Status → "Completed", add Completed date
3. **Update Task 4:** Status → "In Progress", add Started date

---

## Implementation Steps

1. **Create dynamic route file** at `apps/agency/app/api/users/[id]/email/route.ts`
2. **Import dependencies:**
   - Next.js types and utilities
   - Supabase client
   - Error handling utilities
   - Resend email client
   - Email template (Task 11, may need stub)
3. **Implement PATCH handler:**
   - Authenticate user
   - Verify user is agency_admin
   - Validate request body (EmailUpdateSchema)
   - Check email not already in use
   - Generate verification token (crypto.randomUUID())
   - Update pending_email and token in database
   - Send verification email via Resend
   - Return success message
4. **Add comprehensive error handling:**
   - Not authenticated (401)
   - Not admin (403)
   - Email already exists (400)
   - User not found or not in agency (404)
5. **Test the endpoint:**
   - Test as admin (should succeed)
   - Test as regular user (should return 403)
   - Test with duplicate email (should return 400)
   - Verify email sent successfully

### Email Configuration
- **Resend API Key:** Set `RESEND_API_KEY` in environment
- **App URL:** Set `NEXT_PUBLIC_APP_URL` for verification link
- **From Address:** Configure `noreply@pleeno.com` in Resend

### Security Considerations
- **Admin-only access:** Verify role before allowing operation
- **Agency isolation:** Use RLS and explicit agency_id check
- **Email uniqueness:** Prevent duplicate emails across system
- **Token security:** Use crypto.randomUUID() for unpredictable tokens
- **Audit logging:** Database trigger handles automatic logging (from Task 1)

### Verification
- Send email change request as admin
- Check database for pending_email and token
- Verify verification email received
- Check audit_log for 'email_change_requested' entry

---

## Dependencies

**Required packages:**
- `@pleeno/database` - createServerClient()
- `@pleeno/utils` - error handling utilities
- `@pleeno/validations` - EmailUpdateSchema (Task 12)
- `resend` - Email sending service
- Email template (Task 11, can stub for now)

**Environment Variables:**
- `RESEND_API_KEY` - Resend API key
- `NEXT_PUBLIC_APP_URL` - App URL for verification links

---

## Next Steps

After completing Task 4:
1. **Update the manifest:** Mark Task 4 as "Completed"
2. **Add notes:** Document email configuration
3. **Move to Task 5:** Open `05-implement-email-verification-confirmation-endpoint.md`

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
- Architecture: [docs/architecture.md](docs/architecture.md) - Email verification pattern
