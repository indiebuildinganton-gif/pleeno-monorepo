# Story 2.1: Agency Profile Setup

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to configure my agency's profile with basic information**,
so that **my agency identity is established in the system and my team knows which agency they're working in**.

## Acceptance Criteria

1. **Given** I am an authenticated Agency Admin, **When** I access the agency settings page, **Then** I can view and edit my agency's name, contact information, default currency, and timezone

2. **And** changes are saved to the database with proper validation

3. **And** the agency name appears in the application header/navigation

4. **And** all timestamps display in the agency's configured timezone

## Tasks / Subtasks

- [ ] Extend agencies table with profile fields (AC: 1, 2)
  - [ ] Add migration for: name, contact_email, contact_phone, currency (default: AUD), timezone
  - [ ] Add validation constraints: name (required, max 255 chars), currency (enum or varchar), timezone (valid timezone string)
  - [ ] Test migration rollback for safety

- [ ] Create agency settings API endpoint (AC: 1, 2)
  - [ ] Implement PATCH /api/agencies/[id] route
  - [ ] Validate required fields: name, currency, timezone
  - [ ] Enforce authorization: only Agency Admins can edit agency settings
  - [ ] Return updated agency data or validation errors

- [ ] Build agency settings UI page (AC: 1)
  - [ ] Create /settings/agency page component
  - [ ] Build form with fields: name, contact_email, contact_phone, currency dropdown, timezone dropdown
  - [ ] Implement form validation on client side
  - [ ] Display success/error messages after save
  - [ ] Disable form during submission (loading state)

- [ ] Display agency name in header/navigation (AC: 3)
  - [ ] Fetch current agency data on app load
  - [ ] Display agency name in application header component
  - [ ] Update header when agency name changes (reactive state)

- [ ] Implement timezone-aware timestamp display (AC: 4)
  - [ ] Create utility function to convert UTC timestamps to agency timezone
  - [ ] Update all timestamp display components to use timezone utility
  - [ ] Test with various timezones (UTC, US Eastern, Australian Eastern, etc.)

- [ ] Add comprehensive tests
  - [ ] Unit tests: API validation logic, timezone conversion utility
  - [ ] Integration tests: PATCH /api/agencies/[id] with valid/invalid data
  - [ ] E2E tests: Load settings page, edit fields, save, verify persistence

## Dev Notes

### Prerequisites and Dependencies

**Depends on:**
- Story 1.3: Authentication & Authorization Framework (auth middleware, user roles)
- Agencies table exists with agency_id as primary tenant key

**Provides foundation for:**
- Story 2.2: User Invitation System (uses agency_id and agency settings)
- All subsequent stories requiring agency context

### Technical Implementation Details

**Database Schema:**
```sql
-- Extend agencies table (migration)
ALTER TABLE agencies ADD COLUMN name VARCHAR(255) NOT NULL;
ALTER TABLE agencies ADD COLUMN contact_email VARCHAR(255);
ALTER TABLE agencies ADD COLUMN contact_phone VARCHAR(50);
ALTER TABLE agencies ADD COLUMN currency VARCHAR(10) DEFAULT 'AUD' NOT NULL;
ALTER TABLE agencies ADD COLUMN timezone VARCHAR(100) DEFAULT 'Australia/Sydney' NOT NULL;
```

**API Route Structure:**
- Route: `PATCH /app/api/agencies/[id]/route.ts`
- Authorization: Require authenticated user with `agency_admin` role
- Validation: Use Zod or similar for schema validation
- RLS: Ensure user's agency_id matches requested agency ID

**Timezone Handling:**
- Use `date-fns-tz` or `moment-timezone` for timezone conversions
- Store all dates in UTC in database
- Convert to agency timezone only for display
- Common timezones to test: UTC, America/New_York, Australia/Sydney, Europe/London

**Currency Options (MVP):**
- AUD (Australian Dollar) - default
- USD (US Dollar)
- GBP (British Pound)
- CAD (Canadian Dollar)
- NZD (New Zealand Dollar)
- EUR (Euro)

