// ============================================================================
// Supabase Edge Function: Check Job Health
// ============================================================================
// Purpose: Monitor scheduled job execution and detect missed runs
// Alert: Sends notification if job hasn't run in > 25 hours
// Schedule: Run this function every hour via external cron or monitoring service
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

interface JobHealthStatus {
  ok: boolean;
  jobName: string;
  lastRun: string | null;
  hoursSinceLastRun: number;
  status: "healthy" | "warning" | "critical";
  message: string;
}

interface AlertPayload {
  subject: string;
  message: string;
  severity: "warning" | "critical";
  jobName: string;
  lastRun: string | null;
  hoursSinceLastRun: number;
}

// ============================================================================
// Configuration
// ============================================================================

const ALERT_THRESHOLD_HOURS = 25; // Alert if no run in 25+ hours
const JOB_NAME = "update-installment-statuses";

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  try {
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check last run of the status update job
    const { data: lastRun, error } = await supabase
      .from("jobs_log")
      .select("started_at, status, records_updated")
      .eq("job_name", JOB_NAME)
      .order("started_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is expected for first run
      throw error;
    }

    // Calculate hours since last run
    const hoursSinceLastRun = lastRun
      ? (Date.now() - new Date(lastRun.started_at).getTime()) / (1000 * 60 * 60)
      : 999; // If never run, return large number

    // Determine health status
    const healthStatus: JobHealthStatus = {
      ok: hoursSinceLastRun <= ALERT_THRESHOLD_HOURS,
      jobName: JOB_NAME,
      lastRun: lastRun?.started_at || null,
      hoursSinceLastRun: Math.round(hoursSinceLastRun * 10) / 10, // Round to 1 decimal
      status:
        hoursSinceLastRun <= 24
          ? "healthy"
          : hoursSinceLastRun <= ALERT_THRESHOLD_HOURS
          ? "warning"
          : "critical",
      message:
        hoursSinceLastRun <= 24
          ? "Job running normally"
          : hoursSinceLastRun <= ALERT_THRESHOLD_HOURS
          ? "Job slightly delayed but within tolerance"
          : `Job has not run in ${Math.round(hoursSinceLastRun)} hours - missed execution detected`,
    };

    // Send alert if threshold exceeded
    if (hoursSinceLastRun > ALERT_THRESHOLD_HOURS) {
      const alertPayload: AlertPayload = {
        subject: `ALERT: ${JOB_NAME} Missed Execution`,
        message: `The scheduled job "${JOB_NAME}" has not run in ${healthStatus.hoursSinceLastRun} hours. Expected daily execution. Last run: ${lastRun?.started_at || "Never"}`,
        severity: "critical",
        jobName: JOB_NAME,
        lastRun: lastRun?.started_at || null,
        hoursSinceLastRun: healthStatus.hoursSinceLastRun,
      };

      // Send alert via configured notification channel
      await sendAlert(alertPayload);
    }

    // Return health status
    return new Response(JSON.stringify(healthStatus, null, 2), {
      status: healthStatus.ok ? 200 : 503,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error checking job health:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to check job health",
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});

// ============================================================================
// Alert Functions
// ============================================================================

/**
 * Send alert via configured notification channel
 * Configure one or more notification methods based on your requirements
 */
async function sendAlert(payload: AlertPayload): Promise<void> {
  console.log("Sending alert:", payload);

  // Option 1: Send to Slack (if webhook configured)
  const slackWebhook = Deno.env.get("SLACK_WEBHOOK_URL");
  if (slackWebhook) {
    try {
      await sendSlackAlert(slackWebhook, payload);
    } catch (error) {
      console.error("Failed to send Slack alert:", error);
    }
  }

  // Option 2: Send email (if email service configured)
  const emailApiKey = Deno.env.get("RESEND_API_KEY");
  const emailTo = Deno.env.get("ALERT_EMAIL_TO");
  if (emailApiKey && emailTo) {
    try {
      await sendEmailAlert(emailApiKey, emailTo, payload);
    } catch (error) {
      console.error("Failed to send email alert:", error);
    }
  }

  // If no notification method configured, just log
  if (!slackWebhook && !emailApiKey) {
    console.warn(
      "No notification channels configured. Set SLACK_WEBHOOK_URL or RESEND_API_KEY."
    );
  }
}

/**
 * Send alert to Slack via webhook
 */
async function sendSlackAlert(
  webhookUrl: string,
  payload: AlertPayload
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `:rotating_light: ${payload.subject}`,
      blocks: [
        {
          type: "header",
          text: {
            type: "plain_text",
            text: `:rotating_light: ${payload.subject}`,
          },
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: payload.message,
          },
        },
        {
          type: "section",
          fields: [
            {
              type: "mrkdwn",
              text: `*Job Name:*\n${payload.jobName}`,
            },
            {
              type: "mrkdwn",
              text: `*Last Run:*\n${payload.lastRun || "Never"}`,
            },
            {
              type: "mrkdwn",
              text: `*Hours Since Last Run:*\n${payload.hoursSinceLastRun}`,
            },
            {
              type: "mrkdwn",
              text: `*Severity:*\n${payload.severity.toUpperCase()}`,
            },
          ],
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "View Logs" },
              url: `${Deno.env.get("SUPABASE_URL")}/project/${
                Deno.env.get("SUPABASE_PROJECT_REF") || "default"
              }/logs`,
              style: "danger",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}

/**
 * Send alert via email using Resend
 */
async function sendEmailAlert(
  apiKey: string,
  toEmail: string,
  payload: AlertPayload
): Promise<void> {
  const fromEmail = Deno.env.get("ALERT_EMAIL_FROM") || "alerts@yourdomain.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      subject: payload.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { padding: 20px; background-color: #f8f9fa; border-radius: 0 0 5px 5px; }
            .details { background-color: white; padding: 15px; border-left: 4px solid #dc3545; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🚨 ${payload.subject}</h2>
          </div>
          <div class="content">
            <p>${payload.message}</p>

            <div class="details">
              <p><strong>Job Name:</strong> ${payload.jobName}</p>
              <p><strong>Last Run:</strong> ${payload.lastRun || "Never"}</p>
              <p><strong>Hours Since Last Run:</strong> ${payload.hoursSinceLastRun}</p>
              <p><strong>Severity:</strong> ${payload.severity.toUpperCase()}</p>
            </div>

            <p>Please investigate this issue as soon as possible. The job should run daily, and a missed execution indicates a potential problem with the scheduled task.</p>

            <a href="${Deno.env.get("SUPABASE_URL")}" class="button">View Dashboard</a>
          </div>
        </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Email API failed: ${error}`);
  }
}

// ============================================================================
// Usage Instructions
// ============================================================================
//
// 1. Deploy this function:
//    supabase functions deploy check-job-health
//
// 2. Set environment variables in Supabase Dashboard:
//    - SLACK_WEBHOOK_URL (optional): Your Slack incoming webhook URL
//    - RESEND_API_KEY (optional): Your Resend API key for email
//    - ALERT_EMAIL_TO (optional): Email address to send alerts to
//    - ALERT_EMAIL_FROM (optional): Sender email address
//    - SUPABASE_PROJECT_REF (optional): Your Supabase project reference
//
// 3. Schedule this function to run hourly using:
//    - External cron service (cron-job.org, GitHub Actions, etc.)
//    - Cloud scheduler (AWS EventBridge, Google Cloud Scheduler)
//    - Monitoring service (UptimeRobot, Pingdom)
//
// Example cron job (runs every hour):
// 0 * * * * curl -X POST https://<project-ref>.supabase.co/functions/v1/check-job-health \
//   -H "Authorization: Bearer <anon-key>"
//
// 4. Test the function:
//    curl -X POST https://<project-ref>.supabase.co/functions/v1/check-job-health \
//      -H "Authorization: Bearer <anon-key>"
//
// ============================================================================
