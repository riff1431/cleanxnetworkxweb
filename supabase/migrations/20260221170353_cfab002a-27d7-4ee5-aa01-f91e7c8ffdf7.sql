
-- Create storage bucket for cleaner profile images
INSERT INTO storage.buckets (id, name, public) VALUES ('cleaner-profiles', 'cleaner-profiles', true);

-- Allow cleaners to upload their own profile image
CREATE POLICY "Cleaners can upload profile images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cleaner-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow cleaners to update their own profile image
CREATE POLICY "Cleaners can update profile images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cleaner-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow cleaners to delete their own profile image
CREATE POLICY "Cleaners can delete profile images"
ON storage.objects FOR DELETE
USING (bucket_id = 'cleaner-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Anyone can view cleaner profile images
CREATE POLICY "Anyone can view cleaner profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'cleaner-profiles');
