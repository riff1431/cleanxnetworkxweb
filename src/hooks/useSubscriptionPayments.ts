import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPayment, UserSubscription, SubscriptionPlan } from "@/types/subscription";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPaymentWithDetails extends SubscriptionPayment {
  subscription: UserSubscription & {
    user_profile?: {
      full_name: string | null;
      email: string | null;
    };
  };
  plan: SubscriptionPlan;
}

export const useSubscriptionPayments = () => {
  const [payments, setPayments] = useState<SubscriptionPaymentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchPayments = async (status?: 'pending' | 'verified' | 'rejected') => {
    try {
      setLoading(true);
      let query = supabase
        .from("subscription_payments")
        .select(`
          *,
          subscription:user_subscriptions(*),
          plan:subscription_plans(*)
        `)
        .order("submitted_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Fetch user profiles for each payment
      const paymentsWithProfiles = await Promise.all(
        (data || []).map(async (payment) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("id", payment.user_id)
            .single();

          return {
            ...payment,
            plan: {
              ...payment.plan,
              features: Array.isArray(payment.plan.features) 
                ? payment.plan.features 
                : JSON.parse(payment.plan.features as string || '[]')
            },
            subscription: {
              ...payment.subscription,
              user_profile: profile
            }
          } as SubscriptionPaymentWithDetails;
        })
      );

      setPayments(paymentsWithProfiles);
    } catch (err) {
      console.error("Error fetching subscription payments:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const verifyPayment = async (paymentId: string, adminId: string) => {
    try {
      // Update payment status
      const { data: payment, error: paymentError } = await supabase
        .from("subscription_payments")
        .update({
          status: 'verified',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Activate the subscription
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .update({
          status: 'active',
          last_payment_date: new Date().toISOString(),
          last_payment_amount: payment.amount,
        })
        .eq("id", payment.subscription_id);

      if (subError) throw subError;

      toast({
        title: "Payment verified",
        description: "The subscription payment has been verified and the subscription is now active.",
      });

      await fetchPayments();
    } catch (err) {
      console.error("Error verifying payment:", err);
      toast({
        title: "Error",
        description: "Failed to verify payment.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const rejectPayment = async (paymentId: string, adminId: string, reason: string) => {
    try {
      // Update payment status
      const { data: payment, error: paymentError } = await supabase
        .from("subscription_payments")
        .update({
          status: 'rejected',
          verified_at: new Date().toISOString(),
          verified_by: adminId,
          rejection_reason: reason,
        })
        .eq("id", paymentId)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // Cancel the subscription
      const { error: subError } = await supabase
        .from("user_subscriptions")
        .update({ status: 'cancelled' })
        .eq("id", payment.subscription_id);

      if (subError) throw subError;

      toast({
        title: "Payment rejected",
        description: "The subscription payment has been rejected.",
      });

      await fetchPayments();
    } catch (err) {
      console.error("Error rejecting payment:", err);
      toast({
        title: "Error",
        description: "Failed to reject payment.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    payments,
    loading,
    error,
    refetch: fetchPayments,
    verifyPayment,
    rejectPayment,
  };
};

export default useSubscriptionPayments;
