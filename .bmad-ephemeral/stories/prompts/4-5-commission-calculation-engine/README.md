# Story 4.5: Commission Calculation Engine - Implementation Guide

## Overview

**Story ID**: 4.5
**Story Title**: Commission Calculation Engine
**Status**: Ready for Implementation
**Total Tasks**: 12

This directory contains task-specific implementation prompts for Story 4.5. Each prompt is self-contained and designed for sequential execution in Claude Code Web.

## Generated Files

### Task Prompts
- `task-1-prompt.md` - Draft Installment Calculation Logic (includes manifest creation)
- `task-2-prompt.md` - Payment Plan Wizard Draft Review Step
- `task-3-prompt.md` - Earned Commission Calculation Utility
- `task-4-prompt.md` - Update Payment Recording to Recalculate Commission
- `task-5-prompt.md` - Payment Plan Detail Commission Display
- `task-6-prompt.md` - Commission by College/Branch Report API
- `task-7-prompt.md` - Commission by College/Branch Report Page
- `task-8-prompt.md` - Dashboard Commission Summary Widget
- `task-9-prompt.md` - Non-Commissionable Fees Handling
- `task-10-prompt.md` - Database View for Real-Time Commission Calculation (Optional)
- `task-11-prompt.md` - Testing
- `task-12-prompt.md` - Migration and Data Seeding

### Supporting Files
- `README.md` - This file (usage instructions)
- `MANIFEST.md` - Progress tracking (created by Task 1)

## Story Context

### User Story
**As a** Agency User
**I want** commissions to be automatically calculated based on actual payments received
**So that** I know exactly how much commission I'm entitled to claim from each college

### Key Features
1. **Draft Installment Calculation**: Auto-calculate installment amounts and due dates with manual adjustment capability
2. **Earned Commission Tracking**: Real-time commission calculation based on actual payments
3. **Per-Plan Commission Display**: Show expected, earned, and outstanding commission with progress bar
4. **College/Branch Aggregation**: Report commission breakdown by institution
5. **Dashboard Widget**: High-level commission overview on agency dashboard
6. **Non-Commissionable Fees**: Exclude materials and admin fees from commission calculations

### Architecture Highlights
- **Multi-zone**: Utilities in packages/utils, UI in respective zones (payments, reports, dashboard)
- **Performance**: Cached earned_commission field with optional database view for audit
- **Real-time Updates**: TanStack Query invalidation triggers UI refresh on payment recording
- **RLS**: Agency-level data isolation via Supabase Row-Level Security

## Usage Instructions

### Prerequisites
- Claude Code Web access
- Project codebase cloned and accessible
- Story context file: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`

### Step-by-Step Execution

#### 1. Start with Task 1
- Open Claude Code Web
- Copy contents of `task-1-prompt.md`
- Paste into Claude Code Web
- Follow the prompt instructions

**Important**: Task 1 creates the `MANIFEST.md` file that tracks progress across all tasks.

#### 2. Verify Manifest Creation
After Task 1 completes:
- Check that `MANIFEST.md` exists in this directory
- Verify Task 1 is marked as "In Progress"
- Update Task 1 status to "Completed" when done

#### 3. Continue with Remaining Tasks
For Tasks 2-12:
- Open the next task prompt file (e.g., `task-2-prompt.md`)
- Copy contents into Claude Code Web
- Each prompt includes:
  - Task description and acceptance criteria
  - Implementation steps
  - Testing requirements
  - Manifest update instructions
- Follow the prompt sequentially
- Update manifest after each task completion

#### 4. Track Progress
The manifest (`MANIFEST.md`) provides:
- Task status tracking (Not Started, In Progress, Completed)
- Start and completion dates for each task
- Implementation notes
- Files created/modified list

Update the manifest after each task to maintain accurate progress tracking.

### Execution Order

⚠️ **IMPORTANT**: Execute tasks in order. Many tasks depend on previous implementations.

**Task Dependencies**:
- Task 1 → Task 2 (installment calculation used by wizard)
- Task 3 → Task 4 (commission calculation used by payment recording)
- Task 4 → Task 5 (payment recording triggers commission display update)
- Task 6 → Task 7 (API provides data for report page)
- Tasks 1-9 → Task 11 (testing requires all implementations)
- Tasks 1-11 → Task 12 (migration finalizes all database changes)

### Optional Task

**Task 10** (Database View) is optional:
- System works without it using cached field approach
- Useful for audit/reconciliation scenarios
- Can be skipped if performance is not a concern
- Can be implemented later if needed

## Context References

### Full Story Context
- **Location**: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.context.xml`
- Contains: Acceptance criteria, interfaces, dependencies, constraints, testing ideas

