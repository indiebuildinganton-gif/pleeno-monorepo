// ============================================================================
// Email Notification Helper
// ============================================================================
// Purpose: Send email notifications via Resend API
// Usage: Import and call sendEmailNotification() from any Edge Function
// ============================================================================

export interface EmailNotificationOptions {
  from: string;
  to: string | string[];
  subject: string;
  message: string;
  severity?: "info" | "warning" | "error" | "success";
  details?: Array<{ label: string; value: string }>;
  actionButton?: { text: string; url: string };
}

/**
 * Send an email notification using Resend API
 * @param apiKey - Resend API key
 * @param options - Email content and styling
 * @throws Error if API request fails
 */
export async function sendEmailNotification(
  apiKey: string,
  options: EmailNotificationOptions
): Promise<void> {
  // Map severity to colors
  const severityConfig = {
    info: { color: "#0099ff", icon: "ℹ️" },
    warning: { color: "#ff9900", icon: "⚠️" },
    error: { color: "#dc3545", icon: "🚨" },
    success: { color: "#28a745", icon: "✅" },
  };

  const config = severityConfig[options.severity || "info"];

  // Build HTML email
  const html = buildEmailHTML(options, config);

  // Send via Resend API
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: options.from,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API failed: ${response.statusText} - ${errorText}`);
  }
}

/**
 * Build HTML email template
 */
function buildEmailHTML(
  options: EmailNotificationOptions,
  config: { color: string; icon: string }
): string {
  const detailsHTML = options.details
    ? `
      <div class="details">
        ${options.details
          .map(
            (detail) => `
          <p><strong>${detail.label}:</strong> ${detail.value}</p>
        `
          )
          .join("")}
      </div>
    `
    : "";

  const actionButtonHTML = options.actionButton
    ? `
      <a href="${options.actionButton.url}" class="button">${options.actionButton.text}</a>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f4f4f4;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 20px auto;
          background-color: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: ${config.color};
          color: white;
          padding: 30px 20px;
          text-align: center;
        }
        .header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
        }
        .content {
          padding: 30px 20px;
        }
        .message {
          font-size: 16px;
          line-height: 1.8;
          margin-bottom: 20px;
        }
        .details {
          background-color: #f8f9fa;
          padding: 20px;
          border-left: 4px solid ${config.color};
          margin: 20px 0;
          border-radius: 4px;
        }
        .details p {
          margin: 8px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: ${config.color};
          color: white;
          text-decoration: none;
          border-radius: 5px;
          margin-top: 20px;
          font-weight: 600;
        }
        .button:hover {
          opacity: 0.9;
        }
        .footer {
          background-color: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #e0e0e0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${config.icon} ${options.subject}</h1>
        </div>
        <div class="content">
          <div class="message">
            ${options.message}
          </div>
          ${detailsHTML}
          ${actionButtonHTML}
        </div>
        <div class="footer">
          <p>This is an automated notification from your Pleeno system.</p>
          <p>Sent at ${new Date().toLocaleString()}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send a simple plain-text email
 * @param apiKey - Resend API key
 * @param from - Sender email
 * @param to - Recipient email(s)
 * @param subject - Email subject
 * @param text - Plain text message
 */
export async function sendSimpleEmail(
  apiKey: string,
  from: string,
  to: string | string[],
  subject: string,
  text: string
): Promise<void> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend API failed: ${response.statusText} - ${errorText}`);
  }
}

// ============================================================================
// Example Usage
// ============================================================================
//
// import { sendEmailNotification } from "../_shared/notifications/email.ts";
//
// await sendEmailNotification(Deno.env.get("RESEND_API_KEY")!, {
//   from: "alerts@yourdomain.com",
//   to: "admin@yourdomain.com",
//   subject: "Job Failed",
//   message: "The status update job has failed and requires immediate attention.",
//   severity: "error",
//   details: [
//     { label: "Job Name", value: "update-installment-statuses" },
//     { label: "Error", value: "Connection timeout" },
//     { label: "Time", value: new Date().toISOString() },
//   ],
//   actionButton: {
//     text: "View Logs",
//     url: "https://app.supabase.com/logs",
//   },
// });
//
// ============================================================================
