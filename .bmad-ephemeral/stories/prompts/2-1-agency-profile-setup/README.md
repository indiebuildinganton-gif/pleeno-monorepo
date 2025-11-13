# Story 2-1: Agency Profile Setup - Implementation Guide

## Overview

**Story ID**: 2-1
**Title**: Agency Profile Setup
**Total Tasks**: 7
**Location**: `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/`

## Story Summary

As an Agency Admin, I want to configure my agency's profile with basic information, so that my agency identity is established in the system and my team knows which agency they're working in.

### Acceptance Criteria

1. Agency Admin can access settings page and edit agency information
2. Changes are saved to database with proper validation
3. Agency name appears in application header/navigation
4. All timestamps display in agency's configured timezone

---

## Generated Files

This workflow has generated 7 task-specific prompts plus this README:

1. **task-01-agency-validation-schema.md** - Create Zod schema for agency validation
2. **task-02-api-route-agency-updates.md** - Implement backend API for agency updates
3. **task-03-agency-settings-page.md** - Create frontend settings page with form
4. **task-04-display-agency-name-header.md** - Display agency name in application header
5. **task-05-timezone-date-formatting.md** - Implement timezone-aware date utilities
6. **task-06-role-based-access-control.md** - Add role-based access control
7. **task-07-write-tests.md** - Write comprehensive tests
8. **README.md** - This file (usage instructions)

---

## Usage Instructions

### Step 1: Open Claude Code Web

