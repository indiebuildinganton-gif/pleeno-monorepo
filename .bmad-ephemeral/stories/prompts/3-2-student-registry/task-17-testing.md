# Task 17: Testing

## Context
Story 3.2: Student Registry - Comprehensive test coverage

## Acceptance Criteria Coverage
- AC All: Test coverage for all features

## Task Description
Write unit, integration, and E2E tests for student registry functionality.

## Subtasks
1. Write unit tests for commission calculator utilities
2. Write integration tests for student API endpoints
3. Write integration tests for notes API
4. Write integration tests for documents API
5. Write integration tests for activity feed
6. Write integration tests for CSV import
7. Write E2E test for student creation flow
8. Write E2E test for document upload
9. Test RLS policies for data isolation

## Technical Requirements
- Test framework: Vitest (unit/integration)
- Component testing: React Testing Library
- E2E testing: Playwright
- Use Supabase local instance for integration tests

## Test Locations
```
__tests__/
├── integration/
│   ├── students.test.ts
│   ├── notes.test.ts
│   ├── documents.test.ts
│   ├── activity.test.ts
│   └── csv-import.test.ts
├── e2e/
│   ├── student-creation.spec.ts
│   ├── document-upload.spec.ts
│   └── csv-import.spec.ts
└── unit/
    ├── date-helpers.test.ts
    ├── file-upload.test.ts
    └── student-schema.test.ts

apps/entities/app/students/components/
├── StudentTable.test.tsx
├── StudentForm.test.tsx
├── NotesSection.test.tsx
├── ActivityFeed.test.tsx
└── DocumentViewer.test.tsx
```

## Test Categories

### Unit Tests
- Date formatting utilities
- File upload validation
- Zod schema validation
- Badge color logic

### Integration Tests (API)
- GET /api/students (list, search, pagination)
- POST /api/students (create with validation)
- PATCH /api/students/[id] (update)
- DELETE /api/students/[id]
- Notes CRUD
- Documents upload/download
- Activity feed queries
- CSV import/export

### Component Tests
- StudentTable renders correctly
- Badge colors match visa status
- Form validation working
- Character counter functional
- Activity feed displays changes
- Document preview working

### E2E Tests
- Complete student creation flow
- Document upload and preview
- CSV import wizard
- Edit student and verify changes
- Delete student with confirmation

### Security Tests
- RLS prevents cross-agency access
- File upload validates types/sizes
- Unique passport constraint
- Authentication required

## Test Data
Create fixtures for:
- Sample students
- Sample colleges/branches
- Sample CSV files (valid/invalid)
- Sample documents (PDF/images)

## RLS Testing
```typescript
// Test data isolation
test('agency A cannot access agency B students', async () => {
  const agencyA = await createTestAgency('A');
  const agencyB = await createTestAgency('B');

  const studentB = await createStudent({ agency_id: agencyB.id });

  // Login as agency A user
  await loginAs(agencyA.user);

  // Should not find student B
  const result = await fetch(`/api/students/${studentB.id}`);
  expect(result.status).toBe(404);
});
```

## Constraints
- All tests must pass
- RLS testing critical
- Use test database/Supabase local
- Mock external services (AI extraction)
- No test data in production

## Reference Files
- Story file: `.bmad-ephemeral/stories/3-2-student-registry.md` (Task 17, lines 236-245)
- Story context: `.bmad-ephemeral/stories/3-2-student-registry.context.xml` (tests section)

## Definition of Done
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All E2E tests passing
- [ ] RLS tests passing
- [ ] Component tests passing
- [ ] Test coverage >80%
- [ ] All critical flows tested
- [ ] Security tests passing
