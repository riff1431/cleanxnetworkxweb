
-- 1. Notify cleaner when a new booking is created
CREATE OR REPLACE FUNCTION public.notify_new_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  customer_name text;
BEGIN
  -- Get customer name
  SELECT full_name INTO customer_name FROM public.profiles WHERE id = NEW.customer_id;

  -- Notify the cleaner (if assigned)
  IF NEW.cleaner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.cleaner_id,
      'booking',
      'New Booking Request',
      'You have a new ' || NEW.service_type || ' booking from ' || COALESCE(customer_name, 'a customer') || ' on ' || NEW.scheduled_date::text,
      '/cleaner/bookings',
      jsonb_build_object('booking_id', NEW.id, 'service_type', NEW.service_type, 'scheduled_date', NEW.scheduled_date)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_new_booking
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_booking();

-- 2. Notify customer when payment is verified or rejected
CREATE OR REPLACE FUNCTION public.notify_payment_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when status changes to verified or rejected
  IF OLD.status = 'pending' AND NEW.status = 'verified' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.customer_id,
      'payment',
      'Payment Verified ✅',
      'Your $' || NEW.amount::text || ' payment for ' || NEW.service_type || ' has been verified.',
      '/dashboard/bookings',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount)
    );
  ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.customer_id,
      'payment',
      'Payment Rejected ❌',
      'Your $' || NEW.amount::text || ' payment for ' || NEW.service_type || ' was rejected.' || CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Reason: ' || NEW.rejection_reason ELSE '' END,
      '/dashboard/bookings',
      jsonb_build_object('payment_id', NEW.id, 'amount', NEW.amount, 'reason', NEW.rejection_reason)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_payment_status
AFTER UPDATE ON public.payment_records
FOR EACH ROW
EXECUTE FUNCTION public.notify_payment_status_change();

-- 3. Notify job poster when someone applies to their job
CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  job_owner_id uuid;
  job_title text;
  applicant_name text;
BEGIN
  SELECT user_id, title INTO job_owner_id, job_title FROM public.jobs WHERE id = NEW.job_id;
  SELECT full_name INTO applicant_name FROM public.profiles WHERE id = NEW.applicant_id;

  IF job_owner_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      job_owner_id,
      'job_application',
      'New Application for "' || job_title || '"',
      COALESCE(applicant_name, 'Someone') || ' applied to your job posting.',
      '/jobs/' || NEW.job_id,
      jsonb_build_object('job_id', NEW.job_id, 'application_id', NEW.id, 'applicant_id', NEW.applicant_id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_job_application
AFTER INSERT ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION public.notify_job_application();

-- 4. Notify customer when cleaner accepts/declines their booking
CREATE OR REPLACE FUNCTION public.notify_booking_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status = 'pending' AND NEW.status = 'confirmed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.customer_id,
      'booking',
      'Booking Confirmed ✅',
      COALESCE(NEW.cleaner_name, 'Your cleaner') || ' has confirmed your ' || NEW.service_type || ' booking for ' || NEW.scheduled_date::text || '.',
      '/dashboard/upcoming',
      jsonb_build_object('booking_id', NEW.id)
    );
  ELSIF OLD.status = 'pending' AND NEW.status = 'cancelled' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.customer_id,
      'booking',
      'Booking Declined',
      'Your ' || NEW.service_type || ' booking for ' || NEW.scheduled_date::text || ' was declined.',
      '/dashboard/bookings',
      jsonb_build_object('booking_id', NEW.id)
    );
  ELSIF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.notifications (user_id, type, title, body, link, data)
    VALUES (
      NEW.customer_id,
      'booking',
      'Booking Completed 🎉',
      'Your ' || NEW.service_type || ' booking has been marked as completed. Leave a review!',
      '/dashboard/bookings',
      jsonb_build_object('booking_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_booking_status
AFTER UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.notify_booking_status_change();
