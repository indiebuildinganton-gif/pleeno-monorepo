# Story 3.1: College Registry

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to create and manage a registry of colleges, their branch locations, and contact information**,
so that **I can associate students and payment plans with specific institutions, track commissions by branch, monitor GST status, and maintain contact details for each college**.

## Acceptance Criteria

1. **Given** I am an authenticated Agency Admin, **When** I access the colleges management page, **Then** I can view all colleges in my agency

2. **And** I can create a new college with name, city, default commission rate, and GST status

3. **And** I can edit existing college information (Admin only)

4. **And** I can toggle GST status between "Included" and "Excluded"

5. **And** I can add branches to a college with branch name and city

6. **And** the default commission rate is automatically prefilled for new branches (editable before saving)

7. **And** branches are displayed as clickable links showing "College Name — Branch City"

8. **And** each branch has an associated commission rate (percentage)

9. **Given** I am managing a college, **When** I need to add contacts, **Then** I can add multiple contacts with name, role/department, position/title, email, and phone

10. **And** contacts display the role/department in parentheses after the name (e.g., "Lina Perez (College)")

11. **And** contacts show position/title below the name (e.g., "Accountant")

12. **And** I can edit or delete existing contacts (Admin only)

13. **And** contact changes are logged in the activity feed

14. **Given** I am viewing a college detail page, **When** I interact with the activity section, **Then** I can see recent changes to the college (e.g., GST status changes, field updates)

15. **And** I can filter activity by time period (e.g., "Last 30 days")

16. **And** I can search within the activity log

17. **Given** I am viewing a college detail page, **When** I use the notes section, **Then** I can add notes up to 2,000 characters

18. **And** I can see a character counter (e.g., "0 / 2,000")

19. **And** notes are saved with timestamp and user attribution

## Tasks / Subtasks

- [ ] Create colleges domain database schema (AC: 1, 2, 3, 4)
  - [ ] Create supabase/migrations/002_entities_domain/001_colleges_schema.sql
  - [ ] Create colleges table with fields:
    - id UUID PRIMARY KEY
    - agency_id UUID REFERENCES agencies(id)
    - name TEXT NOT NULL
    - city TEXT
    - default_commission_rate_percent DECIMAL(5,2) CHECK (0-100)
    - gst_status TEXT CHECK IN ('included', 'excluded') DEFAULT 'included'
    - created_at, updated_at TIMESTAMPTZ
  - [ ] Create unique index on (agency_id, name) to prevent duplicate colleges
  - [ ] Add RLS policies for agency_id filtering
  - [ ] Create admin-only RLS policy for INSERT/UPDATE/DELETE operations

- [ ] Create branches schema (AC: 5, 6, 7, 8)
  - [ ] Create supabase/migrations/002_entities_domain/002_branches_schema.sql
  - [ ] Create branches table with fields:
    - id UUID PRIMARY KEY
    - college_id UUID REFERENCES colleges(id) ON DELETE CASCADE
    - agency_id UUID REFERENCES agencies(id)
    - name TEXT NOT NULL
    - city TEXT NOT NULL
    - commission_rate_percent DECIMAL(5,2) (overrides college default if set)
    - created_at, updated_at TIMESTAMPTZ
  - [ ] Add RLS policies for agency_id filtering
  - [ ] Add index on college_id for join performance
  - [ ] Create trigger to auto-populate commission_rate from college default on INSERT

- [ ] Create college contacts schema (AC: 9, 10, 11, 12, 13)
  - [ ] Create supabase/migrations/002_entities_domain/003_college_contacts_schema.sql
  - [ ] Create college_contacts table with fields:
    - id UUID PRIMARY KEY
    - college_id UUID REFERENCES colleges(id) ON DELETE CASCADE
    - agency_id UUID REFERENCES agencies(id)
    - name TEXT NOT NULL
    - role_department TEXT
    - position_title TEXT
    - email TEXT
    - phone TEXT
    - created_at, updated_at TIMESTAMPTZ
  - [ ] Add RLS policies for agency_id filtering
  - [ ] Add index on college_id
  - [ ] Create audit trigger to log contact changes

