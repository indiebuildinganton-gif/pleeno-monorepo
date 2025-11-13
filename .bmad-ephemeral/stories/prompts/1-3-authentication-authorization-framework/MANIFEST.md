# Story 1.3: Authentication & Authorization Framework - Task Manifest

**Story ID**: 1-3-authentication-authorization-framework
**Story Title**: Authentication & Authorization Framework
**Generated**: 2025-11-13

## Overview
This manifest tracks the execution of Story 1.3 tasks in Claude Code Web. Each task has been broken down into a separate prompt file for sequential execution.

## Task Execution Order

Execute tasks in this exact order. Mark each task as completed after finishing.

### Task 1: Set up Supabase Auth Integration
- **Status**: ⏳ Pending
- **Prompt File**: [task-1-supabase-auth-integration.md](task-1-supabase-auth-integration.md)
- **Estimated Time**: 30-45 minutes
- **Key Deliverables**:
  - Environment variables configured
  - Supabase client libraries installed
  - Auth package created
  - createServerClient() implemented
  - createClient() implemented
- **Completion Date**: _____

---

### Task 2: Implement User Registration Flow
- **Status**: ⏳ Pending
- **Prompt File**: [task-2-user-registration-flow.md](task-2-user-registration-flow.md)
- **Estimated Time**: 1-1.5 hours
- **Prerequisites**: Task 1 completed
- **Key Deliverables**:
  - Signup API route (/api/auth/signup)
  - Signup page (/signup)
  - Email and password validation
  - User record creation in database
  - Role assignment logic
- **Completion Date**: _____

---

### Task 3: Implement Login/Logout Flows
- **Status**: ⏳ Pending
- **Prompt File**: [task-3-login-logout-flows.md](task-3-login-logout-flows.md)
- **Estimated Time**: 1-1.5 hours
- **Prerequisites**: Tasks 1, 2 completed
- **Key Deliverables**:
  - Login API route (/api/auth/login)
  - Login page (/login)
  - Logout API route (/api/auth/logout)
  - Password reset page (/reset-password)
  - useAuth hook
- **Completion Date**: _____

---

### Task 4: Implement Role-Based Access Control
- **Status**: ⏳ Pending
- **Prompt File**: [task-4-role-based-access-control.md](task-4-role-based-access-control.md)
- **Estimated Time**: 45-60 minutes
- **Prerequisites**: Tasks 1, 2, 3 completed
- **Key Deliverables**:
  - requireRole() middleware helper
  - hasRole() client-side utility
  - isAgencyAdmin() utility
  - Permission utilities package
  - Example protected route
- **Completion Date**: _____

---

### Task 5: Implement Authentication Middleware
- **Status**: ⏳ Pending
- **Prompt File**: [task-5-authentication-middleware.md](task-5-authentication-middleware.md)
- **Estimated Time**: 45-60 minutes
- **Prerequisites**: Tasks 1, 3 completed
- **Key Deliverables**:
  - middleware.ts in apps/shell/
  - Protected route configuration
  - Redirect logic for unauthenticated users
  - Token refresh handling
  - Root page redirect
- **Completion Date**: _____

---

### Task 6: Implement Agency Context Setting
- **Status**: ⏳ Pending
- **Prompt File**: [task-6-agency-context-setting.md](task-6-agency-context-setting.md)
- **Estimated Time**: 45-60 minutes
- **Prerequisites**: Tasks 1, 2, 5 completed, Story 1.2 completed
- **Key Deliverables**:
  - Database RPC function (set_agency_context)
  - setAgencyContext() utility
  - getCurrentAgencyId() utility
  - Example usage in Server Components
  - Example usage in API routes
- **Completion Date**: _____

---

### Task 7: Create Auth UI Components
- **Status**: ⏳ Pending
- **Prompt File**: [task-7-auth-ui-components.md](task-7-auth-ui-components.md)
- **Estimated Time**: 1.5-2 hours
- **Prerequisites**: Tasks 1, 2, 3 completed, Shadcn UI setup
- **Key Deliverables**:
  - LoginForm component
  - SignupForm component
  - LogoutButton component
  - PasswordResetForm component
  - Auth components package
- **Completion Date**: _____

---

### Task 8: Write Authentication Test Suite
- **Status**: ⏳ Pending
- **Prompt File**: [task-8-authentication-test-suite.md](task-8-authentication-test-suite.md)
- **Estimated Time**: 2-3 hours
- **Prerequisites**: All previous tasks completed
- **Key Deliverables**:
  - Signup API route tests
  - Login API route tests
  - Permission utility tests
  - Middleware tests
  - UI component tests
  - E2E authentication tests
- **Completion Date**: _____

---

## Progress Tracking

- **Total Tasks**: 8
- **Completed**: 0
- **In Progress**: 0
- **Pending**: 8
- **Overall Progress**: 0%

## Acceptance Criteria Checklist

Track completion of story acceptance criteria:

- [ ] **AC 1**: Users can register, log in, and log out securely
  - Related Tasks: 1, 2, 3, 7, 8

- [ ] **AC 2**: User sessions managed with secure JWT tokens
  - Related Tasks: 1, 3, 5, 8

- [ ] **AC 3**: Role-based access control distinguishes between Agency Admin and Agency User
  - Related Tasks: 2, 4, 8

- [ ] **AC 4**: Authentication middleware protects API routes and pages
  - Related Tasks: 5, 8

- [ ] **AC 5**: agency_id is automatically set in security context on login
  - Related Tasks: 2, 6, 8

## How to Use This Manifest

### For Sequential Execution in Claude Code Web:

1. **Open Claude Code Web** in your browser
2. **Copy the content** of task-1-supabase-auth-integration.md
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

- **Context XML**: [1-3-authentication-authorization-framework.context.xml](../.bmad-ephemeral/stories/1-3-authentication-authorization-framework.context.xml)
- **Story File**: [1-3-authentication-authorization-framework.md](../.bmad-ephemeral/stories/1-3-authentication-authorization-framework.md)
- **Epic Reference**: [docs/epics.md](../../../docs/epics.md)
- **Architecture Reference**: [docs/architecture.md](../../../docs/architecture.md)

## Dependencies

### External Dependencies:
- Story 1.2 completed (Multi-tenant Database Schema with RLS)
- Supabase project configured
- Next.js project setup (Turborepo)
- Shadcn UI installed (for Task 7)

### NPM Packages Required:
- @supabase/supabase-js
- @supabase/ssr
- react-hook-form
- @hookform/resolvers
- zod
- resend (optional for MVP)

## Notes

### Important Considerations:
- Ensure Story 1.2 is fully complete before starting Task 6
- Task 7 requires Shadcn UI setup beforehand
- Task 8 requires test dependencies installation
- All tasks use TypeScript strict mode
- Follow the architecture patterns from architecture.md

### Common Issues:
- **JWT not including agency_id**: Ensure Task 2 updates user metadata
- **RLS not filtering**: Verify Task 6 context setting is called
- **Middleware redirect loops**: Check Task 5 route matching logic
- **Cookie issues**: Verify HTTP-only and SameSite settings

## Completion Checklist

When all tasks are done:
- [ ] All 8 tasks marked as completed
- [ ] All acceptance criteria checked
- [ ] All tests passing
- [ ] Code reviewed
- [ ] Story marked as "done" in sprint status
- [ ] Documentation updated
- [ ] Ready for integration with other stories

---

**Last Updated**: 2025-11-13
**Next Review**: After Task 4 completion
