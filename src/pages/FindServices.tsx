import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search, Sparkles, MapPin, Clock, DollarSign, Star, Filter,
  Loader2, ShoppingBag, Eye, ArrowRight,
} from "lucide-react";
import logoDefault from "@/assets/logo.jpeg";

const SERVICE_CATEGORIES = [
  "All", "Home Cleaning", "Office Cleaning", "Deep Cleaning", "Move-in/Move-out",
  "Carpet Cleaning", "Window Cleaning", "Post-Construction", "Eco-Friendly Cleaning", "Other",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low to High" },
  { value: "price_high", label: "Price: High to Low" },
  { value: "popular", label: "Most Popular" },
];

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  price_type: string;
  price: number;
  duration_hours: number | null;
  image_url: string | null;
  features: string[];
  location: string | null;
  delivery_time: string | null;
  views_count: number;
  orders_count: number;
  created_at: string;
  cleaner_profile_id: string;
  cleaner_name?: string;
  cleaner_image?: string | null;
  cleaner_rating?: number;
  cleaner_reviews?: number;
  cleaner_is_verified?: boolean;
}

const ITEMS_PER_PAGE = 12;

const FindServices = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState("all");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["service-listings", category, sortBy],
    queryFn: async () => {
      let query = supabase
        .from("service_listings")
        .select("*")
        .eq("is_active", true);

      if (category !== "All") {
        query = query.eq("category", category);
      }

      switch (sortBy) {
        case "price_low":
          query = query.order("price", { ascending: true });
          break;
        case "price_high":
          query = query.order("price", { ascending: false });
          break;
        case "popular":
          query = query.order("orders_count", { ascending: false });
          break;
        default:
          query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch cleaner profiles
      const profileIds = [...new Set((data || []).map((l) => l.cleaner_profile_id))];
      if (profileIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("cleaner_profiles")
        .select("id, business_name, profile_image, is_verified, user_id")
        .in("id", profileIds);

      // Fetch ratings
      const { data: reviews } = await supabase
        .from("reviews")
        .select("cleaner_profile_id, rating")
        .in("cleaner_profile_id", profileIds);

      const ratingMap = new Map<string, { sum: number; count: number }>();
      (reviews || []).forEach((r) => {
        const existing = ratingMap.get(r.cleaner_profile_id) || { sum: 0, count: 0 };
        ratingMap.set(r.cleaner_profile_id, { sum: existing.sum + r.rating, count: existing.count + 1 });
      });

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return (data || []).map((listing) => {
        const profile = profileMap.get(listing.cleaner_profile_id);
        const rating = ratingMap.get(listing.cleaner_profile_id);
        return {
          ...listing,
          cleaner_name: profile?.business_name || "Cleaning Pro",
          cleaner_image: profile?.profile_image,
          cleaner_is_verified: profile?.is_verified || false,
          cleaner_rating: rating ? rating.sum / rating.count : 0,
          cleaner_reviews: rating?.count || 0,
        } as ServiceListing;
      });
    },
  });

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      const matchesSearch = !searchQuery || 
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.location?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPrice = priceRange === "all" ||
        (priceRange === "under50" && listing.price < 50) ||
        (priceRange === "50to100" && listing.price >= 50 && listing.price <= 100) ||
        (priceRange === "100to200" && listing.price > 100 && listing.price <= 200) ||
        (priceRange === "over200" && listing.price > 200);

      return matchesSearch && matchesPrice;
    });
  }, [listings, searchQuery, priceRange]);

  const visibleListings = useMemo(() => {
    return filteredListings.slice(0, visibleCount);
  }, [filteredListings, visibleCount]);

  const hasMore = visibleCount < filteredListings.length;

  // Reset visible count when filters change
  const handleCategoryChange = (val: string) => { setCategory(val); setVisibleCount(ITEMS_PER_PAGE); };
  const handleSearchChange = (val: string) => { setSearchQuery(val); setVisibleCount(ITEMS_PER_PAGE); };
  const handlePriceChange = (val: string) => { setPriceRange(val); setVisibleCount(ITEMS_PER_PAGE); };
  const handleSortChange = (val: string) => { setSortBy(val); setVisibleCount(ITEMS_PER_PAGE); };

  const getPriceLabel = (type: string, price: number) => {
    switch (type) {
      case "hourly": return `$${price}/hr`;
      case "starting_at": return `From $${price}`;
      default: return `$${price}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-b border-border/40">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Professional Cleaning Services
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Find the Perfect <span className="text-primary">Cleaning Service</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Browse service packages from trusted cleaning professionals. Book exactly what you need.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search services, locations..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8">
        {/* Category chips */}
        <div className="flex flex-wrap gap-2 mb-6">
          {SERVICE_CATEGORIES.map((cat) => (
            <Button
              key={cat}
              variant={category === cat ? "default" : "outline"}
              size="sm"
              onClick={() => handleCategoryChange(cat)}
              className="rounded-full"
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {SERVICE_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priceRange} onValueChange={handlePriceChange}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under50">Under $50</SelectItem>
              <SelectItem value="50to100">$50 – $100</SelectItem>
              <SelectItem value="100to200">$100 – $200</SelectItem>
              <SelectItem value="over200">$200+</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredListings.length} service{filteredListings.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No services found</h3>
              <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visibleListings.map((listing) => (
              <Card
                key={listing.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-border/60 hover:border-primary/30"
                onClick={() => navigate(`/services/${listing.id}`)}
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={listing.image_url || logoDefault}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-background/90 text-foreground text-xs font-bold shadow-sm">
                      {getPriceLabel(listing.price_type, listing.price)}
                    </Badge>
                  </div>
                  {listing.cleaner_is_verified && (
                    <div className="absolute top-2 left-2">
                      <Badge className="bg-primary text-primary-foreground text-[10px]">Verified</Badge>
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  {/* Cleaner info */}
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={listing.cleaner_image || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {listing.cleaner_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground font-medium truncate">{listing.cleaner_name}</span>
                    {listing.cleaner_rating > 0 && (
                      <span className="flex items-center gap-0.5 text-xs ml-auto shrink-0">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-medium">{listing.cleaner_rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({listing.cleaner_reviews})</span>
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
                    {listing.title}
                  </h3>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    {listing.location && (
                      <span className="inline-flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" />
                        {listing.location}
                      </span>
                    )}
                    {listing.duration_hours && (
                      <span className="inline-flex items-center gap-0.5">
                        <Clock className="h-3 w-3" />
                        {listing.duration_hours}h
                      </span>
                    )}
                  </div>

                  {/* Features preview */}
                  {listing.features && listing.features.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {listing.features.slice(0, 2).map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] py-0">{f}</Badge>
                      ))}
                      {listing.features.length > 2 && (
                        <Badge variant="outline" className="text-[10px] py-0">+{listing.features.length - 2}</Badge>
                      )}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Eye className="h-3 w-3" /> {listing.views_count}
                      <ShoppingBag className="h-3 w-3 ml-1" /> {listing.orders_count}
                    </span>
                    <span className="text-primary font-bold text-sm">
                      {getPriceLabel(listing.price_type, listing.price)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && (
          <div className="flex flex-col items-center gap-2 mt-8">
            <p className="text-sm text-muted-foreground">
              Showing {visibleCount} of {filteredListings.length} services
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
      </main>
      <Footer />
    </div>
  );
};

export default FindServices;
