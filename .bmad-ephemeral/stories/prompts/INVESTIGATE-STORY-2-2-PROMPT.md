# 🔍 FORENSIC INVESTIGATION: Story 2.2 - User Invitation and Task Assignment System

I need you to conduct a **comprehensive forensic investigation** of Story 2.2's implementation status in this codebase.

## Context: Why This Investigation Matters

**Previous Investigation Results:**

**Story 1.3:**
- **MANIFEST claimed:** 0% complete, all tasks pending
- **Actual status:** 100% complete - full authentication system with 1,216 lines of tests
- **Lesson learned:** MANIFESTs can be dangerously outdated

**Story 2.1:**
- **MANIFEST claimed:** 100% complete, 68 tests
- **Actual status:** 100% complete - 120 tests (76% more than claimed!)
- **Lesson learned:** MANIFESTs can undercount tests and implementation details

**Your Mission:** Apply the same forensic rigor to Story 2.2 (User Invitation and Task Assignment System) to uncover the truth.

---

## Investigation Guidelines

**DO NOT TRUST THE MANIFEST** - Examine the actual codebase to find ground truth.

**Full Investigation Protocol:**

### Step-by-Step Investigation Process

Execute these commands systematically and document all findings:

---

## 1. Locate Story Files

```bash
ls -la .bmad-ephemeral/stories/ | grep -i "2-2\|2\.2"
```

**Then read:**
- `.bmad-ephemeral/stories/2-2-user-invitation-and-task-assignment-system.md`
- `.bmad-ephemeral/stories/prompts/2-2-user-invitation-and-task-assignment-system/manifest.md` (if exists)

**Document:**
- Story title and acceptance criteria
- Number of tasks/subtasks
- MANIFEST completion claims
- Expected features

---

## 2. Check Database Schema

### Invitations Table
```bash
find supabase/migrations -name "*invitation*" -type f 2>/dev/null
cat supabase/migrations/001_agency_domain/006_invitations_schema.sql
```

**Verify Schema Components:**
- ✅/❌ invitations table exists
- ✅/❌ Fields: id, agency_id, email, token, expires_at, invited_by, used_at, created_at
- ✅/❌ Unique constraint on token
- ✅/❌ Foreign key constraints with CASCADE
- ✅/❌ RLS policies enabled
- ✅/❌ Indexes on agency_id, email, token, expires_at

### Master Tasks Table
```bash
grep -r "master_tasks" supabase/migrations/ --include="*.sql"
```

**Verify:**
- ✅/❌ master_tasks table exists
- ✅/❌ Fields: id, task_name, task_code, description, created_at
- ✅/❌ Seeded with 6 common tasks (DATA_ENTRY, DOC_VERIFY, PAYMENT_PROC, STUDENT_COMM, COLLEGE_LIAISON, REPORTING)

### User Task Assignments Table
```bash
grep -r "user_task_assignments" supabase/migrations/ --include="*.sql"
```

**Verify:**
- ✅/❌ user_task_assignments table exists
- ✅/❌ Fields: id, user_id, task_id, assigned_at, assigned_by
- ✅/❌ Foreign key constraints
- ✅/❌ RLS policies

### Audit Logging Table
```bash
find supabase/migrations -name "*audit*" -type f 2>/dev/null
grep -r "audit_log" supabase/migrations/ --include="*.sql"
```

**Verify:**
- ✅/❌ audit_log table exists
- ✅/❌ Fields: id, entity_type, entity_id, user_id, action, changes_json, created_at
- ✅/❌ RLS policies for admin-only access
- ✅/❌ Trigger functions for automatic logging
- ✅/❌ Indexes on entity_type, entity_id, created_at

---

## 3. Find Invitation API Routes

```bash
find apps/agency -path "*/api/invitations/*" -name "route.ts" 2>/dev/null
ls -laR apps/agency/app/api/invitations/ 2>/dev/null
```

**Expected Routes:**
- ✅/❌ POST /api/invitations (create invitation)
- ✅/❌ POST /api/invitations/[id]/resend (resend invitation email)
- ✅/❌ DELETE /api/invitations/[id] (cancel invitation)

