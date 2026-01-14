# Research Prompt: Cookie Domain Configuration Viability for Multi-Zone Next.js Authentication

## Objective

Determine if **Option 1: Configure Shared Cookie Domain** is a viable solution for the current authentication failure issue (401 errors on all dashboard API calls) in the Pleeno multi-zone Next.js application deployed on Vercel.

## Context: Current System Architecture

### Multi-Zone Setup
- **Architecture:** Next.js Multi-Zone (6 separate Next.js applications)
- **Hosting:** Vercel
- **Deployment Model:** Each app is a separate Vercel project
- **Monorepo:** pnpm workspace with shared packages

### Applications (Zones)
1. **Shell App** (Entry point & authentication)
   - URL Production: `https://shell-pink-delta.vercel.app`
   - URL Custom Domain: Not configured yet
   - Handles: Login, signup, authentication

2. **Dashboard App** (Protected zone)
   - URL Production: `https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app`
   - URL Custom Domain: `https://dashboard.plenno.com.au`
   - Requires: Authenticated session from Shell

3. **Other Apps:** entities, payments, agency, reports
   - Each has custom domain: `*.plenno.com.au`

### Authentication Flow
```
User → Shell App Login → Supabase Auth → Session Cookie Set → Redirect to Dashboard App
```

### Shared Packages (Monorepo)
```
packages/
├── database/          # Supabase client configurations
│   ├── src/api-route.ts    # API Route client
│   ├── src/server.ts       # Server Component client
│   └── src/client.ts       # Browser client
├── auth/              # Authentication utilities
└── utils/             # Shared utilities
```

## Current Authentication Implementation

### 1. Login Flow (Shell App)
**File:** `apps/shell/app/api/auth/login/route.ts`

```typescript
import { createAPIRouteClient } from '@pleeno/database/api-route'

export async function POST(request: NextRequest) {
  // Create Supabase client for API routes
  const { supabase, response: applyAuthCookies } = createAPIRouteClient(request)

  // Authenticate user
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  // Create response and apply auth cookies
  const response = NextResponse.json({ user: data.user, session: data.session })
  const finalResponse = applyAuthCookies(response)

  return finalResponse
}
```

### 2. Cookie Setting Logic (Shared Package)
**File:** `packages/database/src/api-route.ts`

```typescript
export function createAPIRouteClient(request: NextRequest) {
  const cookieStore: Map<string, { value: string; options: CookieOptions }> = new Map()

  const supabase = createSupabaseSSRClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        set(name: string, value: string, options: CookieOptions) {
          const isDev = process.env.NODE_ENV === 'development'
          const cookieOptions = isDev
            ? { ...options, domain: 'localhost' }  // ← Dev: domain=localhost
            : options                               // ← Prod: NO domain set

          cookieStore.set(name, { value, options: cookieOptions })
        },
      },
    }
  )

  const applyCookies = (response: NextResponse) => {
    cookieStore.forEach(({ value, options }, name) => {
      const cookieString = serializeCookie(name, value, options)
      response.headers.append('Set-Cookie', cookieString)
    })
    return response
  }

  return { supabase, response: applyCookies }
}
```

**Key Observation:** In production, `domain` is **NOT set**, meaning cookies default to the exact host that set them.

### 3. Server Client Cookie Configuration
**File:** `packages/database/src/server.ts`

```typescript
export async function createServerClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        set(name: string, value: string, options: CookieOptions) {
          const isProd = process.env.NODE_ENV === 'production'
          const isDev = process.env.NODE_ENV === 'development'

          const cookieOptions = isProd
            ? {
                name,
                value,
                ...options,
                domain: process.env.COOKIE_DOMAIN || '.pleeno.com',  // ← Production default
              }
            : isDev
            ? {
                name,
                value,
                ...options,
                domain: 'localhost',  // ← Dev: localhost
              }
            : { name, value, ...options }

          cookieStore.set(cookieOptions)
        },
      },
    }
  )
}
```

**Key Observation:** Server client HAS production domain configuration (`.pleeno.com`), but API route client does NOT.

### 4. Dashboard API Route Protection
**File:** `apps/dashboard/app/api/kpis/route.ts`

```typescript
import { requireRole, getUserAgencyId } from '@pleeno/auth/server'
import { createServerClient } from '@pleeno/database/server'

export async function GET(request: NextRequest) {
  // SECURITY BOUNDARY: Require authentication
  const authResult = await requireRole(request, ['agency_admin', 'agency_user'])

  if (authResult instanceof NextResponse) {
    return authResult // ← Returns 401 if not authenticated
  }

  const { user } = authResult
  const userAgencyId = getUserAgencyId(user)

  const supabase = await createServerClient()

  // Fetch data with RLS...
}
```

## Current Problem

