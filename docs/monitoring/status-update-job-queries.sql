-- ============================================================================
-- Monitoring Queries for Status Update Job
-- ============================================================================
-- Purpose: SQL queries for monitoring the update-installment-statuses job
-- Usage: Run these queries in Supabase SQL Editor or save as favorites
-- ============================================================================

-- Query 1: Recent Job Executions
-- Shows the last 10 job runs with key metrics
SELECT
  id,
  job_name,
  started_at,
  completed_at,
  (completed_at - started_at) AS duration,
  records_updated,
  status,
  error_message
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
ORDER BY started_at DESC
LIMIT 10;

-- Query 2: Failed Jobs (Last 7 Days)
-- Identifies recent failures for troubleshooting
SELECT
  id,
  started_at,
  error_message,
  metadata
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'failed'
  AND started_at > now() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- Query 3: Job Success Rate (Last 30 Days)
-- Calculates reliability metrics
SELECT
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) AS success_rate
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND started_at > now() - INTERVAL '30 days';

-- Query 4: Average Job Duration
-- Helps identify performance degradation
SELECT
  AVG(completed_at - started_at) AS avg_duration,
  MIN(completed_at - started_at) AS min_duration,
  MAX(completed_at - started_at) AS max_duration
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '7 days';

-- Query 5: Records Updated Trend
-- Shows daily update volume
SELECT
  DATE(started_at) AS date,
  SUM(records_updated) AS total_updated,
  COUNT(*) AS runs
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Query 6: Missed Executions (Job Should Run Daily)
-- Detects when the scheduled job hasn't run
SELECT
  MAX(started_at) AS last_run,
  now() - MAX(started_at) AS time_since_last_run,
  CASE
    WHEN now() - MAX(started_at) > INTERVAL '25 hours' THEN 'ALERT: Missed execution'
    ELSE 'OK'
  END AS status
FROM jobs_log
WHERE job_name = 'update-installment-statuses';

-- Query 7: Agency-Level Update Statistics
-- Shows which agencies have the most status changes
SELECT
  a.name AS agency_name,
  COUNT(*) FILTER (WHERE i.status = 'overdue') AS overdue_count,
  COUNT(*) FILTER (WHERE i.status = 'pending') AS pending_count,
  MAX(jl.started_at) AS last_check
FROM agencies a
LEFT JOIN payment_plans pp ON pp.agency_id = a.id
LEFT JOIN installments i ON i.payment_plan_id = pp.id
LEFT JOIN jobs_log jl ON jl.job_name = 'update-installment-statuses'
WHERE pp.status = 'active'
GROUP BY a.id, a.name
ORDER BY overdue_count DESC;

-- Query 8: Error Pattern Analysis
-- Groups errors by type to identify systemic issues
SELECT
  LEFT(error_message, 100) AS error_pattern,
  COUNT(*) AS occurrence_count,
  MIN(started_at) AS first_seen,
  MAX(started_at) AS last_seen
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'failed'
  AND started_at > now() - INTERVAL '30 days'
GROUP BY LEFT(error_message, 100)
ORDER BY occurrence_count DESC;

-- Query 9: Job Performance Over Time
-- 7-day moving average of execution duration
SELECT
  DATE(started_at) AS date,
  COUNT(*) AS runs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) AS avg_duration_seconds,
  MAX(EXTRACT(EPOCH FROM (completed_at - started_at))) AS max_duration_seconds,
  SUM(records_updated) AS total_records_updated
FROM jobs_log
WHERE job_name = 'update-installment-statuses'
  AND status = 'success'
  AND started_at > now() - INTERVAL '30 days'
GROUP BY DATE(started_at)
ORDER BY date DESC;

-- Query 10: Current Job Status (Health Check)
-- Quick status check for the job
WITH latest_run AS (
  SELECT
    started_at,
    completed_at,
    status,
    error_message,
    records_updated
  FROM jobs_log
  WHERE job_name = 'update-installment-statuses'
  ORDER BY started_at DESC
  LIMIT 1
)
SELECT
  CASE
    WHEN lr.status = 'failed' THEN 'CRITICAL: Last run failed'
    WHEN now() - lr.started_at > INTERVAL '25 hours' THEN 'WARNING: No recent execution'
    WHEN lr.status = 'success' THEN 'OK: Running normally'
    ELSE 'UNKNOWN'
  END AS health_status,
  lr.started_at AS last_run,
  lr.status AS last_status,
  lr.records_updated AS last_records_updated,
  lr.error_message AS last_error
FROM latest_run lr;
