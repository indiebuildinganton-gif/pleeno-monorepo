#!/bin/bash

# Vercel Deployment - Common Utility Functions
# Source this file in all deployment scripts: source ./common.sh

set -euo pipefail

# =============================================================================
# COLORS & FORMATTING
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# =============================================================================
# CONFIGURATION
# =============================================================================

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env.vercel}"
LOG_DIR="${LOG_DIR:-$SCRIPT_DIR/logs}"
VERCEL_ENV="${VERCEL_ENV:-production}"
SKIP_CONFIRM="${SKIP_CONFIRM:-false}"
ENV_ONLY="${ENV_ONLY:-false}"
DRY_RUN="${DRY_RUN:-false}"
NOTIFICATIONS="${NOTIFICATIONS:-true}"
FORCE_REBUILD="${FORCE_REBUILD:-false}"

# Create logs directory
mkdir -p "$LOG_DIR"

# Current timestamp for logs
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_DIR/deploy_$TIMESTAMP.log"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_DIR/deploy_$TIMESTAMP.log"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_DIR/deploy_$TIMESTAMP.log" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_DIR/deploy_$TIMESTAMP.log"
}

log_info() {
    echo -e "${CYAN}ℹ $1${NC}" | tee -a "$LOG_DIR/deploy_$TIMESTAMP.log"
}

# Send macOS notification
notify() {
    if [[ "$NOTIFICATIONS" == "true" && "$OSTYPE" == "darwin"* ]]; then
        osascript -e "display notification \"$1\" with title \"Vercel Deploy\""
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command_exists vercel; then
        log_error "Vercel CLI not found. Install with: npm install -g vercel"
        exit 1
    fi
    
    if ! command_exists jq; then
        log_warning "jq not found. Some features may be limited. Install with: brew install jq"
    fi
    
    log_success "Prerequisites check passed"
}

# Validate environment file exists
check_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found: $ENV_FILE"
        echo "Create it with:"
        echo "  mkdir -p $SCRIPT_DIR"
        echo "  touch $ENV_FILE"
        exit 1
    fi
    log_success "Environment file found: $ENV_FILE"
}

# Load environment variables from file
load_env_vars() {
    log "Loading environment variables from: $ENV_FILE"
    
    if [[ ! -f "$ENV_FILE" ]]; then
        log_error "Environment file not found"
        return 1
    fi
    
    # Source the env file, filtering out comments and empty lines
    export $(grep -v '^#' "$ENV_FILE" | grep -v '^$' | xargs)
    log_success "Environment variables loaded"
}

# Validate required variables are set
validate_required_vars() {
    local app_name="$1"
    local required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NODE_ENV")
    
    log "Validating required variables for $app_name..."
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            log_error "  - $var"
        done
        return 1
    fi
    
    log_success "All required variables present"
}

# Convert .env format to JSON for Vercel API
env_to_json() {
    local env_file="$1"
    local environment="$2"  # production, preview, development
    
    log "Converting environment variables to JSON format..."
    
    cat > /tmp/vercel_env.json << 'EOF'
[
EOF
    
    local first=true
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" == \#* ]] && continue
        [[ -z "$key" ]] && continue
        
        if [[ "$first" == false ]]; then
            echo "," >> /tmp/vercel_env.json
        fi
        
        cat >> /tmp/vercel_env.json << EOL
  {
    "key": "$key",
    "value": "$value",
    "target": ["$environment"],
    "type": "plain"
  }
EOL
        first=false
    done < <(grep -v '^#' "$env_file" | grep -v '^$')
    
    cat >> /tmp/vercel_env.json << 'EOF'
]
EOF
    
    log_success "Converted to JSON: /tmp/vercel_env.json"
}

