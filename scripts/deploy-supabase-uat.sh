#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Supabase UAT Deployment Script${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Project configuration
PROJECT_REF="ccmciliwfdtdspdlkuos"
PROJECT_NAME="pleeno-uat"

echo -e "${YELLOW}Project Reference: ${PROJECT_REF}${NC}"
echo -e "${YELLOW}Project Name: ${PROJECT_NAME}${NC}"
echo ""

# Step 1: Check for access token
echo -e "${GREEN}Step 1: Checking Supabase Access Token${NC}"
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}SUPABASE_ACCESS_TOKEN not set!${NC}"
    echo ""
    echo -e "${YELLOW}To get your access token:${NC}"
    echo "1. Go to https://app.supabase.com/account/tokens"
    echo "2. Login with lopajs27@gmail.com"
    echo "3. Click 'Generate new token'"
    echo "4. Name it 'UAT Deployment'"
    echo "5. Copy the token"
    echo ""
    echo -e "${YELLOW}Then run:${NC}"
    echo "export SUPABASE_ACCESS_TOKEN='your-token-here'"
    echo "./scripts/deploy-supabase-uat.sh"
    exit 1
fi
echo -e "${GREEN}✓ Access token found${NC}"
echo ""

# Step 2: Link to UAT project
echo -e "${GREEN}Step 2: Linking to UAT Supabase project${NC}"
npx supabase link --project-ref $PROJECT_REF
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Successfully linked to project${NC}"
else
    echo -e "${RED}✗ Failed to link to project${NC}"
    exit 1
fi
echo ""

# Step 3: Check migration status
echo -e "${GREEN}Step 3: Checking current migration status${NC}"
npx supabase migration list
echo ""

# Step 4: Prepare migrations
echo -e "${GREEN}Step 4: Preparing migrations for deployment${NC}"
echo -e "${YELLOW}Found the following migration folders:${NC}"
ls -d supabase/migrations/*/ 2>/dev/null | grep -v drafts | while read dir; do
    echo "  - $(basename $dir)"
done
echo ""

# Step 5: Deploy migrations
echo -e "${GREEN}Step 5: Deploying migrations to UAT${NC}"
echo -e "${YELLOW}This will apply all pending migrations to the UAT database.${NC}"
echo -n "Continue? (y/n): "
read confirm

if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
    echo -e "${BLUE}Deploying migrations...${NC}"

    # First, let's try a dry run
    echo -e "${YELLOW}Running dry run first...${NC}"
    npx supabase db push --dry-run

    echo ""
    echo -n "Review the changes above. Deploy for real? (y/n): "
    read deploy_confirm

    if [ "$deploy_confirm" = "y" ] || [ "$deploy_confirm" = "Y" ]; then
        npx supabase db push

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Migrations deployed successfully${NC}"
        else
            echo -e "${RED}✗ Migration deployment failed${NC}"
            echo -e "${YELLOW}Check the error messages above and fix any issues${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}Skipping migration deployment${NC}"
    fi
else
    echo -e "${YELLOW}Skipping migration deployment${NC}"
fi
echo ""

# Step 6: Apply seed data
echo -e "${GREEN}Step 6: Applying seed data${NC}"
if [ -f "supabase/seed.sql" ]; then
    echo -e "${YELLOW}Found seed file: supabase/seed.sql${NC}"
    echo -n "Apply seed data to UAT? (y/n): "
    read seed_confirm

    if [ "$seed_confirm" = "y" ] || [ "$seed_confirm" = "Y" ]; then
        echo -e "${BLUE}Applying seed data...${NC}"
        npx supabase seed -f supabase/seed.sql

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Seed data applied successfully${NC}"
        else
            echo -e "${RED}✗ Failed to apply seed data${NC}"
            echo -e "${YELLOW}This might be normal if data already exists${NC}"
        fi
    else
        echo -e "${YELLOW}Skipping seed data${NC}"
    fi
else
    echo -e "${YELLOW}No seed file found at supabase/seed.sql${NC}"
fi
echo ""

# Step 7: Get project status and credentials
echo -e "${GREEN}Step 7: Getting project credentials${NC}"
npx supabase status > .supabase-uat-status.txt
echo -e "${GREEN}✓ Project status saved to .supabase-uat-status.txt${NC}"

# Extract key values
API_URL=$(npx supabase status | grep "API URL" | awk '{print $3}')
ANON_KEY=$(npx supabase status | grep "anon key" | awk '{print $3}')

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}UAT Deployment Summary${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}Supabase Project:${NC}"
echo "  Project Ref: $PROJECT_REF"
echo "  API URL: $API_URL"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Update Vercel environment variables with the new Supabase credentials"
echo "2. Redeploy all Vercel zones"
echo "3. Test the UAT environment"
echo ""
echo -e "${YELLOW}To update Vercel env vars, run:${NC}"
echo "./scripts/update-vercel-supabase-env.sh"
echo ""
echo -e "${GREEN}✓ UAT deployment script completed!${NC}"