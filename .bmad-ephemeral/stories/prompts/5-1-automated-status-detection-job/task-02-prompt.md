# Story 5-1: Automated Status Detection Job - Task 2

## Story Context
**As a** system
**I want** a scheduled job that runs daily to update installment statuses
**So that** overdue payments are automatically detected without manual checking

## Task 2: Create Jobs Log Table

### Description
Create a database table to track all job executions with start/end times, record counts, status, and error details. This enables monitoring and debugging of the automated status detection job.

### Implementation Checklist
- [ ] Create `jobs_log` table with schema:
  - [ ] `id` UUID PRIMARY KEY
  - [ ] `job_name` TEXT NOT NULL
  - [ ] `started_at` TIMESTAMPTZ NOT NULL
  - [ ] `completed_at` TIMESTAMPTZ (nullable, set when job completes)
  - [ ] `records_updated` INT DEFAULT 0
  - [ ] `status` TEXT CHECK (status IN ('running', 'success', 'failed'))
  - [ ] `error_message` TEXT (nullable, populated on failure)
  - [ ] `metadata` JSONB (for storing agency-level results)
  - [ ] `created_at` TIMESTAMPTZ DEFAULT now()
- [ ] Add index: `CREATE INDEX idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC)`
- [ ] Add index: `CREATE INDEX idx_jobs_log_status ON jobs_log(status)` (for monitoring queries)
- [ ] Configure RLS: Admin-only read access (no agency_id needed, system-wide logs)
- [ ] Add table comment explaining purpose

### Acceptance Criteria
- **AC 3**: Execution Logging and Monitoring
  - Execution details logged to jobs_log table with:
    - job_name, started_at, completed_at, records_updated, status, error_message
  - Log includes count of status transitions per agency (stored in metadata JSONB)
  - Monitoring/alerting configured if job fails (uses status field)

### Key Constraints
- RLS Policy: Only service role and admin users can read/write jobs_log
- Status Values: Must be one of: 'running', 'success', 'failed'
- Metadata Structure: JSONB field stores agency-level results from Task 1's function
- Indexes: Required for efficient querying by job_name and status

### Table Schema

```sql
CREATE TABLE jobs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  records_updated INT DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failed')),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE jobs_log IS 'Tracks execution of automated jobs (status updates, notifications, etc.)';
COMMENT ON COLUMN jobs_log.metadata IS 'Stores job-specific results, e.g., agency-level update counts';
```

### Indexes

```sql
-- Primary query pattern: find recent executions of a specific job
CREATE INDEX idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC);

-- Monitoring pattern: find failed jobs
CREATE INDEX idx_jobs_log_status ON jobs_log(status) WHERE status = 'failed';
```

### RLS Policies

```sql
-- Enable RLS
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

-- Admin-only read access (system-wide logs, no agency filtering)
CREATE POLICY "Admin users can view all job logs"
  ON jobs_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role = 'admin'
    )
  );

-- Service role can insert/update (for Edge Functions)
CREATE POLICY "Service role can insert job logs"
  ON jobs_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update job logs"
  ON jobs_log
  FOR UPDATE
  TO service_role
  USING (true);
```

### Metadata Structure Example

The `metadata` JSONB field will store agency-level results from the update function:

```json
{
  "agencies": [
    {
      "agency_id": "a1...",
      "updated_count": 5,
      "transitions": {
        "pending_to_overdue": 5
      }
    },
    {
      "agency_id": "a2...",
      "updated_count": 3,
      "transitions": {
        "pending_to_overdue": 3
      }
    }
  ],
  "total_agencies_processed": 2
}
```

### Dependencies
- PostgreSQL 12+ (for gen_random_uuid())
- Existing `user_roles` table (for admin RLS policy)

### Relevant Artifacts
- Architecture reference: [docs/architecture.md](docs/architecture.md) Pattern 3: Automated Status State Machine

### Testing Approach

After implementing, test the table:

```sql
-- Insert test job log
INSERT INTO jobs_log (job_name, started_at, status)
VALUES ('update-installment-statuses', now(), 'running')
RETURNING *;

-- Update to success
UPDATE jobs_log
SET
  completed_at = now(),
  status = 'success',
  records_updated = 8,
  metadata = jsonb_build_object(
    'agencies', jsonb_build_array(
      jsonb_build_object('agency_id', 'a1...', 'updated_count', 5),
      jsonb_build_object('agency_id', 'a2...', 'updated_count', 3)
    )
  )
WHERE job_name = 'update-installment-statuses'
  AND status = 'running'
RETURNING *;

-- Query recent executions
SELECT * FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;

-- Query failed jobs
SELECT * FROM jobs_log
WHERE status = 'failed'
ORDER BY started_at DESC;
```

---

## Implementation Notes

### Database Location
Create this table in the same migration file as Task 1:
- File: `supabase/migrations/004_notifications_domain/001_jobs_infrastructure.sql`

For now, you can create a draft SQL file:
- Draft location: `supabase/migrations/drafts/jobs_log_table.sql`

### Design Rationale

**Why JSONB for metadata?**
- Flexible structure for different job types
- Allows storing agency-level results without separate table
- Queryable using PostgreSQL JSONB operators

**Why separate started_at and completed_at?**
- Enables tracking job duration: `completed_at - started_at`
- Allows detecting stuck jobs: `WHERE status = 'running' AND started_at < now() - interval '1 hour'`

**Why system-wide (no agency_id)?**
- Job logs are operational data for system monitoring
- Admins need visibility across all agencies
- Not user-facing data

### Query Patterns

```sql
-- Find long-running jobs
SELECT job_name, started_at, completed_at, (completed_at - started_at) as duration
FROM jobs_log
WHERE status = 'success'
ORDER BY duration DESC
LIMIT 10;

-- Find jobs that haven't run recently
SELECT job_name, MAX(started_at) as last_run
FROM jobs_log
GROUP BY job_name
HAVING MAX(started_at) < now() - interval '25 hours';

-- Extract agency-level results
SELECT
  job_name,
  started_at,
  jsonb_array_elements(metadata->'agencies') as agency_result
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
ORDER BY started_at DESC;
```

---

## Next Steps

1. Implement the `jobs_log` table with schema, indexes, and RLS policies
2. Test locally with sample inserts and queries
3. Verify RLS policies prevent unauthorized access
4. When Task 2 is complete:
   - Update `MANIFEST.md`: Set Task 2 status to "Completed" with completion date
   - Add file path to "Files Created"
   - Add any implementation notes
   - Move to `task-03-prompt.md`

**Reference**: For full story context, see [.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml](.bmad-ephemeral/stories/5-1-automated-status-detection-job.context.xml)
