
-- 1. Notifications: only allow inserting notifications for yourself (triggers use SECURITY DEFINER and bypass RLS)
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON public.notifications;
CREATE POLICY "Users can create their own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Jobs: require authentication to view open jobs (avoids leaking customer locations to public web)
DROP POLICY IF EXISTS "Anyone can view open jobs" ON public.jobs;
CREATE POLICY "Authenticated users can view open jobs"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (status = 'open' OR auth.uid() = user_id);

-- 3. Payment records: admin-only reads (denormalized emails were exposed to counterparty)
DROP POLICY IF EXISTS "Cleaners can view their payment records" ON public.payment_records;
DROP POLICY IF EXISTS "Customers can view their own payment records" ON public.payment_records;

-- 4. Platform settings: drop public read; expose a safe public view
DROP POLICY IF EXISTS "Anyone can read platform settings" ON public.platform_settings;

DROP VIEW IF EXISTS public.public_platform_settings;
CREATE VIEW public.public_platform_settings
WITH (security_invoker = true) AS
SELECT
  id,
  platform_name,
  support_email,
  maintenance_mode,
  site_tagline,
  platform_commission_rate,
  min_hourly_rate,
  max_hourly_rate,
  default_currency,
  min_booking_hours,
  max_booking_hours,
  cancellation_window_hours,
  advance_booking_days,
  allow_instant_booking,
  require_cleaner_verification,
  terms_url,
  privacy_url,
  updated_at
FROM public.platform_settings;

-- The view runs with security_invoker, but the underlying table is now admin-only.
-- Add a permissive SELECT policy on the table that allows reading the safe columns
-- only when the request originates from the view by checking column list is not feasible,
-- so instead expose the view via a SECURITY DEFINER function-backed RLS.
-- Simpler: add a SELECT policy allowing all authenticated and anon to read the table,
-- but only via column-limited interface. Since we cannot column-limit RLS, instead create
-- a SECURITY DEFINER function that returns the safe row.
DROP VIEW IF EXISTS public.public_platform_settings;

CREATE OR REPLACE FUNCTION public.get_public_platform_settings()
RETURNS TABLE (
  id uuid,
  platform_name text,
  support_email text,
  maintenance_mode boolean,
  site_tagline text,
  platform_commission_rate numeric,
  min_hourly_rate numeric,
  max_hourly_rate numeric,
  default_currency text,
  min_booking_hours integer,
  max_booking_hours integer,
  cancellation_window_hours integer,
  advance_booking_days integer,
  allow_instant_booking boolean,
  require_cleaner_verification boolean,
  terms_url text,
  privacy_url text,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id, platform_name, support_email, maintenance_mode, site_tagline,
    platform_commission_rate, min_hourly_rate, max_hourly_rate, default_currency,
    min_booking_hours, max_booking_hours, cancellation_window_hours,
    advance_booking_days, allow_instant_booking, require_cleaner_verification,
    terms_url, privacy_url, updated_at
  FROM public.platform_settings
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_platform_settings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_platform_settings() TO anon, authenticated;

-- 5. user_roles: tighten policies to authenticated role only (no public/anon)
DROP POLICY IF EXISTS "Admins can delete user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update user roles" ON public.user_roles;
CREATE POLICY "Admins can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Profiles: restrict broad authenticated SELECT to relationships
CREATE OR REPLACE FUNCTION public.can_view_profile(_target uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    auth.uid() = _target
    OR has_role(auth.uid(), 'admin'::app_role)
    -- Cleaner profiles are public listings; allow viewing the underlying profile name/avatar
    OR EXISTS (SELECT 1 FROM public.cleaner_profiles cp WHERE cp.user_id = _target)
    -- Shared conversation
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE (c.customer_id = auth.uid() AND c.provider_id = _target)
         OR (c.provider_id = auth.uid() AND c.customer_id = _target)
    )
    -- Shared booking
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.customer_id = auth.uid() AND b.cleaner_id = _target)
         OR (b.cleaner_id = auth.uid() AND b.customer_id = _target)
    );
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid) TO authenticated;

DROP POLICY IF EXISTS "Authenticated users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view related profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.can_view_profile(id));

-- 7. Lock down SECURITY DEFINER functions from being directly callable by clients.
-- Keep has_role and get_user_role executable (used by RLS policies).
REVOKE EXECUTE ON FUNCTION public.credit_wallet(uuid, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debit_wallet(uuid, numeric, text, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_sponsored_views(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_sponsored_clicks(uuid, text) FROM PUBLIC, anon;
-- Keep increment_sponsored_* callable by authenticated for tracking from the app
GRANT EXECUTE ON FUNCTION public.increment_sponsored_views(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_sponsored_clicks(uuid, text) TO authenticated;
