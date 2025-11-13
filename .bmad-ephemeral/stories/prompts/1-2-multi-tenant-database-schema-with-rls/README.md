# Story 1.2 Development Prompts for Claude Code Web

**Story**: Multi-Tenant Database Schema with RLS
**Epic**: 1 - Foundation & Multi-Tenant Security
**Generated**: 2025-11-13

## Overview

This directory contains **7 task-specific prompts** for implementing Story 1.2 in Claude Code Web. Each prompt is a complete, self-contained specification for a single development task.

## Quick Start

### 1. Prerequisites

Before starting, ensure Story 1.1 is complete:
- ✅ Turborepo monorepo initialized
- ✅ Supabase local instance running (`npx supabase status`)
- ✅ Environment variables configured

### 2. Execution Process

1. Open [MANIFEST.md](MANIFEST.md) to track progress
2. Start with Task 1, execute prompts **sequentially**
3. Copy entire prompt file content into Claude Code Web
4. Complete all deliverables before moving to next task
5. Update MANIFEST.md status after each task

### 3. Task Sequence

Execute in this exact order:

```
Task 1: Database Schema Design (30 min)
   ↓
Task 2: Migrations Infrastructure (20 min)
   ↓
Task 3: RLS Policies - Agencies (40 min)
   ↓
Task 4: RLS Policies - Users (45 min)
   ↓
Task 5: Agency Context Mechanism (50 min)
   ↓
Task 6: Comprehensive RLS Test Suite (40 min)
   ↓
Task 7: Document Architecture Patterns (30 min)
```

**Total Estimated Time**: ~4 hours

## File Structure

```
.bmad-ephemeral/prompts/story-1-2/
├── README.md                                    # This file
├── MANIFEST.md                                  # Progress tracking
├── task-1-database-schema-design.md             # Prompt 1
├── task-2-supabase-migrations-infrastructure.md # Prompt 2
├── task-3-rls-policies-agencies-table.md        # Prompt 3
├── task-4-rls-policies-users-table.md           # Prompt 4
├── task-5-agency-context-mechanism.md           # Prompt 5
├── task-6-comprehensive-rls-test-suite.md       # Prompt 6
└── task-7-document-architecture-patterns.md     # Prompt 7
```

## What Each Task Delivers

### Task 1: Database Schema Design
Creates core multi-tenant database tables with agency_id foreign keys.

**Deliverables**:
- `supabase/migrations/001_agency_domain/001_agencies_schema.sql`
- `supabase/migrations/001_agency_domain/002_users_schema.sql`
- `packages/database/src/types/database.types.ts`

### Task 2: Migrations Infrastructure
Sets up robust migration management with testing and rollback capability.

**Deliverables**:
- `supabase/scripts/test-migrations.sh`
- `supabase/migrations/001_agency_domain/README.md`
- `supabase/migrations/MIGRATION_CHECKLIST.md`

### Task 3: RLS Policies - Agencies
Enables Row-Level Security on agencies table with complete policy coverage.

**Deliverables**:
- `supabase/migrations/001_agency_domain/003_agency_rls.sql`
- `supabase/scripts/test-rls-agencies.sql`

### Task 4: RLS Policies - Users
Implements multi-policy RLS on users table (agency isolation + self-access).

**Deliverables**:
- `supabase/migrations/001_agency_domain/004_users_rls.sql`
- `supabase/scripts/test-rls-users.sql`

### Task 5: Agency Context Mechanism
Creates database functions and TypeScript utilities for context management.

**Deliverables**:
- `supabase/migrations/001_agency_domain/005_context_functions.sql`
- `packages/database/src/client.ts`
- `packages/database/src/server.ts`
- `packages/database/src/middleware.ts`
- `packages/database/src/index.ts`
- `supabase/scripts/test-context-mechanism.sql`

### Task 6: Comprehensive RLS Test Suite
Consolidates all RLS tests into automated suite with CI/CD integration.

**Deliverables**:
- `supabase/tests/rls-comprehensive-test-suite.sql`
- `supabase/scripts/run-all-tests.sh`
- `.github/workflows/test-rls.yml`
- `supabase/tests/TEST_RESULTS.md`

### Task 7: Document Architecture Patterns
Documents RLS patterns, templates, and best practices for future development.

**Deliverables**:
- `docs/development/rls-policy-patterns.md`
- `supabase/migrations/_TEMPLATE_tenant_scoped_table.sql`
- `docs/development/security-testing-guidelines.md`
- `supabase/README.md`

## Acceptance Criteria Coverage

| AC | Description | Validated In |
|----|-------------|--------------|
| AC1 | Database has clear tenant isolation model using agency_id | Task 1, 7 |
| AC2 | RLS policies enabled on all tables containing tenant data | Task 3, 4, 6 |
| AC3 | RLS policies automatically filter queries to current user's agency_id | Task 3, 4, 5 |
| AC4 | No application code can bypass RLS protections | Task 3, 4, 6 |
| AC5 | Database migrations are version-controlled and repeatable | Task 2 |

## Tips for Success

### Using Prompts in Claude Code Web

1. **Copy entire prompt file**: Don't skip any sections
2. **Follow instructions exactly**: Prompts include validation steps
3. **Check deliverables**: Ensure all files created before proceeding
4. **Run verification commands**: Test each task completion
5. **Update MANIFEST.md**: Track progress and add notes

### Common Issues

**Issue**: Prompt seems incomplete
- **Solution**: Ensure you copied the entire file, including all code blocks

**Issue**: Task fails validation
- **Solution**: Review error messages, check prerequisites completed

**Issue**: Not sure what to do next
- **Solution**: Check MANIFEST.md for current task status and next step

### Workflow Pattern

```bash
# For each task:

1. Open task-{N}-{name}.md in editor
2. Copy entire content
3. Paste into Claude Code Web
4. Wait for completion
5. Run validation commands
6. Update MANIFEST.md status
7. Add completion notes
8. Proceed to next task
```

## Quality Checklist

Before marking story as complete:

- [ ] All 7 tasks completed
- [ ] All 5 acceptance criteria validated
- [ ] Comprehensive RLS test suite passes (12/12 tests)
- [ ] All migrations applied successfully
- [ ] TypeScript types generated and integrated
- [ ] Documentation complete
- [ ] MANIFEST.md fully updated

## References

- **Story File**: [.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md](../../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.md)
- **Story Context**: [.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml](../../.bmad-ephemeral/stories/1-2-multi-tenant-database-schema-with-rls.context.xml)
- **Epic**: [docs/epics.md](../../../docs/epics.md)
- **Architecture**: [docs/architecture.md](../../../docs/architecture.md)
- **PRD**: [docs/PRD.md](../../../docs/PRD.md)

## Support

If you encounter issues:
1. Check task prerequisites
2. Review validation commands
3. Consult MANIFEST.md troubleshooting section
4. Verify Story 1.1 completion

---

**Ready to start?** → Open [MANIFEST.md](MANIFEST.md) and begin with Task 1!
