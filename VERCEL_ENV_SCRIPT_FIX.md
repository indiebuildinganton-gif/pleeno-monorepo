# Vercel Environment Configuration Script Fix

**Date:** January 16, 2026
**Script:** `scripts/configure-vercel-env.sh`
**Status:** ✅ FIXED

---

## Changes Made

### 1. Supabase Instance Correction

**BEFORE (WRONG):**
```bash
# Old production instance
SUPABASE_URL="https://iadhxztsuzbkbnhkimqv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhZGh4enRzdXpia2JuaGtpbXF2..."
```

**AFTER (CORRECT):**
```bash
# Supabase configuration - UAT Instance (used for production plenno.com.au)
SUPABASE_URL="https://ccmciliwfdtdspdlkuos.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjbWNpbGl3ZmR0ZHNwZGxrdW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MTY0MzQsImV4cCI6MjA4MDM5MjQzNH0.OtcTS9J6A-wwsPxxrwlImEXQ34WSxCHWD0kBQpmL_pQ"
```

**Why:** Now uses UAT instance (ccmciliwfdtdspdlkuos) which is the actual production database for plenno.com.au deployments.

---

### 2. App URLs Updated to Custom Domains

**BEFORE (WRONG):**
```bash
# Vercel deployment URLs (temporary)
SHELL_URL="https://shell-3ik3zrnby-antons-projects-1b1c34d6.vercel.app"
DASHBOARD_URL="https://dashboard-h8pzfv2ks-antons-projects-1b1c34d6.vercel.app"
AGENCY_URL="https://agency-g47ipgn06-antons-projects-1b1c34d6.vercel.app"
ENTITIES_URL="https://entities-n2illv8kx-antons-projects-1b1c34d6.vercel.app"
PAYMENTS_URL="https://payments-fhgvgtdcp-antons-projects-1b1c34d6.vercel.app"
REPORTS_URL="https://reports-kzfwvwz6f-antons-projects-1b1c34d6.vercel.app"
```

**AFTER (CORRECT):**
```bash
# App URLs - Custom Domains (plenno.com.au)
SHELL_URL="https://shell.plenno.com.au"
DASHBOARD_URL="https://dashboard.plenno.com.au"
AGENCY_URL="https://agency.plenno.com.au"
ENTITIES_URL="https://entities.plenno.com.au"
PAYMENTS_URL="https://payments.plenno.com.au"
REPORTS_URL="https://reports.plenno.com.au"
```

**Why:** Production uses custom domains, not Vercel's auto-generated deployment URLs.

---

### 3. Cookie Domain Correction

**BEFORE (WRONG):**
```bash
COOKIE_DOMAIN=".vercel.app"
```

**AFTER (CORRECT):**
```bash
COOKIE_DOMAIN=".plenno.com.au"
```

**Why:** Cookies must be shared across all `*.plenno.com.au` subdomains for cross-subdomain authentication to work.

---

## Impact

This script configures environment variables for all **6 Vercel projects**:

1. `pleeno-shell-uat` → shell.plenno.com.au
2. `pleeno-dashboard-uat` → dashboard.plenno.com.au
3. `pleeno-agency-uat` → agency.plenno.com.au
4. `pleeno-entities-uat` → entities.plenno.com.au
5. `pleeno-payments-uat` → payments.plenno.com.au
6. `pleeno-reports-uat` → reports.plenno.com.au

Each project receives **11 environment variables**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SHELL_URL`
- `NEXT_PUBLIC_DASHBOARD_URL`
- `NEXT_PUBLIC_AGENCY_URL`
- `NEXT_PUBLIC_ENTITIES_URL`
- `NEXT_PUBLIC_PAYMENTS_URL`
- `NEXT_PUBLIC_REPORTS_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_COOKIE_DOMAIN`
- `NODE_ENV`

**Total:** 11 variables × 6 projects = **66 environment variable entries**

---

## Login Flow Verification

### User Journey: https://shell.plenno.com.au/login → https://dashboard.plenno.com.au/dashboard

#### Step 1: User Visits Login Page
```
URL: https://shell.plenno.com.au/login
File: apps/shell/app/(auth)/login/page.tsx
```

Default redirect destination:
```typescript
const redirectTo = searchParams.get('redirectTo') || '/dashboard'
```

#### Step 2: User Submits Login Form
```typescript
// POST request to /api/auth/login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
})
```

#### Step 3: Server Authenticates User
```
File: apps/shell/app/api/auth/login/route.ts
```

1. Creates Supabase client with UAT credentials:
   ```typescript
   const { supabase, response: applyAuthCookies } = createAPIRouteClient(request)
   ```

2. Authenticates with Supabase:
   ```typescript
   const { data, error } = await supabase.auth.signInWithPassword({
     email,
     password,
   })
   ```

3. Sets authentication cookies with `.plenno.com.au` domain:
   ```typescript
   const finalResponse = applyAuthCookies(response)
   ```

**Cookies Set:**
- `sb-access-token` (JWT access token)
- `sb-refresh-token` (refresh token)
- **Domain:** `.plenno.com.au` (shared across all subdomains)
- **HttpOnly:** true
- **Secure:** true (HTTPS only)
- **SameSite:** lax

#### Step 4: Client Receives Success Response

Login page receives successful response with user data.

#### Step 5: Client Redirects to Dashboard

```typescript
// File: apps/shell/app/(auth)/login/page.tsx (lines 71-81)

