import { useState } from "react";
import { MapPin, Star, DollarSign, Sparkles, Filter, X, ChevronDown } from "lucide-react";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export interface FilterState {
  location: string;
  serviceTypes: string[];
  minRating: number;
  priceRange: [number, number];
  verifiedOnly: boolean;
  instantBooking: boolean;
  sortBy: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  resultCount: number;
}

const serviceTypeOptions = [
  { value: "home", label: "Home Cleaning" },
  { value: "deep", label: "Deep Cleaning" },
  { value: "office", label: "Office Cleaning" },
  { value: "commercial", label: "Commercial" },
  { value: "airbnb", label: "Airbnb/Rental" },
  { value: "move", label: "Move In/Out" },
  { value: "post-construction", label: "Post-Construction" },
  { value: "eco", label: "Eco-Friendly" },
];

const sortOptions = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest Rated" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "reviews", label: "Most Reviews" },
];

const SearchFilters = ({ filters, onFiltersChange, resultCount }: SearchFiltersProps) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleServiceType = (serviceType: string) => {
    const current = filters.serviceTypes;
    const updated = current.includes(serviceType)
      ? current.filter((s) => s !== serviceType)
      : [...current, serviceType];
    updateFilter("serviceTypes", updated);
  };

  const clearAllFilters = () => {
    onFiltersChange({
      location: "",
      serviceTypes: [],
      minRating: 0,
      priceRange: [0, 500],
      verifiedOnly: false,
      instantBooking: false,
      sortBy: "recommended",
    });
  };

  const activeFilterCount = [
    filters.location,
    filters.serviceTypes.length > 0,
    filters.minRating > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < 500,
    filters.verifiedOnly,
    filters.instantBooking,
  ].filter(Boolean).length;

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Location */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-semibold text-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          Location
        </label>
        <LocationAutocomplete
          value={filters.location}
          onChange={(val) => updateFilter("location", val)}
          onSelect={(val) => updateFilter("location", val)}
          placeholder="Enter city or postal code"
          className="h-10 rounded-lg bg-background"
        />
      </div>

      {/* Service Types */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Service Type
        </label>
        <div className="flex flex-wrap gap-2">
          {serviceTypeOptions.map((service) => (
            <Badge
              key={service.value}
              variant={filters.serviceTypes.includes(service.value) ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-all hover:scale-105",
                filters.serviceTypes.includes(service.value)
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-primary/10"
              )}
              onClick={() => toggleServiceType(service.value)}
            >
              {service.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-semibold text-foreground">
          <Star className="h-4 w-4 text-accent" />
          Minimum Rating
        </label>
        <div className="flex items-center gap-4">
          <Slider
            value={[filters.minRating]}
            onValueChange={(value) => updateFilter("minRating", value[0])}
            max={5}
            step={0.5}
            className="flex-1"
          />
          <span className="text-sm font-medium text-muted-foreground w-12">
            {filters.minRating > 0 ? `${filters.minRating}+` : "Any"}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 3, 4, 4.5].map((rating) => (
            <Button
              key={rating}
              variant={filters.minRating === rating ? "default" : "outline"}
              size="sm"
              onClick={() => updateFilter("minRating", rating)}
              className="text-xs"
            >
              {rating === 0 ? "Any" : `${rating}+`}
            </Button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 font-semibold text-foreground">
          <DollarSign className="h-4 w-4 text-secondary" />
          Price Range
        </label>
        <div className="space-y-4">
          <Slider
            value={filters.priceRange}
            onValueChange={(value) => updateFilter("priceRange", value as [number, number])}
            max={500}
            step={10}
            className="flex-1"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${filters.priceRange[0]}</span>
            <span>${filters.priceRange[1]}+</span>
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="space-y-3">
        <label className="font-semibold text-foreground">Quick Filters</label>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={filters.verifiedOnly}
              onCheckedChange={(checked) => updateFilter("verifiedOnly", checked as boolean)}
            />
            <span className="text-sm">Verified cleaners only</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <Checkbox
              checked={filters.instantBooking}
              onCheckedChange={(checked) => updateFilter("instantBooking", checked as boolean)}
            />
            <span className="text-sm">Instant booking available</span>
          </label>
        </div>
      </div>

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button variant="ghost" onClick={clearAllFilters} className="w-full text-muted-foreground">
          <X className="h-4 w-4 mr-2" />
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Filters Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0">
        <div className="sticky top-24 bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-heading font-semibold text-lg">Filters</h2>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </div>
          <FilterContent />
        </div>
      </aside>

      {/* Mobile Filters */}
      <div className="lg:hidden flex items-center gap-3 mb-4">
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Sort Dropdown */}
        <Select value={filters.sortBy} onValueChange={(value) => updateFilter("sortBy", value)}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-sm text-muted-foreground ml-auto">
          {resultCount} results
        </span>
      </div>
    </>
  );
};

export default SearchFilters;
