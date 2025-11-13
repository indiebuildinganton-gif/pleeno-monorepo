# Task 9: Document Setup Instructions

**Story:** 1.1 - Project Infrastructure Initialization
**Task ID:** 9 of 9
**Acceptance Criteria:** AC 3

## Objective

Create comprehensive README documentation with setup instructions, architecture overview, and troubleshooting guide for developers.

## Context

Good documentation ensures any developer can clone, install, and run the project. This is critical for onboarding and team collaboration.

## Tasks

### 1. Create Root README.md

**Create or update `README.md` at monorepo root:**

```markdown
# Pleeno - Multi-Agency Student Recruitment Platform

[![CI](https://github.com/your-org/pleeno/actions/workflows/ci.yml/badge.svg)](https://github.com/your-org/pleeno/actions/workflows/ci.yml)

Multi-tenant platform for international student recruitment agencies to manage students, colleges, applications, and payments with automated commission tracking.

## Architecture

This project uses a **Turborepo monorepo** with **multi-zone Next.js architecture**:

- **6 independent Next.js zones** for domain isolation
- **Shell app** handles routing and authentication
- **Shared packages** for code reuse across zones
- **PostgreSQL via Supabase** with Row-Level Security for multi-tenancy

### Zones

- **shell** (port 3000): Main entry, routing, authentication
- **dashboard** (port 3001, `/dashboard`): Analytics and overview
- **agency** (port 3002, `/agency`): Agency settings and team management
- **entities** (port 3003, `/entities`): Students, colleges, applications
- **payments** (port 3004, `/payments`): Invoices, transactions, commissions
- **reports** (port 3005, `/reports`): BI reports and exports

## Prerequisites

- **Node.js** 20.x or later
- **npm** 10.x or later
- **Docker Desktop** (for local Supabase)
- **Git**

## Getting Started

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-org/pleeno.git
cd pleeno
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This installs dependencies for all zones and packages using npm workspaces.

### 3. Set Up Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

Update `.env.local` with your credentials:

- **Supabase keys**: Run `npx supabase start` (step 4) and copy keys from output
- **Session secret**: Generate with `openssl rand -base64 32`

### 4. Start Supabase (Requires Docker)

\`\`\`bash
cd supabase
npx supabase start
\`\`\`

**First time setup:**
- Downloads Docker images (~2GB)
- Starts PostgreSQL and Supabase services
- Outputs connection details and keys

**Copy the keys from output to `.env.local`:**
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Access Supabase Studio:** `http://localhost:54323`

### 5. Run Development Servers

\`\`\`bash
cd ..  # Back to monorepo root
npm run dev
\`\`\`

This starts all 6 zones on different ports:
- Shell: http://localhost:3000
- Dashboard: http://localhost:3001/dashboard
- Agency: http://localhost:3002/agency
- Entities: http://localhost:3003/entities
- Payments: http://localhost:3004/payments
- Reports: http://localhost:3005/reports

**Visit:** http://localhost:3000

## Project Structure

\`\`\`
pleeno/
├── apps/
│   ├── shell/                    # Main entry & routing (port 3000)
│   ├── dashboard/                # Dashboard zone (port 3001)
│   ├── agency/                   # Agency zone (port 3002)
│   ├── entities/                 # Entities zone (port 3003)
│   ├── payments/                 # Payments zone (port 3004)
│   └── reports/                  # Reports zone (port 3005)
│
├── packages/
│   ├── database/                 # Supabase client & types
│   ├── ui/                       # Shared UI components
│   ├── auth/                     # Auth utilities
│   ├── validations/              # Zod schemas
│   ├── utils/                    # Business logic
│   ├── stores/                   # Zustand stores
│   └── tsconfig/                 # Shared TS configs
│
├── supabase/
│   ├── migrations/               # Database migrations
│   ├── functions/                # Edge Functions
│   └── config.toml
│
├── turbo.json                    # Turborepo config
└── package.json                  # Root package.json
\`\`\`

## Common Commands

\`\`\`bash
# Development
npm run dev              # Start all zones in dev mode
npm run build            # Build all zones for production
npm run lint             # Run ESLint on all zones
npm run format           # Format code with Prettier

# Database
cd supabase
npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npx supabase db reset    # Reset database (destructive)
npx supabase status      # Check Supabase status

# Deployment
vercel --prod            # Deploy to production
\`\`\`

## Environment Variables

See `.env.example` for all required variables.

**Key variables:**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase API URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key (public)
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (server-only)
- `SESSION_SECRET` - Session encryption key (min 32 chars)

**Security:**
- Variables prefixed with `NEXT_PUBLIC_` are exposed to browser
- Never expose service role keys to browser

## Troubleshooting

### Docker not running

**Error:** `Cannot connect to Docker daemon`

**Solution:** Start Docker Desktop and wait for it to fully initialize

### Port already in use

**Error:** `Port 3000 already in use`

**Solution:** Kill process using port:
\`\`\`bash
lsof -ti:3000 | xargs kill -9
\`\`\`

### Supabase connection fails

**Error:** `Invalid API key`

**Solution:**
1. Ensure Supabase is running: `cd supabase && npx supabase status`
2. Copy keys from `npx supabase start` output to `.env.local`
3. Restart dev server

### Module not found errors

**Error:** `Cannot find module '@pleeno/database'`

**Solution:**
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### TypeScript errors

**Solution:** Ensure all zones have `tsconfig.json` extending from `@pleeno/tsconfig`

### Monorepo build issues

**Solution:** Clear Turborepo cache:
\`\`\`bash
rm -rf .turbo
npm run build
\`\`\`

## Testing

**Current:** Manual verification only

**Future (Story 1.4):**
- Unit tests: Vitest
- Component tests: React Testing Library
- E2E tests: Playwright

## Deployment

**Production deployment:** Vercel

1. Push to `main` branch
2. Vercel automatically builds and deploys
3. All zones deployed to: `https://pleeno.vercel.app`

