# Story 2.2: User Invitation and Task Assignment System

Status: ready-for-dev

## Story

As an **Agency Admin**,
I want **to invite team members to join my agency and assign them specific tasks**,
so that **I can build my team and flexibly delegate work based on individual needs**.

## Acceptance Criteria

1. **Given** I am an Agency Admin, **When** I invite a new user by email, **Then** an invitation email is sent with a secure signup link

2. **And** the invitation link expires after 7 days

3. **And** the invited user can complete registration with the link

4. **And** the new user is automatically associated with my agency

5. **And** I can assign specific tasks from a master task list (e.g., data entry, document verification, payment processing) by ticking checkboxes

6. **And** the invitation email includes a unique link showing only their assigned tasks

7. **And** I can modify task assignments for existing users at any time

8. **And** all changes to user profiles and task assignments are logged with: who made the change, what was changed, and timestamp

## Tasks / Subtasks

- [x] Create database schema for invitations and task assignments (AC: 1, 2, 5, 8)
  - [x] Create migration: supabase/migrations/001_agency_domain/006_invitations_schema.sql (corrected path)
  - [x] Define invitations table: id, agency_id, email, token (UUID), expires_at, invited_by, used_at, created_at
  - [x] Define master_tasks table: id, task_name, task_code, description, created_at
  - [x] Define user_task_assignments table: id, user_id, task_id, assigned_at, assigned_by
  - [x] Add unique constraint on invitation token
  - [x] Add foreign key constraints with CASCADE delete
  - [x] Enable RLS on all tables with agency_id filtering
  - [x] Add indexes on commonly queried columns (agency_id, email, token, expires_at)

- [x] Create audit logging schema for user profile changes (AC: 8)
  - [x] Create audit_log table: id, entity_type, entity_id, user_id, action, changes_json, created_at
  - [x] Add RLS policy: Admins can view audit logs for their agency
  - [ ] Create trigger function to log profile changes automatically
  - [ ] Create trigger function to log task assignment changes automatically
  - [x] Add indexes on audit_log (entity_type, entity_id, created_at, user_id)

- [ ] Seed master tasks list with common agency tasks (AC: 5)
  - [ ] Create seed migration with initial tasks:
    - Data entry (code: DATA_ENTRY)
    - Document verification (code: DOC_VERIFY)
    - Payment processing (code: PAYMENT_PROC)
    - Student communication (code: STUDENT_COMM)
    - College liaison (code: COLLEGE_LIAISON)
    - Reporting (code: REPORTING)
  - [ ] Each task includes name, code, and description

- [ ] Implement user invitation API route (AC: 1, 2, 3, 4)
  - [ ] Create apps/agency/app/api/invitations/route.ts
  - [ ] POST /api/invitations endpoint
  - [ ] Validate request: email (required), role (agency_admin | agency_user), task_ids (optional array)
  - [ ] Check user role = 'agency_admin' before allowing invitations
  - [ ] Generate secure invitation token (UUID v4)
  - [ ] Calculate expiration: 7 days from now
  - [ ] Insert invitation record with RLS enforcement
  - [ ] Return invitation ID and token
  - [ ] Add error handling with handleApiError()

- [ ] Implement email sending for invitations (AC: 1, 6)
  - [ ] Create emails/invitation.tsx React Email template
  - [ ] Template includes: agency name, inviter name, secure link, assigned tasks list
  - [ ] Link format: /accept-invitation/[token]?tasks=[task_ids_encoded]
  - [ ] Integrate with Resend API
  - [ ] Create packages/utils/src/email-helpers.ts
  - [ ] Implement sendInvitationEmail() function
  - [ ] Include error handling and logging
  - [ ] Test email delivery in development mode

- [ ] Create invitation acceptance page and flow (AC: 2, 3, 4)
  - [ ] Create apps/shell/app/accept-invitation/[token]/page.tsx
  - [ ] Validate token on page load (not expired, not used)
  - [ ] Display error if token invalid or expired
  - [ ] Show signup form pre-filled with email from invitation
  - [ ] Form fields: full_name, password, password_confirmation
  - [ ] On submit: create user with Supabase Auth, mark invitation as used
  - [ ] Automatically set user's agency_id from invitation
  - [ ] Automatically set user's role from invitation
  - [ ] Create user_task_assignments for assigned tasks
  - [ ] Redirect to dashboard after successful signup
  - [ ] Add success toast: "Welcome to [Agency Name]!"

