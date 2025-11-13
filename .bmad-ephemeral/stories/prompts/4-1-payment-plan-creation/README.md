# Story 4.1: Payment Plan Creation - Task Prompts

This directory contains task-specific development prompts for implementing Story 4.1: Payment Plan Creation.

## 📋 Overview

**Story**: As an Agency User, I want to create a payment plan for a student's enrollment, so that I can track the total amount owed, installment schedule, and expected commission.

**Epic**: 4 - Payment Plan Engine

**Status**: ready-for-dev

## 📁 Files in This Directory

- **MANIFEST.md**: Task execution tracking and progress monitoring
- **README.md**: This file - usage instructions
- **task-01-database-schema.md**: Database schema implementation
- **task-02-commission-calculation.md**: Commission calculation function
- **task-03-api-routes.md**: Payment plan API routes
- **task-04-payment-plan-form.md**: Payment plan form component
- **task-05-commission-preview.md**: Real-time commission preview
- **task-06-creation-mutation.md**: Payment plan creation mutation
- **task-07-enrollment-dropdown.md**: Enrollment dropdown component
- **task-08-status-enum.md**: Payment plan status enum
- **task-09-audit-logging.md**: Audit logging
- **task-10-testing.md**: Comprehensive testing

## 🚀 How to Use These Prompts

### For Sequential Execution in Claude Code Web

1. **Open Claude Code Web** in your browser

2. **Start with Task 1**: Copy the entire contents of `task-01-database-schema.md`

3. **Paste into Claude Code Web** and press Enter

4. **Wait for completion**: Claude will implement the task, create files, and run tests

5. **Update MANIFEST.md**: Mark Task 1 as completed and add any notes

6. **Move to Task 2**: Repeat steps 2-5 for each subsequent task

7. **Follow execution order**: See MANIFEST.md for recommended execution phases

### For Parallel Execution (Advanced)

Some tasks can be executed in parallel if you have multiple Claude Code sessions:

**Phase 1**: Tasks 1, 8 (parallel)
**Phase 2**: Tasks 2, 3 (sequential after Phase 1)
**Phase 3**: Tasks 5, 7 (parallel after Phase 2)
**Phase 4**: Tasks 4, 6 (sequential after Phase 3)
**Phase 5**: Tasks 9, 10 (sequential after Phase 4)

## 📊 Tracking Progress

Use **MANIFEST.md** to track your progress:

- Update task status as you complete each task
- Add notes about implementation decisions or issues
- Track files created/modified
- Monitor overall progress

Status values:
- ⏳ Not Started
- 🔄 In Progress
- ✅ Completed
- ⛔ Blocked
- ⚠️ Issues/Concerns

## 🔗 Related Files

- **Story File**: [../../4-1-payment-plan-creation.md](../../4-1-payment-plan-creation.md)
- **Context File**: [../../4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml)
- **Epic Document**: [../../../docs/epics.md](../../../docs/epics.md)
- **Architecture**: [../../../docs/architecture.md](../../../docs/architecture.md)
- **PRD**: [../../../docs/PRD.md](../../../docs/PRD.md)

## 🎯 Success Criteria

Story 4.1 is complete when:

1. ✅ Payment plans table created with RLS policies
2. ✅ Commission calculation function implemented (database + TypeScript)
3. ✅ API routes for payment plan creation and detail
4. ✅ Payment plan creation form with enrollment selection
5. ✅ Real-time commission preview
6. ✅ TanStack Query mutation for creation
7. ✅ Enrollment dropdown with search
8. ✅ Status enum with badge component
9. ✅ Audit logging for all operations
10. ✅ Comprehensive test coverage (80%+)

## 💡 Tips

- **Read the context file first**: [4-1-payment-plan-creation.context.xml](../../4-1-payment-plan-creation.context.xml) contains all requirements, constraints, and dependencies
- **Check dependencies**: Each task prompt lists what it depends on
- **Run tests frequently**: Catch issues early
- **Update MANIFEST.md**: Keep track of your progress
- **Ask questions**: If something is unclear, check the story file or PRD

## 🐛 Troubleshooting

- **Task blocked?**: Check MANIFEST.md for dependencies
- **Tests failing?**: Review the testing checklist in each task prompt
- **RLS issues?**: Verify agency_id is set correctly in all queries
- **Commission calculation wrong?**: Ensure database trigger and TypeScript utility match

## 📝 Notes

- Each task is designed to be self-contained and executable independently
- Code examples are provided in each task prompt
- Testing checklists ensure comprehensive coverage
- Follow the execution order in MANIFEST.md for best results

---

**Generated**: 2025-11-13
**Generator**: BMAD Execute Dev Story Workflow
**Story ID**: 4.1
