# Story 5.2: Due Soon Notification Flags - Task 1

## Story Context

**As an** Agency User
**I want** to see visual indicators for payments due within the next 4 days
**So that** I can proactively follow up before payments become overdue, including weekend and early-week payments

## Task 1: Implement "due soon" computed field logic

### Task Description

Implement the database schema changes and query logic to calculate when installments are "due soon" based on a configurable threshold. This task focuses on the backend foundation for detecting upcoming due dates.

### Subtasks Checklist

- [ ] Add `agencies.due_soon_threshold_days` field (default: 4)
- [ ] Create database function or query logic: `is_due_soon = (due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL 'N days') AND status = 'pending'`
- [ ] Update RLS policies to ensure proper filtering
- [ ] Add agencies settings API route: `PATCH /api/agencies/[id]/settings` for threshold configuration

### Acceptance Criteria

This task supports:
- **AC1**: Given installments exist with upcoming due dates, When I view payment plans or the dashboard, Then installments due within 4 days are flagged as "due soon"
- **AC5**: And the threshold (4 days) is configurable per agency

### Context & Constraints

**Key Constraints:**
- "Due soon" MUST be calculated query-time, NOT stored as distinct status enum value
- Installments remain in "pending" status until overdue or paid - "due soon" is a computed flag
- All database queries MUST respect Row-Level Security (RLS) policies filtering by agency_id
- Timezone handling: store UTC in database, convert to agency timezone for display/scheduling
- Agency settings API requires Admin role for threshold configuration changes

**Interfaces to Implement:**

1. **isDueSoon Query Logic** (packages/utils/src/date-helpers.ts):
```sql
SELECT * FROM installments
WHERE agency_id = $1
AND status = 'pending'
AND student_due_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '$2 days'
```

2. **PATCH /api/agencies/[id]/settings** (apps/agency/app/api/agencies/[id]/settings/route.ts):
```typescript
PATCH /api/agencies/[id]/settings
Body: { due_soon_threshold_days?: number }
Auth: Required (Admin only)
Returns: { success: boolean, data: Agency }
```

**Database Schema Changes:**

Add to agencies table:
```sql
-- supabase/migrations/001_agency_domain/001_agencies_schema.sql
ALTER TABLE agencies ADD COLUMN due_soon_threshold_days INT DEFAULT 4;
```

### Dependencies

**Required from Story 5.1:**
- Installment status enum includes "pending" and "overdue"
- Automated status detection job running (hourly via pg_cron)
- Agencies table with timezone field

**External Dependencies:**
- @supabase/supabase-js (latest)
- @supabase/ssr (latest)
- date-fns (4.1.0)
- date-fns-tz (latest)
- zod (4.x)

### Architecture Reference

From [docs/architecture.md](docs/architecture.md):
- **Pattern 3: Automated Status State Machine** - Status transitions managed automatically. Agency settings include due_soon_threshold_days (default 4). Status calculated query-time, not stored as enum value for temporary flags like "due soon".

### Testing Requirements

**Unit Tests** (packages/utils/src/*.test.ts):
- Test isDueSoon() returns true for installment due in 3 days, false for 5 days (with default 4-day threshold)
- Test with different threshold values (2, 4, 7 days)
- Test timezone handling for date calculations

**Integration Tests:**
- Test agency settings API updates due_soon_threshold_days and recalculates flags
- Test RLS policies properly filter by agency_id

---

## CRITICAL: Create Implementation Manifest

Before implementing this task, you MUST create a manifest file to track progress across all tasks.

Create the file: `.bmad-ephemeral/stories/prompts/5-2-due-soon-notification-flags/MANIFEST.md`

Use this template:

```markdown
# Story 5-2 Implementation Manifest

**Story**: Due Soon Notification Flags
**Status**: In Progress
**Started**: [Insert today's date]

## Task Progress

### Task 1: Implement "due soon" computed field logic
- Status: In Progress
- Started: [Insert today's date]
- Completed:
- Notes:

### Task 2: Update UI to display "due soon" badges
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Create student notification system
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Testing and validation
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]

## Database Migrations Applied

- [ ] agencies.due_soon_threshold_days field added
- [ ] RLS policies updated
- [ ] API route for settings configuration created

## Files Created/Modified

[List files as you create/modify them]
```

---

## Implementation Steps

1. **Create the manifest file** as specified above
2. **Create database migration** for agencies.due_soon_threshold_days
3. **Implement isDueSoon utility** in packages/utils/src/date-helpers.ts
4. **Create agency settings API route** at apps/agency/app/api/agencies/[id]/settings/route.ts
5. **Update RLS policies** to handle new field
6. **Write unit tests** for isDueSoon calculation logic
7. **Update manifest** when task complete

## Next Steps

After completing Task 1:
1. Update the manifest file - mark Task 1 as "Completed" with today's date
2. Add implementation notes about what was created
3. Move to [task-2-prompt.md](task-2-prompt.md) for UI badge implementation

---

**Source Story**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.md)
**Story Context**: [.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml](.bmad-ephemeral/stories/5-2-due-soon-notification-flags.context.xml)
