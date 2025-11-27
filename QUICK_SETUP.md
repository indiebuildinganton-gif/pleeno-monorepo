# Pleeno Database - Quick Setup Guide

**Last Updated:** 2025-11-28
**Status:** ✅ Verified Working

This is a quick reference for setting up the Pleeno database from scratch. For detailed explanations, see [DATABASE_SETUP_REPORT.md](DATABASE_SETUP_REPORT.md).

---

## Prerequisites

- Docker running
- Supabase CLI installed (`npx supabase`)
- Node.js and pnpm installed

---

## Quick Setup (5 Steps)

### Step 1: Start Supabase
```bash
npx supabase start
```

### Step 2: Apply Migrations & Seed Data
```bash
chmod +x ./scripts/apply-migrations.sh
./scripts/apply-migrations.sh
```

### Step 3: Create Admin User
```bash
curl -X POST http://localhost:54321/auth/v1/signup \
  -H "apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.local","password":"password","data":{"name":"Admin User"}}'
```

**Important:** Copy the `id` from the response - you'll need it in Step 5!

### Step 4: Add Role & Agency
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres << 'EOF'
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
    jsonb_set(raw_app_meta_data, '{role}', '"agency_admin"'),
    '{agency_id}', '"20000000-0000-0000-0000-000000000001"'
),
raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"agency_admin"')
WHERE email = 'admin@test.local';
EOF
```

### Step 5: Create Public User Record
```bash
# First, get the user ID
psql postgresql://postgres:postgres@localhost:54322/postgres << 'EOF'
SELECT id FROM auth.users WHERE email = 'admin@test.local';
EOF

# Then insert (replace USER_ID with actual ID from above)
psql postgresql://postgres:postgres@localhost:54322/postgres << 'EOF'
INSERT INTO public.users (id, email, full_name, agency_id, role, created_at, updated_at)
VALUES (
  'USER_ID_HERE',
  'admin@test.local',
  'Admin User',
  '20000000-0000-0000-0000-000000000001',
  'agency_admin',
  NOW(),
  NOW()
);
EOF
```

---

## Verify Setup

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres << 'EOF'
SELECT
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users WHERE email = 'admin@test.local'
UNION ALL
SELECT 'auth.identities', COUNT(*)
FROM auth.identities WHERE email = 'admin@test.local'
UNION ALL
SELECT 'public.users', COUNT(*)
FROM public.users WHERE email = 'admin@test.local';
-- All three should return count = 1
EOF
```

---

## Start Dev Servers

```bash
# Terminal 1 - Shell (Login)
pnpm run dev:shell

# Terminal 2 - Dashboard
pnpm run dev:dashboard
```

---

## Login

**URL:** http://localhost:3005/login

**Credentials:**
- Email: `admin@test.local`
- Password: `password`

**After login:** You'll be redirected to http://localhost:3002/dashboard

---

## What Data is Seeded?

- ✅ 1 Agency (Demo Agency)
- ✅ 10 Colleges
- ✅ 10 Branches
- ✅ 30 Students (India: 10, China: 8, Nepal: 6, Vietnam: 4, Philippines: 2)
- ✅ 30 Enrollments
- ✅ 30 Payment Plans
- ✅ 184 Installments (Pending: 50, Paid: 104, Overdue: 20, Cancelled: 10)
- ✅ 50 Activity Log Entries

**Total Payment Value:** $1,122,200.00

---

## Troubleshooting

### Login returns 401 "Invalid credentials"
Check if user exists in all three tables:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c \
  "SELECT * FROM auth.identities WHERE email = 'admin@test.local';"
```
If empty, user was created manually (not via Auth API). Delete and recreate using Step 3.

### Dashboard returns 403 "User not associated with an agency"
Check public.users table:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c \
  "SELECT * FROM public.users WHERE email = 'admin@test.local';"
```
If empty, run Step 5.

### Dashboard returns 403 "Insufficient permissions"
Check user role:
```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c \
  "SELECT raw_app_meta_data FROM auth.users WHERE email = 'admin@test.local';"
```
If role is missing, run Step 4.

---

## Reset Everything

```bash
# Stop Supabase
npx supabase stop

# Start fresh
npx supabase start

# Re-run setup from Step 2
./scripts/apply-migrations.sh
# Then continue with Steps 3-5
```

---

## Key Points

1. **MUST use Supabase Auth API** for user creation (Step 3) - manual SQL inserts won't work!
2. **User must exist in THREE tables:** `auth.users`, `auth.identities`, `public.users`
3. **Order matters:** Migrations → Auth API → Metadata → Public User
4. **Ports:** Shell (3005), Dashboard (3002), Supabase (54321/54322)

---

**For detailed troubleshooting and explanations, see:** [DATABASE_SETUP_REPORT.md](DATABASE_SETUP_REPORT.md)
