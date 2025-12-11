#!/bin/bash

# Deploy all apps to Vercel with prebuilt artifacts
# This script builds locally and deploys to Vercel
# Usage: ./scripts/deploy-all.sh [production|preview]

set -e

ENVIRONMENT=${1:-preview}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🚀 Starting deployment process for environment: $ENVIRONMENT"
echo "📁 Root directory: $ROOT_DIR"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel@latest
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm not found. Please install pnpm first."
    exit 1
fi

# Build all apps locally
echo -e "${BLUE}📦 Building all apps locally...${NC}"
cd "$ROOT_DIR"
pnpm install --frozen-lockfile
pnpm build

# Deploy child apps first
echo -e "${YELLOW}🔸 Deploying child apps...${NC}"

declare -A CHILD_URLS

CHILD_APPS=("dashboard" "entities" "payments" "agency" "reports")

for app in "${CHILD_APPS[@]}"; do
    echo -e "${GREEN}Deploying $app...${NC}"
    cd "$ROOT_DIR/apps/$app"

    if [ "$ENVIRONMENT" = "production" ]; then
        URL=$(vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN")
    else
        URL=$(vercel deploy --prebuilt --token="$VERCEL_TOKEN")
    fi

    CHILD_URLS[$app]=$URL
    echo -e "${GREEN}✅ $app deployed to: $URL${NC}"
done

# Rebuild shell with child app URLs
echo -e "${BLUE}🔄 Rebuilding shell with child app URLs...${NC}"
cd "$ROOT_DIR"

export NEXT_PUBLIC_DASHBOARD_URL="${CHILD_URLS[dashboard]}"
export NEXT_PUBLIC_ENTITIES_URL="${CHILD_URLS[entities]}"
export NEXT_PUBLIC_PAYMENTS_URL="${CHILD_URLS[payments]}"
export NEXT_PUBLIC_AGENCY_URL="${CHILD_URLS[agency]}"
export NEXT_PUBLIC_REPORTS_URL="${CHILD_URLS[reports]}"

pnpm turbo build --filter=shell

# Deploy shell
echo -e "${GREEN}Deploying shell...${NC}"
cd "$ROOT_DIR/apps/shell"

if [ "$ENVIRONMENT" = "production" ]; then
    SHELL_URL=$(vercel deploy --prebuilt --prod --token="$VERCEL_TOKEN")
else
    SHELL_URL=$(vercel deploy --prebuilt --token="$VERCEL_TOKEN")
fi

echo -e "${GREEN}✅ Shell deployed to: $SHELL_URL${NC}"

# Print summary
echo ""
echo "========================================="
echo "🎉 Deployment Complete!"
echo "========================================="
echo ""
echo "Child Apps:"
for app in "${CHILD_APPS[@]}"; do
    echo "  - $app: ${CHILD_URLS[$app]}"
done
echo ""
echo "Shell: $SHELL_URL"
echo ""
echo "========================================="
