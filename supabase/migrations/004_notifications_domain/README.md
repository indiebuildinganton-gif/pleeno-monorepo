# Notifications Domain Migrations

This directory contains migrations for the notifications system.

## Migration Order

1. **001_notifications_schema.sql** - Creates the notifications table with RLS policies
2. **002_add_metadata.sql** - Adds metadata column to notifications
3. **fix_rls_recursion.sql** - **CRITICAL FIX** - Resolves infinite recursion in RLS policies

## Critical Fix: RLS Recursion

### The Problem
The original RLS policies on both the `notifications` and `users` tables caused infinite recursion:
- Notifications policies queried `users` table to get `agency_id`
- Users table policies themselves recursively queried `users` table
- This created an infinite loop: notifications → users → users → users...

### The Solution
Created SECURITY DEFINER helper functions that explicitly bypass RLS:
- `public.get_user_agency_id()` - Returns user's agency_id
- `public.is_agency_admin()` - Checks if user is agency admin

These functions use `SET LOCAL ROLE postgres` to switch to the postgres superuser role (which has BYPASSRLS privilege) when querying the users table, then switch back.

### Affected Tables
- `notifications` - All policies updated to use helper functions
- `users` - Three policies updated: `users_agency_isolation_select`, `users_admin_update`, `users_admin_delete`

### IMPORTANT
The `fix_rls_recursion.sql` migration **MUST** be run if you:
- Reset your database
- Apply migrations to a new environment
- See the error: `infinite recursion detected in policy for relation "users"`

To apply all migrations in order, run:
```bash
./scripts/apply-migrations.sh
```
