# Story 7.1: Payment Plans Report Generator - Execution Prompts

Generated: 2025-11-13

## Overview

This directory contains **9 task-specific prompts** for Story 7.1: Payment Plans Report Generator with Contract Expiration Tracking.

Each prompt is designed to be **copy-pasted directly into Claude Code Web** for sequential execution.

---

## Quick Start

1. **Open the manifest:** [manifest.md](./manifest.md)
2. **Execute prompts in order:** Task 1 → Task 2 → ... → Task 9
3. **Mark tasks complete** as you finish them
4. **Track progress** in the manifest

---

## Task Files

| # | Task | File | Focus |
|---|------|------|-------|
| 1 | Create Reports Zone Foundation | [task-1-prompt.md](./task-1-prompt.md) | Zone setup, routing |
| 2 | Create Report Builder UI | [task-2-prompt.md](./task-2-prompt.md) | Filter form, validation |
| 3 | Create Payment Plans Report API Route | [task-3-prompt.md](./task-3-prompt.md) | Backend API, database |
| 4 | Create Report Results Table Component | [task-4-prompt.md](./task-4-prompt.md) | Table, highlighting |
| 5 | Integrate Report Builder and Results | [task-5-prompt.md](./task-5-prompt.md) | Page integration |
| 6 | Add Contract Expiration Quick Filters | [task-6-prompt.md](./task-6-prompt.md) | Preset buttons |
| 7 | Create Colleges/Branches/Students Lookup APIs | [task-7-prompt.md](./task-7-prompt.md) | Lookup endpoints |
| 8 | Testing | [task-8-prompt.md](./task-8-prompt.md) | Unit, component, E2E |
| 9 | Add Responsive Design and Accessibility | [task-9-prompt.md](./task-9-prompt.md) | Mobile layout, a11y |

---

## Usage Pattern

For **each task**:

1. Open the task prompt file (e.g., `task-1-prompt.md`)
2. **Copy the entire contents**
3. **Paste into Claude Code Web**
4. Wait for implementation to complete
5. Review and test the output
6. Mark task as complete in [manifest.md](./manifest.md)
7. Move to next task

---

## Story Context Reference

- **Full Context:** `.bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.context.xml`
- **Story Markdown:** `.bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.md`

---

## Acceptance Criteria Tracking

Track AC completion in the manifest as you complete tasks:

- AC #1: Filtering (Tasks 1, 2, 3, 5, 7)
- AC #2: Column selection (Tasks 2, 3)
- AC #3: Table with sorting/pagination (Tasks 3, 4, 5, 9)
- AC #4: Summary totals (Tasks 3, 4)
- AC #5: Preview before export (Task 5)
- AC #6: RLS enforcement (Tasks 3, 7, 8)
- AC #7: Contract expiration dates (Tasks 3, 4)
- AC #8: Contract expiration filtering (Tasks 2, 3, 6)
- AC #9: Contract expiration highlighting (Tasks 3, 4)

---

## Notes

- **Sequential execution required:** Some tasks depend on previous tasks
- **Test after each task:** Verify functionality before moving forward
- **Update manifest:** Track progress and any deviations
- **Claude Code Web only:** These prompts are optimized for Claude Code Web's context window and workflow
