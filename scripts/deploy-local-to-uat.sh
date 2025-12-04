#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Deploy Local Supabase to UAT${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Configuration
PROJECT_REF="ccmciliwfdtdspdlkuos"
ACCESS_TOKEN="sbp_b1d0bbda96e96c2482e3adaf49958645f944f2f3"
DB_PASSWORD="hh8tP8TL2pQhCSst"

# Export access token
export SUPABASE_ACCESS_TOKEN=$ACCESS_TOKEN

echo -e "${GREEN}Step 1: Checking local Supabase status${NC}"
npx supabase status

echo ""
echo -e "${GREEN}Step 2: Linking to UAT project${NC}"
npx supabase link --project-ref $PROJECT_REF

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to link to project${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Step 3: Generating migration from local database${NC}"
echo -e "${YELLOW}This will capture your entire local schema...${NC}"

# Generate a complete migration from local database
TIMESTAMP=$(date +%Y%m%d%H%M%S)
MIGRATION_NAME="${TIMESTAMP}_complete_local_schema.sql"

npx supabase db diff --use-migra -f complete_local_schema

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Migration generated: supabase/migrations/${MIGRATION_NAME}${NC}"
else
    echo -e "${YELLOW}No differences found or migration generation failed${NC}"
fi

echo ""
echo -e "${YELLOW}Choose deployment method:${NC}"
echo "1. Safe deployment (preview changes first)"
echo "2. Direct deployment (push immediately)"
echo "3. Reset and deploy (CAUTION: clears remote database)"
echo -n "Enter choice (1-3): "
read choice

case $choice in
    1)
        echo -e "${GREEN}Step 4: Preview changes${NC}"
        npx supabase db push --dry-run

        echo ""
        echo -n "Review the changes above. Deploy for real? (y/n): "
        read confirm

        if [ "$confirm" = "y" ] || [ "$confirm" = "Y" ]; then
            echo -e "${GREEN}Step 5: Pushing to UAT${NC}"
            npx supabase db push

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Schema deployed successfully${NC}"
            else
                echo -e "${RED}✗ Deployment failed${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}Deployment cancelled${NC}"
            exit 0
        fi
        ;;

    2)
        echo -e "${GREEN}Step 4: Direct deployment${NC}"
        npx supabase db push

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Schema deployed successfully${NC}"
        else
            echo -e "${RED}✗ Deployment failed${NC}"
            exit 1
        fi
        ;;

    3)
        echo -e "${RED}WARNING: This will DELETE all data in the remote database!${NC}"
        echo -n "Type 'RESET-UAT' to confirm: "
        read confirm_reset

        if [ "$confirm_reset" = "RESET-UAT" ]; then
            echo -e "${GREEN}Step 4: Resetting remote database${NC}"
            echo "y" | npx supabase db reset --linked

            echo -e "${GREEN}Step 5: Pushing schema${NC}"
            npx supabase db push

            if [ $? -eq 0 ]; then
                echo -e "${GREEN}✓ Schema deployed successfully${NC}"
            else
                echo -e "${RED}✗ Deployment failed${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}Reset cancelled${NC}"
            exit 0
        fi
        ;;

    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Step 6: Applying seed data${NC}"
echo -n "Apply seed data to UAT? (y/n): "
read seed_confirm

if [ "$seed_confirm" = "y" ] || [ "$seed_confirm" = "Y" ]; then
    # Check if we have a seed.sql file
    if [ -f "supabase/seed.sql" ]; then
        echo -e "${BLUE}Applying seed data...${NC}"

        # Try using psql directly
        DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

        # Check if psql is available
        if command -v psql &> /dev/null; then
            psql "$DATABASE_URL" -f supabase/seed.sql
        else
            # Use Node.js script as fallback
            echo -e "${YELLOW}psql not found, using Node.js script...${NC}"
            SUPABASE_DB_PASSWORD=$DB_PASSWORD node scripts/apply-seed-node.js
        fi

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Seed data applied${NC}"
        else
            echo -e "${YELLOW}⚠ Seed data may have partially applied or had conflicts${NC}"
        fi
    else
        echo -e "${RED}seed.sql not found${NC}"
    fi
else
    echo -e "${YELLOW}Skipping seed data${NC}"
fi

echo ""
echo -e "${GREEN}Step 7: Verification${NC}"
npx supabase migration list

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}UAT Database URL:${NC}"
echo "postgresql://postgres:[password]@db.${PROJECT_REF}.supabase.co:5432/postgres"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test your application with the UAT database"
echo "2. Update Vercel environment variables if needed"
echo "3. Monitor logs for any issues"