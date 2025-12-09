#!/bin/bash

# Vercel Deployment Scripts - Quick Start Guide
# Follow these steps to get started with automated deployments

# ============================================================================
# INSTALLATION (5 minutes)
# ============================================================================

# 1. Install Vercel CLI globally
npm install -g vercel

# 2. Login to your Vercel account
vercel login
# Follow the browser prompts

# 3. Copy scripts to your project
mkdir -p scripts/deploy
# Copy these files to scripts/deploy/:
#   - common.sh
#   - setup.sh
#   - deploy-all.sh
#   - deploy-shell.sh
#   - deploy-dashboard.sh
#   - deploy-entities.sh
#   - deploy-payments.sh
#   - deploy-agency.sh
#   - deploy-reports.sh
#   - list-env.sh
#   - pull-env.sh

# 4. Navigate to scripts directory
cd scripts/deploy

# 5. Make scripts executable
chmod +x *.sh

# 6. Run initial setup
./setup.sh

# ============================================================================
# CONFIGURATION (10 minutes)
# ============================================================================

# 1. Edit environment variables file
nano .env.vercel
# OR use your preferred editor:
# vim .env.vercel
# code .env.vercel

# Update these with your values:
# NEXT_PUBLIC_SUPABASE_URL = your-supabase-url
# NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key

# ============================================================================
# FIRST DEPLOYMENT (10-20 minutes)
# ============================================================================

# Option A: Deploy all apps at once
./deploy-all.sh

# Option B: Deploy child apps individually, then shell
# (Run from scripts/deploy directory)
./deploy-dashboard.sh
./deploy-entities.sh
./deploy-payments.sh
./deploy-agency.sh
./deploy-reports.sh
./deploy-shell.sh

# ============================================================================
# POST-DEPLOYMENT (5 minutes)
# ============================================================================

# 1. Note the deployment URLs from each app

# 2. Update shell environment variables if needed
# Edit .env.vercel with the actual deployment URLs
nano .env.vercel

# 3. Redeploy shell with correct URLs
./deploy-shell.sh

# 4. Configure custom domain
# Go to: https://vercel.com/dashboard
# Select: pleeno-shell-uat project
# Navigate to: Settings → Domains
# Add: plenno.com.au
# Follow DNS configuration instructions

# 5. Wait for DNS propagation (5-60 minutes)
# Check: https://dnschecker.org

# 6. Test everything
# Visit: https://plenno.com.au
# Test routes:
#   - /dashboard
#   - /entities
#   - /payments
#   - /agency
#   - /reports

# ============================================================================
# FUTURE DEPLOYMENTS (Ongoing)
# ============================================================================

# Deploy single app
./deploy-dashboard.sh

# Deploy all apps
./deploy-all.sh

# Update env vars without deploying
ENV_ONLY=true ./deploy-dashboard.sh

# Check what would happen (dry run)
DRY_RUN=true ./deploy-dashboard.sh

# View environment variables
./list-env.sh dashboard

# Pull env vars to local file
./pull-env.sh dashboard .env.local

# View logs
tail logs/deploy_*.log

# ============================================================================
# HELPFUL COMMANDS
# ============================================================================

# List all your Vercel projects
vercel projects ls

# Check deployment status
vercel deployments

# View project environment variables
vercel env ls --prod

# Add new environment variable (interactive)
vercel env add MY_VAR

# Remove environment variable
vercel env remove MY_VAR

# Check deployment logs
vercel logs pleeno-dashboard-uat

# See available Vercel commands
vercel --help

# ============================================================================
# ENVIRONMENT VARIABLES REFERENCE
# ============================================================================

# These are the environment variables used in deployment:
# Located in: scripts/deploy/.env.vercel

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# After deployment, add these:
NEXT_PUBLIC_DASHBOARD_URL=https://pleeno-dashboard-uat.vercel.app
NEXT_PUBLIC_ENTITIES_URL=https://pleeno-entities-uat.vercel.app
NEXT_PUBLIC_PAYMENTS_URL=https://pleeno-payments-uat.vercel.app
NEXT_PUBLIC_AGENCY_URL=https://pleeno-agency-uat.vercel.app
NEXT_PUBLIC_REPORTS_URL=https://pleeno-reports-uat.vercel.app

NEXT_PUBLIC_SHELL_URL=https://plenno.com.au
NEXT_PUBLIC_APP_URL=https://plenno.com.au

NODE_ENV=production

# ============================================================================
# TROUBLESHOOTING
# ============================================================================

# Script not found?
# → Make sure you're in scripts/deploy directory
# → cd scripts/deploy

# "vercel: command not found"?
# → Install: npm install -g vercel
# → Verify: vercel --version

# "Not authenticated"?
# → Login: vercel login
# → Verify: vercel whoami

# Environment variables not updating?
# → Check: ./list-env.sh dashboard
# → Redeploy: ./deploy-dashboard.sh

# Permission denied?
# → Make executable: chmod +x *.sh
# → Verify: ls -la *.sh

# For more help, see: README.md

# ============================================================================
# SUCCESS CHECKLIST
# ============================================================================

# After deployment, verify:
# ☐ All 6 apps deployed to Vercel
# ☐ Custom domain plenno.com.au configured
# ☐ Environment variables set correctly
# ☐ Can access https://plenno.com.au
# ☐ Can access https://plenno.com.au/dashboard
# ☐ Can access https://plenno.com.au/entities
# ☐ Can access https://plenno.com.au/payments
# ☐ Can access https://plenno.com.au/agency
# ☐ Can access https://plenno.com.au/reports
# ☐ Login works and persists across routes
# ☐ No console errors in browser DevTools

# ============================================================================
# NEXT STEPS
# ============================================================================

# 1. Set up monitoring
#    → Use Vercel Analytics
#    → Set up error tracking (Sentry)

# 2. Configure CI/CD
#    → GitHub Actions for automated deployments
#    → Deploy on push to main branch

# 3. Document for team
#    → Create deployment runbook
#    → Document rollback procedures
#    → Share environment variable locations

# 4. Regular backups
#    → Export environment variables regularly
#    → Keep .env.vercel in secure location
#    → Use GitHub Secrets for tokens

# ============================================================================
# DOCUMENTATION
# ============================================================================

# For detailed information, see:
# - README.md (comprehensive guide)
# - Each script has inline comments
# - Vercel CLI docs: https://vercel.com/docs/cli
# - Next.js deployment: https://nextjs.org/docs/deployment

# ============================================================================
# SUPPORT
# ============================================================================

# View script help
./setup.sh --help
./list-env.sh --help
./pull-env.sh --help

# Check logs for errors
cat logs/deploy_*.log

# View recent logs
tail -50 logs/deploy_*.log | grep -E "error|ERROR|Error"

# ============================================================================
