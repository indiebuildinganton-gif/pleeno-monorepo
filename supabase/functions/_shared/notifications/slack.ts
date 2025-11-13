// ============================================================================
// Slack Notification Helper
// ============================================================================
// Purpose: Send notifications to Slack via webhook
// Usage: Import and call sendSlackNotification() from any Edge Function
// ============================================================================

export interface SlackNotificationOptions {
  title: string;
  message: string;
  severity?: "info" | "warning" | "error" | "success";
  fields?: Array<{ label: string; value: string }>;
  actions?: Array<{ text: string; url: string; style?: "primary" | "danger" }>;
}

/**
 * Send a notification to Slack via webhook
 * @param webhookUrl - Slack incoming webhook URL
 * @param options - Notification content and styling
 * @throws Error if webhook request fails
 */
export async function sendSlackNotification(
  webhookUrl: string,
  options: SlackNotificationOptions
): Promise<void> {
  // Map severity to emoji and color
  const severityConfig = {
    info: { emoji: ":information_source:", color: "#0099ff" },
    warning: { emoji: ":warning:", color: "#ff9900" },
    error: { emoji: ":rotating_light:", color: "#dc3545" },
    success: { emoji: ":white_check_mark:", color: "#28a745" },
  };

  const config = severityConfig[options.severity || "info"];

  // Build Slack blocks
  const blocks: any[] = [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${config.emoji} ${options.title}`,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: options.message,
      },
    },
  ];

  // Add fields if provided
  if (options.fields && options.fields.length > 0) {
    blocks.push({
      type: "section",
      fields: options.fields.map((field) => ({
        type: "mrkdwn",
        text: `*${field.label}:*\n${field.value}`,
      })),
    });
  }

  // Add actions if provided
  if (options.actions && options.actions.length > 0) {
    blocks.push({
      type: "actions",
      elements: options.actions.map((action) => ({
        type: "button",
        text: { type: "plain_text", text: action.text },
        url: action.url,
        style: action.style || undefined,
      })),
    });
  }

  // Add divider and timestamp
  blocks.push(
    {
      type: "divider",
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: `<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
        },
      ],
    }
  );

  // Send to Slack
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `${config.emoji} ${options.title}`, // Fallback text
      blocks,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Slack webhook failed: ${response.statusText} - ${errorText}`);
  }
}

/**
 * Send a simple text notification to Slack
 * @param webhookUrl - Slack incoming webhook URL
 * @param text - Message text (supports Slack markdown)
 */
export async function sendSimpleSlackMessage(
  webhookUrl: string,
  text: string
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.statusText}`);
  }
}

// ============================================================================
// Example Usage
// ============================================================================
//
// import { sendSlackNotification } from "../_shared/notifications/slack.ts";
//
// await sendSlackNotification(Deno.env.get("SLACK_WEBHOOK_URL")!, {
//   title: "Job Failed",
//   message: "The status update job has failed.",
//   severity: "error",
//   fields: [
//     { label: "Job Name", value: "update-installment-statuses" },
//     { label: "Error", value: "Connection timeout" },
//   ],
//   actions: [
//     { text: "View Logs", url: "https://app.supabase.com/logs", style: "danger" },
//   ],
// });
//
// ============================================================================
