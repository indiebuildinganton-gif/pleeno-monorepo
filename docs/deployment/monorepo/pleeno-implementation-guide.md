# Pleeno Deployment Strategy: Technical Implementation Guide

**This is a practical, step-by-step guide to implementing the recommended Option 2 approach.**

---

## Part 1: Immediate Fixes (48 Hours to Resolution)

### Step 1: Diagnose Current Configuration

**Access Vercel Dashboard for each project:**

1. Dashboard Project → Settings → General
   - [ ] Record "Root Directory" (what does it currently show?)
   - [ ] Record "Build Command" 
   - [ ] Record "Framework Preset"

2. Do this for all 6 projects (shell, dashboard, agency, entities, payments, reports)

**Example of what you're looking for:**
```
❌ WRONG:
Root Directory: . (or blank/repo root)
Build Command: turbo build
Framework: Auto-detected

✅ CORRECT:
Root Directory: apps/dashboard
Build Command: turbo build --filter=dashboard
Framework: Next.js
```

### Step 2: Fix Root Directory Configuration

**For EACH Vercel project:**

1. Go to Settings → General → Root Directory
2. Click "Edit" button
3. Select the correct app directory:
   - Shell project → `apps/shell`
   - Dashboard project → `apps/dashboard`
   - Agency project → `apps/agency`
   - Entities project → `apps/entities`
   - Payments project → `apps/payments`
   - Reports project → `apps/reports`
4. Click Save

### Step 3: Update Build Commands

**For EACH project, navigate to Settings → Build & Deployment:**

1. Find "Build Command"
2. Replace with app-specific command:
   ```bash
   # Shell project build command:
   turbo build --filter=shell
   
   # Dashboard project build command:
   turbo build --filter=dashboard
   
   # Agency project build command:
   turbo build --filter=agency
   
   # Etc. for each app
   ```

**Why this matters**: 
- `turbo build` builds ALL 6 apps (slow, unnecessary)
- `turbo build --filter=dashboard` builds ONLY dashboard + its dependencies

### Step 4: Check next.config.js Files

**In each app directory (apps/dashboard/next.config.js, etc.):**

```javascript
// ❌ REMOVE THIS if it exists:
module.exports = {
  basePath: '/dashboard',  // ← DELETE THIS LINE
  // ... rest of config
}

// ✅ SHOULD LOOK LIKE:
module.exports = {
  // NO basePath here (deploying to subdomain root)
  reactStrictMode: true,
  // ... other config
}
```

**Why?** `basePath` is only for same-domain subpaths (example.com/dashboard/). Your apps are on subdomains (dashboard.example.com), so they need root path serving.

### Step 5: Verify Authentication Configuration

**In apps/shell (your auth service):**

Check `pages/api/auth/[...nextauth].ts` or your auth config file:

```javascript
// VERIFY this configuration exists:
const authOptions = {
  providers: [/* ... */],
  callbacks: {
    // Your callbacks...
  },
  cookies: {
    sessionToken: {
      name: '__Secure-pleeno.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // This is the critical part:
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || '.plenno.com.au',
      }
    },
    // ... other cookie configs
  }
}
```

**Add to .env.production:**
```bash
NEXTAUTH_COOKIE_DOMAIN=.plenno.com.au
NEXTAUTH_URL=https://shell.plenno.com.au
NEXTAUTH_SECRET=[your-secret]
```

**Add to .env.local (development):**
```bash
NEXTAUTH_COOKIE_DOMAIN=.localhost
NEXTAUTH_URL=http://shell.localhost:3000
NEXTAUTH_SECRET=[your-secret]
```

### Step 6: Test Deployment

**Push a test change:**

```bash
# Make a small change to dashboard (e.g., add a console.log)
# Commit and push to main/production branch

git commit -am "test: verifying deployment configuration"
git push origin main
```

**Monitor Vercel build:**
1. Go to Dashboard project in Vercel
2. Watch the build log
3. Look for:
   - ✅ "Root directory: apps/dashboard"
   - ✅ "Build command: turbo build --filter=dashboard"
   - ✅ Build completes successfully
   - ✅ App loads at `dashboard.plenno.com.au/` (not `/dashboard`)

**Test the app:**
1. Visit `dashboard.plenno.com.au` (or your domain)
2. Should load at root path (not showing /dashboard in URL)
3. Check if you can access pages normally

