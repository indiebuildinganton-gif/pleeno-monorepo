#!/bin/bash

# This script creates clean UAT migration files from the original backup migrations
# Each output file will be complete and runnable without errors

echo "Creating clean UAT migration files..."
echo ""

# Create output directory
OUTPUT_DIR="supabase/migrations-uat-final"
rm -rf $OUTPUT_DIR
mkdir -p $OUTPUT_DIR

# Track file count
FILE_NUM=1

# Function to create a migration file with proper formatting
create_migration() {
    local filename=$1
    local title=$2
    local output_file=$(printf "%02d_%s.sql" $FILE_NUM "$filename")

    echo "Creating $output_file - $title"

    echo "-- ======================================" > "$OUTPUT_DIR/$output_file"
    echo "-- Migration $FILE_NUM: $title" >> "$OUTPUT_DIR/$output_file"
    echo "-- ======================================" >> "$OUTPUT_DIR/$output_file"
    echo "" >> "$OUTPUT_DIR/$output_file"
    echo "BEGIN;" >> "$OUTPUT_DIR/$output_file"
    echo "" >> "$OUTPUT_DIR/$output_file"

    FILE_NUM=$((FILE_NUM + 1))
}

# ===========================
# 01: Extensions
# ===========================
create_migration "extensions" "Enable Required Extensions"
cat >> "$OUTPUT_DIR/01_extensions.sql" << 'EOF'
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable HTTP extension for Edge Functions
CREATE EXTENSION IF NOT EXISTS "http";

-- Enable pg_cron for scheduled jobs (may already be enabled)
DO $$
BEGIN
    CREATE EXTENSION IF NOT EXISTS "pg_cron";
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron extension already exists or cannot be created';
END $$;

-- Enable pg_net for network requests
CREATE EXTENSION IF NOT EXISTS "pg_net";

COMMIT;
EOF

# ===========================
# 02: Agency Domain
# ===========================
create_migration "agency_domain" "Agency Domain - Core Tables"
echo "-- Combining agency domain migrations..." >> "$OUTPUT_DIR/02_agency_domain.sql"
echo "" >> "$OUTPUT_DIR/02_agency_domain.sql"

