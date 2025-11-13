# Story 2-4: User Profile Management
## Task 3: Implement password change API endpoint

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

**Previous Tasks:** Task 1 (Database) ✅, Task 2 (Profile API) ✅

---

## Task Details

### Task Description
Implement the API endpoint that allows users to change their password with current password verification and security requirements enforcement.

### Subtasks Checklist
- [ ] Create `apps/agency/app/api/users/me/password/route.ts`
- [ ] Implement PATCH `/api/users/me/password` endpoint
- [ ] Request body: `{ current_password: string, new_password: string }`
- [ ] Validate current password via Supabase Auth
- [ ] Validate new password: min 8 chars, uppercase, lowercase, number, special char
- [ ] Update password via Supabase Auth `updateUser()`
- [ ] Log password change in audit trail (without password values)
- [ ] Return success response
- [ ] Handle incorrect current password error (401)

### Relevant Acceptance Criteria
- **AC1:** User can update their name and password from profile settings
- **AC2:** Password changes require current password confirmation
- **AC3:** Password must meet security requirements (min 8 chars, mix of types)
- **AC4:** User receives confirmation when profile is updated
- **AC10:** Email changes are logged in audit trail (applies to password changes too)

---

## Context

### Key Constraints
- **Authentication & Authorization:** Password changes via supabase.auth.updateUser(); verify current password before allowing password change
- **API Route Patterns:** Server-side validation using Zod schemas; consistent error handling with handleApiError()
- **Database Patterns:** Audit logs are immutable (insert-only); log action without sensitive data (no password values)

### API Endpoint Interface
```typescript
// PATCH /api/users/me/password
// Request: { current_password: string, new_password: string, confirm_password: string }
// Response: { success: true, data: { message: string } }
// Auth: Required - any authenticated user
```

### Architecture Reference Code Pattern
From [docs/architecture.md](docs/architecture.md) - Password Change Pattern:
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

---

## 📋 MANIFEST UPDATE

Before starting implementation:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 2:** Status → "Completed", add Completed date
3. **Update Task 3:** Status → "In Progress", add Started date
4. **Add notes:** Document any observations from Task 2

---

## Implementation Steps

1. **Create the API route file** at `apps/agency/app/api/users/me/password/route.ts`
2. **Import dependencies:** Next.js types, Supabase client, error handling, validation schema
3. **Implement PATCH handler:**
   - Authenticate user
   - Validate request body with PasswordChangeSchema
   - Verify current password via signInWithPassword
   - Update password via auth.updateUser()
   - Log password change in audit_log (no password values)
   - Return success message
4. **Add comprehensive error handling:**
   - Unauthenticated (401)
   - Incorrect current password (401)
   - Password validation errors (400)
   - Generic errors (500)
5. **Test the endpoint:**
   - Test successful password change
   - Test with incorrect current password
   - Test with weak new password
   - Verify audit log entry created

### Security Considerations
- **Never log password values** (current or new) in audit trail
- **Verify current password** before allowing change (prevent unauthorized changes)
- **Enforce password strength** via validation schema
- **Use Supabase Auth** for password hashing (bcrypt)

### Verification
- Change password successfully
- Try logging in with new password
- Verify old password no longer works
- Check audit_log table for 'password_changed' entry
- Verify entry contains NO password values

---

## Dependencies

**Required packages:**
- `@pleeno/database` - createServerClient()
- `@pleeno/utils` - handleApiError(), UnauthorizedError, ValidationError
- `@pleeno/validations` - PasswordChangeSchema (Task 12, may need early implementation)

**Database:**
- `audit_log` table must exist (from previous stories or Task 1)

---

## Next Steps

After completing Task 3:
1. **Update the manifest:** Mark Task 3 as "Completed" with today's date
2. **Add implementation notes:** Document any security considerations
3. **Move to Task 4:** Open `04-implement-admin-email-change-api-route.md`

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
- Architecture: [docs/architecture.md](docs/architecture.md) - Security Architecture
- PRD: [docs/PRD.md](docs/PRD.md) - FR-1.4: User Profile Management
