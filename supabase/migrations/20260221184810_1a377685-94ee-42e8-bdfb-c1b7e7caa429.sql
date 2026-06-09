
-- Create invoices table
CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL UNIQUE,
  booking_id uuid REFERENCES public.bookings(id),
  customer_id uuid NOT NULL,
  cleaner_id uuid,
  amount numeric NOT NULL,
  commission_amount numeric NOT NULL DEFAULT 0,
  net_amount numeric NOT NULL DEFAULT 0,
  service_type text NOT NULL,
  service_date date NOT NULL,
  status text NOT NULL DEFAULT 'issued',
  notes text,
  due_date date,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);

-- Sequence for invoice numbering
CREATE SEQUENCE public.invoice_number_seq START 1;

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := 'INV-' || LPAD(nextval('public.invoice_number_seq')::text, 5, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_invoice_number();

-- Auto-generate invoice on booking completion
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_on_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  commission_rate numeric;
  commission numeric;
  net numeric;
BEGIN
  IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
    -- Check if invoice already exists for this booking
    IF EXISTS (SELECT 1 FROM public.invoices WHERE booking_id = NEW.id) THEN
      RETURN NEW;
    END IF;

    SELECT platform_commission_rate INTO commission_rate FROM public.platform_settings LIMIT 1;
    commission_rate := COALESCE(commission_rate, 10);
    commission := ROUND(NEW.service_price * commission_rate / 100, 2);
    net := NEW.service_price - commission;

    INSERT INTO public.invoices (
      booking_id, customer_id, cleaner_id, amount, commission_amount, net_amount,
      service_type, service_date, status, due_date
    ) VALUES (
      NEW.id, NEW.customer_id, NEW.cleaner_id, NEW.service_price, commission, net,
      NEW.service_type, NEW.scheduled_date, 'paid', NEW.scheduled_date
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invoice_on_booking_complete
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_invoice_on_completion();

-- Auto-generate invoice on payment verification
CREATE OR REPLACE FUNCTION public.auto_generate_invoice_on_payment_verified()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  commission_rate numeric;
  commission numeric;
  net numeric;
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'verified' THEN
    -- Check if invoice already exists for this booking
    IF NEW.booking_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.invoices WHERE booking_id = NEW.booking_id) THEN
      RETURN NEW;
    END IF;

    SELECT platform_commission_rate INTO commission_rate FROM public.platform_settings LIMIT 1;
    commission_rate := COALESCE(commission_rate, 10);
    commission := ROUND(NEW.amount * commission_rate / 100, 2);
    net := NEW.amount - commission;

    INSERT INTO public.invoices (
      booking_id, customer_id, cleaner_id, amount, commission_amount, net_amount,
      service_type, service_date, status, due_date, paid_at
    ) VALUES (
      NEW.booking_id, NEW.customer_id, NEW.cleaner_id, NEW.amount, commission, net,
      NEW.service_type, NEW.booking_date, 'paid', NEW.booking_date, now()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_invoice_on_payment_verified
  AFTER UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_generate_invoice_on_payment_verified();

-- Updated at trigger
CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Customers can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Cleaners can view their invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = cleaner_id);

CREATE POLICY "Admins can manage all invoices"
  ON public.invoices FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX idx_invoices_cleaner_id ON public.invoices(cleaner_id);
CREATE INDEX idx_invoices_booking_id ON public.invoices(booking_id);
