# Supabase UAT Environment Setup Guide

## Overview
This guide details the complete process of setting up a Supabase UAT environment using the Supabase CLI, including project creation, migration deployment, and data seeding.

## Prerequisites

### Install Supabase CLI
```bash
# macOS (using Homebrew)
brew install supabase/tap/supabase

# Or using npm/pnpm
pnpm add -D supabase --save-exact

# Verify installation
supabase --version
```

### Login to Supabase
```bash
# Login to your Supabase account
supabase login
```

## Step 1: Create UAT Supabase Project

### Option A: Using Supabase Dashboard (Recommended for initial setup)
1. Go to https://app.supabase.com
2. Create a new project named "pleeno-uat"
3. Choose a strong database password and save it securely
4. Select a region close to your users
5. Wait for project to be created (~2 minutes)
6. Note down the project reference ID (format: `abcdefghijklmnop`)

### Option B: Using Supabase CLI
```bash
# Create a new project (requires Supabase Pro plan)
supabase projects create pleeno-uat --db-password "your-secure-password" --region us-east-1
```

## Step 2: Link Local Project to UAT

```bash
# Navigate to your project root
cd /Users/brenttudas/Pleeno

# Link to the UAT project using project reference ID
supabase link --project-ref your-project-ref

# This will create/update the .supabase directory with project metadata
```

## Step 3: Deploy Migrations to UAT

### Prepare Migrations
First, ensure all your migrations are in the correct order:

```bash
# List all migrations
ls -la supabase/migrations/

# Combine all migrations into numbered files if needed
# The Supabase CLI expects migrations in format: YYYYMMDDHHMMSS_migration_name.sql
```

### Create Combined Migration Files
Since your migrations are in folders, create a script to combine them:

```bash
#!/bin/bash
# File: scripts/prepare-uat-migrations.sh

# Create a temporary migrations directory
mkdir -p supabase/uat-migrations

# Counter for migration numbering
counter=1

# Process each migration folder in order
for dir in supabase/migrations/*/; do
    if [[ -d "$dir" && "$dir" != *"drafts"* && "$dir" != *"MIGRATION_CHECKLIST"* ]]; then
        dirname=$(basename "$dir")

        # Create timestamp (using counter to ensure order)
        timestamp=$(date -u +"%Y%m%d%H%M")$(printf "%02d" $counter)

        # Combine all SQL files in the directory
        output_file="supabase/uat-migrations/${timestamp}_${dirname}.sql"

        echo "-- Migration: $dirname" > "$output_file"
        echo "-- Generated: $(date)" >> "$output_file"
        echo "" >> "$output_file"

        # Concatenate all .sql files in the directory
        for sql_file in "$dir"*.sql; do
            if [[ -f "$sql_file" ]]; then
                echo "-- Source: $(basename $sql_file)" >> "$output_file"
                cat "$sql_file" >> "$output_file"
                echo "" >> "$output_file"
            fi
        done

        echo "Created migration: $output_file"
        ((counter++))
    fi
done
```

### Deploy Migrations

```bash
# Deploy all migrations to UAT
supabase db push --linked

# Or deploy specific migrations
supabase migration up --linked

# Verify migrations were applied
supabase migration list --linked
```

## Step 4: Apply Seed Data

### Option A: Direct Seed File Execution
```bash
# Apply the seed file directly to UAT database
supabase db seed --linked -f supabase/seed.sql
```

### Option B: Using psql Command
```bash
# Get the database URL
supabase status --linked

# Use psql to apply seed
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f supabase/seed.sql
```

### Option C: Create UAT-Specific Seed
Create a UAT-specific seed file with test data:

```bash
# Create UAT seed file
cp supabase/seed.sql supabase/seed.uat.sql

# Edit to add UAT-specific test data
# Then apply:
supabase db seed --linked -f supabase/seed.uat.sql
```

## Step 5: Configure Environment Variables

### Get UAT Project Credentials
```bash
# Get all project details
supabase status --linked

# This will output:
# - API URL
# - Anon Key
# - Service Role Key
# - Database URL
```

### Update .env.uat File
```bash
# Update your .env.uat with the new Supabase project details
cat > .env.uat << 'EOF'
# Supabase Configuration - UAT Project
NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_ENVIRONMENT=uat

# Multi-Zone URLs (update after Vercel deployment)
NEXT_PUBLIC_APP_URL=https://pleeno-shell-uat.vercel.app
NEXT_PUBLIC_DASHBOARD_URL=https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL=https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL=https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL=https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL=https://pleeno-reports-uat.vercel.app
EOF
```

## Step 6: Configure Storage Buckets

```bash
# Create storage buckets if your app uses them
supabase storage create avatars --public --linked
supabase storage create documents --linked
supabase storage create reports --linked
```

## Step 7: Set Up Edge Functions (if applicable)

```bash
# Deploy edge functions to UAT
supabase functions deploy --linked

# Or deploy specific function
supabase functions deploy function-name --linked
```

## Step 8: Configure Authentication

### Set Authentication Providers
```bash
# Configure auth settings via Supabase Dashboard
# Go to Authentication > Providers and configure:
# - Email/Password
# - OAuth providers (Google, GitHub, etc.)
# - Magic Links
```

