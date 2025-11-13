# Story 1.4: Error Handling & Logging Infrastructure - Task Manifest

**Story ID**: 1-4-error-handling-logging-infrastructure
**Story Title**: Error Handling & Logging Infrastructure
**Generated**: 2025-11-13

## Overview
This manifest tracks the execution of Story 1.4 tasks in Claude Code Web. Each task has been broken down into a separate prompt file for sequential execution.

## Task Execution Order

Execute tasks in this exact order. Mark each task as completed after finishing.

### Task 1: Create Custom Error Classes and Error Utilities
- **Status**: ⏳ Pending
- **Prompt File**: [task-1-custom-error-classes.md](task-1-custom-error-classes.md)
- **Estimated Time**: 30-45 minutes
- **Key Deliverables**:
  - Custom error classes (AppError, ValidationError, NotFoundError, UnauthorizedError, ForbiddenError)
  - API response type definitions
  - Error sanitization function
  - Safe error message creator
- **Completion Date**: _____

---

### Task 2: Implement API Route Error Handler Middleware
- **Status**: ⏳ Pending
- **Prompt File**: [task-2-api-error-handler-middleware.md](task-2-api-error-handler-middleware.md)
- **Estimated Time**: 45-60 minutes
- **Prerequisites**: Task 1 completed
- **Key Deliverables**:
  - handleApiError() function with status code mapping
  - Error logging with context
  - Error response formatter
  - createSuccessResponse() helper
  - withErrorHandling() wrapper
- **Completion Date**: _____

---

### Task 3: Create Server-Side Logging Utility
- **Status**: ⏳ Pending
- **Prompt File**: [task-3-server-side-logging-utility.md](task-3-server-side-logging-utility.md)
- **Estimated Time**: 45-60 minutes
- **Prerequisites**: Task 1 completed
- **Key Deliverables**:
  - Structured logging utility
  - Log levels (info, warn, error, debug)
  - Context enrichment mechanism
  - Environment-aware formatting
  - Helper functions (logInfo, logWarn, logError, logDebug)
  - createLogger() with base context
- **Completion Date**: _____

---

### Task 4: Implement React Error Boundaries
- **Status**: ⏳ Pending
- **Prompt File**: [task-4-react-error-boundaries.md](task-4-react-error-boundaries.md)
- **Estimated Time**: 1-1.5 hours
- **Prerequisites**: Task 3 completed
- **Key Deliverables**:
  - ErrorBoundary component
  - PageErrorBoundary wrapper
  - ComponentErrorBoundary for smaller components
  - Fallback UI with retry/report buttons
  - Zone layouts wrapped with error boundaries
- **Completion Date**: _____

---

### Task 5: Integrate Error Monitoring Service
- **Status**: ⏳ Pending
- **Prompt File**: [task-5-error-monitoring-service.md](task-5-error-monitoring-service.md)
- **Estimated Time**: 1-1.5 hours
- **Prerequisites**: Tasks 1-4 completed, Sentry account created
- **Key Deliverables**:
  - Sentry SDK installed and configured
  - Client, server, and edge runtime setup
  - User context attachment
  - Source maps configuration
  - Sentry utility functions
  - Test error reporting page
- **Completion Date**: _____

---

### Task 6: Apply Error Handling to Existing API Routes
- **Status**: ⏳ Pending
- **Prompt File**: [task-6-apply-to-existing-routes.md](task-6-apply-to-existing-routes.md)
- **Estimated Time**: 1-2 hours
- **Prerequisites**: Tasks 1-5 completed
- **Key Deliverables**:
  - API route template with error handling
  - Authentication helper functions
  - Health check route
  - Protected route examples
  - Admin route example
  - Validation examples with Zod
- **Completion Date**: _____

---

### Task 7: Write Error Handling Test Suite
- **Status**: ⏳ Pending
- **Prompt File**: [task-7-test-suite.md](task-7-test-suite.md)
- **Estimated Time**: 2-3 hours
- **Prerequisites**: All previous tasks completed
- **Key Deliverables**:
  - Error class unit tests
  - API error handler tests
  - Logger utility tests
  - Error Boundary component tests
  - Integration tests for API routes
  - Vitest configuration
