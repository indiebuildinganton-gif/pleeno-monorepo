# Dashboard API Authentication Issue Report

## 1. Executive Summary
The dashboard application (`apps/dashboard`) is experiencing a critical authentication failure where all API requests to endpoints under `/dashboard/api/...` return **401 Unauthorized**. This prevents widgets from loading data, despite the user being authenticated on the frontend and the database being correctly seeded. The issue appears to be rooted in the server-side validation of the authentication session within the micro-frontend architecture.

## 2. Architecture & Context
The project utilizes a **Micro-Frontend / Multi-Zone Architecture** within a Turborepo monorepo. This complexity is central to the authentication challenges.

### Micro-Frontend Setup
- **Shell Application** (`apps/shell`): Runs on **Port 3005**. Acts as the main entry point and likely orchestrates the user experience.
- **Dashboard Application** (`apps/dashboard`): Runs on **Port 3002**. This is the specific zone experiencing the issue.
- **Shared Infrastructure**:
    - **Packages**: `@pleeno/auth` and `@pleeno/database` provide shared logic for authentication and database connections across all apps.
    - **Supabase**: A single Supabase project serves all applications.

### Authentication Flow
- **Shared Session**: Authentication is managed via Supabase Auth using HTTP-only cookies.
- **Cross-Port Sharing**: To allow a user logged in via the Shell (or other apps) to access the Dashboard, cookies are configured with `domain: 'localhost'` in development. This theoretically allows cookies set on `localhost:3005` to be readable by `localhost:3002`.
- **Middleware Responsibility**: Each Next.js application (zone) has its own `middleware.ts` responsible for:
    1.  Reading the shared cookie.
    2.  Validating the session with Supabase.
    3.  Refreshing the session (and rotating the refresh token) if needed.
    4.  Updating the response cookies to persist the refreshed session.

### Routing Specifics
- **Base Path**: The Dashboard app is configured with `basePath: '/dashboard'`.
- **API Routes**: Consequently, API routes are served at `/dashboard/api/...`.
- **Middleware Matcher**: The middleware is configured to run on `/dashboard/...` routes, including the API routes.

## 3. Problem Description
Despite the user having a valid session on the frontend (widgets render, page navigation works), **server-side API calls fail**:
- **Endpoint**: `/dashboard/api/kpis`, `/dashboard/api/overdue-payments`, etc.
- **Status**: **401 Unauthorized**.
- **Impact**: All dashboard widgets show error states or skeletons.
- **Observation**: The browser sends the request to `localhost:3002/dashboard/api/...`. The 401 response comes from the API route handler's `requireRole` check.

## 4. Investigation & Findings

### Hypothesis A: Token Refresh Race Condition (Micro-Frontend Specific)
**Theory**: In a multi-app setup, if the Shell and Dashboard both try to refresh the token, or if the Dashboard middleware refreshes the token but the API route (running in the same request) sees the old token, a race condition occurs.
- **Scenario**: Middleware on Port 3002 receives a request. It sees an expired access token. It uses the refresh token to get a new session. It sets the *new* token in the response cookies.
- **Failure**: The API Route handler (running after middleware) reads the *request* cookies. It sees the *old* (expired) access token. It tries to validate it via `supabase.auth.getUser()`. This fails because the token is expired, and the refresh token (which was just used by the middleware) might now be invalid (if reuse detection is on).
- **Test**: We attempted to disable middleware auth for API routes to let the API route handle the refresh alone. This failed, suggesting the API route couldn't validate the session even independently.

### Hypothesis B: Cross-Port Cookie Visibility
**Theory**: The `cookies()` function from `next/headers` (used by `createServerClient`) might not be correctly resolving the `localhost` domain cookies when running on a specific port (3002), or there's a mismatch in how the cookie path is handled with the `/dashboard` base path.
- **Test**: We modified `requireRole` to read cookies directly from the `NextRequest` object, bypassing Next.js headers abstraction. This also failed to resolve the 401s.

### Hypothesis C: Environment & Configuration
**Theory**: The `packages/auth` or `packages/database` shared modules might be missing necessary environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `ANON_KEY`) when executed in the context of the Dashboard app, causing the Supabase client to be misconfigured.

## 5. Potential Root Causes
1.  **Cookie Domain/Port Isolation**: Browsers generally share cookies across ports for `localhost`, but subtle configuration differences (e.g., `SameSite` policies, `secure` flags) combined with the `basePath` might be causing the cookie to be dropped or ignored by the server.
2.  **Middleware vs. API Route Context**: The way Next.js App Router handles cookies in API routes vs. Middleware in a multi-zone setup is complex. The API route might be receiving a stripped request context.
3.  **Supabase Client Mismatch**: The shared `createServerClient` utility might need specific adjustments to handle the multi-zone cookie sharing correctly (e.g., explicitly setting the cookie domain in the server client configuration).

## 6. Recommendations for Deep Research
1.  **Server-Side Logging**: Enable verbose logging in `packages/auth/src/utils/permissions.ts` to see exactly what cookies the server is receiving. This is the "smoking gun" we are missing.
2.  **Audit Cookie Attributes**: Inspect the specific attributes of the `sb-access-token` cookie in the browser (Domain, Path, Secure, SameSite) to ensure they are compatible with cross-port requests.
3.  **Verify Environment Variables**: Ensure `.env` files are correctly loaded for the Dashboard app and accessible to the shared packages.
4.  **Test Without BasePath**: Temporarily remove `basePath: '/dashboard'` to see if the issue is routing-related.
