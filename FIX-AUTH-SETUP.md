# 🚨 CRITICAL: Fix Missing Auth Schema in Supabase

## The Problem
The auth schema and its tables (auth.users, auth.identities, etc.) are **completely missing** from your Supabase project. This is why authentication returns a 500 error "Database error querying schema".

## The Solution

### Option 1: Enable Authentication in Supabase Dashboard (Recommended)

1. **Go to your Supabase project**: https://supabase.com/dashboard/project/ccmciliwfdtdspdlkuos

2. **Navigate to Authentication Settings**:
   - Click on **Authentication** in the left sidebar
   - Click on **Providers** tab
   - Make sure **Email** provider is enabled
   - Click **Save** if you made any changes

3. **Check if auth tables were created**:
   - Go to **Table Editor** in the left sidebar
   - Look for a dropdown or schema selector at the top
   - Check if you can see `auth` schema
   - If yes, check if `users` table exists inside it

4. **If auth schema is still missing**:
   - Go to **Settings** → **General**
   - Check if Authentication is enabled for the project
   - There might be an "Enable Authentication" button

### Option 2: Reset/Recreate the Project

If Option 1 doesn't work, the project might be corrupted:

1. **Create a new Supabase project**:
   - Go to https://app.supabase.com
   - Click "New Project"
   - Name it something like "pleeno-uat-v2"
   - **IMPORTANT**: Make sure to save the database password!

2. **Apply your migrations**:
   ```bash
   # Connect to new project
   supabase link --project-ref [NEW-PROJECT-REF]

   # Push your migrations
   supabase db push

   # Apply seed data
   supabase db seed
   ```

3. **Update your .env.uat** with new credentials

### Option 3: Manual Auth Schema Creation (Last Resort)

If you must use the current project, you can try manually creating the auth schema, but this is NOT recommended as it might break Supabase's internal functionality.

Run this SQL **ONLY if instructed by Supabase support**:
```sql
-- This is a simplified version and might not work properly
CREATE SCHEMA IF NOT EXISTS auth;

-- You would need the complete auth schema DDL from Supabase
-- which includes many tables, functions, and RLS policies
```

## Quick Diagnostic

Run this in SQL Editor to confirm the issue:
```sql
SELECT
  EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') as auth_schema_exists,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') as auth_users_table_exists;
```

Expected result:
- `auth_schema_exists`: true
- `auth_users_table_exists`: true

Your current result:
- `auth_schema_exists`: false or true
- `auth_users_table_exists`: false

## Next Steps

1. **First**: Try Option 1 - Enable Authentication in Dashboard
2. **If that fails**: Contact Supabase support and report that the auth schema is missing
3. **Alternative**: Create a new project (Option 2)

## Important Notes

- The auth schema is a **core Supabase feature** that should be created automatically
- It's managed by Supabase and contains critical authentication infrastructure
- Without it, NO authentication can work (not even Supabase Dashboard login for users)
- This might indicate the project was created with authentication disabled or there was an initialization error

## Contact Supabase Support

If the auth schema is missing and can't be enabled through the dashboard, contact Supabase support:
- Email: support@supabase.io
- Or use the support chat in the dashboard
- Tell them: "The auth schema is completely missing from project ccmciliwfdtdspdlkuos"