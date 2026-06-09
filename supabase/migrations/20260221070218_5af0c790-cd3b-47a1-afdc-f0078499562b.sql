
-- Create jobs table
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'Home Cleaning',
  location TEXT NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  duration_hours INTEGER DEFAULT 2,
  preferred_date DATE,
  preferred_time TEXT,
  urgency TEXT NOT NULL DEFAULT 'flexible',
  status TEXT NOT NULL DEFAULT 'open',
  applications_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_applications table
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  cover_message TEXT,
  proposed_rate NUMERIC,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Jobs: Anyone can view open jobs
CREATE POLICY "Anyone can view open jobs"
ON public.jobs FOR SELECT
USING (status = 'open' OR auth.uid() = user_id);

-- Jobs: Authenticated users can create jobs
CREATE POLICY "Authenticated users can create jobs"
ON public.jobs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Jobs: Users can update their own jobs
CREATE POLICY "Users can update their own jobs"
ON public.jobs FOR UPDATE
USING (auth.uid() = user_id);

-- Jobs: Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs"
ON public.jobs FOR DELETE
USING (auth.uid() = user_id);

-- Jobs: Admins full access
CREATE POLICY "Admins can manage all jobs"
ON public.jobs FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Applications: Job owner can view applications for their jobs
CREATE POLICY "Job owners can view applications"
ON public.job_applications FOR SELECT
USING (
  auth.uid() = applicant_id
  OR EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.user_id = auth.uid())
);

-- Applications: Authenticated users can apply
CREATE POLICY "Users can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (auth.uid() = applicant_id);

-- Applications: Users can update their own applications
CREATE POLICY "Users can update their applications"
ON public.job_applications FOR UPDATE
USING (auth.uid() = applicant_id);

-- Applications: Job owners can update application status
CREATE POLICY "Job owners can update application status"
ON public.job_applications FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.user_id = auth.uid()));

-- Applications: Users can delete their own applications
CREATE POLICY "Users can delete their applications"
ON public.job_applications FOR DELETE
USING (auth.uid() = applicant_id);

-- Admins full access to applications
CREATE POLICY "Admins can manage all applications"
ON public.job_applications FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_applications_updated_at
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to increment applications count
CREATE OR REPLACE FUNCTION public.increment_job_applications()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.jobs SET applications_count = applications_count + 1 WHERE id = NEW.job_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER increment_applications_on_insert
AFTER INSERT ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.increment_job_applications();
