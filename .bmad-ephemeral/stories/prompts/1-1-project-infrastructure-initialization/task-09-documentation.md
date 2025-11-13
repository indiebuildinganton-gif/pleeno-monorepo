# Task 9: Document Setup Instructions

**Story:** 1.1 - Project Infrastructure Initialization
**Status:** Ready for execution
**Acceptance Criteria:** AC 3

## Objective

Create comprehensive documentation for setting up and running the Pleeno monorepo locally.

## Context

Complete documentation ensures new team members can clone the repository and get started quickly. This task creates README, setup guides, and troubleshooting documentation.

## Prerequisites

- All previous tasks completed (Tasks 1-8)
- Working directory: `/Users/brenttudas/Cofounder-Experiments/pleeno/pleeno-monorepo`

## Task Steps

### 1. Create Comprehensive README.md

Create or update `README.md` at the root:

```markdown
# Pleeno - Agency Management SaaS

[![CI](https://github.com/<your-username>/<your-repo>/workflows/CI/badge.svg)](https://github.com/<your-username>/<your-repo>/actions/workflows/ci.yml)
[![Deploy](https://github.com/<your-username>/<your-repo>/workflows/Deploy/badge.svg)](https://github.com/<your-username>/<your-repo>/actions/workflows/deploy.yml)

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
- **npm 9+** - Comes with Node.js
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop) (Required for local Supabase)
- **Git** - [Download](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd pleeno-monorepo
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

This installs dependencies for all zones and packages using Turborepo.

### 3. Set Up Environment Variables

\`\`\`bash
cp .env.example .env.local
\`\`\`

You'll fill in the Supabase credentials in the next step.

### 4. Start Supabase (First Time)

Ensure Docker Desktop is running, then:

\`\`\`bash
cd supabase
npx supabase start
\`\`\`

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

\`\`\`bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<paste-service-role-key>
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
\`\`\`

### 6. Start All Development Servers

\`\`\`bash
npm run dev
\`\`\`

This starts all 6 zones in parallel:
- Shell: http://localhost:3000
- Dashboard: http://localhost:3001 (or access via /dashboard)
- Agency: http://localhost:3002 (or access via /agency)
- Entities: http://localhost:3003 (or access via /entities)
- Payments: http://localhost:3004 (or access via /payments)
- Reports: http://localhost:3005 (or access via /reports)
- Supabase Studio: http://localhost:54323

### 7. Verify Setup

Open http://localhost:3000 in your browser. You should see the shell app running.

## 📦 Project Structure

\`\`\`
pleeno-monorepo/
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
\`\`\`

## 🛠️ Development Commands

### Run All Zones

\`\`\`bash
npm run dev              # Start all zones in parallel
\`\`\`

### Run Individual Zones

\`\`\`bash
npm run dev:shell        # Port 3000
npm run dev:dashboard    # Port 3001
npm run dev:agency       # Port 3002
npm run dev:entities     # Port 3003
npm run dev:payments     # Port 3004
npm run dev:reports      # Port 3005
\`\`\`

### Build

\`\`\`bash
npm run build            # Build all zones and packages
npm run build --filter=shell  # Build specific zone
\`\`\`

### Code Quality

\`\`\`bash
npm run lint             # Lint all workspaces
npm run lint:fix         # Auto-fix linting issues
npm run type-check       # TypeScript type checking
npm run format           # Format all files with Prettier
npm run format:check     # Check formatting without changes
\`\`\`

### Database (Supabase)

\`\`\`bash
cd supabase

npx supabase start       # Start local Supabase
npx supabase stop        # Stop local Supabase
npx supabase status      # Check service status
npx supabase db reset    # Reset database and run migrations
npx supabase migration new <name>  # Create new migration
npx supabase db push     # Push local migrations to remote
npx supabase db pull     # Pull remote migrations to local
\`\`\`

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

## 🧪 Testing

Testing infrastructure will be added in Story 1.4. For now:

- Manual verification of features
- TypeScript type checking
- Linting with ESLint

Future testing will include:
- Unit tests with Vitest
- Component tests with React Testing Library
- E2E tests with Playwright

## 🚢 Deployment

### Vercel (Recommended)

Each zone is deployed as a separate Vercel project:

1. Push to `main` branch
2. Vercel automatically deploys all zones
3. Multi-zone routing handled by shell app

See [Task 6 documentation](.bmad-ephemeral/stories/prompts/1-1/task-06-deployment-setup.md) for detailed deployment setup.

### Environment Variables in Production

Configure in Vercel dashboard for each zone:
- `NEXT_PUBLIC_SUPABASE_URL` - Production Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Production anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Production service role key
- `NEXT_PUBLIC_APP_URL` - Production app URL

## 🐛 Troubleshooting

### Docker Issues

**Problem:** "Cannot connect to Docker daemon"
- **Solution:** Start Docker Desktop and wait for it to initialize

**Problem:** "Port already in use (54321, 54322, 54323)"
- **Solution:** Stop other services using these ports or configure different ports in `supabase/config.toml`

### Supabase Issues

**Problem:** "Supabase client is not configured"
- **Solution:** Ensure environment variables are set in `.env.local` and restart dev server

**Problem:** Supabase containers won't start
- **Solution:** Run `npx supabase stop` then `npx supabase start`

### Build Issues

**Problem:** "Module not found" during build
- **Solution:** Run `npm install` from monorepo root

**Problem:** TypeScript errors after dependency installation
- **Solution:** Run `npm run type-check` to see specific errors

### Multi-Zone Routing Issues

**Problem:** Zone routes return 404
- **Solution:** Ensure all zones are running (`npm run dev`) and check `apps/shell/next.config.js` rewrites

## 🤝 Contributing

### Development Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add your feature"`
3. Push branch: `git push origin feature/your-feature`
4. Create Pull Request on GitHub
5. Wait for CI checks to pass
6. Request code review
7. Merge after approval

