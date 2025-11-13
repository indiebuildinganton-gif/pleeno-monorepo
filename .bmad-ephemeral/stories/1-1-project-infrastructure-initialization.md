# Story 1.1: Project Infrastructure Initialization

Status: ready-for-dev

## Story

As a **developer**,
I want **the core project infrastructure and development environment set up**,
so that **I have a working foundation to build features on**.

## Acceptance Criteria

1. **Given** I am starting a new project, **When** I initialize the repository and deployment pipeline, **Then** I have a working Next.js/React application with TypeScript, a configured PostgreSQL database, basic CI/CD pipeline, and deployment environment

2. **And** the repository structure follows best practices with clear separation of concerns

3. **And** all developers can clone, install dependencies, and run the application locally

4. **And** environment variables are properly configured with example templates

## Tasks / Subtasks

- [ ] Initialize Turborepo monorepo with multi-zone architecture (AC: 1, 2)
  - [ ] Run `npx create-turbo@latest pleeno-monorepo`
  - [ ] Create 6 Next.js 15 zones: shell, dashboard, agency, entities, payments, reports
  - [ ] Run `npx create-next-app@latest` for each zone with TypeScript, Tailwind, App Router
  - [ ] Configure multi-zone rewrites in shell app's `next.config.js`
  - [ ] Configure `basePath` for each zone (e.g., `/dashboard`, `/agency`)

- [ ] Set up shared packages structure (AC: 2)
  - [ ] Create `packages/database` for Supabase client and types
  - [ ] Create `packages/ui` for shared components (Shadcn UI)
  - [ ] Create `packages/auth` for authentication utilities
  - [ ] Create `packages/validations` for Zod schemas
  - [ ] Create `packages/utils` for business logic utilities
  - [ ] Create `packages/stores` for Zustand stores
  - [ ] Create `packages/tsconfig` for shared TypeScript configs

- [ ] Configure code quality tools (AC: 2)
  - [ ] Set up ESLint with Next.js and TypeScript rules
  - [ ] Configure Prettier with project style guide
  - [ ] Add pre-commit hooks (Husky + lint-staged)

- [ ] Set up Supabase PostgreSQL database (AC: 1)
  - [ ] Install Docker (required for local Supabase)
  - [ ] Initialize Supabase: `cd supabase && npx supabase init`
  - [ ] Start local Supabase: `npx supabase start`
  - [ ] Create domain-driven migration folder structure (001_agency_domain, etc.)
  - [ ] Configure database connection in environment variables
  - [ ] Test database connectivity from Next.js zones

- [ ] Configure environment variables (AC: 4)
  - [ ] Create `.env.local` for local development
  - [ ] Create `.env.example` template with all required variables
  - [ ] Document environment variable usage in README

- [ ] Set up deployment environment (AC: 1)
  - [ ] Configure Vercel or Railway deployment
  - [ ] Set up production environment variables
  - [ ] Configure deployment from main branch
  - [ ] Verify successful deployment

- [ ] Create basic CI/CD pipeline (AC: 1)
  - [ ] Set up GitHub Actions workflow for CI
  - [ ] Add linting and type-checking to CI
  - [ ] Add build verification to CI
  - [ ] Configure automatic deployment on merge to main

- [ ] Install shared dependencies (AC: 1)
  - [ ] Install Supabase packages: `npm install -w packages/database @supabase/supabase-js @supabase/ssr`
  - [ ] Install UI packages: `npm install -w packages/ui zustand @tanstack/react-query react-hook-form @hookform/resolvers zod`
  - [ ] Install utility packages: `npm install -w packages/ui date-fns date-fns-tz recharts @tanstack/react-table`
  - [ ] Install email/PDF packages: `npm install -w packages/ui @react-pdf/renderer resend`

- [ ] Document setup instructions (AC: 3)
  - [ ] Write README with Turborepo monorepo setup instructions
  - [ ] Document how to run all zones: `npm run dev` (starts all on different ports)
  - [ ] Document Supabase local setup with Docker
  - [ ] Add troubleshooting guide for common monorepo issues

## Dev Notes

### Technical Stack

**Framework & Language:**
- **Next.js 15.x** with App Router (as per architecture decision)
- TypeScript 5.x with strict mode enabled
- React 19
- **Turborepo** for monorepo build caching and orchestration

**Database:**
- PostgreSQL 15+ via **Supabase** (required - not optional)
- Supabase Auth with multi-tenant JWT claims
- Supabase Storage for file uploads
- Supabase Edge Functions (Deno) for background jobs

**Deployment & Infrastructure:**
- **Vercel** with multi-zone deployment (required)
- Each zone deployed independently
- Automatic deployments from main branch

**State Management:**
- Zustand 5.0.8 for client state
- TanStack Query 5.90.7 for server state

**Code Quality:**
- ESLint with Next.js and TypeScript configurations
- Prettier for consistent code formatting
- Pre-commit hooks using Husky + lint-staged

### Project Structure (Turborepo Monorepo)

**CRITICAL: This project uses Turborepo monorepo with multi-zones architecture, NOT a simple Next.js app**

