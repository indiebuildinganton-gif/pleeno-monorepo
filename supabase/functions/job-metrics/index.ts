// ============================================================================
// Supabase Edge Function: Job Metrics API
// ============================================================================
// Purpose: Export job execution metrics for external monitoring dashboards
// Usage: GET endpoint that returns job statistics in JSON format
// Integration: Can be consumed by Grafana, Metabase, or custom dashboards
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// Types
// ============================================================================

interface JobMetrics {
  jobName: string;
  timeRange: {
    start: string;
    end: string;
    days: number;
  };
  summary: {
    totalRuns: number;
    successfulRuns: number;
    failedRuns: number;
    successRate: number;
    totalRecordsUpdated: number;
  };
  performance: {
    avgDurationSeconds: number;
    minDurationSeconds: number;
    maxDurationSeconds: number;
  };
  recentExecutions: Array<{
    id: string;
    startedAt: string;
    completedAt: string | null;
    durationSeconds: number | null;
    recordsUpdated: number;
    status: string;
    errorMessage: string | null;
  }>;
  dailyTrend: Array<{
    date: string;
    runs: number;
    successfulRuns: number;
    failedRuns: number;
    totalRecordsUpdated: number;
    avgDurationSeconds: number;
  }>;
  healthStatus: {
    lastRun: string | null;
    hoursSinceLastRun: number;
    status: "healthy" | "warning" | "critical";
  };
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  try {
    // Parse query parameters
    const url = new URL(req.url);
    const jobName = url.searchParams.get("job_name") || "update-installment-statuses";
    const days = parseInt(url.searchParams.get("days") || "30");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate time range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all job logs for the time range
    const { data: jobLogs, error } = await supabase
      .from("jobs_log")
      .select("*")
      .eq("job_name", jobName)
      .gte("started_at", startDate.toISOString())
      .order("started_at", { ascending: false });

    if (error) {
      throw error;
    }

    // Calculate metrics
    const metrics: JobMetrics = {
      jobName,
      timeRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days,
      },
      summary: calculateSummary(jobLogs || []),
      performance: calculatePerformance(jobLogs || []),
      recentExecutions: formatRecentExecutions(jobLogs || [], limit),
      dailyTrend: calculateDailyTrend(jobLogs || []),
      healthStatus: calculateHealthStatus(jobLogs || []),
    };

    // Return metrics
    return new Response(JSON.stringify(metrics, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*", // Enable CORS for dashboard access
      },
    });
  } catch (error) {
    console.error("Error fetching job metrics:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to fetch job metrics",
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
// Calculation Functions
// ============================================================================

function calculateSummary(logs: any[]) {
  const totalRuns = logs.length;
  const successfulRuns = logs.filter((log) => log.status === "success").length;
  const failedRuns = logs.filter((log) => log.status === "failed").length;
  const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
  const totalRecordsUpdated = logs.reduce(
    (sum, log) => sum + (log.records_updated || 0),
    0
  );

  return {
    totalRuns,
    successfulRuns,
    failedRuns,
    successRate: Math.round(successRate * 100) / 100,
    totalRecordsUpdated,
  };
}

function calculatePerformance(logs: any[]) {
  const successfulLogs = logs.filter(
    (log) => log.status === "success" && log.completed_at
  );

  if (successfulLogs.length === 0) {
    return {
      avgDurationSeconds: 0,
      minDurationSeconds: 0,
      maxDurationSeconds: 0,
    };
  }

  const durations = successfulLogs.map((log) => {
    const start = new Date(log.started_at).getTime();
    const end = new Date(log.completed_at).getTime();
    return (end - start) / 1000; // Convert to seconds
  });

  return {
    avgDurationSeconds: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100,
    minDurationSeconds: Math.min(...durations),
    maxDurationSeconds: Math.max(...durations),
  };
}

function formatRecentExecutions(logs: any[], limit: number) {
  return logs.slice(0, limit).map((log) => {
    const durationSeconds = log.completed_at
      ? (new Date(log.completed_at).getTime() - new Date(log.started_at).getTime()) / 1000
      : null;

    return {
      id: log.id,
      startedAt: log.started_at,
      completedAt: log.completed_at,
      durationSeconds: durationSeconds ? Math.round(durationSeconds * 100) / 100 : null,
      recordsUpdated: log.records_updated || 0,
      status: log.status,
      errorMessage: log.error_message,
    };
  });
}

function calculateDailyTrend(logs: any[]) {
  // Group logs by date
  const dailyData: { [key: string]: any[] } = {};

  logs.forEach((log) => {
    const date = new Date(log.started_at).toISOString().split("T")[0];
    if (!dailyData[date]) {
      dailyData[date] = [];
    }
    dailyData[date].push(log);
  });

  // Calculate metrics for each day
  return Object.entries(dailyData)
    .map(([date, dayLogs]) => {
      const successfulLogs = dayLogs.filter((log) => log.status === "success");
      const durations = successfulLogs
        .filter((log) => log.completed_at)
        .map((log) => {
          const start = new Date(log.started_at).getTime();
          const end = new Date(log.completed_at).getTime();
          return (end - start) / 1000;
        });

      return {
        date,
        runs: dayLogs.length,
        successfulRuns: successfulLogs.length,
        failedRuns: dayLogs.filter((log) => log.status === "failed").length,
        totalRecordsUpdated: dayLogs.reduce(
          (sum, log) => sum + (log.records_updated || 0),
          0
        ),
        avgDurationSeconds:
          durations.length > 0
            ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100
            : 0,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort by date descending
}

function calculateHealthStatus(logs: any[]) {
  if (logs.length === 0) {
    return {
      lastRun: null,
      hoursSinceLastRun: 999,
      status: "critical" as const,
    };
  }

  const lastRun = logs[0];
  const hoursSinceLastRun =
    (Date.now() - new Date(lastRun.started_at).getTime()) / (1000 * 60 * 60);

  let status: "healthy" | "warning" | "critical";
  if (hoursSinceLastRun <= 24) {
    status = "healthy";
  } else if (hoursSinceLastRun <= 25) {
    status = "warning";
  } else {
    status = "critical";
  }

  return {
    lastRun: lastRun.started_at,
    hoursSinceLastRun: Math.round(hoursSinceLastRun * 10) / 10,
    status,
  };
}

// ============================================================================
// Usage Instructions
// ============================================================================
//
// 1. Deploy this function:
//    supabase functions deploy job-metrics
//
// 2. Query the API:
//    curl https://<project-ref>.supabase.co/functions/v1/job-metrics
//
// 3. Optional query parameters:
//    - job_name: Name of the job (default: "update-installment-statuses")
//    - days: Number of days to include (default: 30)
//    - limit: Number of recent executions to return (default: 10)
//
// Examples:
//
// Get metrics for last 7 days:
//    curl "https://<project-ref>.supabase.co/functions/v1/job-metrics?days=7"
//
// Get metrics with 20 recent executions:
//    curl "https://<project-ref>.supabase.co/functions/v1/job-metrics?limit=20"
//
// Get metrics for a different job:
//    curl "https://<project-ref>.supabase.co/functions/v1/job-metrics?job_name=my-other-job"
//
// 4. Integration with monitoring tools:
//
//    Grafana (JSON API datasource):
//      - URL: https://<project-ref>.supabase.co/functions/v1/job-metrics
//      - Method: GET
//      - Parse JSON response and create visualizations
//
//    Metabase (SQL or API):
//      - Create a dashboard with custom metrics
//      - Use the API endpoint as a data source
//
//    Custom Dashboard:
//      - Fetch the JSON endpoint periodically
//      - Display metrics in your own UI
//
// ============================================================================