**Manual deployment:**
\`\`\`bash
vercel --prod
\`\`\`

## Contributing

1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes and commit
3. Push and create pull request
4. CI checks must pass before merge

## Technology Stack

- **Framework:** Next.js 15.x with App Router
- **Language:** TypeScript 5.x (strict mode)
- **Database:** PostgreSQL 15+ via Supabase
- **State:** Zustand (client), TanStack Query (server)
- **UI:** React 19, Tailwind CSS 4.x, Shadcn UI
- **Build:** Turborepo
- **Deployment:** Vercel
- **Testing:** Vitest, Playwright (Story 1.4)

## Documentation

- [Architecture Document](docs/architecture.md)
- [Product Requirements](docs/PRD.md)
- [Epic Breakdown](docs/epics.md)

## License

[Your License]

## Support

For issues or questions, contact [your-email@example.com]
\`\`\`

### 2. Update Each Zone's README (Optional)

**Create `apps/shell/README.md`:**

```markdown
# Shell App

Main entry point and routing hub for Pleeno multi-zone architecture.

## Purpose

- Handles authentication
- Routes requests to zone apps
- Provides shared navigation and layout

## Development

\`\`\`bash
npm run dev  # Starts on port 3000
\`\`\`

## Multi-Zone Rewrites

See `next.config.js` for routing configuration to other zones.
```

**Repeat for other zones with appropriate descriptions.**

### 3. Add Troubleshooting Guide

**Create `docs/troubleshooting.md`:**

```markdown
# Troubleshooting Guide

## Common Issues

### Turborepo Monorepo Issues

**Symptom:** Package imports fail with "Module not found"

**Cause:** Workspace linking broken

**Solution:**
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
\`\`\`

### Supabase Issues

**Symptom:** Database connection fails

**Causes & Solutions:**

1. **Docker not running**
   - Start Docker Desktop
   - Wait for full initialization
   - Run `docker ps` to verify

2. **Wrong API keys in .env.local**
   - Run `cd supabase && npx supabase start`
   - Copy exact keys from output
   - Paste into `.env.local`
   - Restart dev server

3. **Port conflicts (54321, 54322, 54323)**
   - Stop conflicting services
   - Or change ports in `supabase/config.toml`

### Multi-Zone Routing Issues

**Symptom:** Zone pages return 404

**Cause:** Multi-zone rewrites misconfigured

**Solution:**
1. Verify `apps/shell/next.config.js` has rewrites for all zones
2. Verify each zone's `next.config.js` has correct `basePath`
3. Restart all dev servers

### Environment Variable Issues

**Symptom:** `undefined` for `process.env.NEXT_PUBLIC_*`

**Causes & Solutions:**

1. **Missing NEXT_PUBLIC_ prefix**
   - Browser variables must start with `NEXT_PUBLIC_`

2. **Server not restarted after .env change**
   - Restart dev server: `npm run dev`

3. **Variable in wrong .env file**
   - Use `.env.local` for local dev
   - Use Vercel dashboard for production

### Build Issues

**Symptom:** `npm run build` fails

**Causes & Solutions:**

1. **TypeScript errors**
   - Run `npm run type-check` to see errors
   - Fix type errors before building

2. **Missing dependencies**
   - Run `npm install`
   - Check `package.json` for all required deps

3. **Turbo cache corruption**
   - Clear cache: `rm -rf .turbo`
   - Rebuild: `npm run build`

## Getting Help

1. Check this troubleshooting guide
2. Search GitHub issues
3. Ask in team Slack
4. Create GitHub issue with error details
```

### 4. Add Development Workflow Guide

**Create `docs/development-workflow.md`:**

```markdown
# Development Workflow

## Daily Development

1. **Start Supabase:**
   \`\`\`bash
   cd supabase && npx supabase start
   \`\`\`

2. **Start dev servers:**
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Work on your feature**

4. **Before committing:**
   \`\`\`bash
   npm run lint
   npm run type-check
   \`\`\`

5. **Commit and push**

## Creating Pull Requests

1. Create feature branch
2. Make changes
3. Ensure CI passes
4. Request review
5. Address feedback
6. Merge when approved

## Working with Zones

Each zone is independent:
- Has own `package.json`
- Can have zone-specific dependencies
- Imports from shared packages via `@pleeno/*`

## Working with Shared Packages

1. Make changes in `packages/[package-name]`
2. Changes immediately available in all zones
3. No build step needed (TypeScript uses source)
```

## Verification Steps

1. Verify root `README.md` is comprehensive and accurate
2. Follow setup instructions from scratch in a new directory
3. Verify all commands work as documented
4. Verify troubleshooting guide addresses common issues
5. Verify links to other docs work

## Expected Outcome

- Comprehensive README with setup instructions
- Clear architecture overview
- Troubleshooting guide for common issues
- Development workflow documentation
- New developers can clone and run project following README

## References

- [docs/architecture.md](../../docs/architecture.md)
- [Story Context XML](.bmad-ephemeral/stories/1-1-project-infrastructure-initialization.context.xml)

## Notes

- Keep README concise - link to detailed docs
- Update README as project evolves
- Include version numbers for prerequisites
- Provide both GUI and CLI instructions where applicable
