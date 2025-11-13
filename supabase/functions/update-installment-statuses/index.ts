/**
 * Update Installment Statuses Edge Function
 *
 * This function is invoked daily by pg_cron to automatically update installment statuses
 * based on due dates and agency-specific timezone settings. It calls the PostgreSQL
 * update_installment_statuses() function and logs all executions to the jobs_log table.
 *
 * Security: Protected by API key authentication (X-API-Key header)
 * Schedule: Daily at 7:00 AM UTC (5:00 PM Brisbane time)
 *
 * @see docs/operations/status-update-job.md for operational procedures
 * @see docs/runbooks/status-update-job-failures.md for troubleshooting
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Environment variables - auto-provided by Supabase except FUNCTION_API_KEY
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// FUNCTION_API_KEY must be set via: supabase secrets set SUPABASE_FUNCTION_KEY="<key>"
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

// Retry configuration: Exponential backoff for transient errors
// Delays: 1s, 2s, 4s = max 7s additional time across 3 retries
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

interface AgencyResult {
  agency_id: string;
  updated_count: number;
  transitions: {
    pending_to_overdue: number;
  };
}

interface NewlyOverdueInstallment {
  id: string;
  amount: number;
  student_due_date: string;
  payment_plan: {
    id: string;
    agency_id: string;
    student: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

interface UpdateResponse {
  success: boolean;
  recordsUpdated: number;
  notificationsCreated: number;
  agencies: AgencyResult[];
  error?: string;
  notificationErrors?: string[];
}

/**
 * Executes a function with exponential backoff retry logic.
 *
 * Retries only for transient errors (network, timeouts, etc.)
 * Retry delays: 1s, 2s, 4s (exponential backoff)
 *
 * @param fn - The async function to execute
 * @param retries - Current retry attempt (internal use)
 * @returns Result of the function execution
 * @throws Error if max retries exceeded or non-transient error
 */
async function executeWithRetry<T>(
  fn: () => Promise<T>,
  retries = 0
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Don't retry if we've hit max retries or error is permanent
    if (retries >= MAX_RETRIES || !isTransientError(error)) {
      throw error;
    }
    // Exponential backoff: 1s * 2^retries = 1s, 2s, 4s
    const delay = INITIAL_DELAY * Math.pow(2, retries);
    console.log(`Retry ${retries + 1}/${MAX_RETRIES} after ${delay}ms`);
    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries + 1);
  }
}

/**
 * Determines if an error is transient (retryable) or permanent.
 *
 * Transient errors include:
 * - Network connection resets (ECONNRESET)
 * - Timeouts (ETIMEDOUT, timeout)
 * - Temporary connection issues (ECONNREFUSED, connection)
 *
 * Permanent errors (not retried):
 * - SQL syntax errors
 * - Permission errors
 * - Business logic errors
 *
 * @param error - The error to check
 * @returns true if error is transient/retryable, false otherwise
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
 * Generates notifications for newly overdue installments.
 *
 * This function:
 * 1. Queries for installments marked overdue in the last 2 minutes (to catch current run)
 * 2. Checks for existing notifications using metadata.installment_id (deduplication)
 * 3. Creates notification records with student name, amount, and due date
 * 4. Returns count of notifications created and any errors encountered
 *
 * @param supabase - Supabase client with service role permissions
 * @returns Object with notificationsCreated count and errors array
 */
