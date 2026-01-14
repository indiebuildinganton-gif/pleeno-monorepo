# Action Plan: Fix 401 Authentication Errors via Cookie Domain Configuration

**Status:** READY TO IMPLEMENT ✅
**Blocker Status:** Domain owned (plenno.com.au) - Just needs DNS configuration
**Estimated Time:** 2 hours total
**Priority:** HIGH - Production blocking issue

---

## Executive Summary

The 401 authentication errors in the dashboard are caused by cookies not being shared between the Shell app and Dashboard app. The fix requires:

1. ✅ **Custom domain setup** (you already own plenno.com.au)
2. 🔧 **Code changes** (2 files in shared package)
3. ⚙️ **Configuration updates** (Supabase + environment variables)

**Why this works:** Vercel preview URLs (`*.vercel.app`) are on the Public Suffix List, preventing cookie domain sharing. Custom domains (`*.plenno.com.au`) don't have this restriction.

---

## Phase 1: Infrastructure Setup (15-20 minutes)

### Step 1.1: Add Custom Domain for Shell App

**In Vercel Dashboard:**

1. Navigate to Shell project: https://vercel.com/pleeno-yb5fuvs3z/shell (or find via dashboard)
2. Go to **Settings** → **Domains**
3. Click **Add Domain**
4. Enter: `shell.plenno.com.au`
5. Click **Add**

**Vercel will show you DNS records to configure:**
```
Type: A
Name: shell
Value: 76.76.21.21 (or Vercel's current IP)

Type: CNAME (alternative)
Name: shell
Value: cname.vercel-dns.com
```

### Step 1.2: Configure DNS

**In your DNS provider (where plenno.com.au is hosted):**

1. Add CNAME record:
   ```
   Type: CNAME
   Name: shell
   Value: cname.vercel-dns.com
   TTL: 3600 (or Auto)
   ```

2. Wait for DNS propagation (5-10 minutes)
3. Verify with: `dig shell.plenno.com.au`

### Step 1.3: Verify Custom Domain Works

```bash
# Test that shell domain is accessible
curl -I https://shell.plenno.com.au

# Expected: HTTP/2 200 or 301/302 redirect
```

**⏸️ CHECKPOINT:** Shell app must be accessible at `https://shell.plenno.com.au` before proceeding.

---

## Phase 2: Code Changes (30 minutes)

### Change 1: Fix API Route Cookie Configuration

**File:** `packages/database/src/api-route.ts`

**Location:** Line 55-62 (inside `set()` function)

**BEFORE:**
```typescript
set(name: string, value: string, options: CookieOptions) {
  // Store cookies to be set on response
  const isDev = process.env.NODE_ENV === 'development'
  const cookieOptions = isDev
    ? { ...options, domain: 'localhost' }
    : options

  cookieStore.set(name, { value, options: cookieOptions })
}
```

**AFTER:**
```typescript
set(name: string, value: string, options: CookieOptions) {
  // Store cookies to be set on response
  const isDev = process.env.NODE_ENV === 'development'
  const isProd = process.env.NODE_ENV === 'production'

  const cookieOptions = isProd
    ? {
        ...options,
        domain: process.env.COOKIE_DOMAIN || '.plenno.com.au',
        sameSite: 'lax' as const,
        secure: true,
        httpOnly: true,
      }
    : isDev
    ? { ...options, domain: 'localhost' }
    : options

  cookieStore.set(name, { value, options: cookieOptions })
}
```

**Why this change:**
- Sets `domain=.plenno.com.au` so cookies work across all subdomains
- Adds security attributes (`sameSite`, `secure`, `httpOnly`)
- Uses environment variable for flexibility

### Change 2: Align Server Client Configuration

**File:** `packages/database/src/server.ts`

**Location:** Line 68 (inside `set()` function)

**BEFORE:**
```typescript
const cookieOptions = isProd
  ? {
      name,
      value,
      ...options,
      domain: process.env.COOKIE_DOMAIN || '.pleeno.com',  // ← Wrong TLD
    }
```