### Issue
After successful login in Shell app and redirect to Dashboard app, **all dashboard API calls return 401 Unauthorized**.

### Root Cause Hypothesis
1. Shell app sets authentication cookies when user logs in
2. Cookies are scoped to Shell app's domain only (no `domain` attribute in production)
3. When user is redirected to Dashboard app (different domain/subdomain), cookies are NOT sent
4. Dashboard API routes cannot read session cookies
5. Authentication check fails → 401 Unauthorized

### Evidence
- Login succeeds in Shell ✅
- Redirect succeeds ✅
- Dashboard page loads ✅
- All API calls fail with 401 ❌

### URL Patterns
```
Shell:     https://shell-pink-delta.vercel.app
Dashboard: https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app

Problem: Different subdomains = cookies not shared
```

## Proposed Solution: Option 1

### Configuration Change
Update `packages/database/src/api-route.ts` to set `domain` attribute in production:

```typescript
set(name: string, value: string, options: CookieOptions) {
  const isDev = process.env.NODE_ENV === 'development'
  const isProd = process.env.NODE_ENV === 'production'

  const cookieOptions = isProd
    ? { ...options, domain: '.plenno.com.au' }  // ← NEW: Set parent domain
    : isDev
    ? { ...options, domain: 'localhost' }
    : options

  cookieStore.set(name, { value, options: cookieOptions })
}
```

### Expected Behavior
- Cookies set with `domain=.plenno.com.au`
- Cookies accessible to all subdomains: `*.plenno.com.au`
- Dashboard at `dashboard.plenno.com.au` can read Shell's cookies
- Authentication succeeds across zones

## Critical Research Questions

### 1. Cookie Domain Sharing in Multi-Zone Next.js

**Question:** In a Next.js multi-zone architecture where each zone is a separate Vercel project (separate deployments), will setting `domain=.plenno.com.au` on cookies in the Shell app allow those cookies to be accessible by the Dashboard app at `dashboard.plenno.com.au`?

**Validation Points:**
- Does Next.js multi-zone support cross-zone cookie sharing?
- Are there any Vercel-specific limitations on cookie domain sharing across projects?
- Do cookies set with parent domain (`.plenno.com.au`) work in Vercel deployments?

### 2. Supabase SSR Cookie Requirements

**Question:** Does Supabase SSR (`@supabase/ssr` package) support or have any restrictions regarding cookie domain configuration for multi-zone setups?

**Validation Points:**
- What are Supabase's requirements for cookie attributes (`domain`, `sameSite`, `secure`)?
- Does Supabase SSR work correctly when cookies are set with a parent domain?
- Are there known issues with Supabase auth cookies and multi-zone Next.js apps?

### 3. Browser Cookie Security Policies

**Question:** Will browsers allow cookies with `domain=.plenno.com.au` to be:
1. Set by `shell.plenno.com.au` (or a shell Vercel preview URL)
2. Read by `dashboard.plenno.com.au`
3. Sent in API requests from client to server within dashboard app

**Validation Points:**
- What are the browser rules for cookie domain matching?
- Does setting a parent domain on cookies from a subdomain violate any security policies?
- What `sameSite` attribute is required for cross-subdomain cookie sharing?

### 4. Vercel Preview URLs vs Custom Domains

**Question:** The current redirect goes to a Vercel preview URL (`https://dashboard-a7cj5km33-antons-projects-1b1c34d6.vercel.app`) instead of the custom domain. Will cookie domain sharing work with:
1. Preview URLs (`.vercel.app`)
2. Mixed scenarios (shell on preview URL, dashboard on custom domain)
3. Or is custom domain setup required for all apps?

**Validation Points:**
- Can cookies set with `domain=.plenno.com.au` be read by Vercel preview URLs?
- Do we need all apps on custom domains for this to work?
- What happens if Shell is on `shell-pink-delta.vercel.app` but sets cookie with `domain=.plenno.com.au`?

### 5. Vercel Environment and Cookie Handling

**Question:** Are there any Vercel-specific edge cases, limitations, or configurations that affect cookie domain sharing across separate Vercel projects?

**Validation Points:**
- Does Vercel Edge Network affect cookie routing?
- Are there headers or configurations needed in `vercel.json`?
- Do Vercel's serverless functions handle cookies differently than traditional servers?

### 6. Alternative: Server Component vs API Route Cookie Setting

**Question:** The `packages/database/src/server.ts` (for Server Components) already has production domain configuration (`.pleeno.com`), but `packages/database/src/api-route.ts` (for API routes) does NOT. Is this intentional, and does it indicate that:
1. Cookie domain should only be set in certain contexts?
2. API route cookies should not have domain set for security reasons?
3. There's a mismatch that needs to be fixed?

