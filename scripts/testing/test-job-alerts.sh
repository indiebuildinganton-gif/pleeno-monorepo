#!/bin/bash
# ============================================================================
# Test Script: Job Alert System
# ============================================================================
# Purpose: Test all job monitoring and alerting components
# Usage: ./scripts/testing/test-job-alerts.sh [test_name]
# ============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF}"
ANON_KEY="${SUPABASE_ANON_KEY}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
DB_URL="${DATABASE_URL}"

# ============================================================================
# Helper Functions
# ============================================================================

print_header() {
    echo ""
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_prerequisites() {
    print_header "Checking Prerequisites"

    # Check required tools
    command -v curl >/dev/null 2>&1 || { print_error "curl is required but not installed."; exit 1; }
    command -v psql >/dev/null 2>&1 || print_warning "psql not found - database tests will be skipped"
    command -v jq >/dev/null 2>&1 || print_warning "jq not found - JSON parsing will be limited"

    # Check environment variables
    if [ -z "$PROJECT_REF" ]; then
        print_error "SUPABASE_PROJECT_REF not set"
        echo "Set it with: export SUPABASE_PROJECT_REF=your-project-ref"
        exit 1
    fi

    if [ -z "$SERVICE_ROLE_KEY" ]; then
        print_warning "SUPABASE_SERVICE_ROLE_KEY not set - some tests will be skipped"
    fi

    print_success "Prerequisites check complete"
}

# ============================================================================
# Test 1: Database Trigger for Job Failure Alerts
# ============================================================================

test_job_failure_trigger() {
    print_header "Test 1: Job Failure Alert Trigger"

    if [ -z "$DB_URL" ]; then
        print_warning "DATABASE_URL not set - skipping database tests"
        return
    fi

    print_info "Inserting test failed job..."

    TEST_ERROR_MSG="TEST ALERT $(date +%s) - Automated test failure (safe to ignore)"

    psql "$DB_URL" -c "
        INSERT INTO jobs_log (job_name, started_at, completed_at, status, error_message)
        VALUES (
            'update-installment-statuses',
            now(),
            now(),
            'failed',
            '$TEST_ERROR_MSG'
        )
        RETURNING id, job_name, status, error_message;
    " || {
        print_error "Failed to insert test job"
        return 1
    }

    print_success "Test job inserted successfully"
    print_info "Note: pg_notify trigger should have fired"
    print_info "Check your Slack/email for alert within 1 minute"

    # Cleanup
    print_info "Cleaning up test data..."
    psql "$DB_URL" -c "
        DELETE FROM jobs_log
        WHERE error_message LIKE 'TEST ALERT%'
          AND error_message LIKE '%Automated test failure%';
    " >/dev/null 2>&1

    print_success "Test 1 complete"
    echo ""
    echo "⏰ Please verify:"
    echo "  1. Slack notification received (if configured)"
    echo "  2. Email notification received (if configured)"
    echo "  3. Notification contains correct error message"
}

# ============================================================================
# Test 2: Health Check Function (Missed Execution Detection)
# ============================================================================

test_health_check_function() {
    print_header "Test 2: Health Check Function"

    if [ -z "$PROJECT_REF" ]; then
        print_error "SUPABASE_PROJECT_REF not set"
        return 1
    fi

    HEALTH_CHECK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/check-job-health"

    print_info "Calling health check endpoint..."
    print_info "URL: $HEALTH_CHECK_URL"

    RESPONSE=$(curl -s -w "\n%{http_code}" "$HEALTH_CHECK_URL" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo ""

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "503" ]; then
        print_success "Health check function responded"

        # Parse status if jq is available
        if command -v jq >/dev/null 2>&1; then
            STATUS=$(echo "$BODY" | jq -r '.status' 2>/dev/null || echo "unknown")
            HOURS_SINCE=$(echo "$BODY" | jq -r '.hoursSinceLastRun' 2>/dev/null || echo "unknown")

            echo "Health Status: $STATUS"
            echo "Hours Since Last Run: $HOURS_SINCE"

            if [ "$STATUS" = "critical" ]; then
                print_warning "Job health is CRITICAL - alert should have been sent"
            elif [ "$STATUS" = "warning" ]; then
                print_warning "Job health is WARNING"
            elif [ "$STATUS" = "healthy" ]; then
                print_success "Job health is HEALTHY"
            fi
        fi
    else
        print_error "Health check function failed with status $HTTP_CODE"
        return 1
    fi

    print_success "Test 2 complete"
}

# ============================================================================
# Test 3: Job Metrics API
# ============================================================================

test_job_metrics_api() {
    print_header "Test 3: Job Metrics API"

    if [ -z "$PROJECT_REF" ]; then
        print_error "SUPABASE_PROJECT_REF not set"
        return 1
    fi

    METRICS_URL="https://${PROJECT_REF}.supabase.co/functions/v1/job-metrics?days=7&limit=5"

    print_info "Calling job metrics endpoint..."
    print_info "URL: $METRICS_URL"

    RESPONSE=$(curl -s -w "\n%{http_code}" "$METRICS_URL" 2>&1)
    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo ""

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Job metrics API responded successfully"

        # Parse metrics if jq is available
        if command -v jq >/dev/null 2>&1; then
            TOTAL_RUNS=$(echo "$BODY" | jq -r '.summary.totalRuns' 2>/dev/null || echo "unknown")
            SUCCESS_RATE=$(echo "$BODY" | jq -r '.summary.successRate' 2>/dev/null || echo "unknown")
            AVG_DURATION=$(echo "$BODY" | jq -r '.performance.avgDurationSeconds' 2>/dev/null || echo "unknown")

            echo "Total Runs (last 7 days): $TOTAL_RUNS"
            echo "Success Rate: $SUCCESS_RATE%"
            echo "Average Duration: ${AVG_DURATION}s"
        fi
    else
        print_error "Job metrics API failed with status $HTTP_CODE"
        return 1
    fi

    print_success "Test 3 complete"
}

