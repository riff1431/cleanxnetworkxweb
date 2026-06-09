
-- Create quote_request_status enum
CREATE TYPE public.quote_request_status AS ENUM ('new', 'assigned', 'responded', 'booked', 'closed', 'rejected');

-- Create quote_response_status enum
CREATE TYPE public.quote_response_status AS ENUM ('sent', 'accepted', 'declined');

-- Create quote_requests table
CREATE TABLE public.quote_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.service_listings(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  city TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  quote_type TEXT NOT NULL DEFAULT 'Residential',
  services JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferred_datetime TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  status public.quote_request_status NOT NULL DEFAULT 'new',
  assigned_provider_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quote_responses table
CREATE TABLE public.quote_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_request_id UUID NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  price_amount NUMERIC NOT NULL,
  message TEXT,
  status public.quote_response_status NOT NULL DEFAULT 'sent',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.quote_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quote_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Updated_at triggers
CREATE TRIGGER update_quote_requests_updated_at
  BEFORE UPDATE ON public.quote_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quote_responses_updated_at
  BEFORE UPDATE ON public.quote_responses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== QUOTE REQUESTS RLS ==========
-- Anyone (including guests) can create quote requests
CREATE POLICY "Anyone can create quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (true);

-- Customers can view their own quote requests
CREATE POLICY "Customers can view their own quote requests"
  ON public.quote_requests FOR SELECT
  USING (auth.uid() = customer_id);

-- Customers can update their own quote requests (e.g. cancel)
CREATE POLICY "Customers can update their own quote requests"
  ON public.quote_requests FOR UPDATE
  USING (auth.uid() = customer_id);

-- Assigned providers can view quote requests assigned to them
CREATE POLICY "Providers can view assigned quote requests"
  ON public.quote_requests FOR SELECT
  USING (auth.uid() = assigned_provider_id);

-- Providers can update assigned quote requests
CREATE POLICY "Providers can update assigned quote requests"
  ON public.quote_requests FOR UPDATE
  USING (auth.uid() = assigned_provider_id);

-- Cleaners can view new/unassigned quote requests
CREATE POLICY "Cleaners can view new quote requests"
  ON public.quote_requests FOR SELECT
  USING (
    status = 'new'::quote_request_status 
    AND has_role(auth.uid(), 'cleaner'::app_role)
  );

-- Admins can manage all quote requests
CREATE POLICY "Admins can manage all quote requests"
  ON public.quote_requests FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ========== QUOTE RESPONSES RLS ==========
-- Providers can create responses
CREATE POLICY "Providers can create quote responses"
  ON public.quote_responses FOR INSERT
  WITH CHECK (auth.uid() = provider_id);

-- Providers can view their own responses
CREATE POLICY "Providers can view their own responses"
  ON public.quote_responses FOR SELECT
  USING (auth.uid() = provider_id);

-- Providers can update their own responses
CREATE POLICY "Providers can update their own responses"
  ON public.quote_responses FOR UPDATE
  USING (auth.uid() = provider_id);

-- Customers can view responses to their quote requests
CREATE POLICY "Customers can view responses to their quotes"
  ON public.quote_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests
      WHERE quote_requests.id = quote_responses.quote_request_id
        AND quote_requests.customer_id = auth.uid()
    )
  );

-- Customers can update response status (accept/decline)
CREATE POLICY "Customers can update response status"
  ON public.quote_responses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.quote_requests
      WHERE quote_requests.id = quote_responses.quote_request_id
        AND quote_requests.customer_id = auth.uid()
    )
  );

-- Admins can manage all responses
CREATE POLICY "Admins can manage all quote responses"
  ON public.quote_responses FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ========== NOTIFICATIONS RLS ==========
-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- System/admins can create notifications for anyone
CREATE POLICY "Admins can manage all notifications"
  ON public.notifications FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated users to insert notifications (for system use)
CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