const isDevelopment = process.env.NODE_ENV === 'development' ||
                      window.location.hostname === 'localhost'

if (isDevelopment) {
  // Local: Stay on shell, use Next.js rewrites
  router.push(redirectTo)
} else {
  // Production: Redirect to external zone
  const finalRedirectUrl = getMultiZoneRedirectUrl(redirectTo)
  window.location.href = finalRedirectUrl
}
```

#### Step 6: Multi-Zone Redirect Resolution

```
File: apps/shell/lib/multi-zone-redirect.ts
Function: getMultiZoneRedirectUrl('/dashboard')
```

**Process:**
1. Input: `/dashboard`
2. Extract first segment: `dashboard`
3. Check zone config: `dashboard` → `https://dashboard.plenno.com.au`
4. Construct path: `/dashboard` (preserves basePath)
5. **Output:** `https://dashboard.plenno.com.au/dashboard`

#### Step 7: Browser Redirects

```javascript
window.location.href = 'https://dashboard.plenno.com.au/dashboard'
```

**Browser behavior:**
1. Navigates to `https://dashboard.plenno.com.au/dashboard`
2. Sends cookies with domain `.plenno.com.au` (includes auth tokens!)
3. Dashboard app receives authenticated request

#### Step 8: Dashboard App Verifies Auth

```
File: apps/dashboard/middleware.ts (or similar)
```

1. Reads `sb-access-token` cookie from request
2. Validates JWT with Supabase
3. User is authenticated ✅
4. Renders dashboard page

---

## Complete Login Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User visits https://shell.plenno.com.au/login               │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. User submits email/password                                  │
│    POST /api/auth/login                                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. Server authenticates with Supabase UAT                       │
│    URL: https://ccmciliwfdtdspdlkuos.supabase.co               │
│    Method: signInWithPassword()                                 │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. Server sets authentication cookies                           │
│    Domain: .plenno.com.au                                       │
│    Cookies: sb-access-token, sb-refresh-token                   │
│    HttpOnly: true, Secure: true, SameSite: lax                  │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. Server returns success response                              │
│    { user: {...}, session: {...} }                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. Client calls getMultiZoneRedirectUrl('/dashboard')           │
│    Returns: https://dashboard.plenno.com.au/dashboard           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. Browser redirects to dashboard                               │
│    window.location.href = 'https://dashboard.plenno.com.au/...' │
│    Includes cookies (domain matches!)                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. Dashboard app receives authenticated request                 │
│    Reads sb-access-token cookie                                 │
│    Validates with Supabase                                      │
│    ✅ User is authenticated!                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cookie Domain Flow

### Why `.plenno.com.au` is Critical

```
Login at:     shell.plenno.com.au
Cookie set:   Domain=.plenno.com.au (with leading dot)
              ↓
Browser behavior:
              ├→ shell.plenno.com.au      ✅ Sends cookie
              ├→ dashboard.plenno.com.au  ✅ Sends cookie
              ├→ agency.plenno.com.au     ✅ Sends cookie
              ├→ entities.plenno.com.au   ✅ Sends cookie
              ├→ payments.plenno.com.au   ✅ Sends cookie
              └→ reports.plenno.com.au    ✅ Sends cookie
```

### What Would Happen with Wrong Cookie Domain

**If cookie domain was `.vercel.app`:**
```
Login at:     shell.plenno.com.au
Cookie set:   Domain=.vercel.app (WRONG!)
              ↓
Browser behavior:
              ├→ shell.plenno.com.au      ❌ Won't send (domain mismatch)
              ├→ dashboard.plenno.com.au  ❌ Won't send (domain mismatch)
              └→ ALL subdomains           ❌ Won't send

Result: User appears logged out on all apps except shell!
```

