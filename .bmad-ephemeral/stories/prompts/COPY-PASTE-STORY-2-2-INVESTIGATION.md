# COPY THIS ENTIRE MESSAGE TO A NEW CLAUDE CODE WEB SESSION

---

# 🔍 FORENSIC INVESTIGATION: Story 2.2 - User Invitation and Task Assignment System

I need you to conduct a **comprehensive forensic investigation** of Story 2.2's implementation status in this codebase.

## Context: Why This Investigation Matters

**Story 1.3 Investigation Results:**
- **MANIFEST claimed:** 0% complete, all tasks pending
- **Actual status:** 100% complete - full authentication system with 1,216 lines of tests
- **Lesson learned:** MANIFESTs can be dangerously outdated

**Story 2.1 Investigation Results:**
- **MANIFEST claimed:** 100% complete, 68 tests
- **Actual status:** 100% complete - 120 tests (76% more than claimed!)
- **Lesson learned:** MANIFESTs can undercount tests and implementation details

**Your Mission:** Apply the same forensic rigor to Story 2.2 (User Invitation and Task Assignment System) to uncover the truth.

---

## Investigation Guidelines

**DO NOT TRUST THE MANIFEST** - Examine the actual codebase to find ground truth.

**Full Investigation Protocol:**
Read the detailed protocol at: `.bmad-ephemeral/stories/prompts/INVESTIGATE-STORY-2-2-PROMPT.md`

**Quick Start - Execute These Commands Systematically:**

### 1. Locate Story Files
```bash
ls -la .bmad-ephemeral/stories/ | grep -i "2-2\|2\.2"
```
**Then read:**
- `.bmad-ephemeral/stories/2-2-user-invitation-and-task-assignment-system.md`
- `.bmad-ephemeral/stories/prompts/2-2-user-invitation-and-task-assignment-system/manifest.md`

### 2. Check Database Schema (4 Tables Expected)
```bash
# Invitations table
find supabase/migrations -name "*invitation*" -type f
cat supabase/migrations/001_agency_domain/006_invitations_schema.sql

# Master tasks table
grep -r "master_tasks" supabase/migrations/ --include="*.sql"

# User task assignments table
grep -r "user_task_assignments" supabase/migrations/ --include="*.sql"

# Audit log table
find supabase/migrations -name "*audit*" -type f
grep -r "audit_log" supabase/migrations/ --include="*.sql"
```

**Verify for Each Table:**
- ✅/❌ Table schema exists
- ✅/❌ All required fields present
- ✅/❌ Foreign key constraints with CASCADE
- ✅/❌ RLS policies enabled
- ✅/❌ Indexes on commonly queried columns
- ✅/❌ Trigger functions (for audit_log)

### 3. Find Invitation API Routes
```bash
find apps/agency -path "*/api/invitations/*" -name "route.ts"
ls -laR apps/agency/app/api/invitations/
```

**Expected Routes:**
- POST /api/invitations (create invitation)
- POST /api/invitations/[id]/resend (resend email)
- DELETE /api/invitations/[id] (cancel invitation)

### 4. Find User Task Assignment API Routes
```bash
find apps/agency -path "*/api/users/*/tasks/*" -name "route.ts"
ls -la apps/agency/app/api/users/[id]/tasks/
```

**Expected Routes:**
- POST /api/users/[id]/tasks (assign/update tasks)
- GET /api/users/[id]/tasks (get assigned tasks)

### 5. Locate Invitation Acceptance Page
```bash
find apps/shell -path "*/accept-invitation/*" -name "page.tsx"
ls -la apps/shell/app/accept-invitation/[token]/
```

**Verify:**
- ✅/❌ Token validation (expiry, used status)
- ✅/❌ Signup form pre-filled with email
- ✅/❌ Password fields and validation
- ✅/❌ Automatic agency association
- ✅/❌ Automatic role assignment
- ✅/❌ Task assignments creation

### 6. Locate User Management Pages
```bash
find apps/agency -path "*/users/*" -name "page.tsx"
ls -la apps/agency/app/users/
ls -la apps/agency/app/users/[id]/
```

**Expected Pages:**
- /users/page.tsx (user list with "Invite User" button)
- /users/[id]/page.tsx (user detail with task assignments)

### 7. Find UI Components
```bash
find apps/agency -path "*/users/components/*" -type f
```

**Expected Components:**
- InviteUserModal.tsx
- TaskAssignmentCheckboxes.tsx (or similar)
- PendingInvitationsList.tsx
- UserTasksList.tsx (or similar)

### 8. Check Email Templates
```bash
find apps/agency/emails -name "*invitation*"
ls -la apps/agency/emails/
```

**Expected:**
- invitation.tsx (React Email template)

**Verify Content:**
- Agency name, inviter name
- Secure invitation link
- Assigned tasks list
- Expiration notice (7 days)

