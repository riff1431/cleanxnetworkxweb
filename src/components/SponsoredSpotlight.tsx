import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Shield, CheckCircle, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveSponsoredListings, trackSponsoredView, trackSponsoredClick, SponsoredListing } from "@/hooks/useSponsoredListings";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface SponsoredCardProps {
  listing: SponsoredListing;
}

const SponsoredCard = ({ listing }: SponsoredCardProps) => {
  const cp = listing.cleaner_profiles;
  if (!cp) return null;

  const location = cp.service_areas?.[0] ?? "Canada";
  const price = cp.hourly_rate;

  const handleQuoteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackSponsoredClick(listing.id, "quote");
  };

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault();
    trackSponsoredClick(listing.id, "book");
  };

  return (
    <Link
      to={`/cleaner/${cp.id}`}
      className="group bg-card rounded-2xl border-2 border-accent/30 overflow-hidden hover:shadow-[0_8px_30px_-4px_hsl(45_93%_47%/0.25)] transition-all duration-300 block h-full"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cp.profile_image ? (
          <img
            src={cp.profile_image}
            alt={cp.business_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <Shield className="h-12 w-12 text-primary/30" />
          </div>
        )}

        {/* Sponsored badge */}
        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground font-semibold gap-1">
          <Zap className="h-3 w-3" />
          Sponsored
        </Badge>

        {cp.instant_booking && (
          <Badge className="absolute bottom-3 left-3 bg-secondary/90 text-secondary-foreground">
            <CheckCircle className="h-3 w-3 mr-1" />
            Instant Booking
          </Badge>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                {cp.business_name}
              </h3>
              {cp.is_verified && (
                <div className="w-5 h-5 rounded-full bg-secondary/20 flex items-center justify-center shrink-0" title="Verified">
                  <Shield className="h-3 w-3 text-secondary" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="flex flex-wrap gap-1 mb-3">
          {cp.services.slice(0, 3).map((service) => (
            <span
              key={service}
              className="px-2 py-0.5 bg-muted rounded-md text-xs text-muted-foreground"
            >
              {service}
            </span>
          ))}
        </div>

        {/* Response Time */}
        {cp.response_time && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <Clock className="h-3 w-3" />
            {cp.response_time}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div>
            <span className="text-xs text-muted-foreground">From</span>
            <span className="font-semibold text-primary ml-1">${price}/hr</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleQuoteClick}>
              Quote
            </Button>
            <Button variant="secondary" size="sm" onClick={handleBookClick}>
              Book
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

interface SponsoredSpotlightProps {
  variant?: "homepage" | "search";
  limit?: number;
}

const SponsoredSpotlight = ({ variant = "homepage", limit = 6 }: SponsoredSpotlightProps) => {
  const { data: listings = [], isLoading } = useActiveSponsoredListings();
  const trackedIds = useRef<Set<string>>(new Set());

  const displayListings = listings.slice(0, limit);

  useEffect(() => {
    displayListings.forEach((listing) => {
      if (!trackedIds.current.has(listing.id)) {
        trackedIds.current.add(listing.id);
        trackSponsoredView(listing.id);
      }
    });
  }, [displayListings]);

  if (isLoading || displayListings.length === 0) return null;

  if (variant === "search") {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 border border-accent/30">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-semibold text-accent-foreground">Sponsored</span>
          </div>
          <span className="text-sm text-muted-foreground">Premium placements</span>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 pb-4 mb-4 border-b border-border">
          {displayListings.map((listing) => (
            <SponsoredCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    );
  }

  // Homepage carousel
  return (
    <section className="py-12 lg:py-16 bg-gradient-to-br from-accent/5 via-background to-primary/5 border-y border-border/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/15 border border-accent/30 mb-3">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-accent-foreground">Sponsored Spotlight</span>
            </div>
            <h2 className="font-heading text-2xl lg:text-3xl font-bold text-foreground">
              Featured Cleaning Professionals
            </h2>
            <p className="text-muted-foreground mt-1">
              Handpicked, top-rated cleaners promoted for exceptional quality
            </p>
          </div>
        </div>

        {/* Carousel */}
        <Carousel
          opts={{ align: "start", loop: displayListings.length > 3 }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {displayListings.map((listing) => (
              <CarouselItem
                key={listing.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4"
              >
                <SponsoredCard listing={listing} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {displayListings.length > 1 && (
            <>
              <CarouselPrevious className="-left-4 hidden sm:flex" />
              <CarouselNext className="-right-4 hidden sm:flex" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default SponsoredSpotlight;
