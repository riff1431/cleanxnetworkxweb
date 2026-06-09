-- Create payment status enum
CREATE TYPE payment_status AS ENUM ('pending', 'verified', 'rejected');

-- Create payment_records table
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  cleaner_id UUID,
  cleaner_name TEXT,
  cleaner_email TEXT,
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  status payment_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  service_type TEXT NOT NULL,
  booking_date DATE NOT NULL,
  booking_time TEXT NOT NULL,
  customer_address TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can view all payment records"
ON public.payment_records
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payment records"
ON public.payment_records
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert payment records"
ON public.payment_records
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Customers can create their own payment records
CREATE POLICY "Customers can create their own payment records"
ON public.payment_records
FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Customers can view their own payment records
CREATE POLICY "Customers can view their own payment records"
ON public.payment_records
FOR SELECT
USING (auth.uid() = customer_id);

-- Cleaners can view payment records for their bookings
CREATE POLICY "Cleaners can view their payment records"
ON public.payment_records
FOR SELECT
USING (auth.uid() = cleaner_id);

-- Add updated_at trigger
CREATE TRIGGER update_payment_records_updated_at
BEFORE UPDATE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();