### 9. Find Email Sending Utilities
```bash
find packages/utils -name "*email*"
grep -r "sendInvitationEmail" packages/ --include="*.ts"
```

**Expected:**
- packages/utils/src/email-helpers.ts
- sendInvitationEmail() function
- Resend API integration

### 10. Find Invitation Helper Utilities
```bash
find packages/utils -name "*invitation*"
grep -r "isInvitationExpired" packages/ --include="*.ts"
```

**Expected:**
- packages/utils/src/invitation-helpers.ts
- isInvitationExpired() function
- Token generation utilities

### 11. Check Validation Schemas
```bash
find packages/validations -name "*invitation*"
find packages/validations -name "*task*"
```

**Expected:**
- invitation.schema.ts
- InvitationCreateSchema (email, role, task_ids)
- UserTaskAssignmentSchema (task_ids array)

### 12. Locate Tests
```bash
# Find all invitation and task-related tests
find . -name "*invitation*.test.ts" -o -name "*task*.test.ts" 2>/dev/null | grep -v node_modules

# Count lines in test files
find . -name "*invitation*.test.ts" -o -name "*task*.test.ts" 2>/dev/null | \
  grep -v node_modules | xargs wc -l

# Count individual test cases
find . -name "*invitation*.test.ts" -o -name "*task*.test.ts" 2>/dev/null | \
  grep -v node_modules | xargs grep -c "it(\|test("
```

### 13. Verify Audit Logging
```bash
# Find audit log triggers
grep -r "audit_log" supabase/migrations/ --include="*.sql"

# Find audit log usage in task assignment API
grep -r "audit_log" apps/agency/app/api/users --include="*.ts"
```

**Verify:**
- ✅/❌ Trigger function for profile changes
- ✅/❌ Trigger function for task assignment changes
- ✅/❌ Audit log insertions in API routes
- ✅/❌ Admin-only RLS policy on audit_log

### 14. Check RLS Policies
```bash
# Check RLS on all tables
grep -A 20 "invitations" supabase/migrations/001_agency_domain/*rls*.sql
grep -A 20 "master_tasks" supabase/migrations/001_agency_domain/*rls*.sql
grep -A 20 "user_task_assignments" supabase/migrations/001_agency_domain/*rls*.sql
grep -A 20 "audit_log" supabase/migrations/001_agency_domain/*rls*.sql
```

### 15. Verify Master Tasks Seed Data
```bash
# Find seed data for master tasks
grep -r "DATA_ENTRY\|DOC_VERIFY\|PAYMENT_PROC" supabase/migrations/ --include="*.sql"
```

**Expected 6 Tasks:**
- DATA_ENTRY (Data entry)
- DOC_VERIFY (Document verification)
- PAYMENT_PROC (Payment processing)
- STUDENT_COMM (Student communication)
- COLLEGE_LIAISON (College liaison)
- REPORTING (Reporting)

---

## Investigation Checklist

For each area, determine: ✅ Complete | ⚠️ Partial | ❌ Missing

**Database Layer (4 Tables):**
- [ ] invitations table with all fields
- [ ] master_tasks table with seed data (6 tasks)
- [ ] user_task_assignments table with foreign keys
- [ ] audit_log table with triggers
- [ ] RLS policies on all tables
- [ ] Indexes for performance

**API Layer (5 Routes):**
- [ ] POST /api/invitations
- [ ] POST /api/invitations/[id]/resend
- [ ] DELETE /api/invitations/[id]
- [ ] POST /api/users/[id]/tasks
- [ ] GET /api/users/[id]/tasks

**Pages (3 Pages):**
- [ ] /accept-invitation/[token]
- [ ] /users (user list)
- [ ] /users/[id] (user detail)

**Components:**
- [ ] InviteUserModal
- [ ] Task assignment UI
- [ ] Pending invitations display
- [ ] User tasks display

**Email System:**
- [ ] invitation.tsx template
- [ ] sendInvitationEmail() function
- [ ] Resend API integration
- [ ] Error handling

**Utilities:**
- [ ] isInvitationExpired()
- [ ] Token generation
- [ ] Email helpers

**Validation:**
- [ ] InvitationCreateSchema
- [ ] UserTaskAssignmentSchema
- [ ] Email/role/UUID validation

**Tests:**
- [ ] Invitation API tests
- [ ] Task assignment API tests
- [ ] Validation schema tests
- [ ] Email helper tests
- [ ] Utility function tests
- [ ] Total lines: _____

**Audit Logging:**
- [ ] Profile change triggers
- [ ] Task assignment change triggers
- [ ] Admin-only access
- [ ] Complete who/what/when data

---

## Expected Acceptance Criteria

Verify these 8 ACs from the story:

**AC #1: Email Invitation with Secure Link**
- [ ] Admin can invite user by email
- [ ] Invitation email sent
- [ ] Secure unique token in link

**AC #2: 7-Day Expiration**
- [ ] Expiration set to 7 days
- [ ] Expired invitations rejected
- [ ] Error message shown

