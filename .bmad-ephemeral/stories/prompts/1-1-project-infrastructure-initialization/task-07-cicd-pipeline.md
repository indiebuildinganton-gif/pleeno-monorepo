# Task 7: Create Basic CI/CD Pipeline

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 1

## Objective

Set up GitHub Actions workflow for continuous integration with linting, type-checking, and build verification.

## Context

CI/CD ensures code quality by running automated checks on every commit and pull request. This task establishes a basic pipeline that will catch issues before they reach production.

## Prerequisites

- Task 1-6 completed (monorepo initialized and deployed)
- GitHub repository exists
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Create GitHub Actions Directory

```bash
mkdir -p .github/workflows
```

### 2. Create CI Workflow

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

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
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npm run type-check

      - name: Check code formatting
        run: npm run format:check

  build:
    name: Build All Zones
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    strategy:
      matrix:
        zone: [shell, dashboard, agency, entities, payments, reports]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build ${{ matrix.zone }} zone
        run: npm run build --filter=${{ matrix.zone }}
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_APP_URL: https://pleeno-shell.vercel.app

  test:
    name: Run Tests
    runs-on: ubuntu-latest
    needs: lint-and-typecheck

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # Tests will be added in Story 1.4
      - name: Run tests
        run: echo "Tests will be added in Story 1.4"
```

### 3. Create Deployment Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy:
    name: Deploy to Vercel
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build all zones
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}

      - name: Deploy to Vercel
        run: echo "Vercel auto-deploys from main branch"
        # Vercel automatically deploys when code is pushed to main
        # No additional deployment step needed
```

### 4. Create PR Quality Check Workflow

Create `.github/workflows/pr-checks.yml`:

```yaml
name: PR Quality Checks

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  pr-validation:
    name: Validate Pull Request
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Check for sensitive files
        run: |
          if git diff --name-only origin/main | grep -E '\.env$|\.env\.local$'; then
            echo "Error: .env files should not be committed"
            exit 1
          fi

      - name: Check commit messages
        run: |
          git log --format=%B origin/main..HEAD | \
          while read msg; do
            if [ -n "$msg" ] && [ ${#msg} -lt 10 ]; then
              echo "Error: Commit message too short: $msg"
              exit 1
            fi
          done

      - name: Check for TODO comments
        run: |
          if grep -r "TODO:" apps/ packages/ --exclude-dir=node_modules; then
            echo "Warning: Found TODO comments - consider creating issues"
          fi
```

### 5. Configure GitHub Secrets

Go to your GitHub repository:

1. Navigate to **Settings > Secrets and variables > Actions**
2. Click **New repository secret**
3. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Supabase service role key |
| `NEXT_PUBLIC_APP_URL` | https://pleeno-shell.vercel.app |

### 6. Create Dependabot Configuration

Create `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      production-dependencies:
        patterns:
          - "next"
          - "react"
          - "react-dom"
      development-dependencies:
        dependency-type: "development"
```

### 7. Create Branch Protection Rules

In GitHub repository settings:

1. Go to **Settings > Branches**
2. Click **Add branch protection rule**
3. Branch name pattern: `main`
4. Configure rules:
   - ✅ Require a pull request before merging
   - ✅ Require approvals: 1
   - ✅ Require status checks to pass before merging
     - Add: `Lint and Type Check`
     - Add: `Build All Zones`
   - ✅ Require branches to be up to date before merging
   - ✅ Do not allow bypassing the above settings
5. Click **Create**

### 8. Add CI Badge to README

Add to the top of `README.md`:

```markdown
# Pleeno - Agency Management SaaS

[![CI](https://github.com/<your-username>/<your-repo>/workflows/CI/badge.svg)](https://github.com/<your-username>/<your-repo>/actions/workflows/ci.yml)
[![Deploy](https://github.com/<your-username>/<your-repo>/workflows/Deploy/badge.svg)](https://github.com/<your-username>/<your-repo>/actions/workflows/deploy.yml)

[Rest of README...]
```

### 9. Test CI Pipeline

Create a test branch and PR:

```bash
git checkout -b test-ci-pipeline
echo "# Testing CI" >> test.md
git add test.md
git commit -m "Test CI pipeline"
git push origin test-ci-pipeline
```

1. Go to GitHub and create a pull request
2. Watch the CI checks run
3. Verify all checks pass
4. Merge the PR (or close if just testing)

## Verification Steps

1. **Verify workflow files exist:**
   ```bash
   ls -la .github/workflows/
   # Should show: ci.yml, deploy.yml, pr-checks.yml
   ```

2. **Verify workflows run on push:**
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline"
   git push origin main
   ```
   - Go to GitHub Actions tab
   - Verify "CI" workflow runs and passes

3. **Verify workflows run on PR:**
   - Create a test PR
   - Verify "PR Quality Checks" runs

4. **Verify branch protection:**
   - Try to push directly to main (should be blocked)
   - Try to merge PR without approvals (should be blocked)

5. **Verify secrets are configured:**
   - Go to Settings > Secrets and variables > Actions
   - Confirm all 4 secrets are listed

## Success Criteria

- [ ] CI workflow created (`.github/workflows/ci.yml`)
- [ ] Deploy workflow created (`.github/workflows/deploy.yml`)
- [ ] PR checks workflow created (`.github/workflows/pr-checks.yml`)
- [ ] Dependabot configured (`.github/dependabot.yml`)
- [ ] GitHub secrets configured (Supabase credentials)
- [ ] Branch protection rules enabled on main branch
- [ ] CI badge added to README
- [ ] Test PR triggers all checks and passes
- [ ] Builds succeed for all 6 zones in CI

## CI Workflow Summary

**On every commit:**
1. Lint check (ESLint)
2. Type check (TypeScript)
3. Format check (Prettier)
4. Build all zones (parallel)

**On pull requests:**
1. All CI checks
2. PR validation (no .env files, commit message length)
3. Status must pass before merge allowed

**On push to main:**
1. All CI checks
2. Vercel automatically deploys

## Troubleshooting

**Issue:** CI fails with "Module not found"
- **Solution:** Ensure `npm ci` runs before build commands

**Issue:** Build fails with Supabase errors
- **Solution:** Verify GitHub secrets are set correctly

**Issue:** Branch protection blocks admin merges
- **Solution:** Adjust protection rules if needed (not recommended)

**Issue:** Dependabot PRs fail
- **Solution:** Review and update dependencies that cause breaking changes

## Future Enhancements

These will be added in future stories:

- **Story 1.4:** Unit and E2E test runs in CI
- **Future:** Code coverage reporting
- **Future:** Automatic changelog generation
- **Future:** Performance budgets and Lighthouse CI
- **Future:** Visual regression testing

## Architecture References

- **Source:** docs/architecture.md - CI/CD strategy
- **Source:** docs/architecture.md - Testing infrastructure

## Next Task

After completing this task, proceed to **Task 8: Install Shared Dependencies**