# ============================================================================
# Test 4: Monitoring Queries
# ============================================================================

test_monitoring_queries() {
    print_header "Test 4: Monitoring Queries"

    if [ -z "$DB_URL" ]; then
        print_warning "DATABASE_URL not set - skipping database tests"
        return
    fi

    print_info "Testing query: Recent Job Executions..."

    psql "$DB_URL" -c "
        SELECT
            id,
            job_name,
            started_at,
            completed_at,
            (completed_at - started_at) AS duration,
            records_updated,
            status
        FROM jobs_log
        WHERE job_name = 'update-installment-statuses'
        ORDER BY started_at DESC
        LIMIT 5;
    " || {
        print_error "Failed to execute monitoring query"
        return 1
    }

    print_success "Query executed successfully"

    print_info "Testing query: Job Success Rate..."

    psql "$DB_URL" -c "
        SELECT
            COUNT(*) AS total_runs,
            COUNT(*) FILTER (WHERE status = 'success') AS successful_runs,
            COUNT(*) FILTER (WHERE status = 'failed') AS failed_runs,
            ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) AS success_rate
        FROM jobs_log
        WHERE job_name = 'update-installment-statuses'
            AND started_at > now() - INTERVAL '30 days';
    " || {
        print_error "Failed to execute success rate query"
        return 1
    }

    print_success "Test 4 complete"
}

# ============================================================================
# Test 5: End-to-End Job Execution
# ============================================================================

test_job_execution() {
    print_header "Test 5: End-to-End Job Execution"

    if [ -z "$PROJECT_REF" ] || [ -z "$SERVICE_ROLE_KEY" ]; then
        print_warning "SUPABASE_PROJECT_REF or SUPABASE_SERVICE_ROLE_KEY not set - skipping"
        return
    fi

    JOB_URL="https://${PROJECT_REF}.supabase.co/functions/v1/update-installment-statuses"

    print_info "Manually triggering job..."
    print_info "URL: $JOB_URL"

    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$JOB_URL" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        2>&1)

    HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
    echo ""
    echo "HTTP Status: $HTTP_CODE"
    echo ""

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Job executed successfully"

        # Parse response if jq is available
        if command -v jq >/dev/null 2>&1; then
            TOTAL_UPDATED=$(echo "$BODY" | jq -r '.totalUpdated' 2>/dev/null || echo "unknown")
            AGENCIES=$(echo "$BODY" | jq -r '.agenciesProcessed' 2>/dev/null || echo "unknown")

            echo "Total Records Updated: $TOTAL_UPDATED"
            echo "Agencies Processed: $AGENCIES"
        fi

        # Wait a moment then check job log
        print_info "Waiting 2 seconds then checking job log..."
        sleep 2

        if [ -n "$DB_URL" ]; then
            psql "$DB_URL" -c "
                SELECT
                    started_at,
                    completed_at,
                    records_updated,
                    status,
                    error_message
                FROM jobs_log
                WHERE job_name = 'update-installment-statuses'
                ORDER BY started_at DESC
                LIMIT 1;
            "
        fi
    else
        print_error "Job execution failed with status $HTTP_CODE"
        return 1
    fi

    print_success "Test 5 complete"
}

# ============================================================================
# Main Test Runner
# ============================================================================

run_all_tests() {
    print_header "Job Alert System Test Suite"
    echo "Starting comprehensive test suite..."
    echo "Date: $(date)"
    echo ""

    check_prerequisites

    # Run all tests
    test_job_failure_trigger
    test_health_check_function
    test_job_metrics_api
    test_monitoring_queries
    test_job_execution

    # Summary
    print_header "Test Suite Complete"
    echo "All automated tests completed."
    echo ""
    echo "Manual Verification Required:"
    echo "  1. Check Slack channel for test alert"
    echo "  2. Check email inbox for test alert"
    echo "  3. Review dashboard for updated metrics"
    echo ""
}

# ============================================================================
# CLI Interface
# ============================================================================

show_usage() {
    echo "Usage: $0 [test_name]"
    echo ""
    echo "Available tests:"
    echo "  all               Run all tests (default)"
    echo "  trigger           Test job failure alert trigger"
    echo "  health            Test health check function"
    echo "  metrics           Test job metrics API"
    echo "  queries           Test monitoring queries"
    echo "  execution         Test end-to-end job execution"
    echo ""
    echo "Environment variables required:"
    echo "  SUPABASE_PROJECT_REF      Supabase project reference ID"
    echo "  DATABASE_URL              PostgreSQL connection string (for DB tests)"
    echo "  SUPABASE_SERVICE_ROLE_KEY Service role key (for job execution test)"
    echo ""
    echo "Example:"
    echo "  export SUPABASE_PROJECT_REF=abcdefgh"
    echo "  export DATABASE_URL=postgresql://..."
    echo "  $0 all"
}

# Main execution
case "${1:-all}" in
    all)
        run_all_tests
        ;;
    trigger)
        check_prerequisites
        test_job_failure_trigger
        ;;
    health)
        check_prerequisites
        test_health_check_function
        ;;
    metrics)
        check_prerequisites
        test_job_metrics_api
        ;;
    queries)
        check_prerequisites
        test_monitoring_queries
        ;;
    execution)
        check_prerequisites
        test_job_execution
        ;;
    help|-h|--help)
        show_usage
        ;;
    *)
        echo "Unknown test: $1"
        show_usage
        exit 1
        ;;
esac

# ============================================================================
# End of Script
# ============================================================================
