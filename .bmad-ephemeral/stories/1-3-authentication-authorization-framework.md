# Story 1.3: Authentication & Authorization Framework

Status: ready-for-dev

## Story

As a **developer**,
I want **an authentication system with role-based access control**,
so that **users can securely log in and access features based on their roles**.

## Acceptance Criteria

1. **Given** the multi-tenant database schema exists, **When** I implement authentication and authorization, **Then** users can register, log in, and log out securely

2. **And** user sessions are managed with secure JWT tokens or session cookies

3. **And** role-based access control (RBAC) distinguishes between Agency Admin and Agency User roles

4. **And** authentication middleware protects API routes and pages

5. **And** agency_id is automatically set in the security context on login

## Tasks / Subtasks

- [ ] Set up Supabase Auth integration (AC: 1, 2)
  - [ ] Configure Supabase Auth in Next.js environment variables
  - [ ] Install Supabase client libraries (@supabase/supabase-js, @supabase/ssr)
  - [ ] Create shared auth package: `packages/auth/src/`
  - [ ] Implement createServerClient() in packages/database/src/server.ts
  - [ ] Implement createClient() for client-side auth
  - [ ] Configure JWT token handling with HTTP-only cookies

- [ ] Implement user registration flow (AC: 1)
  - [ ] Create signup API route: POST /api/auth/signup
  - [ ] Create signup page: apps/shell/app/(auth)/signup/page.tsx
  - [ ] Validate email format and password strength (Zod schema)
  - [ ] Create user record in users table after auth.users creation
  - [ ] Set initial role (agency_admin for first user, agency_user otherwise)
  - [ ] Send welcome email via Resend (optional for MVP)

- [ ] Implement login/logout flows (AC: 1, 2)
  - [ ] Create login API route: POST /api/auth/login
  - [ ] Create login page: apps/shell/app/(auth)/login/page.tsx
  - [ ] Implement logout API route: POST /api/auth/logout
  - [ ] Handle JWT session creation and storage in HTTP-only cookies
  - [ ] Implement password reset flow: apps/shell/app/(auth)/reset-password/page.tsx
  - [ ] Create useAuth hook in packages/auth/src/hooks/useAuth.ts

- [ ] Implement role-based access control (AC: 3)
  - [ ] Store user role in users table (role ENUM: 'agency_admin', 'agency_user')
  - [ ] Include role in JWT claims via Supabase Auth metadata
  - [ ] Create requireRole() middleware helper
  - [ ] Create hasRole() client-side utility function
  - [ ] Test role-based UI rendering (hide admin-only buttons for agency_user)