- [ ] Create user management page with invitation capability (AC: 1, 5, 7)
  - [ ] Create apps/agency/app/users/page.tsx
  - [ ] Display table of all agency users: name, email, role, status, assigned tasks count
  - [ ] Add "Invite User" button (admin only)
  - [ ] Create apps/agency/app/users/components/InviteUserModal.tsx
  - [ ] Modal form: email, role (dropdown), task assignments (checkbox list)
  - [ ] Load master tasks from database
  - [ ] Display checkboxes for each task with name and description
  - [ ] On submit: call POST /api/invitations
  - [ ] Show success message with "Invitation sent to [email]"
  - [ ] Refresh user list after invitation sent

- [ ] Implement task assignment management for existing users (AC: 5, 7, 8)
  - [ ] Create apps/agency/app/api/users/[id]/tasks/route.ts
  - [ ] POST /api/users/[id]/tasks endpoint to assign/revoke tasks
  - [ ] Request body: { task_ids: string[] } (replaces all assignments)
  - [ ] Validate user role = 'agency_admin'
  - [ ] Delete existing task assignments for user
  - [ ] Insert new task assignments with assigned_by = current_user_id
  - [ ] Log changes to audit_log table
  - [ ] Return updated list of assigned tasks
  - [ ] Add error handling

- [ ] Create task assignment UI for existing users (AC: 7, 8)
  - [ ] Create apps/agency/app/users/[id]/page.tsx user detail page
  - [ ] Display user profile: name, email, role, status
  - [ ] Display currently assigned tasks with checkboxes
  - [ ] Load master tasks list
  - [ ] Pre-check currently assigned tasks
  - [ ] "Save Task Assignments" button
  - [ ] On submit: call POST /api/users/[id]/tasks
  - [ ] Show success toast: "Task assignments updated"
  - [ ] Optimistic UI update with TanStack Query

- [ ] Implement invitation expiration validation (AC: 2)
  - [ ] Create packages/utils/src/invitation-helpers.ts
  - [ ] Implement isInvitationExpired(invitation) function
  - [ ] Check expires_at < current_timestamp
  - [ ] Use in invitation acceptance page
  - [ ] Display error message: "This invitation has expired. Please request a new invitation from your agency admin."
  - [ ] Prevent signup with expired token

- [ ] Display pending invitations in user management (AC: 1)
  - [ ] Query invitations table for pending (used_at = NULL, not expired)
  - [ ] Display separate section: "Pending Invitations"
  - [ ] Show: email, role, invited by, expires in (relative time), assigned tasks
  - [ ] Add "Resend" button to resend invitation email
  - [ ] Add "Cancel" button to delete invitation
  - [ ] Implement POST /api/invitations/[id]/resend
  - [ ] Implement DELETE /api/invitations/[id]

- [ ] Create validation schemas (AC: 1, 5)
  - [ ] Create packages/validations/src/invitation.schema.ts
  - [ ] Define InvitationCreateSchema: email, role, task_ids
  - [ ] Define UserTaskAssignmentSchema: task_ids (array of UUIDs)
  - [ ] Validate email format
  - [ ] Validate role enum ('agency_admin', 'agency_user')
  - [ ] Validate task_ids are valid UUIDs
  - [ ] Export TypeScript types

- [ ] Write tests for invitation system (AC: 1-8)
  - [ ] Test: Admin can create invitation successfully
  - [ ] Test: User cannot create invitation (403)
  - [ ] Test: Invitation email sent with correct content
  - [ ] Test: Invitation link format includes token and tasks
  - [ ] Test: Expired invitation rejected
  - [ ] Test: Used invitation rejected (cannot reuse)
  - [ ] Test: New user created with correct agency_id and role
  - [ ] Test: Task assignments created for new user
  - [ ] Test: Admin can modify task assignments for existing user
  - [ ] Test: Task assignment changes logged in audit trail
  - [ ] Test: Non-admin cannot modify task assignments
  - [ ] Test: RLS prevents cross-agency invitation access

## Dev Notes

### User Invitation Flow

