export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  target_audience: 'cleaner' | 'customer';
  tier: 'basic' | 'pro' | 'premium';
  monthly_price: number;
  features: string[];
  // Cleaner benefits
  priority_listing_boost: number;
  commission_discount: number;
  includes_verification_badge: boolean;
  includes_analytics_access: boolean;
  // Customer benefits
  booking_discount_percent: number;
  priority_booking: boolean;
  premium_support: boolean;
  express_booking: boolean;
  // Status
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_id: string;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  payment_method: 'bank_transfer' | 'stripe';
  start_date: string | null;
  end_date: string | null;
  next_billing_date: string | null;
  last_payment_date: string | null;
  last_payment_amount: number | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  plan?: SubscriptionPlan;
}

export interface SubscriptionPayment {
  id: string;
  subscription_id: string;
  user_id: string;
  plan_id: string;
  amount: number;
  payment_method: string;
  status: 'pending' | 'verified' | 'rejected';
  billing_period_start: string;
  billing_period_end: string;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  created_at: string;
  updated_at: string;
  // Joined data
  subscription?: UserSubscription;
  plan?: SubscriptionPlan;
}

export type SubscriptionTier = 'basic' | 'pro' | 'premium';
export type TargetAudience = 'cleaner' | 'customer';
