import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FUNCTION_API_KEY = Deno.env.get("SUPABASE_FUNCTION_KEY")!;

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

interface AgencyResult {
  agency_id: string;
  updated_count: number;
  transitions: {
    pending_to_overdue: number;
  };
}

interface UpdateResponse {
  success: boolean;
  recordsUpdated: number;
  agencies: AgencyResult[];
  error?: string;
}

// Retry logic
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
    await new Promise((resolve) => setTimeout(resolve, delay));
    return executeWithRetry(fn, retries + 1);
  }
}

function isTransientError(error: any): boolean {
  // Network errors, timeouts, temporary database issues
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

serve(async (req) => {
  // CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
      },
    });
  }

  // Validate API key
  const apiKey = req.headers.get("X-API-Key");
  if (apiKey !== FUNCTION_API_KEY) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Log job start
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
    // Call database function with retry
    const results = await executeWithRetry(async () => {
      const { data, error } = await supabase.rpc("update_installment_statuses");
      if (error) throw error;
      return data as AgencyResult[];
    });

    // Calculate totals
    const totalUpdated = results.reduce((sum, r) => sum + r.updated_count, 0);

    // Log job success
    await supabase
      .from("jobs_log")
      .update({
        completed_at: new Date().toISOString(),
        status: "success",
        records_updated: totalUpdated,
        metadata: {
          agencies: results,
          total_agencies_processed: results.length,
        },
      })
      .eq("id", jobLog.id);

    const response: UpdateResponse = {
      success: true,
      recordsUpdated: totalUpdated,
      agencies: results,
    };

    return new Response(JSON.stringify(response), {
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
        recordsUpdated: 0,
        agencies: [],
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
