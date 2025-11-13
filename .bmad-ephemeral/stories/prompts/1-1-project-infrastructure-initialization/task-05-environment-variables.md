# Task 5: Configure Environment Variables

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 4

## Objective

Set up environment variable templates and local configuration files for development and production environments.

## Context

Environment variables store sensitive configuration like database credentials and API keys. This task creates template files for team members and sets up local development configuration.

## Prerequisites

- Task 4 completed (Supabase setup with connection details)
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Create Root .env.example

Create `.env.example` at the monorepo root:

```bash
# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Database (Direct Connection - for migrations only)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Email (Resend)
RESEND_API_KEY=your-resend-api-key-here

# Feature Flags (Future use)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 2. Create Root .env.local

Create `.env.local` at the monorepo root with actual values from Supabase:

```bash
# Get these values from: npx supabase status
# Or from the output when you ran: npx supabase start

# Supabase Configuration (Local Development)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-actual-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<paste-actual-service-role-key>

# Database (Direct Connection - for migrations only)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Email (Resend) - Leave empty for local development
RESEND_API_KEY=

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

### 3. Update .gitignore

Ensure `.gitignore` at the root includes:

```
# Environment variables
.env
.env*.local
.env.local
.env.development.local
.env.test.local
.env.production.local

# Dependencies
node_modules/
.pnp
.pnp.js

# Next.js
.next/
out/
build/
dist/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Supabase
supabase/.branches
supabase/.temp

# IDE
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Misc
*.tsbuildinfo
```

### 4. Create Environment Variable Documentation

Create `docs/environment-variables.md`:

```markdown
# Environment Variables

This document describes all environment variables used in the Pleeno application.

## Setup Instructions

1. Copy `.env.example` to `.env.local`:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

2. Fill in the actual values in `.env.local`

3. **Never commit `.env.local` or any file containing real credentials**

## Local Development Variables

### Supabase Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase API URL (http://localhost:54321 for local) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public key (from \`npx supabase status\`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (from \`npx supabase status\`) - **NEVER expose to client** |
| `DATABASE_URL` | Yes | Direct PostgreSQL connection string (for migrations only) |

### Application Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | Yes | Application base URL (http://localhost:3000 for local) |
| `NODE_ENV` | Yes | Environment: development, production, test |

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
\`\`\`bash
cd supabase
npx supabase status
\`\`\`

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

## Troubleshooting

**Issue:** "Supabase client is not configured"
- **Solution:** Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set in `.env.local`

**Issue:** "Database connection failed"
- **Solution:** Ensure Supabase is running with `npx supabase status`

**Issue:** Environment variables not loading
- **Solution:** Restart the Next.js dev server after changing `.env.local`
```

### 5. Create README Section for Environment Setup

Add to root `README.md` (or create if doesn't exist):

```markdown
# Pleeno - Agency Management SaaS

## Getting Started

### Prerequisites

- Node.js 18+
- Docker Desktop (for local Supabase)
- npm

### Installation

1. Clone the repository:
   \`\`\`bash
   git clone <repository-url>
   cd pleeno-monorepo
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Set up environment variables:
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`

4. Edit `.env.local` and fill in Supabase credentials (see below)

5. Start Supabase:
   \`\`\`bash
   cd supabase
   npx supabase start
   cd ..
   \`\`\`

6. Get Supabase credentials:
   \`\`\`bash
   cd supabase
   npx supabase status
   \`\`\`

   Copy the API URL, Anon Key, and Service Role Key into your `.env.local`

7. Start all development servers:
   \`\`\`bash
   npm run dev
   \`\`\`

8. Open your browser:
   - Shell: http://localhost:3000
   - Dashboard: http://localhost:3001
   - Agency: http://localhost:3002
   - Entities: http://localhost:3003
   - Payments: http://localhost:3004
   - Reports: http://localhost:3005
   - Supabase Studio: http://localhost:54323

### Environment Variables

See [docs/environment-variables.md](docs/environment-variables.md) for detailed documentation.

Quick setup:
1. Copy `.env.example` to `.env.local`
2. Run `cd supabase && npx supabase status` to get credentials
3. Paste credentials into `.env.local`
```

### 6. Verify Environment Variables Load Correctly

Create a test file `apps/shell/app/api/health/route.ts`:

```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasServiceRoleKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY

  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    supabase: {
      url: hasSupabaseUrl ? 'configured' : 'missing',
      anonKey: hasSupabaseAnonKey ? 'configured' : 'missing',
      serviceRoleKey: hasServiceRoleKey ? 'configured' : 'missing',
    },
  })
}
```

Test it:

```bash
npm run dev:shell
# In another terminal:
curl http://localhost:3000/api/health
# Should show all values as "configured"
```

## Verification Steps

1. **Verify .env.example exists and has no real values:**
   ```bash
   cat .env.example
   # Should contain placeholder values only
   ```

2. **Verify .env.local exists with real values:**
   ```bash
   cat .env.local
   # Should contain actual Supabase keys
   ```

3. **Verify .env.local is in .gitignore:**
   ```bash
   git status
   # .env.local should NOT appear in untracked files
   ```

4. **Verify environment variables load in app:**
   ```bash
   npm run dev:shell
   curl http://localhost:3000/api/health
   # Should show all supabase values as "configured"
   ```

5. **Verify documentation exists:**
   ```bash
   cat docs/environment-variables.md
   # Should contain complete documentation
   ```

## Success Criteria

- [ ] `.env.example` created with placeholder values
- [ ] `.env.local` created with actual Supabase credentials
- [ ] `.gitignore` prevents committing `.env.local`
- [ ] `docs/environment-variables.md` documents all variables
- [ ] README.md includes environment setup instructions
- [ ] Health check API route confirms variables load correctly
- [ ] Team members can follow documentation to set up environment

## Security Checklist

- [ ] No real credentials in `.env.example`
- [ ] `.env.local` in `.gitignore`
- [ ] Service role key marked as secret (never client-side)
- [ ] Documentation warns against committing credentials
- [ ] `NEXT_PUBLIC_` prefix only used for client-safe values

## Architecture References

- **Source:** docs/architecture.md - Development Environment setup

## Next Task

After completing this task, proceed to **Task 6: Set Up Deployment Environment**
