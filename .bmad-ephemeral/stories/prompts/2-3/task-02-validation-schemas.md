# Task 2: Create Validation Schemas

**Story:** 2.3 User Management Interface
**AC:** 2, 3

## Context

Before implementing the API routes, create Zod validation schemas for user role and status updates.

## Task

Create validation schemas in the shared validations package for role and status changes.

## Requirements

1. Create file: `packages/validations/src/user.schema.ts`
2. Define UserRoleUpdateSchema with role ENUM
3. Define UserStatusUpdateSchema with status ENUM
4. Validate role values ('agency_admin', 'agency_user')
5. Validate status values ('active', 'inactive')
6. Export TypeScript types

## Implementation

```typescript
// packages/validations/src/user.schema.ts
import { z } from 'zod'

/**
 * Schema for updating user role
 */
export const UserRoleUpdateSchema = z.object({
  role: z.enum(['agency_admin', 'agency_user'], {
    errorMap: () => ({ message: 'Role must be either agency_admin or agency_user' })
  })
})

export type UserRoleUpdate = z.infer<typeof UserRoleUpdateSchema>

/**
 * Schema for updating user status
 */
export const UserStatusUpdateSchema = z.object({
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Status must be either active or inactive' })
  })
})

export type UserStatusUpdate = z.infer<typeof UserStatusUpdateSchema>

/**
 * User response type (matches database schema)
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: z.enum(['agency_admin', 'agency_user']),
  status: z.enum(['active', 'inactive']),
  agency_id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
})

export type User = z.infer<typeof UserSchema>
```

## Architecture Alignment

- Location: `packages/validations/src/user.schema.ts`
- Follow pattern from existing schema files
- Export both schema and TypeScript type
- Use descriptive error messages
- Validate all required fields

## Exports

Update `packages/validations/src/index.ts` to export new schemas:

```typescript
export * from './user.schema'
```

## Acceptance Criteria

- [ ] File created at correct location
- [ ] UserRoleUpdateSchema validates role enum
- [ ] UserStatusUpdateSchema validates status enum
- [ ] TypeScript types exported
- [ ] Clear error messages for invalid values
- [ ] Schemas exported from package index

## Usage Example

```typescript
import { UserRoleUpdateSchema, UserStatusUpdateSchema } from '@pleeno/validations'

// In API route
const validatedData = UserRoleUpdateSchema.parse(body)
// Returns: { role: 'agency_admin' | 'agency_user' }
```

## Next Steps

After completing this task:
1. Verify schemas can be imported
2. Test validation with valid and invalid values
3. Proceed to Task 3: Implement User Role Change API
