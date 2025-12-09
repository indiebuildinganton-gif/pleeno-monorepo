# Vercel CLI Deployment Scripts for macOS

Complete automation solution for deploying 6 Next.js apps to Vercel with environment variable management using Bash scripts and the Vercel CLI.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Setup](#setup)
4. [Scripts Overview](#scripts-overview)
5. [Usage Examples](#usage-examples)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Options](#advanced-options)

---

## 🚀 Quick Start

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Navigate to scripts directory
cd scripts/deploy

# 4. Make scripts executable
chmod +x *.sh

# 5. Run setup
./setup.sh

# 6. Update environment variables
nano .env.vercel

# 7. Deploy all apps
./deploy-all.sh
```

---

## 📦 Prerequisites

### Required
- **macOS** (Intel or Apple Silicon)
- **Node.js 14+** and npm
- **Vercel CLI** (installed globally)
- **Bash 4+** (standard on macOS)

### Optional
- **jq** (for JSON parsing) - `brew install jq`
- **curl** (for API calls) - pre-installed on macOS

### Verify Prerequisites

```bash
# Check Node.js
node --version    # Should be 14+

# Check Vercel CLI
vercel --version  # Should be latest

# Check Bash
bash --version    # Should be 4+

# Check jq (optional)
jq --version      # Nice to have
```

---

## 🔧 Setup

### Step 1: Install Vercel CLI Globally

```bash
npm install -g vercel
```

### Step 2: Authenticate with Vercel

```bash
vercel login
# Follow prompts to authenticate
```

### Step 3: Prepare Scripts Directory

```bash
# Copy all script files to your project
mkdir -p scripts/deploy
cd scripts/deploy

# Copy all .sh files to this directory
# Files needed:
# - common.sh
# - setup.sh
# - deploy-all.sh
# - deploy-shell.sh
# - deploy-dashboard.sh
# - deploy-entities.sh
# - deploy-payments.sh
# - deploy-agency.sh
# - deploy-reports.sh
# - list-env.sh
# - pull-env.sh
```

### Step 4: Make Scripts Executable

```bash
chmod +x scripts/deploy/*.sh
```

### Step 5: Run Initial Setup

```bash
cd scripts/deploy
./setup.sh
```

This will:
- Verify Vercel authentication
- Create `.env.vercel` template
- Create `logs/` directory
- Show your existing Vercel projects

### Step 6: Configure Environment Variables

Edit `scripts/deploy/.env.vercel`:

```bash
# Edit the file
nano scripts/deploy/.env.vercel

# OR use your preferred editor
code scripts/deploy/.env.vercel
```

Update with your actual values:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

---

## 📚 Scripts Overview

### Core Deployment Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup.sh` | Initial configuration | `./setup.sh` |
| `deploy-all.sh` | Deploy all 6 apps | `./deploy-all.sh` |
| `deploy-shell.sh` | Deploy shell app | `./deploy-shell.sh` |
| `deploy-dashboard.sh` | Deploy dashboard app | `./deploy-dashboard.sh` |
| `deploy-entities.sh` | Deploy entities app | `./deploy-entities.sh` |
| `deploy-payments.sh` | Deploy payments app | `./deploy-payments.sh` |
| `deploy-agency.sh` | Deploy agency app | `./deploy-agency.sh` |
| `deploy-reports.sh` | Deploy reports app | `./deploy-reports.sh` |

### Utility Scripts

| Script | Purpose | Usage |
|--------|---------|-------|
| `common.sh` | Shared functions (sourced by others) | `source common.sh` |
| `list-env.sh` | List env vars for a project | `./list-env.sh dashboard` |
| `pull-env.sh` | Pull env vars from Vercel | `./pull-env.sh dashboard` |

---

## 💻 Usage Examples

### Deploy Single App

```bash
# Deploy dashboard
./deploy-dashboard.sh

# Deploy with auto-confirm (no prompts)
SKIP_CONFIRM=true ./deploy-dashboard.sh

# Deploy without updating env vars
ENV_ONLY=false ./deploy-dashboard.sh
```

### Deploy All Apps

```bash
# Deploy all 6 apps in correct order
./deploy-all.sh

# Deploy all without prompts
SKIP_CONFIRM=true ./deploy-all.sh
```

### Dry Run (Preview Changes)

```bash
# See what would be deployed without making changes
DRY_RUN=true ./deploy-dashboard.sh
```

### Update Environment Variables Only

```bash
# Update env vars but don't deploy
ENV_ONLY=true ./deploy-dashboard.sh
```

### Force Rebuild

```bash
# Rebuild without using cache
FORCE_REBUILD=true ./deploy-dashboard.sh
```

### Disable Notifications

```bash
# Don't show macOS notifications
NOTIFICATIONS=false ./deploy-dashboard.sh
```

### Custom Environment File

```bash
# Use different env file
ENV_FILE=./config/.env.production ./deploy-dashboard.sh
```

### List Environment Variables

```bash
# List production env vars for dashboard
./list-env.sh dashboard production

# List preview env vars
./list-env.sh dashboard preview
```

### Pull Environment Variables

```bash
# Pull dashboard env vars to .env.local
./pull-env.sh dashboard

# Pull to custom file
./pull-env.sh dashboard .env.production
```

---

## 🔐 Environment Variables

### `.env.vercel` File Format

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Multi-Zone URLs
NEXT_PUBLIC_DASHBOARD_URL=https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL=https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL=https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL=https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL=https://pleeno-reports-uat.vercel.app

# Shell Configuration
NEXT_PUBLIC_SHELL_URL=https://plenno.com.au
NEXT_PUBLIC_APP_URL=https://plenno.com.au

# Environment
NODE_ENV=production

# Comments are ignored with # prefix
# Empty lines are also ignored
```

### Variable Targets

Each variable is deployed to:
- **production** - Main branch / production deployment
- **preview** - Non-main branches

Modify `push_env_vars()` in `common.sh` to target different environments.

### Sensitive Variables

For secrets, you can:

**Option 1: Use Vercel Dashboard**
```bash
# Manually add secrets via https://vercel.com/dashboard
# Better security for sensitive values
```

**Option 2: Use Environment Variable in Script**
```bash
# Add to .env.vercel (make sure .gitignore excludes it)
SECRET_API_KEY=your-secret-value

# Or pass via command line
SECRET_API_KEY=your-secret-value ./deploy-dashboard.sh
```

**Option 3: Use `vercel` CLI Directly**
```bash
# Securely add secret without storing in file
vercel env add SECRET_KEY production
# Will prompt for value (won't show in bash history)
```

---

## 🐛 Troubleshooting

### "vercel: command not found"

```bash
# Check if installed
which vercel

# Install globally
npm install -g vercel

# Or use npx (requires Node.js)
npx vercel deploy
```

### "Not authenticated"

```bash
# Login to Vercel
vercel login

# Verify authentication
vercel whoami
```

### "Project not found"

```bash
# Verify project exists
vercel projects ls

# Make sure project name in script matches Vercel dashboard
# Check: pleeno-dashboard-uat, pleeno-shell-uat, etc.
```

### "Environment variables not updating"

```bash
# Check VERCEL_TOKEN is set
echo $VERCEL_TOKEN

# Manually verify in Vercel dashboard
# Settings → Environment Variables

# Try pulling fresh from Vercel
./pull-env.sh dashboard
```

### "Deployment stuck/slow"

```bash
# Check deployment status
vercel deployments

# Cancel stuck deployment
vercel deployments --state=building --limit=1

# Retry with force rebuild
FORCE_REBUILD=true ./deploy-dashboard.sh
```

### "Permission denied" on scripts

```bash
# Make all scripts executable
chmod +x scripts/deploy/*.sh

# Verify permissions
ls -la scripts/deploy/*.sh
# Should show: -rwxr-xr-x (with x for executable)
```

### "Cannot read .env.vercel"

```bash
# Check file exists
ls -la scripts/deploy/.env.vercel

# Check it's in right location
pwd  # Should be in scripts/deploy/

# Create if missing
./setup.sh
```

### "DRY_RUN shows as empty"

```bash
# DRY_RUN prevents actual deployment
# To verify what would happen, use:
DRY_RUN=true SKIP_CONFIRM=true ./deploy-dashboard.sh

# Check logs for what would have happened:
tail logs/deploy_*.log
```

### macOS Notification Fails

```bash
# Notifications require full Disk Access on Catalina+
# System Preferences → Security & Privacy → Full Disk Access
# Add Terminal or iTerm2

# Or disable notifications
NOTIFICATIONS=false ./deploy-dashboard.sh
```

---

## 🔧 Advanced Options

### Environment Variables for Scripts

All scripts support these environment variables:

```bash
# Core Options
VERCEL_TOKEN           # Your Vercel API token (auto from vercel login)
SKIP_CONFIRM          # Skip confirmation prompts (true/false)
DRY_RUN               # Preview without making changes (true/false)
ENV_ONLY              # Update env vars but don't deploy (true/false)
NOTIFICATIONS         # Send macOS notifications (true/false)
FORCE_REBUILD         # Force rebuild without cache (true/false)

# File Locations
ENV_FILE              # Path to .env.vercel file
LOG_DIR               # Path to logs directory
SCRIPT_DIR            # Path to scripts directory
PROJECT_ROOT          # Path to project root

# Vercel Options
VERCEL_ENV            # Vercel environment (production/preview/development)
```

### Example: Complex Deployment

```bash
# Deploy dashboard to production with new vars, show notifications, force rebuild
SKIP_CONFIRM=true FORCE_REBUILD=true NOTIFICATIONS=true ./deploy-dashboard.sh

# Dry run to see what would happen
DRY_RUN=true SKIP_CONFIRM=true ./deploy-all.sh

# Deploy with custom env file
ENV_FILE=/config/.env.staging ./deploy-dashboard.sh

# Deploy with custom log location
LOG_DIR=/var/log/vercel ./deploy-dashboard.sh
```

### Custom Deployment Hooks

Edit individual deployment scripts to add custom hooks:

```bash
# In deploy-dashboard.sh, add before deployment:

# Run tests
npm run test:dashboard || exit 1

# Build locally first
npm run build:dashboard || exit 1

# Custom validation
./validate-dashboard.sh || exit 1
```

### Integration with CI/CD

#### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install Vercel CLI
        run: npm install -g vercel
      
      - name: Deploy Dashboard
        run: |
          export VERCEL_TOKEN=${{ secrets.VERCEL_TOKEN }}
          export SKIP_CONFIRM=true
          ./scripts/deploy/deploy-dashboard.sh
      
      - name: Deploy All Others
        run: |
          export VERCEL_TOKEN=${{ secrets.VERCEL_TOKEN }}
          export SKIP_CONFIRM=true
          ./scripts/deploy/deploy-all.sh
```

#### GitLab CI Example

```yaml
# .gitlab-ci.yml
deploy_dashboard:
  stage: deploy
  script:
    - npm install -g vercel
    - export VERCEL_TOKEN=$VERCEL_TOKEN
    - export SKIP_CONFIRM=true
    - ./scripts/deploy/deploy-dashboard.sh
  only:
    - main
```

---

## 📊 Deployment Flow

### Manual Deployment Order

1. **Deploy child apps first** (in any order):
   ```bash
   ./deploy-dashboard.sh
   ./deploy-entities.sh
   ./deploy-payments.sh
   ./deploy-agency.sh
   ./deploy-reports.sh
   ```

2. **Collect deployment URLs** from Vercel dashboard

3. **Update shell environment variables** with child URLs

4. **Deploy shell**:
   ```bash
   ./deploy-shell.sh
   ```

5. **Configure custom domain**:
   - Vercel Dashboard → Shell Project → Settings → Domains
   - Add `plenno.com.au`
   - Configure DNS with your registrar

6. **Test everything**:
   ```bash
   curl https://plenno.com.au
   curl https://plenno.com.au/dashboard
   curl https://plenno.com.au/entities
   ```

### Automated Deployment

```bash
# Deploy all apps automatically in correct order
./deploy-all.sh
```

This handles the order automatically.

---

## 📝 Logs

### Log Files Location

```bash
scripts/deploy/logs/deploy_YYYY-MM-DD_HH-MM-SS.log
```

### View Recent Logs

```bash
# Show most recent log
cat scripts/deploy/logs/deploy_*.log | tail -100

# Follow deployment in real-time
tail -f scripts/deploy/logs/deploy_*.log

# Search logs for errors
grep "error" scripts/deploy/logs/deploy_*.log

# Show all logs
ls -lh scripts/deploy/logs/
```

---

## ✅ Success Criteria

Your deployment is complete when:

- ✅ All 6 apps deployed to Vercel
- ✅ Custom domain `plenno.com.au` points to shell
- ✅ Environment variables set for all apps
- ✅ Login redirects to `https://plenno.com.au/dashboard`
- ✅ All routes load correctly:
  - `https://plenno.com.au` - Shell
  - `https://plenno.com.au/dashboard` - Dashboard
  - `https://plenno.com.au/entities` - Entities
  - `https://plenno.com.au/payments` - Payments
  - `https://plenno.com.au/agency` - Agency
  - `https://plenno.com.au/reports` - Reports
- ✅ Authentication persists across routes
- ✅ No console errors in browser DevTools

---

## 🆘 Support

### Useful Commands

```bash
# Check Vercel account
vercel whoami

# List all projects
vercel projects ls

# Check specific project
vercel projects ls | grep pleeno

# View deployment history
vercel deployments

# Check build logs
vercel logs [project-name]

# View project settings
vercel projects inspect pleeno-dashboard-uat

# Update project settings
vercel project settings
```

### Documentation Links

- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel API Reference](https://vercel.com/docs/api)

---

## 📄 License

These scripts are provided as-is for your project deployment.

---

## 🎯 Quick Reference

```bash
# First time setup
./setup.sh
nano .env.vercel
chmod +x *.sh

# Deploy everything
./deploy-all.sh

# Deploy single app
./deploy-dashboard.sh

# List env vars
./list-env.sh dashboard

# Pull env vars
./pull-env.sh dashboard .env.local

# View logs
tail -f logs/deploy_*.log

# Help
./deploy-all.sh --help
./list-env.sh --help
./pull-env.sh --help
```