- [ ] Create college notes schema (AC: 17, 18, 19)
  - [ ] Create supabase/migrations/002_entities_domain/004_college_notes_schema.sql
  - [ ] Create college_notes table with fields:
    - id UUID PRIMARY KEY
    - college_id UUID REFERENCES colleges(id) ON DELETE CASCADE
    - agency_id UUID REFERENCES agencies(id)
    - user_id UUID REFERENCES users(id)
    - content TEXT CHECK (char_length(content) <= 2000)
    - created_at, updated_at TIMESTAMPTZ
  - [ ] Add RLS policies for agency_id filtering
  - [ ] Add index on (college_id, created_at DESC) for notes display

- [ ] Create activity feed infrastructure (AC: 14, 15, 16)
  - [ ] Create function to query audit_logs filtered by entity_type='college' and entity_id
  - [ ] Create view or function: get_college_activity(college_id, from_date, search_query)
  - [ ] Return activity entries with: timestamp, user_name, action, old_values, new_values
  - [ ] Support time period filtering (7, 30, 60, 90 days, all time)
  - [ ] Support text search on action description and field changes

- [ ] Implement colleges API endpoints (AC: 1, 2, 3)
  - [ ] Create apps/entities/app/api/colleges/route.ts
  - [ ] GET /api/colleges - List all colleges for agency (with pagination)
  - [ ] POST /api/colleges - Create new college (admin only)
  - [ ] Validate commission_rate_percent: 0-100 range
  - [ ] Validate gst_status: 'included' or 'excluded'
  - [ ] Apply RLS filtering via Supabase client
  - [ ] Return college with id, name, city, commission rate, gst_status
  - [ ] Log college creation in audit_logs

- [ ] Implement college detail API endpoint (AC: 3, 4)
  - [ ] Create apps/entities/app/api/colleges/[id]/route.ts
  - [ ] GET /api/colleges/[id] - Get college details with branches and contacts
  - [ ] PATCH /api/colleges/[id] - Update college (admin only)
  - [ ] DELETE /api/colleges/[id] - Soft delete college (admin only)
  - [ ] Check for associated payment plans before deletion
  - [ ] If payment plans exist, prevent deletion and return error
  - [ ] Log all changes (updates, deletions) in audit_logs

- [ ] Implement branches API endpoints (AC: 5, 6, 7, 8)
  - [ ] Create apps/entities/app/api/colleges/[id]/branches/route.ts
  - [ ] GET /api/colleges/[id]/branches - List branches for college
  - [ ] POST /api/colleges/[id]/branches - Create branch (admin only)
  - [ ] Auto-populate commission_rate from college default if not provided
  - [ ] Validate commission_rate_percent: 0-100 range
  - [ ] Return branch with clickable link format data
  - [ ] Create apps/entities/app/api/branches/[id]/route.ts for PATCH/DELETE

- [ ] Implement contacts API endpoints (AC: 9, 10, 11, 12, 13)
  - [ ] Create apps/entities/app/api/colleges/[id]/contacts/route.ts
  - [ ] GET /api/colleges/[id]/contacts - List contacts for college
  - [ ] POST /api/colleges/[id]/contacts - Add contact (admin only)
  - [ ] Validate email format if provided
  - [ ] Validate phone format if provided
  - [ ] Create apps/entities/app/api/contacts/[id]/route.ts for PATCH/DELETE
  - [ ] Log all contact changes in audit_logs

- [ ] Implement notes API endpoints (AC: 17, 18, 19)
  - [ ] Create apps/entities/app/api/colleges/[id]/notes/route.ts
  - [ ] GET /api/colleges/[id]/notes - List notes for college
  - [ ] POST /api/colleges/[id]/notes - Add note
  - [ ] Validate content length <= 2000 characters
  - [ ] Store user_id from authenticated session
  - [ ] Return notes with user name, timestamp, content

