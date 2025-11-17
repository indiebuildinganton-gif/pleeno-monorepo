#!/bin/bash

# ============================================================
# Database Seeding Script
# ============================================================
# Seeds the local Supabase database with development data
# ============================================================

set -e

echo "=========================================="
echo "Seeding Pleeno Database"
echo "=========================================="

# Check if database is accessible
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Please install PostgreSQL client."
    exit 1
fi

# Database connection details (from supabase config.toml)
DB_HOST="localhost"
DB_PORT="54322"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASS="postgres"

# Set environment variable to avoid password prompt
export PGPASSWORD="$DB_PASS"

echo ""
echo "📊 Connecting to database..."
echo "   Host: $DB_HOST:$DB_PORT"
echo "   Database: $DB_NAME"
echo ""

# Test connection
if ! psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database."
    echo ""
    echo "Please ensure:"
    echo "  1. Supabase is running: npx supabase start"
    echo "  2. Database port 54322 is accessible"
    exit 1
fi

echo "✅ Database connection successful"
echo ""
echo "🌱 Running seed file..."
echo ""

# Run the seed file
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f supabase/seed.sql

echo ""
echo "✅ Seeding complete!"
echo ""