### Related Stories
- **Story 4.1**: Payment Plan Schema (foundation)
- **Story 4.2**: Flexible Installment Structure (installments table)
- **Story 4.3**: Payment Plan Creation Workflow (wizard structure)
- **Story 4.4**: Manual Payment Recording (payment API, extends in Task 4)

### Documentation References
- **Epic 4**: Payment Plan Engine (docs/epics.md, lines 804-843)
- **Architecture**: Commission calculation patterns (docs/architecture.md)
- **PRD**: Commission requirements (docs/PRD.md, FR-5.4, FR-7.4)

## Tips for Success

### 1. Read Each Prompt Completely
- Each prompt is comprehensive and self-contained
- Includes implementation patterns, code examples, and testing requirements
- Don't skip the "Context & Constraints" sections

### 2. Follow the Implementation Steps
- Steps are ordered logically
- Code examples follow project patterns
- Testing requirements ensure quality

### 3. Update the Manifest
- Mark tasks complete as you finish them
- Add implementation notes (files created, decisions made)
- Track issues or deviations from plan

### 4. Test Incrementally
- Run unit tests after Tasks 1, 3
- Run integration tests after Tasks 4, 6
- Run E2E tests after Task 11
- Don't wait until the end to test

### 5. Use the Story Context
- Reference the context XML when you need more detail
- Contains full acceptance criteria and constraints
- Includes interface definitions and dependencies

### 6. Ask for Clarification
- If a prompt is unclear, ask Claude Code
- Reference the story context file for more information
- Check related stories for patterns to follow

## Key Files to Create/Modify

### New Files
- `packages/utils/src/commission-calculator.ts`
- `apps/payments/app/plans/new/components/DraftInstallmentsReview.tsx`
- `apps/payments/app/plans/[id]/components/CommissionSummary.tsx`
- `apps/reports/app/api/commission-by-college/route.ts`
- `apps/reports/app/commissions/by-college/page.tsx`
- `apps/dashboard/app/api/commission-summary/route.ts`
- `apps/dashboard/app/components/CommissionSummaryWidget.tsx`
- `supabase/migrations/003_payments_domain/007_commission_calculations.sql`

### Modified Files
- `apps/payments/app/api/installments/[id]/record-payment/route.ts` (extend from 4.4)
- `apps/payments/app/plans/new/components/PaymentPlanWizard.tsx` (add draft review)
- `apps/payments/app/plans/[id]/components/PaymentPlanDetail.tsx` (add commission display)
- `apps/payments/app/plans/[id]/components/InstallmentsList.tsx` (add commission column)
- `apps/payments/app/plans/[id]/hooks/useRecordPayment.ts` (query invalidation)

## Testing Strategy

### Unit Tests (Task 1, 3)
- `packages/utils/src/__tests__/commission-calculator.test.ts`
- Test calculation logic with edge cases
- Target: 90%+ coverage for utilities

### Integration Tests (Tasks 4, 6, 11)
- `apps/payments/__tests__/api/commission-recalculation.test.ts`
- `apps/reports/__tests__/api/commission-by-college.test.ts`
- Test API routes with test database
- Target: 80%+ coverage for APIs

### E2E Tests (Task 11)
- `__tests__/e2e/payment-plan-creation.spec.ts`
- `__tests__/e2e/commission-updates.spec.ts`
- Test critical user workflows
- Verify real-time updates work

### Performance Tests (Task 11)
- Commission queries < 200ms
- Reports < 500ms
- Benchmark cached vs view approach (Task 10)

## Deployment Checklist

### Pre-Deployment
- [ ] All tasks completed (1-12)
- [ ] All tests passing (unit, integration, E2E)
- [ ] Migration tested on local and staging
- [ ] Performance benchmarks meet targets
- [ ] Code review completed

### Deployment
- [ ] Run Task 12 migration on production
- [ ] Verify backfill completed successfully
- [ ] Run smoke tests on production
- [ ] Monitor error logs

### Post-Deployment
- [ ] Verify commission calculations accurate
- [ ] Test payment recording → commission update flow
- [ ] Check dashboard widget displays correctly
- [ ] Test commission report with filters
- [ ] Update story status to "Completed"

## Support

### Questions or Issues?
- Reference the story context XML for detailed requirements
- Check related stories (4.1-4.4) for implementation patterns
- Review architecture docs for system design decisions

### Story Status
- **Current**: Ready for Implementation
- **On Completion**: Mark as "Completed" in MANIFEST.md
- **Location**: `.bmad-ephemeral/stories/4-5-commission-calculation-engine.md`

---

## Quick Start

```bash
# 1. Open Claude Code Web
# 2. Copy task-1-prompt.md
# 3. Paste and execute
# 4. Verify MANIFEST.md created
# 5. Continue with task-2-prompt.md
# 6. Repeat until task-12-prompt.md complete
# 7. Celebrate! 🎉
```

Good luck with your implementation! 🚀
