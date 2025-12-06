# Custom Domain Setup Guide for Pleeno Multi-Zone Architecture

## Why Custom Domain Solves the Redirect Issue

### Current Problem (Vercel Free Domains)
- Shell: `pleeno-shell-uat.vercel.app` sets auth cookie
- Dashboard: `pleeno-dashboard-uat.vercel.app` CANNOT read that cookie
- Result: Infinite redirect loop (ERR_TOO_MANY_REDIRECTS)

### Solution (Custom Domain)
- Shell: `shell.yourdomain.com` sets cookie with domain `.yourdomain.com`
- Dashboard: `dashboard.yourdomain.com` CAN read that cookie
- Result: Authentication works perfectly across all zones!

## Step-by-Step Setup Guide

### Step 1: Configure DNS Records

Add these records to your domain's DNS settings:

```
# For each subdomain (replace yourdomain.com with your actual domain)
Type    Name        Value
------  ----------  ------------------------
CNAME   shell       cname.vercel-dns.com
CNAME   dashboard   cname.vercel-dns.com
CNAME   agency      cname.vercel-dns.com
CNAME   entities    cname.vercel-dns.com
CNAME   payments    cname.vercel-dns.com
CNAME   reports     cname.vercel-dns.com

# Optional: Main domain redirect to shell
A       @           76.76.21.21
```

### Step 2: Add Custom Domains to Vercel

For each app, add the custom domain in Vercel:

1. **Shell App**
   ```bash
   vercel domains add shell.yourdomain.com --project pleeno-shell-uat
   ```

2. **Dashboard App**
   ```bash
   vercel domains add dashboard.yourdomain.com --project pleeno-dashboard-uat
   ```

3. **Agency App**
   ```bash
   vercel domains add agency.yourdomain.com --project pleeno-agency-uat
   ```

4. **Entities App**
   ```bash
   vercel domains add entities.yourdomain.com --project pleeno-entities-uat
   ```

5. **Payments App**
   ```bash
   vercel domains add payments.yourdomain.com --project pleeno-payments-uat
   ```

6. **Reports App**
   ```bash
   vercel domains add reports.yourdomain.com --project pleeno-reports-uat
   ```

### Step 3: Update Environment Variables

Add these to ALL zones in Vercel dashboard:

```env
# Common for all zones
NEXT_PUBLIC_COOKIE_DOMAIN=.yourdomain.com

# Shell app
NEXT_PUBLIC_APP_URL=https://shell.yourdomain.com

# Dashboard app
NEXT_PUBLIC_SHELL_URL=https://shell.yourdomain.com

# Update zone URLs
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.yourdomain.com
NEXT_PUBLIC_AGENCY_URL=https://agency.yourdomain.com
NEXT_PUBLIC_ENTITIES_URL=https://entities.yourdomain.com
NEXT_PUBLIC_PAYMENTS_URL=https://payments.yourdomain.com
NEXT_PUBLIC_REPORTS_URL=https://reports.yourdomain.com
```

### Step 4: Update Middleware for Cookie Sharing

Create a new file `/packages/utils/src/cookie-config.ts`:

```typescript
export const getCookieDomain = () => {
  // Use subdomain cookie sharing in production
  if (process.env.NEXT_PUBLIC_COOKIE_DOMAIN) {
    return process.env.NEXT_PUBLIC_COOKIE_DOMAIN
  }

  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'localhost'
  }

  // Default: no domain (current domain only)
  return undefined
}

export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  domain: getCookieDomain(),
}
```

### Step 5: Update Shell Middleware

Update `/apps/shell/middleware.ts`:

```typescript
import { COOKIE_OPTIONS } from '@pleeno/utils/cookie-config'

// In the cookie set function:
set(name: string, value: string, options: any) {
  const cookieOptions = {
    ...options,
    ...COOKIE_OPTIONS, // Use shared cookie config
  }

  request.cookies.set({
    name,
    value,
    ...cookieOptions,
  })

  response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  response.cookies.set({
    name,
    value,
    ...cookieOptions,
  })
}
```

### Step 6: Update Next.js Configs

Update `/apps/shell/next.config.ts`:

