# Quick Start Guide - GitHub Actions Deployment

Fast setup guide for deploying Pleeno to Vercel via GitHub Actions.

## Prerequisites Checklist

- [ ] GitHub repository with admin access
- [ ] Vercel account with team `antons-projects-1b1c34d6`
- [ ] 6 Vercel projects exist (shell, dashboard, entities, payments, agency, reports)
- [ ] Vercel CLI installed: `npm install -g vercel@latest`

## 5-Minute Setup

### Step 1: Get Vercel Credentials (2 min)

```bash
# Login to Vercel
vercel login

# Get org ID
vercel teams list
# Copy ID for antons-projects-1b1c34d6

# Get project IDs
cd apps/shell && vercel link && vercel project ls
cd ../dashboard && vercel link && vercel project ls
cd ../entities && vercel link && vercel project ls
cd ../payments && vercel link && vercel project ls
cd ../agency && vercel link && vercel project ls
cd ../reports && vercel link && vercel project ls

# Create API token
# Go to: https://vercel.com/account/tokens
# Create token for team antons-projects-1b1c34d6
# Copy token (shown only once!)
```

### Step 2: Add GitHub Secrets (2 min)

Go to: `https://github.com/[org]/Pleeno/settings/secrets/actions`

Add these 8 secrets:

| Secret | Value |
|--------|-------|
| `VERCEL_TOKEN` | Token from Step 1 |
| `VERCEL_ORG_ID` | Org ID from Step 1 |
| `VERCEL_PROJECT_ID_SHELL` | Shell project ID |
| `VERCEL_PROJECT_ID_DASHBOARD` | Dashboard project ID |
| `VERCEL_PROJECT_ID_ENTITIES` | Entities project ID |
| `VERCEL_PROJECT_ID_PAYMENTS` | Payments project ID |
| `VERCEL_PROJECT_ID_AGENCY` | Agency project ID |
| `VERCEL_PROJECT_ID_REPORTS` | Reports project ID |

### Step 3: Configure Vercel Projects (1 min per project)

For each of the 6 projects in Vercel dashboard:

**Settings → General:**
- Build Command: `echo 'Build happens in GitHub Actions'`
- Install Command: `echo 'Dependencies installed in GitHub Actions'`
- Output Directory: `.next`
- Root Directory: `apps/[app-name]`

**Settings → Git:**
- Ignore Build Step: `echo 'Deployment via GitHub Actions only'`

## First Deployment

### Test with Preview (Recommended)

```bash
# Create test branch
git checkout -b test/first-deployment

# Make small change
echo "// First deployment test" >> apps/shell/app/page.tsx

# Commit and push
git add .
git commit -m "test: first deployment"
git push origin test/first-deployment

# Create PR on GitHub
# Watch GitHub Actions run
# Check PR comment for preview URLs
```

### Deploy to Production

```bash
# If preview looks good, merge PR
# Or push directly to main:
git checkout main
git push origin main

# Watch deployment at:
# https://github.com/[org]/Pleeno/actions
```

## Verify Deployment

```bash
# Run verification script
./scripts/verify-multizone.sh https://plenno.com.au
```

Expected output:
```
Testing Shell App
Testing Shell homepage... ✓ (200)

Testing Multi-Zone Routes
Testing Dashboard route... ✓ (200)
Testing Entities route... ✓ (200)
Testing Payments route... ✓ (200)
Testing Agency route... ✓ (200)
Testing Reports route... ✓ (200)

✓ All tests passed!
```

## Common Commands

```bash
# Manual deployment (requires VERCEL_TOKEN env var)
export VERCEL_TOKEN="your-token"
./scripts/deploy-all.sh production

# Local build test
pnpm install --frozen-lockfile
pnpm build

# Verify workflow files
actionlint .github/workflows/*.yml

# Check Vercel projects
vercel projects ls --token="$VERCEL_TOKEN"
```

## Workflow Files

- [.github/workflows/deploy-production.yml](.github/workflows/deploy-production.yml) - Production (main branch)
- [.github/workflows/deploy-preview.yml](.github/workflows/deploy-preview.yml) - Preview (pull requests)

## Troubleshooting

**Build fails:**
```bash
# Test locally
pnpm build
```

**Deployment fails:**
```bash
# Check GitHub secrets are correct
# Verify Vercel project IDs match
# Check Vercel token hasn't expired
```

**Multi-zone routes don't work:**
```bash
# Check shell environment variables in Vercel
cd apps/shell
vercel env ls --token="$VERCEL_TOKEN"

# Verify URLs are set correctly
```

## Full Documentation

- [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md) - Complete setup guide
- [TESTING_PLAN.md](TESTING_PLAN.md) - Comprehensive testing guide

## Support

- GitHub Actions logs: `https://github.com/[org]/Pleeno/actions`
- Vercel dashboard: `https://vercel.com/antons-projects-1b1c34d6`
- Check workflow runs for detailed error messages

---

**Need help?** Check [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md) troubleshooting section.
