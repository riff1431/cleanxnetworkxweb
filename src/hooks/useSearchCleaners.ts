import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CleanerSearchResult {
  id: string;
  business_name: string;
  profile_image: string | null;
  hourly_rate: number;
  services: string[];
  service_areas: string[];
  is_verified: boolean;
  instant_booking: boolean;
  bio: string | null;
  response_time: string | null;
  years_experience: number | null;
  user_id: string;
  avg_rating: number;
  review_count: number;
}

interface UseSearchCleanersOptions {
  query?: string;
  location?: string;
  serviceTypes?: string[];
  minRating?: number;
  priceRange?: [number, number];
  verifiedOnly?: boolean;
  instantBooking?: boolean;
  sortBy?: string;
  enabled?: boolean;
}

export function useSearchCleaners(options: UseSearchCleanersOptions = {}) {
  const {
    query = "",
    location = "",
    serviceTypes = [],
    minRating = 0,
    priceRange = [0, 500],
    verifiedOnly = false,
    instantBooking = false,
    sortBy = "recommended",
    enabled = true,
  } = options;

  return useQuery({
    queryKey: ["search-cleaners", query, location, serviceTypes, minRating, priceRange, verifiedOnly, instantBooking, sortBy],
    queryFn: async (): Promise<CleanerSearchResult[]> => {
      // Get cleaner profiles
      let profileQuery = supabase
        .from("cleaner_profiles")
        .select("*")
        .eq("is_active", true);

      // Filter by price range
      if (priceRange[0] > 0) {
        profileQuery = profileQuery.gte("hourly_rate", priceRange[0]);
      }
      if (priceRange[1] < 500) {
        profileQuery = profileQuery.lte("hourly_rate", priceRange[1]);
      }

      // Filter by verified
      if (verifiedOnly) {
        profileQuery = profileQuery.eq("is_verified", true);
      }

      // Filter by instant booking
      if (instantBooking) {
        profileQuery = profileQuery.eq("instant_booking", true);
      }

      const { data: profiles, error } = await profileQuery;
      if (error) throw error;
      if (!profiles) return [];

      // Get reviews for ratings
      const profileIds = profiles.map((p) => p.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("cleaner_profile_id, rating")
        .in("cleaner_profile_id", profileIds);

      // Calculate average ratings
      const ratingMap: Record<string, { total: number; count: number }> = {};
      reviews?.forEach((r) => {
        if (!ratingMap[r.cleaner_profile_id]) {
          ratingMap[r.cleaner_profile_id] = { total: 0, count: 0 };
        }
        ratingMap[r.cleaner_profile_id].total += r.rating;
        ratingMap[r.cleaner_profile_id].count += 1;
      });

      let results: CleanerSearchResult[] = profiles.map((p) => {
        const rating = ratingMap[p.id];
        return {
          id: p.id,
          business_name: p.business_name,
          profile_image: p.profile_image,
          hourly_rate: p.hourly_rate,
          services: p.services,
          service_areas: p.service_areas,
          is_verified: p.is_verified,
          instant_booking: p.instant_booking,
          bio: p.bio,
          response_time: p.response_time,
          years_experience: p.years_experience,
          user_id: p.user_id,
          avg_rating: rating ? Math.round((rating.total / rating.count) * 10) / 10 : 0,
          review_count: rating?.count || 0,
        };
      });

      // Filter by name query
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(
          (r) =>
            r.business_name.toLowerCase().includes(q) ||
            r.services.some((s) => s.toLowerCase().includes(q)) ||
            r.service_areas.some((a) => a.toLowerCase().includes(q))
        );
      }

      // Filter by location
      if (location) {
        const loc = location.toLowerCase();
        results = results.filter((r) =>
          r.service_areas.some((a) => a.toLowerCase().includes(loc))
        );
      }

      // Filter by service types
      if (serviceTypes.length > 0) {
        results = results.filter((r) =>
          serviceTypes.some((type) =>
            r.services.some((s) => s.toLowerCase().includes(type.toLowerCase()))
          )
        );
      }

      // Filter by min rating
      if (minRating > 0) {
        results = results.filter((r) => r.avg_rating >= minRating);
      }

      // Sort
      switch (sortBy) {
        case "rating":
          results.sort((a, b) => b.avg_rating - a.avg_rating);
          break;
        case "price-low":
          results.sort((a, b) => a.hourly_rate - b.hourly_rate);
          break;
        case "price-high":
          results.sort((a, b) => b.hourly_rate - a.hourly_rate);
          break;
        case "reviews":
          results.sort((a, b) => b.review_count - a.review_count);
          break;
        default:
          results.sort((a, b) => {
            if (a.is_verified !== b.is_verified) return b.is_verified ? 1 : -1;
            return b.avg_rating - a.avg_rating;
          });
      }

      return results;
    },
    enabled,
  });
}

// Lightweight hook for live search dropdown with ratings
export function useLiveSearch(query: string, enabled = true) {
  return useQuery({
    queryKey: ["live-search", query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];

      // Fetch profiles
      const { data: allData } = await supabase
        .from("cleaner_profiles")
        .select("id, business_name, profile_image, services, service_areas, hourly_rate, is_verified, instant_booking, bio")
        .eq("is_active", true)
        .limit(50);

      if (!allData) return [];

      const q = query.toLowerCase();
      const filtered = allData
        .filter(
          (p) =>
            p.business_name.toLowerCase().includes(q) ||
            p.services.some((s: string) => s.toLowerCase().includes(q)) ||
            p.service_areas.some((a: string) => a.toLowerCase().includes(q))
        )
        .slice(0, 6);

      if (filtered.length === 0) return [];

      // Fetch ratings for matched profiles
      const ids = filtered.map((p) => p.id);
      const { data: reviews } = await supabase
        .from("reviews")
        .select("cleaner_profile_id, rating")
        .in("cleaner_profile_id", ids);

      const ratingMap: Record<string, { total: number; count: number }> = {};
      reviews?.forEach((r) => {
        if (!ratingMap[r.cleaner_profile_id]) {
          ratingMap[r.cleaner_profile_id] = { total: 0, count: 0 };
        }
        ratingMap[r.cleaner_profile_id].total += r.rating;
        ratingMap[r.cleaner_profile_id].count += 1;
      });

      return filtered.map((p) => {
        const rating = ratingMap[p.id];
        return {
          ...p,
          avg_rating: rating ? Math.round((rating.total / rating.count) * 10) / 10 : 0,
          review_count: rating?.count || 0,
        };
      });
    },
    enabled: enabled && query.length >= 2,
    staleTime: 30000,
  });
}
