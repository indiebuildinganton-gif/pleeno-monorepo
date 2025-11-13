# Task 3: Configure Code Quality Tools

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 2

## Objective

Set up ESLint, Prettier, and pre-commit hooks to enforce code quality standards across the monorepo.

## Context

Consistent code quality and formatting are essential for team collaboration and maintainability. This task establishes the foundation for automated code quality checks.

## Prerequisites

- Task 1 completed (Turborepo monorepo initialized)
- Task 2 completed (Shared packages structure set up)
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Install ESLint and Prettier Dependencies

```bash
npm install -D eslint prettier eslint-config-prettier eslint-plugin-prettier @typescript-eslint/eslint-plugin @typescript-eslint/parser
```

### 2. Configure ESLint at Root Level

Create `.eslintrc.js` at the root:

```javascript
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'next/core-web-vitals',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    '.next/',
    'dist/',
    'build/',
    '*.config.js',
    '*.config.ts',
  ],
}
```

### 3. Configure Prettier

Create `.prettierrc` at the root:

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

Create `.prettierignore`:

```
node_modules
.next
dist
build
*.config.js
*.config.ts
package-lock.json
```

### 4. Install Husky and lint-staged

```bash
npm install -D husky lint-staged
npx husky install
```

### 5. Configure Husky Pre-commit Hook

Add to `package.json`:

```json
{
  "scripts": {
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md,yml,yaml}": [
      "prettier --write"
    ]
  }
}
```

Create pre-commit hook:

```bash
npx husky add .husky/pre-commit "npx lint-staged"
```

### 6. Add Lint Scripts to Root package.json

Update the `scripts` section in root `package.json`:

```json
{
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "type-check": "turbo run type-check",
    "prepare": "husky install"
  }
}
```

### 7. Add Lint Scripts to Each Zone

For each zone app (shell, dashboard, agency, entities, payments, reports), add to their `package.json`:

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

### 8. Add ESLint Configuration for Each Zone

Each zone should already have `.eslintrc.json` from `create-next-app`. Update each to extend the root config:

```json
{
  "extends": ["../../.eslintrc.js"]
}
```

### 9. Configure VS Code Settings (Optional but Recommended)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/.next": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
```

Create `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss"
  ]
}
```

## Verification Steps

1. **Test ESLint:**
   ```bash
   npm run lint
   # Should lint all workspaces
   ```

2. **Test Prettier:**
   ```bash
   npm run format:check
   # Should check formatting across all files
   ```

3. **Test pre-commit hook:**

   Make a deliberate formatting error in any file:
   ```bash
   echo "const test    =     123" >> apps/shell/app/test.ts
   git add .
   git commit -m "test pre-commit"
   # Husky should run lint-staged and fix formatting
   ```

4. **Verify TypeScript strict mode:**

   Check that all `tsconfig.json` files have `"strict": true`

5. **Test auto-fix:**
   ```bash
   npm run lint:fix
   # Should fix auto-fixable issues
   ```

## Success Criteria

- [ ] ESLint configured at root and in all zones
- [ ] Prettier configured with project style guide
- [ ] Husky pre-commit hooks installed and working
- [ ] lint-staged configured to run on staged files
- [ ] `npm run lint` passes with no errors
- [ ] `npm run format:check` passes with no errors
- [ ] Pre-commit hook prevents commits with linting errors
- [ ] VS Code settings configured for consistent development experience

## Troubleshooting

**Issue:** Husky hooks not running
- Run `npx husky install` again
- Check `.husky/pre-commit` file has execute permissions: `chmod +x .husky/pre-commit`

**Issue:** ESLint errors in Next.js config files
- Ensure `*.config.js` is in `.eslintignore`

**Issue:** Prettier conflicts with ESLint
- Ensure `eslint-config-prettier` is installed and in extends array

## Architecture References

- **Source:** docs/architecture.md - Decision Summary (code quality tools)

## Next Task

After completing this task, proceed to **Task 4: Set Up Supabase PostgreSQL Database**
