# Deep Research Request: Vercel Monorepo Deployment MIDDLEWARE_INVOCATION_FAILED Error

## Problem Summary

All 6 Next.js applications in a pnpm monorepo are successfully deploying to Vercel via GitHub Actions, but ALL apps fail at runtime with:

```
500: INTERNAL_SERVER_ERROR
Code: MIDDLEWARE_INVOCATION_FAILED
```

**Git commit hash with issue**: `5d1ddd79095f2342f18bc01807e42d0c3e8c6f2b`

## Project Architecture

### Monorepo Structure
- **Package manager**: pnpm 9.15.0
- **Framework**: Next.js 16.0.10
- **Runtime**: Node.js ^18.18.0 || ^19.8.0 || >=20.0.0
- **Architecture**: Multi-zone micro-frontend (6 Next.js apps with route rewrites)

### Applications (all experiencing same error)
1. **dashboard** (port 3002, basePath: `/dashboard`)
2. **entities** (port 3001, basePath: `/entities`)
3. **payments** (port 3003, basePath: `/payments`)
4. **agency** (port 3004, basePath: `/agency`)
5. **reports** (port 3000, basePath: `/reports`)
6. **shell** (port 3005, no basePath - orchestrator app with rewrites to all others)

### Key Dependencies
- `@supabase/ssr`: ^0.5.2 (added to ALL app package.json files in commit 60c743c)
- `next`: 16.0.10
- `react`: 19.1.0

## Current Middleware Configuration

### Middleware at Failing Commit (5d1ddd7)
**IMPORTANT**: This is a **minimal test middleware** with NO Supabase imports:

```typescript
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Minimal pass-through middleware for testing
  console.log('Middleware executed for:', request.nextUrl.pathname)
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

**Even this minimal middleware fails with MIDDLEWARE_INVOCATION_FAILED!**

### Previous Middleware (commit 60c743c)
The previous version used Supabase SSR for authentication:

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    // Check if Supabase environment variables are configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("Supabase environment variables not configured")
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Cookie configuration...
          },
          remove(name: string, options: any) {
            // Cookie removal...
          }
        }
      }
    )
    // ... authentication logic
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.next()
  }
}
```

## GitHub Actions Deployment Configuration

### Workflow: `.github/workflows/deploy-production.yml`

**Sequential deployment strategy** (free Vercel tier workaround):

```yaml
# Job dependencies enforce sequence:
deploy-dashboard → deploy-entities → deploy-payments → deploy-agency → deploy-reports → deploy-shell

# Each job follows this pattern:
- Checkout code
- Install Vercel CLI (global npm install vercel@latest)
- Pull Vercel environment: vercel pull --yes --environment=production
- Deploy with timeout: timeout 900 vercel --prod --token=$TOKEN --yes
```

**Key details**:
- Each app has separate `VERCEL_PROJECT_ID_*` secret
- Shared `VERCEL_ORG_ID` and `VERCEL_TOKEN`
- Shell app receives URLs from previous deployments via `--build-env` flags
- All deployments report SUCCESS in GitHub Actions
- Build commands execute from monorepo root

### Vercel Configuration Files

#### `apps/dashboard/vercel.json`
```json
{
  "buildCommand": "cd ../.. && pnpm install --frozen-lockfile --ignore-scripts && cd apps/dashboard && pnpm exec next build",
  "installCommand": "echo 'Install handled in buildCommand'",
  "framework": null,
  "outputDirectory": ".next"
}
```

#### `apps/dashboard/next.config.ts`
```typescript
const nextConfig: NextConfig = {
  basePath: '/dashboard',
  serverExternalPackages: [],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
};
```

#### Root `package.json` (monorepo)
```json
{
  "name": "pleeno-monorepo",
  "workspaces": ["apps/*", "packages/*"],
  "packageManager": "pnpm@9.15.0"
}
```

## Environment Variables

