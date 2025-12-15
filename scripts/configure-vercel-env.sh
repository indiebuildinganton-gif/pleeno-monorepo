#!/bin/bash

# Script to configure Vercel environment variables for all projects
# This script uses GitHub secrets/environment variables for authentication

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Environment variables from GitHub secrets
VERCEL_TOKEN="${VERCEL_TOKEN}"
VERCEL_ORG_ID="${VERCEL_ORG_ID}"

# Project IDs from GitHub secrets
declare -A PROJECT_IDS=(
    ["dashboard"]="${VERCEL_PROJECT_ID_DASHBOARD}"
    ["entities"]="${VERCEL_PROJECT_ID_ENTITIES}"
    ["payments"]="${VERCEL_PROJECT_ID_PAYMENTS}"
    ["agency"]="${VERCEL_PROJECT_ID_AGENCY}"
    ["reports"]="${VERCEL_PROJECT_ID_REPORTS}"
    ["shell"]="${VERCEL_PROJECT_ID_SHELL}"
)

# Supabase configuration
SUPABASE_URL="https://iadhxztsuzbkbnhkimqv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZGh4enRzdXpia2JuaGtpbXF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyOTY5NjQsImV4cCI6MjA3ODg3Mjk2NH0.7XA-XC_Dozv_GwtOpivaUBmUMUJmEpawkKx7JnCPLxU"

# App URLs
SHELL_URL="https://shell-3ik3zrnby-antons-projects-1b1c34d6.vercel.app"
DASHBOARD_URL="https://dashboard-h8pzfv2ks-antons-projects-1b1c34d6.vercel.app"
AGENCY_URL="https://agency-g47ipgn06-antons-projects-1b1c34d6.vercel.app"
ENTITIES_URL="https://entities-n2illv8kx-antons-projects-1b1c34d6.vercel.app"
PAYMENTS_URL="https://payments-fhgvgtdcp-antons-projects-1b1c34d6.vercel.app"
REPORTS_URL="https://reports-kzfwvwz6f-antons-projects-1b1c34d6.vercel.app"

# Other configuration
COOKIE_DOMAIN=".vercel.app"
NODE_ENV="production"

# Function to add environment variable to a project
add_env_var() {
    local project_id=$1
    local var_name=$2
    local var_value=$3
    local environment=$4

    echo -e "${YELLOW}Adding ${var_name} to project ${project_id}...${NC}"

    # Use echo to pipe the value to vercel env add
    if echo "${var_value}" | vercel env add "${var_name}" "${environment}" \
        --token="${VERCEL_TOKEN}" \
        --scope="${VERCEL_ORG_ID}" 2>&1 | grep -q "Created"; then
        echo -e "${GREEN}✓ Successfully added ${var_name}${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to add ${var_name}${NC}"
        return 1
    fi
}

# Function to configure all environment variables for a project
configure_project() {
    local project_name=$1
    local project_id=$2

    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}Configuring ${project_name} (${project_id})${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    local success_count=0
    local total_vars=11

    # Switch to project context
    echo -e "${YELLOW}Switching to project context...${NC}"
    cd /Users/brenttudas/Pleeno

    # Add each environment variable
    add_env_var "${project_id}" "NEXT_PUBLIC_SUPABASE_URL" "${SUPABASE_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "${SUPABASE_ANON_KEY}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_SHELL_URL" "${SHELL_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_DASHBOARD_URL" "${DASHBOARD_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_AGENCY_URL" "${AGENCY_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_ENTITIES_URL" "${ENTITIES_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_PAYMENTS_URL" "${PAYMENTS_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_REPORTS_URL" "${REPORTS_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_APP_URL" "${SHELL_URL}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NEXT_PUBLIC_COOKIE_DOMAIN" "${COOKIE_DOMAIN}" "production" && ((success_count++)) || true
    add_env_var "${project_id}" "NODE_ENV" "${NODE_ENV}" "production" && ((success_count++)) || true

    echo -e "\n${GREEN}Project ${project_name}: ${success_count}/${total_vars} variables configured${NC}\n"

    return ${success_count}
}

# Main execution
main() {
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}Vercel Environment Variable Configuration${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    # Check if VERCEL_TOKEN is set
    if [ -z "${VERCEL_TOKEN}" ]; then
        echo -e "${RED}Error: VERCEL_TOKEN environment variable is not set${NC}"
        exit 1
    fi

    # Check if VERCEL_ORG_ID is set
    if [ -z "${VERCEL_ORG_ID}" ]; then
        echo -e "${RED}Error: VERCEL_ORG_ID environment variable is not set${NC}"
        exit 1
    fi

    echo -e "${GREEN}Using Vercel CLI version:${NC}"
    vercel --version
    echo ""

    # Track overall success
    declare -A results

    # Configure each project
    for project_name in "${!PROJECT_IDS[@]}"; do
        project_id="${PROJECT_IDS[$project_name]}"

        if [ -z "${project_id}" ]; then
            echo -e "${RED}Warning: Project ID for ${project_name} is not set, skipping...${NC}\n"
            results["${project_name}"]="SKIPPED"
            continue
        fi

        if configure_project "${project_name}" "${project_id}"; then
            results["${project_name}"]="SUCCESS"
        else
            results["${project_name}"]="PARTIAL"
        fi
    done

    # Print summary
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}Configuration Summary${NC}"
    echo -e "${GREEN}========================================${NC}\n"

    for project_name in "${!results[@]}"; do
        status="${results[$project_name]}"
        if [ "${status}" == "SUCCESS" ]; then
            echo -e "${GREEN}✓ ${project_name}: All variables configured${NC}"
        elif [ "${status}" == "PARTIAL" ]; then
            echo -e "${YELLOW}⚠ ${project_name}: Some variables configured${NC}"
        else
            echo -e "${RED}✗ ${project_name}: Skipped${NC}"
        fi
    done

    echo -e "\n${GREEN}Configuration complete!${NC}"
    echo -e "${YELLOW}Note: You may need to trigger a redeployment for changes to take effect.${NC}\n"
}

# Run main function
main
