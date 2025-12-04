#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Apply Seed Data to UAT Database${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Configuration
PROJECT_REF="ccmciliwfdtdspdlkuos"
SUPABASE_URL="https://ccmciliwfdtdspdlkuos.supabase.co"

# Check for database password
if [ -z "$SUPABASE_DB_PASSWORD" ]; then
    echo -e "${YELLOW}Please enter the database password for your UAT Supabase project:${NC}"
    echo "You can find this in Supabase Dashboard > Settings > Database"
    read -s SUPABASE_DB_PASSWORD
    echo ""
fi

# Database URL
DATABASE_URL="postgresql://postgres.${PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres"

echo -e "${GREEN}Connecting to UAT database...${NC}"
echo -e "${YELLOW}Project: pleeno-uat (${PROJECT_REF})${NC}"
echo ""

# Check if seed file exists
if [ ! -f "supabase/seed.sql" ]; then
    echo -e "${RED}Error: supabase/seed.sql not found${NC}"
    exit 1
fi

echo -e "${BLUE}Found seed file: supabase/seed.sql${NC}"
echo -e "${YELLOW}This will apply the seed data to your UAT database.${NC}"
echo -n "Continue? (y/n): "
read confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo -e "${YELLOW}Seed application cancelled.${NC}"
    exit 0
fi

echo -e "${GREEN}Applying seed data...${NC}"

# Apply seed using psql
psql "$DATABASE_URL" -f supabase/seed.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Seed data applied successfully!${NC}"
else
    echo -e "${RED}✗ Failed to apply seed data${NC}"
    echo -e "${YELLOW}Common issues:${NC}"
    echo "1. Incorrect database password"
    echo "2. Data already exists (foreign key violations)"
    echo "3. Network connectivity issues"
    echo ""
    echo -e "${YELLOW}Try running with verbose mode:${NC}"
    echo "psql \"$DATABASE_URL\" -f supabase/seed.sql -e"
fi

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Seed Application Complete${NC}"
echo -e "${GREEN}=================================${NC}"