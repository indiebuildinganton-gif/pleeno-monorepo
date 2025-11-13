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

- [ ] Create agency settings page and form components (AC: 1, 2)
  - [ ] Create apps/agency/app/settings/page.tsx with agency settings form
  - [ ] Implement form fields: name (required), contact_email (required), contact_phone (optional), currency (dropdown), timezone (dropdown)
  - [ ] Add validation using React Hook Form + Zod schema
  - [ ] Display current agency values pre-filled in form
  - [ ] Add Save button with loading state

- [ ] Implement API route for updating agency settings (AC: 1, 2)
  - [ ] Create apps/agency/app/api/agencies/[id]/route.ts
  - [ ] Implement PATCH handler for updating agency
  - [ ] Validate request body with Zod schema
  - [ ] Check user role = 'agency_admin' before allowing updates
  - [ ] Use Supabase RLS to enforce agency_id filtering
  - [ ] Return updated agency data in standardized response format
  - [ ] Add error handling with handleApiError()

- [ ] Create agency validation schema (AC: 2)
  - [ ] Create packages/validations/src/agency.schema.ts
  - [ ] Define AgencyUpdateSchema with required fields (name, contact_email)
  - [ ] Validate currency (AUD, USD, EUR, GBP, etc.)
  - [ ] Validate timezone (use date-fns timezone list)
  - [ ] Validate email format
  - [ ] Validate phone number format (optional)
  - [ ] Export TypeScript types from schema

- [ ] Display agency name in application header (AC: 3)
  - [ ] Update apps/shell/app/layout.tsx root layout
  - [ ] Fetch current agency data from Supabase
  - [ ] Create Header component displaying agency name
  - [ ] Use shared UI component from packages/ui
  - [ ] Handle loading and error states

- [ ] Implement timezone-aware date formatting (AC: 4)
  - [ ] Create packages/utils/src/date-helpers.ts
  - [ ] Implement formatDateInAgencyTimezone() function using date-fns-tz
  - [ ] Use agency timezone from user session context
  - [ ] Create helper for relative timestamps ("2 hours ago", "yesterday")
  - [ ] Export utilities for use across zones
  - [ ] Write unit tests for timezone conversion

- [ ] Add role-based access control for settings page (AC: 1)
  - [ ] Implement requireRole() check in settings page
  - [ ] Redirect non-admin users to dashboard with error message
  - [ ] Display "Admin Only" badge on settings nav item for non-admins
  - [ ] Test access control with agency_user role

- [ ] Write tests for agency settings feature (AC: 1, 2, 3, 4)
  - [ ] Test: Agency admin can view settings page
  - [ ] Test: Agency user cannot access settings page (403)
  - [ ] Test: Form validation works (required fields, email format)
  - [ ] Test: API route updates agency successfully
  - [ ] Test: API route rejects invalid data (400)
  - [ ] Test: Agency name displays in header after save
  - [ ] Test: Timezone conversion works correctly
  - [ ] Test: RLS prevents cross-agency access

## Dev Notes

### Agency Profile Architecture

**Form Design:**
- Simple single-page form (not wizard)
- Pre-populated with current agency values from database
- Save button triggers optimistic UI update
- Success/error toast notifications
- Automatic redirect after successful save (optional)

**Fields:**
- **name** (TEXT, required): Agency display name
- **contact_email** (TEXT, required): Primary agency contact email
- **contact_phone** (TEXT, optional): Agency phone number
- **currency** (TEXT, required, default: 'AUD'): Default currency for payment plans
- **timezone** (TEXT, required, default: 'Australia/Brisbane'): Agency timezone for all timestamps

**Currency Options:**
- AUD (Australian Dollar) - default
- USD (US Dollar)
- EUR (Euro)
- GBP (British Pound)
- NZD (New Zealand Dollar)
- CAD (Canadian Dollar)

**Timezone Handling:**
- All database timestamps stored in UTC
- Display timestamps converted to agency timezone
- Use date-fns-tz for conversion: `formatInTimeZone(date, timezone, format)`
- Agency timezone stored in agencies table
- Timezone fetched from user session context

**Role-Based Access:**
- Only **agency_admin** role can edit agency settings
- **agency_user** role redirected with "Access Denied" message
- Use requireRole('agency_admin') helper from packages/auth

### Project Structure Notes

