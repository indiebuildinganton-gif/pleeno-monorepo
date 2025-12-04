#!/bin/bash

# Fix environment variables for all zones

zones=("shell" "dashboard" "agency" "entities" "payments" "reports")

# Define all environment variables
add_env_vars() {
    local project=$1
    local zone_name=$2

    echo "Adding environment variables to $project..."

    # Supabase
    printf "https://iadhxztsuzbkbnhkimqv.supabase.co\nn\n" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force
    printf "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZGh4enRzdXpia2JuaGtpbXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTY5NjQsImV4cCI6MjA3ODg3Mjk2NH0.7XA-XC_Dozv_GwtOpivaUBmUMUJmEpawkKx7JnCPLxU\nn\n" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force

    # Application
    printf "production\nn\n" | vercel env add NODE_ENV production --force
    printf "uat\nn\n" | vercel env add NEXT_PUBLIC_ENVIRONMENT production --force

    # Zone URLs
    printf "https://pleeno-shell-m7l6t7im1-antons-projects-1b1c34d6.vercel.app\nn\n" | vercel env add NEXT_PUBLIC_APP_URL production --force
    printf "https://pleeno-dashboard-5xkfxofi1-antons-projects-1b1c34d6.vercel.app\nn\n" | vercel env add NEXT_PUBLIC_DASHBOARD_URL production --force
    printf "https://pleeno-agency-awbrwtfgh-antons-projects-1b1c34d6.vercel.app\nn\n" | vercel env add NEXT_PUBLIC_AGENCY_URL production --force
    printf "https://pleeno-entities-dgf5s3laa-antons-projects-1b1c34d6.vercel.app\nn\n" | vercel env add NEXT_PUBLIC_ENTITIES_URL production --force
    printf "https://pleeno-payments-lqwqw3gth-antons-projects-1b1c34d6.vercel.app\nn\n" | vercel env add NEXT_PUBLIC_PAYMENTS_URL production --force
    printf "https://pleeno-reports-8t5p6ej3j-antons-projects-1b1c34d6.vercel.app\nn\n" | vercel env add NEXT_PUBLIC_REPORTS_URL production --force

    # Zone name
    printf "$zone_name\nn\n" | vercel env add NEXT_PUBLIC_ZONE_NAME production --force

    # Analytics
    printf "false\nn\n" | vercel env add NEXT_PUBLIC_ENABLE_ANALYTICS production --force
}

# Process each zone
for zone in "${zones[@]}"; do
    echo "========================================="
    echo "Fixing environment variables for $zone..."
    echo "========================================="

    # Link to project
    rm -rf .vercel
    vercel link --project="pleeno-${zone}-uat" --yes

    # Add environment variables
    add_env_vars "pleeno-${zone}-uat" "$zone"

    echo "✅ Environment variables fixed for $zone"
    echo ""
done

echo "All environment variables have been fixed!"