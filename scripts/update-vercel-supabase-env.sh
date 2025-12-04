#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Update Vercel Environment Variables${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# New Supabase credentials from .env.uat
SUPABASE_URL="https://ccmciliwfdtdspdlkuos.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ"

# Get service role key if available
if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    SERVICE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
else
    echo -e "${YELLOW}Note: SUPABASE_SERVICE_ROLE_KEY not set in environment${NC}"
    echo "You'll need to get this from the Supabase dashboard and add it manually"
    SERVICE_KEY=""
fi

# Zone URLs (from your deployed Vercel apps)
SHELL_URL="https://pleeno-shell-mkx3xhzf2-antons-projects-1b1c34d6.vercel.app"
DASHBOARD_URL="https://pleeno-dashboard-ksbw708e9-antons-projects-1b1c34d6.vercel.app"
AGENCY_URL="https://pleeno-agency-1ix2u69jk-antons-projects-1b1c34d6.vercel.app"
ENTITIES_URL="https://pleeno-entities-e8k2ben3p-antons-projects-1b1c34d6.vercel.app"
PAYMENTS_URL="https://pleeno-payments-a3f9umn8a-antons-projects-1b1c34d6.vercel.app"
REPORTS_URL="https://pleeno-reports-5qboqgr2y-antons-projects-1b1c34d6.vercel.app"

echo -e "${BLUE}New Supabase Configuration:${NC}"
echo "  URL: $SUPABASE_URL"
echo "  Anon Key: ${SUPABASE_ANON_KEY:0:20}..."
echo ""

# Array of zones to update
zones=("shell" "dashboard" "agency" "entities" "payments" "reports")

echo -e "${GREEN}Starting environment variable update for all zones...${NC}"
echo ""

# Function to add environment variables
add_env_vars() {
    local zone=$1
    local zone_name=$2

    echo -e "${BLUE}Updating $zone...${NC}"

    # Remove .vercel folder to ensure clean state
    rm -rf .vercel

    # Link to the specific project
    vercel link --project="pleeno-${zone}-uat" --yes

    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to link to pleeno-${zone}-uat${NC}"
        echo "Make sure the project exists in Vercel"
        return 1
    fi

    # Add Supabase configuration
    echo "  Adding NEXT_PUBLIC_SUPABASE_URL..."
    printf "%s\nn\n" "$SUPABASE_URL" | vercel env add NEXT_PUBLIC_SUPABASE_URL production --force 2>/dev/null

    echo "  Adding NEXT_PUBLIC_SUPABASE_ANON_KEY..."
    printf "%s\nn\n" "$SUPABASE_ANON_KEY" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force 2>/dev/null

    if [ -n "$SERVICE_KEY" ]; then
        echo "  Adding SUPABASE_SERVICE_ROLE_KEY..."
        printf "%s\nn\n" "$SERVICE_KEY" | vercel env add SUPABASE_SERVICE_ROLE_KEY production --force 2>/dev/null
    fi

    # Add application configuration
    echo "  Adding NODE_ENV..."
    printf "production\nn\n" | vercel env add NODE_ENV production --force 2>/dev/null

    echo "  Adding NEXT_PUBLIC_ENVIRONMENT..."
    printf "uat\nn\n" | vercel env add NEXT_PUBLIC_ENVIRONMENT production --force 2>/dev/null

    # Add zone name
    echo "  Adding NEXT_PUBLIC_ZONE_NAME..."
    printf "%s\nn\n" "$zone_name" | vercel env add NEXT_PUBLIC_ZONE_NAME production --force 2>/dev/null

    # Add all zone URLs
    echo "  Adding zone URLs..."
    printf "%s\nn\n" "$SHELL_URL" | vercel env add NEXT_PUBLIC_APP_URL production --force 2>/dev/null
    printf "%s\nn\n" "$DASHBOARD_URL" | vercel env add NEXT_PUBLIC_DASHBOARD_URL production --force 2>/dev/null
    printf "%s\nn\n" "$AGENCY_URL" | vercel env add NEXT_PUBLIC_AGENCY_URL production --force 2>/dev/null
    printf "%s\nn\n" "$ENTITIES_URL" | vercel env add NEXT_PUBLIC_ENTITIES_URL production --force 2>/dev/null
    printf "%s\nn\n" "$PAYMENTS_URL" | vercel env add NEXT_PUBLIC_PAYMENTS_URL production --force 2>/dev/null
    printf "%s\nn\n" "$REPORTS_URL" | vercel env add NEXT_PUBLIC_REPORTS_URL production --force 2>/dev/null

    echo -e "${GREEN}✓ $zone environment variables updated${NC}"
    echo ""
}

# Update each zone
for zone in "${zones[@]}"; do
    add_env_vars "$zone" "$zone"
done

echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Environment Update Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Redeploy all Vercel zones to apply the new environment variables"
echo "2. Run: ./redeploy-all.sh"
echo ""
echo -e "${BLUE}Important:${NC}"
echo "If you haven't set the SUPABASE_SERVICE_ROLE_KEY yet:"
echo "1. Go to https://app.supabase.com"
echo "2. Select your UAT project"
echo "3. Go to Settings > API"
echo "4. Copy the service_role secret key"
echo "5. Add it to each Vercel project manually or set it as an environment variable and rerun this script"