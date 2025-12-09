# Vercel Deployment Scripts for macOS

Complete automation solution for deploying all 6 apps with environment variable management.

## Setup Instructions

### 1. Prerequisites

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel (do this once)
vercel login

# Verify installation
vercel --version
```

### 2. Create Directory Structure

```bash
mkdir -p scripts/deploy
cd scripts/deploy
```

### 3. Create Environment File

Create `scripts/deploy/.env.vercel` with all your environment variables:

```bash
# scripts/deploy/.env.vercel

# Supabase Configuration (shared across all apps)
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key

# Multi-Zone Production URLs (update after first deployment)
NEXT_PUBLIC_DASHBOARD_URL=https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL=https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL=https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL=https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL=https://pleeno-reports-uat.vercel.app

# Shell-specific
NEXT_PUBLIC_SHELL_URL=https://plenno.com.au
NEXT_PUBLIC_APP_URL=https://plenno.com.au

# Environment
NODE_ENV=production
```

### 4. Make Scripts Executable

```bash
chmod +x scripts/deploy/*.sh
```

---

## Script Files

### Main Helper Functions: `scripts/deploy/common.sh`

This file contains shared utility functions used by all deployment scripts.

### Individual App Scripts

Create one script per app:
- `scripts/deploy/deploy-shell.sh` - Shell app
- `scripts/deploy/deploy-dashboard.sh` - Dashboard app
- `scripts/deploy/deploy-entities.sh` - Entities app
- `scripts/deploy/deploy-payments.sh` - Payments app
- `scripts/deploy/deploy-agency.sh` - Agency app
- `scripts/deploy/deploy-reports.sh` - Reports app

---

## Usage Examples

### Deploy Single App

```bash
# Deploy dashboard
./scripts/deploy/deploy-dashboard.sh

# Deploy with environment override
ENV_TYPE=production ./scripts/deploy/deploy-dashboard.sh

# Deploy and skip confirmation
SKIP_CONFIRM=true ./scripts/deploy/deploy-dashboard.sh
```

### Deploy All Apps Sequentially

```bash
./scripts/deploy/deploy-all.sh
```

### Deploy with Specific Branch

```bash
BRANCH=staging ./scripts/deploy/deploy-dashboard.sh
```

### Just Update Environment Variables (No Deploy)

```bash
ENV_ONLY=true ./scripts/deploy/deploy-dashboard.sh
```

### List Current Environment Variables

```bash
./scripts/deploy/list-env.sh dashboard
```

---

## Features

✅ **Automated Environment Variable Management**
- Reads from `.env.vercel` file
- Supports production, preview, and development environments
- Validates variables before pushing

✅ **Error Handling**
- Checks for missing environment variables
- Validates Vercel CLI is installed
- Catches deployment failures with clear error messages

✅ **Interactive Confirmations**
- Shows what will be deployed before proceeding
- Allows skipping confirmation with `SKIP_CONFIRM=true`

✅ **Logging**
- Timestamped logs for all operations
- Easy troubleshooting and audit trail
- Log files saved to `scripts/deploy/logs/`

✅ **macOS Optimizations**
- Uses native macOS notifications (optional)
- Respects macOS directory structure
- Compatible with M1/M2/Intel chips

✅ **Flexible Deployment Options**
- Deploy to preview or production
- Skip deployment and update env vars only
- Custom branch specification
- Force rebuild without cache

---

## Environment Variable Targets

Each app can have variables set for these environments:

- **production** - Live environment (main branch)
- **preview** - Preview deployments (non-main branches)
- **development** - Local development (pulled with `vercel env pull`)

By default, scripts deploy to `production` and `preview` environments. Modify the scripts to target different environments as needed.

---

## Troubleshooting

### "vercel: command not found"

```bash
# Check if installed
which vercel

# Install globally if missing
npm install -g vercel

# Or use npx
npx vercel deploy
```

### "Not authenticated"

```bash
vercel login
```

### "Project not linked"

```bash
# From project root, create .vercel link
cd apps/dashboard
vercel link
```

### Environment variables not updating

```bash
# Force redeploy to pick up new env vars
FORCE_REBUILD=true ./scripts/deploy/deploy-dashboard.sh
```

### Check current project setup

```bash
# List all Vercel projects
vercel projects ls

# Check specific project env vars
vercel env ls --prod
```

---

## Advanced Configuration

### Custom Environment File Path

```bash
ENV_FILE=./config/.env.staging ./scripts/deploy/deploy-dashboard.sh
```

### Disable Notifications

```bash
NOTIFICATIONS=false ./scripts/deploy/deploy-dashboard.sh
```

### Set Specific Environment Only

```bash
# Only update preview environment
VERCEL_ENV=preview ./scripts/deploy/deploy-dashboard.sh
```

### Dry Run (No Changes)

```bash
DRY_RUN=true ./scripts/deploy/deploy-dashboard.sh
```

---

## Next Steps

1. Copy script files from sections below
2. Update `.env.vercel` with your actual values
3. Run initial setup: `./scripts/deploy/setup.sh`
4. Deploy first app: `./scripts/deploy/deploy-dashboard.sh`
5. Update shell env vars with deployed URLs
6. Deploy shell: `./scripts/deploy/deploy-shell.sh`

---

## CI/CD Integration

These scripts can be integrated with GitHub Actions:

```yaml
- name: Deploy to Vercel
  run: |
    export VERCEL_TOKEN=${{ secrets.VERCEL_TOKEN }}
    ./scripts/deploy/deploy-dashboard.sh
```

Store `VERCEL_TOKEN` in GitHub Secrets for authentication.
