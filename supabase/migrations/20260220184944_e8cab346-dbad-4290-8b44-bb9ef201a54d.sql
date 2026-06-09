
-- Create sponsored_status enum
CREATE TYPE public.sponsored_status AS ENUM ('inactive', 'requested', 'active', 'expired');

-- Create sponsored_listings table
CREATE TABLE public.sponsored_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleaner_profile_id UUID NOT NULL REFERENCES public.cleaner_profiles(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_sponsored BOOLEAN NOT NULL DEFAULT false,
  sponsored_priority INTEGER NOT NULL DEFAULT 0,
  sponsored_start TIMESTAMP WITH TIME ZONE,
  sponsored_end TIMESTAMP WITH TIME ZONE,
  sponsored_status sponsored_status NOT NULL DEFAULT 'inactive',
  sponsored_note TEXT,
  sponsored_views_count INTEGER NOT NULL DEFAULT 0,
  sponsored_quote_clicks INTEGER NOT NULL DEFAULT 0,
  sponsored_book_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cleaner_profile_id)
);

-- Enable RLS
ALTER TABLE public.sponsored_listings ENABLE ROW LEVEL SECURITY;

-- Public can view active sponsored listings
CREATE POLICY "Anyone can view active sponsored listings"
  ON public.sponsored_listings
  FOR SELECT
  USING (sponsored_status = 'active' AND is_sponsored = true);

-- Cleaners can view their own sponsorship record
CREATE POLICY "Cleaners can view their own sponsorship"
  ON public.sponsored_listings
  FOR SELECT
  USING (auth.uid() = user_id);

-- Cleaners can insert their own sponsorship request
CREATE POLICY "Cleaners can insert their own sponsorship"
  ON public.sponsored_listings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Cleaners can update their own record (only note and request fields)
CREATE POLICY "Cleaners can update their own sponsorship note"
  ON public.sponsored_listings
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all sponsored listings
CREATE POLICY "Admins can view all sponsored listings"
  ON public.sponsored_listings
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all sponsored listings
CREATE POLICY "Admins can update all sponsored listings"
  ON public.sponsored_listings
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert sponsored listings
CREATE POLICY "Admins can insert sponsored listings"
  ON public.sponsored_listings
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete sponsored listings
CREATE POLICY "Admins can delete sponsored listings"
  ON public.sponsored_listings
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_sponsored_listings_updated_at
  BEFORE UPDATE ON public.sponsored_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment view count (public callable)
CREATE OR REPLACE FUNCTION public.increment_sponsored_views(listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsored_listings
  SET sponsored_views_count = sponsored_views_count + 1
  WHERE id = listing_id;
END;
$$;

-- Function to increment click count (public callable)
CREATE OR REPLACE FUNCTION public.increment_sponsored_clicks(listing_id UUID, click_type TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF click_type = 'quote' THEN
    UPDATE public.sponsored_listings
    SET sponsored_quote_clicks = sponsored_quote_clicks + 1
    WHERE id = listing_id;
  ELSIF click_type = 'book' THEN
    UPDATE public.sponsored_listings
    SET sponsored_book_clicks = sponsored_book_clicks + 1
    WHERE id = listing_id;
  END IF;
END;
$$;
