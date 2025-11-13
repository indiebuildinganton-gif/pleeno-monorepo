# Story 1.2: Multi-Tenant Database Schema with RLS
## Development Prompt Execution Manifest

**Story ID**: 1-2
**Story Title**: Multi-Tenant Database Schema with RLS
**Epic**: 1 - Foundation & Multi-Tenant Security
**Generated**: 2025-11-13

---

## Task Execution Sequence

Execute these prompts **sequentially** in Claude Code Web. Each task builds on the previous one.

### Task 1: Design Multi-Tenant Database Schema with agency_id Isolation
- **Prompt File**: [task-1-database-schema-design.md](task-1-database-schema-design.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 30 minutes
- **Deliverables**:
  - Migration: `supabase/migrations/001_agency_domain/001_agencies_schema.sql`
  - Migration: `supabase/migrations/001_agency_domain/002_users_schema.sql`
  - TypeScript types: `packages/database/src/types/database.types.ts`
- **Validation**:
  - [ ] Tables created in local Supabase
  - [ ] Foreign key constraint enforced
  - [ ] TypeScript types generated
- **Notes**: _Add completion notes here after executing_

---

### Task 2: Set Up Supabase Database Migrations Infrastructure
- **Prompt File**: [task-2-supabase-migrations-infrastructure.md](task-2-supabase-migrations-infrastructure.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 20 minutes
- **Deliverables**:
  - Test script: `supabase/scripts/test-migrations.sh`
  - README: `supabase/migrations/001_agency_domain/README.md`
  - Checklist: `supabase/migrations/MIGRATION_CHECKLIST.md`
- **Validation**:
  - [ ] Migration test script passes
  - [ ] Rollback capability verified
  - [ ] Migrations tracked in Git
- **Notes**: _Add completion notes here after executing_

---

### Task 3: Implement Row-Level Security Policies on Agencies Table
- **Prompt File**: [task-3-rls-policies-agencies-table.md](task-3-rls-policies-agencies-table.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 40 minutes
- **Deliverables**:
  - Migration: `supabase/migrations/001_agency_domain/003_agency_rls.sql`
  - Test script: `supabase/scripts/test-rls-agencies.sql`
- **Validation**:
  - [ ] RLS enabled on agencies table
  - [ ] 4 policies created (SELECT, INSERT, UPDATE, DELETE)
  - [ ] All 8 RLS tests pass
- **Notes**: _Add completion notes here after executing_

---

### Task 4: Implement Row-Level Security Policies on Users Table
- **Prompt File**: [task-4-rls-policies-users-table.md](task-4-rls-policies-users-table.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 45 minutes
- **Deliverables**:
  - Migration: `supabase/migrations/001_agency_domain/004_users_rls.sql`
  - Test script: `supabase/scripts/test-rls-users.sql`
- **Validation**:
  - [ ] RLS enabled on users table
  - [ ] 6 policies created (multi-policy SELECT, INSERT, UPDATE, DELETE)
  - [ ] All 12 RLS tests pass
- **Notes**: _Add completion notes here after executing_

---

### Task 5: Implement agency_id Context Setting Mechanism
- **Prompt File**: [task-5-agency-context-mechanism.md](task-5-agency-context-mechanism.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 50 minutes
- **Deliverables**:
  - Migration: `supabase/migrations/001_agency_domain/005_context_functions.sql`
  - Database package: `packages/database/src/` (client.ts, server.ts, middleware.ts, index.ts)
  - Test script: `supabase/scripts/test-context-mechanism.sql`
- **Validation**:
  - [ ] Database functions created (set_agency_context, get_agency_context, verify_agency_access)
  - [ ] Database package utilities created
  - [ ] Context test script passes
- **Notes**: _Add completion notes here after executing_

---

### Task 6: Create Comprehensive RLS Test Suite
- **Prompt File**: [task-6-comprehensive-rls-test-suite.md](task-6-comprehensive-rls-test-suite.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 40 minutes
- **Deliverables**:
  - Test suite: `supabase/tests/rls-comprehensive-test-suite.sql`
  - Test runner: `supabase/scripts/run-all-tests.sh`
  - CI/CD workflow: `.github/workflows/test-rls.yml`
  - Test results: `supabase/tests/TEST_RESULTS.md`
- **Validation**:
  - [ ] All 12 tests pass
  - [ ] Test runner script works
  - [ ] CI/CD workflow configured
- **Notes**: _Add completion notes here after executing_

---

### Task 7: Document Multi-Tenant Architecture Patterns
- **Prompt File**: [task-7-document-architecture-patterns.md](task-7-document-architecture-patterns.md)
- **Status**: ⏳ Not Started
- **Estimated Time**: 30 minutes
- **Deliverables**:
  - Documentation: `docs/development/rls-policy-patterns.md`
  - Migration template: `supabase/migrations/_TEMPLATE_tenant_scoped_table.sql`
  - Testing guidelines: `docs/development/security-testing-guidelines.md`
  - Database README: `supabase/README.md`
- **Validation**:
  - [ ] RLS policy patterns documented
  - [ ] Migration template created
  - [ ] Security testing guidelines created
  - [ ] Developer README created
- **Notes**: _Add completion notes here after executing_

---

## Overall Progress

**Total Tasks**: 7
**Completed**: 0
**In Progress**: 0
**Not Started**: 7

**Overall Status**: ⏳ Not Started

---

## Acceptance Criteria Tracking

| AC | Description | Status | Validated In |
|----|-------------|--------|--------------|
| AC1 | Database has clear tenant isolation model using agency_id | ⏳ | Task 1, 7 |
| AC2 | RLS policies enabled on all tables containing tenant data | ⏳ | Task 3, 4, 6 |
| AC3 | RLS policies automatically filter queries to current user's agency_id | ⏳ | Task 3, 4, 5 |
| AC4 | No application code can bypass RLS protections | ⏳ | Task 3, 4, 6 |
| AC5 | Database migrations are version-controlled and repeatable | ⏳ | Task 2 |

---

## How to Use This Manifest

1. **Execute tasks in order** - Each task depends on previous tasks
2. **Copy-paste prompts into Claude Code Web** - Open each task file and copy entire content
3. **Update status after completion** - Mark task as completed, add notes
4. **Track deliverables** - Check off each deliverable as it's created
5. **Validate before proceeding** - Ensure all validation steps pass before next task

### Status Legend

- ⏳ Not Started
- 🔄 In Progress
- ✅ Completed
- ❌ Failed
- ⏸️ Blocked

### Updating This Manifest

After completing each task:

```markdown
### Task X: [Task Name]
- **Status**: ✅ Completed
- **Completion Date**: YYYY-MM-DD
- **Actual Time**: XX minutes
- **Notes**: Brief notes about implementation, challenges, or decisions made
```

---

## Prerequisites Checklist

Before starting Task 1, ensure:

- [ ] Story 1.1 (Project Infrastructure Initialization) is fully completed
- [ ] Turborepo monorepo initialized with zones (apps/) and packages (packages/)
- [ ] Supabase local instance running: `npx supabase status`
- [ ] Environment variables configured (.env.local with SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Database connection verified from Next.js app

---

## Story Completion Criteria

Story 1.2 is complete when:

- [ ] All 7 tasks completed
- [ ] All 5 acceptance criteria validated
- [ ] All deliverables created and verified
- [ ] Comprehensive RLS test suite passes (12/12 tests)
- [ ] Documentation complete (RLS patterns, testing guidelines, README)
- [ ] Migrations applied to local Supabase instance
- [ ] TypeScript types generated and integrated

---

## References

- **Story File**: [.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md](../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md)
- **Story Context**: [.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml](../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- **Epic Document**: [docs/epics.md](../../docs/epics.md#Epic-1-Foundation-Multi-Tenant-Security)
- **Architecture Document**: [docs/architecture.md](../../docs/architecture.md#Multi-Tenant-Isolation)
- **PRD**: [docs/PRD.md](../../docs/PRD.md#Multi-Tenancy-Architecture)

---

## Troubleshooting

### Common Issues

**Issue**: Supabase not running
- **Solution**: Run `npx supabase start` from project root

**Issue**: Migration fails to apply
- **Solution**: Run `npx supabase db reset` to reset to clean state

**Issue**: TypeScript types out of sync
- **Solution**: Regenerate types: `npx supabase gen types typescript --local > packages/database/src/types/database.types.ts`

**Issue**: RLS tests failing
- **Solution**: Check test data setup, verify RLS policies applied, ensure user context set correctly

---

**Last Updated**: 2025-11-13
**Version**: 1.0
