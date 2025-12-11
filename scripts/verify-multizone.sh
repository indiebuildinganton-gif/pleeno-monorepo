#!/bin/bash

# Verify multi-zone deployment is working correctly
# Usage: ./scripts/verify-multizone.sh <shell-url>

set -e

SHELL_URL=${1:-https://plenno.com.au}

echo "🔍 Verifying deployment at: $SHELL_URL"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILED=0

# Function to check URL
check_url() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3

    echo -n "Testing $description... "
    status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} ($status)"
        return 0
    else
        echo -e "${RED}✗${NC} (got $status, expected $expected_status)"
        FAILED=$((FAILED + 1))
        return 1
    fi
}

# Test shell app
echo -e "${YELLOW}Testing Shell App${NC}"
check_url "$SHELL_URL" 200 "Shell homepage"

# Test multi-zone routes
echo -e "\n${YELLOW}Testing Multi-Zone Routes${NC}"
check_url "$SHELL_URL/dashboard" 200 "Dashboard route"
check_url "$SHELL_URL/entities" 200 "Entities route"
check_url "$SHELL_URL/payments" 200 "Payments route"
check_url "$SHELL_URL/agency" 200 "Agency route"
check_url "$SHELL_URL/reports" 200 "Reports route"

# Test API routes (if accessible)
echo -e "\n${YELLOW}Testing API Routes${NC}"
check_url "$SHELL_URL/api/colleges" 200 "Colleges API (via entities)"
check_url "$SHELL_URL/api/students" 200 "Students API (via entities)"
check_url "$SHELL_URL/api/payment-plans" 200 "Payment Plans API (via payments)"

# Summary
echo ""
echo "========================================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo "========================================="
    exit 0
else
    echo -e "${RED}✗ $FAILED test(s) failed${NC}"
    echo "========================================="
    exit 1
fi
