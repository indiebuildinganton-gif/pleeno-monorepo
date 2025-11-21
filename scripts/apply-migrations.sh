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
    docker exec -i $CONTAINER psql -v ON_ERROR_STOP=1 -U postgres -d postgres < "$file"
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
echo "=== Entities Domain ==="
run_sql_file "supabase/migrations/002_entities_domain/001_colleges_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/002_branches_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/003_college_contacts_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/003_students_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/004_college_notes_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/004_enrollments_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/005_student_notes_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/006_enrollments_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/006_student_documents_schema.sql"
run_sql_file "supabase/migrations/002_entities_domain/007_enrollments_rls.sql"
run_sql_file "supabase/migrations/002_entities_domain/007_entities_rls.sql"
run_sql_file "supabase/migrations/002_entities_domain/008_add_subscription_tier.sql"

run_sql_file "supabase/migrations/002_entities_domain/008_student_documents_storage.sql"
run_sql_file "supabase/migrations/002_entities_domain/009_college_activity_feed_function.sql"
run_sql_file "supabase/migrations/002_entities_domain/010_add_student_contact_preferences.sql"

echo ""
echo "=== Payments Domain ==="
run_sql_file "supabase/migrations/003_payments_domain/001_payment_plans_schema.sql"
run_sql_file "supabase/migrations/003_payments_domain/002_payment_plans_triggers.sql"
run_sql_file "supabase/migrations/003_payments_domain/003_audit_logs_metadata.sql"
run_sql_file "supabase/migrations/003_payments_domain/004_installments_schema.sql"
run_sql_file "supabase/migrations/003_payments_domain/005_payment_plans_extensions.sql"
run_sql_file "supabase/migrations/003_payments_domain/006_commission_calculation_functions.sql"
run_sql_file "supabase/migrations/003_payments_domain/007_commission_calculation_triggers.sql"
run_sql_file "supabase/migrations/003_payments_domain/008_payment_plans_wizard_fields.sql"
run_sql_file "supabase/migrations/003_payments_domain/009_manual_payment_recording_schema.sql"

echo ""
echo "=== Notifications Domain ==="
run_sql_file "supabase/migrations/004_notifications_domain/001_notifications_schema.sql"
run_sql_file "supabase/migrations/004_notifications_domain/002_add_metadata.sql"
run_sql_file "supabase/migrations/004_notifications_domain/fix_rls_recursion.sql"

echo ""
echo "=== Reports Domain ==="
run_sql_file "supabase/migrations/004_reports_domain/001_activity_log_schema.sql"
run_sql_file "supabase/migrations/004_reports_domain/002_update_installment_status_with_activity_logging.sql"
run_sql_file "supabase/migrations/004_reports_domain/003_activity_log_report_support.sql"
run_sql_file "supabase/migrations/004_reports_domain/004_commission_report_function.sql"

echo ""
echo "=== Fixes ==="
run_sql_file "supabase/migrations/005_fixes/001_fix_schema_mismatches.sql"

echo ""
echo "✅ All migrations applied successfully!"
echo ""

# Apply seed data if seed.sql exists
if [ -f "supabase/seed.sql" ]; then
    echo "=== Seeding Database ==="
    run_sql_file "supabase/seed.sql"
    echo ""
    echo "✅ Database seeded successfully!"
    echo ""
fi
