# Story 2.3: User Management Interface - Execution Manifest

**Generated:** 2025-11-13
**Story ID:** 2-3
**Story Status:** ready-for-dev

## Overview

This manifest tracks the execution of Story 2.3: User Management Interface. Each task should be completed sequentially by copying the prompt content into Claude Code Web and following the instructions.

## Story Summary

**As an** Agency Admin
**I want** to view and manage all users in my agency
**So that** I can control who has access and what roles they have

## Acceptance Criteria

1. ✅ Given I am an Agency Admin, When I access the user management page, Then I see a list of all users in my agency with their roles and status
2. ✅ And I can change a user's role (Admin ↔ User)
3. ✅ And I can deactivate or reactivate user accounts
4. ✅ And deactivated users cannot log in
5. ✅ And I can resend invitation emails for pending invitations
6. ✅ And I can delete pending invitations

## Task Execution Checklist

### Task 1: Database Schema ⬜
- **File:** `task-01-database-schema.md`
- **Status:** Not Started
- **AC:** 3, 4
- **Summary:** Extend users table with status field and create authentication triggers
- **Deliverables:**
  - `supabase/migrations/002_agency_domain/005_users_status.sql`
- **Completion Date:** ___________
- **Notes:**

---

### Task 2: Validation Schemas ⬜
- **File:** `task-02-validation-schemas.md`
- **Status:** Not Started
- **AC:** 2, 3
- **Summary:** Create Zod validation schemas for role and status updates
- **Deliverables:**
  - `packages/validations/src/user.schema.ts`
- **Completion Date:** ___________
- **Notes:**

---

### Task 3: Role Change API ⬜
- **File:** `task-03-role-change-api.md`
- **Status:** Not Started
- **AC:** 2
- **Summary:** Implement PATCH endpoint for changing user roles with last-admin validation
- **Deliverables:**
  - `apps/agency/app/api/users/[id]/role/route.ts`
- **Completion Date:** ___________
- **Notes:**

---

### Task 4: Status Change API ⬜
- **File:** `task-04-status-change-api.md`
- **Status:** Not Started
- **AC:** 3, 4
- **Summary:** Implement PATCH endpoint for activating/deactivating users
- **Deliverables:**
  - `apps/agency/app/api/users/[id]/status/route.ts`
- **Completion Date:** ___________
- **Notes:**

---

### Task 5: Invitation Management APIs ⬜
- **File:** `task-05-invitation-management-apis.md`
- **Status:** Not Started
- **AC:** 5, 6
- **Summary:** Implement resend and delete endpoints for invitation management
- **Deliverables:**
  - `apps/agency/app/api/invitations/[id]/resend/route.ts`
  - `apps/agency/app/api/invitations/[id]/route.ts` (DELETE method)
- **Completion Date:** ___________
- **Notes:**

---

### Task 6: User Management Page ⬜
- **File:** `task-06-user-management-page.md`
- **Status:** Not Started
- **AC:** 1
- **Summary:** Create the main user management page as Server Component
- **Deliverables:**
  - `apps/agency/app/users/page.tsx`
- **Completion Date:** ___________
- **Notes:**

---

### Task 7: User Table Component ⬜
- **File:** `task-07-user-table-component.md`
- **Status:** Not Started
- **AC:** 1, 2, 3
- **Summary:** Build UserTable Client Component with TanStack Query
- **Deliverables:**
  - `apps/agency/app/users/components/UserTable.tsx`
- **Completion Date:** ___________
- **Notes:**

---

### Task 8: Pending Invitations Table ⬜
- **File:** `task-08-pending-invitations-table.md`
- **Status:** Not Started
- **AC:** 5, 6
- **Summary:** Create component to display and manage pending invitations
- **Deliverables:**
  - `apps/agency/app/users/components/PendingInvitationsTable.tsx`
- **Completion Date:** ___________
- **Notes:**

---

### Task 9: User Actions Menu ⬜
- **File:** `task-09-user-actions-menu.md`
- **Status:** Not Started
- **AC:** 2, 3
- **Summary:** Create dropdown menu with user management actions
- **Deliverables:**
  - `apps/agency/app/users/components/UserActionsMenu.tsx`