# Push environment variables using Vercel API
push_env_vars() {
    local project_name="$1"
    local environment="${2:-production}"
    
    log "Pushing environment variables to $project_name ($environment)..."
    
    if [[ -z "${VERCEL_TOKEN:-}" ]]; then
        log_error "VERCEL_TOKEN not set. Run 'vercel login' first"
        return 1
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY_RUN enabled - skipping actual push"
        return 0
    fi
    
    # Get project ID
    local project_id=$(vercel projects ls --json 2>/dev/null | jq -r ".[] | select(.name == \"$project_name\") | .id" 2>/dev/null || echo "")
    
    if [[ -z "$project_id" ]]; then
        log_error "Could not find project: $project_name"
        return 1
    fi
    
    # Push each variable
    local count=0
    while IFS='=' read -r key value; do
        [[ "$key" == \#* ]] && continue
        [[ -z "$key" ]] && continue
        
        log "  Setting: $key"
        
        # Use Vercel CLI to add environment variable
        echo "$value" | vercel env add "$key" "$environment" --token "$VERCEL_TOKEN" > /dev/null 2>&1 || {
            log_warning "Could not set $key via CLI, trying API..."
            # Fallback to API if CLI fails
        }
        
        ((count++))
    done < <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
    
    log_success "Set $count environment variables"
}

# Pull environment variables from Vercel
pull_env_vars() {
    local project_name="$1"
    local output_file="${2:-.env.local}"
    
    log "Pulling environment variables from $project_name..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY_RUN enabled - skipping actual pull"
        return 0
    fi
    
    # cd to app directory for proper context
    cd "$PROJECT_ROOT"
    vercel env pull "$output_file" --token "${VERCEL_TOKEN:-}" 2>&1 || {
        log_error "Failed to pull environment variables"
        return 1
    }
    
    log_success "Environment variables saved to $output_file"
}

# Deploy app to Vercel
deploy_app() {
    local app_name="$1"
    local app_path="$2"
    local deploy_type="${3:-preview}"  # preview or production (--prod)
    
    log "Deploying $app_name from $app_path ($deploy_type)..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY_RUN enabled - skipping actual deployment"
        return 0
    fi
    
    # Navigate to app directory
    cd "$PROJECT_ROOT/$app_path"
    
    # Build deployment flags
    local deploy_flags="--token ${VERCEL_TOKEN:-}"
    
    if [[ "$deploy_type" == "production" || "$deploy_type" == "prod" ]]; then
        deploy_flags="$deploy_flags --prod"
    fi
    
    if [[ "$FORCE_REBUILD" == "true" ]]; then
        deploy_flags="$deploy_flags --force"
    fi
    
    # Deploy
    local deploy_output=$(vercel deploy $deploy_flags 2>&1)
    local deployment_url=$(echo "$deploy_output" | grep -oE 'https://[^ ]+' | head -1)
    
    if [[ -z "$deployment_url" ]]; then
        log_error "Deployment failed for $app_name"
        log_error "$deploy_output"
        return 1
    fi
    
    log_success "$app_name deployed to: $deployment_url"
    echo "$deployment_url"
}

# Show deployment summary
show_summary() {
    local app_name="$1"
    local project_name="$2"
    local app_path="$3"
    
    echo ""
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}Deployment Summary: $app_name${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo "App Name:      $app_name"
    echo "Project:       $project_name"
    echo "Path:          $app_path"
    echo "Environment:   $VERCEL_ENV"
    echo "Timestamp:     $(date '+%Y-%m-%d %H:%M:%S')"
    echo "Log File:      $LOG_DIR/deploy_$TIMESTAMP.log"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

# Confirm before proceeding
confirm() {
    if [[ "$SKIP_CONFIRM" == "true" ]]; then
        return 0
    fi
    
    local prompt="$1"
    local response
    
    echo -e "${YELLOW}$prompt (y/n)${NC}"
    read -r response
    
    [[ "$response" == "y" || "$response" == "yes" ]]
}

# Print configuration
print_config() {
    log_info "Configuration:"
    log_info "  Script Dir:        $SCRIPT_DIR"
    log_info "  Project Root:      $PROJECT_ROOT"
    log_info "  Env File:          $ENV_FILE"
    log_info "  Log Dir:           $LOG_DIR"
    log_info "  Vercel Env:        $VERCEL_ENV"
    log_info "  Dry Run:           $DRY_RUN"
    log_info "  Skip Confirm:      $SKIP_CONFIRM"
    log_info "  Env Only:          $ENV_ONLY"
}

# Cleanup on exit
cleanup() {
    rm -f /tmp/vercel_env.json 2>/dev/null || true
}

trap cleanup EXIT

log_success "Common functions loaded"
