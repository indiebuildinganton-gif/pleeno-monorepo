# Student Registry Test Suite

Comprehensive test coverage for the Student Registry feature (Epic 3, Story 3.2).

## Test Structure

### Test Fixtures (`__tests__/fixtures/students.ts`)
- Test agencies (Agency A, Agency B)
- Test users (admin and regular users)
- Test colleges and branches
- Test students with various visa statuses
- Test notes and documents
- Sample CSV data (valid, invalid, duplicates)
- Sample file buffers for document upload tests

### Unit Tests (`__tests__/unit/`)

#### `student-schema.test.ts`
Tests Zod schema validation for student and note operations:
- **StudentCreateSchema**: Full name, passport, email, phone, visa status, DOB, nationality validation
- **StudentUpdateSchema**: Partial update validation
- **NoteCreateSchema**: Content validation (max 2000 chars)
- **NoteUpdateSchema**: Update validation
- **VisaStatusEnum**: Status enumeration validation
- **Coverage**: 50+ test cases for all validation rules

### Integration Tests (`__tests__/integration/`)

#### `students.test.ts`
Tests for student CRUD API endpoints:
- **GET /api/students**: Pagination, search, filtering, RLS enforcement
- **POST /api/students**: Creation, validation, duplicate detection
- **GET /api/students/[id]**: Single student retrieval
- **PATCH /api/students/[id]**: Updates, partial updates
- **DELETE /api/students/[id]**: Deletion, RLS enforcement
- **Coverage**: 30+ test cases

#### `notes.test.ts`
Tests for student notes API:
- **GET /api/students/[id]/notes**: Listing with user attribution
- **POST /api/students/[id]/notes**: Creation with character limit validation
- **PATCH /api/students/[id]/notes/[note_id]**: Updates
- **DELETE /api/students/[id]/notes/[note_id]**: Deletion
- **Coverage**: 25+ test cases

#### `documents.test.ts`
Tests for document upload/management:
- **GET /api/students/[id]/documents**: Document listing
- **POST /api/students/[id]/documents**: Upload with file type/size validation
- **DELETE /api/students/[id]/documents/[doc_id]**: Deletion with storage cleanup
- **Coverage**: 20+ test cases including file validation

#### `activity.test.ts`
Tests for activity feed API:
- **GET /api/students/[id]/activity**: Activity log retrieval
- User attribution
- Metadata inclusion
- Action types (created, updated, note_added, document_uploaded)
- **Coverage**: 10+ test cases

#### `csv-import.test.ts`
Tests for CSV import functionality:
- **POST /api/students/import**: Bulk import
- CSV validation (headers, data format)
- Error handling for invalid rows
- Duplicate detection
- File size limits
- **Coverage**: 15+ test cases

#### `rls-policies.test.ts`
Tests for Row-Level Security (RLS) data isolation:
- Agency A cannot access Agency B data
- Cross-agency access prevention
- Authentication requirements
- Agency-scoped queries
- **Coverage**: 15+ test cases ensuring complete data isolation

### Component Tests (`apps/entities/app/students/components/__tests__/`)

#### `StudentTable.test.tsx`
Tests for StudentTable component:
- Rendering with data
- Visa status badges with correct colors
- College/branch information display
- Sorting functionality
- Pagination controls
- Row click navigation
- Empty state
- Loading state
- **Coverage**: 15+ test cases

#### `NotesSection.test.tsx`
Tests for NotesSection component:
- Character counter (0/2000)
- Warning at 1800+ characters
- Note creation
- Edit modal
- Delete confirmation
- User attribution display
- Relative timestamps
- Loading and error states
- **Coverage**: 20+ test cases

### E2E Tests (`__tests__/e2e/`)

#### `student-creation.spec.ts`
End-to-end tests for student creation flow:
- Form submission with all fields
- Form submission with only required fields
- Required field validation
- Email format validation
- Date format validation
- Duplicate passport detection
- Visa status badge colors
- Navigation to detail page
- Activity log entry creation
- Cancel functionality
- **Coverage**: 12+ test scenarios

#### `student-document-upload.spec.ts`
End-to-end tests for document upload:
- PDF document upload
- Image document upload
- File size validation (>10MB rejection)
- Invalid file type rejection
- Document metadata display
- PDF preview
- Image preview
- Document download
- Document deletion with confirmation
- Multiple document uploads
- Drag and drop support
- **Coverage**: 15+ test scenarios

## Running Tests

### Unit and Integration Tests
```bash
# Run all tests
npm test

# Run unit tests only
npm test __tests__/unit

# Run integration tests only
npm test __tests__/integration

# Run with coverage
npm test -- --coverage
```

### Component Tests
```bash
# Run component tests
npm test apps/entities/app/students/components
```

### E2E Tests
```bash
# Run E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test __tests__/e2e/student-creation.spec.ts
```

## Test Coverage Goals

- **Unit Tests**: 100% coverage for schemas and utilities
- **Integration Tests**: 90%+ coverage for API routes
- **Component Tests**: 80%+ coverage for React components
- **E2E Tests**: All critical user flows covered
- **RLS Tests**: 100% coverage for security policies

## Key Testing Patterns

### Mocking Strategy
- **Supabase Client**: Mocked for unit/integration tests
- **Next.js Navigation**: Mocked for component tests
- **File Operations**: Mocked for document upload tests
- **Auth**: Mocked to simulate different users/agencies

### Test Data
- Consistent fixtures across all test types
- Separate agency data to test RLS
- Realistic test data (valid emails, phone numbers, dates)
- Edge cases (max length strings, boundary values)

### Security Testing
- RLS policy enforcement at database level
- Cross-agency data access prevention
- Authentication and authorization checks
- Input validation and sanitization

## Test Maintenance

### Adding New Tests
1. Add test data to `__tests__/fixtures/students.ts` if needed
2. Follow existing test file structure and naming conventions
3. Include both positive and negative test cases
4. Test edge cases and error conditions
5. Ensure RLS tests cover new endpoints

### Updating Tests
- Update fixtures when schema changes
- Update mocks when API contracts change
- Keep E2E tests in sync with UI changes
- Maintain test coverage above thresholds

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Pre-deployment checks

All tests must pass before merging to main.