- [ ] Implement activity API endpoint (AC: 14, 15, 16)
  - [ ] Create apps/entities/app/api/colleges/[id]/activity/route.ts
  - [ ] GET /api/colleges/[id]/activity?period=30&search=gst
  - [ ] Query audit_logs for entity_type='college', 'branch', 'college_contact'
  - [ ] Filter by time period (query param: period=7|30|60|90|all)
  - [ ] Filter by search query (search field changes and action descriptions)
  - [ ] Return formatted activity: timestamp (relative), user, action, description, before/after values

- [ ] Create college list page (AC: 1)
  - [ ] Create apps/entities/app/colleges/page.tsx (Server Component)
  - [ ] Fetch colleges via Supabase client (RLS auto-applied)
  - [ ] Display table with columns: Name, City, Commission Rate, GST Status, Branch Count, Updated
  - [ ] Display GST status as badge: "Included" (green) or "Excluded" (yellow)
  - [ ] Show branch count (e.g., "3 branches")
  - [ ] Add "+ Add College" button (admin only, top right)
  - [ ] Make rows clickable to navigate to /colleges/[id]
  - [ ] Use TanStack Table for sorting and filtering

- [ ] Create college detail page (AC: 3, 4, 7, 14, 15, 16, 17, 18, 19)
  - [ ] Create apps/entities/app/colleges/[id]/page.tsx (Server Component)
  - [ ] Fetch college, branches, contacts, notes, activity via Supabase
  - [ ] Display college header: name, city, commission rate, GST status
  - [ ] Add "Edit Info" and "Delete" buttons (admin only, top right)
  - [ ] Display branches section with clickable links formatted as "College Name — Branch City"
  - [ ] Display contacts section with "Add Contact" button (admin only)
  - [ ] Display activity panel (right side) with time filter and search
  - [ ] Display notes section with character counter and "Post Note" button

- [ ] Create college form component (AC: 2, 3, 4)
  - [ ] Create apps/entities/app/colleges/components/CollegeForm.tsx (Client Component)
  - [ ] Form fields: Name (text), City (text), Commission Rate (number, 0-100%), GST Status (toggle)
  - [ ] Use React Hook Form with Zod validation
  - [ ] Default GST status to "Included"
  - [ ] Show validation errors inline
  - [ ] "Cancel" and "Save College" buttons
  - [ ] On submit: call POST/PATCH /api/colleges
  - [ ] Show success toast and redirect to college detail page

- [ ] Create branch form component (AC: 5, 6, 8)
  - [ ] Create apps/entities/app/colleges/components/BranchForm.tsx (Client Component)
  - [ ] Form fields: Branch Name (text), City (text), Commission Rate (number, auto-filled from college)
  - [ ] Pre-fill commission rate from college default (editable)
  - [ ] Use React Hook Form with Zod validation
  - [ ] "Cancel" and "Add Branch" buttons
  - [ ] On submit: call POST /api/colleges/[id]/branches
  - [ ] Show success toast and refresh branches list

- [ ] Create contact form component (AC: 9, 10, 11, 12)
  - [ ] Create apps/entities/app/colleges/components/ContactForm.tsx (Client Component)
  - [ ] Form fields: Name, Role/Department, Position/Title, Email, Phone
  - [ ] Validate email format if provided
  - [ ] Validate phone format if provided
  - [ ] Display format preview: "Name (Role)" with position below
  - [ ] "Cancel" and "Add Contact" buttons
  - [ ] On submit: call POST /api/colleges/[id]/contacts
  - [ ] Show success toast and refresh contacts list

- [ ] Create activity feed component (AC: 14, 15, 16)
  - [ ] Create apps/entities/app/colleges/components/ActivityFeed.tsx (Client Component)
  - [ ] Display activity entries chronologically (newest first)
  - [ ] Each entry shows: event type badge (Update, Contact Added), description, relative timestamp (e.g., "8 days ago")
  - [ ] For field updates, show "Field: old → new" format
  - [ ] Add time period filter dropdown: Last 7 days, 30 days, 60 days, 90 days, All time
  - [ ] Add search input with debounce (300ms)
  - [ ] Auto-refresh on filter/search change
  - [ ] Use TanStack Query for activity data