### Code Standards

- TypeScript strict mode enabled
- ESLint and Prettier enforced
- Pre-commit hooks run linting and formatting
- All commits must have meaningful messages (10+ characters)

### Branch Protection

- `main` branch requires PR with 1 approval
- All CI checks must pass before merge
- Direct pushes to `main` are blocked

## 📄 License

[Your license here]

## 👥 Team

[Your team information here]

## 📞 Support

For questions or issues:
- Create an issue on GitHub
- Contact: [your-contact-info]

---

Built with ❤️ using Next.js 15, Supabase, and Turborepo
\`\`\`

### 2. Create CONTRIBUTING.md

Create `CONTRIBUTING.md`:

```markdown
# Contributing to Pleeno

Thank you for your interest in contributing to Pleeno!

## Development Setup

See [README.md](README.md#quick-start) for setup instructions.

## Code Standards

### TypeScript

- Use strict mode
- Prefer type inference over explicit types
- Use interfaces for object shapes
- Use types for unions and intersections

### React

- Use functional components with hooks
- Prefer Server Components (default in Next.js 15)
- Use Client Components only when needed ('use client')
- Follow React 19 best practices

### Naming Conventions

- Components: PascalCase (e.g., `UserProfile.tsx`)
- Hooks: camelCase with "use" prefix (e.g., `useAuth.ts`)
- Utilities: camelCase (e.g., `formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_UPLOAD_SIZE`)

### File Structure

\`\`\`
apps/zone-name/
├── app/                    # App Router pages
│   ├── (route-group)/      # Route groups
│   ├── page.tsx            # Pages
│   ├── layout.tsx          # Layouts
│   └── api/                # API routes
├── components/             # Zone-specific components
└── lib/                    # Zone-specific utilities
\`\`\`

## Commit Messages

Format: `<type>: <description>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
- `feat: add user authentication`
- `fix: resolve payment calculation error`
- `docs: update setup instructions`

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Ensure all tests pass: `npm run test`
4. Ensure linting passes: `npm run lint`
5. Ensure type checking passes: `npm run type-check`
6. Push your branch and create a PR
7. Request review from team members
8. Address review feedback
9. Merge after approval

## Testing

- Write unit tests for utilities and hooks
- Write component tests for UI components
- Write E2E tests for critical user flows
- Maintain >80% code coverage

## Questions?

Create an issue or contact the team.
\`\`\`

### 3. Create docs/development-guide.md

Create `docs/development-guide.md`:

```markdown
# Development Guide

## Monorepo Architecture

### Turborepo

Turborepo orchestrates builds and caching across the monorepo.

**Key concepts:**
- **Workspaces:** Each app and package is a workspace
- **Pipeline:** Defines task dependencies (build, lint, dev)
- **Caching:** Speeds up repeated builds

### Multi-Zone Architecture

**Shell Zone (Port 3000):**
- Main entry point
- Authentication
- Routing to other zones

**Feature Zones (Ports 3001-3005):**
- Independent Next.js apps
- Domain-specific features
- Deployed separately

**Navigation:**
- Hard navigation between zones (full page reload)
- Acceptable tradeoff for domain isolation

## Working with Supabase

### Local Development

\`\`\`bash
cd supabase
npx supabase start        # Start local instance
npx supabase status       # Check status
npx supabase stop         # Stop instance
\`\`\`

### Migrations

\`\`\`bash
# Create new migration
npx supabase migration new create_agencies_table

# Edit migration file in supabase/migrations/

# Apply migrations
npx supabase db reset
\`\`\`

### Studio Access

Access local Supabase Studio at http://localhost:54323

- Table editor for viewing/editing data
- SQL editor for running queries
- Auth management for testing users

## Working with Shared Packages

### Creating a Shared Package

1. Create package directory: `mkdir -p packages/my-package/src`
2. Add `package.json`:

\`\`\`json
{
  "name": "@pleeno/my-package",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
\`\`\`

3. Add `tsconfig.json`:

\`\`\`json
{
  "extends": "@pleeno/tsconfig/base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
\`\`\`

4. Export from `src/index.ts`

### Using a Shared Package

In zone `package.json`:

\`\`\`json
{
  "dependencies": {
    "@pleeno/my-package": "*"
  }
}
\`\`\`

In zone code:

\`\`\`typescript
import { myFunction } from '@pleeno/my-package'
\`\`\`

## Debugging

### VS Code

Launch configurations in `.vscode/launch.json`:

\`\`\`json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev:shell"
    }
  ]
}
\`\`\`

### Browser DevTools

- React DevTools for component inspection
- Network tab for API debugging
- Console for errors and logs

## Performance

### Bundle Analysis

\`\`\`bash
# Analyze bundle size
ANALYZE=true npm run build --filter=shell
\`\`\`

### Performance Monitoring

- Use React Profiler for component rendering
- Monitor Core Web Vitals in Vercel
- Use Lighthouse for performance audits

## Security

### Environment Variables

- Never commit `.env.local`
- Use `NEXT_PUBLIC_` prefix only for client-safe values
- Keep service role keys secret

### Authentication

- Use Supabase Auth for user management
- Implement RLS policies for multi-tenancy
- Use HTTP-only cookies for sessions

### API Security

- Validate all inputs with Zod
- Use TypeScript for type safety
- Implement rate limiting
- Sanitize user-generated content

## Best Practices

### Server Components

Default to Server Components for:
- Static content
- Data fetching
- SEO-critical pages

Use Client Components for:
- Interactive UI (onClick, onChange)
- Browser APIs (localStorage, window)
- State management (useState, useReducer)

### Data Fetching

- Use Server Components for initial data
- Use React Query for client-side caching
- Implement loading states
- Handle errors gracefully

### Styling

- Use Tailwind CSS utility classes
- Follow design system (Shadcn UI)
- Use CSS modules for complex styles
- Avoid inline styles

## Troubleshooting Common Issues

See [README.md#troubleshooting](../README.md#troubleshooting) for common issues.
\`\`\`

## Verification Steps

1. **Verify README.md exists and is complete:**
   ```bash
   cat README.md
   # Should contain all sections: Quick Start, Project Structure, Commands, etc.
   ```

2. **Verify CONTRIBUTING.md exists:**
   ```bash
   cat CONTRIBUTING.md
   # Should contain contribution guidelines
   ```

3. **Verify development guide exists:**
   ```bash
   cat docs/development-guide.md
   # Should contain detailed development instructions
   ```

4. **Test following the README from scratch:**
   - Clone the repository to a new directory
   - Follow Quick Start instructions step-by-step
   - Verify everything works

5. **Verify documentation accuracy:**
   - Check all commands work as documented
   - Verify all URLs and links are correct
   - Ensure environment variable examples match `.env.example`

## Success Criteria

- [ ] README.md complete with Quick Start, architecture overview, and commands
- [ ] CONTRIBUTING.md with code standards and PR process
- [ ] docs/development-guide.md with detailed development instructions
- [ ] All documentation tested and verified accurate
- [ ] New team member can follow README to get started
- [ ] All commands documented work correctly
- [ ] Troubleshooting section covers common issues
- [ ] CI badge displays in README

## Documentation Checklist

- [ ] Prerequisites clearly listed
- [ ] Installation steps numbered and sequential
- [ ] Environment variable setup explained
- [ ] Supabase setup documented
- [ ] Development commands documented
- [ ] Project structure explained
- [ ] Troubleshooting common issues
- [ ] Contributing guidelines
- [ ] Code standards
- [ ] Testing approach
- [ ] Deployment process

## Architecture References

- **Source:** docs/architecture.md - Complete architecture documentation

## Completion

This is the final task in Story 1.1! After completing this task:

1. Verify all acceptance criteria are met
2. Test the entire setup from a fresh clone
3. Mark the story as complete
4. Proceed to Story 1.2: Multi-Tenant Database Schema with RLS