Navigate to [claude.ai/code](https://claude.ai/code) and start a new session.

### Step 2: Execute Task 1 (Creates Manifest)

1. Open `task-01-agency-validation-schema.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Claude will:
   - Create the manifest.md file
   - Implement the agency validation schema
   - Mark Task 1 as in progress in the manifest

### Step 3: Verify Manifest Creation

After Task 1 completes, check that the manifest file was created:
- Location: `.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`
- Task 1 should be marked "In Progress" or "Completed"

### Step 4: Execute Remaining Tasks Sequentially

For each subsequent task (2 through 7):

1. Open the next task prompt file
2. Copy entire contents
3. Paste into Claude Code Web
4. Claude will:
   - Update the manifest (mark previous task complete, current task in progress)
   - Implement the task requirements
   - Add implementation notes to manifest

**Important**: Execute tasks in order! Each task builds on the previous ones.

### Step 5: Track Progress

Throughout implementation, the manifest file will track:
- Task completion status
- Start/completion dates
- Implementation notes
- Files created
- Blockers/issues

---

## Manifest Tracking

### Manifest Location
`.bmad-ephemeral/stories/prompts/2-1-agency-profile-setup/manifest.md`

### How It Works

1. **Task 1 creates** the manifest with all 7 tasks listed
2. **Each subsequent task** updates the manifest:
   - Marks previous task as "Completed" with date
   - Marks current task as "In Progress" with date
   - Adds implementation notes
3. **Task 7 finalizes** the manifest and marks story complete

### Manifest Sections

- **Task Progress**: Status of each task
- **Implementation Notes**: Running notes from each task
- **Files Created**: List of all files created/modified
- **Blockers/Issues**: Any issues encountered during implementation

---

## Task Dependencies

```
Task 1: Agency Validation Schema
    ↓
Task 2: API Route (uses schema from Task 1)
    ↓
Task 3: Settings Page (uses API from Task 2, schema from Task 1)
    ↓
Task 4: Header Display (uses agency data from database)
    ↓
Task 5: Date Formatting (independent utility)
    ↓
Task 6: Access Control (protects Task 3 page)
    ↓
Task 7: Tests (validates all previous tasks)
```

**Critical**: Execute in order to maintain dependencies!

---

## Tips for Success

### 1. Sequential Execution
Execute tasks in order (1→2→3→4→5→6→7). Each task builds on previous work.

### 2. Manifest Updates
Always verify the manifest is updated after each task. This ensures progress tracking.

### 3. Reference Story Context
If you need more context, refer to:
- Story file: `.bmad-ephemeral/stories/2-1-agency-profile-setup.md`
- Context XML: `.bmad-ephemeral/stories/2-1-agency-profile-setup.context.xml`

### 4. Acceptance Criteria
All acceptance criteria are mapped to tasks:
- AC #1, #3: Tasks 1, 2, 3, 4, 6
- AC #2: Tasks 1, 2, 3
- AC #4: Task 5

### 5. Testing
Task 7 includes comprehensive tests. Don't skip it!

### 6. Break Between Tasks
Feel free to take breaks between tasks. The manifest tracks your progress.

---

## Expected Outcomes

After completing all 7 tasks, you will have:

### Files Created/Modified

**Packages (Shared)**:
- `packages/validations/src/agency.schema.ts` (Task 1)
- `packages/validations/src/agency.schema.test.ts` (Task 7)
- `packages/utils/src/date-helpers.ts` (Task 5)
- `packages/utils/src/date-helpers.test.ts` (Task 5)
- `packages/auth/src/utils/require-role.ts` (Task 6)

**Agency App (Frontend + API)**:
- `apps/agency/app/api/agencies/[id]/route.ts` (Task 2)
- `apps/agency/app/api/agencies/[id]/route.test.ts` (Task 7)
- `apps/agency/app/settings/page.tsx` (Task 3)

**Shell App (Root Layout)**:
- `apps/shell/app/layout.tsx` (Task 4 - updated)
- `apps/shell/app/components/Header.tsx` (Task 4)
- `apps/shell/app/components/Navigation.tsx` (Task 6)

**Tests**:
- `__tests__/e2e/agency-settings.spec.ts` (Task 7 - optional)

### Features Implemented

✅ Agency validation schema with Zod
✅ Backend API for updating agency profile
✅ Frontend settings page with form
✅ Agency name displayed in header
✅ Timezone-aware date formatting utilities
✅ Role-based access control (admin only)
✅ Comprehensive test suite

---

## Troubleshooting

### If a Task Fails

1. Review the error message from Claude
2. Check the manifest for notes from previous tasks
3. Verify all previous tasks completed successfully
4. Re-run the failing task with additional context

### If Manifest Not Created

Task 1 is responsible for creating the manifest. If it wasn't created:
1. Re-run Task 1
2. Explicitly ask Claude to create the manifest
3. Verify the output directory exists

### If Dependencies Missing

If you encounter missing dependencies (e.g., Zod, React Hook Form):
1. Check that Story 1.1 (Project Infrastructure) was completed
2. Run `npm install` to install dependencies
3. Verify `package.json` has all required packages

---

## Next Steps After Completion

Once all 7 tasks are complete:

1. ✅ **Mark story complete** in sprint status file
2. 🧪 **Run all tests**: `npm run test`
3. 🔍 **Manual testing**: Log in as admin and test the settings page
4. 📋 **Code review**: If working with a team, request code review
5. 🚀 **Move to next story**: Story 2.2 (User Invitation System)

---

## Story Context References

- **Story File**: `.bmad-ephemeral/stories/2-1-agency-profile-setup.md`
- **Context XML**: `.bmad-ephemeral/stories/2-1-agency-profile-setup.context.xml`
- **Epic**: Epic 2 - Agency & User Management
- **PRD**: `docs/PRD.md` (Data Centralization Foundation)
- **Architecture**: `docs/architecture.md` (Agency Domain)

---

## Need Help?

If you encounter issues during implementation:

1. **Check the manifest** for previous task notes
2. **Review the story context XML** for additional details
3. **Consult the architecture doc** for patterns and conventions
4. **Ask Claude for clarification** by providing the specific error/issue

---

**Good luck with your implementation!** 🚀

Remember: Execute tasks sequentially, update the manifest after each task, and verify all acceptance criteria are met before marking the story complete.
