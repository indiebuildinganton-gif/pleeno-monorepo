-- Check what's in the database
SELECT 'Checking auth.users table:' as info;
SELECT id, email, created_at FROM auth.users WHERE email = 'admin@test.local';

SELECT '' as spacer;
SELECT 'Checking public.users table:' as info;
SELECT id, email, agency_id, role FROM public.users WHERE email = 'admin@test.local';

SELECT '' as spacer;
SELECT 'Checking agencies table:' as info;
SELECT id, name FROM public.agencies WHERE id = '20000000-0000-0000-0000-000000000001';

SELECT '' as spacer;
SELECT 'All users in auth.users:' as info;
SELECT id, email, created_at FROM auth.users LIMIT 5;

SELECT '' as spacer;
SELECT 'All users in public.users:' as info;
SELECT id, email, agency_id, role FROM public.users LIMIT 5;