### Required (per docs/deployment/VERCEL_ENV_SETUP.md)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://iadhxztsuzbkbnhkimqv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<actual-key>
NEXT_PUBLIC_COOKIE_DOMAIN=.plenno.com.au
NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au
# ... other app URLs
NODE_ENV=production
```

### Current Status (UNKNOWN)
- NOT confirmed whether these are set in Vercel dashboard for each project
- NOT passed via GitHub Actions `--build-env` flags (except shell app URLs)
- Middleware has env var checks but still fails even with minimal version

## Troubleshooting History (Commit Sequence)

1. **cc02179**: Added env var checks to middleware
2. **7f3f3a5**: Tried redeployment with environment variables
3. **aa92b29**: Wrapped middleware in try-catch blocks
4. **06a94b8**: Fixed indentation errors in shell middleware
5. **60c743c**: Added `@supabase/ssr` to all app package.json files (suspected module resolution issue)
6. **5d1ddd7**: Replaced ALL middleware with minimal pass-through version **← STILL FAILS**

## Research Questions

### 1. Next.js 16 Edge Runtime Middleware
- Are there breaking changes in Next.js 16.0.10 middleware runtime that affect Vercel Edge Runtime?
- Do Next.js 16 middleware files require specific runtime exports or configuration?
- Are there known compatibility issues with React 19 + Next.js 16 middleware?

### 2. Vercel Monorepo Configuration
- How should `vercel.json` buildCommand be configured for pnpm monorepos?
- Does each Vercel project need separate node_modules or can they share workspace dependencies?
- Are there known issues with workspace protocol dependencies (`workspace:*`) in Vercel Edge Runtime?
- Should `framework: null` vs `framework: "nextjs"` make a difference?

### 3. Environment Variables & Edge Runtime
- Must ALL environment variables be configured in Vercel dashboard for middleware to run?
- Can missing `NEXT_PUBLIC_*` variables cause MIDDLEWARE_INVOCATION_FAILED even if not accessed?
- How does Vercel Edge Runtime handle process.env access differently from Node.js runtime?

### 4. Module Resolution in Vercel Builds
- How does Vercel resolve imports in middleware.ts for monorepo apps?
- Does middleware.ts need special bundling configuration for pnpm workspaces?
- Could the middleware be failing during module resolution/bundling phase before even executing?

### 5. Multi-Zone Architecture on Vercel
- Are there specific Vercel configuration requirements for multi-zone Next.js apps?
- Do middleware matchers need special configuration for apps with `basePath`?
- Could the basePath configuration be causing routing conflicts in Edge Runtime?

### 6. Deployment Root Directory
- Should Vercel projects be configured with Root Directory pointing to app folder (e.g., `apps/dashboard`)?
- Does deploying from monorepo root vs app directory affect middleware bundling?
- How does `vercel pull` work with monorepo structure - does it pull full repo or just app?

### 7. GitHub Actions Integration
- Does `vercel pull --environment=production` correctly configure monorepo context?
- Should environment variables be passed via `--build-env` in GitHub Actions vs Vercel dashboard?
- Are there timing issues with sequential deployments that could affect middleware initialization?

### 8. Diagnostic Steps
- What Vercel CLI commands can inspect the built middleware on deployed Edge Runtime?
- How to view Edge Runtime logs/errors for middleware execution failures?
- Are there Vercel deployment flags or configuration to get verbose middleware error details?

## Expected Output

Please provide:

1. **Root Cause Analysis**: Most likely reasons for MIDDLEWARE_INVOCATION_FAILED in this specific setup
2. **Configuration Checklist**: Step-by-step Vercel project configuration for pnpm monorepo with middleware
3. **Environment Variable Setup**: Exact process for configuring env vars in Vercel for monorepo apps
4. **Build Command Best Practices**: Optimal buildCommand for pnpm workspace apps on Vercel
5. **Debugging Commands**: Vercel CLI commands to inspect deployed middleware and view edge runtime errors
6. **Known Issues**: Any documented bugs or limitations in Next.js 16/Vercel Edge Runtime/pnpm workspaces
7. **Alternative Approaches**: If current approach is fundamentally incompatible, what architecture changes are needed?

## Additional Context

- All apps work perfectly in local development (`pnpm dev`)
- GitHub Actions report successful deployments (no build failures)
- Issue is **runtime only** on Vercel Edge Runtime
- Affects ALL 6 apps identically
- Started after migrating to multi-zone architecture with middleware-based auth
- Vercel tier: **Free** (using sequential deployment to avoid concurrent build limits)

---

**Research Priority**: Focus on Vercel-specific Edge Runtime issues, pnpm monorepo configuration, and Next.js 16 middleware requirements. The fact that even minimal middleware fails suggests a fundamental configuration or compatibility issue rather than code logic.