- [ ] Implement authentication middleware (AC: 4)
  - [ ] Create middleware.ts in apps/shell/
  - [ ] Validate JWT on protected routes (/dashboard/*, /agency/*, /entities/*, /payments/*, /reports/*)
  - [ ] Redirect unauthenticated users to /login
  - [ ] Refresh expired tokens automatically
  - [ ] Handle cookie updates across multi-zones (shared cookie domain)

- [ ] Implement agency context setting (AC: 5)
  - [ ] Extract agency_id from JWT claims (user.app_metadata.agency_id)
  - [ ] Set PostgreSQL session variable: `SET LOCAL app.current_agency_id`
  - [ ] Create setAgencyContext() function in packages/database/src/middleware.ts
  - [ ] Call setAgencyContext() in server-side data fetching
  - [ ] Verify RLS policies filter correctly by agency_id

- [ ] Create auth UI components (AC: 1)
  - [ ] LoginForm component (packages/ui/src/components/auth/)
  - [ ] SignupForm component
  - [ ] LogoutButton component
  - [ ] PasswordResetForm component
  - [ ] Use React Hook Form + Zod validation
  - [ ] Style with Shadcn UI components (Button, Input, Form)

- [ ] Write authentication test suite (AC: 1, 2, 3, 4)
  - [ ] Test: Successful signup creates user and auth record
  - [ ] Test: Successful login sets JWT cookie
  - [ ] Test: Logout clears JWT cookie
  - [ ] Test: Middleware redirects unauthenticated requests to /login
  - [ ] Test: Agency Admin can access admin-only routes
  - [ ] Test: Agency User cannot access admin-only routes
  - [ ] Test: RLS context is set correctly on authenticated requests
  - [ ] Test: Password reset sends email and updates password

## Dev Notes

### Authentication Architecture

**Supabase Auth Integration:**
- Uses Supabase Auth for user management, JWT generation, and session handling
- JWT tokens stored in HTTP-only cookies for security (not accessible to JavaScript)
- Tokens include user metadata: `{ sub: user_id, email, app_metadata: { agency_id, role } }`
- RLS policies automatically filter data by agency_id from JWT claims

**Authentication Flow:**
1. User submits login (email/password) → Supabase Auth
2. Supabase validates credentials and returns JWT
3. JWT stored in HTTP-only cookie via middleware
4. Middleware validates JWT on protected routes
5. Server Components and API routes use JWT to set RLS context
6. All database queries automatically filtered by user's agency_id

**Role-Based Access Control (RBAC):**
- Two roles: `agency_admin` and `agency_user`
- Roles stored in `users.role` column (ENUM type)
- Role included in JWT `app_metadata.role`
- Server-side checks via `requireRole()` middleware
- Client-side checks via `hasRole()` utility (UI rendering only, not security)

**Agency Context Propagation:**
```typescript
// JWT Claims Structure
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "app_metadata": {
    "agency_id": "agency-uuid",
    "role": "agency_admin"
  }
}

// Setting RLS Context (packages/database/src/middleware.ts)
export async function setAgencyContext(supabase: SupabaseClient) {
  const { data: { session } } = await supabase.auth.getSession();

  if (session?.user) {
    const agencyId = session.user.app_metadata.agency_id;

    // Set PostgreSQL session variable for RLS
    await supabase.rpc('set_agency_context');
  }
}
```

### Project Structure

**Auth Package Location:**
```
pleeno-monorepo/
└── packages/
    └── auth/
        ├── src/
        │   ├── hooks/
        │   │   └── useAuth.ts          # Client-side auth hook
        │   ├── utils/
        │   │   ├── session.ts          # Session helpers
        │   │   └── permissions.ts      # hasRole(), requireRole()
        │   └── index.ts
        └── package.json
```

**Auth Pages Location (Shell Zone):**
```
apps/shell/
├── app/
│   ├── (auth)/                          # Auth route group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── reset-password/
│   │       └── page.tsx
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Redirect to /dashboard
└── middleware.ts                        # Auth + zone routing middleware
```

**Middleware Configuration:**
```typescript
// apps/shell/middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/agency/:path*',
    '/entities/:path*',
    '/payments/:path*',
    '/reports/:path*'
  ]
}
```

### Architecture Alignment

**From Architecture Document (architecture.md):**

**Authentication Pattern (Section: Authentication Pattern):**
- Uses @supabase/ssr for Server Components integration
- Middleware validates JWT and refreshes tokens
- Cookies shared across multi-zones via same domain
- Direct integration with RLS via auth.uid()

**Supabase Client Setup (from architecture.md):**
```typescript
// packages/database/src/server.ts
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
      },
    }
  )
}
```

**Middleware Implementation (from architecture.md):**
```typescript
// apps/shell/middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}
```

**Database Schema (from Story 1.2):**
```sql
-- users table already created in Story 1.2
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('agency_admin', 'agency_user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Integration:**
- Story 1.2 established RLS policies using agency_id
- This story connects auth.users (Supabase Auth) to public.users (app data)
- JWT includes agency_id in app_metadata
- RLS policies reference auth.uid() to get current user
- Agency context automatically set via JWT claims

### Learnings from Previous Story

**From Story 1.2 (Status: ready-for-dev)**

Story 1.2 has not yet been implemented, but it establishes critical dependencies for this story:

**Expected Outputs from Story 1.2:**
- **Database schema:** agencies and users tables created with RLS policies
- **RLS policies:** Agency isolation enforced at database level
- **Context mechanism:** set_agency_context() database function ready
- **Migration structure:** Domain-driven migrations in supabase/migrations/001_agency_domain/

**Integration Points:**
- This story extends Story 1.2 by connecting Supabase Auth (auth.users) to application users table (public.users)
- User registration flow creates records in both auth.users and public.users
- JWT claims from Supabase Auth drive RLS context setting
- Middleware uses RLS policies created in Story 1.2

**Validation Before Starting:**
- Confirm Story 1.2 is complete:
  - [ ] agencies table exists
  - [ ] users table exists with role column
  - [ ] RLS policies enabled on both tables
  - [ ] set_agency_context() database function exists
- Verify Supabase local instance running: `npx supabase status`
- Verify database migrations applied: Check supabase/migrations/001_agency_domain/

**Key Dependencies:**
- **Database:** users table with agency_id FK, role column
- **RLS:** Policies filter by agency_id from current_setting('app.current_agency_id')
- **Functions:** set_agency_context() to propagate JWT claims to RLS
- **Shared packages:** packages/database with createServerClient() method

**What This Story Adds:**
- Connects Supabase Auth layer to application data layer
- Implements registration/login/logout flows
- Creates middleware to protect routes
- Adds role-based authorization on top of RLS tenant isolation
- Provides auth hooks and utilities for UI components

[Source: .bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md]

### Prerequisites Validation

**Dependency on Story 1.2:**
- Requires: agencies and users tables with RLS policies
- Requires: set_agency_context() database function
- Requires: Supabase local instance running
- Verify: `npx supabase db reset` successful with all migrations applied

### Security Considerations

**Authentication Security:**
- **Passwords:** Hashed by Supabase Auth (bcrypt)
- **Sessions:** JWT tokens in HTTP-only cookies (XSS protection)
- **Token Refresh:** Automatic refresh via middleware
- **CSRF Protection:** Supabase handles token validation

**Authorization Security:**
- **Role Enforcement:** Checked server-side in middleware and API routes
- **Client-side Checks:** UI rendering only (not security boundary)
- **Admin Actions:** Require role='agency_admin' check
- **RLS Integration:** Agency isolation happens at database level (Story 1.2)

**Multi-Tenant Security:**
- **Agency Isolation:** RLS policies filter all data by agency_id
- **Context Setting:** JWT app_metadata.agency_id → PostgreSQL session variable
- **Bypass Prevention:** Cannot query other agencies' data (RLS enforced)

### Testing Strategy

**Authentication Tests:**
1. **Signup Flow:**
   - Valid signup creates auth.users record
   - Valid signup creates public.users record with agency_id
   - Duplicate email prevented
   - Weak password rejected

2. **Login Flow:**
   - Valid credentials return JWT
   - Invalid credentials return error
   - JWT stored in HTTP-only cookie
   - JWT includes agency_id and role in app_metadata

3. **Logout Flow:**
   - Logout clears JWT cookie
   - Subsequent requests redirected to /login

4. **Password Reset:**
   - Reset email sent to valid email address
   - Reset token expires after 1 hour
   - Password successfully updated

**Authorization Tests:**
1. **Middleware Protection:**
   - Unauthenticated request to /dashboard → redirect to /login
   - Authenticated request to /dashboard → allowed
   - Protected routes: /dashboard, /agency, /entities, /payments, /reports

2. **Role-Based Access:**
   - Agency Admin can access /agency/users (user management)
   - Agency User cannot access /agency/users (403 Forbidden)
   - hasRole() returns correct boolean for client-side rendering

3. **Agency Context:**
   - RLS context set correctly after login
   - User A cannot query User B's data (different agencies)
   - All queries automatically filtered by agency_id

### References

- [Source: docs/epics.md#Story-1.3-Authentication-&-Authorization-Framework]
- [Source: docs/architecture.md#Authentication-Pattern - Supabase Auth setup]
- [Source: docs/architecture.md#Middleware - Auth middleware implementation]
- [Source: docs/architecture.md#Security-Architecture - Multi-tenant isolation]
- [Source: docs/architecture.md#Authorization-Levels - Role definitions]
- [Source: docs/PRD.md#Security-Considerations - Authentication requirements]
- [Source: .bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md - Database schema and RLS foundation]

## Dev Agent Record

### Context Reference

- [1-3-authentication-authorization-framework.context.xml](.bmad-ephemeral/stories/1-3-authentication-authorization-framework.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
