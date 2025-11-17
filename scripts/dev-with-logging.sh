#!/bin/bash

# Color codes for better readability
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Create logs directory if it doesn't exist
LOGS_DIR="logs/dev"
mkdir -p "$LOGS_DIR"

# Generate timestamp for log files
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$LOGS_DIR/dev_${TIMESTAMP}.log"
ERROR_LOG="$LOGS_DIR/dev_errors_${TIMESTAMP}.log"

# Function to log with timestamp
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE" "$ERROR_LOG"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo -e "\n${MAGENTA}========================================${NC}" | tee -a "$LOG_FILE"
    echo -e "${MAGENTA}$1${NC}" | tee -a "$LOG_FILE"
    echo -e "${MAGENTA}========================================${NC}\n" | tee -a "$LOG_FILE"
}

# Start logging
log_section "Development Server Initialization Started"
log "Log file: $LOG_FILE"
log "Error log: $ERROR_LOG"

# Load nvm if available
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    source "$HOME/.nvm/nvm.sh"
    log "nvm loaded successfully"

    # Use Node version from .nvmrc if it exists
    if [ -f ".nvmrc" ]; then
        log "Found .nvmrc file, attempting to use specified Node version..."
        nvm use || {
            log_warning "Node version from .nvmrc not installed, installing now..."
            nvm install || log_error "Failed to install Node version from .nvmrc"
        }
    fi
fi

# Environment checks
log_section "Environment Information"
log "Node version: $(node --version)"
log "npm version: $(npm --version)"

# Check for pnpm
if command -v pnpm &> /dev/null; then
    log "pnpm version: $(pnpm --version)"
else
    log_warning "pnpm not found in PATH, attempting to use from configured location"
    export PNPM_HOME="/Users/brenttudas/Library/pnpm"
    export PATH="$PNPM_HOME:$PATH"
    if command -v pnpm &> /dev/null; then
        log "pnpm version: $(pnpm --version)"
    else
        log_error "pnpm not found! Please install pnpm: npm install -g pnpm"
        exit 1
    fi
fi

log "Current directory: $(pwd)"
log "Git branch: $(git branch --show-current 2>/dev/null || echo 'Not a git repository')"
log "Git status:"
git status --short 2>&1 | tee -a "$LOG_FILE"

# Check workspace packages
log_section "Workspace Packages Check"
log "Checking workspace packages..."
pnpm list --depth 0 2>&1 | tee -a "$LOG_FILE"

# Check for common issues
log_section "Pre-flight Checks"

# Check if node_modules exists
if [ -d "node_modules" ]; then
    log_success "node_modules directory exists"
else
    log_warning "node_modules directory not found"
fi

# Check each app's node_modules
for app in apps/*; do
    if [ -d "$app" ]; then
        app_name=$(basename "$app")
        if [ -d "$app/node_modules" ]; then
            log_success "✓ $app_name has node_modules"
        else
            log_warning "✗ $app_name missing node_modules"
        fi
    fi
done

# Check each package's node_modules
for pkg in packages/*; do
    if [ -d "$pkg" ]; then
        pkg_name=$(basename "$pkg")
        if [ -d "$pkg/node_modules" ]; then
            log_success "✓ $pkg_name has node_modules"
        else
            log_warning "✗ $pkg_name missing node_modules"
        fi
    fi
done

# Check for TypeScript configuration
log_section "TypeScript Configuration"
if [ -f "tsconfig.json" ]; then
    log_success "Root tsconfig.json found"
else
    log_warning "Root tsconfig.json not found"
fi

# Check turbo configuration
if [ -f "turbo.json" ]; then
    log_success "turbo.json found"
    log "Turbo configuration:"
    cat turbo.json | tee -a "$LOG_FILE"
else
    log_warning "turbo.json not found"
fi

# Start the development server
log_section "Starting Development Server"
log "Executing: pnpm dev"
log "Press Ctrl+C to stop the server"
log ""

# Run pnpm dev with output streaming
# Use tee to capture output to both console and log file
# Use stdbuf to disable buffering for real-time output
export PNPM_HOME="/Users/brenttudas/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"

# Trap SIGINT (Ctrl+C) to log shutdown
trap 'log_section "Development Server Stopped"; log "Server stopped by user"; exit 0' INT

# Run pnpm dev and capture output
pnpm dev 2>&1 | while IFS= read -r line; do
    echo "$line"
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $line" >> "$LOG_FILE"

    # Check for errors and log them separately
    if echo "$line" | grep -qiE "error|failed|exception|cannot|unable"; then
        echo "[$(date +'%Y-%m-%d %H:%M:%S')] $line" >> "$ERROR_LOG"
    fi
done

# Capture exit code
EXIT_CODE=$?

log_section "Development Server Exited"
log "Exit code: $EXIT_CODE"

if [ $EXIT_CODE -eq 0 ]; then
    log_success "Development server exited successfully"
else
    log_error "Development server exited with error code $EXIT_CODE"
fi