**For each route, verify:**
- Role-based access control (agency_admin only)
- Request validation with Zod schema
- Database operations with RLS
- Error handling
- Response format

---

## 4. Find User Task Assignment API Routes

```bash
find apps/agency -path "*/api/users/*/tasks/*" -name "route.ts" 2>/dev/null
ls -la apps/agency/app/api/users/[id]/tasks/ 2>/dev/null
```

**Expected Routes:**
- ✅/❌ POST /api/users/[id]/tasks (assign/update tasks for user)
- ✅/❌ GET /api/users/[id]/tasks (get user's assigned tasks)

**Verify:**
- Audit logging on task assignment changes
- RLS enforcement
- Admin-only access

---

## 5. Locate Invitation Acceptance Page

```bash
find apps/shell -path "*/accept-invitation/*" -name "page.tsx" 2>/dev/null
ls -la apps/shell/app/accept-invitation/[token]/ 2>/dev/null
```

**Expected Page:**
- `/accept-invitation/[token]/page.tsx`

**Verify Features:**
- ✅/❌ Token validation (not expired, not used)
- ✅/❌ Signup form pre-filled with email
- ✅/❌ Fields: full_name, password, password_confirmation
- ✅/❌ Creates user with Supabase Auth
- ✅/❌ Marks invitation as used
- ✅/❌ Sets agency_id automatically
- ✅/❌ Sets role automatically
- ✅/❌ Creates user_task_assignments
- ✅/❌ Redirects to dashboard
- ✅/❌ Error handling for expired/invalid tokens

---

## 6. Locate User Management Pages

```bash
find apps/agency -path "*/users/*" -name "page.tsx" 2>/dev/null
ls -la apps/agency/app/users/ 2>/dev/null
ls -la apps/agency/app/users/[id]/ 2>/dev/null
```

**Expected Pages:**
- ✅/❌ `/users/page.tsx` (user list)
- ✅/❌ `/users/[id]/page.tsx` (user detail with task assignments)

**Verify User List Features:**
- Table showing all agency users
- Columns: name, email, role, status, assigned tasks count
- "Invite User" button (admin only)
- Pending invitations section
- Resend/Cancel invitation buttons

**Verify User Detail Features:**
- User profile display
- Task assignment checkboxes
- Pre-checked currently assigned tasks
- "Save Task Assignments" button
- Success/error messages

---

## 7. Find UI Components

```bash
find apps/agency -path "*/users/components/*" -type f 2>/dev/null
find packages/ui -path "*invitation*" -type f 2>/dev/null
```

**Expected Components:**
- ✅/❌ InviteUserModal.tsx (invitation form modal)
- ✅/❌ TaskAssignmentCheckboxes.tsx (task selection UI)
- ✅/❌ PendingInvitationsList.tsx (pending invitations table)
- ✅/❌ UserTasksList.tsx (display assigned tasks)

---

## 8. Check Email Templates

```bash
find apps/agency/emails -name "*invitation*" 2>/dev/null
ls -la apps/agency/emails/ 2>/dev/null
```

**Expected Email Template:**
- ✅/❌ `invitation.tsx` (React Email template)

**Verify Email Content:**
- Agency name
- Inviter name
- Secure invitation link
- Assigned tasks list
- Expiration notice (7 days)
- Professional styling

---

## 9. Find Email Sending Utilities

```bash
find packages/utils -name "*email*" 2>/dev/null
grep -r "sendInvitationEmail" packages/ --include="*.ts"
```

**Expected Utilities:**
- ✅/❌ `packages/utils/src/email-helpers.ts`
- ✅/❌ sendInvitationEmail() function
- ✅/❌ Resend API integration
- ✅/❌ Error handling and logging

---

## 10. Find Invitation Helper Utilities

```bash
find packages/utils -name "*invitation*" 2>/dev/null
grep -r "isInvitationExpired" packages/ --include="*.ts"
```

**Expected Utilities:**
- ✅/❌ `packages/utils/src/invitation-helpers.ts`
- ✅/❌ isInvitationExpired() function
- ✅/❌ Token generation utilities
- ✅/❌ Expiration calculation (7 days)

---

## 11. Check Validation Schemas

```bash
find packages/validations -name "*invitation*" 2>/dev/null
find packages/validations -name "*task*" 2>/dev/null
```

**Expected Schemas:**
- ✅/❌ `invitation.schema.ts`
- ✅/❌ InvitationCreateSchema (email, role, task_ids)
- ✅/❌ UserTaskAssignmentSchema (task_ids array)
- ✅/❌ Email format validation
- ✅/❌ Role enum validation ('agency_admin', 'agency_user')
- ✅/❌ UUID validation for task_ids

---

## 12. Locate Tests

```bash
# Invitation API tests
find apps/agency/app/api/invitations -name "*.test.ts" 2>/dev/null

# User task assignment API tests
find apps/agency/app/api/users -name "*.test.ts" 2>/dev/null | grep task

# Validation schema tests
find packages/validations -name "*invitation*.test.ts" 2>/dev/null

# Email helper tests
find packages/utils -name "*email*.test.ts" 2>/dev/null

# Invitation helper tests
find packages/utils -name "*invitation*.test.ts" 2>/dev/null
```

**Count Test Coverage:**
```bash
find . -name "*invitation*.test.ts" -o -name "*task*.test.ts" 2>/dev/null | \
  grep -v node_modules | xargs wc -l
```

**Count Individual Tests:**
```bash
find . -name "*invitation*.test.ts" -o -name "*task*.test.ts" 2>/dev/null | \
  grep -v node_modules | xargs grep -c "it(\|test("
```

---

## 13. Verify Type Definitions and Integrations

```bash
# Check for invitation types
grep -r "type Invitation\|interface Invitation" packages/ --include="*.ts"

# Check for task assignment types
grep -r "type UserTaskAssignment\|interface UserTaskAssignment" packages/ --include="*.ts"

# Count usage of invitation utilities
grep -r "sendInvitationEmail\|isInvitationExpired" apps/ --include="*.ts" --include="*.tsx" | \
  grep -v node_modules | grep -v test | wc -l
```

---

## 14. Check Audit Logging Implementation

```bash
# Find audit log triggers
grep -r "audit_log" supabase/migrations/ --include="*.sql"

# Find audit log API routes or utilities
find apps packages -name "*audit*" 2>/dev/null | grep -v node_modules

# Check audit log usage in task assignment
grep -r "audit_log" apps/agency/app/api/users --include="*.ts"
```

---

## 15. Verify RLS Policies

```bash
# Invitations RLS
grep -A 20 "invitations" supabase/migrations/001_agency_domain/*rls*.sql

# Master tasks RLS
grep -A 20 "master_tasks" supabase/migrations/001_agency_domain/*rls*.sql

# User task assignments RLS
grep -A 20 "user_task_assignments" supabase/migrations/001_agency_domain/*rls*.sql

# Audit log RLS
grep -A 20 "audit_log" supabase/migrations/001_agency_domain/*rls*.sql
```

---

## Investigation Checklist

For each area, determine: ✅ Complete | ⚠️ Partial | ❌ Missing

### Database Layer
- [ ] invitations table schema
- [ ] master_tasks table schema
- [ ] user_task_assignments table schema
- [ ] audit_log table schema
- [ ] RLS policies on all tables
- [ ] Foreign key constraints
- [ ] Indexes on commonly queried columns
- [ ] Trigger functions for audit logging
- [ ] Master tasks seeded (6 tasks)

### API Layer
- [ ] POST /api/invitations (create)
- [ ] POST /api/invitations/[id]/resend
- [ ] DELETE /api/invitations/[id]
- [ ] POST /api/users/[id]/tasks (assign tasks)
- [ ] GET /api/users/[id]/tasks (get tasks)

### Pages
- [ ] /accept-invitation/[token] (signup page)
- [ ] /users (user management list)
- [ ] /users/[id] (user detail with tasks)

### Components
- [ ] InviteUserModal
- [ ] TaskAssignmentCheckboxes
- [ ] PendingInvitationsList
- [ ] UserTasksList

### Email System
- [ ] invitation.tsx (React Email template)
- [ ] sendInvitationEmail() utility
- [ ] Resend API integration
- [ ] Email delivery tested

### Utilities
- [ ] isInvitationExpired() function
- [ ] Token generation utilities
- [ ] Expiration calculation (7 days)
- [ ] Email sending helpers

### Validation
- [ ] InvitationCreateSchema
- [ ] UserTaskAssignmentSchema
- [ ] Email validation
- [ ] Role enum validation
- [ ] UUID validation for task_ids

### Tests
- [ ] Invitation API route tests
- [ ] Task assignment API route tests
- [ ] Validation schema tests
- [ ] Email helper tests
- [ ] Invitation helper tests
- [ ] Audit logging tests
- [ ] Total lines: _____

### Audit Logging
- [ ] Audit log table
- [ ] Trigger for profile changes
- [ ] Trigger for task assignment changes
- [ ] Admin-only RLS policy
- [ ] Audit log UI/API (if applicable)

---

## Expected Acceptance Criteria

Verify these ACs from the story:

**AC #1: Email Invitation with Secure Link**
- [ ] Admin can invite user by email
- [ ] Invitation email sent via Resend
- [ ] Secure unique token generated
- [ ] Link format correct

**AC #2: 7-Day Expiration**
- [ ] Expiration calculated correctly (7 days)
- [ ] Expired invitations validated
- [ ] Error message for expired tokens

**AC #3: User Registration via Link**
- [ ] Signup form accessible via link
- [ ] User can complete registration
- [ ] Password requirements enforced

**AC #4: Automatic Agency Association**
- [ ] New user automatically assigned to agency
- [ ] Agency_id set from invitation
- [ ] Role set from invitation

**AC #5: Task Assignment During Invitation**
- [ ] Master task list available
- [ ] Checkbox UI for task selection
- [ ] Tasks assigned during invitation creation

**AC #6: Task List in Email**
- [ ] Email shows assigned tasks
- [ ] Task names displayed clearly
- [ ] Link includes task information

**AC #7: Modify Task Assignments**
- [ ] Admin can update user tasks
- [ ] Task assignment UI on user detail page
- [ ] Changes persist to database

**AC #8: Audit Logging**
- [ ] Profile changes logged
- [ ] Task assignment changes logged
- [ ] Log includes: who, what, when
- [ ] Admin can view audit logs

---

## Generate Investigation Report

After your investigation, create:

**File:** `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-2-2.md`

**Include:**
1. **Executive Summary** - Overall status, confidence level, MANIFEST accuracy
2. **Detailed Findings** - Evidence for each task with file paths and line numbers
3. **Missing Implementations** - What's not found
4. **Incomplete Implementations** - What's partial
5. **Test Coverage Analysis** - Lines of tests, scenarios covered
6. **MANIFEST Discrepancies** - Specific differences between claims and reality
7. **Security Assessment** - RLS policies, role checks, token security
8. **Email System Verification** - Template quality, delivery testing
9. **Audit Logging Verification** - Triggers, storage, access controls
10. **Recommendations** - Prioritized next steps
11. **Investigation Commands** - All commands used
12. **Conclusion** - Overall assessment

**Report Template:**
```markdown
# INVESTIGATION REPORT: Story 2-2-user-invitation-and-task-assignment-system

**Investigation Date:** {today}
**Investigator:** Claude Code Web
**Story Title:** User Invitation and Task Assignment System

## Executive Summary
- Overall Implementation Status: [Not Started / Partially Complete / Mostly Complete / Fully Complete]
- Confidence Level: [Low / Medium / High]
- MANIFEST Accuracy: [Accurate / Partially Accurate / Inaccurate / No MANIFEST Found]
- Completion Percentage: ____%

## Detailed Findings by Task

### Task 1: Create Database Schema for Invitations and Task Assignments
**MANIFEST Claims:** [status]
**Evidence Found:**
- File: [path]
- Lines: [count]
- Features: [list]
- Assessment: ✅/⚠️/❌

[Continue for all tasks...]

## Database Schema Verification

### Invitations Table
[Schema details, verification]

### Master Tasks Table
[Schema details, seed data verification]

### User Task Assignments Table
[Schema details, foreign keys]

### Audit Log Table
[Schema details, triggers]

## API Routes Verification

### POST /api/invitations
[Implementation details, security, validation]

[Continue for all routes...]

## Email System Verification

### invitation.tsx Template
[Template quality, content, styling]

### sendInvitationEmail() Function
[Implementation, error handling, Resend integration]

## Audit Logging Verification

### Trigger Functions
[Profile changes trigger, task assignment trigger]

### RLS Policies
[Admin-only access verification]

## Missing Implementations
[List what's expected but not found]

## Incomplete Implementations
[List what's partial]

## Test Coverage Analysis
- Invitation API Tests: ___ lines, ___ tests
- Task Assignment Tests: ___ lines, ___ tests
- Validation Tests: ___ lines, ___ tests
- Email Tests: ___ lines, ___ tests
- Total: ___ lines, ___ tests
- Coverage Assessment: [Thorough / Adequate / Sparse / None]

## MANIFEST Discrepancies
[Specific differences between MANIFEST and reality]

## Security Assessment

### RLS Policies
[Evaluation of security policies]

### Token Security
[UUID generation, expiration validation]

### Role-Based Access
[Admin-only operations verification]

## Recommendations
1. **Highest Priority:** [What to do first]
2. **Medium Priority:** [What to do next]
3. **Low Priority:** [Nice to have]

## Conclusion
[Summary and recommendation]
```

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
5. ✅ What's missing or incomplete?
6. ✅ Are all 8 acceptance criteria met?
7. ✅ Is the email system working?
8. ✅ Is audit logging implemented correctly?
9. ✅ What should be done next?

---

## Key Focus Areas for Story 2.2

### 🔒 Security Critical
- Token generation (must be cryptographically secure)
- Token expiration validation (7 days)
- RLS policies on invitations (agency isolation)
- Admin-only invitation creation
- Audit logging (who changed what, when)

### 📧 Email System Critical
- Email template quality (professional appearance)
- Resend API integration (working delivery)
- Task list display in email
- Link generation (correct format)
- Error handling for email failures

### 🗂️ Data Integrity Critical
- Foreign key constraints (CASCADE delete)
- Unique token constraint
- Invitation usage tracking (used_at field)
- Task assignment consistency
- Audit log completeness

### 🧪 Testing Critical
- Token expiration edge cases
- Email sending failure scenarios
- Concurrent invitation usage
- Task assignment updates with audit logging
- RLS policy enforcement

---

## Resources

**Story File:** `.bmad-ephemeral/stories/2-2-user-invitation-and-task-assignment-system.md`

**Previous Investigation Examples:**
- Story 1.3: `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-1-3.md`
- Story 2.1: `.bmad-ephemeral/stories/INVESTIGATION-REPORT-STORY-2-1.md`

**Pattern from Previous Stories:**
- Story 1.3: MANIFEST claimed 0%, actually 100% (critical discrepancy)
- Story 2.1: MANIFEST claimed 100%, actually 100% with 120 tests (undercount)
- Story 2.2: Apply same rigor!

---

🔍 **START YOUR INVESTIGATION NOW** - Be thorough, be systematic, find the truth!

Focus on:
1. Database schema completeness (4 tables + RLS)
2. API route implementation (5 routes)
3. Email system verification (template + delivery)
4. Audit logging (triggers + storage)
5. Test coverage (aim to find actual test count)
6. Security verification (tokens, RLS, role checks)
7. User experience (invitation flow, task assignment UI)

**Good luck, detective! 🕵️**
