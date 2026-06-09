import { useNavigate } from "react-router-dom";
import { MapPin, Shield, Star, Loader2, Zap, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LiveSearchResult {
  id: string;
  business_name: string;
  profile_image: string | null;
  services: string[];
  service_areas: string[];
  hourly_rate: number;
  is_verified: boolean;
  instant_booking?: boolean;
  avg_rating?: number;
  review_count?: number;
}

interface LiveSearchDropdownProps {
  results: LiveSearchResult[];
  isLoading: boolean;
  query: string;
  onSelect?: () => void;
  className?: string;
}

const LiveSearchDropdown = ({ results, isLoading, query, onSelect, className = "" }: LiveSearchDropdownProps) => {
  const navigate = useNavigate();

  if (query.length < 2) return null;

  return (
    <div className={`absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-sm ${className}`}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-6 px-4 text-center">
          <p className="text-sm text-muted-foreground">No cleaners found for "<span className="font-medium text-foreground">{query}</span>"</p>
          <button
            className="mt-2 text-xs text-primary hover:underline"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect?.();
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            Browse all cleaners →
          </button>
        </div>
      ) : (
        <>
          <div className="px-3 py-2 border-b border-border/50">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {results.length} cleaner{results.length !== 1 ? "s" : ""} found
            </span>
          </div>
          {results.map((result) => (
            <button
              key={result.id}
              className="w-full flex items-center gap-3 px-3 py-3 hover:bg-primary/5 transition-colors text-left border-b border-border/30 last:border-b-0 group"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect?.();
                navigate(`/cleaner/${result.id}`);
              }}
            >
              {/* Avatar */}
              <div className="w-11 h-11 rounded-full bg-muted overflow-hidden shrink-0 ring-2 ring-border group-hover:ring-primary/30 transition-all">
                {result.profile_image ? (
                  <img src={result.profile_image} alt={result.business_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary text-sm font-bold">
                    {result.business_name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {result.business_name}
                  </span>
                  {result.is_verified && (
                    <Shield className="h-3.5 w-3.5 text-secondary shrink-0" />
                  )}
                  {result.instant_booking && (
                    <Zap className="h-3.5 w-3.5 text-accent shrink-0" />
                  )}
                </div>

                {/* Rating + Location */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  {(result.avg_rating ?? 0) > 0 && (
                    <>
                      <span className="flex items-center gap-0.5 text-foreground font-medium">
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                        {result.avg_rating}
                        <span className="text-muted-foreground font-normal">({result.review_count})</span>
                      </span>
                      <span>·</span>
                    </>
                  )}
                  <span className="flex items-center gap-0.5 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {result.service_areas.slice(0, 2).join(", ") || "Various"}
                  </span>
                </div>

                {/* Service tags */}
                <div className="flex flex-wrap gap-1">
                  {result.services.slice(0, 3).map((service) => (
                    <Badge
                      key={service}
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 h-4 font-normal border-border/50"
                    >
                      {service}
                    </Badge>
                  ))}
                  {result.services.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">+{result.services.length - 3}</span>
                  )}
                </div>
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-primary">${result.hourly_rate}</div>
                <div className="text-[10px] text-muted-foreground">/hr</div>
              </div>
            </button>
          ))}
          <button
            className="w-full flex items-center justify-center gap-1.5 py-3 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors"
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect?.();
              navigate(`/search?q=${encodeURIComponent(query)}`);
            }}
          >
            See all results for "{query}"
            <ArrowRight className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  );
};

export default LiveSearchDropdown;
