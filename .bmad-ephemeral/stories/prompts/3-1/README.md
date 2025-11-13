# Story 3-1: College Registry - Implementation Guide

## Overview

**Story ID**: 3-1
**Title**: College Registry
**Total Tasks**: 21
**Location**: `.bmad-ephemeral/stories/prompts/3-1/`

This directory contains 21 sequential task prompts for implementing the College Registry feature in Claude Code Web.

---

## What You're Building

The College Registry is a comprehensive feature for managing:
- **Colleges**: Name, city, commission rates, GST status
- **Branches**: Multiple locations per college with branch-specific commission rates
- **Contacts**: Contact information for each college
- **Notes**: Collaborative notes on colleges (up to 2000 characters)
- **Activity Feed**: Audit trail of all changes with time filtering and search

**Architecture**:
- Database: 4 new tables in entities_domain (colleges, branches, college_contacts, college_notes)
- Backend: 6 API endpoint groups
- Frontend: College list page, detail page, and 5 interactive components
- Security: Row-Level Security (RLS) with admin-only modifications

---

## Generated Files

### Task Prompts
All prompts are sequential and build on each other:

1. `task-1-prompt.md` - Create colleges database schema (includes manifest creation)
2. `task-2-prompt.md` - Create branches schema
3. `task-3-prompt.md` - Create college contacts schema
4. `task-4-prompt.md` - Create college notes schema
5. `task-5-prompt.md` - Create activity feed infrastructure
6. `task-6-prompt.md` - Implement colleges API endpoints (GET/POST)
7. `task-7-prompt.md` - Implement college detail API (GET/PATCH/DELETE)
8. `task-8-prompt.md` - Implement branches API endpoints
9. `task-9-prompt.md` - Implement contacts API endpoints
10. `task-10-prompt.md` - Implement notes API endpoints
11. `task-11-prompt.md` - Implement activity API endpoint
12. `task-12-prompt.md` - Create college list page (Frontend begins)
13. `task-13-prompt.md` - Create college detail page
14. `task-14-prompt.md` - Create college form component
15. `task-15-prompt.md` - Create branch form component
16. `task-16-prompt.md` - Create contact form component
17. `task-17-prompt.md` - Create activity feed component
18. `task-18-prompt.md` - Create notes section component
19. `task-19-prompt.md` - Create validation schemas
20. `task-20-prompt.md` - Add admin permission checks
21. `task-21-prompt.md` - Write comprehensive tests (FINAL TASK)

### Manifest File
- `manifest.md` - Created by Task 1, tracks progress through all 21 tasks

---

## How to Use These Prompts

