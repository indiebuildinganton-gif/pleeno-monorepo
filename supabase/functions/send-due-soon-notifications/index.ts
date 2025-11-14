/**
 * Send Due Soon Notifications Edge Function
 *
 * This function is invoked daily by pg_cron to send payment reminder emails to students
 * 36 hours before their payment is due. It queries installments due tomorrow (at 5 PM cutoff),
 * sends email notifications via Resend API, and logs all notifications to student_notifications table.
 *
 * Security: Protected by API key authentication (X-API-Key header)
 * Schedule: Daily at 7:00 PM UTC (5:00 AM Brisbane next day)
 * Timing: Sends notifications 36 hours before 5:00 PM cutoff on due date
 *
 * Example: For payment due Jan 15 at 5 PM, notification sent Jan 14 at 5 AM Brisbane time
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { format } from "https://esm.sh/date-fns@2.30.0";

// Environment variables - auto-provided by Supabase
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Pleeno <noreply@pleeno.com>";

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

interface DueSoonInstallment {
  id: string;
  amount: number;
  student_due_date: string;
  payment_plan: {
    id: string;
    agency_id: string;
    payment_instructions?: string;
    enrollment: {
      student: {
        id: string;
        full_name: string;
        email?: string;
        contact_preference?: string;
      };
    };
  };
  agency: {
    id: string;
    name: string;
    contact_email?: string;
    contact_phone?: string;
  };
}

interface NotificationResult {
  success: boolean;
  installmentsProcessed: number;
  notificationsSent: number;
  notificationsFailed: number;
  errors: string[];
}

/**
 * Determines if an error is transient (retryable) or permanent.
 */
function isTransientError(error: any): boolean {
  const transientPatterns = [
    "ECONNRESET",
    "ETIMEDOUT",
    "connection",
    "timeout",
    "ECONNREFUSED",
  ];
  const errorMessage = error?.message?.toLowerCase() || "";
  return transientPatterns.some((pattern) =>
    errorMessage.includes(pattern.toLowerCase())
  );
}

/**
 * Executes a function with exponential backoff retry logic.
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries >= MAX_RETRIES || !isTransientError(error)) {
      throw error;
    }
    const delay = INITIAL_DELAY * Math.pow(2, retries);
    console.log(`Retry ${retries + 1}/${MAX_RETRIES} after ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries + 1);
  }
}

/**
 * Generates the email HTML for payment reminder.
 * Simple inline template since we can't import React Email components in Deno.
 */
