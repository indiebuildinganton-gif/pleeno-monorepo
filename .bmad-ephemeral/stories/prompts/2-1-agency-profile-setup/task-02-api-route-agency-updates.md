# Story 2-1: Agency Profile Setup - Task 2

## Story Context

**As an** Agency Admin,
**I want** to configure my agency's profile with basic information,
**So that** my agency identity is established in the system and my team knows which agency they're working in.

---

## Task 2: Implement API Route for Agency Updates

### Previous Task Completed
✅ Task 1: Created Agency Validation Schema in `packages/validations/src/agency.schema.ts`

### Description
Create the backend API endpoint that allows agency admins to update their agency's profile information. This endpoint will use the validation schema from Task 1 and enforce role-based access control.

### Subtasks
- [ ] Create `apps/agency/app/api/agencies/[id]/route.ts`
- [ ] Implement PATCH handler for updating agency
- [ ] Validate request body with Zod schema (from Task 1)
- [ ] Check user role = 'agency_admin' before allowing updates
- [ ] Use Supabase RLS to enforce agency_id filtering
- [ ] Return updated agency data in standardized response format
- [ ] Add error handling with handleApiError()

### Acceptance Criteria
This task supports:
- **AC #1**: Agency Admin can edit agency information
- **AC #2**: Changes are saved to database with proper validation

### Key Constraints
- **Multi-tenant security**: All queries must respect agency_id isolation via Supabase RLS
- **Role-based access**: Only agency_admin role can edit agency settings
- **Error handling**: Use custom error classes (ValidationError, UnauthorizedError, ForbiddenError)
- **API responses**: Return standardized format { success: true/false, data/error }

### Interface to Implement

```typescript
// apps/agency/app/api/agencies/[id]/route.ts

// PATCH /api/agencies/[id]
// Request Body: { name, contact_email, contact_phone?, currency, timezone }
// Response: { success: true, data: Agency } | { success: false, error: { code, message, details } }
// Auth: Requires agency_admin role
```

### Dependencies
- AgencyUpdateSchema from `packages/validations/src/agency.schema.ts` (Task 1)
- Supabase client from `@supabase/supabase-js`
- Error handling utilities from `packages/utils/src/errors.ts`
- Auth utilities for role checking

### Reference Documents
- [Architecture Doc - API Patterns](docs/architecture.md#implementation-patterns)
- [Story 1.4 - Error Handling Infrastructure](.bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.md)

---

## 📋 Update Implementation Manifest

**Before starting development**, update the manifest:

1. Read `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
2. Update Task 1: Set status to "Completed" with today's date
3. Update Task 2: Set status to "In Progress" with today's date
4. Add notes about what was completed in Task 1

---

## Implementation Instructions

1. **Update manifest** as described above
2. **Create** `apps/agency/app/api/agencies/[id]/route.ts`
3. **Implement PATCH handler**:
   - Parse and validate request body using AgencyUpdateSchema
   - Get authenticated user and verify agency_admin role
   - Update agency in Supabase (RLS handles filtering)
   - Return standardized response
4. **Add error handling** for validation, auth, and database errors
5. **Test** the endpoint with valid/invalid data

### Expected File Structure
```
apps/agency/app/api/agencies/[id]/
└── route.ts              # New file
```

### Implementation Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { AgencyUpdateSchema } from '@pleeno/validations'
import { handleApiError, ForbiddenError, ValidationError } from '@pleeno/utils/errors'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Parse and validate request body
    const body = await request.json()
    const validatedData = AgencyUpdateSchema.parse(body)

    // 2. Get authenticated user and check role
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) throw new UnauthorizedError()

    // 3. Get user's role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) throw new UnauthorizedError()
    if (userData.role !== 'agency_admin') throw new ForbiddenError('Admin access required')

    // 4. Verify user is updating their own agency
    if (userData.agency_id !== params.id) throw new ForbiddenError('Cannot update other agencies')

    // 5. Update agency (RLS enforces agency_id filtering)
    const { data: agency, error: updateError } = await supabase
      .from('agencies')
      .update(validatedData)
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) throw updateError

    // 6. Return success response
    return NextResponse.json({
      success: true,
      data: agency
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

---

## After Completion

1. ✅ Update manifest.md: Mark Task 2 completed
2. 🔄 Move to: `task-03-agency-settings-page.md`

---

## Testing Checklist

Before marking complete:
- [ ] API route file created at correct path
- [ ] PATCH handler implemented
- [ ] Request body validation works
- [ ] Role checking prevents non-admins
- [ ] Agency ID isolation enforced
- [ ] Returns standardized response format
- [ ] Error handling covers all cases
- [ ] Manifest updated with Task 2 progress