### Architecture Patterns and Constraints

**Multi-Tenant Security:**
- RLS policies on agencies table ensure users only access their own agency
- API endpoint must verify: `req.user.agency_id === params.id`
- Never trust client-provided agency_id - always use authenticated user's agency_id

**State Management:**
- Agency profile should be loaded on app initialization (client-side context)
- Use React Context or state management library (Zustand, Recoil) to share agency data
- Update context when agency profile changes

**Form Patterns:**
- Use controlled form components (React Hook Form recommended)
- Client-side validation mirrors server-side validation (DRY principle)
- Optimistic UI updates for better UX (update UI immediately, rollback on error)

### Testing Standards

**Unit Tests:**
- Timezone conversion utility with various timezone inputs
- API validation logic (valid/invalid inputs)
- Form validation logic

**Integration Tests:**
- PATCH /api/agencies/[id] with authenticated admin user → Success
- PATCH /api/agencies/[id] with non-admin user → 403 Forbidden
- PATCH /api/agencies/[id] with invalid data → 400 Bad Request with error details
- PATCH /api/agencies/[id] for different agency → 403 Forbidden (RLS enforced)

**E2E Tests:**
- Login as admin → Navigate to /settings/agency → Edit name → Save → Verify name updated in header
- Edit timezone → Verify timestamps display in new timezone
- Invalid form submission → Verify error messages displayed

### Project Structure Notes

**New Files to Create:**
- `/app/settings/agency/page.tsx` - Agency settings page component
- `/app/api/agencies/[id]/route.ts` - API endpoint for PATCH requests
- `/lib/timezone.ts` - Timezone conversion utilities
- `/components/AgencyHeader.tsx` - Header component displaying agency name (or update existing header)
- `/types/agency.ts` - TypeScript types for Agency model

**Files to Modify:**
- Database migration file (e.g., `migrations/002_add_agency_profile_fields.sql`)
- Root layout or header component to display agency name

**Folder Structure Alignment:**
- Follows Next.js 14 App Router conventions (/app for pages and API routes)
- Follows established structure from Story 1.1 (/lib, /components, /types)

### References

- [Source: docs/epics.md#Story-2.1-Agency-Profile-Setup]
- [Source: docs/PRD.md#FR-2-Agency-Management - Agency Profile requirements]
- [Source: docs/PRD.md#Multi-Tenancy-Architecture - RLS enforcement]
- [Source: docs/PRD.md#Role-Based-Access-Control - Admin vs Agency User permissions]

### Learnings from Previous Story

**From Story 1-1-project-infrastructure-initialization (Status: ready-for-dev)**

This is the first story in Epic 2, but we have learnings from Epic 1:

**Infrastructure Established:**
- Next.js 14+ with App Router is now the foundation
- TypeScript with strict mode is configured
- PostgreSQL database is set up (likely Supabase based on story notes)
- Folder structure exists: `/app`, `/lib`, `/components`, `/types`
- ESLint, Prettier, and pre-commit hooks are configured

**Key Takeaways for This Story:**
- Use existing project structure conventions (follow Story 1.1 patterns)
- Database migrations should follow established migration system
- TypeScript strict mode is enabled - ensure all types are properly defined
- Code quality tools (ESLint, Prettier) will enforce standards - configure for new files
- RLS foundation is in place - build on top of existing database setup

**Files to Reuse (Not Recreate):**
- Database connection configuration (already exists from Story 1.1)
- Base Next.js App Router structure (already exists)
- TypeScript configuration (already established)
- Code quality tooling (ESLint, Prettier configs exist)

**Development Workflow:**
- Follow the development workflow established in Story 1.1
- Use the same deployment pipeline (Vercel/Railway)
- Follow the same testing patterns (when testing infrastructure is added)

[Source: .bmad-ephemeral/stories/1-1-project-infrastructure-initialization.md#Dev-Notes]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/2-1-agency-profile-setup.context.xml](.bmad-ephemeral/stories/2-1-agency-profile-setup.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