async function generateOverdueNotifications(supabase: any): Promise<{
  notificationsCreated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let notificationsCreated = 0;

  try {
    // Query for newly overdue installments (status changed in last 2 minutes)
    // Using 2 minutes to be safe with job execution time
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data: newlyOverdueInstallments, error: queryError } = await supabase
      .from("installments")
      .select(`
        id,
        amount,
        student_due_date,
        payment_plan:payment_plans (
          id,
          agency_id,
          student:enrollments (
            student:students (
              id,
              first_name,
              last_name
            )
          )
        )
      `)
      .eq("status", "overdue")
      .gte("updated_at", twoMinutesAgo);

    if (queryError) {
      errors.push(`Failed to query newly overdue installments: ${queryError.message}`);
      return { notificationsCreated: 0, errors };
    }

    if (!newlyOverdueInstallments || newlyOverdueInstallments.length === 0) {
      console.log("No newly overdue installments found");
      return { notificationsCreated: 0, errors };
    }

    console.log(`Found ${newlyOverdueInstallments.length} newly overdue installments`);

    // Process each newly overdue installment
    for (const installment of newlyOverdueInstallments) {
      try {
        // Extract student info from nested structure
        const student = installment.payment_plan?.student?.student;
        if (!student) {
          errors.push(`Installment ${installment.id}: Missing student data`);
          continue;
        }

        const studentName = `${student.first_name} ${student.last_name}`;
        const agencyId = installment.payment_plan?.agency_id;

        if (!agencyId) {
          errors.push(`Installment ${installment.id}: Missing agency_id`);
          continue;
        }

        // Check for existing notification (deduplication)
        const { data: existingNotification } = await supabase
          .from("notifications")
          .select("id")
          .eq("type", "overdue_payment")
          .eq("agency_id", agencyId)
          .contains("metadata", { installment_id: installment.id })
          .maybeSingle();

        if (existingNotification) {
          console.log(`Notification already exists for installment ${installment.id}`);
          continue;
        }

        // Format due date
        const dueDate = new Date(installment.student_due_date);
        const formattedDate = dueDate.toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        });

        // Create notification
        const { error: notificationError } = await supabase
          .from("notifications")
          .insert({
            agency_id: agencyId,
            user_id: null, // Agency-wide notification
            type: "overdue_payment",
            message: `Payment overdue: ${studentName} - $${installment.amount.toFixed(2)} due ${formattedDate}`,
            link: "/payments/plans?status=overdue",
            is_read: false,
            metadata: {
              installment_id: installment.id,
              payment_plan_id: installment.payment_plan.id,
              student_id: student.id,
              amount: installment.amount,
              due_date: installment.student_due_date,
            },
          });

        if (notificationError) {
          errors.push(`Failed to create notification for installment ${installment.id}: ${notificationError.message}`);
        } else {
          notificationsCreated++;
          console.log(`Created notification for installment ${installment.id}`);
        }
      } catch (error) {
        errors.push(`Error processing installment ${installment.id}: ${error.message}`);
        console.error(`Error processing installment ${installment.id}:`, error);
      }
    }

    return { notificationsCreated, errors };
  } catch (error) {
    errors.push(`Failed to generate overdue notifications: ${error.message}`);
    console.error("Failed to generate overdue notifications:", error);
    return { notificationsCreated: 0, errors };
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
  // Only pg_cron (with database setting) and authorized admins can invoke this function
  // Key is set via: supabase secrets set SUPABASE_FUNCTION_KEY="<key>"
  // Database setting: ALTER DATABASE postgres SET app.supabase_function_key = '<key>';
  const apiKey = req.headers.get("X-API-Key");
  if (apiKey !== FUNCTION_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Initialize Supabase client with service role key for elevated permissions
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Log job start in jobs_log table
  // This creates an audit trail for monitoring and troubleshooting
  // Status transitions: running -> success/failed
  const { data: jobLog, error: insertError } = await supabase
    .from("jobs_log")
    .insert({
      job_name: "update-installment-statuses",
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
    // Call the PostgreSQL update_installment_statuses() function with retry logic
    // This function handles timezone-aware status updates for all agencies
    // Returns array of results per agency showing what was updated
    const results = await executeWithRetry(async () => {
      const { data, error } = await supabase.rpc("update_installment_statuses");
      if (error) throw error;
      return data as AgencyResult[];
    });

    // Calculate total installments updated across all agencies
    const totalUpdated = results.reduce((sum, r) => sum + r.updated_count, 0);

    // Generate notifications for newly overdue installments
    // This runs after status updates to catch all newly overdue installments
    // Errors in notification generation don't fail the overall job
    console.log("Generating overdue notifications...");
    const { notificationsCreated, errors: notificationErrors } =
      await generateOverdueNotifications(supabase);

    if (notificationErrors.length > 0) {
      console.error("Notification generation errors:", notificationErrors);
    }

    console.log(`Created ${notificationsCreated} notifications`);

    // Update jobs_log with success status and detailed results
    // Metadata includes per-agency breakdown for monitoring and debugging
    await supabase
      .from("jobs_log")
      .update({
        completed_at: new Date().toISOString(),
        status: "success",
        records_updated: totalUpdated,
        metadata: {
          agencies: results,
          total_agencies_processed: results.length,
          notifications_created: notificationsCreated,
          notification_errors: notificationErrors.length > 0 ? notificationErrors : undefined,
        },
      })
      .eq("id", jobLog.id);

    // Return success response with summary and per-agency details
    const response: UpdateResponse = {
      success: true,
      recordsUpdated: totalUpdated,
      notificationsCreated,
      agencies: results,
      notificationErrors: notificationErrors.length > 0 ? notificationErrors : undefined,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log job failure with error details for troubleshooting
    // Error stack trace stored in metadata for debugging
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

    // Return error response - maintains consistent API contract even on failure
    return new Response(
      JSON.stringify({
        success: false,
        recordsUpdated: 0,
        notificationsCreated: 0,
        agencies: [],
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
