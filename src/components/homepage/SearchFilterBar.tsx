import { useState } from "react";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import bgSearchBar from "@/assets/bg-search-bar.png";
import { useLiveSearch } from "@/hooks/useSearchCleaners";
import LiveSearchDropdown from "@/components/LiveSearchDropdown";

const serviceChips = ["Home Cleaning", "Deep Clean", "Office", "Eco-Friendly", "Airbnb"];

const SearchFilterBar = () => {
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { data: liveResults = [], isLoading } = useLiveSearch(query, showDropdown);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="relative py-3 overflow-hidden">
      <img src={bgSearchBar} alt="" className="absolute inset-0 w-full h-full object-cover dark:opacity-20" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap overflow-x-auto no-scrollbar">
          <form onSubmit={handleSubmit} className="relative flex items-center bg-muted rounded-md px-3 py-2 gap-2 flex-1 min-w-0 max-w-full sm:max-w-xs">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search cleaners, services, or areas..."
              className="bg-transparent outline-none text-sm flex-1 text-foreground placeholder:text-muted-foreground"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => {
                if (query.length >= 2) setShowDropdown(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowDropdown(false), 200);
              }}
            />
            {showDropdown && (
              <LiveSearchDropdown
                results={liveResults}
                isLoading={isLoading}
                query={query}
                onSelect={() => setShowDropdown(false)}
              />
            )}
          </form>
          {serviceChips.map((chip) => (
            <button
              key={chip}
              onClick={() => navigate(`/search?service=${encodeURIComponent(chip)}`)}
              className="px-3 py-1.5 rounded-md text-xs font-medium border transition-colors bg-card text-foreground border-border hover:bg-muted"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchFilterBar;
