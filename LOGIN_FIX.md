# Login Error - Root Cause & Fix

## Problem
Login was failing with "Invalid credentials" error even though:
- User existed in database
- Password was correctly hashed
- Direct Supabase Auth API test succeeded

## Root Cause
The shell app was configured to use the **production Supabase instance** instead of the local development instance.

**File**: `apps/shell/.env.local`

**Wrong configuration**:
```
NEXT_PUBLIC_SUPABASE_URL=https://iadhxztsuzbkbnhkimqv.supabase.co
```

This meant:
- The app was trying to authenticate against production Supabase
- Your local user (`admin@test.local`) only exists in the local database
- Production database has no users yet

## Solution ✅
Updated `apps/shell/.env.local` to use local Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

## Action Required 🚨

**You MUST restart the shell app for the changes to take effect:**

```bash
# Start the shell app again
npm run dev:shell
```

Then login will work at: http://localhost:3005/login

## Login Credentials

- **Email**: `admin@test.local`
- **Password**: `Password123`

## Production Notes
The production Supabase credentials have been preserved as comments in the `.env.local` file. To deploy to production, uncomment those lines and comment out the local development lines.
