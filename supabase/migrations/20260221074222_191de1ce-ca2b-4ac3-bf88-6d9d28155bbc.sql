-- Add image_url column to jobs table
ALTER TABLE public.jobs ADD COLUMN image_url text NULL;

-- Create storage bucket for job images
INSERT INTO storage.buckets (id, name, public) VALUES ('job-images', 'job-images', true);

-- Storage policies: anyone can view job images
CREATE POLICY "Anyone can view job images"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-images');

-- Authenticated users can upload job images
CREATE POLICY "Authenticated users can upload job images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-images' AND auth.uid() IS NOT NULL);

-- Users can update their own job images
CREATE POLICY "Users can update their own job images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own job images
CREATE POLICY "Users can delete their own job images"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-images' AND auth.uid()::text = (storage.foldername(name))[1]);