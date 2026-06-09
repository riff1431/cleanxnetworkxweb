
-- Create service_listings table (Fiverr-style gig listings)
CREATE TABLE public.service_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  cleaner_profile_id UUID NOT NULL REFERENCES public.cleaner_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Home Cleaning',
  price_type TEXT NOT NULL DEFAULT 'fixed' CHECK (price_type IN ('fixed', 'hourly', 'starting_at')),
  price NUMERIC NOT NULL DEFAULT 50,
  duration_hours NUMERIC DEFAULT 2,
  image_url TEXT,
  gallery_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  location TEXT,
  service_area TEXT[] DEFAULT ARRAY[]::TEXT[],
  max_orders INTEGER DEFAULT 5,
  delivery_time TEXT DEFAULT 'Same day',
  views_count INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Anyone can view active service listings"
ON public.service_listings
FOR SELECT
USING (is_active = true);

-- Cleaners can view their own listings (including inactive)
CREATE POLICY "Cleaners can view their own listings"
ON public.service_listings
FOR SELECT
USING (auth.uid() = user_id);

-- Cleaners can create their own listings
CREATE POLICY "Cleaners can create their own listings"
ON public.service_listings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Cleaners can update their own listings
CREATE POLICY "Cleaners can update their own listings"
ON public.service_listings
FOR UPDATE
USING (auth.uid() = user_id);

-- Cleaners can delete their own listings
CREATE POLICY "Cleaners can delete their own listings"
ON public.service_listings
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can manage all listings
CREATE POLICY "Admins can manage all service listings"
ON public.service_listings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_service_listings_updated_at
BEFORE UPDATE ON public.service_listings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_service_listings_category ON public.service_listings(category);
CREATE INDEX idx_service_listings_user_id ON public.service_listings(user_id);
CREATE INDEX idx_service_listings_active ON public.service_listings(is_active);
