#!/bin/bash

# Deploy Agency App to Vercel
# Usage: ./deploy-agency.sh
# Environment: VERCEL_TOKEN (required), SKIP_CONFIRM, DRY_RUN, etc.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_NAME="Agency"
PROJECT_NAME="pleeno-agency-uat"
APP_PATH="apps/agency"

# =============================================================================
# MAIN DEPLOYMENT LOGIC
# =============================================================================

main() {
    log_info "Starting deployment of $APP_NAME"
    print_config
    
    # Check prerequisites
    check_prerequisites
    check_env_file
    load_env_vars
    validate_required_vars "$APP_NAME"
    
    # Show summary
    show_summary "$APP_NAME" "$PROJECT_NAME" "$APP_PATH"
    
    # Confirm before proceeding
    if ! confirm "Deploy $APP_NAME to Vercel?"; then
        log_warning "Deployment cancelled by user"
        exit 0
    fi
    
    # Step 1: Update environment variables
    log "Step 1/2: Updating environment variables..."
    push_env_vars "$PROJECT_NAME" "production" || {
        log_error "Failed to update environment variables"
        exit 1
    }
    log_success "Environment variables updated"
    
    # Step 2: Deploy to Vercel
    if [[ "$ENV_ONLY" != "true" ]]; then
        log "Step 2/2: Deploying $APP_NAME..."
        
        local deployment_url=$(deploy_app "$APP_NAME" "$APP_PATH" "preview")
        
        if [[ -z "$deployment_url" ]]; then
            log_error "Deployment failed"
            notify "Deployment failed: $APP_NAME"
            exit 1
        fi
        
        log_success "Deployment successful!"
        log_info "URL: $deployment_url"
    fi
    
    # Success
    notify "✓ $APP_NAME deployed successfully"
    log_success "=== DEPLOYMENT COMPLETE ==="
    log_success "Environment variable deployed: NEXT_PUBLIC_AGENCY_URL"
    log_success "Test at: https://plenno.com.au/agency"
}

# Run main function
main "$@"
