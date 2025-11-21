# Authentication Troubleshooting Guide

## Quick Diagnosis

Run this script to check your authentication status:

```bash
./test-auth.sh
```

Or manually test:

```bash
# Check if you're logged in on shell zone
curl -s "http://localhost:3005/api/auth-status" | python3 -m json.tool

# Check if you're logged in on dashboard zone
curl -s "http://localhost:3002/dashboard/api/auth-status" | python3 -m json.tool
```

## Common Issue: "Getting 401 errors on dashboard"

### Symptoms
- Accessing `http://localhost:3002/dashboard` shows empty widgets
- Network logs show 401 Unauthorized errors
- API endpoints return `{"error": "Unauthorized"}`

### Root Cause
**You are not logged in** or your session has expired.

The 401 errors are **expected behavior** when you don't have an active session.

### Solution

**Step 1: Make sure Supabase is running**
```bash
# Start local Supabase if not running
npx supabase start
```

**Step 2: Login through the shell zone**
1. Open browser to: `http://localhost:3005/login`
2. Enter credentials:
   - Email: `admin@test.local`
   - Password: `Password123`
3. Click "Login"

**Step 3: Access dashboard**
- Navigate to: `http://localhost:3002/dashboard`
- OR access through shell: `http://localhost:3005/dashboard`

**Both methods work** - cookies are shared across all localhost ports via `domain: 'localhost'`.

## How to Verify You're Logged In

### Browser Method (Recommended)
1. Open DevTools (F12)
2. Go to: Application → Cookies → localhost
3. Look for cookies starting with `sb-`
4. You should see:
   - `sb-127-auth-token`
   - `sb-127-auth-token-code-verifier`

If these cookies are missing → You're not logged in

### API Method
```bash
# Check authentication status
curl -s "http://localhost:3005/api/auth-status"
```

Expected response when logged in:
```json
{
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "admin@test.local",
    "role": "agency_admin",
    "agency_id": "..."
  }
}
```

Expected response when NOT logged in:
```json
{
  "authenticated": false,
  "user": null,
  "error": "Auth session missing!",
  "cookies": []
}
```

## Understanding the Architecture

### How Authentication Works

```
1. Login Flow:
   User → http://localhost:3005/login
        ↓
   POST to /api/auth/login
        ↓
   Supabase creates session
        ↓
   Cookies set with domain: 'localhost'
        ↓
   Cookies available on ALL localhost ports

2. API Request Flow:
   Browser → http://localhost:3002/dashboard/api/kpis
        ↓
   Browser automatically sends cookies (domain: localhost)
        ↓
   requireRole() validates session with Supabase
        ↓
   If valid: Return data
   If invalid: Return 401 Unauthorized
```

### Why You Get 401 Errors

The API routes use `requireRole()` which:
1. Checks for Supabase authentication cookies
2. Validates the session with Supabase
3. Returns 401 if no valid session exists

**This is working as intended** - it's protecting your API endpoints.

## Troubleshooting Steps

### Issue: "I logged in but still getting 401 errors"

**Check 1: Are cookies present?**
```
DevTools → Application → Cookies → localhost
Look for: sb-* cookies
```

**Check 2: Are cookies being sent?**
```bash
curl -v "http://localhost:3002/dashboard/api/auth-status" 2>&1 | grep Cookie
```
Note: curl won't have cookies unless you login via curl. Use browser DevTools Network tab instead.

**Check 3: Is Supabase running?**
```bash
curl "http://127.0.0.1:54321/rest/v1/"
```

**Check 4: Are all zones using local Supabase?**
```bash
grep "NEXT_PUBLIC_SUPABASE_URL" apps/*/.env.local
```
All should show: `http://127.0.0.1:54321`

### Issue: "Cookies exist but still getting 401"

**Possible causes:**
1. **Session expired** - Login again
2. **Different Supabase instances** - Check env files
3. **Browser cleared cookies** - Login again
4. **Supabase restarted** - Sessions invalidated, login again

**Solution:**
```bash
# Clear browser cookies
DevTools → Application → Cookies → localhost → Clear all

# Restart dev servers
pkill -f "next dev"
pnpm dev

# Login again
Open: http://localhost:3005/login
```

### Issue: "Network logs show requestHeaders: {}"

**This is normal!**

The network logger is client-side JavaScript and cannot see HTTP-only cookies. The browser still sends cookies to the server, they just don't appear in the logged headers.

**How to verify cookies are being sent:**
- DevTools → Network tab → Click request → Cookies tab
- You'll see the actual cookies sent to the server

## Multi-Zone Cookie Sharing

### Development (localhost)
- All zones share cookies via `domain: 'localhost'`
- Login on any port → Available on all ports
- Access zones directly or through shell proxy

### Production
- All zones share cookies via `domain: '.pleeno.com'`
- Single domain, no cross-origin issues
- Cookies work seamlessly across all zones

## Reference: Environment Configuration

All zones must use the same Supabase instance:

```bash
# apps/shell/.env.local
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# apps/dashboard/.env.local (must match!)
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>

# ... same for all zones
```

If zones use different Supabase instances, authentication will fail.

## Summary

**401 Unauthorized errors are expected when:**
- ✗ You haven't logged in yet
- ✗ Your session has expired
- ✗ Cookies were cleared
- ✗ Supabase was restarted

**Solution: Login at http://localhost:3005/login**

**401 errors are NOT expected when:**
- ✓ You have valid cookies
- ✓ Session is active
- ✓ All zones use same Supabase instance

If you're logged in and still getting 401 errors, see the incident report: `docs/INCIDENT_REPORT_2025-11-21_MULTI_ZONE_AUTH.md`
