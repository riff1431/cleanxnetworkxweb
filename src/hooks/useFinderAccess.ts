import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface FinderAccess {
  hasSubscription: boolean;
  canMessage: boolean;
  canViewContact: boolean;
  canPostJobs: boolean;
  canAccessCalendar: boolean;
  canSeeVerifiedProviders: boolean;
  isLoading: boolean;
  role: string | null;
}

export const useFinderAccess = (): FinderAccess => {
  const { user } = useAuth();

  const { data: role, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.role || null;
    },
  });

  const { data: subscription, isLoading: subLoading } = useQuery({
    queryKey: ["user-subscription-active", user?.id],
    enabled: !!user && role === "customer",
    queryFn: async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("id, status")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
  });

  const isLoading = roleLoading || subLoading;

  // Cleaners and admins always have full access
  const isPrivilegedRole = role === "cleaner" || role === "company" || role === "admin";
  const hasSubscription = isPrivilegedRole || !!subscription;

  return {
    hasSubscription,
    canMessage: hasSubscription,
    canViewContact: hasSubscription,
    canPostJobs: hasSubscription,
    canAccessCalendar: hasSubscription,
    canSeeVerifiedProviders: hasSubscription,
    isLoading,
    role,
  };
};
