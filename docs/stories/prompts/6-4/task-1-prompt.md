# Story 6-4: Recent Activity Feed - Task 1

## Story Context

**As an** Agency User
**I want** to see a feed of recent activity in the system
**So that** I'm aware of what's happening and can stay in sync with my team

## Task 1: Create Activity Log Database Schema

**Acceptance Criteria**: #1-8

### Task Description

Create the database schema for the activity log system that will track all significant user and system actions across the application.

### Subtasks

- [ ] Create `activity_log` table with columns:
  - `id` (uuid, primary key)
  - `agency_id` (uuid, foreign key to agencies, not null)
  - `user_id` (uuid, foreign key to users, nullable - system actions have null user)
  - `entity_type` (varchar, not null): "payment", "payment_plan", "student", "enrollment", "installment"
  - `entity_id` (uuid, not null): ID of the affected entity
  - `action` (varchar, not null): "created", "recorded", "updated", "marked_overdue"
  - `description` (text, not null): Human-readable activity description
  - `metadata` (jsonb, nullable): Additional context (student name, amount, etc.)
  - `created_at` (timestamp, not null, default: now())
- [ ] Add RLS policy: `CREATE POLICY activity_agency_isolation ON activity_log USING (agency_id = auth.uid())`
- [ ] Create index: `CREATE INDEX idx_activity_log_agency_created ON activity_log(agency_id, created_at DESC)`
- [ ] Create migration file: `supabase/migrations/YYYYMMDD_create_activity_log.sql`
- [ ] Test: Verify RLS prevents cross-agency access

## Context

### Key Constraints

- **Database**: activity_log table requires RLS policy: `CREATE POLICY activity_agency_isolation ON activity_log USING (agency_id = auth.uid())`
- **Database**: Index required for performance: `CREATE INDEX idx_activity_log_agency_created ON activity_log(agency_id, created_at DESC)`
- **Security**: All activity_log queries MUST respect RLS policies - use server-side Supabase client with JWT auth
- **Security**: Activity descriptions must NOT include sensitive data (passwords, tokens, full payment details)
- **Testing**: All database queries must be tested with RLS verification to ensure no cross-agency data leakage

### Relevant Interfaces

**activity_log Table Schema**:
```sql
CREATE TABLE activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id),
  user_id uuid REFERENCES users(id),
  entity_type varchar NOT NULL,
  entity_id uuid NOT NULL,
  action varchar NOT NULL,
  description text NOT NULL,
  metadata jsonb,
  created_at timestamp NOT NULL DEFAULT now()
)
```

**Path**: supabase/migrations/YYYYMMDD_create_activity_log.sql

### Dependencies

- **@supabase/supabase-js** (latest): Database client for PostgreSQL with RLS
- **@supabase/ssr** (latest): Server-side Supabase authentication

### Reference Documentation

- [docs/architecture.md](docs/architecture.md) - Multi-Tenant Isolation section for RLS patterns
- [docs/epics.md](docs/epics.md) - Epic 6: Business Intelligence Dashboard - Story 6.4

## CRITICAL: Create Implementation Manifest

**Before starting development**, create a manifest file to track progress through all 8 tasks:

**File**: `docs/stories/prompts/6-4/manifest.md`

```markdown
# Story 6-4 Implementation Manifest

**Story**: Recent Activity Feed
**Status**: In Progress
**Started**: [Current Date]

## Task Progress

### Task 1: Create Activity Log Database Schema
- Status: In Progress
- Started: [Current Date]
- Completed:
- Notes:

### Task 2: Implement Activity Logging in Existing API Routes
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 3: Create Activity Feed API Route
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 4: Create ActivityFeed Component
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 5: Implement Auto-Refresh for Real-Time Feel
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 6: Make Activities Clickable
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 7: Integrate into Dashboard Page
- Status: Not Started
- Started:
- Completed:
- Notes:

### Task 8: Testing
- Status: Not Started
- Started:
- Completed:
- Notes:

## Implementation Notes

[Add notes as you progress through tasks]
```

## Implementation Guide

1. **Create the migration file** following the naming convention: `supabase/migrations/YYYYMMDD_create_activity_log.sql`
2. **Include the table creation** with all specified columns and types
3. **Add RLS policy** to enforce agency-level isolation
4. **Create performance index** on (agency_id, created_at DESC)
5. **Test RLS** by attempting cross-agency queries (should be blocked)

### Migration File Structure

The migration should include:
- Table creation with proper column types and constraints
- RLS policy enabling
- RLS policy creation for agency isolation
- Index creation for query performance

### Testing Approach

Create test cases to verify:
- Table structure matches specification
- RLS policy blocks access to other agencies' data
- Index exists and improves query performance
- Nullable user_id allows system actions

## Next Steps

After completing this task:

1. **Update the manifest** at `docs/stories/prompts/6-4/manifest.md`:
   - Change Task 1 status to "Completed"
   - Add completion date
   - Add any relevant implementation notes

2. **Proceed to Task 2**: Open `task-2-prompt.md` to implement activity logging in existing API routes

3. **Verify**: Ensure the migration runs successfully and RLS policies work correctly before moving on

---

**Remember**: This is Task 1 of 8. Each task builds on the previous one, so ensure this foundation is solid before continuing.
