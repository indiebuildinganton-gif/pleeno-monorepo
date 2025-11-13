# Story 1.3: Authentication & Authorization Framework - Execution Guide

## Quick Start

This directory contains 8 task-specific prompts for implementing Story 1.3 in Claude Code Web.

### 📋 What's Inside

- **8 Task Prompts**: Individual markdown files for each task
- **MANIFEST.md**: Progress tracking and execution order
- **This README**: Quick start guide

### 🚀 How to Execute

1. **Open Claude Code Web** (https://claude.ai)
2. **Start with Task 1**: Copy [task-1-supabase-auth-integration.md](task-1-supabase-auth-integration.md)
3. **Paste into Claude Code Web** and let it implement
4. **Verify completion**: Check files, run tests
5. **Update MANIFEST.md**: Mark task as complete (⏳ → ✅)
6. **Move to Task 2**: Repeat process

### 📦 Task List

Execute in this order:

1. **[Task 1: Supabase Auth Integration](task-1-supabase-auth-integration.md)** (30-45 min)
   - Setup environment and client libraries

2. **[Task 2: User Registration Flow](task-2-user-registration-flow.md)** (1-1.5 hrs)
   - Signup API and page

3. **[Task 3: Login/Logout Flows](task-3-login-logout-flows.md)** (1-1.5 hrs)
   - Login, logout, password reset

4. **[Task 4: Role-Based Access Control](task-4-role-based-access-control.md)** (45-60 min)
   - RBAC utilities and middleware

5. **[Task 5: Authentication Middleware](task-5-authentication-middleware.md)** (45-60 min)
   - Route protection

6. **[Task 6: Agency Context Setting](task-6-agency-context-setting.md)** (45-60 min)
   - RLS context propagation

7. **[Task 7: Auth UI Components](task-7-auth-ui-components.md)** (1.5-2 hrs)
   - Reusable auth forms

8. **[Task 8: Authentication Test Suite](task-8-authentication-test-suite.md)** (2-3 hrs)
   - Comprehensive testing

**Total Estimated Time**: 9-13 hours

### ✅ Prerequisites

Before starting:
- [ ] Story 1.2 completed (multi-tenant database with RLS)
- [ ] Supabase project configured
- [ ] Next.js/Turborepo project initialized
- [ ] Node.js and pnpm installed

### 📝 Progress Tracking

Use [MANIFEST.md](MANIFEST.md) to track:
- Task completion status
- Completion dates
- Acceptance criteria
- Overall progress percentage

### 🔗 Reference Documents

- **Story File**: [1-3-authentication-authorization-framework.md](../../1-3-authentication-authorization-framework.md)
- **Context XML**: [1-3-authentication-authorization-framework.context.xml](../../1-3-authentication-authorization-framework.context.xml)
- **Epic**: [docs/epics.md](../../../../docs/epics.md)
- **Architecture**: [docs/architecture.md](../../../../docs/architecture.md)

### 🎯 Acceptance Criteria

This story is complete when:
- ✅ Users can register, log in, and log out securely
- ✅ Sessions managed with JWT in HTTP-only cookies
- ✅ RBAC distinguishes Agency Admin vs Agency User
- ✅ Middleware protects all routes
- ✅ agency_id automatically set in RLS context

### 💡 Tips

- **Don't skip tasks** - they depend on each other
- **Test after each task** - catch issues early
- **Update manifest** - track your progress
- **Check context XML** - detailed implementation notes
- **Use sequential execution** - avoid parallel tasks

### ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| JWT missing agency_id | Verify Task 2 sets app_metadata |
| RLS not filtering | Ensure Task 6 context setting called |
| Middleware loops | Check Task 5 route matching |
| Cookie problems | Verify HTTP-only and SameSite flags |

### 🧪 Testing

Each task includes validation steps. Task 8 provides comprehensive test suite:
- Unit tests (Vitest)
- Integration tests (API routes)
- E2E tests (Playwright)

### 📊 Story Metrics

- **Complexity**: High
- **Risk**: Medium (RLS and auth are security-critical)
- **Dependencies**: Story 1.2 (blocking)
- **Estimated Time**: 9-13 hours
- **Tasks**: 8
- **Files Created**: ~20+
- **Tests Required**: Yes (comprehensive)

### 🚧 Blockers

If you encounter blockers:
1. Check prerequisites are met
2. Review Story 1.2 completion
3. Verify Supabase configuration
4. Consult architecture.md for patterns

### 📞 Support

For questions or issues:
- Review context XML for detailed notes
- Check architecture.md for patterns
- Verify Story 1.2 outputs exist
- Ensure all prerequisites met

---

**Ready to start?** Open [task-1-supabase-auth-integration.md](task-1-supabase-auth-integration.md) and copy it into Claude Code Web!
