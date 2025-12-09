# Environment Variables

This document describes all environment variables used in the Pleeno application.

## Setup Instructions

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the actual values in `.env.local`

3. **Never commit `.env.local` or any file containing real credentials**

## Local Development Variables

### Supabase Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase API URL (http://localhost:54321 for local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key (from `npx supabase status`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (from `npx supabase status`) - **NEVER expose to client** |
| `DATABASE_URL` | Yes | Direct PostgreSQL connection string (for migrations only) |

### Application Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL (http://localhost:3000 for local) |
| `NODE_ENV` | Yes | Environment: development, production, test |

### Multi-Zone Configuration

The Pleeno app uses a multi-zone architecture where different sections run on different subdomains/ports. The redirect behavior is **environment-aware** and automatically adjusts based on `NODE_ENV`.

#### Development (Local Testing)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NEXT_PUBLIC_SHELL_URL` | No | `http://localhost:3005` | Shell (auth) app URL |
| `NEXT_PUBLIC_DASHBOARD_URL` | No | `http://localhost:3002` | Dashboard app URL |
| `NEXT_PUBLIC_AGENCY_URL` | No | `http://localhost:3004` | Agency management app URL |
| `NEXT_PUBLIC_ENTITIES_URL` | No | `http://localhost:3001` | Entities app URL |
| `NEXT_PUBLIC_PAYMENTS_URL` | No | `http://localhost:3003` | Payments app URL |
| `NEXT_PUBLIC_REPORTS_URL` | No | `http://localhost:3000` | Reports app URL |

**Important**: In development mode (`NODE_ENV=development` or when `NEXT_PUBLIC_APP_URL` contains `localhost`), the app automatically uses localhost URLs with the default ports above. You don't need to set these unless you're using different ports.

**Port Assignment Reference**: Shell=3005, Dashboard=3002, Entities=3001, Payments=3003, Agency=3004, Reports=3000

#### Production (Vercel/Custom Domain)

In production mode (`NODE_ENV=production`), set these to your actual production URLs:

```bash
NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.plenno.com.au
NEXT_PUBLIC_AGENCY_URL=https://agency.plenno.com.au
NEXT_PUBLIC_ENTITIES_URL=https://entities.plenno.com.au
NEXT_PUBLIC_PAYMENTS_URL=https://payments.plenno.com.au
NEXT_PUBLIC_REPORTS_URL=https://reports.plenno.com.au
```

#### How It Works

The [multi-zone-redirect.ts](../apps/shell/lib/multi-zone-redirect.ts) utility automatically detects the environment and uses appropriate URLs:

- **Local Development**: When you login at `http://localhost:3005/login` (shell app on port 3005), you'll be redirected to `http://localhost:3002` (dashboard) or the appropriate local port.
- **Production**: When you login at `https://shell.plenno.com.au/login`, you'll be redirected to `https://dashboard.plenno.com.au`.

No manual configuration needed for local testing - just run `pnpm run dev` and everything works!

### Third-Party Services

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | No | Resend API key for sending emails (optional for local dev) |

### Feature Flags

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | No | Enable/disable analytics tracking (default: false) |

## Production Variables

Production environment variables will be configured in Vercel/Railway dashboard:

1. Go to your project settings in Vercel/Railway
2. Navigate to Environment Variables section
3. Add all variables from `.env.example` with production values
4. Use production Supabase project URL and keys (not localhost)

### Production Supabase Setup

1. Create a Supabase project at https://app.supabase.com
2. Get your project URL and keys from Project Settings > API
3. Configure production environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
   - `DATABASE_URL`: Your database connection string

## Security Best Practices

1. **Never commit real credentials** - Use `.env.local` for local development
2. **Use `NEXT_PUBLIC_` prefix carefully** - Only for client-safe values
3. **Keep service role key secret** - Never expose to client-side code
4. **Rotate keys regularly** - Especially after team member changes
5. **Use different keys per environment** - Never reuse production keys in development

## Getting Supabase Credentials

### Local Development

Run in your terminal:
```bash
cd supabase
npx supabase start
npx supabase status
```

Copy the values shown for:
- API URL
- Anon key
- Service role key
- DB URL

### Production

1. Log in to https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy your Project URL and API keys

## Environment Variable Loading

Next.js loads environment variables in the following order:

1. `.env.local` (loaded in all environments, ignored by git)
2. `.env.development` (when NODE_ENV=development)
3. `.env.production` (when NODE_ENV=production)
4. `.env` (all environments, should only contain non-sensitive defaults)

Variables prefixed with `NEXT_PUBLIC_` are:
- Embedded into the browser bundle at build time
- Available on both client and server
- **Should only contain client-safe values**

Variables without `NEXT_PUBLIC_` prefix are:
- Only available on the server side
- Never exposed to the browser
- **Safe for sensitive credentials like service role keys**

## Troubleshooting

**Issue:** "Supabase client is not configured"
- **Solution:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

**Issue:** "Database connection failed"
- **Solution:** Ensure Supabase is running with `npx supabase status`

**Issue:** Environment variables not loading
- **Solution:** Restart the Next.js dev server after changing `.env.local`

**Issue:** Variables work in dev but not in production
- **Solution:** Ensure all required variables are set in your hosting platform's environment variables dashboard

**Issue:** Service role key exposed to client
- **Solution:** Never use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY`. Check browser network tab to verify it's not being sent to client.

## Adding New Environment Variables

When adding new environment variables:

1. Add to `.env.example` with placeholder value
2. Add to `.env.local` with actual value (for local testing)
3. Document in this file with description and security notes
4. Add to production environment in hosting platform
5. If client-safe, use `NEXT_PUBLIC_` prefix
6. Update type definitions if using typed env variables

## Example Configuration

### Local Development (.env.local)

```bash
# Supabase (from npx supabase status)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Optional services
RESEND_API_KEY=

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### Production (Vercel Environment Variables)

```bash
# Supabase (from https://app.supabase.com)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# Application
NEXT_PUBLIC_APP_URL=https://pleeno.com
NODE_ENV=production

# Services
RESEND_API_KEY=re_xxxxxxxxxxxx

# Feature flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```
