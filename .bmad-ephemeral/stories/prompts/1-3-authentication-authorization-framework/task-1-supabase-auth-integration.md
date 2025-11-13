# Task 1: Set up Supabase Auth Integration

## Story Context
**Story 1.3**: Authentication & Authorization Framework
**As a** developer, **I want** an authentication system with role-based access control, **so that** users can securely log in and access features based on their roles.

## Task Objective
Set up Supabase Auth integration with Next.js, including environment configuration, client libraries, and JWT token handling.

## Acceptance Criteria Addressed
- AC 1: Users can register, log in, and log out securely
- AC 2: User sessions managed with secure JWT tokens

## Subtasks
- [ ] Configure Supabase Auth in Next.js environment variables
- [ ] Install Supabase client libraries (@supabase/supabase-js, @supabase/ssr)
- [ ] Create shared auth package: packages/auth/src/
- [ ] Implement createServerClient() in packages/database/src/server.ts
- [ ] Implement createClient() for client-side auth
- [ ] Configure JWT token handling with HTTP-only cookies

## Implementation Guide

### 1. Environment Configuration
Create/update `.env.local` files with Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Install Dependencies
```bash
# From project root
pnpm add @supabase/supabase-js @supabase/ssr
```

### 3. Create Auth Package Structure
```
packages/auth/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts
    ├── hooks/
    │   └── useAuth.ts (placeholder for later task)
    └── utils/
        └── permissions.ts (placeholder for later task)
```

### 4. Implement Server Client (packages/database/src/server.ts)
```typescript
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

### 5. Implement Client-Side Client (packages/database/src/client.ts)
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

## Architecture Context
- Uses Turborepo monorepo structure
- Shared database package for client setup
- Separate auth package for authentication utilities
- JWT tokens stored in HTTP-only cookies for XSS protection

## References
- [Architecture: Authentication Pattern](docs/architecture.md#authentication-pattern)
- [Architecture: Project Structure](docs/architecture.md#project-structure)
- Context XML: `.bmad-ephemeral/stories/1-3-authentication-authorization-framework.context.xml`

## Validation
- [ ] Environment variables are set correctly
- [ ] Supabase client libraries installed in correct packages
- [ ] createServerClient() returns valid Supabase client
- [ ] createClient() returns valid browser client
- [ ] HTTP-only cookies configured properly
- [ ] No TypeScript errors in new packages

## Next Steps
After completing this task, proceed to Task 2: Implement User Registration Flow.