### Set Redirect URLs for UAT
In Supabase Dashboard > Authentication > URL Configuration:
```
Site URL: https://pleeno-shell-uat.vercel.app
Redirect URLs:
- https://pleeno-shell-uat.vercel.app/*
- https://pleeno-dashboard-uat.vercel.app/*
- https://pleeno-agency-uat.vercel.app/*
- https://pleeno-entities-uat.vercel.app/*
- https://pleeno-payments-uat.vercel.app/*
- https://pleeno-reports-uat.vercel.app/*
```

## Automation Scripts

### Complete UAT Setup Script
Create `scripts/setup-supabase-uat.sh`:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Setting up Supabase UAT Environment${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}Supabase CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if logged in
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}Please login to Supabase first${NC}"
    supabase login
fi

# Get project reference
echo -e "${YELLOW}Enter your UAT Supabase project reference ID:${NC}"
read PROJECT_REF

# Link project
echo -e "${GREEN}Linking to UAT project...${NC}"
supabase link --project-ref $PROJECT_REF

# Deploy migrations
echo -e "${GREEN}Deploying migrations...${NC}"
supabase db push --linked

# Apply seed data
echo -e "${GREEN}Applying seed data...${NC}"
supabase db seed --linked -f supabase/seed.sql

# Get credentials
echo -e "${GREEN}Getting project credentials...${NC}"
supabase status --linked > .uat-credentials.txt

echo -e "${GREEN}UAT Setup Complete!${NC}"
echo -e "${YELLOW}Credentials saved to .uat-credentials.txt${NC}"
echo -e "${YELLOW}Please update your .env.uat file with these credentials${NC}"
```

### Migration Sync Script
Create `scripts/sync-uat-migrations.sh`:

```bash
#!/bin/bash

echo "Syncing migrations to UAT..."

# Push any new migrations
supabase db push --linked --dry-run

echo "Review the changes above. Continue? (y/n)"
read confirm

if [ "$confirm" = "y" ]; then
    supabase db push --linked
    echo "Migrations synced successfully!"
else
    echo "Migration sync cancelled."
fi
```

### Reset UAT Database Script
Create `scripts/reset-uat-database.sh`:

```bash
#!/bin/bash

echo "WARNING: This will reset the UAT database. Continue? (type 'reset-uat' to confirm)"
read confirm

if [ "$confirm" = "reset-uat" ]; then
    # Reset database
    supabase db reset --linked

    # Reapply seed
    supabase db seed --linked -f supabase/seed.sql

    echo "UAT database reset complete!"
else
    echo "Reset cancelled."
fi
```

## Monitoring and Maintenance

### Check Migration Status
```bash
# List all applied migrations
supabase migration list --linked

# Check database status
supabase db diff --linked
```

### View Logs
```bash
# View database logs
supabase db logs --linked

# View function logs (if using edge functions)
supabase functions logs function-name --linked
```

### Backup UAT Database
```bash
# Create a backup
supabase db dump --linked -f backups/uat-backup-$(date +%Y%m%d).sql

# Restore from backup
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres" -f backups/uat-backup-20231204.sql
```

## Troubleshooting

### Migration Errors
If migrations fail:
1. Check migration order dependencies
2. Verify SQL syntax
3. Check for missing tables/columns referenced
4. Use `--debug` flag for detailed output

### Connection Issues
```bash
# Test connection
supabase status --linked

# Reset link if needed
supabase unlink
supabase link --project-ref your-project-ref
```

### Seed Data Issues
1. Check foreign key constraints
2. Verify required tables exist
3. Ensure data types match
4. Consider using transactions in seed file

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Supabase UAT

on:
  push:
    branches: [uat]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Deploy Migrations
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_UAT_PROJECT_REF }}
          supabase db push --linked
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
```

## Environment Variable Update for Vercel

After setting up Supabase UAT, update Vercel environment variables:

```bash
# Update all Vercel projects with new Supabase credentials
./scripts/update-vercel-supabase-env.sh
```

Create `scripts/update-vercel-supabase-env.sh`:
```bash
#!/bin/bash

# Get Supabase credentials
SUPABASE_URL=$(supabase status --linked | grep "API URL" | awk '{print $3}')
ANON_KEY=$(supabase status --linked | grep "anon key" | awk '{print $3}')
SERVICE_KEY=$(supabase status --linked | grep "service_role key" | awk '{print $2}')

zones=("shell" "dashboard" "agency" "entities" "payments" "reports")

for zone in "${zones[@]}"; do
    echo "Updating $zone with new Supabase credentials..."

    vercel link --project="pleeno-${zone}-uat" --yes

    printf "$SUPABASE_URL\nn\n" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
    printf "$ANON_KEY\nn\n" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force
    printf "$SERVICE_KEY\nn\n" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force
done

echo "All zones updated with new Supabase credentials!"
```

## Summary

Key steps for Supabase UAT setup:
1. Create UAT project in Supabase Dashboard
2. Link local project using CLI
3. Deploy migrations using `supabase db push`
4. Apply seed data
5. Update environment variables
6. Configure authentication settings
7. Update Vercel deployments with new credentials

This provides a complete UAT environment that mirrors your local development setup with isolated data and configurations.