**Verify with all 6 apps:**
- [ ] shell.plenno.com.au loads correctly
- [ ] dashboard.plenno.com.au loads correctly
- [ ] agency.plenno.com.au loads correctly
- [ ] entities.plenno.com.au loads correctly
- [ ] payments.plenno.com.au loads correctly
- [ ] reports.plenno.com.au loads correctly

**If this works**, you've likely fixed the core issue! The rest is optimization.

---

## Part 2: Implement Turborepo Remote Caching (Week 2)

### Step 1: Link Vercel Account with Turborepo

```bash
# From repo root
cd Pleeno

# Install Vercel CLI if needed
npm install -g vercel

# Link your Vercel team
vercel link

# When prompted:
# - Select your team
# - Use existing Vercel projects (don't create new ones)
# - Link to your monorepo
```

### Step 2: Enable Remote Cache

```bash
# Authenticate turbo with Vercel
turbo login

# This will:
# 1. Open browser for authentication
# 2. Create connection between turbo and your Vercel account
# 3. Enable remote caching automatically

# Verify it worked
turbo link
# Should show: "Successfully linked to remote caching"
```

### Step 3: Update turbo.json

**Verify your turbo.json has proper configuration:**

```json
{
  "globalDependencies": ["**/.env.local", "**/.env.production"],
  "globalEnv": [
    "NEXTAUTH_URL",
    "NEXTAUTH_COOKIE_DOMAIN",
    "DATABASE_URL"
  ],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "outputMode": "hash-on-exit",
      "cache": true,
      "env": [
        "NEXTAUTH_URL",
        "NEXTAUTH_COOKIE_DOMAIN"
      ]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "cache": true,
      "outputs": ["coverage/**"]
    }
  }
}
```

**Key points:**
- `"^build"` means "run build on dependencies first"
- `outputs` tells Turborepo what to cache
- `env` tells Turborepo which env vars affect the build
- Build caching only works if env vars are declared

### Step 4: Test Remote Cache

```bash
# Clear local cache to test
rm -rf .turbo

# Build dashboard
turbo build --filter=dashboard

# Check build time (write down the time)
# Build shell next
turbo build --filter=shell

# This should use cache from dashboard's build
# Check Vercel dashboard Usage tab → Artifacts
# Should show "Cache hit" for shared packages

# Verify cache is working
turbo build --filter=dashboard --no-cache

# Compare build times:
# WITH cache: <30 seconds
# WITHOUT cache: 2-3 minutes
```

### Step 5: Configure per-project Ignored Build Steps (Optional)

In Vercel, you can skip preview deployments for unchanged apps:

**For EACH project, go to Settings → Build & Deployment:**

1. Scroll to "Ignored Build Step" section
2. Create a script file: `scripts/vercel-ignore.sh`

```bash
#!/bin/bash
# scripts/vercel-ignore.sh
# This skips build if the app hasn't changed

CHANGED_FILES=$(git diff HEAD^ HEAD --name-only)

case "$VERCEL_GIT_COMMIT_REF" in
  main|production)
    # Always build on production branches
    exit 0
    ;;
  *)
    # Check if changes affect this app
    if echo "$CHANGED_FILES" | grep -qE "^apps/dashboard/|^packages/"; then
      exit 0  # Build dashboard
    else
      exit 1  # Skip build
    fi
    ;;
esac
```

3. Set "Ignored Build Step" to:
   ```bash
   bash scripts/vercel-ignore.sh
   ```

4. Repeat for each app (copy script, adjust app name)

---

## Part 3: Implement Cross-Subdomain Authentication (Week 2)

### Step 1: Update Shell App (Auth Service)

**File: apps/shell/pages/api/auth/[...nextauth].ts**

