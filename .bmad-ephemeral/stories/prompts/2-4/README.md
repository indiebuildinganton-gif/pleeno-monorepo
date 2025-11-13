# Story 2-4: User Profile Management - Implementation Guide

**Story ID:** 2-4
**Story Title:** User Profile Management
**Total Tasks:** 13
**Generated:** 2025-11-13

---

## 📁 Overview

This directory contains 13 task-specific prompts for implementing Story 2-4: User Profile Management. Each prompt is designed to be copy-pasted into Claude Code Web for sequential execution.

**User Story:**
> As an Agency User or Admin
> I want to manage my own profile information
> So that my account information is accurate and I can change my password

---

## 📄 Generated Files

### Task Prompts (Execute in Order)
1. `01-create-database-schema-for-invitations-and-task-as.md` - Email verification schema ✨ **Includes manifest creation**
2. `02-implement-profile-update-api-route.md` - Profile update API endpoint
3. `03-implement-password-change-api-route.md` - Password change API endpoint
4. `04-implement-admin-email-change-api-route.md` - Admin email change API endpoint
5. `05-implement-email-verification-confirmation-endpoint.md` - Email verification confirmation
6. `06-create-user-profile-page.md` - Main profile page (Server Component)
7. `07-create-change-password-dialog.md` - Change password dialog
8. `08-create-update-email-dialog.md` - Update email dialog (admin only)
9. `09-create-request-email-change-dialog.md` - Request email change dialog (regular users)
10. `10-create-email-verification-page.md` - Email verification page
11. `11-create-email-verification-email-template.md` - Email template (React Email)
12. `12-create-validation-schemas.md` - Zod validation schemas
13. `13-write-tests-for-profile-management.md` - Comprehensive tests

### Supporting Files
- `README.md` - This file (usage instructions)
- `MANIFEST.md` - Progress tracking (created by Task 1)

---

## 🚀 Getting Started

### Prerequisites

Before starting implementation, ensure you have:
- ✅ Completed Story 2-1 (Agency Registration)
- ✅ Completed Story 2-2 (User Invitation System)
- ✅ Completed Story 2-3 (User Management)
- ✅ Claude Code Web access
- ✅ Local development environment running

### Implementation Workflow

**Step 1: Open Claude Code Web**
- Navigate to your preferred Claude Code interface
- Ensure you're in the correct project directory

**Step 2: Start with Task 1**
1. Open `01-create-database-schema-for-invitations-and-task-as.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Execute the task
5. **CRITICAL:** Verify `MANIFEST.md` is created

**Step 3: Update Manifest After Each Task**
After completing each task:
1. Open `MANIFEST.md`
2. Mark the completed task with status "Completed" and today's date
3. Mark the next task as "In Progress"
4. Add any implementation notes

**Step 4: Continue Sequentially**
- Move to `02-implement-profile-update-api-route.md`
- Repeat the copy/paste/execute process
- Continue through all 13 tasks in order

**Step 5: Final Verification**
After Task 13:
1. Run all tests
2. Verify all acceptance criteria met
3. Update manifest with final completion status

---

## 📋 Manifest Tracking

The manifest file (`MANIFEST.md`) is your progress tracker. It will be created by Task 1 and should be updated after each task completion.

**Manifest Location:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`

**How to Use:**
1. Task 1 creates the manifest automatically
2. Each subsequent task prompt includes instructions to update it
3. Track which tasks are complete, in progress, or not started
4. Add notes about challenges, decisions, or learnings

**Example Manifest Entry:**
```markdown
### Task 3: Implement password change API endpoint
- **Status:** Completed
- **Started:** 2025-11-13
- **Completed:** 2025-11-13
- **Notes:** Added extra validation for password strength. Required crypto module for secure token generation.
```

---

## 🎯 Task Dependencies

### Phase 1: Backend Foundation (Tasks 1-5)
- **Task 1:** Database schema (required by all)
- **Task 2:** Profile API (independent)
- **Task 3:** Password API (independent)
- **Task 4:** Email change API (depends on Task 1)
- **Task 5:** Email verification API (depends on Task 1, 4)

### Phase 2: Frontend UI (Tasks 6-10)
- **Task 6:** Profile page (depends on Tasks 2, 3)
- **Task 7:** Password dialog (depends on Task 3)
- **Task 8:** Update email dialog (depends on Task 4)
- **Task 9:** Request email dialog (informational only)
- **Task 10:** Verification page (depends on Task 5)

### Phase 3: Supporting Infrastructure (Tasks 11-12)
- **Task 11:** Email template (used by Task 4)
- **Task 12:** Validation schemas (used by Tasks 2-5)

**Note:** Tasks 11-12 may need early implementation if referenced by earlier tasks.

### Phase 4: Testing (Task 13)
- **Task 13:** Tests (depends on all previous tasks)

---

## ✅ Acceptance Criteria Checklist

After completing all tasks, verify these acceptance criteria:

