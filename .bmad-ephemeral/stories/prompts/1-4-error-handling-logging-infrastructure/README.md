# Story 1.4: Error Handling & Logging Infrastructure - Execution Guide

## Quick Start

This directory contains 7 task-specific prompts for implementing Story 1.4 in Claude Code Web.

### 📋 What's Inside

- **7 Task Prompts**: Individual markdown files for each task
- **MANIFEST.md**: Progress tracking and execution order
- **This README**: Quick start guide

### 🚀 How to Execute

1. **Open Claude Code Web** (https://claude.ai)
2. **Start with Task 1**: Copy [task-1-custom-error-classes.md](task-1-custom-error-classes.md)
3. **Paste into Claude Code Web** and let it implement
4. **Verify completion**: Check files, run tests
5. **Update MANIFEST.md**: Mark task as complete (⏳ → ✅)
6. **Move to Task 2**: Repeat process

### 📦 Task List

Execute in this order:

1. **[Task 1: Create Custom Error Classes](task-1-custom-error-classes.md)** (30-45 min)
   - Custom error classes and API response types

2. **[Task 2: API Route Error Handler Middleware](task-2-api-error-handler-middleware.md)** (45-60 min)
   - Centralized error handling for API routes

3. **[Task 3: Server-Side Logging Utility](task-3-server-side-logging-utility.md)** (45-60 min)
   - Structured logging with context enrichment

4. **[Task 4: React Error Boundaries](task-4-react-error-boundaries.md)** (1-1.5 hrs)
   - Client-side error catching with fallback UI

5. **[Task 5: Error Monitoring Service](task-5-error-monitoring-service.md)** (1-1.5 hrs)
   - Sentry integration for production monitoring

6. **[Task 6: Apply to Existing API Routes](task-6-apply-to-existing-routes.md)** (1-2 hrs)
   - Apply error handling to all API routes

7. **[Task 7: Write Test Suite](task-7-test-suite.md)** (2-3 hrs)
   - Comprehensive testing coverage

**Total Estimated Time**: 8-12 hours

### ✅ Prerequisites

Before starting:
- [ ] Story 1.3 completed (Authentication & Authorization Framework)
- [ ] Turborepo project initialized
- [ ] Next.js/App Router configured
- [ ] Supabase client setup complete
- [ ] Node.js and pnpm installed

### 📝 Progress Tracking

Use [MANIFEST.md](MANIFEST.md) to track:
- Task completion status
- Completion dates
- Acceptance criteria
- Overall progress percentage

### 🔗 Reference Documents

- **Story File**: [1-4-error-handling-logging-infrastructure.md](../../1-4-error-handling-logging-infrastructure.md)
- **Context XML**: [1-4-error-handling-logging-infrastructure.context.xml](../../1-4-error-handling-logging-infrastructure.context.xml)
- **Epic**: [docs/epics.md](../../../../docs/epics.md)
- **Architecture**: [docs/architecture.md](../../../../docs/architecture.md)

### 🎯 Acceptance Criteria

This story is complete when:
- ✅ All API errors return consistent JSON structure with appropriate HTTP status codes
- ✅ Errors logged with sufficient context (user_id, agency_id, timestamp, stack trace)
- ✅ Sensitive data never exposed in error messages
- ✅ Client-side error boundaries catch React errors gracefully
- ✅ Logging integrates with monitoring service (Sentry)

### 💡 Tips

- **Don't skip tasks** - they depend on each other
- **Test after each task** - catch issues early
- **Update manifest** - track your progress
- **Check context XML** - detailed implementation notes
- **Use sequential execution** - avoid parallel tasks

### ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| Missing user context | Ensure auth middleware sets JWT claims |
| Sensitive data leaks | Review sanitization function |
| Stack traces in production | Verify NODE_ENV checks |
| Error boundary not working | Add 'use client' directive |
| Sentry not capturing | Check DSN and enabled flag |

### 🧪 Testing

Each task includes validation steps. Task 7 provides comprehensive test suite:
- Unit tests (Vitest)
- Component tests (React Testing Library)
- Integration tests (API routes)
- E2E tests (Playwright)

### 📊 Story Metrics

- **Complexity**: Medium-High
- **Risk**: Medium (security-critical functionality)
- **Dependencies**: Story 1.3 (blocking)
- **Estimated Time**: 8-12 hours
- **Tasks**: 7
- **Files Created**: ~15+
- **Tests Required**: Yes (comprehensive)

### 🔒 Security Considerations

**Critical Security Requirements:**
- ✅ Never expose stack traces in production
- ✅ Filter sensitive fields (passwords, tokens, keys)
- ✅ Sanitize all error details before sending to client
- ✅ Use generic error messages for unexpected errors
- ✅ Log with user context for audit trail
- ✅ Configure Sentry to filter sensitive data

### 🚧 Blockers

If you encounter blockers:
1. Verify Story 1.3 is complete
2. Check Turborepo structure is correct
3. Ensure Supabase client configured
4. Review architecture.md for patterns
5. Verify environment variables set

### 📞 Support

For questions or issues:
- Review context XML for detailed notes
- Check architecture.md for patterns
- Verify Story 1.3 outputs exist
- Ensure all prerequisites met

### 🏗️ Architecture Overview

**Error Handling Flow:**
```
API Route Error → handleApiError() → Status Code Mapping → JSON Response
                        ↓
                   Log with Context → Console + Sentry
```

**Client Error Flow:**
```
React Error → ErrorBoundary → Fallback UI + Log → Sentry
                    ↓
              Retry / Report Options
```

**Logging Flow:**
```
Log Event → Sanitize Context → Format (JSON/Human) → Console + Sentry
```

### 📦 Package Structure

After completion:
```
packages/
├── utils/
│   └── src/
│       ├── errors.ts              # Custom error classes
│       ├── api-error-handler.ts   # API error middleware
│       ├── logger.ts              # Structured logging
│       ├── sentry.ts              # Sentry utilities
│       └── api-auth.ts            # Auth helpers
└── ui/
    └── src/
        └── components/
            ├── ErrorBoundary.tsx
            ├── PageErrorBoundary.tsx
            └── ComponentErrorBoundary.tsx
```

### 🎓 Learning Resources

- [Next.js Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [Sentry Next.js Docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Structured Logging Best Practices](https://www.datadoghq.com/knowledge-center/structured-logging/)

---

**Ready to start?** Open [task-1-custom-error-classes.md](task-1-custom-error-classes.md) and copy it into Claude Code Web!
