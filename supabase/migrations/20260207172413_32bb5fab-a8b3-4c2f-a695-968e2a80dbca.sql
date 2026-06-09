-- Add more essential settings columns to platform_settings
ALTER TABLE public.platform_settings
ADD COLUMN platform_commission_rate numeric NOT NULL DEFAULT 10,
ADD COLUMN min_booking_hours integer NOT NULL DEFAULT 2,
ADD COLUMN max_booking_hours integer NOT NULL DEFAULT 8,
ADD COLUMN cancellation_window_hours integer NOT NULL DEFAULT 24,
ADD COLUMN advance_booking_days integer NOT NULL DEFAULT 30,
ADD COLUMN min_hourly_rate numeric NOT NULL DEFAULT 25,
ADD COLUMN max_hourly_rate numeric NOT NULL DEFAULT 150,
ADD COLUMN default_currency text NOT NULL DEFAULT 'CAD',
ADD COLUMN site_tagline text DEFAULT 'Find trusted cleaning professionals near you',
ADD COLUMN terms_url text,
ADD COLUMN privacy_url text,
ADD COLUMN allow_instant_booking boolean NOT NULL DEFAULT true,
ADD COLUMN require_cleaner_verification boolean NOT NULL DEFAULT true,
ADD COLUMN auto_approve_cleaners boolean NOT NULL DEFAULT false;