# Task 1: Extend Users Table Schema with Status Field

**Story:** 2.3 User Management Interface
**AC:** 3, 4

## Context

You're implementing user management functionality that requires tracking user status (active/inactive) and preventing inactive users from logging in.

## Task

Extend the users table schema with a status field and create the necessary database constraints and triggers.

## Requirements

1. Create migration file: `supabase/migrations/002_agency_domain/005_users_status.sql`
2. Add `users.status` field: ENUM ('active', 'inactive') DEFAULT 'active'
3. Add constraint to prevent admin from deactivating themselves (enforced at API level)
4. Create trigger to prevent login for inactive users
5. Update RLS policies to check status for authentication

## Implementation Details

```sql
-- Add status field to users table
ALTER TABLE users ADD COLUMN status TEXT
  CHECK (status IN ('active', 'inactive'))
  DEFAULT 'active';

-- Trigger to check user status on login
CREATE OR REPLACE FUNCTION check_user_active()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'inactive' THEN
    RAISE EXCEPTION 'User account is deactivated';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_user_active_trigger
  BEFORE INSERT OR UPDATE ON auth.sessions
  FOR EACH ROW
  EXECUTE FUNCTION check_user_active();

-- Audit logging trigger for status changes
CREATE OR REPLACE FUNCTION log_user_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Log status changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'status_change',
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      now()
    );
  END IF;

  -- Log role changes
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_log (entity_type, entity_id, user_id, action, changes_json, created_at)
    VALUES (
      'user',
      NEW.id,
      current_setting('app.current_user_id', TRUE)::UUID,
      'role_change',
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role
      ),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_changes_audit_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION log_user_changes();
```

## Architecture Alignment

- Migration location: `supabase/migrations/002_agency_domain/005_users_status.sql`
- Follow existing migration naming pattern
- Use audit_log table structure from Story 2.2
- RLS policies automatically filter by agency_id

## Acceptance Criteria

- [ ] Migration file created with correct naming
- [ ] Status field added with proper ENUM constraint
- [ ] Default value set to 'active'
- [ ] Trigger prevents inactive users from creating sessions
- [ ] Audit logging captures status and role changes
- [ ] Migration runs successfully without errors

## Next Steps

After completing this task:
1. Run the migration: `supabase migration up`
2. Verify the status field exists in the users table
3. Test that the trigger prevents inactive user logins
4. Proceed to Task 2: Implement User Role Change API
