# Story 2.3: User Management Interface - Task Prompts

## 📋 Quick Start

This directory contains **13 task-specific prompts** for implementing Story 2.3: User Management Interface in sequential order using Claude Code Web.

### Story Overview

**As an** Agency Admin
**I want** to view and manage all users in my agency
**So that** I can control who has access and what roles they have

## 🎯 Execution Strategy

### Recommended Approach: Sequential Copy-Paste

1. Open **[MANIFEST.md](./MANIFEST.md)** to track overall progress
2. For each task (01-13):
   - Open the task file (e.g., `task-01-database-schema.md`)
   - Copy the **entire content**
   - Paste into **Claude Code Web**
   - Let Claude implement the task
   - Mark as complete in MANIFEST.md
3. Proceed sequentially through all 13 tasks

### Why Sequential?

Tasks are ordered by dependency:
- Database schema → API validation → API endpoints → UI components → Tests

Skipping ahead may cause missing dependencies.

## 📂 Task Files

| # | File | AC | Summary | Files Created |
|---|------|-------|---------|---------------|
| 01 | [task-01-database-schema.md](./task-01-database-schema.md) | 3,4 | Extend users table with status field | Migration SQL |
| 02 | [task-02-validation-schemas.md](./task-02-validation-schemas.md) | 2,3 | Create Zod validation schemas | user.schema.ts |
| 03 | [task-03-role-change-api.md](./task-03-role-change-api.md) | 2 | Implement role change API endpoint | role/route.ts |
| 04 | [task-04-status-change-api.md](./task-04-status-change-api.md) | 3,4 | Implement status change API endpoint | status/route.ts |
| 05 | [task-05-invitation-management-apis.md](./task-05-invitation-management-apis.md) | 5,6 | Implement invitation resend/delete | resend/route.ts, DELETE |
| 06 | [task-06-user-management-page.md](./task-06-user-management-page.md) | 1 | Create user management page | users/page.tsx |
| 07 | [task-07-user-table-component.md](./task-07-user-table-component.md) | 1,2,3 | Build UserTable component | UserTable.tsx |
| 08 | [task-08-pending-invitations-table.md](./task-08-pending-invitations-table.md) | 5,6 | Build PendingInvitationsTable | PendingInvitationsTable.tsx |
| 09 | [task-09-user-actions-menu.md](./task-09-user-actions-menu.md) | 2,3 | Create user actions dropdown | UserActionsMenu.tsx |
| 10 | [task-10-role-change-dialog.md](./task-10-role-change-dialog.md) | 2 | Create role change confirmation | ConfirmRoleChangeDialog.tsx |
| 11 | [task-11-status-change-dialog.md](./task-11-status-change-dialog.md) | 3,4 | Create status change confirmation | ConfirmStatusChangeDialog.tsx |
| 12 | [task-12-navigation-link.md](./task-12-navigation-link.md) | 1 | Add navigation link for admins | Update layout/navigation |
| 13 | [task-13-write-tests.md](./task-13-write-tests.md) | 1-6 | Write comprehensive tests | Integration, unit, E2E tests |

## ✅ Acceptance Criteria

1. **Given** I am an Agency Admin, **When** I access the user management page, **Then** I see a list of all users in my agency with their roles and status
2. **And** I can change a user's role (Admin ↔ User)
3. **And** I can deactivate or reactivate user accounts
4. **And** deactivated users cannot log in
5. **And** I can resend invitation emails for pending invitations
6. **And** I can delete pending invitations

## 🏗️ Architecture Overview

### Database Layer
- Users table with `status` field (active/inactive)
- Audit logging triggers for role/status changes
- RLS policies for multi-tenant isolation

### API Layer
- `PATCH /api/users/[id]/role` - Change user role
- `PATCH /api/users/[id]/status` - Change user status
- `POST /api/invitations/[id]/resend` - Resend invitation
- `DELETE /api/invitations/[id]` - Delete invitation

### UI Layer
- **Server Components:** `users/page.tsx` (data fetching)
- **Client Components:** UserTable, Actions Menu, Dialogs
- **State Management:** TanStack Query for mutations
- **Styling:** shadcn/ui components + Tailwind

## 📦 Dependencies

```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "@tanstack/react-query": "^5.90.7",
    "zod": "^4.x",
    "date-fns": "^4.1.0",
    "next": "^15.x",
    "react": "^19"
  }
}
```

## 🧪 Testing Strategy

- **Unit Tests:** Component behavior and validation schemas
- **Integration Tests:** API endpoints with RLS validation
- **E2E Tests:** Complete user flows with Playwright

## 🚀 Getting Started

### Step 1: Review Context
```bash
# View full story details
cat .bmad-ephemeral/stories/2-3-user-management-interface.md

# View story context (architecture, constraints)
cat .bmad-ephemeral/stories/2-3-user-management-interface.context.xml
```

### Step 2: Start Task Execution
```bash
# Open the manifest
open MANIFEST.md

# Open first task
open task-01-database-schema.md
```

### Step 3: Copy-Paste to Claude Code Web
1. Copy entire content of `task-01-database-schema.md`
2. Paste into Claude Code Web
3. Follow Claude's implementation
4. Test the changes
5. Mark complete in MANIFEST.md
6. Proceed to `task-02-validation-schemas.md`

### Step 4: Repeat for All Tasks
Continue through tasks 02-13 sequentially.

## 📊 Progress Tracking

Use [MANIFEST.md](./MANIFEST.md) to track:
- ✅ Task completion status
- 📅 Completion dates
- 📝 Implementation notes
- 🐛 Issues/blockers

## 🔄 Rollback Plan

If issues arise:
1. **Database:** `supabase migration down`
2. **Code:** `git reset --hard HEAD` (before commit)
3. **Individual files:** `git checkout -- <file>`

## 📖 Additional Resources

- **Full Story:** [2-3-user-management-interface.md](../../2-3-user-management-interface.md)
- **Story Context:** [2-3-user-management-interface.context.xml](../../2-3-user-management-interface.context.xml)
- **Epic File:** [docs/epics.md](../../../../docs/epics.md)
- **Architecture:** [docs/architecture.md](../../../../docs/architecture.md)
- **PRD:** [docs/PRD.md](../../../../docs/PRD.md)

## ⚠️ Important Notes

### Security Considerations
- Only admins can manage users (enforced at API + UI level)
- Cannot deactivate own account (prevent lockout)
- Cannot remove last admin (prevent orphaned agency)
- RLS prevents cross-agency operations
- All changes audited in `audit_log` table

### Key Validations
- Last admin check before role demotion
- Self-deactivation prevention
- Pending invitation status check
- RLS double-checking in APIs

### UI/UX Patterns
- Confirmation dialogs for destructive actions
- Toast notifications for feedback
- Optimistic updates with TanStack Query
- Badge color coding (Admin: blue, User: gray, Active: green, Inactive: red)

## 🎉 Story Completion

After completing all 13 tasks:
1. ✅ Verify all acceptance criteria manually
2. ✅ Run test suite: `npm test`
3. ✅ Run E2E tests: `npm run test:e2e`
4. ✅ Check for console errors
5. ✅ Verify accessibility
6. ✅ Update sprint status file
7. ✅ Mark story as complete

---

**Generated:** 2025-11-13
**Story Status:** ready-for-dev
**Estimated Completion:** 13 tasks × ~30 min = ~6.5 hours
