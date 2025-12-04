# ⚠️ CRITICAL: Supabase Password Hash Requirements

## The Problem
Supabase **DOES NOT** accept pre-generated bcrypt hashes. You MUST use Supabase's built-in `crypt()` function with `gen_salt('bf')` to generate password hashes.

## ❌ WRONG - Will NOT Work
```sql
-- This hardcoded hash will NOT work with Supabase Auth
INSERT INTO auth.users (encrypted_password) VALUES
  ('$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
```

## ✅ CORRECT - Will Work
```sql
-- Use Supabase's crypt() function to generate the hash
INSERT INTO auth.users (encrypted_password) VALUES
  (crypt('password', gen_salt('bf')));
```

## Files Updated
The following files have been fixed to use the correct password generation:

1. **supabase/seed.sql** - Main seed file (FIXED)
2. **supabase/seed-fixed.sql** - Complete working version with all fixes

## For Migration Files
When creating new migrations that insert users, ALWAYS use:
```sql
crypt('your_password_here', gen_salt('bf'))
```

## For Existing Users
To fix existing users with wrong password hashes:
```sql
UPDATE auth.users
SET encrypted_password = crypt('password', gen_salt('bf'))
WHERE email = 'user@example.com';
```

## Testing
After running seed files, test authentication with:
```bash
curl 'https://your-project.supabase.co/auth/v1/token?grant_type=password' \
  -H 'apikey: your-anon-key' \
  -H 'content-type: application/json' \
  --data-raw '{"email":"admin@test.local","password":"password"}'
```

## Remember
- NEVER hardcode bcrypt hashes
- ALWAYS use `crypt()` with `gen_salt('bf')`
- All seed users now use password: `password`
- This applies to ALL environments (local, UAT, production)