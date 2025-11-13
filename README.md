# Pleeno - Student Payment Plan Management System

[![CI](https://github.com/rajkrajpj/pleeno/workflows/CI/badge.svg)](https://github.com/rajkrajpj/pleeno/actions/workflows/ci.yml)
[![Deploy](https://github.com/rajkrajpj/pleeno/workflows/Deploy/badge.svg)](https://github.com/rajkrajpj/pleeno/actions/workflows/deploy.yml)

A modern multi-tenant B2B SaaS platform for education agencies to manage student payment plans, commissions, and college relationships.

## Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Shadcn UI
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** Zustand, TanStack Query
- **Monorepo:** Turborepo with pnpm workspaces
- **Architecture:** Multi-zone microfrontends

## Project Structure

```
pleeno-monorepo/
├── apps/               # Next.js applications (zones)
│   ├── shell/         # Main entry + auth pages
│   ├── dashboard/     # Dashboard zone
│   ├── agency/        # Agency & user management
│   ├── entities/      # Colleges & students
│   ├── payments/      # Payment plans
│   └── reports/       # Reporting zone
├── packages/          # Shared packages
│   ├── database/      # Supabase client & types
│   ├── auth/          # Auth utilities & hooks
│   ├── ui/            # Shared UI components
│   ├── validations/   # Zod schemas
│   ├── utils/         # Business logic utilities
│   └── stores/        # Zustand stores
└── supabase/          # Database migrations & functions
```

## Prerequisites

- Node.js 18.x or later
- pnpm 9.x or later
- Docker (for local Supabase development)
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/pleeno-monorepo.git
cd pleeno-monorepo
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in Supabase credentials (see step 4 below).

> 📚 For detailed environment variable documentation, see [docs/environment-variables.md](docs/environment-variables.md)

### 4. Start local Supabase

Start the local Supabase instance:

```bash
cd supabase
npx supabase start
```

Get your Supabase credentials:

```bash
npx supabase status
```

Copy the following values into your `.env.local`:
- **API URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **Anon key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Service role key** → `SUPABASE_SERVICE_ROLE_KEY`

Return to the project root:

```bash
cd ..
```

### 5. Run development server

Start all development servers:

```bash
pnpm dev
```

This will start all zones:

- **Shell:** http://localhost:3000
- **Dashboard:** http://localhost:3001
- **Agency:** http://localhost:3002
- **Entities:** http://localhost:3003
- **Payments:** http://localhost:3004
- **Reports:** http://localhost:3005
- **Supabase Studio:** http://localhost:54323

### 6. Verify setup

Check that environment variables are loaded correctly:

```bash
curl http://localhost:3000/api/health
```

Should return all Supabase values as "configured".

## Package Structure

### @pleeno/database

Supabase client setup for server-side and client-side usage.

```typescript
import { createServerClient } from '@pleeno/database/server'
import { createClient } from '@pleeno/database/client'
```

### @pleeno/auth

Authentication utilities and hooks.

```typescript
import { useAuth } from '@pleeno/auth'
```

## Development Workflow

### Working with packages

```bash
# Work on a specific package
cd packages/database
pnpm dev

# Run tests
pnpm test

# Type checking
pnpm type-check
```

### Database migrations

```bash
# Create a new migration
npx supabase migration new migration_name

# Apply migrations
npx supabase db reset

# Generate TypeScript types
npx supabase gen types typescript --local > packages/database/src/types/database.types.ts
```

## Documentation

- [Architecture Documentation](docs/architecture.md)
- [Product Requirements Document](docs/PRD.md)
- [Epic Breakdown](docs/epics.md)
- [Environment Variables](docs/environment-variables.md)

## License

Private and confidential. All rights reserved.
