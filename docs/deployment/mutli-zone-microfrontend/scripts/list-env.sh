#!/bin/bash

# Utility: List Environment Variables for a Project
# Usage: ./list-env.sh [app-name] [environment]
# Example: ./list-env.sh dashboard production

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_NAME="${1:-dashboard}"
ENVIRONMENT="${2:-production}"

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
    log_info "Listing environment variables"
    
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
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Environment Variables: $APP_NAME${NC}"
    echo -e "${CYAN}Project: $PROJECT_NAME${NC}"
    echo -e "${CYAN}Environment: $ENVIRONMENT${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    
    # List variables
    log "Fetching environment variables..."
    
    if vercel env ls "$ENVIRONMENT" --token "${VERCEL_TOKEN:-}" --project "$PROJECT_NAME" 2>/dev/null; then
        log_success "Variables listed above"
    else
        log_error "Failed to list environment variables"
        echo ""
        echo "Troubleshooting:"
        echo "  1. Verify VERCEL_TOKEN is set: echo \$VERCEL_TOKEN"
        echo "  2. Check project exists: vercel projects ls"
        echo "  3. Verify project name: $PROJECT_NAME"
        exit 1
    fi
    
    echo ""
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [app-name] [environment]

Arguments:
  app-name       One of: shell, dashboard, entities, payments, agency, reports
  environment    One of: production, preview, development (default: production)

Examples:
  $0 dashboard
  $0 dashboard production
  $0 shell preview
  $0 entities development

Environment Variables:
  VERCEL_TOKEN   Required for API access

EOF
}

# Check if help requested
if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
    show_usage
    exit 0
fi

# Run main function
main "$@"