**If cookie domain was `shell.plenno.com.au` (no leading dot):**
```
Login at:     shell.plenno.com.au
Cookie set:   Domain=shell.plenno.com.au (too specific!)
              ↓
Browser behavior:
              ├→ shell.plenno.com.au      ✅ Sends cookie
              ├→ dashboard.plenno.com.au  ❌ Won't send (subdomain mismatch)
              └→ Other subdomains         ❌ Won't send

Result: User logged in on shell only, not other apps!
```

---

## Environment Variable Flow

### How Vercel Injects Variables During Build

```
1. GitHub Actions workflow triggers
   ↓
2. Run: vercel pull --environment=production
   ↓
   Vercel fetches environment variables from dashboard/API
   ↓
3. Creates temporary .env.production.local file:
   NEXT_PUBLIC_SUPABASE_URL=https://ccmciliwfdtdspdlkuos.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au
   ... (all 11 variables)
   ↓
4. Next.js build runs: next build
   ↓
   NEXT_PUBLIC_* variables are bundled into client JavaScript
   ↓
5. Runtime code can access these variables:
   process.env.NEXT_PUBLIC_SUPABASE_URL
   ↓
6. Client-side code creates Supabase client:
   createBrowserClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL,      // ✅ Available!
     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY  // ✅ Available!
   )
```

---

## How to Run the Fixed Script

### Prerequisites

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Set Required Environment Variables:**
   ```bash
   export VERCEL_TOKEN="your-vercel-token-here"
   export VERCEL_ORG_ID="your-org-id-here"

   # Set all 6 project IDs
   export VERCEL_PROJECT_ID_SHELL="prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5"
   export VERCEL_PROJECT_ID_DASHBOARD="prj_LuG5grzWFQWQG4Md0nKRAebbIjAk"
   export VERCEL_PROJECT_ID_AGENCY="prj_DXMliZgxFsO4h1jEMvQ6G5F226J8"
   export VERCEL_PROJECT_ID_ENTITIES="prj_PbNAYOpwz0AUw6j1M3TPdsualWiz"
   export VERCEL_PROJECT_ID_PAYMENTS="prj_SvZfAQkhKjUPgIJpVSVBS7FeudU"
   export VERCEL_PROJECT_ID_REPORTS="prj_R2l6JMK3DGd974cYWhgAKsWaLpOg"
   ```

   **Or use GitHub secrets** (recommended for CI/CD):
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID_SHELL`
   - `VERCEL_PROJECT_ID_DASHBOARD`
   - `VERCEL_PROJECT_ID_AGENCY`
   - `VERCEL_PROJECT_ID_ENTITIES`
   - `VERCEL_PROJECT_ID_PAYMENTS`
   - `VERCEL_PROJECT_ID_REPORTS`

### Running the Script

```bash
cd /Users/brenttudas/Pleeno
chmod +x scripts/configure-vercel-env.sh
./scripts/configure-vercel-env.sh
```

### Expected Output

```
========================================
Vercel Environment Variable Configuration
========================================

Using Vercel CLI version:
Vercel CLI 28.x.x

========================================
Configuring dashboard (prj_LuG5grzWFQWQG4Md0nKRAebbIjAk)
========================================

Adding NEXT_PUBLIC_SUPABASE_URL to project...
✓ Successfully added NEXT_PUBLIC_SUPABASE_URL

Adding NEXT_PUBLIC_SUPABASE_ANON_KEY to project...
✓ Successfully added NEXT_PUBLIC_SUPABASE_ANON_KEY

... (continues for all 11 variables)

Project dashboard: 11/11 variables configured

... (repeats for entities, payments, agency, reports, shell)

========================================
Configuration Summary
========================================

✓ dashboard: All variables configured
✓ entities: All variables configured
✓ payments: All variables configured
✓ agency: All variables configured
✓ reports: All variables configured
✓ shell: All variables configured

