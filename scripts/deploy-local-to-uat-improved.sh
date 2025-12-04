#!/bin/bash

# ======================================================================
# Improved UAT Deployment Script with Better Error Handling
# ======================================================================
# Purpose: Deploy local Supabase database schema and data to UAT
# Date: December 2024
# ======================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_error() { echo -e "${RED}✗ $1${NC}" >&2; }
print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_warning() { echo -e "${YELLOW}⚠ $1${NC}"; }
print_info() { echo -e "ℹ $1"; }

# Function to check if local Supabase is healthy
check_local_supabase() {
    print_info "Checking local Supabase health..."

    # Check if containers are running
    if ! docker ps | grep -q "supabase_db_pleeno-local"; then
        print_error "Local Supabase database container is not running"
        print_info "Attempting to start Supabase..."
        npx supabase start

        # Wait for database to be ready
        for i in {1..30}; do
            if docker ps | grep -q "supabase_db_pleeno-local.*healthy"; then
                print_success "Local Supabase is now healthy"
                return 0
            fi
            echo -n "."
            sleep 2
        done

        print_error "Failed to start local Supabase after 60 seconds"
        exit 1
    fi

    # Check if database is healthy
    if ! docker ps | grep -q "supabase_db_pleeno-local.*healthy"; then
        print_warning "Local database is unhealthy, attempting restart..."
        npx supabase stop
        sleep 5
        npx supabase start
        sleep 10
    fi

    print_success "Local Supabase is healthy"
}

# Function to check Docker space
check_docker_space() {
    print_info "Checking Docker disk usage..."

    # Get Docker disk usage
    DOCKER_USAGE=$(docker system df --format "table {{.Type}}\t{{.Size}}\t{{.Reclaimable}}" | grep -E "Images|Containers|Volumes" || true)

    if [ -n "$DOCKER_USAGE" ]; then
        echo "$DOCKER_USAGE"

        # Check if cleanup is needed (more than 10GB of reclaimable space)
        RECLAIMABLE=$(docker system df --format json | jq -r '.[].Reclaimable' | head -1 | sed 's/GB//' | cut -d' ' -f1)
        if [ "${RECLAIMABLE%%.*}" -gt 10 ] 2>/dev/null; then
            print_warning "Docker has significant reclaimable space. Consider running: docker system prune -a"
        fi
    fi
}

# Get UAT project configuration
UAT_PROJECT_ID="${SUPABASE_UAT_PROJECT_ID:-ccmciliwfdtdspdlkuos}"
UAT_DB_PASSWORD="${SUPABASE_UAT_DB_PASSWORD:-hh8tP8TL2pQhCSst}"

# Validate environment
if [ -z "$UAT_PROJECT_ID" ]; then
    print_error "UAT_PROJECT_ID is not set"
    exit 1
fi

if [ -z "$UAT_DB_PASSWORD" ]; then
    print_error "UAT_DB_PASSWORD is not set"
    exit 1
fi

# Main deployment process
main() {
    print_info "Starting UAT deployment process..."
    echo "========================================"

    # Step 0: Pre-flight checks
    check_docker_space
    check_local_supabase

    # Step 1: Generate migration from local database
    print_info "Step 1: Generating migration from local database"

    # Create migrations backup
    if [ -d "supabase/migrations-backup-$(date +%Y%m%d)" ]; then
        rm -rf "supabase/migrations-backup-$(date +%Y%m%d)"
    fi
    cp -r supabase/migrations "supabase/migrations-backup-$(date +%Y%m%d)"

    # Generate new migration
    MIGRATION_NAME="deploy_$(date +%Y%m%d_%H%M%S)"
    if npx supabase db diff -f "${MIGRATION_NAME}" --local; then
        print_success "Migration generated: ${MIGRATION_NAME}"

        # Check if migration file was actually created
        MIGRATION_FILE="supabase/migrations/*${MIGRATION_NAME}.sql"
        if ! ls $MIGRATION_FILE 1> /dev/null 2>&1; then
            print_warning "No migration file was created (database might be in sync)"
        fi
    else
        print_warning "No differences found or migration generation failed"
    fi

    # Step 2: Link to UAT project
    print_info "Step 2: Linking to UAT project"
    npx supabase link --project-ref "$UAT_PROJECT_ID" --password "$UAT_DB_PASSWORD" || {
        print_error "Failed to link to UAT project"
        exit 1
    }
    print_success "Linked to UAT project"

    # Step 3: Choose deployment method
    echo ""
    echo "Choose deployment method:"
    echo "1. Preview changes (dry run)"
    echo "2. Deploy incrementally (apply new migrations)"
    echo "3. Reset and deploy (CAUTION: clears remote database)"
    echo "4. Cancel"
    read -p "Enter choice (1-4): " choice

    case $choice in
        1)
            print_info "Previewing changes..."
            npx supabase db push --dry-run
            ;;
        2)
            print_info "Deploying incrementally..."

            # Apply migrations
            if npx supabase db push; then
                print_success "Migrations applied successfully"
            else
                print_error "Failed to apply migrations"
                exit 1
            fi

            # Apply seed if requested
            read -p "Apply seed data? (y/N): " apply_seed
            if [ "$apply_seed" = "y" ] || [ "$apply_seed" = "Y" ]; then
                if [ -f "supabase/seed.sql" ]; then
                    print_info "Applying seed data..."
                    npx supabase db push --include-seed
                    print_success "Seed data applied"
                else
                    print_warning "No seed.sql file found"
                fi
            fi
            ;;
        3)
            print_warning "WARNING: This will DELETE all data in the remote database!"
            echo -n "Type 'RESET-UAT' to confirm: "
            read confirmation
            if [ "$confirmation" != "RESET-UAT" ]; then
                print_info "Cancelled"
                exit 0
            fi

            print_info "Resetting remote database..."
            if npx supabase db reset --linked; then
                print_success "Remote database reset complete"
            else
                print_error "Failed to reset remote database"
                exit 1
            fi
            ;;
        4)
            print_info "Deployment cancelled"
            exit 0
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac

    # Step 4: Verify deployment
    print_info "Verifying deployment..."

    # Check if we can connect to remote database
    if npx supabase db remote list 2>/dev/null | grep -q "tables"; then
        print_success "Successfully connected to remote database"

        # Get table count
        TABLE_COUNT=$(npx supabase db remote list 2>/dev/null | grep -c "│" || echo "0")
        print_info "Remote database has approximately $((TABLE_COUNT / 2)) tables"
    else
        print_warning "Could not verify remote database connection"
    fi

    # Final summary
    echo ""
    echo "========================================"
    print_success "Deployment process complete!"
    echo ""
    echo "Next steps:"
    echo "1. Test the UAT environment at: https://${UAT_PROJECT_ID}.supabase.co"
    echo "2. Check the Supabase dashboard for any issues"
    echo "3. Update Vercel environment variables if needed"
    echo ""

    # Show migration files created
    if ls supabase/migrations/*${MIGRATION_NAME}.sql 1> /dev/null 2>&1; then
        echo "Migration files created:"
        ls -la supabase/migrations/*${MIGRATION_NAME}.sql
    fi
}

# Error handler
trap 'print_error "An error occurred on line $LINENO. Exiting..."; exit 1' ERR

# Run main function
main "$@"