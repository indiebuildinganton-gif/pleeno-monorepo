-- =====================================================================
-- Table: jobs_log
-- Purpose: Track execution of automated jobs
-- Description: Logs all job executions with start/end times, record counts,
--              status, and error details for monitoring and debugging.
--              Enables tracking of automated status detection jobs and
--              other scheduled background tasks.
-- =====================================================================

-- =====================================================================
-- CREATE TABLE: jobs_log
-- =====================================================================

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

-- =====================================================================
-- TABLE COMMENTS
-- =====================================================================

COMMENT ON TABLE jobs_log IS 'Tracks execution of automated jobs (status updates, notifications, etc.)';
COMMENT ON COLUMN jobs_log.id IS 'Unique identifier for each job execution';
COMMENT ON COLUMN jobs_log.job_name IS 'Name of the job (e.g., "update-installment-statuses")';
COMMENT ON COLUMN jobs_log.started_at IS 'Timestamp when job execution started';
COMMENT ON COLUMN jobs_log.completed_at IS 'Timestamp when job execution completed (NULL if still running)';
COMMENT ON COLUMN jobs_log.records_updated IS 'Total number of records updated by this job execution';
COMMENT ON COLUMN jobs_log.status IS 'Current status: "running", "success", or "failed"';
COMMENT ON COLUMN jobs_log.error_message IS 'Error details if job failed (NULL on success)';
COMMENT ON COLUMN jobs_log.metadata IS 'Stores job-specific results, e.g., agency-level update counts';
COMMENT ON COLUMN jobs_log.created_at IS 'Timestamp when log record was created';

-- =====================================================================
-- INDEXES
-- =====================================================================

-- Primary query pattern: find recent executions of a specific job
CREATE INDEX idx_jobs_log_job_name ON jobs_log(job_name, started_at DESC);

-- Monitoring pattern: find failed jobs (partial index for efficiency)
CREATE INDEX idx_jobs_log_status ON jobs_log(status) WHERE status = 'failed';

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================

-- Enable RLS on jobs_log table
ALTER TABLE jobs_log ENABLE ROW LEVEL SECURITY;

-- Admin users can view all job logs (system-wide, no agency filtering)
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

-- Service role can insert job logs (for Edge Functions)
CREATE POLICY "Service role can insert job logs"
  ON jobs_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Service role can update job logs (for updating status and completion time)
CREATE POLICY "Service role can update job logs"
  ON jobs_log
  FOR UPDATE
  TO service_role
  USING (true);

-- =====================================================================
-- SECURITY NOTES
-- =====================================================================
-- - RLS ensures only admin users and service role can access logs
-- - No agency_id filtering: job logs are system-wide operational data
-- - Admin role required for viewing (not user-facing data)
-- - Service role has full insert/update access for automated jobs
-- =====================================================================

-- =====================================================================
-- METADATA STRUCTURE EXAMPLE
-- =====================================================================
-- The metadata JSONB field stores job-specific results:
--
-- {
--   "agencies": [
--     {
--       "agency_id": "a1234567-89ab-cdef-0123-456789abcdef",
--       "updated_count": 5,
--       "transitions": {
--         "pending_to_overdue": 5
--       }
--     },
--     {
--       "agency_id": "b2345678-9abc-def0-1234-56789abcdef0",
--       "updated_count": 3,
--       "transitions": {
--         "pending_to_overdue": 3
--       }
--     }
--   ],
--   "total_agencies_processed": 2
-- }
-- =====================================================================

-- =====================================================================
-- USAGE EXAMPLES
-- =====================================================================

-- Insert a new job log entry (job starting)
-- INSERT INTO jobs_log (job_name, started_at, status)
-- VALUES ('update-installment-statuses', now(), 'running')
-- RETURNING *;

-- Update job log on completion (success)
-- UPDATE jobs_log
-- SET
--   completed_at = now(),
--   status = 'success',
--   records_updated = 8,
--   metadata = jsonb_build_object(
--     'agencies', jsonb_build_array(
--       jsonb_build_object(
--         'agency_id', 'a1234567-89ab-cdef-0123-456789abcdef',
--         'updated_count', 5,
--         'transitions', jsonb_build_object('pending_to_overdue', 5)
--       ),
--       jsonb_build_object(
--         'agency_id', 'b2345678-9abc-def0-1234-56789abcdef0',
--         'updated_count', 3,
--         'transitions', jsonb_build_object('pending_to_overdue', 3)
--       )
--     ),
--     'total_agencies_processed', 2
--   )
-- WHERE job_name = 'update-installment-statuses'
--   AND status = 'running'
-- RETURNING *;

-- Update job log on failure
-- UPDATE jobs_log
-- SET
--   completed_at = now(),
--   status = 'failed',
--   error_message = 'Database connection timeout after 3 retries'
-- WHERE job_name = 'update-installment-statuses'
--   AND status = 'running'
-- RETURNING *;

-- Query recent executions of a specific job
-- SELECT * FROM jobs_log
-- WHERE job_name = 'update-installment-statuses'
-- ORDER BY started_at DESC
-- LIMIT 10;

-- Query failed jobs for monitoring/alerting
-- SELECT * FROM jobs_log
-- WHERE status = 'failed'
-- ORDER BY started_at DESC;

-- Find long-running jobs (duration calculation)
-- SELECT
--   job_name,
--   started_at,
--   completed_at,
--   (completed_at - started_at) as duration
-- FROM jobs_log
-- WHERE status = 'success'
-- ORDER BY duration DESC
-- LIMIT 10;

-- Detect stuck jobs (running > 1 hour)
-- SELECT * FROM jobs_log
-- WHERE status = 'running'
--   AND started_at < now() - interval '1 hour'
-- ORDER BY started_at;

-- Find jobs that haven't run recently (monitoring)
-- SELECT
--   job_name,
--   MAX(started_at) as last_run,
--   now() - MAX(started_at) as time_since_last_run
-- FROM jobs_log
-- GROUP BY job_name
-- HAVING MAX(started_at) < now() - interval '25 hours'
-- ORDER BY last_run;

-- Extract agency-level results from metadata
-- SELECT
--   job_name,
--   started_at,
--   jsonb_array_elements(metadata->'agencies') as agency_result
-- FROM jobs_log
-- WHERE job_name = 'update-installment-statuses'
--   AND status = 'success'
-- ORDER BY started_at DESC;

-- Aggregate statistics by job name
-- SELECT
--   job_name,
--   COUNT(*) as total_executions,
--   COUNT(*) FILTER (WHERE status = 'success') as successful,
--   COUNT(*) FILTER (WHERE status = 'failed') as failed,
--   AVG(records_updated) FILTER (WHERE status = 'success') as avg_records_updated,
--   AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'success') as avg_duration_seconds
-- FROM jobs_log
-- WHERE started_at > now() - interval '30 days'
-- GROUP BY job_name
-- ORDER BY total_executions DESC;

-- =====================================================================
-- END OF FILE
-- =====================================================================
