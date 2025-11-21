# Development Guide

This guide covers common development workflows and troubleshooting for the Pleeno multi-zone Next.js application.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Multi-Zone Architecture](#multi-zone-architecture)
3. [Authentication in Development](#authentication-in-development)
4. [Common Issues](#common-issues)
5. [Best Practices](#best-practices)

## Quick Start

### Starting All Zones

```bash
# From project root
pnpm dev
```

This starts all 6 zones in parallel:
- **Shell:** http://localhost:3005 (main entry point)
- **Reports:** http://localhost:3000
- **Entities:** http://localhost:3001
- **Dashboard:** http://localhost:3002
- **Payments:** http://localhost:3003
- **Agency:** http://localhost:3004

### Accessing the Application

**You can access zones in two ways:**

**Option 1: Through Shell Zone (Recommended)**
- Main URL: http://localhost:3005
- Login: http://localhost:3005/login
- Dashboard: http://localhost:3005/dashboard
- Entities: http://localhost:3005/entities
- etc.

**Option 2: Direct Zone Access**
- Dashboard: http://localhost:3002/dashboard
- Entities: http://localhost:3001/entities
- Payments: http://localhost:3003/payments
- Agency: http://localhost:3004/agency
- Reports: http://localhost:3000/reports

**Both methods work!** Authentication cookies are shared across all localhost ports via `domain: 'localhost'`.

## Multi-Zone Architecture

### How It Works

In development:
1. Each zone runs on a separate port
2. The shell zone (port 3005) can act as the main entry point
3. Requests to `/dashboard`, `/entities`, etc. can be **proxied** through shell
4. **OR** you can access zones directly - cookies work across all ports
5. Authentication cookies use `domain: 'localhost'` to enable port sharing

In production:
1. All zones are deployed separately
2. All zones share the same domain (e.g., app.pleeno.com)
3. Cookies are set with a shared domain (.pleeno.com)
4. No proxying needed - all zones accessible directly

### Zone Responsibilities

| Zone | Port | Base Path | Direct URL | Purpose |
|------|------|-----------|------------|---------|
| Shell | 3005 | `/` | http://localhost:3005 | Main entry, auth, routing |
| Reports | 3000 | `/reports` | http://localhost:3000/reports | Financial reports |
| Entities | 3001 | `/entities` | http://localhost:3001/entities | Colleges & students |
| Dashboard | 3002 | `/dashboard` | http://localhost:3002/dashboard | Analytics & overview |
| Payments | 3003 | `/payments` | http://localhost:3003/payments | Payment tracking |
| Agency | 3004 | `/agency` | http://localhost:3004/agency | Agency management |

## Authentication in Development

### Cookie Sharing Across Ports

**How cookies work across localhost ports:**

By setting `domain: 'localhost'` on authentication cookies, they are shared across all localhost ports:
- Login on any port (3005, 3002, etc.)
- Cookies automatically available on all other ports
- Access any zone directly without re-authenticating

### Two Access Methods

**Method 1: Through Shell Proxy**
```
http://localhost:3005/dashboard
              ↓
     Shell zone (port 3005)
     [Cookies available ✓]
              ↓
     Proxies to Dashboard (port 3002)
     [Cookies forwarded ✓]
```

**Method 2: Direct Access**
```
http://localhost:3002/dashboard
              ↓
     Dashboard zone (port 3002)
     [Cookies available ✓ - shared via domain]
              ↓
     Middleware validates auth
     [Direct access works!]
```

### Login Workflow

1. Open http://localhost:3005 (or any zone URL)
2. Click "Login" or navigate to http://localhost:3005/login
3. Enter credentials:
   - Email: admin@test.local
   - Password: Password123
4. After login, access any zone via either method:
   - Through shell: http://localhost:3005/dashboard
   - Direct: http://localhost:3002/dashboard

Both work! Cookies are shared across all ports.

## Common Issues

### Issue 1: Infinite Redirect Loop

**Symptoms:**
- Browser shows "too many redirects" error
- Console shows multiple redirect attempts

**Cause:**
- Middleware configuration error
- Missing auth cookies

**Solution:**
1. Clear browser cookies for localhost
2. Restart all dev servers: `pnpm dev`
3. Login again

### Issue 2: 401 Unauthorized After Cookie Changes

**Symptoms:**
- Getting 401 errors on previously working zones
- Network logs show requests without auth

**Cause:**
Old cookies without the `domain: 'localhost'` setting

**Solution:**
1. Clear all browser cookies for localhost
2. Restart dev servers: `pnpm dev`
3. Login again - new cookies will work across all ports

### Issue 3: "Supabase client not initialized"

**Symptoms:**
- Console error about Supabase client
- API routes fail with 500 error

**Cause:**
- Missing environment variables
- Supabase not running

**Solution:**
1. Check `.env.local` exists with Supabase credentials
2. Start Supabase: `cd supabase && npx supabase start`
3. Restart dev servers: `pnpm dev`

### Issue 4: Network Logger Shows Empty Headers

**Symptoms:**
- Network logs show `requestHeaders: {}`
- But authentication works fine

**Explanation:**
This is **expected behavior**. The network logger runs client-side and captures `fetch` calls. Authentication cookies are HTTP-only and managed by the browser - they won't appear in the logged headers but are still sent to the server.

**This is normal when:**
- ✓ User is logged in
- ✓ API routes work correctly
- ✓ No 401 errors

**This indicates a problem when:**
- ✗ Getting 401 errors
- ✗ API routes fail
- ✗ User should be logged in but isn't

## Best Practices

### Development Workflow

1. **Always start from shell zone**
   ```bash
   # Open your browser to
   http://localhost:3005
   ```

2. **Login first**
   ```
   http://localhost:3005/login
   ```

3. **Navigate through shell zone**
   ```
   http://localhost:3005/dashboard
   http://localhost:3005/entities
   http://localhost:3005/payments
   ```

4. **Bookmark the shell zone**
   Add http://localhost:3005 to your bookmarks for quick access

### Testing API Routes

Use the shell zone URL for API testing:

```bash
# ✅ Correct - through shell proxy
curl http://localhost:3005/dashboard/api/kpis

# ❌ Incorrect - direct to zone
curl http://localhost:3002/dashboard/api/kpis
```

### Debugging Authentication

If you suspect auth issues:

1. Open DevTools → Application → Cookies
2. Check cookies for `localhost` (or `localhost:3005`)
3. Look for Supabase auth cookies:
   - `sb-<project>-auth-token`
   - `sb-<project>-auth-token-code-verifier`

4. If cookies are missing → Re-login
5. If cookies exist but getting 401 → Check you're accessing through shell zone

### Environment Variables

Each zone needs the same Supabase credentials:

```bash
# Required in all zones (apps/*/. env.local or root .env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

Turborepo will share environment variables from root `.env.local` to all zones.

## Network Activity Logging

The shell zone includes a network activity logger that captures all fetch requests.

### Viewing Logs

Logs are saved to: `logs/network-activity/network-logs-<timestamp>.json`

### Understanding Log Entries

```json
{
  "id": "uuid",
  "timestamp": "2025-11-18T13:43:15.692Z",
  "method": "GET",
  "url": "/dashboard/api/activity-log?limit=20",
  "requestHeaders": {},  // Empty - cookies are HTTP-only
  "status": 401,
  "responseBody": {
    "error": "Unauthorized"
  }
}
```

**Empty `requestHeaders`:** This is normal! Authentication cookies are HTTP-only and won't appear in client-side logs.

**401 errors:** Check if you're accessing through the shell zone.

## Further Reading

- [Architecture Documentation](./architecture.md)
- [Deployment Guide](../DEPLOYMENT.md)
- [Environment Variables](./environment-variables.md)
- [Multi-Zone Docs](https://nextjs.org/docs/app/building-your-application/routing/multi-zone)
