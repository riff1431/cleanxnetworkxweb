import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

// Major Canadian cities by province
const CANADIAN_CITIES = [
  // Ontario
  "Toronto, ON", "Ottawa, ON", "Mississauga, ON", "Brampton, ON", "Hamilton, ON",
  "London, ON", "Markham, ON", "Vaughan, ON", "Kitchener, ON", "Windsor, ON",
  "Richmond Hill, ON", "Oakville, ON", "Burlington, ON", "Oshawa, ON", "Barrie, ON",
  "St. Catharines, ON", "Cambridge, ON", "Kingston, ON", "Guelph, ON", "Thunder Bay, ON",
  // Quebec
  "Montreal, QC", "Quebec City, QC", "Laval, QC", "Gatineau, QC", "Longueuil, QC",
  "Sherbrooke, QC", "Levis, QC", "Saguenay, QC", "Trois-Rivieres, QC",
  // British Columbia
  "Vancouver, BC", "Surrey, BC", "Burnaby, BC", "Richmond, BC", "Coquitlam, BC",
  "Kelowna, BC", "Victoria, BC", "Nanaimo, BC", "Kamloops, BC", "Abbotsford, BC",
  // Alberta
  "Calgary, AB", "Edmonton, AB", "Red Deer, AB", "Lethbridge, AB", "St. Albert, AB",
  "Medicine Hat, AB", "Grande Prairie, AB", "Airdrie, AB",
  // Manitoba
  "Winnipeg, MB", "Brandon, MB", "Steinbach, MB",
  // Saskatchewan
  "Saskatoon, SK", "Regina, SK", "Prince Albert, SK", "Moose Jaw, SK",
  // Nova Scotia
  "Halifax, NS", "Dartmouth, NS", "Sydney, NS",
  // New Brunswick
  "Moncton, NB", "Saint John, NB", "Fredericton, NB",
  // Newfoundland and Labrador
  "St. John's, NL", "Mount Pearl, NL", "Corner Brook, NL",
  // Prince Edward Island
  "Charlottetown, PE", "Summerside, PE",
  // Territories
  "Whitehorse, YT", "Yellowknife, NT", "Iqaluit, NU",
];

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete = ({
  value,
  onChange,
  onSelect,
  placeholder = "Enter your postal code or city",
  className,
}: LocationAutocompleteProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const filtered = CANADIAN_CITIES.filter((city) =>
        city.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8);
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
    setHighlightedIndex(-1);
  }, [value]);

  const handleSelect = (city: string) => {
    onChange(city);
    onSelect?.(city);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
          handleSelect(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  return (
    <div className="relative flex-1">
      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => value.length >= 2 && suggestions.length > 0 && setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full h-12 pl-12 pr-4 bg-muted rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20",
          className
        )}
        autoComplete="off"
      />
      
      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50 max-h-64 overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <li
              key={city}
              onClick={() => handleSelect(city)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                highlightedIndex === index
                  ? "bg-primary/10 text-foreground"
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <MapPin className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-medium">{city}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LocationAutocomplete;
