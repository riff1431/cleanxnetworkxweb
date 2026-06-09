import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { LayoutGrid, List, Search as SearchIcon, Map, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import Footer from "@/components/Footer";
import SearchFilters, { FilterState } from "@/components/SearchFilters";
import CleanerCard, { Cleaner } from "@/components/CleanerCard";
import SponsoredSpotlight from "@/components/SponsoredSpotlight";
import CleanerOfTheWeek from "@/components/CleanerOfTheWeek";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchResultsMap from "@/components/maps/SearchResultsMap";
import { useSearchCleaners, type CleanerSearchResult } from "@/hooks/useSearchCleaners";
import LiveSearchDropdown from "@/components/LiveSearchDropdown";
import { useLiveSearch } from "@/hooks/useSearchCleaners";

// Map DB result to CleanerCard format
function toCleanerCardFormat(r: CleanerSearchResult): Cleaner {
  return {
    id: r.id as any,
    name: r.business_name,
    image: r.profile_image || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    rating: r.avg_rating,
    reviews: r.review_count,
    location: r.service_areas.join(", ") || "Various locations",
    services: r.services,
    priceFrom: r.hourly_rate,
    verified: r.is_verified,
    featured: r.is_verified && r.avg_rating >= 4.5,
    instantBooking: r.instant_booking,
    responseTime: r.response_time || "Responds in ~1 hour",
    description: r.bio || "Professional cleaning services available.",
    userId: r.user_id,
  };
}

const ITEMS_PER_PAGE = 12;

const Search = () => {
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [activeMapCleaner, setActiveMapCleaner] = useState<number | string | null>(null);
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("q") || ""
  );
  const [locationQuery, setLocationQuery] = useState(
    searchParams.get("location") || ""
  );
  const [showLiveSearch, setShowLiveSearch] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const initialService = searchParams.get("service");
  const [filters, setFilters] = useState<FilterState>({
    location: "",
    serviceTypes: initialService ? [initialService] : [],
    minRating: 0,
    priceRange: [0, 500],
    verifiedOnly: false,
    instantBooking: false,
    sortBy: "recommended",
  });

  // Full search query
  const { data: searchResults = [], isLoading } = useSearchCleaners({
    query: searchQuery,
    location: locationQuery || filters.location,
    serviceTypes: filters.serviceTypes,
    minRating: filters.minRating,
    priceRange: filters.priceRange,
    verifiedOnly: filters.verifiedOnly,
    instantBooking: filters.instantBooking,
    sortBy: filters.sortBy,
  });

  // Live search for dropdown
  const { data: liveResults = [], isLoading: liveLoading } = useLiveSearch(searchQuery, showLiveSearch);

  const filteredCleaners = useMemo(
    () => searchResults.map(toCleanerCardFormat),
    [searchResults]
  );

  const visibleCleaners = useMemo(
    () => filteredCleaners.slice(0, visibleCount),
    [filteredCleaners, visibleCount]
  );

  const hasMore = visibleCount < filteredCleaners.length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLiveSearch(false);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  // Reset visible count when filters change
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setVisibleCount(ITEMS_PER_PAGE);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Search Header */}
      <div className="bg-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-3xl w-full">
            <div className="relative flex-1 min-w-0">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
              <Input
                placeholder="Search by cleaner name or service..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowLiveSearch(true);
                }}
                onFocus={() => {
                  if (searchQuery.length >= 2) setShowLiveSearch(true);
                }}
                onBlur={() => {
                  setTimeout(() => setShowLiveSearch(false), 200);
                }}
                className="pl-10 h-12 text-base bg-background"
              />
              {showLiveSearch && (
                <LiveSearchDropdown
                  results={liveResults}
                  isLoading={liveLoading}
                  query={searchQuery}
                  onSelect={() => setShowLiveSearch(false)}
                  className="top-full mt-1"
                />
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 sm:w-56 sm:flex-none">
                <LocationAutocomplete
                  value={locationQuery}
                  onChange={setLocationQuery}
                  onSelect={setLocationQuery}
                  placeholder="City or postal code"
                  className="h-12 rounded-lg bg-background"
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0">
                Search
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <SearchFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            resultCount={filteredCleaners.length}
          />

          {/* Results */}
          <div className="flex-1 min-w-0">
            <CleanerOfTheWeek />
            <SponsoredSpotlight variant="search" limit={3} />

            {/* Desktop Sort & Results Header */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-muted-foreground">
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching...
                    </span>
                  ) : (
                    <>
                      <span className="font-semibold text-foreground">{filteredCleaners.length}</span> cleaners found
                    </>
                  )}
                </span>
                <ToggleGroup
                  type="single"
                  value={viewMode}
                  onValueChange={(value) => value && setViewMode(value as "grid" | "list" | "map")}
                >
                  <ToggleGroupItem value="grid" aria-label="Grid view">
                    <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="map" aria-label="Map view">
                    <Map className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <Select
                value={filters.sortBy}
                onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recommended">Recommended</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="reviews">Most Reviews</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Grid/List/Map */}
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Finding cleaners...</span>
              </div>
            ) : filteredCleaners.length > 0 ? (
              <>
                {viewMode === "map" ? (
                  <div className="space-y-4">
                    <SearchResultsMap
                      cleaners={filteredCleaners}
                      activeCleanerId={activeMapCleaner}
                      onCleanerSelect={setActiveMapCleaner}
                      className="h-[500px] rounded-xl overflow-hidden border border-border"
                    />
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {visibleCleaners.map((cleaner) => (
                        <div
                          key={cleaner.id}
                          className={`cursor-pointer transition-all ${activeMapCleaner === cleaner.id ? "ring-2 ring-primary rounded-xl" : ""}`}
                          onMouseEnter={() => setActiveMapCleaner(cleaner.id)}
                          onMouseLeave={() => setActiveMapCleaner(null)}
                        >
                          <CleanerCard cleaner={cleaner} variant="grid" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div
                    className={
                      viewMode === "grid"
                        ? "grid md:grid-cols-2 xl:grid-cols-3 gap-6"
                        : "space-y-4"
                    }
                  >
                    {visibleCleaners.map((cleaner, index) => (
                      <div
                        key={cleaner.id}
                        className="animate-fade-in"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <CleanerCard cleaner={cleaner} variant={viewMode} />
                      </div>
                    ))}
                  </div>
                )}

                {/* Load More */}
                {hasMore && (
                  <div className="flex flex-col items-center gap-2 mt-8">
                    <p className="text-sm text-muted-foreground">
                      Showing {visibleCount} of {filteredCleaners.length} cleaners
                    </p>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => setVisibleCount((prev) => prev + ITEMS_PER_PAGE)}
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-heading text-xl font-semibold mb-2">No cleaners found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your filters or search for a different term.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      location: "",
                      serviceTypes: [],
                      minRating: 0,
                      priceRange: [0, 500],
                      verifiedOnly: false,
                      instantBooking: false,
                      sortBy: "recommended",
                    });
                  }}
                >
                  Clear all filters
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Search;
