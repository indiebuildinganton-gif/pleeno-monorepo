# Task 8: Install Shared Dependencies

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 1

## Objective

Install all required shared dependencies for the monorepo packages with correct versions.

## Context

Shared dependencies enable functionality across all zones. This task installs database, UI, form, and utility packages according to the architecture specification.

## Prerequisites

- Task 2 completed (Shared packages structure created)
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Install Supabase Packages

```bash
npm install -w packages/database @supabase/supabase-js @supabase/ssr
```

**Packages installed:**
- `@supabase/supabase-js`: Supabase client library for database operations
- `@supabase/ssr`: Server-side rendering support for Supabase auth

### 2. Install UI and State Management Packages

```bash
npm install -w packages/ui zustand @tanstack/react-query react-hook-form @hookform/resolvers zod
```

**Packages installed:**
- `zustand@5.0.8`: Client state management
- `@tanstack/react-query@5.90.7`: Server state and caching
- `react-hook-form@7.66.0`: Form state management
- `@hookform/resolvers`: Form validation integrations
- `zod@^3.22.0`: Schema validation

### 3. Install Date and Chart Packages

```bash
npm install -w packages/ui date-fns date-fns-tz recharts @tanstack/react-table
```

**Packages installed:**
- `date-fns@4.1.0`: Date manipulation
- `date-fns-tz`: Timezone support
- `recharts@3.3.0`: Dashboard charts
- `@tanstack/react-table@8.21.3`: Data tables

### 4. Install Email and PDF Packages

```bash
npm install -w packages/ui @react-pdf/renderer resend
```

**Packages installed:**
- `@react-pdf/renderer@4.3.1`: PDF generation for contracts and statements
- `resend@6.4.2`: Email delivery service

### 5. Install Shadcn UI Dependencies

```bash
npm install -w packages/ui class-variance-authority clsx tailwind-merge lucide-react
```

**Packages installed:**
- `class-variance-authority`: Utility for managing component variants
- `clsx`: Utility for constructing className strings
- `tailwind-merge`: Utility for merging Tailwind CSS classes
- `lucide-react`: Icon library

### 6. Install Development Dependencies

```bash
npm install -D @types/node @types/react @types/react-dom eslint-config-next
```

**Packages installed:**
- `@types/node`: TypeScript types for Node.js
- `@types/react`: TypeScript types for React
- `@types/react-dom`: TypeScript types for React DOM
- `eslint-config-next`: ESLint configuration for Next.js

### 7. Update Package.json with Exact Versions

Verify root `package.json` has these versions:

```json
{
  "name": "pleeno-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "lint:fix": "turbo run lint -- --fix",
    "format": "prettier --write \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "format:check": "prettier --check \"**/*.{js,jsx,ts,tsx,json,md}\"",
    "type-check": "turbo run type-check",
    "prepare": "husky install"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "eslint": "^8.54.0",
    "eslint-config-next": "^15.0.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.0.1",
    "@typescript-eslint/eslint-plugin": "^6.13.0",
    "@typescript-eslint/parser": "^6.13.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.1.0",
    "prettier": "^3.1.0",
    "turbo": "latest",
    "typescript": "^5.3.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### 8. Verify Package Installations

Check that packages are installed correctly:

```bash
# Check Supabase packages
npm list @supabase/supabase-js @supabase/ssr

# Check UI packages
npm list zustand @tanstack/react-query react-hook-form

# Check date and chart packages
npm list date-fns recharts @tanstack/react-table

# Check email and PDF packages
npm list @react-pdf/renderer resend
```

### 9. Run Clean Install

```bash
# Remove all node_modules and reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
npm install
```

### 10. Verify Build Works with Dependencies

```bash
npm run build
```

Should build all zones successfully with no missing dependency errors.

## Verification Steps

1. **Verify all packages installed:**
   ```bash
   npm list --depth=0
   # Should show all packages installed at root level
   ```

2. **Verify workspace packages have dependencies:**
   ```bash
   cat packages/database/package.json
   # Should list @supabase/* packages

   cat packages/ui/package.json
   # Should list zustand, react-query, etc.
   ```

3. **Verify no dependency conflicts:**
   ```bash
   npm list
   # Should complete with no errors (warnings OK)
   ```

4. **Verify TypeScript can resolve types:**
   ```bash
   npm run type-check
   # Should pass with no errors
   ```

5. **Test importing packages in a zone:**

   Edit `apps/shell/app/page.tsx`:

   ```typescript
   import { z } from 'zod'
   import { format } from 'date-fns'

   export default function Home() {
     const now = format(new Date(), 'PPP')
     return <div>{now}</div>
   }
   ```

   Run:
   ```bash
   npm run dev:shell
   # Should start with no errors and display formatted date
   ```

## Success Criteria

- [ ] All Supabase packages installed (@supabase/supabase-js, @supabase/ssr)
- [ ] All UI packages installed (zustand, react-query, react-hook-form, zod)
- [ ] All date/chart packages installed (date-fns, recharts, react-table)
- [ ] All email/PDF packages installed (@react-pdf/renderer, resend)
- [ ] Shadcn UI dependencies installed (class-variance-authority, clsx, tailwind-merge, lucide-react)
- [ ] Development dependencies installed (@types/*, eslint-config-next)
- [ ] No dependency conflicts or errors
- [ ] TypeScript type-checking passes
- [ ] All zones build successfully
- [ ] Packages can be imported from zone apps

## Dependency Versions Reference

| Package | Version | Purpose |
|---------|---------|---------|
| next | 15.x | React framework |
| react | 19.x | UI library |
| typescript | 5.x | Type safety |
| @supabase/supabase-js | latest | Supabase client |
| zustand | 5.0.8 | Client state |
| @tanstack/react-query | 5.90.7 | Server state |
| react-hook-form | 7.66.0 | Form management |
| zod | ^3.22.0 | Schema validation |
| date-fns | 4.1.0 | Date manipulation |
| recharts | 3.3.0 | Charts |
| @tanstack/react-table | 8.21.3 | Data tables |
| @react-pdf/renderer | 4.3.1 | PDF generation |
| resend | 6.4.2 | Email delivery |

## Common Issues

**Issue:** "Cannot find module @supabase/supabase-js"
- **Solution:** Ensure package is installed in correct workspace: `npm install -w packages/database @supabase/supabase-js`

**Issue:** Version conflicts between zones
- **Solution:** Use single version at root level for shared dependencies

**Issue:** "Peer dependency not satisfied"
- **Solution:** Install missing peer dependencies or use `--legacy-peer-deps` if necessary

**Issue:** TypeScript errors after installing packages
- **Solution:** Restart TypeScript server in VS Code or run `npm run type-check`

## Architecture References

- **Source:** docs/architecture.md - Decision Summary (package versions)
- **Source:** docs/architecture.md - Project Initialization (install commands)

## Next Task

After completing this task, proceed to **Task 9: Document Setup Instructions**
