import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface SponsoredListing {
  id: string;
  cleaner_profile_id: string;
  user_id: string;
  is_sponsored: boolean;
  sponsored_priority: number;
  sponsored_start: string | null;
  sponsored_end: string | null;
  sponsored_status: "inactive" | "requested" | "active" | "expired";
  sponsored_note: string | null;
  sponsored_views_count: number;
  sponsored_quote_clicks: number;
  sponsored_book_clicks: number;
  created_at: string;
  updated_at: string;
  // Joined from cleaner_profiles
  cleaner_profiles?: {
    id: string;
    business_name: string;
    profile_image: string | null;
    hourly_rate: number;
    services: string[];
    service_areas: string[];
    is_verified: boolean;
    instant_booking: boolean;
    response_time: string | null;
    bio: string | null;
  };
}

// Public: fetch active sponsored listings for homepage/search
export const useActiveSponsoredListings = () => {
  return useQuery({
    queryKey: ["sponsored-listings", "active"],
    queryFn: async () => {
      const now = new Date().toISOString();
      // Use a single combined or() to avoid duplicate query-param collision in PostgREST
      const { data, error } = await supabase
        .from("sponsored_listings")
        .select(`
          *,
          cleaner_profiles (
            id, business_name, profile_image, hourly_rate,
            services, service_areas, is_verified, instant_booking,
            response_time, bio
          )
        `)
        .eq("is_sponsored", true)
        .eq("sponsored_status", "active")
        .or(`sponsored_start.is.null,sponsored_start.lte.${now}`)
        .order("sponsored_priority", { ascending: false })
        .limit(12);

      if (error) throw error;
      // Filter expired end dates client-side (avoids double-or PostgREST issue)
      const results = (data as SponsoredListing[]) ?? [];
      return results.filter(
        (l) => !l.sponsored_end || new Date(l.sponsored_end) >= new Date()
      );
    },
  });
};

// Admin: fetch all sponsored listings with stats
export const useAdminSponsoredListings = () => {
  return useQuery({
    queryKey: ["sponsored-listings", "admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sponsored_listings")
        .select(`
          *,
          cleaner_profiles (
            id, business_name, profile_image, hourly_rate,
            services, service_areas, is_verified, instant_booking,
            response_time, bio
          )
        `)
        .order("sponsored_priority", { ascending: false });

      if (error) throw error;
      return (data as SponsoredListing[]) ?? [];
    },
  });
};

// Cleaner: fetch their own sponsorship record
export const useCleanerSponsorship = (cleanerProfileId: string | null) => {
  return useQuery({
    queryKey: ["sponsored-listings", "cleaner", cleanerProfileId],
    queryFn: async () => {
      if (!cleanerProfileId) return null;
      const { data, error } = await supabase
        .from("sponsored_listings")
        .select("*")
        .eq("cleaner_profile_id", cleanerProfileId)
        .maybeSingle();

      if (error) throw error;
      return data as SponsoredListing | null;
    },
    enabled: !!cleanerProfileId,
  });
};

// Track view impression
export const trackSponsoredView = async (listingId: string) => {
  await supabase.rpc("increment_sponsored_views", { listing_id: listingId });
};

// Track CTA click
export const trackSponsoredClick = async (listingId: string, clickType: "quote" | "book") => {
  await supabase.rpc("increment_sponsored_clicks", {
    listing_id: listingId,
    click_type: clickType,
  });
};

// Cleaner: request sponsorship
export const useRequestSponsorship = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      cleanerProfileId,
      userId,
      note,
    }: {
      cleanerProfileId: string;
      userId: string;
      note?: string;
    }) => {
      // Upsert — cleaner may already have a record
      const { error } = await supabase.from("sponsored_listings").upsert(
        {
          cleaner_profile_id: cleanerProfileId,
          user_id: userId,
          sponsored_status: "requested",
          sponsored_note: note || null,
          is_sponsored: false,
        },
        { onConflict: "cleaner_profile_id" }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsored-listings"] });
      toast({ title: "Sponsorship request submitted!", description: "Admin will review your request." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
};

// Admin: update sponsorship settings
export const useAdminUpdateSponsorship = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<SponsoredListing>;
    }) => {
      const { error } = await supabase
        .from("sponsored_listings")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sponsored-listings"] });
      toast({ title: "Sponsorship updated successfully." });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
};

// Admin: approve/reject request
export const useAdminApproveSponsorship = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      approve,
    }: {
      id: string;
      approve: boolean;
    }) => {
      const { error } = await supabase
        .from("sponsored_listings")
        .update({
          sponsored_status: approve ? "active" : "inactive",
          is_sponsored: approve,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["sponsored-listings"] });
      toast({
        title: approve ? "Sponsorship approved!" : "Sponsorship rejected.",
        description: approve ? "Listing is now live in Sponsored Spotlight." : "Request has been declined.",
      });
    },
    onError: (e: Error) => {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    },
  });
};
