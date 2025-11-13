# Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking

## Execution Manifest

**Story Status:** ready-for-dev
**Generated:** 2025-11-13

---

## Task Execution Sequence

Execute these prompts **sequentially** in Claude Code Web. Mark each task as complete before moving to the next.

| # | Task | Prompt File | Status | Notes |
|---|------|-------------|--------|-------|
| 1 | Create Reports Zone Foundation | [task-1-prompt.md](./task-1-prompt.md) | ⬜ Not Started | AC: #1 |
| 2 | Create Report Builder UI | [task-2-prompt.md](./task-2-prompt.md) | ⬜ Not Started | AC: #1, #2, #8 |
| 3 | Create Payment Plans Report API Route | [task-3-prompt.md](./task-3-prompt.md) | ⬜ Not Started | AC: #1, #3, #4, #6, #7, #8, #9 |
| 4 | Create Report Results Table Component | [task-4-prompt.md](./task-4-prompt.md) | ⬜ Not Started | AC: #3, #4, #9 |
| 5 | Integrate Report Builder and Results | [task-5-prompt.md](./task-5-prompt.md) | ⬜ Not Started | AC: #1, #3, #5 |
| 6 | Add Contract Expiration Quick Filters | [task-6-prompt.md](./task-6-prompt.md) | ⬜ Not Started | AC: #8 |
| 7 | Create Colleges/Branches/Students Lookup APIs | [task-7-prompt.md](./task-7-prompt.md) | ⬜ Not Started | AC: #1 |
| 8 | Testing | [task-8-prompt.md](./task-8-prompt.md) | ⬜ Not Started | AC: All |
| 9 | Add Responsive Design and Accessibility | [task-9-prompt.md](./task-9-prompt.md) | ⬜ Not Started | AC: #3 |

---

## Usage Instructions

1. **Open Claude Code Web** in your browser
2. **Copy-paste each prompt** from the task files above in order (1 → 9)
3. **Wait for completion** before moving to the next task
4. **Mark tasks complete** (change ⬜ to ✅) as you finish them
5. **Add notes** in the Notes column for any issues or deviations

---

## Story Context Reference

Full story context: `.bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.context.xml`

Story markdown: `.bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.md`

---

## Acceptance Criteria Checklist

- [ ] AC #1: Filter by date range, college/branch, student, payment status, contract expiration date
- [ ] AC #2: Select which columns to include in the report
- [ ] AC #3: Report displays in a table with sorting and pagination
- [ ] AC #4: Report shows summary totals at the bottom (total amount, total paid, total commission)
- [ ] AC #5: Preview the report before exporting
- [ ] AC #6: Report respects RLS and only shows agency's data
- [ ] AC #7: Report includes contract expiration dates for each college/branch
- [ ] AC #8: Filter to show only contracts expiring within a specified date range (e.g., next 30/60/90 days)
- [ ] AC #9: Contracts nearing expiration are highlighted in the report
