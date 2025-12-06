# Vercel Deployment Configuration Guide

## Current State

You have existing UAT projects in Vercel:
- `pleeno-shell-uat` - https://pleeno-shell-uat-antons-projects-1b1c34d6.vercel.app
- `pleeno-dashboard-uat` - https://dashboard.plenno.com.au (already has custom domain!)
- `pleeno-agency-uat` - https://pleeno-agency-uat-antons-projects-1b1c34d6.vercel.app
- `pleeno-entities-uat` - https://pleeno-entities-uat-antons-projects-1b1c34d6.vercel.app
- `pleeno-payments-uat` - https://pleeno-payments-uat-antons-projects-1b1c34d6.vercel.app
- `pleeno-reports-uat` - https://pleeno-reports-uat-antons-projects-1b1c34d6.vercel.app

## What's Been Done

✅ Removed `basePath` from all app next.config.ts files
✅ Created proper environment configuration files (.env.production, .env.development)
✅ Updated turbo.json with caching configuration
✅ Created vercel.json files for each app

## Manual Steps Required in Vercel Dashboard

### For EACH Project (pleeno-*-uat):

#### 1. Go to Project Settings → General

Set the **Root Directory**:
- Shell: `apps/shell`
- Dashboard: `apps/dashboard`
- Agency: `apps/agency`
- Entities: `apps/entities`
- Payments: `apps/payments`
- Reports: `apps/reports`

#### 2. Go to Project Settings → Build & Development Settings

Set the **Build Command**:
- Shell: `turbo build --filter=shell`
- Dashboard: `turbo build --filter=dashboard`
- Agency: `turbo build --filter=agency`
- Entities: `turbo build --filter=entities`
- Payments: `turbo build --filter=payments`
- Reports: `turbo build --filter=reports`

Set the **Install Command**: `pnpm install`

Set the **Output Directory**: `.next` (should be default)

#### 3. Go to Project Settings → Environment Variables

Add these for ALL projects:

```bash
NEXT_PUBLIC_COOKIE_DOMAIN=.plenno.com.au
NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au
NEXT_PUBLIC_APP_URL=https://shell.plenno.com.au
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au
NEXT_PUBLIC_AGENCY_URL=https://agency.plenno.com.au
NEXT_PUBLIC_ENTITIES_URL=https://entities.plenno.com.au
NEXT_PUBLIC_PAYMENTS_URL=https://payments.plenno.com.au
NEXT_PUBLIC_REPORTS_URL=https://reports.plenno.com.au
NODE_ENV=production
```

Also add your Supabase credentials (get from existing .env):
```bash
NEXT_PUBLIC_SUPABASE_URL=[your-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-key]
DATABASE_URL=[your-database-url]
```

#### 4. Go to Project Settings → Domains

Add custom domains:
- Shell: `shell.plenno.com.au`
- Dashboard: `dashboard.plenno.com.au` (already done!)
- Agency: `agency.plenno.com.au`
- Entities: `entities.plenno.com.au`
- Payments: `payments.plenno.com.au`
- Reports: `reports.plenno.com.au`

## DNS Configuration

For each subdomain, add a CNAME record in your DNS provider:

```
shell.plenno.com.au     → cname.vercel-dns.com
dashboard.plenno.com.au → cname.vercel-dns.com (may already be done)
agency.plenno.com.au    → cname.vercel-dns.com
entities.plenno.com.au  → cname.vercel-dns.com
payments.plenno.com.au  → cname.vercel-dns.com
reports.plenno.com.au   → cname.vercel-dns.com
```

## Deployment Commands

After configuration, deploy using:

```bash
# Deploy all apps
git push origin main

# Or deploy individually from each app directory:
cd apps/shell && npx vercel --prod
cd apps/dashboard && npx vercel --prod
# etc.
```

## Verification

After deployment, run:
```bash
./scripts/verify-deployment.sh
```

Test URLs:
- https://shell.plenno.com.au
- https://dashboard.plenno.com.au
- https://agency.plenno.com.au
- https://entities.plenno.com.au
- https://payments.plenno.com.au
- https://reports.plenno.com.au

## Important Notes

1. The dashboard already has its custom domain configured, which is great!
2. All projects need the same environment variables
3. Cookie domain MUST include the dot prefix (`.plenno.com.au`)
4. Each project must have its own Root Directory setting
5. Build commands use turbo filters for efficiency

## Troubleshooting

If deployment fails:
1. Check Root Directory is set correctly in Vercel Dashboard
2. Verify pnpm is set as install command
3. Ensure all environment variables are set
4. Check that basePath is removed from next.config.ts files