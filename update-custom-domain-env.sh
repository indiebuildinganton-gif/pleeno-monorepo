#!/bin/bash

# Custom domain configuration
DOMAIN="plenno.com.au"
COOKIE_DOMAIN=".$DOMAIN"

echo "Setting up environment variables for custom domain: $DOMAIN"
echo "=================================================="

# Common environment variables for all zones
declare -a COMMON_VARS=(
  "NEXT_PUBLIC_COOKIE_DOMAIN=$COOKIE_DOMAIN"
)

# Zone-specific URLs
declare -a ZONE_URLS=(
  "NEXT_PUBLIC_SHELL_URL=https://shell.$DOMAIN"
  "NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.$DOMAIN"
  "NEXT_PUBLIC_AGENCY_URL=https://agency.$DOMAIN"
  "NEXT_PUBLIC_ENTITIES_URL=https://entities.$DOMAIN"
  "NEXT_PUBLIC_PAYMENTS_URL=https://payments.$DOMAIN"
  "NEXT_PUBLIC_REPORTS_URL=https://reports.$DOMAIN"
)

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
  echo "$value" | npx vercel env add "$key" production --force --yes --scope antons-projects-1b1c34d6 2>/dev/null || true
}

# Update each project
for project in "${PROJECTS[@]}"; do
  echo ""
  echo "Updating $project..."
  echo "------------------------"

  # Link to the project first
  npx vercel link --project "$project" --yes --scope antons-projects-1b1c34d6 >/dev/null 2>&1

  # Add common variables
  for var in "${COMMON_VARS[@]}"; do
    key="${var%%=*}"
    value="${var#*=}"
    add_env_var "$project" "$key" "$value"
  done

  # Add all zone URLs to each project
  for var in "${ZONE_URLS[@]}"; do
    key="${var%%=*}"
    value="${var#*=}"
    add_env_var "$project" "$key" "$value"
  done

  # Add project-specific APP_URL
  if [[ "$project" == "pleeno-shell-uat" ]]; then
    add_env_var "$project" "NEXT_PUBLIC_APP_URL" "https://shell.$DOMAIN"
  elif [[ "$project" == "pleeno-dashboard-uat" ]]; then
    add_env_var "$project" "NEXT_PUBLIC_APP_URL" "https://dashboard.$DOMAIN"
  elif [[ "$project" == "pleeno-agency-uat" ]]; then
    add_env_var "$project" "NEXT_PUBLIC_APP_URL" "https://agency.$DOMAIN"
  elif [[ "$project" == "pleeno-entities-uat" ]]; then
    add_env_var "$project" "NEXT_PUBLIC_APP_URL" "https://entities.$DOMAIN"
  elif [[ "$project" == "pleeno-payments-uat" ]]; then
    add_env_var "$project" "NEXT_PUBLIC_APP_URL" "https://payments.$DOMAIN"
  elif [[ "$project" == "pleeno-reports-uat" ]]; then
    add_env_var "$project" "NEXT_PUBLIC_APP_URL" "https://reports.$DOMAIN"
  fi
done

echo ""
echo "=================================================="
echo "Environment variables updated successfully!"
echo ""
echo "Next steps:"
echo "1. Deploy all projects to apply changes"
echo "2. Wait for DNS propagation (if not already complete)"
echo "3. Test authentication flow"