#!/bin/bash

# Deploy Shell App to Vercel
# Usage: ./deploy-shell.sh
# Environment: VERCEL_TOKEN (required), SKIP_CONFIRM, DRY_RUN, etc.

set -euo pipefail

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
source "$SCRIPT_DIR/common.sh"

# =============================================================================
# CONFIGURATION
# =============================================================================

APP_NAME="Shell"
PROJECT_NAME="pleeno-shell-uat"
APP_PATH="apps/shell"
DOMAIN="plenno.com.au"

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
    if [[ "$ENV_ONLY" != "true" ]]; then
        log "Step 1/2: Updating environment variables..."
        push_env_vars "$PROJECT_NAME" "production" || {
            log_error "Failed to update environment variables"
            exit 1
        }
        log_success "Environment variables updated"
    fi
    
    # Step 2: Deploy to Vercel
    if [[ "$ENV_ONLY" != "true" ]]; then
        log "Step 2/2: Deploying $APP_NAME..."
        
        # Shell should be deployed to production (custom domain)
        local deployment_url=$(deploy_app "$APP_NAME" "$APP_PATH" "production")
        
        if [[ -z "$deployment_url" ]]; then
            log_error "Deployment failed"
            notify "Deployment failed: $APP_NAME"
            exit 1
        fi
        
        log_success "Deployment successful!"
        log_info "URL: $deployment_url"
        log_info "Custom Domain: $DOMAIN (may take time to propagate)"
    fi
    
    # Success
    notify "✓ $APP_NAME deployed successfully"
    log_success "=== DEPLOYMENT COMPLETE ==="
    log_success "Next steps:"
    log_success "  1. Wait for DNS propagation (can take 5-60 minutes)"
    log_success "  2. Test at: https://$DOMAIN"
    log_success "  3. Verify rewrites work correctly"
}

# Run main function
main "$@"
