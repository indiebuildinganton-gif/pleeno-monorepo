# Pleeno Development Server Error Report

**Date:** 2025-11-15
**Reporter:** Claude Code
**Severity:** HIGH

---

## Executive Summary

After configuring permanent ports for all Next.js applications in the Pleeno monorepo, several critical errors persist that prevent proper application functionality. This report documents all identified issues, their root causes, and recommended solutions.

---

## Error Categories

### 1. CRITICAL: Import/Export Mismatch Error

**Affected Application:** Agency (`http://localhost:3004`)

**Error Message:**
```
Export createServerClient doesn't exist in target module
./apps/agency/app/components/UserMenu.tsx (12:1)
```

**Location:** [apps/agency/app/components/UserMenu.tsx:12](apps/agency/app/components/UserMenu.tsx#L12)

**Root Cause:**
The `UserMenu.tsx` component imports `createServerClient` from the main `@pleeno/database` package entry point:
```typescript
import { createServerClient } from '@pleeno/database'
```

However, based on the package exports configuration in [packages/database/package.json](packages/database/package.json#L8-L14), `createServerClient` is NOT exported from the main entry point (`./src/index.ts`). It should be imported from the `/server` subpath:

**Package Structure:**
```json
"exports": {
  ".": "./src/index.ts",           // Only exports types, activity-logger, audit-logger
  "./server": "./src/server.ts",    // Exports createServerClient
  "./client": "./src/client.ts",
  "./middleware": "./src/middleware.ts"
}
```

**Impact:**
- Agency application fails to load
- All components using server-side Supabase client are broken
- User authentication features unavailable

**Recommended Solution:**
Change the import statement in `apps/agency/app/components/UserMenu.tsx` from:
```typescript
import { createServerClient } from '@pleeno/database'
```
to:
```typescript
import { createServerClient } from '@pleeno/database/server'
```

This same pattern likely affects multiple files across all apps. A global search and replace is recommended.

---

### 2. HIGH: Expected 404 Errors on Individual App Ports

**Affected Applications:**
- Entities (`http://localhost:3001/`)
- Dashboard (`http://localhost:3002/`)
- Payments (`http://localhost:3003/`)

**Error Message:** `404 Not Found`

**Root Cause:**
These applications are configured with `basePath` settings:
- entities: `basePath: '/entities'` ([apps/entities/next.config.ts:4](apps/entities/next.config.ts#L4))
- dashboard: `basePath: '/dashboard'` ([apps/dashboard/next.config.ts:4](apps/dashboard/next.config.ts#L4))
- payments: `basePath: '/payments'` ([apps/payments/next.config.ts:4](apps/payments/next.config.ts#L4))

**Impact:**
This is **expected behavior** in the current multi-zone architecture. These apps are designed to be accessed through the shell application via rewrites.

**Status:** NOT AN ERROR - Working as designed

**Correct Access Pattern:**
- ❌ `http://localhost:3001/` → 404
- ✅ `http://localhost:3005/entities` → Works via shell rewrite
- ✅ `http://localhost:3005/dashboard` → Works via shell rewrite
- ✅ `http://localhost:3005/payments` → Works via shell rewrite

**Documentation Note:**
Should be documented in developer onboarding that individual apps should not be accessed directly when using basePath.

---

### 3. MEDIUM: Package Version Conflicts (import-in-the-middle & require-in-the-middle)

**Affected Applications:** All apps (entities, payments, reports, agency)

**Warning Messages:**
```
Package import-in-the-middle can't be external
The package resolves to a different version when requested from the
project directory (2.0.0) compared to the importing module (1.15.0).

Package require-in-the-middle can't be external
The package resolves to a different version when requested from the
project directory (8.0.1) compared to the importing module (7.5.2).
```

**Root Cause:**
Multiple versions of instrumentation packages exist in the dependency tree:
- Root package.json has: `import-in-the-middle: 2.0.0` and `require-in-the-middle: 8.0.1`
- OpenTelemetry/Sentry dependencies require older versions (1.15.0 and 7.5.2)

**Affected Packages:**
- `@opentelemetry/instrumentation@0.53.0`
- `@opentelemetry/instrumentation@0.57.1`
- `@opentelemetry/instrumentation@0.57.2`
- `@sentry/node@8.55.0`

**Impact:**
- Performance: Turbopack cannot externalize these packages
- Build time: Longer compilation times
- Warnings: Cluttered console output
- Potential runtime issues with telemetry/monitoring

**Recommended Solutions:**
1. **Option A (Quick Fix):** Remove explicit dependencies from root package.json and let peer dependencies resolve
2. **Option B (Proper Fix):** Update all OpenTelemetry packages to compatible versions
3. **Option C (Nuclear):** Add to `serverExternalPackages` in next.config files (not recommended)

**Priority:** Medium - Doesn't block development but should be resolved before production

---

### 4. LOW: Multiple Package Lock Files Warning

**Warning Message:**
```
⚠ Warning: Next.js inferred your workspace root, but it may not be correct.
We detected multiple lockfiles and selected the directory of
/Users/brenttudas/Pleeno/pnpm-lock.yaml as the root directory.

Detected additional lockfiles:
  * /Users/brenttudas/Pleeno/apps/[app]/package-lock.json
```

**Root Cause:**
Individual apps have `package-lock.json` files alongside the monorepo's `pnpm-lock.yaml`.

**Impact:**
- Confusion about which package manager is authoritative
- Potential for dependency drift
- Slower Turbopack initialization

**Recommended Solution:**
1. Delete all individual `package-lock.json` files
2. Add `turbopack.root` to each app's next.config.ts:
```typescript
const nextConfig: NextConfig = {
  basePath: '/app-name',
  serverExternalPackages: [],
  turbopack: {
    root: '../../', // Point to monorepo root
  },
}
```

**Cleanup Command:**
```bash
find apps -name "package-lock.json" -delete
```

---

### 5. LOW: Sentry Turbopack Compatibility Warning

**Affected Application:** Shell (`http://localhost:3005`)

**Warning Message:**
```
[@sentry/nextjs] WARNING: You are using the Sentry SDK with `next dev --turbo`.
The Sentry SDK doesn't yet fully support Turbopack. The SDK will not be loaded
in the browser, and serverside instrumentation will be inaccurate or incomplete.
```

**Root Cause:**
Sentry SDK has incomplete Turbopack support. Using `--turbopack` flag in development disables browser-side Sentry.

**Impact:**
- Development: No Sentry error tracking in browser
- Development: Incomplete server-side instrumentation
- Production: No impact (production builds don't use `--turbopack`)

**Recommended Solutions:**
1. **Option A:** Set environment variable to suppress warning:
   ```bash
   SENTRY_SUPPRESS_TURBOPACK_WARNING=1
   ```
2. **Option B:** Remove `--turbopack` during Sentry debugging
3. **Option C:** Wait for official Sentry Turbopack support

**Status:** Known limitation, monitor https://github.com/getsentry/sentry-javascript/issues/8105

---

## Port Configuration Status ✅

**Successfully Configured Ports:**

| Application | Port | Status | Config Location |
|-------------|------|--------|-----------------|
| reports     | 3000 | ✅ Working | [apps/reports/package.json:6](apps/reports/package.json#L6) |
| entities    | 3001 | ✅ Working | [apps/entities/package.json:6](apps/entities/package.json#L6) |
| dashboard   | 3002 | ✅ Working | [apps/dashboard/package.json:6](apps/dashboard/package.json#L6) |
| payments    | 3003 | ✅ Working | [apps/payments/package.json:6](apps/payments/package.json#L6) |
| agency      | 3004 | ✅ Working | [apps/agency/package.json:6](apps/agency/package.json#L6) |
| shell       | 3005 | ✅ Working | [apps/shell/package.json:6](apps/shell/package.json#L6) |

**Shell Rewrite Configuration:** ✅ Correctly configured in [apps/shell/next.config.ts:6-22](apps/shell/next.config.ts#L6-L22)

---

## Current System State

### Active Processes
```
PORT  | PID   | APPLICATION
------|-------|-------------
3000  | 76728 | reports (node)
3001  | 76726 | entities (node)
3002  | 76729 | dashboard (node)
3003  | 76727 | payments (node)
4004  | 76730 | agency (node)
3005  | 76731 | shell (node)
```

All ports are correctly assigned and running.

---

## Priority Action Items

### IMMEDIATE (Critical - Blocks Development)
1. **Fix `createServerClient` import error**
   - Search all apps for: `from '@pleeno/database'`
   - Replace with: `from '@pleeno/database/server'` (where applicable)
   - Estimated files affected: 10-20
   - Time: 15-30 minutes

### HIGH (Should Fix This Week)
2. **Resolve package version conflicts**
   - Update OpenTelemetry dependencies
   - Remove conflicting root dependencies
   - Time: 1-2 hours

3. **Clean up package lock files**
   - Delete individual app `package-lock.json` files
   - Add `turbopack.root` configuration
   - Time: 15 minutes

### MEDIUM (Can Wait)
4. **Add Sentry suppression flag**
   - Add to `.env.local` or npm scripts
   - Time: 5 minutes

5. **Document multi-zone architecture**
   - Explain basePath behavior
   - Document correct URL patterns
   - Time: 30 minutes

---

## Testing Checklist

After implementing fixes, verify:

- [ ] All apps start without errors: `pnpm run dev`
- [ ] Agency app loads without import errors
- [ ] Shell app can access all sub-apps via rewrites
- [ ] No port conflicts occur
- [ ] Package version warnings reduced/eliminated
- [ ] Only one lock file exists (pnpm-lock.yaml)

---

## Additional Notes

### Architecture Pattern
The current setup uses Next.js Multi-Zones pattern where:
- **Shell App** (port 3005): Main orchestrator with rewrites
- **Sub Apps** (ports 3000-3004): Individual feature apps with basePaths
- **Access Pattern**: All user traffic goes through shell → shell rewrites to sub-apps

### Related Files
- Root package.json: [package.json](package.json)
- Shell config: [apps/shell/next.config.ts](apps/shell/next.config.ts)
- Database package: [packages/database/package.json](packages/database/package.json)

---

**Report Generated:** 2025-11-15
**Next Review:** After critical fixes implemented