- **Completion Date:** ___________
- **Notes:**

---

### Task 10: Role Change Dialog ⬜
- **File:** `task-10-role-change-dialog.md`
- **Status:** Not Started
- **AC:** 2
- **Summary:** Create confirmation dialog for role changes
- **Deliverables:**
  - `apps/agency/app/users/components/ConfirmRoleChangeDialog.tsx`
- **Completion Date:** ___________
- **Notes:**

---

### Task 11: Status Change Dialog ⬜
- **File:** `task-11-status-change-dialog.md`
- **Status:** Not Started
- **AC:** 3, 4
- **Summary:** Create confirmation dialog for status changes
- **Deliverables:**
  - `apps/agency/app/users/components/ConfirmStatusChangeDialog.tsx`
- **Completion Date:** ___________
- **Notes:**

---

### Task 12: Navigation Link ⬜
- **File:** `task-12-navigation-link.md`
- **Status:** Not Started
- **AC:** 1
- **Summary:** Add "Users" navigation link visible only to admins
- **Deliverables:**
  - Update `apps/agency/app/layout.tsx` or navigation component
- **Completion Date:** ___________
- **Notes:**

---

### Task 13: Write Tests ⬜
- **File:** `task-13-write-tests.md`
- **Status:** Not Started
- **AC:** 1-6
- **Summary:** Create comprehensive unit, integration, and E2E tests
- **Deliverables:**
  - API integration tests
  - Component unit tests
  - E2E test scenarios
- **Completion Date:** ___________
- **Notes:**

---

## Execution Instructions

### How to Use This Manifest

1. **Sequential Execution:** Complete tasks in order (1 → 13)
2. **Copy-Paste Approach:** Open each task file and copy the entire content into Claude Code Web
3. **Track Progress:** Mark tasks as complete (⬜ → ✅) and add completion date
4. **Document Issues:** Use Notes section for any blockers or deviations
5. **Verify AC:** After all tasks, verify each acceptance criterion is met

### For Each Task

1. Open the task markdown file (e.g., `task-01-database-schema.md`)
2. Copy the entire content
3. Paste into Claude Code Web
4. Follow Claude's implementation
5. Test the implementation
6. Update this manifest:
   - Change ⬜ to ✅
   - Add completion date
   - Add any relevant notes
7. Proceed to next task

### Quality Gates

Before marking the story complete, ensure:
- [ ] All 13 tasks completed
- [ ] All acceptance criteria verified
- [ ] All tests passing
- [ ] Code reviewed (if applicable)
- [ ] Documentation updated
- [ ] No known blockers

## Dependencies

**Prerequisites (from previous stories):**
- Story 2.2: User Invitation System (for invitation infrastructure)
- Authentication system setup
- Supabase database configured
- Next.js 15 app structure

**External Dependencies:**
- `@supabase/supabase-js` - Database client
- `@tanstack/react-query` - Data fetching
- `zod` - Schema validation
- `date-fns` - Date utilities
- `shadcn/ui` - UI components

## Rollback Plan

If issues arise during implementation:

1. **Database Changes:** Rollback migration with `supabase migration down`
2. **API Routes:** Comment out route handlers, restore from git
3. **Components:** Use git to revert component changes
4. **Complete Rollback:** `git reset --hard HEAD` (before commit)

## Story Completion

**Completion Criteria:**
- [ ] All 13 tasks completed
- [ ] All AC verified manually
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Accessibility checked
- [ ] Story marked as complete in sprint status

**Completed By:** ___________
**Completion Date:** ___________
**Final Notes:**

---

## Reference

- **Story File:** `.bmad-ephemeral/stories/2-3-user-management-interface.md`
- **Context File:** `.bmad-ephemeral/stories/2-3-user-management-interface.context.xml`
- **Prompts Location:** `.bmad-ephemeral/stories/prompts/2-3/`
- **Epic:** Epic 2 - Agency & User Management
- **PRD Section:** FR-1.3 User Role Management