**AC #3: User Registration via Link**
- [ ] Signup form accessible
- [ ] User can complete registration
- [ ] Validation enforced

**AC #4: Automatic Agency Association**
- [ ] New user gets agency_id from invitation
- [ ] New user gets role from invitation
- [ ] Automatic association verified

**AC #5: Task Assignment During Invitation**
- [ ] Master task list available
- [ ] Tasks can be selected during invitation
- [ ] Task checkboxes in invitation modal

**AC #6: Task List in Email**
- [ ] Email shows assigned tasks
- [ ] Task names clear in email
- [ ] Professional formatting

**AC #7: Modify Task Assignments**
- [ ] Admin can update user tasks
- [ ] Task assignment UI exists
- [ ] Changes persist

**AC #8: Audit Logging**
- [ ] Profile changes logged
- [ ] Task changes logged
- [ ] Log includes who, what, when
- [ ] Admin can view logs

---

## Generate Investigation Report

After your investigation, create:

**File:** `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-2-2.md`

**Include:**
1. **Executive Summary** - Overall status, confidence level, MANIFEST accuracy
2. **Detailed Findings** - Evidence for each task with file paths and line numbers
3. **Database Schema Verification** - All 4 tables with RLS
4. **API Routes Verification** - All 5 routes with security
5. **Email System Verification** - Template + sending + delivery
6. **Audit Logging Verification** - Triggers + storage + access
7. **Missing Implementations** - What's not found
8. **Incomplete Implementations** - What's partial
9. **Test Coverage Analysis** - Lines of tests, scenarios covered
10. **MANIFEST Discrepancies** - Specific differences
11. **Security Assessment** - Token security, RLS, role checks
12. **Recommendations** - Prioritized next steps
13. **Investigation Commands** - All commands used
14. **Conclusion** - Overall assessment with approval/rejection

**Use the template from:** `.bmad-ephemeral/stories/prompts/INVESTIGATE-STORY-2-2-PROMPT.md`

---

## After Investigation

1. **Create Report:** `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-2-2.md`
2. **Commit Changes:**
   ```bash
   git add .bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-2-2.md
   git commit -m "docs: add comprehensive investigation report for Story 2.2"
   ```
3. **Push to Remote:**
   ```bash
   git push -u origin claude/investigate-story-2-2-{session-id}
   ```
4. **Summary for User:** Provide executive summary of findings

---

## Success Criteria

Your investigation is complete when you can answer:

1. ✅ What is the actual implementation status of Story 2.2?
2. ✅ Is the MANIFEST accurate or outdated?
3. ✅ What specific evidence proves each task's status?
4. ✅ How many lines of test coverage exist?
5. ✅ Are all 8 acceptance criteria met?
6. ✅ Is the email system working (template + delivery)?
7. ✅ Is audit logging complete (triggers + storage)?
8. ✅ What's missing or incomplete?
9. ✅ What should be done next?

---

## Key Focus Areas for Story 2.2

**🔒 Security Critical:**
- Token generation (cryptographically secure UUID)
- Token expiration validation (7 days)
- RLS policies on all 4 tables
- Admin-only invitation creation
- Audit logging completeness

**📧 Email System Critical:**
- React Email template quality
- Resend API integration
- Task list display in email
- Link generation
- Error handling

**🗂️ Data Integrity Critical:**
- Foreign key constraints (CASCADE)
- Unique token constraint
- Invitation usage tracking (used_at)
- Task assignment consistency
- Audit log completeness

**🧪 Testing Critical:**
- Token expiration edge cases
- Email sending failures
- Concurrent invitation usage
- Task assignment with audit logging
- RLS policy enforcement

---

## Resources

**Detailed Protocol:** `.bmad-ephemeral/stories/prompts/INVESTIGATE-STORY-2-2-PROMPT.md`

**Previous Investigation Examples:**
- Story 1.3: `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-1-3.md` (MANIFEST 0%, Reality 100%)
- Story 2.1: `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-2-1.md` (MANIFEST 100%, Reality 100% + bonus tests)

**Story 2.2 is Complex - Focus On:**
1. **4 Database Tables** (invitations, master_tasks, user_task_assignments, audit_log)
2. **5 API Routes** (create, resend, cancel invitations + assign/get tasks)
3. **Email Template** (invitation.tsx with React Email)
4. **Audit Logging** (triggers for profile + task changes)
5. **Test Coverage** (count actual tests, not just what MANIFEST claims)
6. **Security** (tokens, RLS, role checks)

---

🔍 **START YOUR INVESTIGATION NOW** - Be thorough, be systematic, find the truth!

This is a more complex story than 2.1 with:
- Multiple interconnected tables
- Email system integration
- Audit logging with triggers
- Task assignment workflow
- Invitation lifecycle management

Apply the same rigor as Stories 1.3 and 2.1 - verify everything with evidence!
