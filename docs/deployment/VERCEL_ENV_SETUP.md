# Vercel Environment Variables Setup

## Required Environment Variables

All Vercel projects need the following environment variables configured to function properly:

### Supabase Configuration (Required for all apps)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://iadhxztsuzbkbnhkimqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
```

### App URLs (Required for navigation)

```bash
NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au
NEXT_PUBLIC_AGENCY_URL=https://agency.plenno.com.au
NEXT_PUBLIC_ENTITIES_URL=https://entities.plenno.com.au
NEXT_PUBLIC_PAYMENTS_URL=https://payments.plenno.com.au
NEXT_PUBLIC_REPORTS_URL=https://reports.plenno.com.au
```

### Cookie Domain (Required for cross-app authentication)

```bash
NEXT_PUBLIC_COOKIE_DOMAIN=.plenno.com.au
```

### Node Environment

```bash
NODE_ENV=production
```

## How to Set Environment Variables in Vercel

### Option 1: Via Vercel Dashboard

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add each variable for Production environment
4. Redeploy to apply changes

### Option 2: Via Vercel CLI

```bash
# Set a single variable for all environments
vercel env add NEXT_PUBLIC_SUPABASE_URL production

# Or set from a file
vercel env pull .env.production
```

### Option 3: Via GitHub Actions (Automated)

The deployment workflow can set these automatically if stored as GitHub Secrets:

1. Go to GitHub repository Settings → Secrets and variables → Actions
2. Add the following secrets:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
3. Update the workflow to pass them via `--build-env` flag

## Current Status

✅ Middleware updated to handle missing environment variables gracefully
⚠️  Environment variables need to be configured in Vercel for full functionality

## Next Steps

1. Configure environment variables in each Vercel project
2. Test deployments to ensure middleware works correctly
3. Verify cross-app navigation and authentication flow
