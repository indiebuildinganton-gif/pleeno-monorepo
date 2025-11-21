# Dashboard Zone

Dashboard and analytics zone for the Pleeno multi-zone Next.js application.

## Development

### Running the Dashboard Zone

```bash
# From project root
pnpm dev
```

### Accessing the Dashboard

You can access the dashboard in two ways:

**Option 1: Through Shell Zone**
- URL: **http://localhost:3005/dashboard**
- Use this for: Navigation across multiple zones, consistent routing

**Option 2: Direct Access**
- URL: **http://localhost:3002/dashboard**
- Use this for: Faster iteration when working on dashboard features

**Both methods work!** Authentication cookies are automatically shared across all localhost ports in development via the `domain: 'localhost'` cookie setting.

### Authentication

The dashboard zone requires authentication for all routes. The middleware handles:
- JWT token validation and refresh
- Redirects to login for unauthenticated users
- Session management via HTTP-only cookies

API routes use the `requireRole()` middleware from `@pleeno/auth/server` for server-side authorization.

## Production

In production, all zones are deployed separately and accessed through a unified domain. The cookie domain is set to allow cross-zone cookie sharing (e.g., `.pleeno.com`).

## Architecture

This zone is part of a multi-zone Next.js architecture with:
- **Base Path:** `/dashboard`
- **Port (Dev):** 3002
- **Auth:** Supabase Auth with JWT tokens
- **Database:** Shared Supabase PostgreSQL with RLS

See the main [README.md](../../README.md) for complete architecture documentation.
