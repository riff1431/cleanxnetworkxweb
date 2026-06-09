import { Star } from "lucide-react";
import { useActiveSponsoredListings } from "@/hooks/useSponsoredListings";
import SponsoredSpotlightCard from "./SponsoredSpotlightCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const SponsoredSpotlightSection = () => {
  const { data: listings, isLoading } = useActiveSponsoredListings();
  const revealRef = useScrollReveal<HTMLDivElement>({ y: 40 });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-44 w-full rounded-2xl" />
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return null;
  }

  return (
    <div ref={revealRef} className="space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-accent/20">
          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
        </div>
        <h3 className="font-heading font-bold text-foreground text-xl">Sponsored Spotlight</h3>
      </div>
      <div className="space-y-4">
        {listings.map((listing) => (
          <SponsoredSpotlightCard
            key={listing.id}
            cleaner={{
              id: listing.cleaner_profiles?.id || listing.cleaner_profile_id,
              name: listing.cleaner_profiles?.business_name || "Cleaning Pro",
              image: listing.cleaner_profiles?.profile_image || "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=300&h=400&fit=crop",
              rating: 5.0,
              reviews: 0,
              location: listing.cleaner_profiles?.service_areas?.[0] || "Local Area",
              startingPrice: listing.cleaner_profiles?.hourly_rate || 0,
              services: listing.cleaner_profiles?.services || [],
              isVerified: listing.cleaner_profiles?.is_verified || false,
              userId: listing.user_id,
            }}
            listingId={listing.id}
          />
        ))}
      </div>
    </div>
  );
};

export default SponsoredSpotlightSection;
