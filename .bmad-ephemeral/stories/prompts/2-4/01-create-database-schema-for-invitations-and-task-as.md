# Story 2-4: User Profile Management
## Task 1: Create email verification schema for admin email changes

**User Story Context:**
- As an Agency User or Admin
- I want to manage my own profile information
- So that my account information is accurate and I can change my password

---

## Task Details

### Task Description
Create the database schema for email verification to support admin-initiated email changes with token-based verification workflow.

### Subtasks Checklist
- [ ] Create `supabase/migrations/002_agency_domain/006_email_verification.sql`
- [ ] Add `users.email_verified_at` TIMESTAMPTZ field
- [ ] Add `users.pending_email` TEXT field for email change requests
- [ ] Add `users.email_verification_token` TEXT UNIQUE field
- [ ] Create trigger to log email changes in audit trail
- [ ] Add indexes on `email_verification_token` for performance

### Relevant Acceptance Criteria
- **AC8:** Admin can update their own email address
- **AC9:** Email changes require administrator verification via email link
- **AC10:** Email changes are logged in audit trail

---

## Context

### Key Constraints
- **Multi-Tenant Security:** All database operations MUST enforce Row-Level Security (RLS) using agency_id
- **Authentication & Authorization:** Email verification tokens expire after 1 hour; tokens are single-use (cleared after verification)
- **Database Patterns:** All user table updates trigger audit logging; email verification uses three fields: pending_email, email_verification_token, email_verified_at; audit logs are immutable (insert-only)

### Database Schema Extensions
```sql
-- Add email verification fields to users table
ALTER TABLE users
  ADD COLUMN email_verified_at TIMESTAMPTZ,
  ADD COLUMN pending_email TEXT,
  ADD COLUMN email_verification_token TEXT UNIQUE;

-- Index for token lookup performance
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);

-- Constraint: pending_email and token must both be set or both be NULL
ALTER TABLE users
  ADD CONSTRAINT check_email_change_consistency
  CHECK (
    (pending_email IS NULL AND email_verification_token IS NULL) OR
    (pending_email IS NOT NULL AND email_verification_token IS NOT NULL)
  );
```

### Audit Logging Trigger
```sql
-- Trigger to log email changes
CREATE OR REPLACE FUNCTION log_email_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log email change requests (pending_email set)
  IF OLD.pending_email IS NULL AND NEW.pending_email IS NOT NULL THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'email_change_requested',
      jsonb_build_object(
        'old_email', NEW.email,
        'requested_email', NEW.pending_email
      ),
      now()
    );
  END IF;

  -- Log completed email changes
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'email_changed',
      jsonb_build_object(
        'old_email', OLD.email,
        'new_email', NEW.email
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_email_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.pending_email IS DISTINCT FROM NEW.pending_email)
  EXECUTE FUNCTION log_email_changes();
```

### Architecture Reference
From [docs/architecture.md](docs/architecture.md) - Data Architecture - Agency Domain:
> Users table with role-based access (agency_admin, agency_user). RLS policies enforce multi-tenant isolation. Email verification pattern uses token-based workflow with 1-hour expiration.

---

## 🎯 MANIFEST CREATION (CRITICAL - Task 1 Only)

Before implementing this task, you MUST create a manifest file to track progress through all 13 tasks.

**Create file:** `.bmad-ephemeral/stories/prompts/2-4/MANIFEST.md`

**Manifest Template:**
```markdown
# Story 2-4 Implementation Manifest

**Story:** User Profile Management
**Status:** In Progress
**Started:** [INSERT TODAY'S DATE]

## Task Progress

### Task 1: Create email verification schema for admin email changes
- **Status:** In Progress
- **Started:** [INSERT TODAY'S DATE]
- **Completed:**
- **Notes:**

### Task 2: Implement profile update API endpoint
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 3: Implement password change API endpoint
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 4: Implement admin email change API endpoint
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 5: Implement email verification confirmation endpoint
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 6: Create user profile page
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 7: Create change password dialog
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 8: Create update email dialog (admin only)
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 9: Create request email change dialog (regular user)
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 10: Create email verification page
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 11: Create email verification email template
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 12: Create validation schemas
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

### Task 13: Write tests for profile management
- **Status:** Not Started
- **Started:**
- **Completed:**
- **Notes:**

## Implementation Notes

[Add notes as you progress through tasks]
```

---

## Implementation Steps

1. **Create the migration file** at `supabase/migrations/002_agency_domain/006_email_verification.sql`
2. **Add the three email verification fields** to the users table
3. **Create the consistency constraint** to ensure pending_email and token are set together
4. **Add the index** on email_verification_token for performance
5. **Create the log_email_changes() function** with both request and completion logging
6. **Create the trigger** to automatically log email changes
7. **Test the migration** locally using `supabase migration up`

### Verification
- Verify all fields were added: `\d users` in psql
- Verify constraint works: Try inserting pending_email without token (should fail)
- Verify trigger fires: Update a user's pending_email and check audit_log table

---

## Next Steps

After completing Task 1:
1. **Update the manifest:** Mark Task 1 as "Completed" with today's date
2. **Add implementation notes:** Document any challenges or decisions made
3. **Move to Task 2:** Open `02-implement-profile-update-api-route.md`

---

## Reference Documents
- Story context: [.bmad-ephemeral/stories/2-4-user-profile-management.context.xml](.bmad-ephemeral/stories/2-4-user-profile-management.context.xml)
- Full story details: [.bmad-ephemeral/stories/2-4-user-profile-management.md](.bmad-ephemeral/stories/2-4-user-profile-management.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- PRD: [docs/PRD.md](docs/PRD.md)
