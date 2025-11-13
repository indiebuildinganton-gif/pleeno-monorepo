# Student Registry Story - Task Prompts

This directory contains **17 individual task prompts** for implementing Story 3.2: Student Registry.

## 📋 What's Inside

Each task prompt file includes:
- **Context**: Story and acceptance criteria coverage
- **Task Description**: What needs to be built
- **Subtasks**: Step-by-step breakdown
- **Technical Requirements**: Files, locations, patterns
- **Constraints**: Rules and limitations
- **Reference Files**: Links to architecture, PRD, story context
- **Definition of Done**: Checklist to verify completion

## 🚀 How to Use

### Option 1: Sequential Execution (Recommended)
1. Open **[MANIFEST.md](MANIFEST.md)** - your progress tracker
2. Start with **Task 1** (Database Schema)
3. Copy the task prompt content into Claude Code Web
4. Let Claude Code implement the task
5. Mark complete in MANIFEST.md
6. Move to next task

### Option 2: Parallel Execution (Advanced)
- Tasks 2-7 (APIs) can run in parallel after Task 1 completes
- Tasks 8-15 (UI) can run in parallel after their API dependencies complete
- Task 16 (Audit Logging) can run anytime
- Task 17 (Testing) must run last

## 📦 Task List

| # | Task | Dependencies |
|---|------|--------------|
| 1 | Database Schema | None (start here) |
| 2 | Student API Routes | Task 1 |
| 3 | Student Notes API | Task 1 |
| 4 | Student Documents API | Task 1 |
| 5 | Activity Feed API | Task 1 |
| 6 | CSV Import/Export API | Tasks 1, 2 |
| 7 | AI Extraction API | Tasks 1, 2 |
| 8 | Student List UI | Task 2 |
| 9 | Student Form | Task 2 |
| 10 | Student Detail Page | Task 2 |
| 11 | Notes Section UI | Tasks 3, 10 |
| 12 | Activity Feed UI | Tasks 5, 10 |
| 13 | CSV Import Wizard UI | Task 6 |
| 14 | Document Viewer | Tasks 4, 10 |
| 15 | AI Extraction Wizard | Task 7 |
| 16 | Audit Logging | None (anytime) |
| 17 | Testing | All tasks (run last) |

## 🎯 Quick Start Example

### Step 1: Open Task 1
```bash
cat task-01-database-schema.md
```

### Step 2: Copy to Claude Code Web
Copy the entire content of the task file.

### Step 3: Paste and Execute
Paste into Claude Code Web and let it implement the database schema.

### Step 4: Verify
Check the Definition of Done checklist in the task file.

### Step 5: Mark Complete
Update MANIFEST.md status from ⏳ to ✅

### Step 6: Next Task
Move to task-02-student-api.md

## 📊 Progress Tracking

Use **[MANIFEST.md](MANIFEST.md)** to track:
- Task completion status
- Notes and blockers
- Overall progress
- Dependencies

## 🔗 Reference Files

All tasks reference these key documents:
- **Story File**: `.bmad-ephemeral/stories/3-2-student-registry.md`
- **Story Context**: `.bmad-ephemeral/stories/3-2-student-registry.context.xml`
- **Architecture**: `docs/architecture.md`
- **PRD**: `docs/PRD.md`
- **Epics**: `docs/epics.md`

## 💡 Tips

1. **Start with Task 1** - It's the foundation for everything else
2. **Read the full task** before starting implementation
3. **Check Definition of Done** before marking complete
4. **Update MANIFEST.md** regularly to track progress
5. **Note any issues** in the MANIFEST Notes column
6. **Follow the recommended order** unless you have a good reason not to

## 🏁 When Complete

After all 17 tasks are done:
1. Update story status to "completed" in `.bmad-ephemeral/stories/3-2-student-registry.md`
2. Run Task 17 (Testing) to verify everything works
3. Review MANIFEST.md for any outstanding issues
4. Move to next story (if any)

---

**Generated**: 2025-11-13
**Workflow**: execute-dev-story-claude-code-web
**Story**: 3.2 - Student Registry
**Epic**: 3 - Entities Domain