**Validation Points:**
- Why the difference between server.ts and api-route.ts cookie domain configs?
- Should both use the same domain configuration?
- Is there a reason API routes avoid setting domain in production?

### 7. Security Implications

**Question:** What are the security implications of setting `domain=.plenno.com.au` for authentication cookies?

**Validation Points:**
- Does this open attack vectors (subdomain takeover, XSS, CSRF)?
- What additional security measures are needed (HttpOnly, Secure, SameSite)?
- Are there Supabase-specific security considerations?

### 8. Compatibility with Current Codebase

**Question:** Given the current codebase structure:
- Shared `@pleeno/database` package used by all apps
- Separate Vercel projects for each app
- Monorepo with pnpm workspaces

Will updating the cookie domain configuration in the shared package:
1. Require redeployment of all apps?
2. Work seamlessly across all zones?
3. Require any changes to individual app configurations?

**Validation Points:**
- Does changing shared package require rebuilding all apps?
- Are there per-app overrides needed?
- How to ensure consistency across deployments?

## Expected Research Output

Please provide:

1. **Viability Assessment:** YES/NO/CONDITIONAL - Can Option 1 work with the current architecture?

2. **Technical Explanation:** Why or why not, with specific references to:
   - Next.js multi-zone behavior
   - Supabase SSR requirements
   - Browser cookie policies
   - Vercel deployment constraints

3. **Requirements Checklist:** If viable, list all requirements:
   - Code changes needed
   - Environment variables to set
   - Vercel configurations
   - Custom domain setup requirements
   - Cookie attribute specifications (`domain`, `sameSite`, `secure`, `httpOnly`)

4. **Blockers & Risks:** If NOT viable, or if conditional:
   - What are the blockers?
   - What risks exist if implemented?
   - What could go wrong?

5. **Alternative Recommendations:** If Option 1 is not viable or has significant risks:
   - What alternative approaches exist?
   - Token-based auth via URL params?
   - Proxy approach?
   - Different multi-zone architecture?

6. **Implementation Steps:** If viable, provide step-by-step:
   1. Exact code changes with file paths
   2. Environment variables to configure
   3. Deployment sequence
   4. Testing procedure
   5. Rollback plan

## Additional Context

### Supabase Configuration
- **Supabase URL (UAT):** `https://qyjftxpnlfumxwpxfdmx.supabase.co`
- **Package:** `@supabase/ssr` (Supabase SSR)
- **Authentication:** Email/Password with JWT tokens in HTTP-only cookies

### Cookie Names (Typical Supabase)
- `sb-<project-ref>-auth-token`
- `sb-<project-ref>-auth-token-code-verifier`

### Deployment Information
- **Team/Scope:** `pleeno-yb5fuvs3z`
- **Shell Project ID:** `prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5`
- **Dashboard Project ID:** `prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`

### Custom Domains
```
dashboard.plenno.com.au → Dashboard app
entities.plenno.com.au  → Entities app
payments.plenno.com.au  → Payments app
agency.plenno.com.au    → Agency app
reports.plenno.com.au   → Reports app
(Shell not yet configured with custom domain)
```

## Priority Questions (Answer These First)

1. **Does setting `domain=.plenno.com.au` on cookies in one Vercel project allow another Vercel project to read those cookies?**

2. **Is there a fundamental limitation in Vercel's architecture that prevents cookie sharing across separate projects?**

3. **Must ALL apps use custom domains (*.plenno.com.au) for this to work, or can some use preview URLs?**

4. **Does Supabase SSR support cookie domain configuration for multi-zone setups?**

5. **What is the correct `sameSite` attribute for cross-subdomain cookie sharing on Vercel?**

---

## Research Methodology Suggestions

To answer these questions comprehensively, please:

1. **Review Official Documentation:**
   - Next.js multi-zone architecture docs
   - Vercel deployment and cookie handling
   - Supabase SSR authentication guides
   - Browser cookie specification (RFC 6265)

2. **Search for Real-World Examples:**
   - GitHub issues/discussions on multi-zone auth
   - Vercel community forums
   - Supabase Discord/forums
   - Stack Overflow questions about similar setups

3. **Analyze Technical Constraints:**
   - Browser cookie domain rules
   - Vercel Edge Network behavior
   - Next.js middleware cookie handling
   - Supabase JWT storage requirements

4. **Identify Best Practices:**
   - Recommended patterns for multi-zone auth
   - Security best practices for shared cookies
   - Production-ready implementations

---

## Success Criteria

Research is complete when we have a **definitive answer** on whether Option 1 is viable, along with:
- Clear technical reasoning
- Specific implementation guidance OR alternative solution
- Risk assessment and mitigation strategies
- Step-by-step action plan

**Timeline:** This is a HIGH PRIORITY issue blocking production functionality. Please provide comprehensive findings as soon as possible.