```typescript
const ZONE_URLS = {
  dashboard: process.env.NEXT_PUBLIC_DASHBOARD_URL || 'http://localhost:3001',
  agency: process.env.NEXT_PUBLIC_AGENCY_URL || 'http://localhost:3002',
  entities: process.env.NEXT_PUBLIC_ENTITIES_URL || 'http://localhost:3003',
  payments: process.env.NEXT_PUBLIC_PAYMENTS_URL || 'http://localhost:3004',
  reports: process.env.NEXT_PUBLIC_REPORTS_URL || 'http://localhost:3005',
}
```

### Step 7: Deploy All Apps

Deploy each app to apply the changes:

```bash
# Deploy shell
npx vercel --prod --project pleeno-shell-uat

# Deploy dashboard
npx vercel --prod --project pleeno-dashboard-uat

# Deploy other zones...
```

## Testing Your Custom Domain

### 1. DNS Propagation Check
```bash
# Check if DNS has propagated
nslookup shell.yourdomain.com
nslookup dashboard.yourdomain.com
```

### 2. Test Authentication Flow
1. Visit `https://shell.yourdomain.com/login`
2. Login with credentials
3. Should redirect to `https://shell.yourdomain.com/dashboard`
4. Dashboard zone at `https://dashboard.yourdomain.com` should work

### 3. Verify Cookie Sharing
```javascript
// In browser console on shell.yourdomain.com
document.cookie

// Should show cookies with domain=.yourdomain.com
// These will be accessible from all subdomains
```

## Troubleshooting

### Issue: DNS not resolving
**Solution**: Wait 24-48 hours for full DNS propagation

### Issue: SSL certificate errors
**Solution**: Vercel automatically provisions SSL. Wait 10-15 minutes after adding domain.

### Issue: Still getting redirect loops
**Solution**:
1. Clear all cookies and cache
2. Check NEXT_PUBLIC_COOKIE_DOMAIN is set correctly
3. Ensure all zones are deployed with updated config

### Issue: Cookies not sharing between subdomains
**Solution**:
1. Verify cookie domain starts with a dot: `.yourdomain.com`
2. Check all zones use the same cookie configuration
3. Use browser DevTools to inspect Set-Cookie headers

## Quick Verification Script

Save this as `test-auth.sh`:

```bash
#!/bin/bash
DOMAIN="yourdomain.com"

echo "Testing authentication flow for $DOMAIN"

# Login
echo "1. Logging in..."
curl -c cookies.txt -s "https://shell.$DOMAIN/api/auth/login" \
  -H "content-type: application/json" \
  -d '{"email":"admin@test.local","password":"password"}' | jq .

# Check cookie
echo -e "\n2. Checking cookie domain..."
grep "$DOMAIN" cookies.txt

# Test dashboard access
echo -e "\n3. Testing dashboard access..."
curl -b cookies.txt -s -o /dev/null -w "%{http_code}" "https://shell.$DOMAIN/dashboard"

# Test cross-zone access
echo -e "\n4. Testing cross-zone cookie sharing..."
curl -b cookies.txt -s -o /dev/null -w "%{http_code}" "https://dashboard.$DOMAIN"

echo -e "\nIf you see 200 or 307 status codes, authentication is working!"
```

## Benefits After Migration

1. ✅ **No more redirect loops** - Cookies shared across all subdomains
2. ✅ **Professional appearance** - `app.yourdomain.com` instead of `xyz.vercel.app`
3. ✅ **Better security** - Controlled cookie domain
4. ✅ **Simpler architecture** - No need for authentication header workarounds
5. ✅ **Better SEO** - Custom domain improves search rankings

## Summary

With your custom domain:
- All zones share the same authentication cookie
- The redirect loop will be completely eliminated
- Users can seamlessly navigate between zones
- The multi-zone architecture will work as designed

The key is setting the cookie domain to `.yourdomain.com` which allows all subdomains to read the same authentication cookie.

---

**Next Steps:**
1. Add DNS records for your domain
2. Add custom domains to each Vercel project
3. Update environment variables
4. Deploy all zones
5. Test authentication flow

Your ERR_TOO_MANY_REDIRECTS issue will be completely resolved!