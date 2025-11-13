# Task 7: Create Basic CI/CD Pipeline

**Story:** 1.1 - Project Infrastructure Initialization
**Task ID:** 7 of 9
**Acceptance Criteria:** AC 1

## Objective

Set up GitHub Actions workflow for continuous integration that runs linting, type-checking, and build verification on all pull requests and pushes to main.

## Context

CI/CD ensures code quality before deployment by automatically running tests, linting, and builds. Vercel handles deployment (CD), so this focuses on CI.

## Tasks

### 1. Create GitHub Actions Workflow Directory

```bash
mkdir -p .github/workflows
```

### 2. Create CI Workflow

**Create `.github/workflows/ci.yml`:**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  lint-and-typecheck:
    name: Lint and Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npm run type-check

  build:
    name: Build All Zones
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all zones
        run: npm run build
        env:
          # Use dummy values for build (not real credentials)
          NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
          NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy-key-for-ci-build
          SUPABASE_SERVICE_ROLE_KEY: dummy-key-for-ci-build
          DATABASE_URL: postgresql://postgres:postgres@localhost:54322/postgres
          NEXT_PUBLIC_APP_URL: http://localhost:3000
          SESSION_SECRET: dummy-secret-for-ci-build-min-32-chars

      - name: Check build output
        run: |
          echo "Verifying build artifacts..."
          ls -la apps/*/out || ls -la apps/*/.next
```

### 3. Add Type-Check Script to package.json

**Update root `package.json`:**

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "turbo run type-check"
  }
}
```

**Add type-check script to each zone's `package.json`:**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  }
}
```

### 4. Configure Automatic Deployment on Merge

Vercel automatically deploys when code is pushed to main (configured in Task 6).

**Verify in Vercel Dashboard:**
1. Go to Settings → Git
2. Ensure "Production Branch" is set to `main`
3. Ensure "Automatic Deployments" is enabled

**The flow is:**
1. Developer creates PR
2. GitHub Actions runs CI checks (lint, type-check, build)
3. If CI passes and PR is approved → merge to main
4. Vercel automatically deploys to production

### 5. Add CI Status Badge to README

**Update root `README.md`:**

```markdown
# Pleeno - Multi-Agency Student Recruitment Platform

[![CI](https://github.com/your-org/pleeno/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/pleeno/actions/workflows/ci.yml)

[Rest of README...]
```

Replace `your-org/pleeno` with your actual GitHub repository path.

### 6. Configure Branch Protection Rules (Optional but Recommended)

**In GitHub Repository Settings:**
1. Go to Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require status checks to pass before merging
   - Require branches to be up to date before merging
   - Select: `lint-and-typecheck` and `build` checks
   - Require pull request reviews before merging (1 approval)
   - Require conversation resolution before merging

This prevents merging code that fails CI checks.

### 7. Test CI Pipeline

**Create a test PR:**

```bash
git checkout -b test-ci-pipeline
echo "# Test" >> test-file.md
git add test-file.md
git commit -m "test: CI pipeline"
git push -u origin test-ci-pipeline
```

**Create PR on GitHub:**
1. Go to GitHub repository
2. Click "Compare & pull request"
3. Create PR
4. Watch GitHub Actions run CI checks
5. Verify checks pass (green checkmarks)

**Clean up:**
```bash
git checkout main
git branch -D test-ci-pipeline
git push origin --delete test-ci-pipeline
rm test-file.md
```

## Verification Steps

1. Verify `.github/workflows/ci.yml` exists
2. Verify GitHub Actions is enabled for repository
3. Verify CI runs on new PRs
4. Verify all jobs pass (lint, type-check, build)
5. Verify CI badge shows in README
6. Verify Vercel deploys automatically after merge to main

## Expected Outcome

- GitHub Actions CI workflow configured
- Linting and type-checking run on all PRs
- Build verification ensures all zones compile
- CI status badge displays in README
- Automatic deployment to Vercel after merge to main
- Optional: Branch protection prevents merging failing code

## Common Issues & Solutions

**Issue:** CI fails with "MODULE_NOT_FOUND"
**Solution:** Run `npm ci` locally to verify dependencies install correctly

**Issue:** Type-check fails in CI but works locally
**Solution:** Ensure all zones have `type-check` script and `tsconfig.json` is valid

**Issue:** Build fails with missing environment variables
**Solution:** Add dummy values to workflow env section (see step 2)

**Issue:** GitHub Actions workflow not running
**Solution:** Ensure workflow file is in `.github/workflows/` and committed to main

## Future Enhancements

**Story 1.4** will add:
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright
- Code coverage reporting

**These will be added to the CI pipeline in later stories.**

## References

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Turbo CI/CD Guide](https://turbo.build/repo/docs/ci)
- [docs/architecture.md](../../docs/architecture.md)
- [Story Context XML](.bmad-ephemeral/stories/1-1-project-infrastructure-initialization.context.xml)