### Step 1: Open Claude Code Web
Navigate to [Claude Code Web](https://claude.ai/code) in your browser.

### Step 2: Start with Task 1
1. Open `task-1-prompt.md`
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the instructions to:
   - Create the manifest file
   - Implement the colleges database schema
   - Update the manifest when complete

### Step 3: Verify Manifest Creation
After Task 1, verify that `manifest.md` exists in this directory and shows Task 1 as completed.

### Step 4: Continue Sequentially
1. Open `task-2-prompt.md`
2. Copy and paste into Claude Code Web
3. Follow instructions to:
   - Update manifest (mark previous task complete, current task in progress)
   - Implement the task
   - Update manifest when complete
4. Repeat for all 21 tasks

### Step 5: Track Your Progress
The manifest file (`manifest.md`) shows:
- Status of each task (Not Started, In Progress, Completed)
- Start and completion dates
- Implementation notes
- Overall story progress

---

## Important Notes

### Task Dependencies
Tasks must be completed **in order** because:
- Later tasks depend on earlier database schemas
- API endpoints depend on database tables
- Frontend components depend on API endpoints
- Tests depend on all implementations

### Manifest Updates
**Critical**: Update the manifest after each task:
1. Mark previous task as "Completed" with date
2. Mark current task as "In Progress" with date
3. Add any relevant notes about challenges or decisions

### Context Reference
If you need more context during implementation:
- Full story file: `.bmad-ephemeral/stories/3-1-college-registry.md`
- Story context XML: `.bmad-ephemeral/stories/3-1-college-registry.context.xml`
- Architecture docs: `docs/architecture.md`
- PRD: `docs/PRD.md`

### Acceptance Criteria
All 19 acceptance criteria are addressed across the 21 tasks:
- AC 1-4: College management (Tasks 1, 6-7, 12-14)
- AC 5-8: Branch management (Tasks 2, 8, 15)
- AC 9-13: Contact management (Tasks 3, 9, 16)
- AC 14-16: Activity feed (Tasks 5, 11, 17)
- AC 17-19: Notes section (Tasks 4, 10, 18)

---

## Task Breakdown by Phase

### Phase 1: Database (Tasks 1-5)
Set up all database schemas, triggers, and functions.
- Colleges table with RLS
- Branches table with commission inheritance trigger
- College contacts with audit logging
- College notes with character limit
- Activity feed query function

### Phase 2: Backend API (Tasks 6-11)
Implement all REST API endpoints.
- Colleges CRUD
- Branches CRUD
- Contacts CRUD
- Notes CRUD
- Activity feed with filtering

### Phase 3: Frontend UI (Tasks 12-18)
Build all pages and components.
- College list page (Server Component)
- College detail page (Server Component)
- Forms (Client Components with React Hook Form)
- Activity feed (Client Component with filters)
- Notes section (Client Component with counter)

### Phase 4: Infrastructure (Tasks 19-21)
Add validation, permissions, and tests.
- Zod schemas for all forms
- Admin permission utilities
- Comprehensive test suite

---

## Success Criteria

The story is complete when:
- ✅ All 21 tasks marked as completed in manifest
- ✅ All database migrations run successfully
- ✅ All API endpoints working
- ✅ All frontend pages and components functional
- ✅ All tests passing (unit, integration, E2E)
- ✅ Admin permissions enforced
- ✅ RLS policies protecting data
- ✅ Audit logging working

---

## Tips for Success

### 1. Work in Order
Don't skip ahead. Each task builds on previous ones.

### 2. Keep Manifest Updated
This helps you track progress and remember where you left off.

### 3. Test as You Go
Don't wait until Task 21 to test. Verify each task works before moving on.

### 4. Read the Full Prompt
Each prompt includes:
- Subtasks to complete
- Code examples
- Success criteria
- What to do next

### 5. Reference Context Files
The story context XML has all the details you need.

### 6. Ask for Help
If stuck, refer back to architecture docs or ask Claude Code Web to explain the context.

---

## Estimated Time

Based on complexity:
- **Database Tasks (1-5)**: ~2-3 hours
- **API Tasks (6-11)**: ~3-4 hours
- **Frontend Tasks (12-18)**: ~4-5 hours
- **Infrastructure Tasks (19-21)**: ~2-3 hours

**Total**: ~11-15 hours of focused development

---

## What Happens After Completion

Once all 21 tasks are done:

1. **Update Story Status**: Change `.bmad-ephemeral/stories/3-1-college-registry.md` status to "done"

2. **Update Sprint Status**: Mark Story 3.1 as "DONE" in your sprint status file

3. **Run Full Test Suite**: Ensure all tests pass
   ```bash
   npm test
   npm run test:e2e
   ```

4. **Deploy**: Follow your deployment process to push to staging/production

5. **Move to Next Story**: Story 3.2 (Student Registry) or next priority story

---

## Getting Help

If you encounter issues:

1. **Check the manifest**: Are all previous tasks completed?
2. **Review the story context**: `.bmad-ephemeral/stories/3-1-college-registry.context.xml`
3. **Check architecture docs**: `docs/architecture.md`
4. **Review similar implementations**: Look at Epic 2 stories for patterns
5. **Ask Claude Code Web**: Paste the relevant context and ask specific questions

---

## File Locations

All generated files should go to:
- Database: `supabase/migrations/002_entities_domain/`
- API: `apps/entities/app/api/`
- Pages: `apps/entities/app/colleges/`
- Components: `apps/entities/app/colleges/components/`
- Schemas: `packages/validations/src/`
- Utils: `packages/utils/src/`
- Tests: `apps/entities/__tests__/`

---

## Quick Start Checklist

- [ ] Read this README completely
- [ ] Open Claude Code Web
- [ ] Copy task-1-prompt.md
- [ ] Paste into Claude Code Web
- [ ] Create manifest.md as instructed
- [ ] Complete Task 1
- [ ] Update manifest
- [ ] Move to Task 2
- [ ] Repeat for all 21 tasks
- [ ] Celebrate completion! 🎉

---

**Good luck with your implementation!**

For questions or issues with the workflow itself, refer to:
- Workflow config: `.bmad/bmm/workflows/execute-dev-story-claude-code-web/workflow.yaml`
- Workflow instructions: `.bmad/bmm/workflows/execute-dev-story-claude-code-web/instructions.md`
