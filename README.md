# Pleeno - Agency Management SaaS

[![CI](https://github.com/rajkrajpj/pleeno/workflows/CI/badge.svg)](https://github.com/rajkrajpj/pleeno/actions/workflows/ci.yml)
[![Deploy](https://github.com/rajkrajpj/pleeno/workflows/Deploy/badge.svg)](https://github.com/rajkrajpj/pleeno/actions/workflows/deploy.yml)

Multi-tenant SaaS platform for managing agencies, entities, payments, and reporting with automated workflows.

## 🏗️ Architecture

This project uses a **Turborepo monorepo** with **multi-zone Next.js 15 architecture**:

- **6 Independent Zones:** shell, dashboard, agency, entities, payments, reports
- **7 Shared Packages:** database, ui, auth, validations, utils, stores, tsconfig
- **PostgreSQL via Supabase:** Multi-tenant database with Row-Level Security (RLS)
- **Vercel Deployment:** Each zone deployed independently

See [docs/architecture.md](docs/architecture.md) for complete architecture documentation.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download](https://nodejs.org/)
- **pnpm 10+** - Install with `npm install -g pnpm`
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop) (Required for local Supabase)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/rajkrajpj/pleeno.git
cd pleeno
```

### 2. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all zones and packages using Turborepo.

### 3. Set Up Environment Variables

```bash
cp .env.example .env.local
```

You'll fill in the Supabase credentials in the next step.

### 4. Start Supabase (First Time)

Ensure Docker Desktop is running, then:

```bash
cd supabase
npx supabase start
```

This will:
- Download Supabase Docker images (~1GB, first time only)
- Start PostgreSQL, PostgREST, GoTrue, Storage, and Studio
- Output connection details (save these!)

**Copy the output values:**
- API URL
- Anon Key
- Service Role Key
- Database URL
- Studio URL

### 5. Configure Environment Variables

Edit `.env.local` and paste the Supabase credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

For detailed environment variable documentation, see [docs/environment-variables.md](docs/environment-variables.md).

### 6. Start All Development Servers

```bash
cd ..  # Return to project root
pnpm dev
```

This starts all 6 zones in parallel:
- **Shell:** http://localhost:3000
- **Dashboard:** http://localhost:3001 (or access via /dashboard)
- **Agency:** http://localhost:3002 (or access via /agency)
- **Entities:** http://localhost:3003 (or access via /entities)
- **Payments:** http://localhost:3004 (or access via /payments)
- **Reports:** http://localhost:3005 (or access via /reports)
- **Supabase Studio:** http://localhost:54323

### 7. Verify Setup

Open http://localhost:3000 in your browser. You should see the shell app running.

Check API health:
```bash
curl http://localhost:3000/api/health
```

## 📦 Project Structure

```
pleeno/
├── apps/                      # Next.js zones
│   ├── shell/                 # Main entry & routing (port 3000)
│   ├── dashboard/             # Analytics & overview (port 3001)
│   ├── agency/                # Agency management (port 3002)
│   ├── entities/              # Colleges & students (port 3003)
│   ├── payments/              # Payment tracking (port 3004)
│   └── reports/               # Financial reports (port 3005)
│
├── packages/                  # Shared code
│   ├── database/              # Supabase client & types
│   ├── ui/                    # Shadcn UI components
│   ├── auth/                  # Authentication utilities
│   ├── validations/           # Zod schemas
│   ├── utils/                 # Business logic
│   ├── stores/                # Zustand stores
│   └── tsconfig/              # Shared TS configs
│
├── supabase/                  # Database & migrations
│   ├── migrations/            # SQL migrations (domain-driven)
│   ├── functions/             # Edge Functions (Deno)
│   └── config.toml            # Supabase configuration
│
├── docs/                      # Documentation
│   ├── architecture.md        # System architecture
│   ├── PRD.md                 # Product requirements
│   ├── epics.md               # Epic breakdown
│   └── environment-variables.md
│
├── .github/                   # CI/CD workflows
├── turbo.json                 # Turborepo configuration
└── package.json               # Root package.json
```

## 🛠️ Development Commands

### Run All Zones

```bash
pnpm dev              # Start all zones in parallel
```

### Run Individual Zones

```bash
pnpm dev:shell        # Port 3000
pnpm dev:dashboard    # Port 3001
pnpm dev:agency       # Port 3002
pnpm dev:entities     # Port 3003
pnpm dev:payments     # Port 3004
pnpm dev:reports      # Port 3005
```

### Build

```bash
pnpm build            # Build all zones and packages
pnpm build --filter=shell  # Build specific zone
```

### Code Quality

```bash
pnpm lint             # Lint all workspaces
pnpm lint:fix         # Auto-fix linting issues
pnpm type-check       # TypeScript type checking
pnpm format           # Format all files with Prettier
pnpm format:check     # Check formatting without changes
```

### Testing

```bash
pnpm test             # Run all tests with Vitest
pnpm test:watch       # Run tests in watch mode
pnpm test:ui          # Run tests with Vitest UI
pnpm test:coverage    # Run tests with coverage report

# E2E Testing
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:e2e:ui      # Run E2E tests with UI
pnpm test:e2e:debug   # Debug E2E tests
```

See [TESTING.md](TESTING.md) for detailed testing documentation.

### Database (Supabase)

```bash
cd supabase

npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npx supabase status      # Check service status
npx supabase db reset    # Reset database and run migrations
npx supabase migration new <name>  # Create new migration
npx supabase db push     # Push local migrations to remote
npx supabase db pull     # Pull remote migrations to local
npx supabase gen types typescript --local > ../packages/database/src/types/database.types.ts  # Generate TypeScript types
```

### Supabase Studio

Access the local Supabase dashboard at http://localhost:54323

- View and edit database tables
- Manage authentication users
- Run SQL queries
- Configure storage buckets

## 📚 Documentation

- **[Architecture](docs/architecture.md)** - System architecture and technical decisions
- **[Product Requirements](docs/PRD.md)** - Product vision and feature requirements
- **[Epic Breakdown](docs/epics.md)** - Development roadmap and user stories
- **[Environment Variables](docs/environment-variables.md)** - Environment configuration guide
- **[Development Guide](docs/development-guide.md)** - Detailed development instructions
- **[Testing Guide](TESTING.md)** - Testing strategy and best practices
- **[Deployment Guide](DEPLOYMENT.md)** - Deployment instructions for Vercel
- **[Sentry Setup](SENTRY_SETUP.md)** - Error monitoring configuration
- **[Contributing](CONTRIBUTING.md)** - Contribution guidelines and standards

## 🧪 Testing

This project includes comprehensive testing infrastructure:

- **Unit Tests:** Vitest for utilities, hooks, and business logic
- **Component Tests:** React Testing Library for UI components
- **E2E Tests:** Playwright for critical user flows
- **Coverage:** >80% code coverage target

See [TESTING.md](TESTING.md) for detailed testing documentation.

## 🚢 Deployment

### Vercel (Recommended)

Each zone is deployed as a separate Vercel project:

1. Push to `main` branch
2. Vercel automatically deploys all zones
3. Multi-zone routing handled by shell app

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment setup.

### Environment Variables in Production

Configure in Vercel dashboard for each zone:
- `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
- `NEXT_PUBLIC_APP_URL` - Production app URL
- `NEXT_PUBLIC_SENTRY_DSN` - Sentry error monitoring DSN

## 🐛 Troubleshooting

### Docker Issues

**Problem:** "Cannot connect to Docker daemon"
- **Solution:** Start Docker Desktop and wait for it to initialize

**Problem:** "Port already in use (54321, 54322, 54323)"
- **Solution:** Stop other services using these ports:
  ```bash
  cd supabase
  npx supabase stop
  # If that doesn't work, check what's using the port:
  lsof -i :54321
  # Kill the process if needed
  ```

**Problem:** Docker Desktop runs out of memory
- **Solution:** Increase Docker Desktop memory in Settings > Resources > Memory (recommend 4GB+)

### Supabase Issues

**Problem:** "Supabase client is not configured"
- **Solution:** Ensure environment variables are set in `.env.local` and restart dev server:
  ```bash
  # Stop all servers
  # Update .env.local
  pnpm dev
  ```

**Problem:** Supabase containers won't start
- **Solution:**
  ```bash
  cd supabase
  npx supabase stop
  # Wait 5 seconds
  npx supabase start
  ```

**Problem:** Database migrations fail
- **Solution:** Reset the database:
  ```bash
  cd supabase
  npx supabase db reset
  ```

### Build Issues

**Problem:** "Module not found" during build
- **Solution:** Clear cache and reinstall:
  ```bash
  rm -rf node_modules
  rm pnpm-lock.yaml
  pnpm install
  ```

**Problem:** TypeScript errors after dependency installation
- **Solution:** Run type check to see specific errors:
  ```bash
  pnpm type-check
  ```

### Multi-Zone Routing Issues

**Problem:** Zone routes return 404
- **Solution:** Ensure all zones are running:
  ```bash
  # Check running processes
  lsof -i :3000,3001,3002,3003,3004,3005
  # Restart all zones
  pnpm dev
  ```

**Problem:** Cross-zone navigation doesn't work
- **Solution:** Check `apps/shell/next.config.ts` rewrites configuration and ensure zone URLs are correct

### pnpm Issues

**Problem:** "pnpm: command not found"
- **Solution:** Install pnpm globally:
  ```bash
  npm install -g pnpm
  ```

**Problem:** Version mismatch errors
- **Solution:** Use the exact version specified in package.json:
  ```bash
  npm install -g pnpm@10.20.0
  ```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for:

- Development workflow
- Code standards and conventions
- Commit message guidelines
- Pull request process
- Testing requirements

### Quick Contribution Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and test: `pnpm test && pnpm type-check && pnpm lint`
3. Commit with meaningful message: `git commit -m "feat: add your feature"`
4. Push branch: `git push origin feature/your-feature`
5. Create Pull Request on GitHub
6. Wait for CI checks to pass
7. Request code review
8. Merge after approval

### Code Standards

- TypeScript strict mode enabled
- ESLint and Prettier enforced
- Pre-commit hooks run linting and formatting
- All commits must have meaningful messages (10+ characters)
- Test coverage required for new features

### Branch Protection

- `main` branch requires PR with 1 approval
- All CI checks must pass before merge
- Direct pushes to `main` are blocked

## 📊 Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, Shadcn UI
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** Zustand, TanStack Query
- **Testing:** Vitest, React Testing Library, Playwright
- **Monorepo:** Turborepo with pnpm workspaces
- **CI/CD:** GitHub Actions, Vercel
- **Error Monitoring:** Sentry
- **Architecture:** Multi-zone microfrontends

## 📄 License

Private and confidential. All rights reserved.

## 👥 Team

Built with ❤️ by the Pleeno team.

## 📞 Support

For questions or issues:
- Create an issue on [GitHub](https://github.com/rajkrajpj/pleeno/issues)
- Check documentation in the [docs](docs/) directory
- Review troubleshooting guide above

---

**Built with Next.js 15, Supabase, and Turborepo**
