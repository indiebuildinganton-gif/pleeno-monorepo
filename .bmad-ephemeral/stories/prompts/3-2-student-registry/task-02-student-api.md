# Task 2: Student API Routes

## Context
Story 3.2: Student Registry - Core CRUD endpoints for student management

## Acceptance Criteria Coverage
- AC 1, 2, 3: Student list, create/edit forms, detail page

## Task Description
Implement REST API endpoints for student CRUD operations with search functionality.

## Subtasks
1. Implement GET /api/students (list with search)
2. Implement POST /api/students (create)
3. Implement GET /api/students/[id] (detail with joins)
4. Implement PATCH /api/students/[id] (update)
5. Implement DELETE /api/students/[id]
6. Implement GET /api/students?search=query (search functionality)
7. Validate required fields: full_name, passport_number
8. Make email and phone optional

## Technical Requirements
- Location: `apps/entities/app/api/students/`
- Files to create:
  - `route.ts` (GET, POST)
  - `[id]/route.ts` (GET, PATCH, DELETE)
- Use Supabase client from `packages/database`
- Validation using Zod schema from `packages/validations/src/student.schema.ts`
- Return paginated results for list endpoint
- Include enrollment/college/branch joins in detail endpoint

## API Signatures
```typescript
GET /api/students?search=query&page=number&per_page=number
POST /api/students {full_name, passport_number, email?, phone?, visa_status?, date_of_birth?, nationality?}
GET /api/students/[id]
PATCH /api/students/[id] {partial student fields}
DELETE /api/students/[id]
```

## Constraints
- RLS automatically filters by agency_id
- Handle unique constraint violation (duplicate passport)
- Require authentication
- Log all operations to audit_logs

## Reference Files
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml` (interfaces section)
- Architecture: `docs/architecture.md` (Project Structure - Entities Zone)

## Definition of Done
- [ ] All endpoints implemented and tested
- [ ] Validation working correctly
- [ ] Search functionality works
- [ ] Pagination implemented
- [ ] Error handling for duplicate passport
- [ ] RLS enforced
- [ ] Audit logging active
