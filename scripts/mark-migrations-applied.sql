-- Mark migrations as already applied (if tables already exist)
-- Run this if you want to keep existing tables and data

INSERT INTO supabase_migrations.schema_migrations (version, inserted_at)
VALUES
    ('20241204000001', NOW()),
    ('20241204000002', NOW()),
    ('20241204000003', NOW()),
    ('20241204000004', NOW()),
    ('20241204000005', NOW()),
    ('20241204000006', NOW()),
    ('20241204000007', NOW()),
    ('20241204000008', NOW())
ON CONFLICT (version) DO NOTHING;

-- Verify
SELECT * FROM supabase_migrations.schema_migrations ORDER BY version;