# Concatenate agency domain files in order
for file in supabase/migrations-backup/001_agency_domain/*.sql; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        # Skip certain problematic files
        if [[ "$filename" != *"README"* ]] && [[ "$filename" != *"test"* ]]; then
            echo "-- Source: $filename" >> "$OUTPUT_DIR/02_agency_domain.sql"
            echo "" >> "$OUTPUT_DIR/02_agency_domain.sql"
            cat "$file" >> "$OUTPUT_DIR/02_agency_domain.sql"
            echo "" >> "$OUTPUT_DIR/02_agency_domain.sql"
            echo "" >> "$OUTPUT_DIR/02_agency_domain.sql"
        fi
    fi
done

# Add the 002_agency_domain updates
if [ -d "supabase/migrations-backup/002_agency_domain" ]; then
    for file in supabase/migrations-backup/002_agency_domain/*.sql; do
        if [[ -f "$file" ]]; then
            echo "-- Source: 002_agency_domain/$(basename "$file")" >> "$OUTPUT_DIR/02_agency_domain.sql"
            echo "" >> "$OUTPUT_DIR/02_agency_domain.sql"
            cat "$file" >> "$OUTPUT_DIR/02_agency_domain.sql"
            echo "" >> "$OUTPUT_DIR/02_agency_domain.sql"
        fi
    done
fi

echo "COMMIT;" >> "$OUTPUT_DIR/02_agency_domain.sql"

# ===========================
# 03: Entities Domain
# ===========================
create_migration "entities_domain" "Entities Domain - Colleges, Students, Enrollments"
echo "-- Combining entities domain migrations..." >> "$OUTPUT_DIR/03_entities_domain.sql"
echo "" >> "$OUTPUT_DIR/03_entities_domain.sql"

for file in supabase/migrations-backup/002_entities_domain/*.sql; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        if [[ "$filename" != *"README"* ]] && [[ "$filename" != *"test"* ]]; then
            echo "-- Source: $filename" >> "$OUTPUT_DIR/03_entities_domain.sql"
            echo "" >> "$OUTPUT_DIR/03_entities_domain.sql"
            cat "$file" >> "$OUTPUT_DIR/03_entities_domain.sql"
            echo "" >> "$OUTPUT_DIR/03_entities_domain.sql"
            echo "" >> "$OUTPUT_DIR/03_entities_domain.sql"
        fi
    fi
done

echo "COMMIT;" >> "$OUTPUT_DIR/03_entities_domain.sql"

# ===========================
# 04: Payments Domain
# ===========================
create_migration "payments_domain" "Payments Domain - Payment Plans and Installments"
echo "-- Combining payments domain migrations..." >> "$OUTPUT_DIR/04_payments_domain.sql"
echo "" >> "$OUTPUT_DIR/04_payments_domain.sql"

for file in supabase/migrations-backup/003_payments_domain/*.sql; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        if [[ "$filename" != *"README"* ]] && [[ "$filename" != *"test"* ]]; then
            echo "-- Source: $filename" >> "$OUTPUT_DIR/04_payments_domain.sql"
            echo "" >> "$OUTPUT_DIR/04_payments_domain.sql"
            cat "$file" >> "$OUTPUT_DIR/04_payments_domain.sql"
            echo "" >> "$OUTPUT_DIR/04_payments_domain.sql"
            echo "" >> "$OUTPUT_DIR/04_payments_domain.sql"
        fi
    fi
done

echo "COMMIT;" >> "$OUTPUT_DIR/04_payments_domain.sql"

# ===========================
# 05: Jobs Infrastructure (without rollback)
# ===========================
create_migration "jobs_infrastructure" "Jobs Infrastructure and Status Updates"
echo "-- Jobs infrastructure for automated tasks" >> "$OUTPUT_DIR/05_jobs_infrastructure.sql"
echo "" >> "$OUTPUT_DIR/05_jobs_infrastructure.sql"

# Only include the forward migration, not the .down.sql
if [ -f "supabase/migrations-backup/004_notifications_domain/001_jobs_infrastructure.sql" ]; then
    cat "supabase/migrations-backup/004_notifications_domain/001_jobs_infrastructure.sql" >> "$OUTPUT_DIR/05_jobs_infrastructure.sql"
fi

echo "" >> "$OUTPUT_DIR/05_jobs_infrastructure.sql"
echo "COMMIT;" >> "$OUTPUT_DIR/05_jobs_infrastructure.sql"

# ===========================
# 06: Notifications System
# ===========================
create_migration "notifications" "Notifications System"
echo "-- Notifications tables and functions" >> "$OUTPUT_DIR/06_notifications.sql"
echo "" >> "$OUTPUT_DIR/06_notifications.sql"

# Add notification system files (skip rollback and infrastructure)
for file in supabase/migrations-backup/004_notifications_domain/*.sql; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        # Skip down migrations, infrastructure (already done), and test files
        if [[ "$filename" != *"down.sql" ]] && \
           [[ "$filename" != "001_jobs_infrastructure.sql" ]] && \
           [[ "$filename" != *"test"* ]] && \
           [[ "$filename" != *"verify"* ]]; then
            echo "-- Source: $filename" >> "$OUTPUT_DIR/06_notifications.sql"
            echo "" >> "$OUTPUT_DIR/06_notifications.sql"
            cat "$file" >> "$OUTPUT_DIR/06_notifications.sql"
            echo "" >> "$OUTPUT_DIR/06_notifications.sql"
            echo "" >> "$OUTPUT_DIR/06_notifications.sql"
        fi
    fi
done

echo "COMMIT;" >> "$OUTPUT_DIR/06_notifications.sql"

# ===========================
# 07: Reports and Activity Log
# ===========================
create_migration "reports" "Reports and Activity Log"
echo "-- Reports domain tables and functions" >> "$OUTPUT_DIR/07_reports.sql"
echo "" >> "$OUTPUT_DIR/07_reports.sql"

for file in supabase/migrations-backup/004_reports_domain/*.sql; do
    if [[ -f "$file" ]]; then
        filename=$(basename "$file")
        if [[ "$filename" != *"README"* ]] && [[ "$filename" != *"test"* ]]; then
            echo "-- Source: $filename" >> "$OUTPUT_DIR/07_reports.sql"
            echo "" >> "$OUTPUT_DIR/07_reports.sql"
            cat "$file" >> "$OUTPUT_DIR/07_reports.sql"
            echo "" >> "$OUTPUT_DIR/07_reports.sql"
            echo "" >> "$OUTPUT_DIR/07_reports.sql"
        fi
    fi
done

echo "COMMIT;" >> "$OUTPUT_DIR/07_reports.sql"

# ===========================
# 08: Fixes
# ===========================
create_migration "fixes" "Various Fixes and Updates"
echo "-- Various fixes and schema updates" >> "$OUTPUT_DIR/08_fixes.sql"
echo "" >> "$OUTPUT_DIR/08_fixes.sql"

# Add fixes
if [ -d "supabase/migrations-backup/005_fixes" ]; then
    for file in supabase/migrations-backup/005_fixes/*.sql; do
        if [[ -f "$file" ]]; then
            echo "-- Source: 005_fixes/$(basename "$file")" >> "$OUTPUT_DIR/08_fixes.sql"
            echo "" >> "$OUTPUT_DIR/08_fixes.sql"
            cat "$file" >> "$OUTPUT_DIR/08_fixes.sql"
            echo "" >> "$OUTPUT_DIR/08_fixes.sql"
        fi
    done
fi

# Add student payment history
if [ -d "supabase/migrations-backup/007_student_payment_history" ]; then
    for file in supabase/migrations-backup/007_student_payment_history/*.sql; do
        if [[ -f "$file" ]]; then
            echo "-- Source: 007_student_payment_history/$(basename "$file")" >> "$OUTPUT_DIR/08_fixes.sql"
            echo "" >> "$OUTPUT_DIR/08_fixes.sql"
            cat "$file" >> "$OUTPUT_DIR/08_fixes.sql"
            echo "" >> "$OUTPUT_DIR/08_fixes.sql"
        fi
    done
fi

echo "COMMIT;" >> "$OUTPUT_DIR/08_fixes.sql"

# ===========================
# Summary
# ===========================
echo ""
echo "======================================"
echo "UAT Migration Files Created"
echo "======================================"
echo ""
echo "Files created in: $OUTPUT_DIR"
ls -lh $OUTPUT_DIR/*.sql | awk '{print "  " $9 " (" $5 ")"}'
echo ""
echo "To deploy to UAT:"
echo "1. Run each file in order in Supabase SQL Editor"
echo "2. Start with 01_extensions.sql"
echo "3. Continue through to 08_fixes.sql"
echo "4. After all migrations, run your seed.sql file"
echo ""
echo "Each file is wrapped in BEGIN/COMMIT for safety."