- [ ] Create notes section component (AC: 17, 18, 19)
  - [ ] Create apps/entities/app/colleges/components/NotesSection.tsx (Client Component)
  - [ ] Display textarea with maxLength=2000
  - [ ] Display character counter: "{current} / 2,000"
  - [ ] "Post Note" button (disabled if empty or > 2000 chars)
  - [ ] On submit: call POST /api/colleges/[id]/notes
  - [ ] Show success toast
  - [ ] Clear textarea after successful post
  - [ ] Display list of existing notes with user name, relative timestamp
  - [ ] Edit/delete icons for each note (creator only or admin)

- [ ] Create validation schemas (AC: 2, 5, 9)
  - [ ] Create packages/validations/src/college.schema.ts
  - [ ] Define CollegeSchema: name (required, min 2 chars), city, commission_rate (0-100), gst_status
  - [ ] Define BranchSchema: name (required), city (required), commission_rate (0-100)
  - [ ] Define ContactSchema: name (required), role_department, position_title, email (optional, valid format), phone (optional)
  - [ ] Define NoteSchema: content (required, max 2000 chars)
  - [ ] Export TypeScript types

- [ ] Add admin permission checks (AC: 3, 12)
  - [ ] Create utility function: requireAdmin(supabase) in packages/auth
  - [ ] Check current user role === 'agency_admin'
  - [ ] Throw ForbiddenError if not admin
  - [ ] Apply to all POST/PATCH/DELETE college endpoints
  - [ ] Apply to contact add/edit/delete endpoints
  - [ ] Show/hide admin-only UI elements based on user role

- [ ] Write tests for college management (AC: 1-19)
  - [ ] Test: Admin can create college (200)
  - [ ] Test: Regular user cannot create college (403)
  - [ ] Test: Commission rate validation (0-100 range)
  - [ ] Test: GST status validation (included/excluded only)
  - [ ] Test: Admin can update college (200)
  - [ ] Test: Admin can delete college without payment plans (200)
  - [ ] Test: Cannot delete college with payment plans (400)
  - [ ] Test: Branch inherits default commission rate
  - [ ] Test: Contact changes logged in audit trail
  - [ ] Test: Notes character limit enforced (max 2000)
  - [ ] Test: Activity feed filters by time period
  - [ ] Test: Activity feed search works correctly
  - [ ] Test: RLS prevents cross-agency access
  - [ ] Test: Duplicate college name prevented within agency

## Dev Notes

### College Registry Architecture

**Page Structure:**
```
College List Page (/entities/colleges)
├── Header
│   ├── Title: "Colleges"
│   └── "+ Add College" button (admin only)
├── Table
│   ├── Columns: Name, City, Commission %, GST Status, Branches, Updated
│   ├── Sortable columns
│   └── Click row → Navigate to detail page
└── Pagination controls

College Detail Page (/entities/colleges/[id])
├── Header
│   ├── College Name + City
│   ├── "Edit Info" button (admin only)
│   └── "Delete" button (admin only)
├── Main Content (Left)
│   ├── College Info Section
│   │   ├── Commission Rate: 15%
│   │   ├── GST Status: Included (badge)
│   │   └── Created: 2025-11-10
│   ├── Branches Section
│   │   ├── "Add Branch" button (admin only)
│   │   └── Branch links: "College Name — Branch City"
│   ├── Contacts Section
│   │   ├── "Add Contact" button (admin only)
│   │   └── Contact cards:
│   │       - Name (Role/Department)
│   │       - Position/Title
│   │       - Email icon + email
│   │       - Phone icon + phone
│   │       - Edit/Delete icons (admin only)
│   └── Notes Section
│       ├── Textarea (max 2000 chars)
│       ├── Character counter: "0 / 2,000"
│       ├── "Post Note" button
│       └── Notes list (chronological)
└── Activity Panel (Right)
    ├── Refresh icon
    ├── Time filter: "Last 30 days"
    ├── Search box
    └── Activity feed (Update, Contact Added, etc.)
```

