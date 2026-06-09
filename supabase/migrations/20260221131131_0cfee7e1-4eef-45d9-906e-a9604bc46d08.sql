
-- Replace the overly permissive INSERT policy with a more specific one
-- Drop the old policy
DROP POLICY "Anyone can create quote requests" ON public.quote_requests;

-- Allow authenticated users to create quote requests (customer_id must match)
CREATE POLICY "Authenticated users can create quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Allow anonymous/guest submissions (customer_id is null)
CREATE POLICY "Guests can create quote requests"
  ON public.quote_requests FOR INSERT
  WITH CHECK (customer_id IS NULL);
