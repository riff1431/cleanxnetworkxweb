
-- Create theme_settings table for storing website appearance configuration
CREATE TABLE public.theme_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  setting_type text NOT NULL DEFAULT 'text',
  category text NOT NULL DEFAULT 'general',
  label text NOT NULL,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid
);

-- Enable RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage theme settings
CREATE POLICY "Admins can view theme settings" ON public.theme_settings FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert theme settings" ON public.theme_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update theme settings" ON public.theme_settings FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete theme settings" ON public.theme_settings FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read theme settings (needed for frontend rendering)
CREATE POLICY "Anyone can read theme settings" ON public.theme_settings FOR SELECT USING (true);

-- Insert default theme settings
INSERT INTO public.theme_settings (setting_key, setting_value, setting_type, category, label, description) VALUES
  ('logo_url', NULL, 'image', 'branding', 'Site Logo', 'Main website logo displayed in the header'),
  ('favicon_url', NULL, 'image', 'branding', 'Favicon', 'Browser tab icon (recommended 32x32 or 64x64)'),
  ('hero_bg_image', NULL, 'image', 'images', 'Hero Background', 'Homepage hero section background image'),
  ('primary_color', '207 70% 35%', 'color', 'colors', 'Primary Color', 'Main brand color (blue)'),
  ('secondary_color', '142 70% 45%', 'color', 'colors', 'Secondary Color', 'Accent brand color (green)'),
  ('accent_color', '45 93% 47%', 'color', 'colors', 'Accent Color', 'Highlight color for ratings/badges (gold)'),
  ('destructive_color', '0 84% 60%', 'color', 'colors', 'Destructive Color', 'Error/danger color (red)'),
  ('background_color', '200 30% 98%', 'color', 'colors', 'Background Color', 'Page background color'),
  ('foreground_color', '215 25% 15%', 'color', 'colors', 'Text Color', 'Main text color'),
  ('header_style', 'light', 'select', 'branding', 'Header Style', 'Header appearance: light or dark'),
  ('footer_bg_image', NULL, 'image', 'images', 'Footer Background', 'Footer section background image'),
  ('og_image', NULL, 'image', 'images', 'Social Share Image', 'Image shown when sharing on social media');

-- Create storage bucket for theme assets
INSERT INTO storage.buckets (id, name, public) VALUES ('theme-assets', 'theme-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for theme assets
CREATE POLICY "Anyone can view theme assets" ON storage.objects FOR SELECT USING (bucket_id = 'theme-assets');
CREATE POLICY "Admins can upload theme assets" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'theme-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update theme assets" ON storage.objects FOR UPDATE USING (bucket_id = 'theme-assets' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete theme assets" ON storage.objects FOR DELETE USING (bucket_id = 'theme-assets' AND has_role(auth.uid(), 'admin'::app_role));