**Agency Settings Location:**
```
apps/agency/
├── app/
│   ├── settings/
│   │   ├── page.tsx              # Agency settings form page
│   │   └── components/
│   │       └── AgencyForm.tsx    # Form component
│   └── api/
│       └── agencies/
│           └── [id]/
│               └── route.ts      # PATCH /api/agencies/:id
```

**Shared Packages:**
```
packages/validations/
└── src/
    └── agency.schema.ts          # Zod validation schema

packages/utils/
└── src/
    └── date-helpers.ts           # Timezone utilities

packages/auth/
└── src/
    └── utils/
        └── require-role.ts       # Role check helper
```

**Header Integration:**
```
apps/shell/
└── app/
    ├── layout.tsx                # Root layout with header
    └── components/
        └── Header.tsx            # Header showing agency name
```

### Architecture Alignment

**From Architecture Document (architecture.md):**

**Agencies Table Schema (Section: Data Architecture - Agency Domain):**
```sql
CREATE TABLE agencies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  currency TEXT DEFAULT 'AUD',
  timezone TEXT DEFAULT 'Australia/Brisbane',
  due_soon_threshold_days INT DEFAULT 4,
  overdue_cutoff_time TIME DEFAULT '17:00',
  subscription_tier TEXT CHECK (subscription_tier IN ('basic', 'premium', 'enterprise')) DEFAULT 'basic',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policy for Agency Access:**
```sql
CREATE POLICY "Users can view their own agency"
  ON agencies FOR SELECT
  USING (id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage users in their agency"
  ON users FOR ALL
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );
```

**API Route Pattern (from architecture.md - API Routes section):**
```typescript
// apps/agency/app/api/agencies/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError } from '@pleeno/utils'
import { AgencyUpdateSchema } from '@pleeno/validations'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerClient()

    // Verify user is admin of this agency
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    if (userData?.agency_id !== params.id) {
      throw new ForbiddenError('Cannot update other agency')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = AgencyUpdateSchema.parse(body)

    // Update agency (RLS handles security)
    const { data: agency, error } = await supabase
      .from('agencies')
      .update({
        name: validatedData.name,
        contact_email: validatedData.contact_email,
        contact_phone: validatedData.contact_phone,
        currency: validatedData.currency,
        timezone: validatedData.timezone,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: agency
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Timezone Helper (from architecture.md):**
```typescript
// packages/utils/src/date-helpers.ts
import { formatInTimeZone } from 'date-fns-tz'

export function formatDateInAgencyTimezone(
  date: Date | string,
  timezone: string,
  format: string = 'PPpp'
): string {
  return formatInTimeZone(date, timezone, format)
}

export function getRelativeTime(date: Date | string): string {
  const now = new Date()
  const target = new Date(date)
  const diffMs = now.getTime() - target.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}
```

**Form Component with React Hook Form:**
```typescript
// apps/agency/app/settings/components/AgencyForm.tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AgencyUpdateSchema } from '@pleeno/validations'
import type { z } from 'zod'

type AgencyFormData = z.infer<typeof AgencyUpdateSchema>

export function AgencyForm({ agency }: { agency: AgencyFormData }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AgencyFormData>({
    resolver: zodResolver(AgencyUpdateSchema),
    defaultValues: agency
  })

  const onSubmit = async (data: AgencyFormData) => {
    const response = await fetch(`/api/agencies/${agency.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      // Handle error
      return
    }

    // Show success toast
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Agency Name *</label>
        <input {...register('name')} />
        {errors.name && <span>{errors.name.message}</span>}
      </div>

      <div>
        <label>Contact Email *</label>
        <input type="email" {...register('contact_email')} />
        {errors.contact_email && <span>{errors.contact_email.message}</span>}
      </div>

      <div>
        <label>Contact Phone</label>
        <input {...register('contact_phone')} />
      </div>

      <div>
        <label>Currency *</label>
        <select {...register('currency')}>
          <option value="AUD">AUD - Australian Dollar</option>
          <option value="USD">USD - US Dollar</option>
          <option value="EUR">EUR - Euro</option>
          <option value="GBP">GBP - British Pound</option>
          <option value="NZD">NZD - New Zealand Dollar</option>
          <option value="CAD">CAD - Canadian Dollar</option>
        </select>
      </div>

      <div>
        <label>Timezone *</label>
        <select {...register('timezone')}>
          <option value="Australia/Brisbane">Australia/Brisbane</option>
          <option value="Australia/Sydney">Australia/Sydney</option>
          <option value="Australia/Melbourne">Australia/Melbourne</option>
          <option value="America/New_York">America/New_York</option>
          <option value="Europe/London">Europe/London</option>
          {/* Add more timezones as needed */}
        </select>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  )
}
```

### Learnings from Previous Story

**From Story 1.4: Error Handling & Logging Infrastructure (Status: ready-for-dev)**

Story 1.4 has not yet been implemented, but establishes critical error handling patterns that this story must use:

**Expected Error Handling Infrastructure:**
- **Custom error classes:** UnauthorizedError, ForbiddenError, ValidationError
- **API error handler:** handleApiError() middleware for consistent error responses
- **Error logging:** Structured logging with user context
- **Error format:** Standardized JSON response format

**Integration Points for This Story:**
- **API route:** Use handleApiError() in catch blocks
- **Validation errors:** Throw ValidationError for invalid input
- **Auth errors:** Throw UnauthorizedError when not authenticated
- **Permission errors:** Throw ForbiddenError when user is not admin
- **Logging:** Use logger utility to log agency updates with context

**What This Story Depends On from 1.4:**
- packages/utils/src/errors.ts (custom error classes)
- packages/utils/src/api-error-handler.ts (handleApiError function)
- packages/utils/src/logger.ts (structured logging)
- Error response format: `{ success: false, error: { code, message, details } }`

**Validation Before Starting:**
- Confirm Story 1.4 is complete:
  - [ ] packages/utils/src/errors.ts exists with custom error classes
  - [ ] packages/utils/src/api-error-handler.ts exists with handleApiError()
  - [ ] packages/utils/src/logger.ts exists for logging
  - [ ] Error handling tested and working in existing API routes
- If Story 1.4 incomplete: implement error handling inline or skip advanced error handling

[Source: .bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.md]

### Security Considerations

**Access Control:**
- Only agency_admin role can edit agency settings
- Use requireRole() helper to enforce access
- Redirect non-admins to dashboard with clear error message
- API route validates user role before allowing updates

**Data Validation:**
- Validate all inputs with Zod schema
- Sanitize email and phone inputs
- Validate currency against whitelist
- Validate timezone against valid timezone list
- Prevent injection attacks with parameterized queries (handled by Supabase)

**RLS Protection:**
- Supabase RLS policies enforce agency_id filtering automatically
- Users can only view/update their own agency
- No application-level agency_id bypass possible
- Test RLS with multiple agencies to confirm isolation

**Sensitive Data:**
- Contact email is not PII but should be validated
- Phone number optional and should follow format validation
- No passwords or tokens in agency profile
- Audit log all agency setting changes (Epic 8)

### Testing Strategy

**Unit Tests:**
1. **Validation Schema:**
   - Valid data passes validation
   - Invalid email rejected
   - Invalid currency rejected
   - Invalid timezone rejected
   - Required fields enforced

2. **Date Helpers:**
   - formatDateInAgencyTimezone() converts correctly
   - getRelativeTime() returns correct relative strings
   - Timezone conversions accurate

**Integration Tests:**
1. **API Route:**
   - Admin can update agency successfully (200)
   - User cannot update agency (403)
   - Unauthenticated request fails (401)
   - Invalid data returns validation error (400)
   - RLS prevents cross-agency updates

2. **Settings Page:**
   - Admin can access settings page
   - User redirected from settings page
   - Form displays current agency values
   - Form submission updates agency
   - Success toast displayed
   - Validation errors displayed

3. **Header Display:**
   - Agency name displays in header
   - Header updates after agency name change
   - Loading state handled gracefully

**E2E Tests:**
1. **Agency Settings Flow:**
   - Login as admin
   - Navigate to settings page
   - Update agency name and timezone
   - Save changes
   - Verify name displays in header
   - Verify timestamps use new timezone
   - Logout and login to confirm persistence

### References

- [Source: docs/epics.md#Story-2.1-Agency-Profile-Setup]
- [Source: docs/architecture.md#Data-Architecture - agencies table schema]
- [Source: docs/architecture.md#Project-Structure - apps/agency zone structure]
- [Source: docs/architecture.md#Implementation-Patterns - API route patterns]
- [Source: docs/PRD.md#Epic-2-Agency-&-User-Management - business requirements]
- [Source: .bmad-ephemeral/stories/1-4-error-handling-logging-infrastructure.md - error handling integration]

## Dev Agent Record

### Context Reference

- [2-1-agency-profile-setup.context.xml](.bmad-ephemeral/stories/2-1-agency-profile-setup.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- **2025-11-13:** Story created from epics.md via create-story workflow
