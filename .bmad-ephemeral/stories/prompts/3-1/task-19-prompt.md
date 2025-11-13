# Story 3-1: College Registry - Task 19
## Create Validation Schemas

**Task 19 of 21**: Zod validation schemas for all forms

**Previous**: Task 18 (Notes section) - ✅ Completed

---

## Subtasks
- [ ] Create packages/validations/src/college.schema.ts
- [ ] Define CollegeSchema: name (required, min 2 chars), city, commission_rate (0-100), gst_status
- [ ] Define BranchSchema: name (required), city (required), commission_rate (0-100)
- [ ] Define ContactSchema: name (required), role_department, position_title, email (optional, valid format), phone (optional)
- [ ] Define NoteSchema: content (required, max 2000 chars)
- [ ] Export TypeScript types

### AC: 2, 5, 9

**Implementation**:
```typescript
// packages/validations/src/college.schema.ts
import { z } from 'zod'

export const CollegeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  city: z.string().optional(),
  commission_rate: z.number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate cannot exceed 100%'),
  gst_status: z.enum(['included', 'excluded']).default('included')
})

export const BranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  city: z.string().min(1, 'City is required'),
  commission_rate: z.number()
    .min(0, 'Commission rate must be at least 0%')
    .max(100, 'Commission rate cannot exceed 100%')
    .optional()
})

export const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role_department: z.string().optional(),
  position_title: z.string().optional(),
  email: z.string().email('Invalid email format').optional().or(z.literal('')),
  phone: z.string().optional()
})

export const NoteSchema = z.object({
  content: z.string()
    .min(1, 'Note cannot be empty')
    .max(2000, 'Note cannot exceed 2000 characters')
})

// Export types
export type College = z.infer<typeof CollegeSchema>
export type Branch = z.infer<typeof BranchSchema>
export type Contact = z.infer<typeof ContactSchema>
export type Note = z.infer<typeof NoteSchema>
```

**Usage**: Import schemas in API routes and forms for validation

---

## Success Criteria
- ✅ All schemas defined with proper validation
- ✅ TypeScript types exported
- ✅ Can be imported in API routes and forms
- ✅ Validation messages user-friendly

**Next**: Task 20 - Add admin permission checks
