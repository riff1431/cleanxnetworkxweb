CREATE POLICY "Anyone can read platform settings"
ON public.platform_settings
FOR SELECT
USING (true);