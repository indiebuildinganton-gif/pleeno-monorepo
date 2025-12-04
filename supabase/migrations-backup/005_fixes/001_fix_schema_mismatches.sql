BEGIN;

-- 1. Add gst_rate to agencies
ALTER TABLE public.agencies ADD COLUMN IF NOT EXISTS gst_rate DECIMAL(4,2) DEFAULT 0.1;

-- 2. Fix security definer functions (remove SET LOCAL ROLE)

-- Function to get user's agency_id
CREATE OR REPLACE FUNCTION public.get_user_agency_id()
RETURNS UUID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  v_agency_id UUID;
BEGIN
  -- Function is owned by postgres (BYPASSRLS), so we don't need to switch roles
  -- Just query directly. RLS is bypassed because of SECURITY DEFINER + Owner privileges.
  SELECT agency_id INTO v_agency_id
  FROM users
  WHERE id = auth.uid();

  RETURN v_agency_id;
END;
$$;

-- Function to check if user is agency admin
CREATE OR REPLACE FUNCTION public.is_agency_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Function is owned by postgres (BYPASSRLS), so we don't need to switch roles
  SELECT role INTO v_role
  FROM users
  WHERE id = auth.uid();

  RETURN v_role = 'agency_admin';
END;
$$;

-- Ensure ownership is correct (just in case)
ALTER FUNCTION public.get_user_agency_id() OWNER TO postgres;
ALTER FUNCTION public.is_agency_admin() OWNER TO postgres;

COMMIT;
