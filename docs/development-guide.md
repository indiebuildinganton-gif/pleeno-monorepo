# Development Guide

This guide provides detailed information for developing with the Pleeno monorepo, including architecture details, best practices, and advanced workflows.

## Table of Contents

- [Monorepo Architecture](#monorepo-architecture)
- [Working with Zones](#working-with-zones)
- [Working with Shared Packages](#working-with-shared-packages)
- [Working with Supabase](#working-with-supabase)
- [Debugging](#debugging)
- [Performance](#performance)
- [Security](#security)
- [Best Practices](#best-practices)

## Monorepo Architecture

### Turborepo

Turborepo orchestrates builds, caching, and task execution across the monorepo.

#### Key Concepts

- **Workspaces:** Each app and package is a separate workspace with its own `package.json`
- **Pipeline:** Defines task dependencies and execution order in `turbo.json`
- **Caching:** Caches task outputs to speed up repeated builds
- **Remote Caching:** Can share cache across team (optional)

#### turbo.json Structure

```json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "type-check": {}
  }
}
```

#### Filtering Tasks

```bash
# Run task for specific workspace
pnpm build --filter=shell

# Run task for all workspaces in a directory
pnpm build --filter="./apps/*"

# Run task and dependencies
pnpm build --filter=shell...
```

### Multi-Zone Architecture

#### What is Multi-Zone?

Multi-zone is a Next.js architecture pattern where multiple independent Next.js applications work together as a single application.

**Benefits:**
- Independent deployment of features
- Better team autonomy
- Smaller build sizes
- Easier testing and maintenance

**Tradeoffs:**
- Hard navigation between zones (full page reload)
- More complex routing setup
- Shared state requires careful management

#### Zone Structure

**Shell Zone (Port 3000):**
- Main entry point at `/`
- Authentication pages (`/login`, `/signup`)
- Root layout and navigation
- Routing to other zones via rewrites

**Feature Zones (Ports 3001-3005):**
- Independent Next.js applications
- Domain-specific features
- Deployed separately to Vercel
- Accessed via shell rewrites or directly

#### Cross-Zone Navigation

Navigation between zones requires a full page reload:

```typescript
// In any zone
import Link from 'next/link'

// This causes a full page reload when navigating to another zone
<Link href="/agency/settings">Go to Agency Settings</Link>

// Or use window.location
function navigateToPayments() {
  window.location.href = '/payments'
}
```

#### Zone Communication

Zones communicate through:
1. **URL parameters:** Pass data via query strings
2. **Shared state:** Use Zustand stores in `@pleeno/stores`
3. **Local storage:** For persisting user preferences
4. **API calls:** Zones can call shared API endpoints

Example:
```typescript
// In shell zone
import { useAuthStore } from '@pleeno/stores/auth'

const { user } = useAuthStore()

// Navigate to another zone with context
<Link href={`/agency/${user.agencyId}`}>View Agency</Link>
```

## Working with Zones

### Creating a New Zone

1. **Create zone directory:**
```bash
mkdir -p apps/new-zone
cd apps/new-zone
```

2. **Initialize Next.js:**
```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir
```

3. **Update package.json:**
```json
{
  "name": "@pleeno/new-zone",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@pleeno/database": "*",
    "@pleeno/ui": "*",
    "@pleeno/auth": "*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

4. **Add to root package.json:**
```json
{
  "scripts": {
    "dev:new-zone": "cd apps/new-zone && pnpm dev -- --port 3006"
  }
}
```

5. **Update shell rewrites:**

Edit `apps/shell/next.config.ts`:
```javascript
async rewrites() {
  return [
    // ... existing rewrites
    {
      source: '/new-zone/:path*',
      destination: process.env.NODE_ENV === 'development'
        ? 'http://localhost:3006/new-zone/:path*'
        : `${process.env.NEXT_PUBLIC_NEW_ZONE_URL}/new-zone/:path*`
    }
  ]
}
```

### Zone Development Workflow

```bash
# Start all zones
pnpm dev

# Start specific zone
pnpm dev:shell

# Build specific zone
pnpm build --filter=shell

# Lint specific zone
pnpm lint --filter=shell
```

### Zone-Specific Configuration

Each zone has its own:
- **next.config.js:** Next.js configuration
- **tailwind.config.js:** Tailwind CSS configuration
- **tsconfig.json:** TypeScript configuration
- **.env.local:** Environment variables

## Working with Shared Packages

### Package Structure

```
packages/package-name/
├── src/
│   ├── index.ts            # Main export file
│   ├── types.ts            # Type definitions
│   └── ...                 # Implementation files
├── package.json
├── tsconfig.json
└── README.md               # Package documentation
```

### Creating a New Package

1. **Create package directory:**
```bash
mkdir -p packages/new-package/src
cd packages/new-package
```

2. **Create package.json:**
```json
{
  "name": "@pleeno/new-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "lint": "eslint src/",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    // Add dependencies as needed
  }
}
```

3. **Create tsconfig.json:**
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

4. **Create src/index.ts:**
```typescript
export * from './types'
export * from './utils'
```

### Using a Shared Package

In zone `package.json`:
```json
{
  "dependencies": {
    "@pleeno/new-package": "*"
  }
}
```

In zone code:
```typescript
import { myFunction } from '@pleeno/new-package'
```

### Package Best Practices

- **Export types:** Always export types alongside functions
- **Use barrel exports:** Export from `index.ts`
- **Document exports:** Add JSDoc comments
- **Keep packages focused:** Single responsibility
- **Avoid circular dependencies:** Use dependency graph tools

## Working with Supabase

### Local Development

```bash
# Start local Supabase (Docker required)
cd supabase
npx supabase start

# Check status
npx supabase status

# Stop Supabase
npx supabase stop

# Restart (useful after changes)
npx supabase stop && npx supabase start
```

### Database Migrations

#### Creating Migrations

```bash
cd supabase
npx supabase migration new create_feature_table
```

This creates a new migration file in `supabase/migrations/`.

#### Writing Migrations

**Best practices:**
- Use descriptive names
- Include rollback considerations
- Add comments for complex logic
- Test locally before committing

Example migration:
```sql
-- Create agencies table
CREATE TABLE IF NOT EXISTS agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes
CREATE INDEX idx_agencies_subdomain ON agencies(subdomain);

-- Enable RLS
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can view their agency"
  ON agencies FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM agency_users WHERE agency_id = agencies.id
    )
  );
```

#### Applying Migrations

```bash
# Apply all migrations (reset database)
npx supabase db reset

# Or start fresh
npx supabase stop
npx supabase start
```

#### Generating TypeScript Types

After schema changes:
```bash
cd supabase
npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts
```

Add this to your workflow after migrations.

### Database Queries

#### Using Supabase Client

```typescript
import { createServerClient } from '@pleeno/database/server'

// In Server Component or API route
export async function getAgencies() {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('agencies')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
```

#### Client-Side Queries

```typescript
'use client'

import { createClient } from '@pleeno/database/client'
import { useEffect, useState } from 'react'

export function AgenciesList() {
  const [agencies, setAgencies] = useState([])
  const supabase = createClient()

  useEffect(() => {
    async function fetchAgencies() {
      const { data } = await supabase.from('agencies').select('*')
      setAgencies(data || [])
    }
    fetchAgencies()
  }, [])

  return <div>{/* Render agencies */}</div>
}
```

#### Using React Query (Recommended)

```typescript
'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@pleeno/database/client'

export function AgenciesList() {
  const supabase = createClient()

  const { data: agencies, isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: async () => {
      const { data, error } = await supabase.from('agencies').select('*')
      if (error) throw error
      return data
    }
  })

  if (isLoading) return <div>Loading...</div>
  return <div>{/* Render agencies */}</div>
}
```

### Supabase Studio

Access at http://localhost:54323

**Features:**
- **Table Editor:** View and edit data
- **SQL Editor:** Run queries
- **Auth:** Manage users
- **Storage:** Manage files
- **Database:** View schema

### Row-Level Security (RLS)

RLS policies enforce multi-tenancy at the database level.

**Example policy:**
```sql
-- Users can only see their agency's data
CREATE POLICY "tenant_isolation"
  ON students FOR ALL
  USING (
    agency_id IN (
      SELECT agency_id FROM agency_users WHERE user_id = auth.uid()
    )
  );
```

**Testing RLS:**
```sql
-- Run as specific user
SET request.jwt.claims.sub = 'user-uuid';
SELECT * FROM students; -- Should only return user's agency data
```

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev:shell",
      "serverReadyAction": {
        "pattern": "ready on",
        "uriFormat": "http://localhost:3000",
        "action": "openExternally"
      }
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Browser DevTools

- **React DevTools:** Inspect component tree and props
- **Network Tab:** Debug API calls
- **Console:** View errors and logs
- **Application Tab:** Inspect localStorage, cookies, and cache

### Debugging Tips

1. **Use `console.log` strategically:** Log important state changes
2. **Use breakpoints:** In VS Code or browser DevTools
3. **Check Network tab:** Verify API requests and responses
4. **Use React DevTools:** Inspect component props and state
5. **Check Supabase Studio:** Verify database state
6. **Use Error Boundaries:** Catch and display errors gracefully

## Performance

### Bundle Analysis

Analyze bundle size for zones:
```bash
# In zone directory
ANALYZE=true pnpm build
```

This opens a visualization of bundle contents.

### Performance Monitoring

**Core Web Vitals:**
- Largest Contentful Paint (LCP): < 2.5s
- First Input Delay (FID): < 100ms
- Cumulative Layout Shift (CLS): < 0.1

**Monitor in:**
- Vercel Analytics (production)
- Chrome DevTools Lighthouse (development)

### Optimization Strategies

1. **Use Server Components:** Reduce client bundle size
2. **Lazy load components:** Split code with `React.lazy()`
3. **Optimize images:** Use Next.js `<Image>` component
4. **Minimize JavaScript:** Remove unused dependencies
5. **Cache effectively:** Use SWR or React Query
6. **Database indexes:** Add indexes for common queries

### Example Optimizations

```typescript
// Lazy load heavy component
import { lazy, Suspense } from 'react'

const HeavyChart = lazy(() => import('./HeavyChart'))

export function Dashboard() {
  return (
    <Suspense fallback={<div>Loading chart...</div>}>
      <HeavyChart />
    </Suspense>
  )
}

// Optimize images
import Image from 'next/image'

<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  loading="lazy"
/>
```

## Security

### Environment Variables

**Never commit:**
- `.env.local`
- `.env.production.local`
- Any file with secrets

**Use `NEXT_PUBLIC_` prefix only for client-safe values:**
```bash
# ✅ Safe for client
NEXT_PUBLIC_APP_URL=https://app.pleeno.com

# ❌ Never use NEXT_PUBLIC_ for secrets
# NEXT_PUBLIC_API_KEY=secret  # WRONG!

# ✅ Server-only secret
SUPABASE_SERVICE_ROLE_KEY=secret_key
```

### Authentication

**Use Supabase Auth:**
- Built-in security best practices
- Automatic session management
- Secure token handling

**Implement RLS:**
- Enforce multi-tenancy at database level
- Prevent unauthorized data access
- Test RLS policies thoroughly

### API Security

**Validate all inputs:**
```typescript
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email()
})

export async function POST(request: Request) {
  const body = await request.json()
  const validated = schema.parse(body) // Throws if invalid
  // ... proceed with validated data
}
```

**Rate limiting:**
- Implement in API routes
- Use Vercel rate limiting
- Add CAPTCHA for sensitive actions

### Content Security

**Sanitize user input:**
```typescript
import DOMPurify from 'isomorphic-dompurify'

const cleanHTML = DOMPurify.sanitize(userInput)
```

**Prevent XSS:**
- Use React's built-in escaping
- Never use `dangerouslySetInnerHTML` with user content
- Sanitize when necessary

## Best Practices

### Server vs Client Components

**Default to Server Components:**
```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData()
  return <div>{data}</div>
}
```

**Use Client Components for:**
- Event handlers (`onClick`, `onChange`)
- State management (`useState`, `useReducer`)
- Browser APIs (`localStorage`, `window`)
- Third-party libraries with browser dependencies

```typescript
'use client'

export function InteractiveWidget() {
  const [count, setCount] = useState(0)
  return <button onClick={() => setCount(count + 1)}>{count}</button>
}
```

### Data Fetching

**Server Components (Preferred):**
```typescript
export default async function UsersPage() {
  const users = await fetchUsers() // Direct async/await
  return <UserList users={users} />
}
```

**Client Components (When needed):**
```typescript
'use client'

import { useQuery } from '@tanstack/react-query'

export function UsersList() {
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers
  })

  if (isLoading) return <Skeleton />
  return <UserList users={users} />
}
```

### Error Handling

**Error Boundaries:**
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

**Loading States:**
```typescript
// app/loading.tsx
export default function Loading() {
  return <Skeleton />
}
```

### Type Safety

**Leverage TypeScript:**
```typescript
// Define types from database schema
import { Database } from '@pleeno/database/types'

type Agency = Database['public']['Tables']['agencies']['Row']

// Use types in functions
export function formatAgency(agency: Agency): string {
  return agency.name
}
```

### Code Organization

**Feature-based structure:**
```
app/agency/
├── components/
│   ├── AgencyForm.tsx
│   ├── AgencyList.tsx
│   └── AgencyCard.tsx
├── lib/
│   ├── actions.ts          # Server Actions
│   ├── queries.ts          # Data fetching
│   └── validations.ts      # Zod schemas
├── [id]/
│   └── page.tsx            # Agency detail page
└── page.tsx                # Agency list page
```

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Turborepo Documentation](https://turbo.build/repo/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

For questions or clarifications, please refer to the main [README.md](../README.md) or create an issue on GitHub.