**Architecture:**
```
Admin → Create Invitation → Generate Token → Send Email
                                ↓
        Invitee clicks link → Validate Token → Signup Form → Create User
                                                    ↓
                            Set agency_id, role, task assignments
```

**Invitation Token Security:**
- Generate UUID v4 for token (cryptographically secure)
- Token stored in database with expiration timestamp
- Token must be unique across all invitations
- Token expires after 7 days (configurable)
- Used tokens cannot be reused (used_at timestamp set)
- Validate token before allowing signup

**Email Template Structure:**
- Subject: "You're invited to join [Agency Name] on Pleeno"
- Greeting: "Hi, [Inviter Name] has invited you to join [Agency Name]"
- Assigned tasks section: "You've been assigned the following responsibilities:"
  - Bulleted list of task names and descriptions
- Call-to-action: "Accept Invitation" button with unique link
- Footer: "This invitation expires in 7 days"

**Task Assignment System:**
- Master tasks list pre-populated with common agency tasks
- Admins can assign multiple tasks per user
- Tasks displayed as checkboxes with name and description
- Task assignments tracked with who assigned and when
- Changes to assignments logged in audit trail
- Users can view their assigned tasks in profile (future enhancement)

### Project Structure Notes

**Invitation System Location:**
```
apps/agency/
├── app/
│   ├── users/
│   │   ├── page.tsx              # User management with invite button
│   │   ├── [id]/
│   │   │   └── page.tsx          # User detail with task assignments
│   │   └── components/
│   │       └── InviteUserModal.tsx
│   └── api/
│       ├── invitations/
│       │   ├── route.ts          # POST /api/invitations
│       │   └── [id]/
│       │       ├── resend/
│       │       │   └── route.ts  # POST /api/invitations/:id/resend
│       │       └── route.ts      # DELETE /api/invitations/:id
│       └── users/
│           └── [id]/
│               └── tasks/
│                   └── route.ts  # POST /api/users/:id/tasks

apps/shell/
└── app/
    └── accept-invitation/
        └── [token]/
            └── page.tsx          # Invitation acceptance flow

emails/
└── invitation.tsx               # React Email template

packages/validations/
└── src/
    └── invitation.schema.ts     # Zod schemas

packages/utils/
└── src/
    ├── invitation-helpers.ts    # Token validation helpers
    └── email-helpers.ts         # Email sending utilities
```

### Database Schema Details

**Invitations Table:**
```sql
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('agency_admin', 'agency_user')) NOT NULL,
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_agency ON invitations(agency_id);
CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_expires_at ON invitations(expires_at);
```

**Master Tasks Table:**
```sql
CREATE TABLE master_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_name TEXT NOT NULL,
  task_code TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO master_tasks (task_name, task_code, description) VALUES
  ('Data Entry', 'DATA_ENTRY', 'Enter student and payment plan information'),
  ('Document Verification', 'DOC_VERIFY', 'Verify student documents and offer letters'),
  ('Payment Processing', 'PAYMENT_PROC', 'Record and track payment installments'),
  ('Student Communication', 'STUDENT_COMM', 'Communicate with students about payments and status'),
  ('College Liaison', 'COLLEGE_LIAISON', 'Coordinate with college partners'),
  ('Reporting', 'REPORTING', 'Generate and export reports');
```

**User Task Assignments Table:**
```sql
CREATE TABLE user_task_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES master_tasks(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  assigned_by UUID REFERENCES users(id),
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_user_task_assignments_user ON user_task_assignments(user_id);
CREATE INDEX idx_user_task_assignments_task ON user_task_assignments(task_id);
```

**Audit Log Table:**
```sql
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,  -- 'user', 'user_task_assignment'
  entity_id UUID NOT NULL,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,  -- 'create', 'update', 'delete'
  changes_json JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);
```

### Architecture Alignment

**From Architecture Document (architecture.md):**

**RLS Policies for Invitations:**
```sql
-- Invitations visible to agency admins only
CREATE POLICY "Admins can manage invitations"
  ON invitations FOR ALL
  USING (
    agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );

-- Master tasks visible to all authenticated users
CREATE POLICY "Users can view master tasks"
  ON master_tasks FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Task assignments visible to agency users
CREATE POLICY "Users can view task assignments in their agency"
  ON user_task_assignments FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
  );

-- Admins can manage task assignments
CREATE POLICY "Admins can manage task assignments"
  ON user_task_assignments FOR ALL
  USING (
    user_id IN (
      SELECT id FROM users WHERE agency_id = (SELECT agency_id FROM users WHERE id = auth.uid())
    )
    AND (SELECT role FROM users WHERE id = auth.uid()) = 'agency_admin'
  );
```

