import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionPlan, TargetAudience } from "@/types/subscription";
import { useToast } from "@/hooks/use-toast";

export const useSubscriptionPlans = (targetAudience?: TargetAudience) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchPlans = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("subscription_plans")
        .select("*")
        .order("monthly_price", { ascending: true });

      if (targetAudience) {
        query = query.eq("target_audience", targetAudience);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Parse features from JSONB to array
      const parsedPlans = (data || []).map(plan => ({
        ...plan,
        features: Array.isArray(plan.features) ? plan.features : JSON.parse(plan.features as string || '[]')
      })) as SubscriptionPlan[];

      setPlans(parsedPlans);
    } catch (err) {
      console.error("Error fetching subscription plans:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [targetAudience]);

  const createPlan = async (plan: Omit<SubscriptionPlan, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error: createError } = await supabase
        .from("subscription_plans")
        .insert({
          ...plan,
          features: JSON.stringify(plan.features)
        })
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Plan created",
        description: "Subscription plan has been created successfully.",
      });

      await fetchPlans();
      return data;
    } catch (err) {
      console.error("Error creating plan:", err);
      toast({
        title: "Error",
        description: "Failed to create subscription plan.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const updatePlan = async (id: string, updates: Partial<SubscriptionPlan>) => {
    try {
      const updateData = {
        ...updates,
        features: updates.features ? JSON.stringify(updates.features) : undefined
      };

      const { error: updateError } = await supabase
        .from("subscription_plans")
        .update(updateData)
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Plan updated",
        description: "Subscription plan has been updated successfully.",
      });

      await fetchPlans();
    } catch (err) {
      console.error("Error updating plan:", err);
      toast({
        title: "Error",
        description: "Failed to update subscription plan.",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deletePlan = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from("subscription_plans")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      toast({
        title: "Plan deleted",
        description: "Subscription plan has been deleted successfully.",
      });

      await fetchPlans();
    } catch (err) {
      console.error("Error deleting plan:", err);
      toast({
        title: "Error",
        description: "Failed to delete subscription plan.",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    plans,
    loading,
    error,
    refetch: fetchPlans,
    createPlan,
    updatePlan,
    deletePlan,
  };
};

export default useSubscriptionPlans;
