import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CleanerOfTheWeek {
  id: string;
  cleaner_profile_id: string;
  week_start: string;
  week_end: string;
  note: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cleaner_profiles: {
    id: string;
    user_id: string;
    business_name: string;
    profile_image: string | null;
    hourly_rate: number;
    rating?: number;
    service_areas: string[];
    services: string[];
    bio: string | null;
    is_verified: boolean;
    instant_booking: boolean;
    response_time: string | null;
    years_experience: number | null;
  } | null;
}

export function useActiveCleanerOfTheWeek() {
  return useQuery({
    queryKey: ["cleaner-of-the-week", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaner_of_the_week")
        .select(`
          *,
          cleaner_profiles (
            id,
            user_id,
            business_name,
            profile_image,
            hourly_rate,
            service_areas,
            services,
            bio,
            is_verified,
            instant_booking,
            response_time,
            years_experience
          )
        `)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      return data as CleanerOfTheWeek | null;
    },
  });
}

export function useAllCleanerOfTheWeek() {
  return useQuery({
    queryKey: ["cleaner-of-the-week", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaner_of_the_week")
        .select(`
          *,
          cleaner_profiles (
            id,
            user_id,
            business_name,
            profile_image,
            hourly_rate,
            service_areas,
            services,
            bio,
            is_verified,
            instant_booking,
            response_time,
            years_experience
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as CleanerOfTheWeek[];
    },
  });
}

export function useSetCleanerOfTheWeek() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      cleanerProfileId,
      weekStart,
      weekEnd,
      note,
    }: {
      cleanerProfileId: string;
      weekStart: string;
      weekEnd: string;
      note?: string;
    }) => {
      // Deactivate any current active entry
      await supabase
        .from("cleaner_of_the_week")
        .update({ is_active: false })
        .eq("is_active", true);

      // Insert new entry
      const { error } = await supabase.from("cleaner_of_the_week").insert({
        cleaner_profile_id: cleanerProfileId,
        week_start: weekStart,
        week_end: weekEnd,
        note: note ?? null,
        is_active: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner-of-the-week"] });
      toast({ title: "Cleaner of the Week updated successfully!" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to set Cleaner of the Week", description: err.message, variant: "destructive" });
    },
  });
}

export function useDeactivateCleanerOfTheWeek() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cleaner_of_the_week")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cleaner-of-the-week"] });
      toast({ title: "Cleaner of the Week deactivated." });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to deactivate", description: err.message, variant: "destructive" });
    },
  });
}
