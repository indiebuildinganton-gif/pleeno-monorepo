# Testing & Verification Plan
## GitHub Actions + Vercel Deployment

This document outlines the comprehensive testing and verification plan for the GitHub Actions + Vercel deployment setup.

## Table of Contents

- [Pre-Deployment Testing](#pre-deployment-testing)
- [Deployment Testing](#deployment-testing)
- [Post-Deployment Verification](#post-deployment-verification)
- [Continuous Monitoring](#continuous-monitoring)
- [Test Automation](#test-automation)

## Pre-Deployment Testing

Before pushing to production, perform these tests locally:

### 1. Local Build Test

```bash
# Clean install and build
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf .turbo
pnpm install --frozen-lockfile
pnpm build
```

**Expected Result:**
- ✅ All dependencies install without errors
- ✅ All 6 apps build successfully
- ✅ No TypeScript errors
- ✅ Build completes in < 5 minutes

**If Fails:**
- Check for TypeScript errors: `pnpm type-check`
- Check for missing dependencies
- Review build logs for specific errors

### 2. Individual App Build Test

Test each app builds independently:

```bash
pnpm turbo build --filter=shell
pnpm turbo build --filter=dashboard
pnpm turbo build --filter=entities
pnpm turbo build --filter=payments
pnpm turbo build --filter=agency
pnpm turbo build --filter=reports
```

**Expected Result:**
- ✅ Each app builds without errors
- ✅ Build outputs exist in `apps/[app]/.next`

### 3. Environment Variables Test

Verify environment variables are correctly configured:

```bash
# Check shell next.config.ts
cat apps/shell/next.config.ts | grep NEXT_PUBLIC

# Verify all required env vars
grep -r "NEXT_PUBLIC_" apps/*/next.config.ts
```

**Expected Variables:**
- `NEXT_PUBLIC_DASHBOARD_URL`
- `NEXT_PUBLIC_ENTITIES_URL`
- `NEXT_PUBLIC_PAYMENTS_URL`
- `NEXT_PUBLIC_AGENCY_URL`
- `NEXT_PUBLIC_REPORTS_URL`
- `NEXT_PUBLIC_SHELL_URL`
- `NEXT_PUBLIC_COOKIE_DOMAIN`

### 4. Turbo Cache Test

Verify Turbo caching works:

```bash
# First build (cold cache)
time pnpm build

# Second build (warm cache)
time pnpm build
```

**Expected Result:**
- ✅ Second build significantly faster (< 30s)
- ✅ Turbo shows cache hits

### 5. Vercel.json Validation

Check all vercel.json files are correctly configured:

```bash
# Check all vercel.json files exist
ls -la apps/*/vercel.json

# Verify they use prebuilt configuration
grep -A3 "buildCommand" apps/*/vercel.json
```

**Expected Content:**
```json
{
  "buildCommand": "echo 'Build happens in GitHub Actions'",
  "installCommand": "echo 'Dependencies installed in GitHub Actions'",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "ignoreCommand": "echo 'Deployment via GitHub Actions only'"
}
```

### 6. GitHub Actions Workflow Validation

Validate workflow syntax:

```bash
# Install actionlint if needed
# brew install actionlint  # macOS
# or download from https://github.com/rhysd/actionlint

# Validate workflows
actionlint .github/workflows/deploy-production.yml
actionlint .github/workflows/deploy-preview.yml
```

**Expected Result:**
- ✅ No syntax errors
- ✅ All required fields present
- ✅ Dependencies correctly defined

## Deployment Testing

### Phase 1: Preview Deployment Test

Test the deployment pipeline with a preview deployment:

#### Step 1: Create Test Branch

```bash
# Create test branch
git checkout -b test/deployment-verification

# Make a small visible change
echo "// Deployment test $(date)" >> apps/shell/app/page.tsx

# Commit and push
git add .
git commit -m "test: verify deployment pipeline"
git push origin test/deployment-verification
```

#### Step 2: Create Pull Request

1. Go to GitHub repository
2. Create pull request from `test/deployment-verification` to `main`
3. Wait for GitHub Actions to trigger

#### Step 3: Monitor Workflow

Monitor the workflow execution:

```
GitHub → Actions → Deploy to Vercel Preview
```

**Monitor:**
- [ ] Build job completes successfully
- [ ] All 5 child app deployments complete in parallel
- [ ] Shell rebuild completes with child URLs
- [ ] Shell deployment completes
- [ ] PR comment appears with preview URLs

**Expected Timeline:**
- Build: 3-5 minutes
- Child apps: 2-3 minutes
- Shell rebuild/deploy: 2-4 minutes
- Total: 7-12 minutes

#### Step 4: Verify Preview URLs

From the PR comment, test each preview URL:

```bash
# Set preview URLs from PR comment
SHELL_URL="https://pleeno-shell-uat-xyz.vercel.app"

# Test shell
curl -I $SHELL_URL
# Expected: 200 OK

# Test multi-zone routes
curl -I $SHELL_URL/dashboard
curl -I $SHELL_URL/entities
curl -I $SHELL_URL/payments
curl -I $SHELL_URL/agency
curl -I $SHELL_URL/reports
# All expected: 200 OK
```

#### Step 5: Browser Testing

Open preview in browser:

1. Open shell preview URL
2. Navigate to each multi-zone route:
   - [ ] `/dashboard` loads
   - [ ] `/entities` loads
   - [ ] `/payments` loads
   - [ ] `/agency` loads
   - [ ] `/reports` loads
3. Check DevTools → Network:
   - [ ] No CORS errors
   - [ ] No 404 errors
   - [ ] Requests go to correct child app URLs

### Phase 2: Production Deployment Test

After preview deployment succeeds, test production:

#### Step 1: Merge Pull Request

```bash
# Merge the test PR
# This triggers production deployment
```

Or merge via GitHub UI.

#### Step 2: Monitor Production Workflow

```
GitHub → Actions → Deploy to Vercel Production
```

**Monitor same steps as preview deployment**

#### Step 3: Verify Production URLs

```bash
# Test production shell
curl -I https://plenno.com.au
# Expected: 200 OK

# Test production multi-zone routes
curl -I https://plenno.com.au/dashboard
curl -I https://plenno.com.au/entities
curl -I https://plenno.com.au/payments
curl -I https://plenno.com.au/agency
curl -I https://plenno.com.au/reports
# All expected: 200 OK
```

#### Step 4: Run Automated Verification

```bash
# Run verification script
./scripts/verify-multizone.sh https://plenno.com.au
```

**Expected Output:**

```
🔍 Verifying deployment at: https://plenno.com.au

Testing Shell App
Testing Shell homepage... ✓ (200)

Testing Multi-Zone Routes
Testing Dashboard route... ✓ (200)
Testing Entities route... ✓ (200)
Testing Payments route... ✓ (200)
Testing Agency route... ✓ (200)
Testing Reports route... ✓ (200)

Testing API Routes
Testing Colleges API (via entities)... ✓ (200)
Testing Students API (via entities)... ✓ (200)
Testing Payment Plans API (via payments)... ✓ (200)

=========================================
✓ All tests passed!
=========================================
```

## Post-Deployment Verification

### 1. Vercel Dashboard Check

For each of the 6 projects:

1. Go to https://vercel.com/antons-projects-1b1c34d6/[project-name]
2. Verify latest deployment:
   - [ ] Has "Production" badge
   - [ ] Shows "Ready" status
   - [ ] Build time is reasonable (< 3 minutes per app)
   - [ ] No errors in logs

### 2. Environment Variables Check

Verify shell environment variables were updated:

```bash
# Check via Vercel CLI
cd apps/shell
vercel env ls --token="$VERCEL_TOKEN"
```

**Expected Variables:**

```
NEXT_PUBLIC_DASHBOARD_URL (production)  Updated X minutes ago
NEXT_PUBLIC_ENTITIES_URL (production)   Updated X minutes ago
NEXT_PUBLIC_PAYMENTS_URL (production)   Updated X minutes ago
NEXT_PUBLIC_AGENCY_URL (production)     Updated X minutes ago
NEXT_PUBLIC_REPORTS_URL (production)    Updated X minutes ago
```

Values should match latest deployment URLs.

### 3. Child App Direct Access Test

Test each child app can be accessed directly:

```bash
# Dashboard
curl -I https://dashboard.plenno.com.au
# Expected: 200 OK

# Others (Vercel URLs)
curl -I https://pleeno-entities-uat.vercel.app
curl -I https://pleeno-payments-uat.vercel.app
curl -I https://pleeno-agency-uat.vercel.app
curl -I https://pleeno-reports-uat.vercel.app
# All expected: 200 OK
```

### 4. Multi-Zone Integration Test

#### 4.1 Route Proxying Test

```bash
# Test dashboard route
curl -v https://plenno.com.au/dashboard 2>&1 | grep -i "location\|host"

# Should NOT redirect, should proxy to dashboard app
```

#### 4.2 API Proxying Test

Test API routes are correctly proxied:

```bash
# Entities APIs
curl https://plenno.com.au/api/colleges | jq '.'
curl https://plenno.com.au/api/students | jq '.'

# Payments APIs
curl https://plenno.com.au/api/payment-plans | jq '.'
curl https://plenno.com.au/api/installments | jq '.'

# Reports APIs
curl https://plenno.com.au/api/reports | jq '.'
```

**Expected:**
- ✅ Valid JSON responses
- ✅ No CORS errors
- ✅ Correct data structure

### 5. Authentication Flow Test

Test authentication works across zones:

#### Manual Browser Test:

1. Open https://plenno.com.au
2. Login with test credentials
3. Verify login successful
4. Open DevTools → Application → Cookies
   - [ ] Check cookie domain is `.plenno.com.au`
5. Navigate to https://plenno.com.au/dashboard
   - [ ] Should remain logged in (no redirect to login)
6. Navigate to https://plenno.com.au/entities
   - [ ] Should remain logged in
7. Check cookies again
   - [ ] Same cookies present
   - [ ] No duplicate cookies

#### Automated Test (if available):

```bash
# Run e2e tests
pnpm test:e2e
```

### 6. Performance Test

Check performance metrics:

```bash
# Lighthouse test
npx lighthouse https://plenno.com.au --output=html --output-path=./lighthouse-report.html

# Check key metrics:
# - First Contentful Paint (FCP) < 1.8s
# - Largest Contentful Paint (LCP) < 2.5s
# - Time to Interactive (TTI) < 3.8s
```

### 7. Error Monitoring

Check for errors in production:

1. Open Vercel dashboard → Select project → Functions
2. Check for any errors in last 24 hours
3. Review error logs if any found

**Expected:**
- ✅ No deployment errors
- ✅ No runtime errors
- ✅ No client-side errors (check browser console)

### 8. DNS and Domain Test

Verify DNS and domain configuration:

```bash
# Check DNS resolution
nslookup plenno.com.au
nslookup dashboard.plenno.com.au

# Check SSL certificate
openssl s_client -connect plenno.com.au:443 -servername plenno.com.au </dev/null 2>/dev/null | openssl x509 -noout -dates

# Expected: Valid certificate, not expired
```

### 9. Load Test (Optional)

Test under load:

```bash
# Install k6 if needed
# brew install k6

# Run load test
k6 run - <<EOF
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let res = http.get('https://plenno.com.au');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
EOF
```

**Expected:**
- ✅ All requests succeed
- ✅ Response time < 500ms
- ✅ No errors under load

## Continuous Monitoring

### Daily Checks

Automated daily health check:

```bash
# Create cron job or GitHub Action to run daily
./scripts/verify-multizone.sh https://plenno.com.au
```

### Weekly Review

- [ ] Review Vercel deployment logs
- [ ] Check error rates in monitoring dashboard
- [ ] Review performance metrics
- [ ] Verify all 6 apps are healthy

### Monthly Audit

- [ ] Review and rotate Vercel API token
- [ ] Update dependencies
- [ ] Check for GitHub Actions workflow updates
- [ ] Review Vercel bill for anomalies
- [ ] Test rollback procedure

## Test Automation

### Automated Test Script

Create automated test script:

```bash
#!/bin/bash
# test-deployment.sh

set -e

SHELL_URL="${1:-https://plenno.com.au}"
FAILED=0

echo "🔍 Testing deployment: $SHELL_URL"

# Test shell
echo -n "Testing shell... "
if curl -sf "$SHELL_URL" > /dev/null; then
  echo "✅"
else
  echo "❌"
  FAILED=$((FAILED + 1))
fi

# Test multi-zone routes
ROUTES=("dashboard" "entities" "payments" "agency" "reports")
for route in "${ROUTES[@]}"; do
  echo -n "Testing /$route... "
  if curl -sf "$SHELL_URL/$route" > /dev/null; then
    echo "✅"
  else
    echo "❌"
    FAILED=$((FAILED + 1))
  fi
done

# Test APIs
APIS=("api/colleges" "api/students" "api/payment-plans")
for api in "${APIS[@]}"; do
  echo -n "Testing /$api... "
  if curl -sf "$SHELL_URL/$api" > /dev/null; then
    echo "✅"
  else
    echo "❌"
    FAILED=$((FAILED + 1))
  fi
done

if [ $FAILED -eq 0 ]; then
  echo "✅ All tests passed"
  exit 0
else
  echo "❌ $FAILED test(s) failed"
  exit 1
fi
```

### CI/CD Integration Test

Add test step to workflow:

```yaml
# Add to .github/workflows/deploy-production.yml

- name: Run integration tests
  run: ./scripts/test-deployment.sh ${{ needs.rebuild-and-deploy-shell.outputs.url }}
```

## Test Checklist Summary

### Before First Deployment

- [ ] Local build test passes
- [ ] All environment variables configured
- [ ] GitHub secrets added
- [ ] Vercel projects configured
- [ ] Workflow files validated

### During Preview Deployment

- [ ] Build job completes successfully
- [ ] Child apps deploy in parallel
- [ ] Shell rebuilds with child URLs
- [ ] Preview URLs accessible
- [ ] Multi-zone routing works in preview

### Before Production Deployment

- [ ] Preview deployment successful
- [ ] All tests pass on preview
- [ ] Team review completed
- [ ] Rollback plan prepared

### After Production Deployment

- [ ] Production URLs accessible
- [ ] Multi-zone routing works
- [ ] API routes accessible
- [ ] Authentication works across zones
- [ ] No errors in logs
- [ ] Performance metrics acceptable
- [ ] DNS and SSL valid

### Ongoing Monitoring

- [ ] Daily health checks pass
- [ ] Weekly deployment log review
- [ ] Monthly security audit
- [ ] Quarterly rollback test

## Rollback Test

Test rollback procedure monthly:

```bash
# 1. Deploy test change
echo "// Rollback test $(date)" >> apps/shell/app/page.tsx
git add . && git commit -m "test: rollback" && git push

# 2. Wait for deployment

# 3. Practice rollback via Vercel dashboard
# - Find previous deployment
# - Promote to production

# 4. Verify previous version is live
./scripts/verify-multizone.sh https://plenno.com.au

# 5. Clean up
git revert HEAD && git push
```

## Troubleshooting Test Failures

### If Build Fails

1. Check GitHub Actions logs
2. Run build locally: `pnpm build`
3. Check for TypeScript errors: `pnpm type-check`
4. Verify dependencies: `pnpm install --frozen-lockfile`

### If Deployment Fails

1. Check Vercel project settings
2. Verify GitHub secrets are correct
3. Check Vercel token permissions
4. Review deployment logs in Vercel dashboard

### If Multi-Zone Routing Fails

1. Check shell environment variables in Vercel
2. Verify child app URLs in workflow outputs
3. Check `next.config.ts` rewrite rules
4. Test child apps directly

### If Performance Degrades

1. Check bundle sizes: `pnpm run build`
2. Review Vercel analytics
3. Check for slow API responses
4. Optimize images and assets

## Success Criteria

Deployment is considered successful when:

✅ All pre-deployment tests pass
✅ Preview deployment completes without errors
✅ Production deployment completes without errors
✅ All post-deployment verifications pass
✅ Multi-zone routing works correctly
✅ Authentication works across zones
✅ Performance metrics meet targets
✅ No errors in production logs
✅ Rollback procedure tested and works

---

**Document Version:** 1.0.0
**Last Updated:** 2025-12-12
**Next Review:** Weekly during first month, then monthly
