#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=================================${NC}"
echo -e "${BLUE}Preparing Migrations for UAT${NC}"
echo -e "${BLUE}=================================${NC}"
echo ""

# Create a temporary directory for combined migrations
TEMP_DIR="supabase/migrations-uat"
mkdir -p $TEMP_DIR

# Clean up existing combined migrations
rm -f $TEMP_DIR/*.sql

echo -e "${GREEN}Combining migration folders into timestamped SQL files...${NC}"

# Process each migration folder in order
timestamp_base="20241204000"
counter=0

for dir in supabase/migrations/*/; do
    # Skip non-directories and special folders
    if [[ ! -d "$dir" ]] || [[ "$dir" == *"drafts"* ]] || [[ "$dir" == *"migrations-uat"* ]]; then
        continue
    fi

    dirname=$(basename "$dir")

    # Skip template and checklist files
    if [[ "$dirname" == "MIGRATION_CHECKLIST.md" ]] || [[ "$dirname" == "_TEMPLATE"* ]]; then
        continue
    fi

    # Create timestamp
    timestamp="${timestamp_base}$(printf "%03d" $counter)"
    output_file="$TEMP_DIR/${timestamp}_${dirname}.sql"

    echo -e "${YELLOW}Processing: $dirname${NC}"

    # Add header
    echo "-- Migration: $dirname" > "$output_file"
    echo "-- Generated: $(date)" >> "$output_file"
    echo "" >> "$output_file"

    # Find and concatenate all SQL files in the directory
    sql_files_found=0
    for sql_file in "$dir"*.sql; do
        if [[ -f "$sql_file" ]]; then
            sql_files_found=1
            echo "-- Source: $(basename $sql_file)" >> "$output_file"
            echo "" >> "$output_file"
            cat "$sql_file" >> "$output_file"
            echo "" >> "$output_file"
            echo "" >> "$output_file"
        fi
    done

    if [ $sql_files_found -eq 1 ]; then
        echo -e "${GREEN}  ✓ Created: $(basename $output_file)${NC}"
        ((counter++))
    else
        echo -e "${RED}  ✗ No SQL files found in $dirname${NC}"
        rm -f "$output_file"
    fi
done

echo ""
echo -e "${GREEN}=================================${NC}"
echo -e "${GREEN}Migration Preparation Complete${NC}"
echo -e "${GREEN}=================================${NC}"
echo ""
echo -e "${BLUE}Created ${counter} migration files in $TEMP_DIR${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Review the combined migrations in $TEMP_DIR"
echo "2. Apply migrations using: npx supabase db push --db-url <database-url>"
echo ""

# List created files
echo -e "${BLUE}Migration files created:${NC}"
ls -la $TEMP_DIR/*.sql 2>/dev/null | awk '{print "  - " $NF}'