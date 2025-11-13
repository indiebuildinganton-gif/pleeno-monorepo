# Story 2-4: User Profile Management
## Task 2: Implement profile update API endpoint

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

**Previous Task:** Task 1 (Database schema) completed ✅

---

## Task Details

### Task Description
Implement the API endpoint that allows users to update their own profile information (specifically full_name).

### Subtasks Checklist
- [ ] Create `apps/agency/app/api/users/me/profile/route.ts`
- [ ] Implement PATCH `/api/users/me/profile` endpoint
- [ ] Request body: `{ full_name?: string }`
- [ ] Validate user is authenticated
- [ ] Update `user.full_name` with audit logging
- [ ] Return updated user profile
- [ ] Add error handling with `handleApiError()`

### Relevant Acceptance Criteria
- **AC1:** User can update their name and password from profile settings
- **AC3:** Password must meet security requirements (focus on name update here)
- **AC4:** User receives confirmation when profile is updated

---

## Context

### Key Constraints
- **Multi-Tenant Security:** User can only modify their own profile (enforced by RLS and API checks)
- **API Route Patterns:** Server-side validation using Zod schemas; consistent error handling with handleApiError(); return ApiResponse<T> format
- **Authentication:** Use Supabase Auth for authentication verification

### API Endpoint Interface
```typescript
// PATCH /api/users/me/profile
// Request: { full_name: string }
// Response: { success: true, data: User }
// Auth: Required - any authenticated user
```

### Architecture Reference Code Pattern
From [docs/architecture.md](docs/architecture.md) - Implementation Patterns - Authentication Pattern:
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

---

## 📋 MANIFEST UPDATE

Before starting implementation:
1. **Open:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`
2. **Update Task 1:** Status → "Completed", add Completed date
3. **Update Task 2:** Status → "In Progress", add Started date
4. **Add notes:** Document any observations from Task 1

---

## Implementation Steps

1. **Create the API route file** at `apps/agency/app/api/users/me/profile/route.ts`
2. **Import dependencies:** Next.js types, Supabase client, error handling utilities, validation schema
3. **Implement PATCH handler:**
   - Get authenticated user from Supabase
   - Validate request body with ProfileUpdateSchema
   - Update users table with new full_name
   - Return updated user data
4. **Add error handling** using handleApiError() utility
5. **Test the endpoint:**
   - Test with authenticated user (should succeed)
   - Test with unauthenticated request (should return 401)
   - Test with invalid data (should return validation error)

### Verification
- Call endpoint with curl or REST client
- Verify full_name updates in database
- Verify RLS prevents updating other users
- Check error responses are properly formatted

---

## Dependencies

**Required packages:**
- `@pleeno/database` - createServerClient()
- `@pleeno/utils` - handleApiError(), UnauthorizedError
- `@pleeno/validations` - ProfileUpdateSchema (created in Task 12, may need to implement early)

**Note:** If ProfileUpdateSchema doesn't exist yet, create a simple inline validation or implement Task 12 first.

---

## Next Steps

After completing Task 2:
1. **Update the manifest:** Mark Task 2 as "Completed" with today's date
2. **Add implementation notes:** Document any challenges or decisions
3. **Move to Task 3:** Open `03-implement-password-change-api-route.md`

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
- Architecture patterns: [docs/architecture.md](docs/architecture.md)
- API specifications: See story Dev Notes section