function generatePaymentReminderHtml(params: {
  studentName: string;
  amount: number;
  dueDate: string;
  paymentInstructions: string;
  agencyName: string;
  agencyContactEmail?: string;
  agencyContactPhone?: string;
}): string {
  const {
    studentName,
    amount,
    dueDate,
    paymentInstructions,
    agencyName,
    agencyContactEmail,
    agencyContactPhone,
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: sans-serif; background-color: #f6f9fc; margin: 0; padding: 20px 0;">
  <div style="margin: 0 auto; padding: 20px 0; max-width: 600px;">
    <div style="background-color: #ffffff; padding: 40px; border-radius: 8px;">
      <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px; color: #1a1a1a;">
        Payment Reminder
      </h1>

      <p style="font-size: 16px; line-height: 24px; margin-bottom: 20px;">
        Hi ${studentName},
      </p>

      <p style="font-size: 16px; line-height: 24px; margin-bottom: 30px;">
        This is a friendly reminder that your payment is due soon. We wanted to give you advance notice so you have time to arrange payment.
      </p>

      <div style="background-color: #fef3c7; padding: 25px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
        <p style="font-size: 14px; font-weight: bold; margin-bottom: 15px; color: #92400e; text-transform: uppercase; letter-spacing: 0.5px;">
          Payment Details
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
          <strong>Amount Due:</strong> <span style="font-size: 20px; color: #d97706;">$${amount.toFixed(2)}</span>
        </p>
        <p style="font-size: 16px; margin: 10px 0;">
          <strong>Due Date:</strong> ${dueDate}
        </p>
      </div>

      <div style="background-color: #f0f4f8; padding: 20px; border-radius: 6px; margin-bottom: 30px;">
        <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #334155;">
          Payment Instructions
        </p>
        <p style="font-size: 14px; line-height: 20px; margin: 0; white-space: pre-wrap;">
          ${paymentInstructions}
        </p>
      </div>

      <p style="font-size: 14px; line-height: 20px; margin-bottom: 20px; color: #666666;">
        Please ensure payment is received by the due date to avoid any late fees or payment complications. If you have already made this payment, please disregard this reminder.
      </p>

      ${
        agencyContactEmail || agencyContactPhone
          ? `
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e6e6e6;">

      <p style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">
        Need Help?
      </p>

      <p style="font-size: 14px; line-height: 20px; margin-bottom: 5px; color: #666666;">
        If you have any questions or need assistance, please contact us:
      </p>

      ${agencyContactEmail ? `<p style="font-size: 14px; margin: 5px 0; color: #666666;">Email: <a href="mailto:${agencyContactEmail}" style="color: #0066ff; text-decoration: none;">${agencyContactEmail}</a></p>` : ""}
      ${agencyContactPhone ? `<p style="font-size: 14px; margin: 5px 0; color: #666666;">Phone: ${agencyContactPhone}</p>` : ""}
      `
          : ""
      }

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e6e6e6;">

      <p style="font-size: 14px; color: #666666; line-height: 20px;">
        Thank you,<br>
        ${agencyName}
      </p>

      <p style="font-size: 12px; color: #999999; margin-top: 30px; font-style: italic;">
        This is an automated payment reminder from Pleeno. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Sends payment reminder emails for installments due in 36 hours.
 */
async function sendDueSoonNotifications(
  supabase: any,
  resend: Resend
): Promise<NotificationResult> {
  const errors: string[] = [];
  let installmentsProcessed = 0;
  let notificationsSent = 0;
  let notificationsFailed = 0;

  try {
    // Query installments due tomorrow (CURRENT_DATE + 1 day)
    // This gives us 36 hours before the 5 PM cutoff on the due date
    // when this job runs at 5 AM the day before
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = format(tomorrow, "yyyy-MM-dd");

    console.log(`Querying installments due on ${tomorrowDate}`);

    const { data: dueSoonInstallments, error: queryError } = await supabase
      .from("installments")
      .select(`
        id,
        amount,
        student_due_date,
        payment_plan:payment_plans (
          id,
          agency_id,
          payment_instructions,
          enrollment:enrollments (
            student:students (
              id,
              full_name,
              email,
              contact_preference
            )
          )
        ),
        agency:agencies!inner (
          id,
          name,
          contact_email,
          contact_phone
        )
      `)
      .eq("status", "pending")
      .eq("student_due_date", tomorrowDate);

    if (queryError) {
      errors.push(`Failed to query due soon installments: ${queryError.message}`);
      return {
        success: false,
        installmentsProcessed: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        errors,
      };
    }

    if (!dueSoonInstallments || dueSoonInstallments.length === 0) {
      console.log("No installments due tomorrow found");
      return {
        success: true,
        installmentsProcessed: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        errors: [],
      };
    }

    console.log(`Found ${dueSoonInstallments.length} installments due tomorrow`);

    // Process each installment
    for (const installment of dueSoonInstallments) {
      installmentsProcessed++;

      try {
        // Extract student and agency info
        const student = installment.payment_plan?.enrollment?.student;
        const agency = installment.agency;

        if (!student) {
          errors.push(`Installment ${installment.id}: Missing student data`);
          notificationsFailed++;
          continue;
        }

        if (!student.email) {
          errors.push(`Installment ${installment.id}: Student ${student.full_name} has no email`);
          notificationsFailed++;
          continue;
        }

        // Check contact preference (default to email if not set)
        const contactPreference = student.contact_preference || "email";
        if (contactPreference !== "email" && contactPreference !== "both") {
          console.log(
            `Skipping installment ${installment.id}: Student prefers ${contactPreference}`
          );
          continue;
        }

        // Check for existing notification (prevent duplicates)
        const { data: existingNotification } = await supabase
          .from("student_notifications")
          .select("id")
          .eq("installment_id", installment.id)
          .eq("notification_type", "due_soon")
          .maybeSingle();

        if (existingNotification) {
          console.log(
            `Notification already exists for installment ${installment.id}, skipping`
          );
          continue;
        }

        // Format due date for email
        const dueDate = new Date(installment.student_due_date);
        const formattedDate = format(dueDate, "MMMM dd, yyyy");

        // Generate email HTML
        const emailHtml = generatePaymentReminderHtml({
          studentName: student.full_name,
          amount: installment.amount,
          dueDate: formattedDate,
          paymentInstructions:
            installment.payment_plan.payment_instructions ||
            "Please contact your agency for payment instructions.",
          agencyName: agency.name,
          agencyContactEmail: agency.contact_email,
          agencyContactPhone: agency.contact_phone,
        });

        // Send email via Resend with retry logic
        let emailResult;
        try {
          emailResult = await executeWithRetry(async () => {
            return await resend.emails.send({
              from: RESEND_FROM_EMAIL,
              to: student.email,
              subject: `Payment Reminder: $${installment.amount.toFixed(2)} due on ${formattedDate}`,
              html: emailHtml,
            });
          });
        } catch (emailError) {
          const errorMsg = `Failed to send email for installment ${installment.id}: ${emailError.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);

          // Log failed notification
          await supabase.from("student_notifications").insert({
            student_id: student.id,
            installment_id: installment.id,
            agency_id: installment.payment_plan.agency_id,
            notification_type: "due_soon",
            delivery_status: "failed",
            error_message: emailError.message,
          });

          notificationsFailed++;
          continue;
        }

        if (emailResult.error) {
          const errorMsg = `Resend API error for installment ${installment.id}: ${emailResult.error.message}`;
          errors.push(errorMsg);
          console.error(errorMsg);

          // Log failed notification
          await supabase.from("student_notifications").insert({
            student_id: student.id,
            installment_id: installment.id,
            agency_id: installment.payment_plan.agency_id,
            notification_type: "due_soon",
            delivery_status: "failed",
            error_message: emailResult.error.message,
          });

          notificationsFailed++;
          continue;
        }

        // Log successful notification
        await supabase.from("student_notifications").insert({
          student_id: student.id,
          installment_id: installment.id,
          agency_id: installment.payment_plan.agency_id,
          notification_type: "due_soon",
          delivery_status: "sent",
          sent_at: new Date().toISOString(),
        });

        notificationsSent++;
        console.log(
          `Sent payment reminder to ${student.full_name} (${student.email}) for installment ${installment.id}`
        );
      } catch (error) {
        const errorMsg = `Error processing installment ${installment.id}: ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);
        notificationsFailed++;
      }
    }

    return {
      success: errors.length === 0 || notificationsSent > 0,
      installmentsProcessed,
      notificationsSent,
      notificationsFailed,
      errors,
    };
  } catch (error) {
    const errorMsg = `Failed to send due soon notifications: ${error.message}`;
    errors.push(errorMsg);
    console.error(errorMsg, error);
    return {
      success: false,
      installmentsProcessed,
      notificationsSent,
      notificationsFailed,
      errors,
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      },
    });
  }

  // API Key Authentication
  const apiKey = req.headers.get("X-API-Key");
  if (apiKey !== FUNCTION_API_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const resend = new Resend(RESEND_API_KEY);

  // Log job start
  const { data: jobLog, error: insertError } = await supabase
    .from("jobs_log")
    .insert({
      job_name: "send-due-soon-notifications",
      started_at: new Date().toISOString(),
      status: "running",
    })
    .select()
    .single();

  if (insertError || !jobLog) {
    console.error("Failed to insert job log:", insertError);
    return new Response(
      JSON.stringify({ error: "Failed to start job logging" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Send notifications
    const result = await sendDueSoonNotifications(supabase, resend);

    // Update jobs_log with results
    await supabase
      .from("jobs_log")
      .update({
        completed_at: new Date().toISOString(),
        status: result.success ? "success" : "failed",
        records_updated: result.notificationsSent,
        metadata: {
          installments_processed: result.installmentsProcessed,
          notifications_sent: result.notificationsSent,
          notifications_failed: result.notificationsFailed,
          errors: result.errors.length > 0 ? result.errors : undefined,
        },
      })
      .eq("id", jobLog.id);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log job failure
    await supabase
      .from("jobs_log")
      .update({
        completed_at: new Date().toISOString(),
        status: "failed",
        error_message: error.message,
        metadata: {
          error_stack: error.stack,
        },
      })
      .eq("id", jobLog.id);

    console.error("Job failed:", error);

    return new Response(
      JSON.stringify({
        success: false,
        installmentsProcessed: 0,
        notificationsSent: 0,
        notificationsFailed: 0,
        errors: [error.message],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
