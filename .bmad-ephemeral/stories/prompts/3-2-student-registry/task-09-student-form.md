# Task 9: Student Form Component

## Context
Story 3.2: Student Registry - Create/edit form for student data

## Acceptance Criteria Coverage
- AC 2: Student Form (Create/Edit)

## Task Description
Create student form with validation, file upload, and college/branch selection.

## Subtasks
1. Create /entities/students/new page with form
2. Create /entities/students/[id]/edit page with form
3. Implement React Hook Form with Zod validation
4. Add fields: full_name (required), passport_number (required)
5. Add optional fields: email, phone, date_of_birth, nationality
6. Add visa status dropdown with four options
7. Add college and branch selection dropdowns
8. Implement file upload for documents
9. Show validation errors
10. Handle unique constraint violation (duplicate passport)

## Technical Requirements
- Location: `apps/entities/app/students/`
- Files to create:
  - `new/page.tsx`
  - `[id]/edit/page.tsx`
  - `components/StudentForm.tsx` (Client Component)
- Create `packages/validations/src/student.schema.ts`
- Use React Hook Form + Zod
- Use Shadcn Form, Input, Select components

## Form Fields
Required:
- full_name (text)
- passport_number (text, unique per agency)

Optional:
- email (email)
- phone (text)
- date_of_birth (date)
- nationality (text)
- visa_status (select: in_process, approved, denied, expired)
- college_id (select)
- branch_id (select)

## Validation Schema
```typescript
const studentSchema = z.object({
  full_name: z.string().min(1, "Full name is required"),
  passport_number: z.string().min(1, "Passport number is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  date_of_birth: z.date().optional(),
  nationality: z.string().optional(),
  visa_status: z.enum(["in_process", "approved", "denied", "expired"]).optional(),
  college_id: z.string().uuid().optional(),
  branch_id: z.string().uuid().optional(),
});
```

## Constraints
- Required: full_name, passport_number
- Optional: all other fields
- Handle duplicate passport error
- File upload for documents
- College/branch dropdown population

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (AC 2, lines 22-29)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`

## Definition of Done
- [ ] Create form working
- [ ] Edit form working
- [ ] Validation functional
- [ ] Required fields enforced
- [ ] Optional fields allowed empty
- [ ] Duplicate passport error handled
- [ ] File upload working
- [ ] Dropdowns populated
- [ ] Form submission successful
