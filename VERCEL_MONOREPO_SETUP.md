# Vercel Monorepo Setup Instructions

The deployment is failing because Vercel projects are configured with `apps/[name]` as the Root Directory, but they need to use `.` (the monorepo root).

## Fix via Vercel Dashboard

For each project, update the Root Directory setting:

### Dashboard Project
1. Go to: https://vercel.com/antons-projects-1b1c34d6/dashboard/settings
2. Navigate to: **Settings → General → Root Directory**
3. Change from `apps/dashboard` to `.` (dot - the root)
4. Click **Save**

### Entities Project
1. Go to: https://vercel.com/antons-projects-1b1c34d6/entities/settings
2. Navigate to: **Settings → General → Root Directory**
3. Change from `apps/entities` to `.`
4. Click **Save**

### Payments Project
1. Go to: https://vercel.com/antons-projects-1b1c34d6/payments/settings
2. Navigate to: **Settings → General → Root Directory**
3. Change from `apps/payments` to `.`
4. Click **Save**

### Agency Project
1. Go to: https://vercel.com/antons-projects-1b1c34d6/agency/settings
2. Navigate to: **Settings → General → Root Directory**
3. Change from `apps/agency` to `.`
4. Click **Save**

### Reports Project
1. Go to: https://vercel.com/antons-projects-1b1c34d6/reports/settings
2. Navigate to: **Settings → General → Root Directory**
3. Change from `apps/reports` to `.`
4. Click **Save**

### Shell Project
1. Go to: https://vercel.com/antons-projects-1b1c34d6/shell/settings
2. Navigate to: **Settings → General → Root Directory**
3. Change from `apps/shell` to `.`
4. Click **Save**

## Why This is Needed

The monorepo uses:
- **Workspaces**: Shared packages across apps
- **Turbo**: Build orchestration
- **pnpm**: Package manager with workspace support

All of these require access to the monorepo root where:
- `pnpm-workspace.yaml` defines the workspace structure
- `package.json` contains all dev dependencies
- `turbo.json` configures build tasks
- `packages/*` contains shared code

## What the vercel.json Files Do

Each app has a `vercel.json` that tells Vercel:
```json
{
  "buildCommand": "pnpm turbo build --filter=[app-name]",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": "apps/[app-name]/.next"
}
```

This configuration:
- Installs all dependencies from the monorepo root
- Builds only the specific app using Turbo's filter
- Points to the correct output directory for each app

## After Making Changes

Once you've updated all 6 projects, trigger a new deployment:
```bash
git commit --allow-empty -m "Test: Vercel monorepo configuration" && git push
```

The deployment should then succeed!
