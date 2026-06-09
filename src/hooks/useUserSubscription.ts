import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserSubscription, SubscriptionPlan, SubscriptionPayment } from "@/types/subscription";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { addMonths, format } from "date-fns";

export const useUserSubscription = () => {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("user_subscriptions")
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq("user_id", user.id)
        .in("status", ["active", "pending"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (data) {
        // Parse features in the plan
        const parsedSubscription = {
          ...data,
          plan: data.plan ? {
            ...data.plan,
            features: Array.isArray(data.plan.features) 
              ? data.plan.features 
              : JSON.parse(data.plan.features as string || '[]')
          } : undefined
        } as UserSubscription;
        setSubscription(parsedSubscription);
      } else {
        setSubscription(null);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [user]);

  const subscribeToPlan = async (planId: string, paymentMethod: 'bank_transfer' | 'stripe' = 'bank_transfer') => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to subscribe.",
        variant: "destructive",
      });
      return null;
    }

    try {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (planError) throw planError;

      const today = new Date();
      const nextMonth = addMonths(today, 1);

      // Create subscription with pending status for bank transfer
      const { data: newSubscription, error: subError } = await supabase
        .from("user_subscriptions")
        .insert({
          user_id: user.id,
          plan_id: planId,
          status: paymentMethod === 'bank_transfer' ? 'pending' : 'active',
          payment_method: paymentMethod,
          start_date: format(today, 'yyyy-MM-dd'),
          end_date: format(nextMonth, 'yyyy-MM-dd'),
          next_billing_date: format(nextMonth, 'yyyy-MM-dd'),
        })
        .select()
        .single();

      if (subError) throw subError;

      // Create payment record for verification
      if (paymentMethod === 'bank_transfer') {
        const { error: paymentError } = await supabase
          .from("subscription_payments")
          .insert({
            subscription_id: newSubscription.id,
            user_id: user.id,
            plan_id: planId,
            amount: plan.monthly_price,
            payment_method: 'bank_transfer',
            status: 'pending',
            billing_period_start: format(today, 'yyyy-MM-dd'),
            billing_period_end: format(nextMonth, 'yyyy-MM-dd'),
          });

        if (paymentError) throw paymentError;
      }

      toast({
        title: "Subscription created",
        description: paymentMethod === 'bank_transfer' 
          ? "Please complete the bank transfer. Your subscription will be activated after payment verification."
          : "Your subscription is now active.",
      });

      await fetchSubscription();
      return newSubscription;
    } catch (err) {
      console.error("Error subscribing to plan:", err);
      toast({
        title: "Error",
        description: "Failed to create subscription.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const cancelSubscription = async () => {
    if (!subscription) return;

    try {
      const { error: updateError } = await supabase
        .from("user_subscriptions")
        .update({ status: 'cancelled' })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      toast({
        title: "Subscription cancelled",
        description: "Your subscription has been cancelled.",
      });

      await fetchSubscription();
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      toast({
        title: "Error",
        description: "Failed to cancel subscription.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Helper to check if user has active subscription benefits
  const hasActiveSubscription = subscription?.status === 'active';
  
  const getBookingDiscount = (): number => {
    if (!hasActiveSubscription || !subscription?.plan) return 0;
    return subscription.plan.booking_discount_percent || 0;
  };

  const hasPriorityBooking = (): boolean => {
    if (!hasActiveSubscription || !subscription?.plan) return false;
    return subscription.plan.priority_booking || false;
  };

  const hasPremiumSupport = (): boolean => {
    if (!hasActiveSubscription || !subscription?.plan) return false;
    return subscription.plan.premium_support || false;
  };

  const hasExpressBooking = (): boolean => {
    if (!hasActiveSubscription || !subscription?.plan) return false;
    return subscription.plan.express_booking || false;
  };

  // Cleaner benefits
  const getPriorityListingBoost = (): number => {
    if (!hasActiveSubscription || !subscription?.plan) return 0;
    return subscription.plan.priority_listing_boost || 0;
  };

  const getCommissionDiscount = (): number => {
    if (!hasActiveSubscription || !subscription?.plan) return 0;
    return subscription.plan.commission_discount || 0;
  };

  const hasVerificationBadge = (): boolean => {
    if (!hasActiveSubscription || !subscription?.plan) return false;
    return subscription.plan.includes_verification_badge || false;
  };

  const hasAnalyticsAccess = (): boolean => {
    if (!hasActiveSubscription || !subscription?.plan) return false;
    return subscription.plan.includes_analytics_access || false;
  };

  return {
    subscription,
    loading,
    error,
    refetch: fetchSubscription,
    subscribeToPlan,
    cancelSubscription,
    hasActiveSubscription,
    // Customer benefits
    getBookingDiscount,
    hasPriorityBooking,
    hasPremiumSupport,
    hasExpressBooking,
    // Cleaner benefits
    getPriorityListingBoost,
    getCommissionDiscount,
    hasVerificationBadge,
    hasAnalyticsAccess,
  };
};

export default useUserSubscription;
