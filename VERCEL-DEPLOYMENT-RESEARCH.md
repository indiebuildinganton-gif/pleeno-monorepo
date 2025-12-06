# Vercel Deployment Strategy Research Investigation
## Pleeno Monorepo Architecture Decision

### Executive Summary
We need to determine the most sustainable and robust deployment strategy for the Pleeno monorepo containing 6 Next.js applications (shell, dashboard, agency, entities, payments, reports). Currently experiencing deployment issues where apps are served under subdirectory paths instead of root paths on their respective subdomains.

### Current Situation

#### Monorepo Structure
```
Pleeno/
├── apps/
│   ├── shell/       → shell.plenno.com.au (auth service)
│   ├── dashboard/   → dashboard.plenno.com.au
│   ├── agency/      → agency.plenno.com.au
│   ├── entities/    → entities.plenno.com.au
│   ├── payments/    → payments.plenno.com.au
│   └── reports/     → reports.plenno.com.au
├── packages/
│   ├── @pleeno/auth
│   ├── @pleeno/database
│   ├── @pleeno/ui
│   └── ... (shared packages)
└── turbo.json
```

#### Current Issues
1. Apps deployed from monorepo root are served under path prefixes (e.g., `/dashboard/*` instead of `/*`)
2. Domain routing conflicts between expected paths and actual deployment paths
3. Authentication flow expects apps at root paths
4. Multiple failed deployments due to configuration conflicts

### Research Questions

## Option 1: Deploy Each App Separately

### Investigation Areas

#### 1. Project Structure
- **Question**: How should we structure separate Vercel projects for each app?
- **Research**:
  - Best practices for Vercel project naming conventions in monorepos
  - How to maintain consistent project settings across multiple projects
  - Environment variable management across separate projects
  - Shared secrets and API keys distribution

#### 2. CI/CD Pipeline
- **Question**: How do we coordinate deployments across multiple projects?
- **Research**:
  - GitHub Actions setup for selective app deployment
  - Dependency detection (deploy only changed apps)
  - Deployment order management (e.g., shell before others)
  - Rollback strategies for multi-project deployments
  - Preview deployments coordination

#### 3. Shared Dependencies
- **Question**: How are shared packages handled in separate deployments?
- **Research**:
  - Build caching strategies for shared packages
  - Version synchronization across deployments
  - Impact on build times with duplicated dependency installation
  - Turbo cache sharing between projects

#### 4. Domain Management
- **Question**: How do we manage domains across multiple projects?
- **Research**:
  - DNS configuration for multiple projects
  - SSL certificate management
  - Subdomain routing best practices
  - Wildcard domain support

#### 5. Development Workflow
- **Question**: What's the developer experience with multiple projects?
- **Research**:
  - Local development setup complexity
  - Environment parity between local and production
  - Team member onboarding process
  - Project access management in Vercel dashboard

### Cost & Performance Analysis
- Build minutes consumption per project vs. monorepo
- Bandwidth usage patterns
- Function execution isolation benefits
- Cold start performance implications

## Option 2: Use Vercel Monorepo Support

### Investigation Areas

#### 1. Vercel Monorepo Configuration
- **Question**: What's the correct configuration for proper monorepo support?
- **Research**:
  - `vercel.json` configuration for multiple apps
  - Root directory vs. app directory deployments
  - Output directory configuration for monorepos
  - Build command optimization with Turborepo

#### 2. Routing Architecture
- **Question**: How do we configure routing to serve apps at root paths?
- **Research**:
  - Rewrites and redirects configuration
  - Middleware routing strategies
  - Path-based routing vs. subdomain routing
  - API route handling across apps

#### 3. Build Optimization
- **Question**: How do we optimize build times in monorepo deployment?
- **Research**:
  - Turborepo remote caching configuration
  - Selective app building based on changes
  - Parallel build strategies
  - Build cache sharing between deployments

#### 4. Environment Configuration
- **Question**: How do we manage environment variables for multiple apps?
- **Research**:
  - Environment variable scoping per app
  - Shared vs. app-specific variables
  - Secret management in monorepo context
  - Build-time vs. runtime environment variables

#### 5. Deployment Strategies
- **Question**: What deployment patterns work best for monorepos?
- **Research**:
  - Branch-based deployments for monorepos
  - Preview deployment isolation
  - Production deployment coordination
  - Blue-green deployment possibilities

### Technical Deep Dive Requirements

#### Authentication Flow Analysis
- How authentication tokens are shared across subdomains
- CORS configuration requirements
- Session management across apps
- SSO implications for each option

