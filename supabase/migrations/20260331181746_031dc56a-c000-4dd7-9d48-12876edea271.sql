
DROP POLICY IF EXISTS "Providers can update their own pending documents" ON public.provider_verification_documents;

CREATE POLICY "Providers can update their own documents"
ON public.provider_verification_documents
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status IN ('pending', 'rejected'))
WITH CHECK (auth.uid() = user_id);
