-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('cleaner', 'customer')),
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro', 'premium')),
  monthly_price NUMERIC NOT NULL DEFAULT 0,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Cleaner benefits
  priority_listing_boost INTEGER DEFAULT 0,
  commission_discount NUMERIC DEFAULT 0,
  includes_verification_badge BOOLEAN DEFAULT false,
  includes_analytics_access BOOLEAN DEFAULT false,
  -- Customer benefits
  booking_discount_percent NUMERIC DEFAULT 0,
  priority_booking BOOLEAN DEFAULT false,
  premium_support BOOLEAN DEFAULT false,
  express_booking BOOLEAN DEFAULT false,
  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled', 'expired')),
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer' CHECK (payment_method IN ('bank_transfer', 'stripe')),
  -- Dates
  start_date DATE,
  end_date DATE,
  next_billing_date DATE,
  -- Payment tracking
  last_payment_date TIMESTAMP WITH TIME ZONE,
  last_payment_amount NUMERIC,
  -- Stripe fields for future use
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscription payment records table
CREATE TABLE public.subscription_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID NOT NULL REFERENCES public.user_subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  amount NUMERIC NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'bank_transfer',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  -- Verification
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID,
  rejection_reason TEXT,
  -- Timestamps
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Subscription Plans Policies (public read for active plans, admin full access)
CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert subscription plans"
  ON public.subscription_plans FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update subscription plans"
  ON public.subscription_plans FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscription plans"
  ON public.subscription_plans FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- User Subscriptions Policies
CREATE POLICY "Users can view their own subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own subscriptions"
  ON public.user_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all subscriptions"
  ON public.user_subscriptions FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete subscriptions"
  ON public.user_subscriptions FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Subscription Payments Policies
CREATE POLICY "Users can view their own payments"
  ON public.subscription_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payments"
  ON public.subscription_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all payments"
  ON public.subscription_payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payments"
  ON public.subscription_payments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscription_payments_updated_at
  BEFORE UPDATE ON public.subscription_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, target_audience, tier, monthly_price, features, priority_listing_boost, commission_discount, includes_verification_badge, includes_analytics_access)
VALUES 
  ('Cleaner Basic', 'Essential features for independent cleaners', 'cleaner', 'basic', 19.99, '["Priority listing boost", "5% reduced commission"]', 10, 5, false, false),
  ('Cleaner Pro', 'Professional features for growing businesses', 'cleaner', 'pro', 39.99, '["Higher priority listing", "7% reduced commission", "Verification badge"]', 25, 7, true, false),
  ('Cleaner Premium', 'Complete suite for established cleaning businesses', 'cleaner', 'premium', 79.99, '["Top priority listing", "10% reduced commission", "Verification badge", "Analytics access"]', 50, 10, true, true);

INSERT INTO public.subscription_plans (name, description, target_audience, tier, monthly_price, features, booking_discount_percent, priority_booking, premium_support, express_booking)
VALUES 
  ('Customer Basic', 'Save on your regular cleaning bookings', 'customer', 'basic', 9.99, '["5% off all bookings", "Priority booking access"]', 5, true, false, false),
  ('Customer Pro', 'Enhanced benefits for frequent users', 'customer', 'pro', 19.99, '["10% off all bookings", "Priority booking", "Premium support"]', 10, true, true, false),
  ('Customer Premium', 'Maximum savings and VIP treatment', 'customer', 'premium', 29.99, '["15% off all bookings", "Priority booking", "Premium support", "Express booking"]', 15, true, true, true);