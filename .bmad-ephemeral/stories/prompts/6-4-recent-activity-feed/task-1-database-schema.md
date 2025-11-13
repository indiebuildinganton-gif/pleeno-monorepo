# Task 1: Create Activity Log Database Schema

## Context
You are implementing Story 6.4, Task 1 of the Pleeno payment tracking system.

**Story:** As an Agency User, I want to see a feed of recent activity in the system, so that I'm aware of what's happening and can stay in sync with my team.

**This Task:** Create the `activity_log` database table with RLS policies and indexes for tracking system activities.

## Acceptance Criteria
- AC #1-8: Activity feed infrastructure ready for logging and querying activities

## Requirements

Create a database migration file at `supabase/migrations/YYYYMMDD_create_activity_log.sql` that:

1. **Creates `activity_log` table** with columns:
   - `id` (uuid, primary key, default: uuid_generate_v4())
   - `agency_id` (uuid, foreign key to agencies, not null)
   - `user_id` (uuid, foreign key to users, nullable - system actions have null user)
   - `entity_type` (varchar, not null): "payment", "payment_plan", "student", "enrollment", "installment"
   - `entity_id` (uuid, not null): ID of the affected entity
   - `action` (varchar, not null): "created", "recorded", "updated", "marked_overdue"
   - `description` (text, not null): Human-readable activity description
   - `metadata` (jsonb, nullable): Additional context (student name, amount, etc.)
   - `created_at` (timestamp with time zone, not null, default: now())

2. **Creates RLS policy:**
   ```sql
   CREATE POLICY activity_agency_isolation ON activity_log
   USING (agency_id = auth.uid());
   ```

3. **Creates index for performance:**
   ```sql
   CREATE INDEX idx_activity_log_agency_created
   ON activity_log(agency_id, created_at DESC);
   ```

4. **Enables RLS:**
   ```sql
   ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
   ```

## Technical Constraints

- **Architecture:** Database in Supabase PostgreSQL
- **Security:** RLS enforces agency-level isolation (agency_id = auth.uid())
- **Performance:** Index on (agency_id, created_at DESC) for fast recent activity queries
- **Migration naming:** Use format `YYYYMMDD_create_activity_log.sql` (e.g., `20251113_create_activity_log.sql`)

## Database Schema

```sql
-- Create activity_log table
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see activities from their own agency
CREATE POLICY activity_agency_isolation ON activity_log
  USING (agency_id = auth.uid());

-- Index for fast queries by agency and recent activities
CREATE INDEX idx_activity_log_agency_created
  ON activity_log(agency_id, created_at DESC);

-- Optional: Consider adding check constraints for entity_type and action
ALTER TABLE activity_log ADD CONSTRAINT check_entity_type
  CHECK (entity_type IN ('payment', 'payment_plan', 'student', 'enrollment', 'installment'));

ALTER TABLE activity_log ADD CONSTRAINT check_action
  CHECK (action IN ('created', 'recorded', 'updated', 'marked_overdue'));
```

## Implementation Notes

- Use `uuid_generate_v4()` for primary key generation
- `user_id` is nullable to support system-generated activities (e.g., overdue detection)
- `metadata` JSONB stores flexible additional context (student_name, amount, college_name, etc.)
- `created_at` defaults to `now()` for automatic timestamping
- Check constraints ensure valid entity_type and action values
- Foreign key cascade behaviors:
  - `agency_id`: ON DELETE CASCADE (remove activities if agency deleted)
  - `user_id`: ON DELETE SET NULL (keep activity but mark user as null if deleted)

## Testing Requirements

After creating the migration:

1. **Run migration:**
   ```bash
   supabase migration up
   ```

2. **Verify table structure:**
   ```sql
   \d activity_log
   ```

3. **Test RLS policy:**
   ```sql
   -- As agency_1 user
   INSERT INTO activity_log (agency_id, user_id, entity_type, entity_id, action, description)
   VALUES ('agency_1_uuid', 'user_1_uuid', 'student', 'student_1_uuid', 'created', 'Test activity');

   -- Verify can read own activity
   SELECT * FROM activity_log WHERE agency_id = 'agency_1_uuid';

   -- As agency_2 user, verify cannot read agency_1 activities
   SELECT * FROM activity_log WHERE agency_id = 'agency_1_uuid'; -- Should return empty
   ```

4. **Test index usage:**
   ```sql
   EXPLAIN ANALYZE SELECT * FROM activity_log
   WHERE agency_id = 'agency_1_uuid'
   ORDER BY created_at DESC
   LIMIT 20;
   -- Should use idx_activity_log_agency_created index
   ```

## Dependencies

- Existing tables: `agencies`, `users`
- Supabase PostgreSQL with uuid-ossp extension

## References

- [Architecture: Multi-Tenant Isolation](docs/architecture.md#Multi-Tenant-Isolation-RLS)
- [Architecture: Database Schema](docs/architecture.md#Database-Schema)
- [Story: 6.4 Recent Activity Feed](.bmad-ephemeral/stories/6-4-recent-activity-feed.md)
