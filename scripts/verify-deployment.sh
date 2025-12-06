#!/bin/bash
# Deployment Verification Script

echo "======================================="
echo "VERCEL DEPLOYMENT VERIFICATION CHECKLIST"
echo "======================================="
echo ""
echo "Run through this checklist after deployment:"
echo ""

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "1. CHECK: next.config.ts files (basePath removed)"
echo "   Checking all apps..."
for app in dashboard agency entities payments reports; do
  if grep -q "basePath:" apps/$app/next.config.ts 2>/dev/null; then
    echo -e "   ${RED}✗${NC} $app still has basePath configured"
  else
    echo -e "   ${GREEN}✓${NC} $app basePath removed"
  fi
done

echo ""
echo "2. CHECK: Environment files exist"
if [ -f ".env.production" ]; then
  echo -e "   ${GREEN}✓${NC} .env.production exists"
else
  echo -e "   ${RED}✗${NC} .env.production missing"
fi

if [ -f ".env.development" ]; then
  echo -e "   ${GREEN}✓${NC} .env.development exists"
else
  echo -e "   ${YELLOW}⚠${NC} .env.development missing (optional)"
fi

echo ""
echo "3. MANUAL CHECKS NEEDED IN VERCEL DASHBOARD:"
echo ""
echo "   For EACH of the 6 projects, verify:"
echo "   [ ] Root Directory is set to apps/[app-name]"
echo "   [ ] Build Command uses turbo filter: turbo build --filter=[app-name]"
echo "   [ ] Framework is set to Next.js"
echo "   [ ] Environment variables are configured"
echo "   [ ] Custom domain is configured (e.g., dashboard.plenno.com.au)"
echo ""

echo "4. TEST URLS (after deployment):"
echo ""
URLS=(
  "https://shell.plenno.com.au"
  "https://dashboard.plenno.com.au"
  "https://agency.plenno.com.au"
  "https://entities.plenno.com.au"
  "https://payments.plenno.com.au"
  "https://reports.plenno.com.au"
)

echo "   Test each URL loads correctly:"
for url in "${URLS[@]}"; do
  echo "   [ ] $url"
done

echo ""
echo "5. AUTHENTICATION TEST:"
echo "   [ ] Login at shell.plenno.com.au"
echo "   [ ] Navigate to dashboard.plenno.com.au (should remain logged in)"
echo "   [ ] Check browser DevTools → Application → Cookies"
echo "       - Should see cookies with domain '.plenno.com.au'"
echo ""

echo "6. BUILD PERFORMANCE CHECK:"
echo "   [ ] Check Vercel build logs for each project"
echo "   [ ] Verify builds complete in < 3 minutes"
echo "   [ ] After remote cache setup, builds should be < 1 minute"
echo ""

echo "======================================="
echo "If any checks fail, review the implementation guide"
echo "======================================="