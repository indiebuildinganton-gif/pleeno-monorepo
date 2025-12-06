#!/bin/bash
# Script to set up environment variables for all Vercel projects

echo "========================================"
echo "Setting up Vercel Environment Variables"
echo "========================================"
echo ""
echo "This script will help you set environment variables for all 6 projects."
echo ""

# Get Supabase credentials from existing .env if available
if [ -f ".env" ]; then
    echo "Reading from existing .env file..."
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env | cut -d'=' -f2)
    SUPABASE_ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env | cut -d'=' -f2)
    SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env | cut -d'=' -f2)
    DATABASE_URL=$(grep "DATABASE_URL=" .env | cut -d'=' -f2)
fi

# Array of project names
PROJECTS=("pleeno-shell-prod" "pleeno-dashboard-prod" "pleeno-agency-prod" "pleeno-entities-prod" "pleeno-payments-prod" "pleeno-reports-prod")

# Function to add environment variables to a project
add_env_vars() {
    local project=$1
    echo "Setting environment variables for $project..."

    # Production environment variables
    npx vercel env add NEXT_PUBLIC_COOKIE_DOMAIN production --yes <<< ".plenno.com.au"
    npx vercel env add NEXT_PUBLIC_SHELL_URL production --yes <<< "https://shell.plenno.com.au"
    npx vercel env add NEXT_PUBLIC_APP_URL production --yes <<< "https://shell.plenno.com.au"
    npx vercel env add NEXT_PUBLIC_DASHBOARD_URL production --yes <<< "https://dashboard.plenno.com.au"
    npx vercel env add NEXT_PUBLIC_AGENCY_URL production --yes <<< "https://agency.plenno.com.au"
    npx vercel env add NEXT_PUBLIC_ENTITIES_URL production --yes <<< "https://entities.plenno.com.au"
    npx vercel env add NEXT_PUBLIC_PAYMENTS_URL production --yes <<< "https://payments.plenno.com.au"
    npx vercel env add NEXT_PUBLIC_REPORTS_URL production --yes <<< "https://reports.plenno.com.au"
    npx vercel env add NODE_ENV production --yes <<< "production"

    # Add Supabase variables if available
    if [ ! -z "$SUPABASE_URL" ]; then
        npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --yes <<< "$SUPABASE_URL"
    fi
    if [ ! -z "$SUPABASE_ANON_KEY" ]; then
        npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes <<< "$SUPABASE_ANON_KEY"
    fi
    if [ ! -z "$SUPABASE_SERVICE_KEY" ]; then
        npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --yes <<< "$SUPABASE_SERVICE_KEY"
    fi
    if [ ! -z "$DATABASE_URL" ]; then
        npx vercel env add DATABASE_URL production --yes <<< "$DATABASE_URL"
    fi

    echo "✅ Environment variables set for $project"
    echo ""
}

# Set up each project
for project in "${PROJECTS[@]}"; do
    echo "========================================"
    echo "Configuring: $project"
    echo "========================================"

    # Navigate to the project directory
    case $project in
        "pleeno-shell-prod")
            cd apps/shell
            ;;
        "pleeno-dashboard-prod")
            cd apps/dashboard
            ;;
        "pleeno-agency-prod")
            cd apps/agency
            ;;
        "pleeno-entities-prod")
            cd apps/entities
            ;;
        "pleeno-payments-prod")
            cd apps/payments
            ;;
        "pleeno-reports-prod")
            cd apps/reports
            ;;
    esac

    # Link the project to Vercel
    echo "Linking $project to Vercel..."
    npx vercel link --yes --project=$project

    # Add environment variables
    add_env_vars $project

    # Go back to root
    cd ../..
done

echo "========================================"
echo "Environment Variables Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Verify environment variables in Vercel Dashboard"
echo "2. Set up custom domains for each project"
echo "3. Deploy all projects"
echo ""