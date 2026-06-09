-- Create cleaner_profiles table for business information
CREATE TABLE public.cleaner_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  bio TEXT,
  hourly_rate NUMERIC NOT NULL DEFAULT 50,
  services TEXT[] NOT NULL DEFAULT ARRAY['Home Cleaning'],
  service_areas TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  years_experience INTEGER DEFAULT 0,
  profile_image TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_verified BOOLEAN NOT NULL DEFAULT false,
  instant_booking BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  response_time TEXT DEFAULT 'Responds in ~1 hour',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cleaner_profiles ENABLE ROW LEVEL SECURITY;

-- Cleaners can view their own profile
CREATE POLICY "Cleaners can view their own profile"
ON public.cleaner_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Cleaners can update their own profile
CREATE POLICY "Cleaners can update their own profile"
ON public.cleaner_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Cleaners can insert their own profile
CREATE POLICY "Cleaners can insert their own profile"
ON public.cleaner_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Anyone can view active cleaner profiles (for search/discovery)
CREATE POLICY "Anyone can view active cleaner profiles"
ON public.cleaner_profiles
FOR SELECT
USING (is_active = true);

-- Add policy for cleaners to view bookings assigned to them
CREATE POLICY "Cleaners can view their assigned bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = cleaner_id);

-- Add policy for cleaners to update their assigned bookings
CREATE POLICY "Cleaners can update their assigned bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = cleaner_id);

-- Create trigger for updated_at
CREATE TRIGGER update_cleaner_profiles_updated_at
BEFORE UPDATE ON public.cleaner_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();