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

- [ ] Initialize Next.js 14+ project with App Router and TypeScript (AC: 1)
  - [ ] Run `npx create-next-app@latest` with TypeScript and App Router
  - [ ] Configure `tsconfig.json` with strict mode
  - [ ] Verify dev server starts successfully

- [ ] Set up project folder structure (AC: 2)
  - [ ] Create `/app` directory (Next.js App Router)
  - [ ] Create `/lib` directory for utilities and helpers
  - [ ] Create `/components` directory for React components
  - [ ] Create `/types` directory for TypeScript types

- [ ] Configure code quality tools (AC: 2)
  - [ ] Set up ESLint with Next.js and TypeScript rules
  - [ ] Configure Prettier with project style guide
  - [ ] Add pre-commit hooks (Husky + lint-staged)

- [ ] Set up PostgreSQL database (AC: 1)
  - [ ] Evaluate Supabase vs self-hosted PostgreSQL
  - [ ] Create database instance (Supabase recommended for built-in RLS and auth)
  - [ ] Configure database connection in environment variables
  - [ ] Test database connectivity

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

- [ ] Document setup instructions (AC: 3)
  - [ ] Write README with clone, install, and run instructions
  - [ ] Document environment setup requirements
  - [ ] Add troubleshooting guide for common issues

## Dev Notes

### Technical Stack

**Framework & Language:**
- Next.js 14+ with App Router (latest stable version)
- TypeScript with strict mode enabled
- React 18+

**Database:**
- PostgreSQL 15+
- **Recommended**: Supabase for managed PostgreSQL with built-in authentication and Row-Level Security (RLS)
- Alternative: Self-hosted PostgreSQL with separate auth solution

**Deployment & Infrastructure:**
- Vercel (recommended for Next.js) or Railway
- Environment variable management via platform
- Automatic deployments from main branch

**Code Quality:**
- ESLint with Next.js and TypeScript configurations
- Prettier for consistent code formatting
- Pre-commit hooks using Husky + lint-staged

### Project Structure

```
pleeno/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable React components
├── lib/              # Utility functions, helpers, and services
├── types/            # TypeScript type definitions
├── public/           # Static assets
├── .env.local        # Local environment variables (gitignored)
├── .env.example      # Template for required environment variables
├── tsconfig.json     # TypeScript configuration
├── package.json      # Dependencies and scripts
└── README.md         # Setup and usage documentation
```

### Architecture Considerations

**Multi-Tenant Foundation:**
- This story establishes the foundation for multi-tenant architecture
- Supabase RLS will be critical for Epic 1, Story 1.2 (Multi-Tenant Database Schema)
- Choose database solution with RLS support in mind

**Scalability:**
- Next.js App Router supports React Server Components for better performance
- Vercel provides automatic scaling and edge network distribution
- PostgreSQL connection pooling will be configured in future stories

**Security:**
- Environment variables must never be committed to repository
- `.env.example` should contain placeholder values only
- Production secrets managed via deployment platform

### Testing Standards

**For this story:**
- Manual verification: Clone repo, run `npm install`, start dev server
- Verify TypeScript compilation succeeds with no errors
- Verify deployment pipeline works end-to-end

**Future stories:**
- Unit tests with Jest and React Testing Library
- Integration tests with Playwright or Cypress
- Testing infrastructure will be added in Story 1.4 (Error Handling & Logging)

### Project Structure Notes

This is a **greenfield project** (new codebase from scratch). No existing code to align with.

**Folder Structure Rationale:**
- `/app`: Next.js 14 App Router convention (pages, layouts, route handlers)
- `/components`: Shared UI components following atomic design principles
- `/lib`: Business logic, API clients, utilities (separated from presentation)
- `/types`: TypeScript interfaces and types for domain models

### References

- [Source: docs/epics.md#Story-1.1-Project-Infrastructure-Initialization]
- [Source: docs/PRD.md#Project-Classification - Technical Type: SaaS B2B Web Application]
- [Source: docs/PRD.md#Multi-Tenancy-Architecture - Row-Level Security requirement]
- [Source: docs/PRD.md#Implementation-Planning - Epic 1: Foundation & Multi-Tenant Architecture]

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
