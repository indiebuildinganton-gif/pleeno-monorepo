# Fix Pleeno Dashboard Authentication & Deploy to Vercel

## Context
You are working on a Next.js multi-zone architecture application called Pleeno with the following structure:
- **Shell app** (`shell.plenno.com.au`) - Main authentication entry point at `/login`
- **Dashboard app** (`dashboard.plenno.com.au`) - Requires authentication from shell
- **Other zones**: agency, entities, payments, reports (all `*.plenno.com.au` subdomains)

## Current Problem
Authentication is not carrying over from shell to dashboard. Users can login at `https://shell.plenno.com.au/login` but when redirected to `https://dashboard.plenno.com.au`, they're sent back to login page. The dashboard shows "Invalid credentials" when trying to authenticate directly.

## Root Causes Identified
1. **Cookie domain mismatch** - Cookies need domain `.plenno.com.au` to share across subdomains
2. **Middleware bug** - Dashboard middleware has a null reference error
3. **Deployment issues** - Dashboard is running old code from 1-2 days ago
4. **API route issues** - Dashboard `/api/auth/login` doesn't exist or isn't working

## Required Fixes

### 1. Fix Dashboard Middleware (`/apps/dashboard/middleware.ts`)
**Critical Bug at line 148**: Change `user.id` to `userId` to avoid null reference:

```typescript
// WRONG (line 148):
console.log('[Middleware] Setting headers for user:', user.id)

// CORRECT:
console.log('[Middleware] Setting headers for user:', userId)
```

The middleware already has cookie domain configuration but needs this bug fix.

### 2. Verify Shell Login Page (`/apps/shell/app/(auth)/login/page.tsx`)
Ensure it has the multi-zone redirect import and usage:
```typescript
import { getMultiZoneRedirectUrl } from '@/lib/multi-zone-redirect'

// In onSubmit function:
const finalRedirectUrl = getMultiZoneRedirectUrl(redirectTo)
window.location.href = finalRedirectUrl
```

### 3. Check Multi-Zone Redirect Handler (`/apps/shell/lib/multi-zone-redirect.ts`)
This file should exist with proper zone mapping. If missing, create it:
```typescript
const zoneConfig = {
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'https://dashboard.plenno.com.au',
  agency: process.env.NEXT_PUBLIC_AGENCY_URL || 'https://agency.plenno.com.au',
  entities: process.env.NEXT_PUBLIC_ENTITIES_URL || 'https://entities.plenno.com.au',
  payments: process.env.NEXT_PUBLIC_PAYMENTS_URL || 'https://payments.plenno.com.au',
  reports: process.env.NEXT_PUBLIC_REPORTS_URL || 'https://reports.plenno.com.au',
}

export function getMultiZoneRedirectUrl(path: string): string {
  if (path === '/' || !path) return '/dashboard'
  const segments = path.split('/').filter(Boolean)
  const firstSegment = segments[0]?.toLowerCase()

  if (firstSegment && firstSegment in zoneConfig) {
    const zoneUrl = zoneConfig[firstSegment as keyof typeof zoneConfig]
    const zonePath = '/' + segments.slice(1).join('/')
    return `${zoneUrl}${zonePath || ''}`
  }

  return path
}
```

### 4. Environment Variables Check
Verify ALL zones have these variables set in Vercel:
```env
NEXT_PUBLIC_COOKIE_DOMAIN=.plenno.com.au
NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ

# Zone URLs
NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au
NEXT_PUBLIC_AGENCY_URL=https://agency.plenno.com.au
NEXT_PUBLIC_ENTITIES_URL=https://entities.plenno.com.au
NEXT_PUBLIC_PAYMENTS_URL=https://payments.plenno.com.au
NEXT_PUBLIC_REPORTS_URL=https://reports.plenno.com.au
```

## Deployment Instructions

### Step 1: Create Proper Vercel Configuration
Create `/vercel-dashboard.json` in the project root:
```json
{
  "buildCommand": "pnpm run build:dashboard",
  "outputDirectory": "apps/dashboard/.next",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs"
}
```

### Step 2: Deploy Dashboard
From the project root directory:

```bash
# Link to the dashboard project
npx vercel link --project pleeno-dashboard-uat --yes --scope antons-projects-1b1c34d6

# Deploy with force flag to bypass cache
npx vercel --prod --force --local-config vercel-dashboard.json --scope antons-projects-1b1c34d6
```

### Step 3: Handle Potential Build Issues
If the build fails with API route errors about "Dynamic server usage":
1. These are warnings about API routes that can't be statically generated
2. The deployment may still work for the middleware fix
3. If critical, add `export const dynamic = 'force-dynamic'` to problematic API routes

### Step 4: Monitor Deployment
```bash
# Check deployment status
npx vercel list --scope antons-projects-1b1c34d6

# Look for "Ready" status for dashboard deployments
```

### Step 5: Verify After Deployment
Test the authentication flow:
1. Clear all cookies for `*.plenno.com.au`
2. Visit `https://shell.plenno.com.au/login`
3. Login with credentials: `admin@test.local` / `password`
4. Should redirect to `https://dashboard.plenno.com.au`
5. Dashboard should be accessible without redirecting back to login

## Troubleshooting

### If deployments are stuck "Queued" or "Building":
- Vercel's build queue may be congested
- Check for existing builds: `npx vercel list --scope antons-projects-1b1c34d6`
- Cancel stuck builds if needed
- Try deploying from the dashboard app directory directly:
  ```bash
  cd apps/dashboard
  npx vercel --prod --force --scope antons-projects-1b1c34d6
  ```

### If authentication still doesn't work:
1. Check browser DevTools > Application > Cookies
2. Verify cookie has domain `.plenno.com.au` (with leading dot)
3. Check middleware logs in Vercel Functions tab
4. Ensure environment variables are set in Vercel dashboard

### Current Known Issues:
- Dashboard `/api/auth/login` endpoint returns "Invalid credentials"
- This is expected - dashboard shouldn't have its own login, it uses shell's authentication
- Authentication should work via shared cookies, not direct API calls

## Success Criteria
✅ User can login at `https://shell.plenno.com.au/login`
✅ After login, user is redirected to `https://dashboard.plenno.com.au`
✅ Dashboard recognizes the authenticated user (no redirect back to login)
✅ Cookie with domain `.plenno.com.au` is visible in browser DevTools
✅ Navigation between zones maintains authentication state

## Important Files Modified
- `/apps/dashboard/middleware.ts` - Fixed null reference bug
- `/apps/shell/app/(auth)/login/page.tsx` - Uses multi-zone redirect
- `/apps/shell/lib/multi-zone-redirect.ts` - Handles cross-zone redirects
- `/vercel-dashboard.json` - Deployment configuration

## Project Information
- Scope: `antons-projects-1b1c34d6`
- Dashboard Project: `pleeno-dashboard-uat`
- Shell Project: `pleeno-shell-uat`
- Framework: Next.js 16.0.7 with Turbopack
- Package Manager: pnpm 10.20.0
- Monorepo Tool: Turborepo

## Notes
- The dashboard app is part of a pnpm workspace monorepo
- Build command must be run from root: `pnpm run build:dashboard`
- All zones share the same Supabase instance for authentication
- Cookie-based authentication with HTTP-only cookies for security
- Custom domains are already configured and working

## Current Status (as of last session)
- ✅ Shell app has updated code with multi-zone redirects
- ❌ Dashboard app still running old deployment without fixes
- ⏳ Multiple deployments queued/building in Vercel
- 🔧 Latest build had API route errors but middleware compiled successfully

Start by checking the current deployment status and applying the middleware fix if not already done, then proceed with deployment.