# Fix Vercel Project Root Directory Settings

## Context

This is a **pnpm monorepo** with 6 Next.js applications that need to be deployed to Vercel via GitHub Actions. The monorepo structure is:

```
pleeno-monorepo/
├── apps/
│   ├── dashboard/
│   ├── entities/
│   ├── payments/
│   ├── agency/
│   ├── reports/
│   └── shell/
├── packages/          # Shared workspace packages
├── pnpm-workspace.yaml
├── turbo.json
└── package.json       # Root with all devDependencies
```

## Current Problem

All 6 Vercel projects were created with `apps/[app-name]` as their **Root Directory** setting. This breaks monorepo builds because:
- Vercel can't find workspace dependencies
- pnpm workspace configuration is at the root
- Shared packages aren't accessible
- Build commands fail with "No Next.js version detected"

## Required Fix

Update all 6 Vercel projects to use `.` (dot - the monorepo root) as their Root Directory using the **Vercel REST API**.

## Project Details

**Vercel Token**: `LcmNFjkib4apuWfDl2KgYIa7`
**Organization ID**: `team_3mCod2SbRmzu38gdxZd84tpe`

**Projects to Update**:
1. **dashboard** - Project ID: `prj_LuG5grzWFQWQG4Md0nKRAebbIjAk`
2. **entities** - Project ID: `prj_PbNAYOpwz0AUw6j1M3TPdsualWiz`
3. **payments** - Project ID: `prj_SvZfAQkhKjUPgIJpVSVBS7FeuduU`
4. **agency** - Project ID: `prj_DXMliZgxFsO4h1jEMvQ6G5F226J8`
5. **reports** - Project ID: `prj_R2l6JMK3DGd974cYWhgAKsWaLpOg`
6. **shell** - Project ID: `prj_4diVs3Je0cd4VZSiFzi3WCG7npJ5`

## Vercel.json Configuration

Each app directory has a `vercel.json` configured for monorepo builds:

```json
{
  "buildCommand": "pnpm turbo build --filter=[app-name]",
  "installCommand": "pnpm install --frozen-lockfile",
  "framework": "nextjs",
  "outputDirectory": "apps/[app-name]/.next"
}
```

These files are already in place at:
- `apps/dashboard/vercel.json`
- `apps/entities/vercel.json`
- `apps/payments/vercel.json`
- `apps/agency/vercel.json`
- `apps/reports/vercel.json`
- `apps/shell/vercel.json`

## Task Instructions

**Use the Vercel REST API to update the Root Directory setting for all 6 projects.**

### API Endpoint
```
PATCH https://api.vercel.com/v9/projects/{projectId}
```

### Required Headers
```
Authorization: Bearer LcmNFjkib4apuWfDl2KgYIa7
Content-Type: application/json
```

### Request Body
```json
{
  "rootDirectory": "."
}
```

### Example Command
```bash
curl -X PATCH "https://api.vercel.com/v9/projects/prj_LuG5grzWFQWQG4Md0nKRAebbIjAk" \
  -H "Authorization: Bearer LcmNFjkib4apuWfDl2KgYIa7" \
  -H "Content-Type: application/json" \
  -d '{"rootDirectory": "."}'
```

## Success Criteria

After updating all 6 projects:
1. Each project's Root Directory should be `.` instead of `apps/[name]`
2. Verify the change by checking one project's settings
3. Trigger a test deployment to confirm builds work

## Verification

After the fix, you can verify by deploying:
```bash
git commit --allow-empty -m "Test: Vercel monorepo root directory fix"
git push
```

Expected behavior:
- ✅ Vercel installs dependencies from monorepo root
- ✅ Workspace packages are accessible
- ✅ Turbo builds the specific app with `--filter`
- ✅ Build outputs to `apps/[name]/.next`
- ✅ Deployment succeeds

## Additional Context

- **GitHub Repo**: `indiebuildinganton-gif/pleeno-monorepo`
- **Workflow Files**:
  - `.github/workflows/deploy-production.yml` (deploys on push to main)
  - `.github/workflows/deploy-preview.yml` (deploys on PRs)
- **Current Status**: Deployments failing with "No Next.js version detected"

## Notes

- The workflow uses `vercel --cwd=apps/[name]` but this doesn't work because Vercel still needs the root for workspace resolution
- All GitHub secrets (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID_*) are already configured
- The monorepo uses pnpm@9.15.0 as specified in package.json packageManager field