**Permission Matrix:**

| Permission | Regular User | Agency Admin |
|------------|--------------|--------------|
| View colleges | ✅ Yes | ✅ Yes |
| Create college | ❌ No | ✅ Yes |
| Edit college | ❌ No | ✅ Yes |
| Delete college | ❌ No | ✅ Yes |
| Add branch | ❌ No | ✅ Yes |
| Edit branch | ❌ No | ✅ Yes |
| Add contact | ❌ No | ✅ Yes |
| Edit contact | ❌ No | ✅ Yes |
| Add note | ✅ Yes | ✅ Yes |
| Edit own note | ✅ Yes | ✅ Yes |
| Edit others' notes | ❌ No | ✅ Yes |
| View activity | ✅ Yes | ✅ Yes |

**GST Status Display:**
- "Included" → Green badge
- "Excluded" → Yellow badge

**Branch Display Format:**
- List view: "College Name — Branch City"
- Example: "University of Sydney — Sydney"
- Click link → Navigate to /branches/[id] (future story)

**Contact Display Format:**
```
┌─────────────────────────────┐
│ Lina Perez (College)        │ ← Name (Role/Department)
│ Accountant                  │ ← Position/Title
│ 📧 lina@college.edu         │ ← Email icon + email
│ 📞 +61 2 1234 5678          │ ← Phone icon + phone
│ [Edit] [Delete]             │ ← Actions (admin only)
└─────────────────────────────┘
```

**Activity Feed Format:**
```
Update • 10 days ago
GST Status: Included → Excluded
By: John Doe

Contact Added • 8 days ago
Added contact: Lina Perez (College)
By: Jane Smith
```

### Project Structure Notes

**College Management Location:**
```
apps/entities/
├── app/
│   ├── colleges/
│   │   ├── page.tsx                        # College list (Server Component)
│   │   ├── [id]/
│   │   │   └── page.tsx                    # College detail (Server Component)
│   │   ├── new/
│   │   │   └── page.tsx                    # Create college form
│   │   └── components/
│   │       ├── CollegeForm.tsx             # College create/edit form
│   │       ├── BranchForm.tsx              # Branch create/edit form
│   │       ├── ContactForm.tsx             # Contact create/edit form
│   │       ├── ContactCard.tsx             # Contact display card
│   │       ├── ActivityFeed.tsx            # Activity timeline
│   │       ├── NotesSection.tsx            # Notes with character counter
│   │       ├── CollegeTable.tsx            # TanStack Table for list
│   │       └── BranchLink.tsx              # Formatted branch link
│   └── api/
│       └── colleges/
│           ├── route.ts                    # GET/POST /api/colleges
│           └── [id]/
│               ├── route.ts                # GET/PATCH/DELETE /api/colleges/[id]
│               ├── branches/
│               │   └── route.ts            # GET/POST branches
│               ├── contacts/
│               │   └── route.ts            # GET/POST contacts
│               ├── notes/
│               │   └── route.ts            # GET/POST notes
│               └── activity/
│                   └── route.ts            # GET activity

supabase/migrations/002_entities_domain/
├── 001_colleges_schema.sql
├── 002_branches_schema.sql
├── 003_college_contacts_schema.sql
├── 004_college_notes_schema.sql
└── 005_entities_rls.sql

packages/validations/
└── src/
    └── college.schema.ts                   # Zod schemas

packages/utils/
└── src/
    └── format-branch-link.ts               # Branch display formatter
```

### Database Schema Details

**Colleges Table:**
```sql
CREATE TABLE colleges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT,
  default_commission_rate_percent DECIMAL(5,2) CHECK (default_commission_rate_percent BETWEEN 0 AND 100),
  gst_status TEXT CHECK (gst_status IN ('included', 'excluded')) DEFAULT 'included',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id, name)  -- Prevent duplicate college names within agency
);

CREATE INDEX idx_colleges_agency ON colleges(agency_id);
CREATE INDEX idx_colleges_name ON colleges(agency_id, name);
```

