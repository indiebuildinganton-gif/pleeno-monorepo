-- =====================================================================
-- Job Failure Alert System
-- =====================================================================
-- Purpose: Automatically notify administrators when jobs fail
-- Description: Creates a PostgreSQL trigger and notification function that
--              uses pg_notify to send alerts when job status changes to 'failed'.
--              External services can listen to these notifications and send
--              emails, Slack messages, or other alerts.
-- =====================================================================

-- =====================================================================
-- FUNCTION: notify_job_failure
-- =====================================================================
-- Purpose: Send pg_notify alert when a job fails
-- Trigger: AFTER INSERT OR UPDATE on jobs_log
-- Channel: 'job_failure'
-- Payload: JSON with job details

CREATE OR REPLACE FUNCTION notify_job_failure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only notify on job failures for the status update job
  IF NEW.status = 'failed' AND NEW.job_name = 'update-installment-statuses' THEN
    -- Send notification via pg_notify
    -- External listeners can subscribe to 'job_failure' channel
    PERFORM pg_notify(
      'job_failure',
      json_build_object(
        'job_id', NEW.id,
        'job_name', NEW.job_name,
        'started_at', NEW.started_at,
        'completed_at', NEW.completed_at,
        'error_message', NEW.error_message,
        'metadata', NEW.metadata,
        'alert_time', now()
      )::text
    );

    -- Log the notification (optional, for debugging)
    RAISE NOTICE 'Job failure alert sent for job: % (ID: %)', NEW.job_name, NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- =====================================================================
-- COMMENTS
-- =====================================================================

COMMENT ON FUNCTION notify_job_failure() IS
  'Sends pg_notify alert when update-installment-statuses job fails. ' ||
  'External services should listen on channel "job_failure" for alerts.';

-- =====================================================================
-- TRIGGER: trigger_notify_job_failure
-- =====================================================================

CREATE TRIGGER trigger_notify_job_failure
  AFTER INSERT OR UPDATE ON jobs_log
  FOR EACH ROW
  EXECUTE FUNCTION notify_job_failure();

COMMENT ON TRIGGER trigger_notify_job_failure ON jobs_log IS
  'Fires after job log insert/update to send failure alerts via pg_notify';

-- =====================================================================
-- USAGE: Listening for Notifications
-- =====================================================================
-- External services can listen for notifications using PostgreSQL LISTEN:
--
-- Example in Node.js:
-- ```javascript
-- const { Client } = require('pg');
-- const client = new Client({ connectionString: process.env.DATABASE_URL });
--
-- await client.connect();
-- await client.query('LISTEN job_failure');
--
-- client.on('notification', (msg) => {
--   const payload = JSON.parse(msg.payload);
--   console.log('Job failed:', payload);
--   // Send email, Slack message, etc.
-- });
-- ```
--
-- Example in Python:
-- ```python
-- import psycopg2
-- import json
--
-- conn = psycopg2.connect(database_url)
-- conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
-- cursor = conn.cursor()
-- cursor.execute("LISTEN job_failure;")
--
-- while True:
--     conn.poll()
--     while conn.notifies:
--         notify = conn.notifies.pop(0)
--         payload = json.loads(notify.payload)
--         print(f"Job failed: {payload}")
--         # Send email, Slack message, etc.
-- ```
-- =====================================================================

-- =====================================================================
-- TESTING THE ALERT SYSTEM
-- =====================================================================
-- To test the alert system, insert a failed job and verify pg_notify is sent:
--
-- 1. In one terminal, listen for notifications:
-- LISTEN job_failure;
--
-- 2. In another terminal, insert a failed job:
-- INSERT INTO jobs_log (job_name, started_at, completed_at, status, error_message)
-- VALUES ('update-installment-statuses', now(), now(), 'failed', 'Test failure for alert system');
--
-- 3. Verify notification received in first terminal
--
-- Clean up test:
-- DELETE FROM jobs_log WHERE error_message = 'Test failure for alert system';
-- =====================================================================

-- =====================================================================
-- NOTIFICATION PAYLOAD STRUCTURE
-- =====================================================================
-- The pg_notify payload is a JSON string with the following structure:
-- {
--   "job_id": "a1234567-89ab-cdef-0123-456789abcdef",
--   "job_name": "update-installment-statuses",
--   "started_at": "2025-11-13T12:00:00Z",
--   "completed_at": "2025-11-13T12:05:00Z",
--   "error_message": "Database connection timeout after 3 retries",
--   "metadata": { ... },
--   "alert_time": "2025-11-13T12:05:00Z"
-- }
-- =====================================================================

-- =====================================================================
-- ALERT LATENCY
-- =====================================================================
-- Alert latency depends on:
-- 1. pg_notify is near-instantaneous (< 1 second within database)
-- 2. Listener polling interval (configure in your listener code)
-- 3. Notification delivery method (email, Slack, etc.)
--
-- To meet the 5-minute alert requirement:
-- - Keep listener polling interval < 30 seconds
-- - Use reliable notification services (Slack webhook, transactional email)
-- - Monitor listener health to ensure it's always running
-- =====================================================================

-- =====================================================================
-- SECURITY CONSIDERATIONS
-- =====================================================================
-- - Function uses SECURITY DEFINER to ensure notifications are sent
--   even if the trigger is fired by service role
-- - Only sends notifications for specific job (update-installment-statuses)
-- - Payload does not include sensitive data (API keys, credentials)
-- - External listeners should authenticate with database using secure credentials
-- =====================================================================

-- =====================================================================
-- END OF FILE
-- =====================================================================