**API Route Pattern:**
```typescript
// apps/agency/app/api/invitations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@pleeno/database'
import { handleApiError, UnauthorizedError, ForbiddenError } from '@pleeno/utils'
import { InvitationCreateSchema } from '@pleeno/validations'
import { sendInvitationEmail } from '@pleeno/utils/email-helpers'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Verify user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      throw new UnauthorizedError('Not authenticated')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role, agency_id, full_name')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'agency_admin') {
      throw new ForbiddenError('Admin access required')
    }

    // Validate request body
    const body = await request.json()
    const validatedData = InvitationCreateSchema.parse(body)

    // Generate secure token and expiration
    const token = uuidv4()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days from now

    // Create invitation
    const { data: invitation, error } = await supabase
      .from('invitations')
      .insert({
        agency_id: userData.agency_id,
        email: validatedData.email,
        role: validatedData.role,
        token,
        invited_by: user.id,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Get agency name for email
    const { data: agency } = await supabase
      .from('agencies')
      .select('name')
      .eq('id', userData.agency_id)
      .single()

    // Get task details if tasks assigned
    let assignedTasks = []
    if (validatedData.task_ids && validatedData.task_ids.length > 0) {
      const { data: tasks } = await supabase
        .from('master_tasks')
        .select('task_name, description')
        .in('id', validatedData.task_ids)

      assignedTasks = tasks || []
    }

    // Send invitation email
    await sendInvitationEmail({
      to: validatedData.email,
      token,
      agencyName: agency?.name || 'Unknown Agency',
      inviterName: userData.full_name,
      assignedTasks,
      taskIds: validatedData.task_ids || []
    })

    return NextResponse.json({
      success: true,
      data: {
        id: invitation.id,
        email: invitation.email,
        expires_at: invitation.expires_at
      }
    })
  } catch (error) {
    return handleApiError(error)
  }
}
```

**Email Helper:**
```typescript
// packages/utils/src/email-helpers.ts
import { Resend } from 'resend'
import { InvitationEmail } from '@/emails/invitation'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendInvitationEmail({
  to,
  token,
  agencyName,
  inviterName,
  assignedTasks,
  taskIds
}: {
  to: string
  token: string
  agencyName: string
  inviterName: string
  assignedTasks: Array<{ task_name: string; description: string }>
  taskIds: string[]
}) {
  const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL}/accept-invitation/${token}?tasks=${encodeURIComponent(JSON.stringify(taskIds))}`

  const { data, error } = await resend.emails.send({
    from: 'Pleeno <noreply@pleeno.com>',
    to,
    subject: `You're invited to join ${agencyName} on Pleeno`,
    react: InvitationEmail({
      agencyName,
      inviterName,
      assignedTasks,
      acceptUrl
    })
  })

  if (error) {
    throw new Error(`Failed to send invitation email: ${error.message}`)
  }

  return data
}
```

**React Email Template:**
```tsx
// emails/invitation.tsx
import { Html, Head, Body, Container, Section, Text, Button, Hr } from '@react-email/components'

interface InvitationEmailProps {
  agencyName: string
  inviterName: string
  assignedTasks: Array<{ task_name: string; description: string }>
  acceptUrl: string
}