```
pleeno-monorepo/
├── apps/
│   ├── shell/                    # Main entry & routing (port 3000)
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── (auth)/           # Login, signup pages
│   │   ├── middleware.ts         # Auth + zone routing
│   │   └── next.config.js        # Multi-zone rewrites
│   │
│   ├── dashboard/                # Epic 6 (port 3001, basePath: /dashboard)
│   ├── agency/                   # Epic 2 (port 3002, basePath: /agency)
│   ├── entities/                 # Epic 3 (port 3003, basePath: /entities)
│   ├── payments/                 # Epic 4 (port 3004, basePath: /payments)
│   └── reports/                  # Epic 7 (port 3005, basePath: /reports)
│
├── packages/
│   ├── database/                 # Supabase client & types
│   ├── ui/                       # Shadcn UI components
│   ├── auth/                     # Auth utilities
│   ├── validations/              # Zod schemas
│   ├── utils/                    # Business logic
│   ├── stores/                   # Zustand stores
│   └── tsconfig/                 # Shared TS configs
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_agency_domain/
│   │   ├── 002_entities_domain/
│   │   └── 003_payments_domain/
│   ├── functions/                # Edge Functions
│   └── config.toml
│
├── turbo.json                    # Turborepo config
├── package.json                  # Root package.json
└── README.md
```

### Architecture Considerations

**Microfrontend Multi-Zone Architecture (ADR-001):**
- 6 independent Next.js zones for domain isolation
- Shell app handles routing and authentication
- Each zone can be deployed independently
- Hard navigation between zones (acceptable tradeoff)
- Smaller bundles (~200KB per zone vs 1MB+ monolith)

**Multi-Tenant Foundation:**
- Supabase required for RLS-based multi-tenancy (ADR-002)
- JWT claims propagate agency_id to database
- Story 1.2 will implement RLS policies
- All zones share authentication via HTTP-only cookies

**Scalability:**
- Turborepo provides 3-10x faster builds with caching
- Independent zone deployments on Vercel
- React Server Components for better performance
- Edge Functions for background jobs

**Security:**
- Environment variables must never be committed
- `.env.example` should contain placeholder values only
- Supabase service role key never exposed to client
- HTTP-only cookies for session management

### Testing Standards

**For this story:**
- Manual verification: Clone repo, run `npm install`, start dev server
- Verify TypeScript compilation succeeds with no errors
- Verify deployment pipeline works end-to-end

**Future stories:**
- Unit tests with **Vitest** (per architecture, not Jest)
- Component tests with React Testing Library
- E2E tests with Playwright for critical flows
- Testing infrastructure will be added in Story 1.4 (Error Handling & Logging)

### Project Structure Notes

This is a **greenfield project** (new codebase from scratch). No existing code to align with.

**Architecture Decision: Turborepo Monorepo with Multi-Zones**

**Why this matters for implementation:**
- Each zone (shell, dashboard, agency, entities, payments, reports) is a separate Next.js 15 app
- Zones run on different ports in development (3000-3005)
- Shell app (port 3000) acts as router with rewrites to other zones
- Shared code lives in `packages/` directory
- Turborepo orchestrates builds and caching across all zones

**Folder Structure Rationale:**
- `apps/{zone}/app/`: Next.js 15 App Router (pages, layouts, route handlers)
- `packages/ui/`: Shared Shadcn UI components (copy-paste ownership)
- `packages/database/`: Supabase client utilities and generated types
- `packages/utils/`: Business logic (commission calculator, date helpers)
- `supabase/migrations/`: Domain-driven database migrations

**Critical Implementation Steps:**
1. Initialize Turborepo monorepo (NOT simple Next.js app)
2. Create 6 separate Next.js 15 zones in `apps/` directory
3. Set up shared packages in `packages/` directory
4. Configure multi-zone rewrites in shell app
5. Initialize Supabase with domain-driven migration structure

### Initialization Commands (From Architecture Doc)

**Execute these commands exactly as specified in architecture.md:**

```bash
# Step 1: Initialize Turborepo monorepo
npx create-turbo@latest pleeno-monorepo
cd pleeno-monorepo

# Step 2: Create Next.js 15 zones
cd apps
npx create-next-app@latest shell --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest dashboard --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest agency --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest entities --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest payments --typescript --tailwind --app --use-npm --eslint
npx create-next-app@latest reports --typescript --tailwind --app --use-npm --eslint

# Step 3: Initialize Supabase (requires Docker running)
cd ../supabase
npx supabase init
npx supabase start

# Step 4: Install shared dependencies
npm install -w packages/database @supabase/supabase-js @supabase/ssr
npm install -w packages/ui zustand @tanstack/react-query react-hook-form @hookform/resolvers zod
npm install -w packages/ui date-fns date-fns-tz recharts @tanstack/react-table
npm install -w packages/ui @react-pdf/renderer resend
```

### References

- [Source: docs/epics.md#Story-1.1-Project-Infrastructure-Initialization]
- [Source: docs/architecture.md#Project-Initialization - Exact commands to execute]
- [Source: docs/architecture.md#ADR-001 - Microfrontend Multi-Zones architecture decision]
- [Source: docs/architecture.md#ADR-002 - Supabase with PostgreSQL RLS decision]
- [Source: docs/architecture.md#Project-Structure - Turborepo monorepo layout]
- [Source: docs/PRD.md#Multi-Tenancy-Architecture - Row-Level Security requirement]

### Learnings from Previous Story

This is the first story in the epic - no predecessor context.

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/1-1-project-infrastructure-initialization.context.xml](.bmad-ephemeral/stories/1-1-project-infrastructure-initialization.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
