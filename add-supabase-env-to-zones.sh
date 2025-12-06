#!/bin/bash

echo "Adding Supabase environment variables to all zones"
echo "=================================================="

# Supabase configuration for UAT
SUPABASE_URL="https://ccmciliwfdtdspdlkuos.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ"

# Projects array
declare -a PROJECTS=(
  "pleeno-shell-uat"
  "pleeno-dashboard-uat"
  "pleeno-agency-uat"
  "pleeno-entities-uat"
  "pleeno-payments-uat"
  "pleeno-reports-uat"
)

# Function to add environment variable
add_env_var() {
  local project=$1
  local key=$2
  local value=$3

  echo "  Adding $key to $project..."
  echo "$value" | npx vercel env add "$key" production --force --yes --scope antons-projects-1b1c34d6 2>/dev/null || {
    echo "  ⚠️  Failed to add $key (may already exist)"
  }
}

# Add Supabase variables to all projects
for project in "${PROJECTS[@]}"; do
  echo ""
  echo "Processing $project..."
  echo "------------------------"

  # Link to the project first
  npx vercel link --project "$project" --yes --scope antons-projects-1b1c34d6 >/dev/null 2>&1

  # Add Supabase URL
  add_env_var "$project" "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL"

  # Add Supabase Anon Key
  add_env_var "$project" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY"

  echo "  ✅ Supabase variables added to $project"
done

echo ""
echo "=================================================="
echo "Supabase environment variables added to all zones!"
echo ""
echo "Next steps:"
echo "1. Redeploy all zones to apply the changes"
echo "2. Test authentication across all zones"