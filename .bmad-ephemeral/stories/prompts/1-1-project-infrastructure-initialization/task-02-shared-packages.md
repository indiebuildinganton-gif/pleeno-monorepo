# Task 2: Set Up Shared Packages Structure

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 2

## Objective

Create 7 shared packages in the monorepo to enable code sharing across all zones.

## Context

Shared packages allow the 6 Next.js zones to share common code without duplication. Each package has a specific purpose and follows TypeScript best practices.

## Prerequisites

- Task 1 completed (Turborepo monorepo initialized)
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Create Package Directory Structure

```bash
mkdir -p packages/database/src
mkdir -p packages/ui/src/components
mkdir -p packages/auth/src
mkdir -p packages/validations/src
mkdir -p packages/utils/src
mkdir -p packages/stores/src
mkdir -p packages/tsconfig
```

### 2. Set Up packages/database

**packages/database/package.json:**
```json
{
  "name": "@pleeno/database",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "@supabase/ssr": "^0.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0"
  }
}
```

**packages/database/tsconfig.json:**
```json
{
  "extends": "@pleeno/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/database/src/index.ts:**
```typescript
// Placeholder - will be implemented in Story 1.2
export * from './client'
export * from './server'
```

**packages/database/src/client.ts:**
```typescript
// Placeholder - will be implemented in Story 1.2
// Browser client for Client Components
```

**packages/database/src/server.ts:**
```typescript
// Placeholder - will be implemented in Story 1.2
// Server client for Server Components
```

### 3. Set Up packages/ui

**packages/ui/package.json:**
```json
{
  "name": "@pleeno/ui",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zustand": "5.0.8",
    "@tanstack/react-query": "5.90.7",
    "react-hook-form": "7.66.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "date-fns": "4.1.0",
    "date-fns-tz": "^3.1.0",
    "recharts": "3.3.0",
    "@tanstack/react-table": "8.21.3",
    "@react-pdf/renderer": "4.3.1"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0"
  }
}
```

**packages/ui/tsconfig.json:**
```json
{
  "extends": "@pleeno/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/ui/src/index.ts:**
```typescript
// Placeholder - Shadcn UI components will be added in future stories
```

### 4. Set Up packages/auth

**packages/auth/package.json:**
```json
{
  "name": "@pleeno/auth",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@pleeno/database": "*",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0"
  }
}
```

**packages/auth/tsconfig.json:**
```json
{
  "extends": "@pleeno/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/auth/src/index.ts:**
```typescript
// Placeholder - will be implemented in Story 1.3
```

### 5. Set Up packages/validations

**packages/validations/package.json:**
```json
{
  "name": "@pleeno/validations",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0"
  }
}
```

**packages/validations/tsconfig.json:**
```json
{
  "extends": "@pleeno/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/validations/src/index.ts:**
```typescript
// Placeholder - Zod schemas will be added in future stories
```

### 6. Set Up packages/utils

**packages/utils/package.json:**
```json
{
  "name": "@pleeno/utils",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "date-fns": "4.1.0",
    "date-fns-tz": "^3.1.0"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0"
  }
}
```

**packages/utils/tsconfig.json:**
```json
{
  "extends": "@pleeno/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/utils/src/index.ts:**
```typescript
// Placeholder - Business logic utilities will be added in future stories
```

### 7. Set Up packages/stores

**packages/stores/package.json:**
```json
{
  "name": "@pleeno/stores",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint .",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "zustand": "5.0.8"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.54.0"
  }
}
```

**packages/stores/tsconfig.json:**
```json
{
  "extends": "@pleeno/tsconfig/react.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

**packages/stores/src/index.ts:**
```typescript
// Placeholder - Zustand stores will be added in future stories
```

### 8. Set Up packages/tsconfig

**packages/tsconfig/package.json:**
```json
{
  "name": "@pleeno/tsconfig",
  "version": "0.0.0",
  "private": true
}
```

**packages/tsconfig/base.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "incremental": true,
    "isolatedModules": true
  },
  "exclude": ["node_modules"]
}
```

**packages/tsconfig/react.json:**
```json
{
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "preserve",
    "plugins": [
      {
        "name": "next"
      }
    ]
  }
}
```

### 9. Update Root Turborepo Configuration

Edit `turbo.json` to include the packages:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "lint": {
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "type-check": {
      "outputs": []
    }
  }
}
```

### 10. Install Dependencies

```bash
npm install
```

## Verification Steps

1. **Verify package structure:**
   ```bash
   ls -la packages/
   # Should show: database, ui, auth, validations, utils, stores, tsconfig
   ```

2. **Verify TypeScript compilation:**
   ```bash
   npm run type-check
   # Should complete with no errors
   ```

3. **Test importing a package from a zone:**

   In `apps/shell/app/page.tsx`, add:
   ```typescript
   import '@pleeno/database'
   ```

   Then run:
   ```bash
   npm run build --filter=shell
   # Should build successfully
   ```

## Success Criteria

- [ ] 7 shared packages created in packages/ directory
- [ ] Each package has proper package.json with name, version, dependencies
- [ ] Each package has tsconfig.json extending @pleeno/tsconfig
- [ ] TypeScript compilation succeeds across all packages
- [ ] Packages can be imported from zone apps
- [ ] Root turborepo configuration includes package build pipeline

## Architecture References

- **Source:** docs/architecture.md - Project Structure
- **Source:** docs/architecture.md - Decision Summary (shared package versions)

## Next Task

After completing this task, proceed to **Task 3: Configure Code Quality Tools**