**AFTER:**
```typescript
const cookieOptions = isProd
  ? {
      name,
      value,
      ...options,
      domain: process.env.COOKIE_DOMAIN || '.plenno.com.au',  // ← Fixed TLD
      sameSite: 'lax' as const,
      secure: true,
    }
```

**Why this change:**
- Fixes typo: `.pleeno.com` → `.plenno.com.au`
- Adds consistent security attributes
- Aligns with API route configuration

---

## Phase 3: Environment Variables (5 minutes)

### Set COOKIE_DOMAIN for All Apps

**Apps to update:**
- ✅ shell
- ✅ dashboard
- ✅ entities
- ✅ payments
- ✅ agency
- ✅ reports

**Using Vercel CLI:**

```bash
# Set COOKIE_DOMAIN for all apps
for app in shell dashboard entities payments agency reports; do
  echo "Setting COOKIE_DOMAIN for $app..."
  vercel env add COOKIE_DOMAIN production \
    --value ".plenno.com.au" \
    --scope pleeno-yb5fuvs3z \
    --yes \
    -- $app
done
```

**Or via Vercel Dashboard** (if CLI doesn't work):

1. Go to each project → Settings → Environment Variables
2. Add new variable:
   - **Key:** `COOKIE_DOMAIN`
   - **Value:** `.plenno.com.au`
   - **Environment:** Production ✅

---

## Phase 4: Update Supabase Configuration (5 minutes)

### Step 4.1: Update Site URL

**In Supabase Dashboard:**

1. Go to: https://supabase.com/dashboard/project/qyjftxpnlfumxwpxfdmx
2. Navigate to **Authentication** → **URL Configuration**
3. Update **Site URL:**
   ```
   FROM: (whatever it currently is)
   TO:   https://shell.plenno.com.au
   ```

### Step 4.2: Add Redirect URLs

**In the same URL Configuration section:**

Add all your custom domains to **Redirect URLs**:
```
https://shell.plenno.com.au/**
https://dashboard.plenno.com.au/**
https://entities.plenno.com.au/**
https://payments.plenno.com.au/**
https://agency.plenno.com.au/**
https://reports.plenno.com.au/**
```

**Format:** Each URL on a new line, with `/**` wildcard

### Step 4.3: Verify Supabase Environment Variables

**Check all apps have correct Supabase config:**

```bash
# Check Shell app
vercel env ls --scope pleeno-yb5fuvs3z -- shell | grep SUPABASE

# Expected output:
# NEXT_PUBLIC_SUPABASE_URL=https://qyjftxpnlfumxwpxfdmx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=(key value)
```

**If any app is missing Supabase config, add it:**

```bash
# Example for entities app
vercel env add NEXT_PUBLIC_SUPABASE_URL production \
  --value "https://qyjftxpnlfumxwpxfdmx.supabase.co" \
  --scope pleeno-yb5fuvs3z \
  -- entities

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production \
  --value "(copy from shell app)" \
  --scope pleeno-yb5fuvs3z \
  -- entities
```

---

## Phase 5: Update Redirect Logic (5 minutes)

### Update Multi-Zone Redirect to Prefer Custom Domains

**File:** `apps/shell/lib/multi-zone-redirect.ts`

**Location:** Line 27-33 (return statement in `getDefaultZoneUrls`)

**No changes needed** - This is already correctly configured! ✅

```typescript
return {
  dashboard: 'https://dashboard.plenno.com.au',
  agency: 'https://agency.plenno.com.au',
  entities: 'https://entities.plenno.com.au',
  payments: 'https://payments.plenno.com.au',
  reports: 'https://reports.plenno.com.au',
}
```

**Verify environment variables will use custom domains:**

The code already prioritizes `NEXT_PUBLIC_DASHBOARD_URL` (which you set to `https://dashboard.plenno.com.au`), so redirects will automatically use custom domains.

---

## Phase 6: Deployment (15-30 minutes)

### Step 6.1: Commit Code Changes

```bash
cd /Users/brenttudas/Pleeno

# Check what will be committed
git status
git diff packages/database/src/api-route.ts
git diff packages/database/src/server.ts

# Commit changes
git add packages/database/src/api-route.ts
git add packages/database/src/server.ts

git commit -m "Fix: Configure cookie domain for multi-zone authentication

Updates cookie configuration to enable cross-zone authentication by setting
domain attribute to parent domain (.plenno.com.au) in production.

Changes:
1. packages/database/src/api-route.ts:
   - Set domain=.plenno.com.au in production
   - Add sameSite, secure, httpOnly attributes for security
   - Use COOKIE_DOMAIN environment variable

2. packages/database/src/server.ts:
   - Fix typo: .pleeno.com → .plenno.com.au
   - Add consistent security attributes
   - Align with API route configuration

This resolves 401 authentication errors in dashboard by allowing
session cookies set in shell app to be accessible by dashboard app.

Related: docs/deployment/REDIRECT_SUCCESS_AUTH_FAILURE.md

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 6.2: Push to Trigger Deployment

```bash
# Push to main branch
git push origin main
```

This will trigger GitHub Actions workflow to deploy all apps.

### Step 6.3: Monitor Deployment

```bash
# Watch deployment progress
gh run watch

# Or view in browser
# Go to: https://github.com/your-repo/actions
```

**Expected deployment order:**
1. Shared packages build (database, auth, utils)
2. All apps rebuild with new shared packages
3. Deploy to Vercel

**Estimated time:** 15-30 minutes total

---

## Phase 7: Testing & Verification (15 minutes)

### Test 1: Verify Custom Domain Accessibility

```bash
# Test all custom domains
for app in shell dashboard entities payments agency reports; do
  echo "Testing $app.plenno.com.au..."
  curl -I -s https://$app.plenno.com.au/ | head -n 1
done

# Expected: All return HTTP/2 200 or 3xx (not 404)
```

### Test 2: Login Flow End-to-End

**Manual test in browser:**

1. **Open browser DevTools** (F12)
2. Go to **Application** → **Cookies**
3. Navigate to: `https://shell.plenno.com.au/login`
4. **Clear all cookies** for plenno.com.au
5. **Login** with test credentials:
   ```
   Email: admin@test.local
   Password: password
   ```
6. **Check cookies after login:**
   - Look for `sb-qyjftxpnlfumxwpxfdmx-auth-token`
   - Verify `Domain` = `.plenno.com.au`
   - Verify `SameSite` = `Lax`
   - Verify `Secure` = `✓`
   - Verify `HttpOnly` = `✓`

7. **Observe redirect:**
   - Should redirect to: `https://dashboard.plenno.com.au/dashboard`
   - NOT to preview URL

8. **Check dashboard page:**
   - Network tab should show API requests
   - All `/dashboard/api/*` endpoints should return **200 OK**
   - NO 401 errors

9. **Verify session persistence:**
   - Refresh the page
   - Navigate to different sections
   - Should remain authenticated

### Test 3: Cookie Sharing Verification

**In browser DevTools:**

1. On `https://shell.plenno.com.au`:
   - Application → Cookies → https://shell.plenno.com.au
   - Note the auth cookie values

2. Navigate to `https://dashboard.plenno.com.au`:
   - Application → Cookies → https://dashboard.plenno.com.au
   - **Verify same auth cookies exist**
   - Cookie values should match shell's cookies

3. Open Console and run:
   ```javascript
   // Check if cookies are accessible
   document.cookie.split(';').forEach(c => console.log(c.trim()))
   ```

### Test 4: API Authentication

**Test a dashboard API endpoint:**

```bash
# First, login and get the cookie value from browser DevTools
# Then test the API directly

curl -v "https://dashboard.plenno.com.au/dashboard/api/kpis" \
  -H "Cookie: sb-qyjftxpnlfumxwpxfdmx-auth-token=<your-token-value>"

# Expected: HTTP/2 200 with JSON response
# NOT: HTTP/2 401
```

### Test 5: Cross-Zone Navigation

**Test navigation between zones:**

1. Login at shell
2. Navigate to: `https://dashboard.plenno.com.au/dashboard`
3. Click a link to entities (if available)
4. Should navigate to: `https://entities.plenno.com.au/...`
5. Should remain authenticated (no re-login required)

---

## Success Criteria ✅

### All Must Pass:

- ✅ Shell accessible at `https://shell.plenno.com.au`
- ✅ Dashboard accessible at `https://dashboard.plenno.com.au`
- ✅ Login succeeds at shell
- ✅ Redirect goes to custom domain (not preview URL)
- ✅ Cookies have `domain=.plenno.com.au`
- ✅ Dashboard API calls return 200 (not 401)
- ✅ Data loads in dashboard widgets
- ✅ Session persists across page refreshes
- ✅ Can navigate between zones without re-authentication

### If ANY Fail:

**Proceed to Troubleshooting section below** ⬇️

---

## Troubleshooting

### Issue 1: Still Redirecting to Preview URL

**Symptom:** After login, redirected to `https://dashboard-abc...vercel.app` instead of `dashboard.plenno.com.au`

**Cause:** Environment variable not updated or deployment didn't pick up change

**Fix:**
```bash
# Check current value
vercel env ls --scope pleeno-yb5fuvs3z -- shell | grep DASHBOARD_URL

# Should show: NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au

# If not, re-run the env update from earlier steps
# Then redeploy shell:
vercel --prod --scope pleeno-yb5fuvs3z -- apps/shell
```

### Issue 2: Cookies Not Showing Domain Attribute

**Symptom:** Cookies exist but `Domain` field is blank or shows exact subdomain

**Cause:** Code changes didn't deploy or environment variable missing

**Fix:**
```bash
# Check if COOKIE_DOMAIN is set
vercel env ls --scope pleeno-yb5fuvs3z -- shell | grep COOKIE_DOMAIN

# If not set, add it:
vercel env add COOKIE_DOMAIN production \
  --value ".plenno.com.au" \
  --scope pleeno-yb5fuvs3z \
  -- shell

# Redeploy
git commit --allow-empty -m "Trigger redeploy for cookie domain config"
git push origin main
```

### Issue 3: Still Getting 401 on Dashboard APIs

**Symptom:** Dashboard loads but all API calls return 401

**Cause:** Session not being read correctly or RLS policies blocking

**Debug steps:**

1. **Check if cookies are present in request:**
   ```bash
   # Open browser DevTools → Network tab
   # Find a failing API request (e.g., /dashboard/api/kpis)
   # Click on it → Headers → Request Headers
   # Look for "Cookie:" header
   # Should contain: sb-qyjftxpnlfumxwpxfdmx-auth-token=...
   ```

2. **If cookies are NOT in request:**
   - Cookie domain mismatch
   - SameSite policy blocking
   - Browser security policy

   **Fix:** Verify cookie domain is exactly `.plenno.com.au` (with leading dot)

3. **If cookies ARE in request but still 401:**
   - Session validation failing
   - Supabase configuration issue
   - JWT expired

   **Fix:** Check Supabase logs and JWT expiry settings

### Issue 4: DNS Not Propagating

**Symptom:** `shell.plenno.com.au` not resolving or returns NXDOMAIN

**Check propagation:**
```bash
# Check DNS
dig shell.plenno.com.au

# Check from different DNS servers
dig @8.8.8.8 shell.plenno.com.au
dig @1.1.1.1 shell.plenno.com.au
```

**Fix:**
- Wait 10-15 minutes for propagation
- Verify DNS record is correct in your DNS provider
- Use `nslookup shell.plenno.com.au` as alternative check

### Issue 5: CORS Errors in Browser Console

**Symptom:** Dashboard shows CORS errors when calling APIs

**Cause:** Cookie credentials not being sent with fetch requests

**Fix:** Check that fetch requests include `credentials: 'include'`

```typescript
// In dashboard API calls
fetch('/dashboard/api/kpis', {
  credentials: 'include',  // ← This is required
})
```

---

## Rollback Plan

### If Everything Breaks:

1. **Revert code changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Remove COOKIE_DOMAIN env vars:**
   ```bash
   for app in shell dashboard entities payments agency reports; do
     vercel env rm COOKIE_DOMAIN production --scope pleeno-yb5fuvs3z --yes -- $app
   done
   ```

3. **Wait for redeployment**

4. **Previous state restored** (still broken, but not worse)

### Partial Rollback (Keep Custom Domains):

If code changes cause issues but custom domains work:

1. Revert only the code changes
2. Keep custom domain setup
3. Investigate alternative solutions (token-based auth)

---

## Post-Implementation Monitoring

### For First 24 Hours:

**Monitor:**
- Error rates in Vercel logs
- Authentication success rates
- API response times
- User-reported issues

**Check:**
```bash
# View recent errors in shell app
vercel logs --scope pleeno-yb5fuvs3z -- shell --since 1h

# View recent errors in dashboard app
vercel logs --scope pleeno-yb5fuvs3z -- dashboard --since 1h
```

### Look for:
- Spikes in 401 errors (should go to zero)
- Cookie-related errors in logs
- Supabase auth errors
- Unusual traffic patterns

---

## Timeline Summary

| Phase | Task | Time | Can Run in Parallel? |
|-------|------|------|---------------------|
| 1 | Infrastructure (DNS) | 15-20 min | No (sequential) |
| 2 | Code Changes | 30 min | Yes (while DNS propagates) |
| 3 | Environment Variables | 5 min | Yes |
| 4 | Supabase Config | 5 min | Yes |
| 5 | Redirect Logic Check | 5 min | Yes |
| 6 | Deployment | 15-30 min | No (sequential) |
| 7 | Testing | 15 min | No (sequential) |

**Total Time:**
- **Sequential:** ~90-120 minutes
- **With parallelization:** ~60-90 minutes

---

## Final Checklist

**Before Starting:**
- [ ] You have access to Vercel dashboard
- [ ] You have access to DNS provider for plenno.com.au
- [ ] You have access to Supabase dashboard
- [ ] Git repo is clean (no uncommitted changes)
- [ ] You understand the rollback plan

**Phase 1 - Infrastructure:**
- [ ] Custom domain added in Vercel for shell
- [ ] DNS record configured
- [ ] DNS propagated (shell.plenno.com.au resolves)
- [ ] Shell accessible via custom domain

**Phase 2 - Code:**
- [ ] api-route.ts updated
- [ ] server.ts updated
- [ ] Changes committed to git

**Phase 3 - Environment:**
- [ ] COOKIE_DOMAIN set for all apps

**Phase 4 - Supabase:**
- [ ] Site URL updated
- [ ] Redirect URLs added
- [ ] Supabase env vars verified

**Phase 6 - Deployment:**
- [ ] Code pushed to main
- [ ] GitHub Actions completed successfully
- [ ] All apps redeployed

**Phase 7 - Testing:**
- [ ] All custom domains accessible
- [ ] Login succeeds
- [ ] Redirects to custom domain
- [ ] Cookies have correct domain attribute
- [ ] Dashboard APIs return 200
- [ ] Data loads in dashboard

**Success:**
- [ ] No 401 errors in dashboard
- [ ] Session persists across zones
- [ ] All acceptance criteria met

---

## Support & Resources

### Documentation
- [REDIRECT_SUCCESS_AUTH_FAILURE.md](./REDIRECT_SUCCESS_AUTH_FAILURE.md) - Problem analysis
- [RESEARCH_PROMPT_COOKIE_DOMAIN_VIABILITY.md](./RESEARCH_PROMPT_COOKIE_DOMAIN_VIABILITY.md) - Research findings
- [AUTHENTICATION_FIX_AND_REDIRECT_ISSUE.md](./AUTHENTICATION_FIX_AND_REDIRECT_ISSUE.md) - Original issue

### External Resources
- [Supabase SSR Docs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js Multi-Zone](https://nextjs.org/docs/app/building-your-application/deploying/multi-zones)
- [Vercel Custom Domains](https://vercel.com/docs/projects/domains)
- [Cookie RFC 6265](https://datatracker.ietf.org/doc/html/rfc6265)

### Need Help?
- Check Vercel deployment logs
- Review Supabase auth logs
- Check browser console for errors
- Use browser DevTools → Network tab for request inspection

---

**Ready to implement? Start with Phase 1!** 🚀