export function InvitationEmail({
  agencyName,
  inviterName,
  assignedTasks,
  acceptUrl
}: InvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ fontFamily: 'sans-serif', backgroundColor: '#f6f9fc' }}>
        <Container style={{ margin: '0 auto', padding: '20px 0', maxWidth: '600px' }}>
          <Section style={{ backgroundColor: '#ffffff', padding: '40px', borderRadius: '8px' }}>
            <Text style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
              You're invited to join {agencyName}
            </Text>

            <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '20px' }}>
              Hi,
            </Text>

            <Text style={{ fontSize: '16px', lineHeight: '24px', marginBottom: '20px' }}>
              {inviterName} has invited you to join {agencyName} on Pleeno, the intelligent financial command center for international study agencies.
            </Text>

            {assignedTasks.length > 0 && (
              <>
                <Text style={{ fontSize: '16px', fontWeight: 'bold', marginTop: '30px', marginBottom: '10px' }}>
                  You've been assigned the following responsibilities:
                </Text>
                <ul style={{ marginLeft: '20px', lineHeight: '28px' }}>
                  {assignedTasks.map((task, index) => (
                    <li key={index}>
                      <strong>{task.task_name}</strong> - {task.description}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <Button
              href={acceptUrl}
              style={{
                backgroundColor: '#0066ff',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: '6px',
                textDecoration: 'none',
                display: 'inline-block',
                marginTop: '30px'
              }}
            >
              Accept Invitation
            </Button>

            <Hr style={{ margin: '30px 0', borderColor: '#e6e6e6' }} />

            <Text style={{ fontSize: '14px', color: '#666666' }}>
              This invitation expires in 7 days.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
```

### Learnings from Previous Story

**From Story 2.1: Agency Profile Setup (Status: drafted)**

Story 2.1 has not yet been implemented, but establishes foundational patterns this story should follow:

**Expected Infrastructure from 2.1:**
- **Agency settings page:** apps/agency/app/settings/ structure
- **API route patterns:** PATCH /api/agencies/[id] with role checks
- **Validation schemas:** packages/validations/src/agency.schema.ts pattern
- **Form components:** React Hook Form + Zod resolver pattern
- **Role-based access:** requireRole('agency_admin') helper
- **Error handling:** handleApiError() in catch blocks

**What This Story Builds Upon:**
- User management extends agency settings (similar zone)
- Invitation system uses same role checking pattern
- API routes follow same structure (validation, auth, RLS)
- Forms use React Hook Form + Zod like agency settings

**Integration Points:**
- User management page links to agency settings
- Shared validation patterns (email, role enum)
- Shared error handling (UnauthorizedError, ForbiddenError)
- Shared timezone helpers for "expires in" display

**Learnings to Apply:**
- Use Server Components for initial page load (fetch users server-side)
- Use Client Components for interactive forms (InviteUserModal)
- Validate admin role before rendering admin-only UI
- Display clear error messages for authorization failures
- Use optimistic updates with TanStack Query for better UX

[Source: .bmad-ephemeral/stories/2-1-agency-profile-setup.md]

### Security Considerations

**Invitation Token Security:**
- Generate cryptographically secure UUID v4 tokens
- Store tokens hashed in database (future enhancement)
- Expire tokens after 7 days
- Mark tokens as used after signup (prevent reuse)
- Validate token on every access to acceptance page
- Rate limit invitation creation (prevent spam)

**Access Control:**
- Only agency_admin can create invitations
- Only agency_admin can modify task assignments
- RLS prevents cross-agency invitation access
- Validate role before allowing any admin operations
- Audit all invitation and task assignment changes

**Email Security:**
- Validate email format before sending
- Use Resend API for reliable delivery
- Include agency name and inviter name for transparency
- Link includes token + task IDs (URL parameters)
- No sensitive data in email body

**Data Validation:**
- Validate email format with Zod
- Validate role enum against allowed values
- Validate task_ids are valid UUIDs
- Prevent SQL injection with parameterized queries (Supabase)
- Sanitize all user inputs

**Audit Trail:**
- Log all invitation creations with who invited
- Log all task assignment changes with who assigned
- Store changes as JSON for detailed history
- Audit logs immutable (insert-only)
- Admin-only access to audit logs

### Testing Strategy

**Unit Tests:**
1. **Validation Schemas:**
   - Valid invitation data passes
   - Invalid email rejected
   - Invalid role rejected
   - Invalid task_ids rejected
   - Required fields enforced

2. **Helper Functions:**
   - isInvitationExpired() detects expired invitations
   - Token generation creates unique UUIDs
   - Email helper formats invitation emails correctly

**Integration Tests:**
1. **Invitation Creation:**
   - Admin can create invitation (200)
   - User cannot create invitation (403)
   - Email sent with correct content
   - Token generated and stored
   - Expires_at set to 7 days from now
   - RLS prevents cross-agency invitations

2. **Invitation Acceptance:**
   - Valid token allows signup
   - Expired token rejected (400)
   - Used token rejected (400)
   - New user created with correct agency_id
   - New user created with correct role
   - Task assignments created for new user
   - Invitation marked as used

3. **Task Assignment Management:**
   - Admin can assign tasks to user (200)
   - User cannot assign tasks (403)
   - Task assignments replaced correctly
   - Audit log created for changes
   - RLS prevents cross-agency task assignment

4. **User Management Page:**
   - Admin can view all users
   - Pending invitations displayed separately
   - Invite button opens modal
   - Modal form validates input
   - Success message after invitation sent
   - User list refreshes after invitation

**E2E Tests:**
1. **Complete Invitation Flow:**
   - Login as admin
   - Navigate to user management
   - Click "Invite User"
   - Fill form with email, role, tasks
   - Submit invitation
   - Verify invitation email sent
   - Open invitation link (new browser session)
   - Complete signup form
   - Verify redirected to dashboard
   - Verify user appears in user list
   - Verify task assignments visible

2. **Task Assignment Flow:**
   - Login as admin
   - Navigate to user detail page
   - Modify task checkboxes
   - Save changes
   - Verify success toast
   - Verify task assignments updated
   - Verify audit log entry created

### References

- [Source: docs/epics.md#Story-2.2-User-Invitation-and-Task-Assignment-System]
- [Source: docs/PRD.md#FR-1.4-User-Invitation-Flow-with-Task-Assignment]
- [Source: docs/PRD.md#Epic-2-Agency-&-User-Management]
- [Source: docs/architecture.md#Data-Architecture - invitations schema]
- [Source: docs/architecture.md#Multi-Stakeholder-Notification-System - email pattern]
- [Source: .bmad-ephemeral/stories/2-1-agency-profile-setup.md - foundation patterns]

## Dev Agent Record

### Context Reference

- .bmad-ephemeral/stories/2-2-user-invitation-and-task-assignment-system.context.xml

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A - No debugging required

### Completion Notes List

**Task 01: Create database schema for invitations and task assignments - COMPLETED (2025-11-13)**

✅ **What was completed:**
- Created migration file: `supabase/migrations/001_agency_domain/006_invitations_schema.sql`
- Implemented 4 tables with full RLS policies:
  1. **invitations** - Stores invitation tokens for new users with 7-day expiration
  2. **master_tasks** - Global lookup table for assignable tasks (DATA_ENTRY, DOC_VERIFY, etc.)
  3. **user_task_assignments** - Many-to-many relationship between users and tasks
  4. **audit_log** - Immutable audit trail for tracking all changes
- Added comprehensive indexes for query performance (15 indexes total)
- Implemented agency-scoped RLS policies for multi-tenant isolation
- Added unique constraints (invitation token, user-task pair)
- Added CASCADE delete for proper foreign key cleanup
- Added email format validation constraint
- Added extensive documentation comments for all tables and policies

📝 **Implementation notes:**
- Migration path corrected from `002_agency_domain/004_invitations_schema.sql` to `001_agency_domain/006_invitations_schema.sql` to align with existing domain structure
- Following sequential numbering within agency domain (001-005 already exist)
- Used template pattern from `_TEMPLATE_tenant_scoped_table.sql` for consistency
- RLS policies ensure only agency_admin can manage invitations and task assignments
- master_tasks table is global (no agency_id) but readable by all authenticated users
- audit_log uses JSONB for flexible change tracking format

⚠️ **Deviations from story:**
- Audit trigger functions NOT implemented in this migration - will be added when API routes are created (separate task)
- Migration file path differs from story specification (corrected to match actual repo structure)

🔄 **Follow-up tasks:**
- Seed master_tasks with initial task list (separate task in story)
- Create trigger functions for automatic audit logging (separate subtasks)
- Test migration when Supabase instance is available

### File List

**Created:**
- `supabase/migrations/001_agency_domain/006_invitations_schema.sql` - Database schema migration for invitations, tasks, and audit logging

## Change Log

- **2025-11-13:** Story created from epics.md via create-story workflow
- **2025-11-13:** Task 01 completed - Created database schema migration (006_invitations_schema.sql) with invitations, master_tasks, user_task_assignments, and audit_log tables including RLS policies and indexes
