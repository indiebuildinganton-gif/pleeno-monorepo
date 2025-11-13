# Task 1: Initialize Turborepo Monorepo with Multi-Zone Architecture

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 1, 2

## Objective

Initialize a Turborepo monorepo with 6 independent Next.js 15 zones following the multi-zone architecture pattern.

## Context

This is a **greenfield project** - no existing code. You are implementing the foundation for Pleeno, a multi-tenant agency management SaaS. The architecture uses Turborepo to manage 6 independent Next.js zones that will be deployed separately but work together as a cohesive application.

## Prerequisites

- Node.js 18+ installed
- npm installed
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno`

## Task Steps

### 1. Initialize Turborepo Monorepo

```bash
npx create-turbo@latest pleeno-monorepo
cd pleeno-monorepo
```

**Note:** When prompted during initialization:
- Choose npm as package manager
- Select "basic" template
- Enable remote caching: No (for now)

### 2. Create 6 Next.js 15 Zones

Navigate to the apps directory and create each zone:

```bash
cd apps
npx create-next-app@latest shell --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest dashboard --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest agency --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest entities --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest payments --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest reports --typescript --tailwind --app --use-npm --eslint
cd ..
```

**Important:** For each zone creation, accept the defaults when prompted.

### 3. Configure Multi-Zone Rewrites in Shell App

Edit `apps/shell/next.config.js` to add multi-zone rewrites:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/dashboard',
        destination: 'http://localhost:3001/dashboard',
      },
      {
        source: '/dashboard/:path*',
        destination: 'http://localhost:3001/dashboard/:path*',
      },
      {
        source: '/agency',
        destination: 'http://localhost:3002/agency',
      },
      {
        source: '/agency/:path*',
        destination: 'http://localhost:3002/agency/:path*',
      },
      {
        source: '/entities',
        destination: 'http://localhost:3003/entities',
      },
      {
        source: '/entities/:path*',
        destination: 'http://localhost:3003/entities/:path*',
      },
      {
        source: '/payments',
        destination: 'http://localhost:3004/payments',
      },
      {
        source: '/payments/:path*',
        destination: 'http://localhost:3004/payments/:path*',
      },
      {
        source: '/reports',
        destination: 'http://localhost:3005/reports',
      },
      {
        source: '/reports/:path*',
        destination: 'http://localhost:3005/reports/:path*',
      },
    ]
  },
}

module.exports = nextConfig
```

### 4. Configure basePath for Each Zone

For each zone (dashboard, agency, entities, payments, reports), edit their `next.config.js`:

**apps/dashboard/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/dashboard',
}

module.exports = nextConfig
```

**apps/agency/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/agency',
}

module.exports = nextConfig
```

**apps/entities/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/entities',
}

module.exports = nextConfig
```

**apps/payments/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/payments',
}

module.exports = nextConfig
```

**apps/reports/next.config.js:**
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/reports',
}

module.exports = nextConfig
```

**Note:** The shell app does NOT need a basePath as it serves as the main entry point.

### 5. Configure Development Ports

Update the root `package.json` to run each zone on its designated port:

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "dev:shell": "cd apps/shell && npm run dev -- --port 3000",
    "dev:dashboard": "cd apps/dashboard && npm run dev -- --port 3001",
    "dev:agency": "cd apps/agency && npm run dev -- --port 3002",
    "dev:entities": "cd apps/entities && npm run dev -- --port 3003",
    "dev:payments": "cd apps/payments && npm run dev -- --port 3004",
    "dev:reports": "cd apps/reports && npm run dev -- --port 3005"
  }
}
```

## Verification Steps

1. **Verify folder structure exists:**
   ```bash
   ls -la apps/
   # Should show: shell, dashboard, agency, entities, payments, reports
   ```

2. **Verify each zone has Next.js 15 installed:**
   ```bash
   cat apps/shell/package.json | grep "next"
   # Should show: "next": "15.x.x"
   ```

3. **Test starting all zones:**
   ```bash
   npm run dev
   # All 6 zones should start on ports 3000-3005
   ```

4. **Verify multi-zone routing (after all zones start):**
   - Open http://localhost:3000 (shell)
   - Navigate to http://localhost:3000/dashboard (should proxy to dashboard zone)
   - Navigate to http://localhost:3000/agency (should proxy to agency zone)

## Success Criteria

- [ ] Turborepo monorepo initialized successfully
- [ ] 6 Next.js 15 zones created in apps/ directory
- [ ] Multi-zone rewrites configured in shell app
- [ ] basePath configured for each zone (dashboard, agency, entities, payments, reports)
- [ ] Development ports configured (3000-3005)
- [ ] All zones start successfully with `npm run dev`
- [ ] TypeScript compilation succeeds with no errors

## Architecture References

- **Source:** docs/architecture.md - Project Initialization
- **Source:** docs/architecture.md - ADR-001: Microfrontend Architecture with Multi-Zones
- **Source:** docs/architecture.md - Project Structure

## Next Task

After completing this task, proceed to **Task 2: Set Up Shared Packages Structure**
