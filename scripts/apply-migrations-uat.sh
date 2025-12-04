#!/bin/bash

# Apply migrations to UAT Supabase database

echo "Applying migrations to UAT database..."

# Export access token
export SUPABASE_ACCESS_TOKEN=sbp_b1d0bbda96e96c2482e3adaf49958645f944f2f3

# Database URL
DB_URL="postgresql://postgres:hh8tP8TL2pQhCSst@db.ccmciliwfdtdspdlkuos.supabase.co:5432/postgres"

# Apply migrations using db push
echo "Pushing migrations to database..."
npx supabase db push --db-url "$DB_URL"

# Check migration status
echo ""
echo "Current migration status:"
npx supabase migration list --db-url "$DB_URL"

echo ""
echo "Migrations applied successfully!"