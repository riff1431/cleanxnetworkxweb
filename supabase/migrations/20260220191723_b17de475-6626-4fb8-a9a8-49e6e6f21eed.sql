
-- Create cleaner_of_the_week table
CREATE TABLE public.cleaner_of_the_week (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cleaner_profile_id uuid NOT NULL REFERENCES public.cleaner_profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  week_end date NOT NULL,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Only one active entry at a time (partial unique index)
CREATE UNIQUE INDEX cleaner_of_the_week_active_unique ON public.cleaner_of_the_week (is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.cleaner_of_the_week ENABLE ROW LEVEL SECURITY;

-- Anyone can view the active cleaner of the week
CREATE POLICY "Anyone can view active cleaner of the week"
  ON public.cleaner_of_the_week
  FOR SELECT
  USING (is_active = true);

-- Admins have full access
CREATE POLICY "Admins can view all cleaner of the week"
  ON public.cleaner_of_the_week
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert cleaner of the week"
  ON public.cleaner_of_the_week
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update cleaner of the week"
  ON public.cleaner_of_the_week
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete cleaner of the week"
  ON public.cleaner_of_the_week
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Auto-update updated_at
CREATE TRIGGER update_cleaner_of_the_week_updated_at
  BEFORE UPDATE ON public.cleaner_of_the_week
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
