
-- Create provider_verification_documents table
CREATE TABLE public.provider_verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT,
  insurance_expiry_date DATE,
  status TEXT NOT NULL DEFAULT 'pending',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_verification_documents ENABLE ROW LEVEL SECURITY;

-- Providers can insert their own docs
CREATE POLICY "Providers can insert their own documents"
ON public.provider_verification_documents FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Providers can view their own docs
CREATE POLICY "Providers can view their own documents"
ON public.provider_verification_documents FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Providers can update their own pending docs
CREATE POLICY "Providers can update their own pending documents"
ON public.provider_verification_documents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all docs
CREATE POLICY "Admins can view all verification documents"
ON public.provider_verification_documents FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update all docs
CREATE POLICY "Admins can update all verification documents"
ON public.provider_verification_documents FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can delete docs
CREATE POLICY "Admins can delete verification documents"
ON public.provider_verification_documents FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create private storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('verification-documents', 'verification-documents', false);

-- Storage RLS: owners can upload
CREATE POLICY "Providers can upload verification documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Owners can view their own files
CREATE POLICY "Providers can view their verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Admins can view all files
CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents' AND public.has_role(auth.uid(), 'admin'));

-- Updated_at trigger
CREATE TRIGGER update_verification_documents_updated_at
  BEFORE UPDATE ON public.provider_verification_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
