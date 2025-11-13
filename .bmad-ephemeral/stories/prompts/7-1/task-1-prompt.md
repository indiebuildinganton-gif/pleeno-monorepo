# Task 1: Create Reports Zone Foundation

**Story:** 7.1 - Payment Plans Report Generator with Contract Expiration Tracking
**Acceptance Criteria:** AC #1

---

## Task Overview

Create the foundation for a new Reports microfrontend zone at `apps/reports/` with proper routing, configuration, and basic structure.

---

## Requirements

### Directory Structure
Create the following structure:
```
apps/reports/
├── app/
│   ├── page.tsx                    # Reports landing page
│   ├── layout.tsx                  # Reports navigation/layout
│   └── components/                 # Shared report components
├── next.config.js                  # Reports zone config
└── package.json                    # Reports zone dependencies
```

### Implementation Details

1. **Create Reports Zone Configuration**
   - Create `apps/reports/next.config.js` with `basePath: '/reports'`
   - Configure standalone build with shared packages
   - Follow Next.js 15 App Router conventions

2. **Create Reports Landing Page**
   - Create `apps/reports/app/page.tsx`
   - Display "Reports" heading
   - Add link to "Payment Plans Report" (will be implemented in later tasks)
   - Use Shadcn UI components for consistent styling

3. **Create Reports Layout**
   - Create `apps/reports/app/layout.tsx`
   - Include navigation for future report types
   - Use shared layout patterns from other zones if available

4. **Update Shell Zone Routing**
   - Add `/reports/*` routing in `apps/shell/middleware.ts`
   - Add reports zone rewrite in `apps/shell/next.config.js`

5. **Test Zone Routing**
   - Verify `/reports` loads correctly
   - Verify navigation between shell and reports zone works

---

## Technical Constraints

- **Multi-Zone Architecture:** New zone at `apps/reports/` with `basePath: /reports`
- **TypeScript Strict Mode:** All code must be TypeScript with strict mode
- **Shared Packages:** Use `packages/ui` for Shadcn UI components
- **Next.js 15 App Router:** Use Server Components by default

---

## Acceptance Criteria

✅ Reports zone directory structure created
✅ Next.js config with basePath set to `/reports`
✅ Reports landing page with "Payment Plans Report" link
✅ Shell middleware configured to route `/reports/*`
✅ Zone routing tested and working

---

## Context Files

- Story Context: `.bmad-ephemeral/stories/7-1-payment-plans-report-generator-with-contract-expiration-tracking.context.xml`
- Architecture Docs: `docs/architecture.md` (Reports Zone Architecture section)

---

## Output

After implementing:
1. Confirm zone structure created
2. Show the landing page code
3. Confirm routing configuration
4. Test URL: Navigate to `/reports` and verify it loads