Configuration complete!
Note: You may need to trigger a redeployment for changes to take effect.
```

---

## Post-Script Actions

### 1. Trigger Redeployments

After running the script, trigger redeployment of all 6 projects:

**Option A: Push to main branch (triggers CI/CD)**
```bash
git add scripts/configure-vercel-env.sh
git commit -m "Fix: Update Vercel env script to use UAT Supabase and custom domains"
git push origin main
```

**Option B: Manual redeploy via Vercel dashboard**
- Go to each project in Vercel dashboard
- Click "Deployments" tab
- Click "..." on latest deployment → "Redeploy"

**Option C: Use Vercel CLI**
```bash
vercel --prod --force
```

### 2. Verify Environment Variables

Check that variables were set correctly in Vercel dashboard:

1. Go to https://vercel.com
2. Select each project (shell, dashboard, agency, entities, payments, reports)
3. Go to Settings → Environment Variables
4. Verify these 11 variables exist for Production:
   - ✅ `NEXT_PUBLIC_SUPABASE_URL` = `https://ccmciliwfdtdspdlkuos.supabase.co`
   - ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ✅ `NEXT_PUBLIC_COOKIE_DOMAIN` = `.plenno.com.au`
   - ✅ All app URLs use `*.plenno.com.au` domains

### 3. Test Login Flow

1. Visit https://shell.plenno.com.au/login
2. Enter valid credentials
3. Submit form
4. **Expected:** Redirect to https://dashboard.plenno.com.au/dashboard
5. **Expected:** User is authenticated (no redirect back to login)
6. **Expected:** Can navigate to other subdomains while staying authenticated

---

## Verification Checklist

After running the script and redeploying:

- [ ] All 6 Vercel projects have `NEXT_PUBLIC_SUPABASE_URL` = UAT instance
- [ ] All 6 Vercel projects have `NEXT_PUBLIC_SUPABASE_ANON_KEY` = UAT anon key
- [ ] All 6 Vercel projects have `NEXT_PUBLIC_COOKIE_DOMAIN` = `.plenno.com.au`
- [ ] All app URLs use custom domains (`*.plenno.com.au`)
- [ ] Login at https://shell.plenno.com.au/login works
- [ ] After login, redirects to https://dashboard.plenno.com.au/dashboard
- [ ] User remains authenticated (cookies shared across subdomains)
- [ ] Can navigate to agency.plenno.com.au (stays authenticated)
- [ ] Can navigate to entities.plenno.com.au (stays authenticated)
- [ ] Can navigate to payments.plenno.com.au (stays authenticated)
- [ ] Can navigate to reports.plenno.com.au (stays authenticated)

---

## Troubleshooting

### Issue: Script fails with "Project ID not set"

**Solution:** Ensure all 6 `VERCEL_PROJECT_ID_*` environment variables are set.

### Issue: "Failed to add variable"

**Possible causes:**
1. Variable already exists → Update instead of add
2. Invalid VERCEL_TOKEN → Get new token from Vercel dashboard
3. Insufficient permissions → Token needs admin access to projects

**Solution:**
```bash
# Remove existing variable first
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --token=$VERCEL_TOKEN

# Then add new value
vercel env add NEXT_PUBLIC_SUPABASE_URL production --token=$VERCEL_TOKEN
```

### Issue: Login works but redirect fails

**Check:**
1. Browser console for errors
2. Network tab → verify POST /api/auth/login returns 200
3. Cookies tab → verify cookies have domain `.plenno.com.au`
4. Environment variable `NEXT_PUBLIC_DASHBOARD_URL` in build

### Issue: Dashboard shows "Unauthorized" after redirect

**Possible causes:**
1. Cookies not shared (wrong domain)
2. Dashboard using different Supabase instance
3. JWT validation failing

**Solution:**
1. Verify cookie domain is `.plenno.com.au` (with leading dot)
2. Verify dashboard has same Supabase URL/key as shell
3. Check Supabase dashboard for JWT secret rotation

---

## Files Modified

| File | Type | Change |
|------|------|--------|
| `scripts/configure-vercel-env.sh` | Script | Fixed Supabase instance, URLs, cookie domain |

## Files Verified (No Changes Needed)

| File | Purpose | Status |
|------|---------|--------|
| `apps/shell/app/api/auth/login/route.ts` | Login API | ✅ Correct - sets cookies with proper domain |
| `apps/shell/app/(auth)/login/page.tsx` | Login page | ✅ Correct - redirects to dashboard |
| `apps/shell/lib/multi-zone-redirect.ts` | Multi-zone redirect | ✅ Correct - constructs proper dashboard URL |
| `apps/shell/app/page.tsx` | Root redirect | ✅ Correct - redirects authenticated users to dashboard |
| `packages/database/src/api-route.ts` | API route client | ✅ Correct - cookie domain set in previous commit |
| `packages/database/src/server.ts` | Server client | ✅ Correct - cookie domain set in previous commit |

---

**Status:** ✅ Script fixed and ready to run
**Next Action:** Run script to update all 6 Vercel projects with correct environment variables
**Expected Outcome:** Login at shell.plenno.com.au → Redirect to dashboard.plenno.com.au with valid auth tokens