```typescript
import NextAuth, { type NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

// Helper to determine cookie domain
const getCookieDomain = () => {
  const isDev = process.env.NODE_ENV === "development"
  if (isDev) {
    return ".localhost"
  }
  // Production: .plenno.com.au allows all subdomains
  return ".plenno.com.au"
}

const useSecureCookies = process.env.NEXTAUTH_URL?.startsWith("https://")
const cookiePrefix = useSecureCookies ? "__Secure-" : ""

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      // Your provider config
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}pleeno.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: getCookieDomain(),
      },
    },
    callbackUrl: {
      name: `${cookiePrefix}pleeno.callback-url`,
      options: {
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: getCookieDomain(),
      },
    },
    csrfToken: {
      name: `${cookiePrefix}pleeno.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: getCookieDomain(),
      },
    },
    pkceCodeVerifier: {
      name: `${cookiePrefix}pleeno.pkce-verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: getCookieDomain(),
      },
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
}

export default NextAuth(authOptions)
```

**Environment variables (.env.local and .env.production):**

```bash
# Shell app specific
NEXTAUTH_URL=https://shell.plenno.com.au
NEXTAUTH_SECRET=[generate with: openssl rand -base64 32]

# Optional but recommended
NEXTAUTH_COOKIE_DOMAIN=.plenno.com.au
NEXTAUTH_SESSION_MAXAGE=2592000
```

### Step 2: Update Other Apps (Dashboard, Agency, etc.)

**File: apps/dashboard/lib/auth.ts** (or wherever you handle auth)

```typescript
// Function to get session from shell auth service
export async function getSession() {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SHELL_URL}/api/auth/session`,
      {
        credentials: "include", // ← CRITICAL: Send cookies with request
        headers: {
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.error("Failed to get session:", error)
    return null
  }
}

// Function to sign in (redirects to shell)
export function signIn() {
  window.location.href = `${process.env.NEXT_PUBLIC_SHELL_URL}/login?callbackUrl=${window.location.origin}`
}

// Function to sign out (redirects to shell)
export function signOut() {
  window.location.href = `${process.env.NEXT_PUBLIC_SHELL_URL}/api/auth/signout?callbackUrl=${window.location.origin}`
}
```

**In your middleware or layout** (apps/dashboard/middleware.ts or pages/_app.tsx):

```typescript
// Example with Next.js middleware
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  // Check if user is authenticated
  const session = await getSession()

  if (!session && request.nextUrl.pathname !== "/public-page") {
    // Redirect to shell for login
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SHELL_URL}/login?callbackUrl=${request.nextUrl.toString()}`
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Protect all routes except public ones
    "/((?!public|_next/static|_next/image|favicon.ico).*)",
  ],
}
```

**Environment variables for all apps:**

```bash
# apps/dashboard/.env.local
NEXT_PUBLIC_SHELL_URL=http://shell.localhost:3000

# apps/dashboard/.env.production
NEXT_PUBLIC_SHELL_URL=https://shell.plenno.com.au
```

Do the same for agency, entities, payments, reports apps.

### Step 3: Test Cross-Subdomain Authentication

**Local testing (with hosts file):**

```bash
# Add to /etc/hosts (Mac/Linux) or C:\Windows\System32\drivers\etc\hosts (Windows):
127.0.0.1 shell.localhost
127.0.0.1 dashboard.localhost
127.0.0.1 agency.localhost

# Start dev server
npm run dev

# Test flow:
# 1. Visit http://dashboard.localhost:3000
# 2. Should redirect to shell.localhost for login
# 3. Login at shell
# 4. Redirect back to dashboard (now authenticated)
# 5. Check browser DevTools → Application → Cookies
#    Should see __Secure-pleeno.session-token with domain ".localhost"
```

**Production testing:**

After deploying to production:

```bash
# Test steps:
1. Visit dashboard.plenno.com.au (not authenticated)
2. Should redirect to shell.plenno.com.au/login
3. Log in with test credentials
4. Should redirect back to dashboard.plenno.com.au (authenticated)
5. Visit agency.plenno.com.au
6. Should be authenticated (same session)
7. Check cookies in DevTools:
   - Should see __Secure-pleeno.session-token
   - Domain should be ".plenno.com.au" (with dot prefix)
   - Should be accessible on all subdomains
```

---

## Part 4: Monitoring & Optimization

### Build Time Tracking

**Create a script to track build times:**

```bash
#!/bin/bash
# scripts/track-builds.sh

TIMESTAMP=$(date +%Y-%m-%d\ %H:%M:%S)
APP=$1
BUILD_TIME=$2

echo "$TIMESTAMP | $APP | ${BUILD_TIME}s" >> build-times.log

# Review weekly:
# tail -20 build-times.log
# Should show decreasing times as cache hits improve
```

**In your CI (GitHub Actions):**

```yaml
name: Track Build Performance

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build dashboard
        run: |
          START=$(date +%s)
          npm run build -- --filter=dashboard
          END=$(date +%s)
          DURATION=$((END - START))
          echo "Dashboard build: ${DURATION}s"
          
      - name: Track in logs
        run: |
          bash scripts/track-builds.sh dashboard $DURATION
```

### Cache Monitoring

**Check Vercel Dashboard Usage tab:**

1. Go to each Vercel project
2. Click "Usage" tab
3. Look at "Remote Cache" section
4. Track:
   - Cache hit rate (should be >70%)
   - Artifacts stored
   - Build minutes saved

**Weekly report template:**

```markdown
## Build Performance Report

### Cache Statistics
- Total builds: 15
- Cache hits: 12 (80%)
- Cache misses: 3 (20%)
- Build minutes saved: 45

### Build Times
- Shell: 2.5 min
- Dashboard: 2.1 min (cache hit: shared packages)
- Agency: 1.8 min (cache hit: shared packages)
- Entities: 1.5 min (cache hit)
- Payments: 1.9 min (cache hit)
- Reports: 1.7 min (cache hit)

### Cost
- Total build minutes: 320/month
- Cost: $4.48/month (standard machines)
- Plus Vercel Pro: $20/month
- Total: $24.48/month
```

---

## Part 5: Troubleshooting

### Issue: "The path you are accessing was not found"

**Symptoms**: App loads but returns 404, URL shows `/dashboard/...`

**Solution**:
1. Check Vercel root directory (should be `apps/dashboard`)
2. Check next.config.js for `basePath: '/dashboard'` and remove it
3. Check build command includes `--filter=dashboard`
4. Redeploy

### Issue: Cache not being shared between projects

**Symptoms**: Build times slow, cache hit rate low (<30%)

**Solution**:
1. Verify `turbo login` completed successfully
2. Check `turbo.json` declares outputs correctly
3. Verify `turbo link` shows "Remote caching connected"
4. Check environment variables are listed in turbo.json
5. Try: `turbo build --filter=dashboard --verbose` to see cache details

### Issue: Authentication not working across subdomains

**Symptoms**: Can login on shell, but other apps show "not authenticated"

**Solution**:
1. Check cookie domain: should be `.plenno.com.au` (with dot)
2. Verify HTTPS in production (cookies require secure flag)
3. Check `credentials: 'include'` in fetch calls
4. Verify all apps have same `NEXTAUTH_SECRET`
5. Test in browser DevTools → Application → Cookies

### Issue: Turborepo saying "Missing dependencies"

**Symptoms**: Build fails with "Cannot find package X"

**Solution**:
1. Verify package name in turbo.json matches package.json name
2. Check package.json has `"name": "@pleeno/auth"` (not just `auth`)
3. Verify turbo.json lists all dependencies:
   ```json
   "dependencies": {
     "dashboard": ["@pleeno/auth", "@pleeno/database", "@pleeno/ui"]
   }
   ```
4. Clear cache: `rm -rf .turbo` and rebuild

---

## Quick Reference: Configuration Checklist

### ✅ Each Vercel Project (6 projects total)

- [ ] Root Directory: `apps/[app-name]`
- [ ] Build Command: `turbo build --filter=[app-name]`
- [ ] Framework: Next.js
- [ ] Node Version: 18+ (matches your package.json)
- [ ] Environment variables configured

### ✅ Each app's next.config.js

- [ ] NO `basePath` when deploying to subdomains
- [ ] Correct image config if using external images
- [ ] Any required headers/redirects

### ✅ Shell app auth config

- [ ] Cookie domain: `.plenno.com.au` (production) or `.localhost` (dev)
- [ ] NEXTAUTH_URL set correctly
- [ ] NEXTAUTH_SECRET configured
- [ ] JWT strategy enabled (for cross-subdomain)

### ✅ Other apps

- [ ] `NEXT_PUBLIC_SHELL_URL` environment variable set
- [ ] Session fetch includes `credentials: 'include'`
- [ ] Redirect to shell for unauthenticated users
- [ ] Handle session checking in middleware or layout

### ✅ Repository root

- [ ] turbo.json exists and is valid JSON
- [ ] turbo.json declares app-to-package dependencies
- [ ] turbo.json includes environment variables affecting builds
- [ ] turbo login and turbo link completed

---

## Timeline for Implementation

**Day 1-2**: Fix immediate configuration issues  
**Day 3-5**: Test and verify all apps load correctly  
**Week 2**: Implement Turborepo remote caching  
**Week 2**: Implement cross-subdomain authentication  
**Week 3**: Monitor cache hit rates and optimize  
**Week 4**: Document and train team  

**Total effort**: 2 weeks to full implementation and verification

---

**Next step**: Start with Part 1 and verify your current configuration. Most issues resolve just from fixing root directories and build commands.