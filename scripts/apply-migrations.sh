#!/bin/bash

# ============================================================
# Apply Migrations to Local Supabase
# ============================================================
# This script applies all migrations in the correct order
# by running them directly against the database
# ============================================================

set -e

echo "=========================================="
echo "Applying Pleeno Migrations"
echo "=========================================="

# Database connection details
DB_HOST="127.0.0.1"
DB_PORT="54322"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASS="postgres"

export PGPASSWORD="$DB_PASS"

# Check if we can connect (using docker exec since psql not available)
echo ""
echo "Checking database connection..."

# Apply migrations using docker exec
echo ""
echo "Applying migrations in order..."
echo ""

# Get the Supabase db container name
CONTAINER=$(docker ps --format "{{.Names}}" | grep "supabase_db_" | head -1)

if [ -z "$CONTAINER" ]; then
    echo "❌ Error: Supabase postgres container not found"
    echo "Please run: npx supabase start"
    exit 1
fi

echo "Using container: $CONTAINER"
echo ""

# Function to run SQL file in docker
run_sql_file() {
    local file=$1
    echo "  📄 $(basename $file)"
    docker exec -i $CONTAINER psql -U postgres -d postgres < "$file"
}

# Apply migrations in order
echo "=== Foundation ==="
run_sql_file "supabase/migrations/000_foundation/00000000000000_initial_setup.sql"

echo ""
echo "=== Agency Domain ==="
run_sql_file "supabase/migrations/001_agency_domain/001_agencies_schema.sql"
run_sql_file "supabase/migrations/001_agency_domain/002_users_schema.sql"
run_sql_file "supabase/migrations/001_agency_domain/003_agency_rls.sql"
run_sql_file "supabase/migrations/001_agency_domain/004_users_rls.sql"
run_sql_file "supabase/migrations/001_agency_domain/005_context_functions.sql"
run_sql_file "supabase/migrations/001_agency_domain/005_rls_helpers.sql"
run_sql_file "supabase/migrations/001_agency_domain/006_email_verification.sql"
run_sql_file "supabase/migrations/001_agency_domain/006_invitations_schema.sql"
run_sql_file "supabase/migrations/001_agency_domain/006_users_status.sql"
run_sql_file "supabase/migrations/001_agency_domain/007_audit_triggers.sql"
run_sql_file "supabase/migrations/001_agency_domain/008_seed_master_tasks.sql"
run_sql_file "supabase/migrations/001_agency_domain/009_add_task_ids_to_invitations.sql"
run_sql_file "supabase/migrations/001_agency_domain/010_add_agency_timezone_fields.sql"

echo ""
echo "=== Notifications Domain ==="
run_sql_file "supabase/migrations/004_notifications_domain/001_notifications_schema.sql"
run_sql_file "supabase/migrations/004_notifications_domain/002_add_metadata.sql"
run_sql_file "supabase/migrations/004_notifications_domain/fix_rls_recursion.sql"

echo ""
echo "✅ All migrations applied successfully!"
echo ""