#### Database & API Integration
- Connection pooling across deployments
- API rate limiting considerations
- Supabase client initialization patterns
- RLS (Row Level Security) implications

### Decision Criteria Matrix

| Criteria | Weight | Option 1: Separate Projects | Option 2: Monorepo Support |
|----------|--------|---------------------------|--------------------------|
| Deployment Complexity | High | ? | ? |
| Maintenance Overhead | High | ? | ? |
| Build Performance | Medium | ? | ? |
| Cost Efficiency | Medium | ? | ? |
| Developer Experience | High | ? | ? |
| Scalability | High | ? | ? |
| Debugging & Monitoring | Medium | ? | ? |
| Rollback Capability | High | ? | ? |
| Security Isolation | Medium | ? | ? |
| Team Collaboration | Medium | ? | ? |

### Required Experiments

#### Proof of Concept 1: Separate Projects
1. Create `pleeno-dashboard-prod` project
2. Configure deployment from `/apps/dashboard`
3. Test:
   - Build times
   - Environment variable handling
   - Domain routing
   - Authentication flow
   - Shared package updates

#### Proof of Concept 2: Monorepo Configuration
1. Create proper `vercel.json` at root
2. Configure multi-app deployment
3. Test:
   - Routing configuration
   - Build optimization
   - Deployment triggers
   - Preview deployments
   - Performance metrics

### Risk Assessment

#### Option 1 Risks
- Deployment coordination complexity
- Increased maintenance overhead
- Potential for version drift
- Higher operational complexity

#### Option 2 Risks
- Single point of failure
- Complex configuration requirements
- Potential for deployment conflicts
- Limited deployment isolation

### Migration Path

#### From Current State to Option 1
1. Create individual Vercel projects
2. Configure GitHub integrations
3. Migrate environment variables
4. Update DNS records
5. Test authentication flows
6. Implement CI/CD pipeline

#### From Current State to Option 2
1. Research Vercel monorepo docs
2. Create comprehensive `vercel.json`
3. Configure routing rules
4. Test build process
5. Optimize caching
6. Deploy and validate

### Success Metrics
- Deployment success rate > 95%
- Build time < 5 minutes per app
- Zero-downtime deployments
- Simplified debugging process
- Clear deployment logs
- Predictable deployment behavior

### Recommended Research Resources

#### Documentation
- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Turborepo with Vercel](https://turbo.build/repo/docs/guides/deploy-to-vercel)
- [Next.js Multi-Zone](https://nextjs.org/docs/advanced-features/multi-zones)
- [Vercel Project Configuration](https://vercel.com/docs/projects/project-configuration)

#### Case Studies
- Research similar SaaS platforms using monorepos
- Vercel's own monorepo deployment patterns
- Enterprise monorepo deployment strategies

#### Community Resources
- Vercel Discord community insights
- GitHub discussions on monorepo deployments
- Stack Overflow patterns and anti-patterns

### Timeline for Investigation
- **Week 1**: Documentation research and initial experiments
- **Week 2**: POC implementation for both options
- **Week 3**: Performance testing and analysis
- **Week 4**: Decision and implementation planning

### Key Stakeholders to Consult
- DevOps team (if applicable)
- Frontend developers working on the apps
- Backend team for API implications
- Product team for deployment frequency requirements
- Security team for isolation requirements

### Final Recommendation Framework
The investigation should conclude with:
1. Clear recommendation with rationale
2. Implementation roadmap
3. Migration timeline
4. Risk mitigation strategies
5. Monitoring and success metrics
6. Rollback plan if needed

---

## Action Items
1. Review Vercel's latest monorepo documentation
2. Analyze current deployment failure logs in detail
3. Create test projects for both approaches
4. Benchmark build and deployment times
5. Document authentication flow requirements
6. Evaluate long-term maintenance implications
7. Consider future scaling requirements (new apps, team growth)
8. Review Vercel pricing implications for each approach

## Questions for Vercel Support
1. What's the recommended approach for Next.js monorepos with multiple apps on subdomains?
2. How can we serve apps at root path when deploying from subdirectories?
3. What are the performance implications of separate projects vs. monorepo deployment?
4. Are there any upcoming features that would affect this decision?
5. What's the best practice for sharing authentication across subdomain-deployed apps?

---

*Document created: December 6, 2024*
*Purpose: Architectural decision for Pleeno monorepo Vercel deployment strategy*
*Decision deadline: [Set based on project timeline]*