- [ ] **AC1:** User can update their name and password from profile settings
- [ ] **AC2:** Password changes require current password confirmation
- [ ] **AC3:** Password must meet security requirements (min 8 chars, mix of types)
- [ ] **AC4:** User receives confirmation when profile is updated
- [ ] **AC5:** User can view role, agency, and email but cannot change them (read-only)
- [ ] **AC6:** Regular users must request email changes from Agency Admin
- [ ] **AC7:** Only Agency Admins can update user emails
- [ ] **AC8:** Admin can update their own email address
- [ ] **AC9:** Email changes require administrator verification via email link
- [ ] **AC10:** Email changes are logged in audit trail

---

## 🧪 Testing Strategy

### Unit Tests (Task 12)
- Validation schemas
- Password strength calculator
- Utility functions

### Integration Tests (Task 13)
- All API endpoints
- Database operations
- Audit logging
- RLS policies

### E2E Tests (Task 13)
- Profile update flow
- Password change flow
- Email change flow (admin)
- Request email change (regular user)

**Run Tests:**
```bash
# Unit tests
cd packages/validations && npm test

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

---

## 🔧 Environment Setup

Required environment variables (check `.env.local`):

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Email
RESEND_API_KEY=your_resend_api_key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📚 Reference Documents

### Story Context
- **Story File:** [.bmad-ephemeral/stories/2-4-user-profile-management.md](../../2-4-user-profile-management.md)
- **Story Context:** [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](../../2-4-user-profile-management.context.xml)

### Architecture & Design
- **Architecture:** [docs/architecture.md](../../../docs/architecture.md)
- **PRD:** [docs/PRD.md](../../../docs/PRD.md)
- **Epic Definition:** [docs/epics.md](../../../docs/epics.md)

---

## 💡 Tips for Success

### General Guidelines
1. **Execute tasks in order** - Dependencies matter!
2. **Update manifest religiously** - Track your progress
3. **Read each prompt fully** - Contains important context
4. **Test as you go** - Don't wait until Task 13
5. **Commit frequently** - Small, atomic commits are best

### Common Pitfalls
❌ Skipping manifest updates
❌ Implementing tasks out of order
❌ Not testing after each task
❌ Ignoring validation schemas
❌ Forgetting environment variables

✅ Follow prompts sequentially
✅ Update manifest after each task
✅ Test endpoints immediately
✅ Use provided validation schemas
✅ Configure environment properly

### Performance Tips
- **Use validation schemas** provided in Task 12 (don't write from scratch)
- **Reuse code patterns** from architecture docs
- **Copy error handling** utilities from previous stories
- **Reference existing components** when building UI

### Debugging
- **API errors:** Check Supabase logs and browser network tab
- **RLS issues:** Verify agency_id context is set correctly
- **Email not sending:** Check Resend dashboard and API key
- **Token expiration:** Tokens are valid for 1 hour only

---

## 🎓 Learning Outcomes

After completing this story, you will have implemented:

✨ **Backend**
- Database schema extensions with triggers
- RESTful API endpoints with validation
- Token-based email verification workflow
- Audit logging for security events

✨ **Frontend**
- Server Components for data fetching
- Client Components for interactivity
- Form handling with React Hook Form + Zod
- Dialog components with Radix UI
- Toast notifications

✨ **Security**
- Password strength validation
- Current password verification
- Role-based access control
- Email verification tokens
- Audit trail logging

✨ **Testing**
- Unit tests with Vitest
- Integration tests with Supabase
- E2E tests with Playwright
- Test coverage reporting

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the manifest** - Did you complete prerequisite tasks?
2. **Review the story context** - Contains detailed requirements
3. **Check architecture docs** - Reference implementation patterns
4. **Verify environment** - All required variables set?
5. **Read error messages** - They often point to the issue
6. **Test incrementally** - Don't wait until the end

**Common Issues:**
- **"Token not found"** → Check database schema from Task 1
- **"Not authenticated"** → Verify Supabase auth setup
- **"Email not sending"** → Check Resend API key and from address
- **"RLS policy violation"** → Verify user context and agency_id

---

## 🎉 Success!

When all 13 tasks are complete and tests are passing:

1. ✅ Update manifest to "Completed" status
2. ✅ Run full test suite
3. ✅ Verify all acceptance criteria
4. ✅ Commit your changes
5. ✅ Celebrate! 🎊

**Next Steps:**
- Move to Story 2-5 (if available)
- Review Epic 2 completion status
- Document any lessons learned

---

## 📊 Quick Stats

- **Total Tasks:** 13
- **Estimated Time:** 8-12 hours (experienced developer)
- **Lines of Code:** ~2,500 (including tests)
- **Files Created:** ~20
- **API Endpoints:** 4
- **Database Migrations:** 1
- **React Components:** 6
- **Tests:** 30+

---

**Good luck with your implementation, anton! 🚀**

*Generated by BMad Execute Dev Story Workflow*
*Story: 2-4 User Profile Management*
*Date: 2025-11-13*
