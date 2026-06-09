-- Allow authenticated users to view all profiles (names/avatars are not sensitive)
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.uid() IS NOT NULL);