- **Completion Date**: _____

---

## Progress Tracking

- **Total Tasks**: 7
- **Completed**: 0
- **In Progress**: 0
- **Pending**: 7
- **Overall Progress**: 0%

## Acceptance Criteria Checklist

Track completion of story acceptance criteria:

- [ ] **AC 1**: All API errors return consistent JSON structure with appropriate HTTP status codes
  - Related Tasks: 1, 2, 6, 7

- [ ] **AC 2**: Errors are logged with sufficient context (user_id, agency_id, timestamp, stack trace)
  - Related Tasks: 2, 3, 7

- [ ] **AC 3**: Sensitive data is never exposed in error messages
  - Related Tasks: 1, 2, 7

- [ ] **AC 4**: Client-side error boundaries catch React errors gracefully
  - Related Tasks: 4, 7

- [ ] **AC 5**: Logging integrates with monitoring service (e.g., Sentry, LogRocket)
  - Related Tasks: 5, 7

## How to Use This Manifest

### For Sequential Execution in Claude Code Web:

1. **Open Claude Code Web** in your browser
2. **Copy the content** of task-1-custom-error-classes.md
3. **Paste into Claude Code Web** and let it execute
4. **Verify the task** is complete (run tests, check files)
5. **Mark Task 1 as completed** in this manifest (change ⏳ to ✅)
6. **Move to Task 2** and repeat

### Status Indicators:
- ⏳ **Pending**: Not started
- 🔄 **In Progress**: Currently working on
- ✅ **Completed**: Task finished and verified
- ⚠️ **Blocked**: Cannot proceed (list reason)
- ❌ **Failed**: Task failed (needs retry)

### Tips:
- Don't skip tasks - they build on each other
- Test each task before moving to the next
- Update completion dates for tracking
- If a task fails, document the issue and retry
- Reference the context XML for additional details

## Story Context Reference

- **Context XML**: [1-4-error-handling-logging-infrastructure.context.xml](../../1-4-error-handling-logging-infrastructure.context.xml)
- **Story File**: [1-4-error-handling-logging-infrastructure.md](../../1-4-error-handling-logging-infrastructure.md)
- **Epic Reference**: [docs/epics.md](../../../../docs/epics.md)
- **Architecture Reference**: [docs/architecture.md](../../../../docs/architecture.md)

## Dependencies

### External Dependencies:
- Story 1.3 completed (Authentication & Authorization Framework) - for auth integration points
- Turborepo project structure initialized
- Next.js 14+ with App Router
- Supabase client configured

### NPM Packages Required:
- @sentry/nextjs (for error monitoring)
- zod (for validation)
- vitest (for testing)
- @testing-library/react (for component tests)
- @testing-library/jest-dom (for test matchers)
- @playwright/test (for E2E tests)

## Notes

### Important Considerations:
- Error handling must integrate with auth middleware from Story 1.3
- Sensitive data filtering is security-critical
- Stack traces must never be exposed to clients in production
- All API routes should follow the error handling pattern
- Error boundaries should be tested thoroughly
- Sentry configuration requires environment variables

### Common Issues:
- **Missing error context**: Ensure user_id and agency_id extracted from JWT
- **Sensitive data leaks**: Review sanitization function carefully
- **Stack trace exposure**: Verify production environment check
- **Error boundary not catching**: Ensure 'use client' directive present
- **Sentry not capturing**: Check DSN and enabled flag

## Completion Checklist

When all tasks are done:
- [ ] All 7 tasks marked as completed
- [ ] All acceptance criteria checked
- [ ] All tests passing (>80% coverage)
- [ ] Error handling applied to all API routes
- [ ] Error boundaries wrapped around all zone layouts
- [ ] Sentry integration tested and working
- [ ] Code reviewed
- [ ] Story marked as "done" in sprint status
- [ ] Documentation updated
- [ ] Ready for integration with other stories

---

**Last Updated**: 2025-11-13
**Next Review**: After Task 3 completion
