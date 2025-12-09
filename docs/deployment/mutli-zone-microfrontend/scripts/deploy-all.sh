#!/bin/bash

# Deploy All Apps to Vercel
# Usage: ./deploy-all.sh
# Deploys all 6 apps in the correct order with environment variables

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# CONFIGURATION
# =============================================================================

# Deployment order is important:
# 1. Child apps first (they don't depend on each other)
# 2. Then shell (depends on having all child URLs)

declare -a APPS=(
    "dashboard"
    "entities"
    "payments"
    "agency"
    "reports"
    "shell"
)

declare -a FAILED_APPS=()
declare -a SUCCESSFUL_APPS=()

# =============================================================================
# MAIN LOGIC
# =============================================================================

main() {
    log_info "Starting batch deployment of all apps"
    print_config
    
    # Check prerequisites once
    check_prerequisites
    check_env_file
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Deployment Plan${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo "Apps to deploy (in order):"
    for i in "${!APPS[@]}"; do
        echo "  $((i+1)). ${APPS[$i]}"
    done
    echo ""
    
    # Confirm before proceeding
    if ! confirm "Deploy all apps?"; then
        log_warning "Batch deployment cancelled by user"
        exit 0
    fi
    
    echo ""
    
    # Deploy each app
    for app in "${APPS[@]}"; do
        log_info "=== Deploying $app ==="
        
        if "$SCRIPT_DIR/deploy-$app.sh"; then
            SUCCESSFUL_APPS+=("$app")
            log_success "$app deployed successfully"
        else
            FAILED_APPS+=("$app")
            log_error "$app deployment failed"
        fi
        
        echo ""
        sleep 2  # Brief pause between deployments
    done
    
    # Print summary
    print_batch_summary
}

print_batch_summary() {
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Batch Deployment Summary${NC}"
    echo -e "${CYAN}========================================${NC}"
    
    echo -e "${GREEN}Successful (${#SUCCESSFUL_APPS[@]}):${NC}"
    for app in "${SUCCESSFUL_APPS[@]}"; do
        echo "  ✓ $app"
    done
    
    if [[ ${#FAILED_APPS[@]} -gt 0 ]]; then
        echo ""
        echo -e "${RED}Failed (${#FAILED_APPS[@]}):${NC}"
        for app in "${FAILED_APPS[@]}"; do
            echo "  ✗ $app"
        done
        
        notify "Batch deployment completed with errors. Check logs."
        exit 1
    fi
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${GREEN}All deployments completed successfully!${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Wait for DNS propagation (if first time)"
    echo "  2. Test shell: https://plenno.com.au"
    echo "  3. Test all routes:"
    echo "     - https://plenno.com.au/dashboard"
    echo "     - https://plenno.com.au/entities"
    echo "     - https://plenno.com.au/payments"
    echo "     - https://plenno.com.au/agency"
    echo "     - https://plenno.com.au/reports"
    echo ""
    echo "Log files: $LOG_DIR/deploy_*.log"
    echo ""
    
    notify "✓ All apps deployed successfully!"
}

# Run main function
main "$@"
