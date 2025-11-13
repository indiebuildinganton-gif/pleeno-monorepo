# Story 6-4: Recent Activity Feed - Implementation Guide

## Overview

**Story ID**: 6-4
**Title**: Recent Activity Feed
**Status**: Ready for Implementation
**Total Tasks**: 8

This directory contains task-specific prompts for implementing the Recent Activity Feed feature in Claude Code Web.

## Generated Files

All prompts are located in: `docs/stories/prompts/6-4/`

1. ✅ [task-1-prompt.md](task-1-prompt.md) - Create Activity Log Database Schema (includes manifest creation)
2. ✅ [task-2-prompt.md](task-2-prompt.md) - Implement Activity Logging in Existing API Routes
3. ✅ [task-3-prompt.md](task-3-prompt.md) - Create Activity Feed API Route
4. ✅ [task-4-prompt.md](task-4-prompt.md) - Create ActivityFeed Component
5. ✅ [task-5-prompt.md](task-5-prompt.md) - Implement Auto-Refresh for Real-Time Feel
6. ✅ [task-6-prompt.md](task-6-prompt.md) - Make Activities Clickable
7. ✅ [task-7-prompt.md](task-7-prompt.md) - Integrate into Dashboard Page
8. ✅ [task-8-prompt.md](task-8-prompt.md) - Testing

## Usage Instructions

### Step 1: Open Claude Code Web
Navigate to [Claude Code Web](https://claude.ai/code) in your browser.

### Step 2: Start with Task 1
1. Open [task-1-prompt.md](task-1-prompt.md)
2. Copy the entire contents
3. Paste into Claude Code Web
4. Follow the instructions to implement the task

**IMPORTANT**: Task 1 includes instructions to create a `manifest.md` file that tracks progress through all 8 tasks.

### Step 3: Verify Manifest Creation
After completing Task 1, verify that `docs/stories/prompts/6-4/manifest.md` was created and contains all task entries.

### Step 4: Continue with Remaining Tasks
1. When Task 1 is complete, open [task-2-prompt.md](task-2-prompt.md)
2. Copy and paste into Claude Code Web
3. The prompt will instruct you to update the manifest
4. Repeat for Tasks 3-8 in sequential order

### Step 5: Track Progress
After completing each task:
- ✅ Update the manifest with completion date
- ✅ Add any implementation notes
- ✅ Mark the previous task as "Completed"
- ✅ Mark the current task as "In Progress"

### Step 6: Final Verification
After completing Task 8 (Testing):
- Review all acceptance criteria
- Ensure all tests pass
- Update story status in `.bmad-ephemeral/sprint-status.yaml`

## Manifest Tracking

The manifest file (`manifest.md`) will be created by Task 1 and includes:

- **Story metadata**: ID, title, status, dates
- **Task progress**: Status, start/completion dates, notes for each of 8 tasks
- **Implementation notes**: Running log of decisions and learnings

**Location**: `docs/stories/prompts/6-4/manifest.md` (created by Task 1)

Update the manifest after completing each task to maintain an accurate record.

## Task Dependencies

Tasks must be executed **in order** due to dependencies:

1. **Task 1** → Creates database schema
2. **Task 2** → Depends on Task 1 schema
3. **Task 3** → Depends on Task 2 logging infrastructure
4. **Task 4** → Depends on Task 3 API route
5. **Task 5** → Enhances Task 4 component
6. **Task 6** → Enhances Task 4 component
7. **Task 7** → Integrates Task 4 component (with Tasks 5-6 enhancements)
8. **Task 8** → Tests all previous tasks

**Do not skip tasks or execute out of order.**

## Story Context Reference

If you need additional context during implementation, refer to:
- **Story file**: `.bmad-ephemeral/stories/6-4-recent-activity-feed.md`
- **Story context**: `.bmad-ephemeral/stories/6-4-recent-activity-feed.context.xml`

Both files contain detailed acceptance criteria, technical notes, and implementation patterns.

## Tips for Success

### 1. Execute Tasks Sequentially
Each task builds on the previous one. Complete them in order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.

### 2. Update Manifest Frequently
Keep the manifest up-to-date after each task. This helps track progress and provides context for the next task.

### 3. Reference Story Context
If you encounter questions or need clarification:
- Check the task prompt first (includes key context)
- Reference the story context file for detailed information
- Review the story markdown for dev notes

### 4. Verify Each Task Before Moving On
Before starting the next task:
- ✅ Current task is fully complete
- ✅ Manifest is updated
- ✅ Any tests for this task pass
- ✅ No errors or warnings

### 5. Test Incrementally
Don't wait until Task 8 to test:
- Task 1: Test database migration
- Task 2: Test activity logging
- Task 3: Test API endpoint
- Task 4: Test component rendering
- Tasks 5-6: Test enhancements
- Task 7: Test integration
- Task 8: Comprehensive testing

### 6. Track All Acceptance Criteria
Each task maps to specific acceptance criteria (AC):
- Task 1: AC #1-8
- Task 2: AC #2-6
- Task 3: AC #1, 7-8
- Task 4: AC #1, 7-8
- Task 5: AC #1
- Task 6: AC #1
- Task 7: AC #1
- Task 8: All AC

Ensure all criteria are met by the end.

## Common Issues & Solutions

### Issue: Can't find story context file
**Solution**: The story context is at `.bmad-ephemeral/stories/6-4-recent-activity-feed.context.xml`

### Issue: Manifest not created after Task 1
**Solution**: Review Task 1 prompt instructions carefully. The manifest template is provided in the prompt.

### Issue: Task depends on previous work
**Solution**: Ensure the previous task is fully complete before moving to the next task.

### Issue: RLS policies blocking queries
**Solution**: Verify you're using server-side Supabase client with JWT auth, not anon key.

### Issue: Activities not appearing in feed
**Solution**:
1. Check that Task 2 activity logging is integrated
2. Verify API route (Task 3) is returning data
3. Ensure component (Task 4) is rendering correctly

## Success Criteria

Story 6-4 is complete when:

✅ All 8 tasks completed
✅ Database schema created with RLS policies
✅ Activity logging integrated into 5+ API routes
✅ Activity Feed API route working and cached
✅ ActivityFeed component displaying activities
✅ Auto-refresh working every 60 seconds
✅ Activities clickable with correct navigation
✅ Component integrated into dashboard page
✅ Comprehensive tests written and passing
✅ All acceptance criteria met (AC #1-8)
✅ Manifest fully updated with completion notes

## Getting Help

If you encounter issues:

1. **Review the task prompt** - Most questions are answered in the prompt
2. **Check the story context** - Detailed implementation notes available
3. **Refer to previous stories** - Story 6-3 has similar patterns
4. **Check architecture docs** - `docs/architecture.md` for patterns

## Next Steps After Completion

Once Story 6-4 is complete:

1. Update sprint status: Mark story as DONE in `.bmad-ephemeral/sprint-status.yaml`
2. Run full test suite: Ensure no regressions
3. Deploy to staging: Test in a real environment
4. Demo the feature: Show the team your work!
5. Document learnings: Add notes to the story file

---

**Good luck with your implementation, anton!** 🚀

Each prompt is designed to be self-contained with all necessary context. Follow them sequentially, update the manifest regularly, and you'll have a fully functional Activity Feed by the end.
