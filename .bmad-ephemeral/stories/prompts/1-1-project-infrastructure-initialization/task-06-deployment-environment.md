# Task 6: Set Up Deployment Environment

**Story:** 1.1 - Project Infrastructure Initialization
**Task ID:** 6 of 9
**Acceptance Criteria:** AC 1

## Objective

Configure Vercel deployment for all Next.js zones with proper environment variables and automatic deployments from the main branch.

## Context

Vercel is the recommended deployment platform for Next.js multi-zone architecture. Each zone can be deployed independently while the shell app coordinates routing.

## Tasks

### 1. Install Vercel CLI

```bash
npm install -g vercel
```

### 2. Initialize Vercel Project

**From monorepo root:**
```bash
vercel login
vercel link
```

Follow prompts:
- Set up and deploy: Yes
- Scope: Your account/team
- Link to existing project: No (first time)
- Project name: pleeno
- Directory: `./` (root)
- Override settings: No

### 3. Configure Vercel for Multi-Zone Deployment

**Create `vercel.json` at monorepo root:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "apps/shell/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/dashboard/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/agency/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/entities/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/payments/package.json",
      "use": "@vercel/next"
    },
    {
      "src": "apps/reports/package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/dashboard/(.*)",
      "dest": "apps/dashboard/$1"
    },
    {
      "src": "/agency/(.*)",
      "dest": "apps/agency/$1"
    },
    {
      "src": "/entities/(.*)",
      "dest": "apps/entities/$1"
    },
    {
      "src": "/payments/(.*)",
      "dest": "apps/payments/$1"
    },
    {
      "src": "/reports/(.*)",
      "dest": "apps/reports/$1"
    },
    {
      "src": "/(.*)",
      "dest": "apps/shell/$1"
    }
  ]
}
```

### 4. Set Up Production Environment Variables

**Via Vercel Dashboard:**

1. Go to your project on vercel.com
2. Navigate to Settings → Environment Variables
3. Add the following variables for **Production** environment:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc... (from Supabase Dashboard)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (from Supabase Dashboard)
DATABASE_URL=postgresql://... (from Supabase Dashboard)
NEXT_PUBLIC_APP_URL=https://pleeno.vercel.app
SESSION_SECRET=<generate-new-secret-for-production>
NODE_ENV=production
```

**Important:**
- Use **production Supabase credentials** (not local)
- Generate a **new** session secret for production
- Never reuse local credentials in production

**Via Vercel CLI (alternative):**
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add SESSION_SECRET production
```

### 5. Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create new project: "pleeno-production"
3. Choose region (nearest to users)
4. Generate strong database password
5. Wait for project to initialize
6. Copy API URL and keys from Settings → API
7. Add to Vercel environment variables (step 4)

### 6. Configure Automatic Deployments

**In Vercel Dashboard:**
1. Go to Settings → Git
2. Connect to GitHub repository
3. Set Production Branch: `main`
4. Enable: Automatic deployments from Git
5. Enable: Deploy Previews for all branches

**Update root `package.json` with build commands:**
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "deploy": "vercel --prod"
  }
}
```

### 7. Verify Successful Deployment

**Deploy to production:**
```bash
vercel --prod
```

**Verify:**
1. Visit deployment URL (e.g., `https://pleeno.vercel.app`)
2. Check all zones are accessible:
   - `https://pleeno.vercel.app/` (shell)
   - `https://pleeno.vercel.app/dashboard` (dashboard zone)
   - `https://pleeno.vercel.app/agency` (agency zone)
   - etc.
3. Check Vercel logs for any errors
4. Verify database connection works in production

### 8. Configure Custom Domain (Optional)

**If you have a custom domain:**
1. Go to Vercel Dashboard → Domains
2. Add domain: `pleeno.com`
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_APP_URL` to `https://pleeno.com`

## Alternative: Railway Deployment

**If using Railway instead of Vercel:**

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Initialize: `railway init`
4. Add environment variables: `railway variables set KEY=value`
5. Deploy: `railway up`

**Note:** Vercel is recommended for Next.js multi-zone architecture.

## Verification Steps

1. Verify Vercel project created and linked
2. Verify `vercel.json` configured for multi-zone routing
3. Verify production environment variables set in Vercel dashboard
4. Verify production Supabase project created
5. Verify successful deployment: `vercel --prod`
6. Verify all zones accessible at deployment URL
7. Verify automatic deployments trigger on push to main

## Expected Outcome

- Vercel project configured for multi-zone deployment
- Production environment variables set securely
- Production Supabase project created and connected
- Automatic deployments configured from main branch
- All 6 zones deployed and accessible
- Deployment URL working: `https://pleeno.vercel.app`

## Common Issues & Solutions

**Issue:** Build fails with "Module not found"
**Solution:** Ensure all dependencies are in package.json, run `npm install` locally first

**Issue:** Environment variables not loading in production
**Solution:** Redeploy after setting variables: `vercel --prod --force`

**Issue:** Multi-zone routing not working
**Solution:** Verify `vercel.json` routes and `next.config.js` rewrites match

**Issue:** Database connection fails in production
**Solution:** Verify production Supabase URL and keys are correct in Vercel environment variables

## References

- [Vercel Multi-Zone Docs](https://vercel.com/docs/concepts/solutions/multi-zones)
- [docs/architecture.md](../../docs/architecture.md)
- [Story Context XML](.bmad-ephemeral/stories/1-1-project-infrastructure-initialization.context.xml)