**Branches Table:**
```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  commission_rate_percent DECIMAL(5,2),  -- Overrides college default if set
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_branches_college ON branches(college_id);
CREATE INDEX idx_branches_agency ON branches(agency_id);

-- Trigger to auto-populate commission rate from college default
CREATE OR REPLACE FUNCTION set_branch_default_commission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.commission_rate_percent IS NULL THEN
    SELECT default_commission_rate_percent INTO NEW.commission_rate_percent
    FROM colleges WHERE id = NEW.college_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER branch_default_commission_trigger
  BEFORE INSERT ON branches
  FOR EACH ROW
  EXECUTE FUNCTION set_branch_default_commission();
```

**College Contacts Table:**
```sql
CREATE TABLE college_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role_department TEXT,
  position_title TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_college_contacts_college ON college_contacts(college_id);
CREATE INDEX idx_college_contacts_agency ON college_contacts(agency_id);
```

**College Notes Table:**
```sql
CREATE TABLE college_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id UUID REFERENCES colleges(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_college_notes_college ON college_notes(college_id, created_at DESC);
CREATE INDEX idx_college_notes_agency ON college_notes(agency_id);
```

**RLS Policies:**
```sql
-- Colleges: View access for all users, modify access for admins only
ALTER TABLE colleges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view colleges in their agency"
  ON colleges FOR SELECT
  USING (agency_id = (SELECT agency_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can create colleges"
  ON colleges FOR INSERT
  WITH CHECK (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY "Admins can update colleges"
  ON colleges FOR UPDATE
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

CREATE POLICY "Admins can delete colleges"
  ON colleges FOR DELETE
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

-- Apply similar RLS policies to branches, college_contacts, college_notes
-- (admin-only for branches and contacts, all users can add notes)
```

