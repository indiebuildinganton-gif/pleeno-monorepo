#!/bin/bash

# Utility: Pull Environment Variables from Vercel to Local File
# Usage: ./pull-env.sh [app-name] [output-file]
# Example: ./pull-env.sh dashboard .env.local

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_NAME="${1:-dashboard}"
OUTPUT_FILE="${2:-.env.local}"

declare -A PROJECT_MAP=(
    ["shell"]="pleeno-shell-uat"
    ["dashboard"]="pleeno-dashboard-uat"
    ["entities"]="pleeno-entities-uat"
    ["payments"]="pleeno-payments-uat"
    ["agency"]="pleeno-agency-uat"
    ["reports"]="pleeno-reports-uat"
)

# =============================================================================
# MAIN LOGIC
# =============================================================================

main() {
    log_info "Pulling environment variables from Vercel"
    
    # Check prerequisites
    check_prerequisites
    
    # Get project name from map
    if [[ -z "${PROJECT_MAP[$APP_NAME]:-}" ]]; then
        log_error "Unknown app: $APP_NAME"
        echo "Available apps:"
        for app in "${!PROJECT_MAP[@]}"; do
            echo "  - $app"
        done
        exit 1
    fi
    
    PROJECT_NAME="${PROJECT_MAP[$APP_NAME]}"
    APP_PATH="apps/$APP_NAME"
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Pull Environment Variables${NC}"
    echo -e "${CYAN}App: $APP_NAME${NC}"
    echo -e "${CYAN}Project: $PROJECT_NAME${NC}"
    echo -e "${CYAN}Output: $OUTPUT_FILE${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # Navigate to app directory
    cd "$PROJECT_ROOT/$APP_PATH"
    
    log "Pulling environment variables..."
    
    # Pull from Vercel
    if vercel env pull "$OUTPUT_FILE" --token "${VERCEL_TOKEN:-}" 2>&1; then
        log_success "Environment variables pulled successfully"
        log_success "File: $PWD/$OUTPUT_FILE"
        
        # Show variable count
        local var_count=$(grep -c '^[A-Z_]*=' "$OUTPUT_FILE" 2>/dev/null || echo 0)
        log_info "Variables loaded: $var_count"
        
        echo ""
        echo "Sample variables:"
        head -5 "$OUTPUT_FILE" | sed 's/=.*/=***/' | sed 's/^/  /'
        echo ""
    else
        log_error "Failed to pull environment variables"
        exit 1
    fi
    
    echo ""
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [app-name] [output-file]

Arguments:
  app-name       One of: shell, dashboard, entities, payments, agency, reports
  output-file    Output file path (default: .env.local)

Examples:
  $0 dashboard
  $0 dashboard .env.development
  $0 shell .env.production
  $0 entities env/.env

Environment Variables:
  VERCEL_TOKEN   Required for pulling from Vercel

Description:
  Downloads environment variables from a Vercel project and saves them to
  a local file. Useful for local development or backup.

Note:
  This pulls from the Development environment by default. For Production or
  Preview environments, you'll need to specify the branch or use the Vercel
  dashboard.

EOF
}

# Check if help requested
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"