**Activity Feed Query:**
```sql
-- Function to get college activity
CREATE OR REPLACE FUNCTION get_college_activity(
  p_college_id UUID,
  p_from_date TIMESTAMPTZ DEFAULT NULL,
  p_search_query TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  timestamp TIMESTAMPTZ,
  user_name TEXT,
  entity_type TEXT,
  action TEXT,
  old_values JSONB,
  new_values JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    al.id,
    al.created_at AS timestamp,
    u.full_name AS user_name,
    al.entity_type,
    al.action,
    al.old_values,
    al.new_values
  FROM audit_logs al
  LEFT JOIN users u ON al.user_id = u.id
  WHERE
    (al.entity_id = p_college_id AND al.entity_type = 'college')
    OR (al.entity_id IN (SELECT id FROM branches WHERE college_id = p_college_id) AND al.entity_type = 'branch')
    OR (al.entity_id IN (SELECT id FROM college_contacts WHERE college_id = p_college_id) AND al.entity_type = 'college_contact')
    AND (p_from_date IS NULL OR al.created_at >= p_from_date)
    AND (p_search_query IS NULL OR al.action ILIKE '%' || p_search_query || '%')
  ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

### Architecture Alignment

**From Architecture Document (architecture.md):**

This story implements the **Entities Domain (Epic 3)** as defined in the architecture:

**Database Domain:** `entities_domain` (supabase/migrations/002_entities_domain/)

**Frontend Zone:** `apps/entities/` (Microfrontend zone for colleges and students)

**Key Patterns Applied:**

1. **Multi-Zone Architecture:** College management lives in dedicated entities zone
2. **Server Components:** College list and detail pages fetch data server-side
3. **Client Components:** Forms and interactive UI (activity feed, notes)
4. **TanStack Query:** Client-side caching and mutations for forms
5. **RLS:** Database-level tenant isolation via agency_id
6. **Audit Logging:** All college changes logged in audit_logs table
7. **Domain-Driven Schema:** Migrations organized by domain (entities_domain)

**API Route Pattern:**
```typescript
// apps/entities/app/api/colleges/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, ForbiddenError } from '@pleeno/utils'
import { CollegeSchema } from '@pleeno/validations'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify admin role
    const { data: { user } } = await supabase.auth.getUser()
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, agency_id')
      .eq('id', user.id)
      .single()

    if (currentUser?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = CollegeSchema.parse(body)

    // Create college (RLS auto-applies agency_id filter)
    const { data: college, error } = await supabase
      .from('colleges')
      .insert({
        agency_id: currentUser.agency_id,
        name: validatedData.name,
        city: validatedData.city,
        default_commission_rate_percent: validatedData.commission_rate,
        gst_status: validatedData.gst_status
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: college
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Branch Display Formatter:**
```typescript
// packages/utils/src/format-branch-link.ts
export function formatBranchLink(
  collegeName: string,
  branchCity: string
): string {
  return `${collegeName} — ${branchCity}`
}

// Usage in component:
import { formatBranchLink } from '@pleeno/utils'

<Link href={`/branches/${branch.id}`}>
  {formatBranchLink(branch.college.name, branch.city)}
</Link>
// Displays: "University of Sydney — Sydney"
```

### Learnings from Previous Story

**From Story 2.4: User Profile Management (Status: drafted)**

Story 2.4 has not been implemented yet but establishes patterns for this story:

**Expected Infrastructure from 2.4:**
- **Audit logging triggers:** Pattern for logging entity changes (create/update/delete)
- **Admin permission checks:** Middleware to verify agency_admin role
- **Character-limited text fields:** Notes section with 2000 char limit and counter
- **Email/phone validation:** Reusable validation patterns
- **Activity feed design:** Time filtering and search functionality
- **RLS policies:** Users can only access data in their own agency

**What This Story Builds Upon:**
- Uses same admin permission checking from 2.4
- Follows same API route structure with admin-only endpoints
- Applies same audit logging infrastructure
- Reuses character counter pattern for notes
- Implements similar activity feed with time filtering

**Integration Points:**
- Colleges link to payment plans (Epic 4)
- Colleges link to students via enrollments (Story 3.3)
- Branches used in payment plan creation
- Contact information displayed in commission claims (Epic 7)
- Activity feed pattern reused for students (Story 3.2)

**Patterns to Apply from 2.4:**
- Server Components for initial data fetch (college list, detail pages)
- Client Components for interactive forms (college form, branch form, contact form)
- TanStack Query for optimistic updates and mutations
- Confirmation dialogs for destructive actions (delete college)
- Clear success/error toasts after mutations
- Validate current user role before rendering admin-only UI
- Use handleApiError() for consistent error responses
- Audit logging for all create/update/delete operations

**Key Dependencies:**
- Audit logging infrastructure from Epic 2
- Admin role permission system from Story 2.3/2.4
- User table and authentication from Epic 1
- Agency table for multi-tenant isolation

**Differences from 2.4:**
- 2.4 focuses on user profile self-management
- 3.1 focuses on admin-only entity management (colleges, branches, contacts)
- 3.1 introduces nested entity relationships (college → branches → contacts)
- 3.1 introduces activity feed aggregation across multiple entity types
- 3.1 has complex display formatting (branch links, contact cards)

[Source: .bmad-ephemeral/stories/2-4-user-profile-management.md]

### Security Considerations

**Admin-Only Operations:**
- Only agency_admin role can create/edit/delete colleges, branches, contacts
- RLS enforces admin-only policies at database level
- API endpoints check user role before allowing mutations
- UI hides admin-only buttons for regular users

**Multi-Tenant Isolation:**
- All queries filtered by agency_id via RLS
- Impossible to access other agencies' colleges
- Foreign keys enforce referential integrity
- Audit logs track all changes with user attribution

**Input Validation:**
- Commission rate: 0-100% range enforced
- GST status: Must be 'included' or 'excluded'
- Email format validation if provided
- Phone format validation if provided
- Note content: Max 2000 characters
- College name uniqueness within agency

**Deletion Protection:**
- Soft delete if payment plans associated with college
- Cascade delete branches and contacts when college deleted
- Check for dependencies before allowing deletion
- Log deletion in audit trail

**Activity Feed Privacy:**
- Activity feed shows only changes within user's agency
- User names displayed for attribution
- System-generated changes shown as "System"
- No cross-agency activity visible

### Testing Strategy

**Unit Tests:**
1. **Validation Schemas:**
   - Valid college data passes validation
   - Commission rate must be 0-100
   - GST status must be 'included' or 'excluded'
   - Email validation works correctly
   - Note length validation works (max 2000)

2. **Utilities:**
   - Branch link formatter: formatBranchLink()
   - Activity feed date filtering
   - Character counter calculation

**Integration Tests:**
1. **College CRUD:**
   - Admin can create college (200)
   - Regular user cannot create college (403)
   - Admin can update college (200)
   - Admin can delete college without payment plans (200)
   - Cannot delete college with payment plans (400)
   - Duplicate college name within agency prevented (400)

2. **Branch CRUD:**
   - Admin can create branch (200)
   - Branch inherits default commission rate
   - Branch can override commission rate
   - Branch commission rate validated (0-100)

3. **Contact CRUD:**
   - Admin can add contact (200)
   - Regular user cannot add contact (403)
   - Email validation works
   - Phone validation works
   - Contact changes logged in audit trail

4. **Notes:**
   - All users can add notes
   - Note content limited to 2000 chars
   - Notes saved with user attribution
   - Users can edit/delete own notes
   - Admins can edit/delete all notes

5. **Activity Feed:**
   - Activity filtered by time period
   - Activity searchable by text
   - Activity shows changes across college, branches, contacts
   - Relative timestamps displayed correctly

6. **RLS:**
   - Users can only view colleges in their agency
   - Users cannot access other agencies' colleges
   - Admin permissions enforced at database level

**E2E Tests:**
1. **Create College Flow:**
   - Login as admin
   - Navigate to /entities/colleges
   - Click "+ Add College"
   - Fill form: name, city, commission rate, GST status
   - Click "Save College"
   - Verify success toast
   - Verify redirect to college detail page
   - Verify college appears in list

2. **Add Branch Flow:**
   - Navigate to college detail page
   - Click "Add Branch"
   - Fill form: branch name, city
   - Verify commission rate pre-filled
   - Edit commission rate
   - Click "Add Branch"
   - Verify success toast
   - Verify branch appears in list with correct format

3. **Add Contact Flow:**
   - Navigate to college detail page
   - Click "Add Contact"
   - Fill form: name, role, position, email, phone
   - Click "Add Contact"
   - Verify success toast
   - Verify contact appears with correct display format
   - Verify contact logged in activity feed

4. **Add Note Flow:**
   - Navigate to college detail page
   - Enter note content (< 2000 chars)
   - Verify character counter updates
   - Click "Post Note"
   - Verify success toast
   - Verify note appears in list with timestamp and user name

5. **Activity Feed Flow:**
   - Make several changes to college (GST status, add contact, add note)
   - Verify all changes appear in activity feed
   - Filter by "Last 7 days"
   - Verify only recent changes shown
   - Search for "GST"
   - Verify only GST-related changes shown

### References

- [Source: docs/epics.md#Story-3.1-College-Registry]
- [Source: docs/PRD.md#FR-3-College-Management]
- [Source: docs/PRD.md#Epic-3-Core-Entity-Management]
- [Source: docs/architecture.md#Data-Architecture - entities_domain schema]
- [Source: docs/architecture.md#Epic-to-Architecture-Mapping - Epic 3]
- [Source: .bmad-ephemeral/stories/2-4-user-profile-management.md - activity feed and notes patterns]

## Dev Agent Record

### Context Reference

- [.bmad-ephemeral/stories/3-1-college-registry.context.xml](.bmad-ephemeral/stories/3-1-college-registry.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

## Change Log

- **2025-11-13:** Story created from epics.md via create-story workflow
