import { useState, lazy, Suspense, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import bgHero from "@/assets/bg-hero.png";
import heroCleaners from "@/assets/hero-cleaners.png";
import { useLiveSearch } from "@/hooks/useSearchCleaners";
import LiveSearchDropdown from "@/components/LiveSearchDropdown";
import BlurImage from "@/components/ui/blur-image";

const ThreeBackground = lazy(() => import("./ThreeBackground"));

const categories = ["Home Cleaning", "Deep Clean", "Office", "Airbnb", "Move In/Out", "Post-Construction", "Eco-Friendly", "Commercial"];

const HomepageHero = () => {
  const [location, setLocation] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { data: liveResults = [], isLoading } = useLiveSearch(location, showDropdown);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    navigate(`/search?q=${encodeURIComponent(location)}`);
  };

  return (
    <section className="relative overflow-hidden gradient-hero">
      <BlurImage
        src={bgHero}
        alt=""
        loading="eager"
        className="absolute inset-0 w-full h-full dark:opacity-20"
        placeholderColor="hsl(210 60% 95%)"
      />

      <Suspense fallback={null}>
        <ThreeBackground />
      </Suspense>

      <div className="container mx-auto px-4 py-8 sm:py-10 lg:py-14 relative z-10">
        <div className="grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="font-heading text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] font-bold text-foreground leading-tight mb-2 sm:mb-3"
            >
              Search & Book Trusted Cleaners
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="text-muted-foreground text-sm sm:text-base mb-4 sm:mb-5"
            >
              Find reliable cleaning companies near you.
            </motion.p>

            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className={`relative flex items-center glass-strong rounded-xl shadow-md mb-4 w-full max-w-lg transition-all duration-300 z-20 ${
                isFocused ? "shadow-lg ring-2 ring-primary/20" : ""
              }`}
            >
              <div className="flex items-center flex-1 px-3 sm:px-4 py-2.5 sm:py-3 gap-2">
                <MapPin className={`h-4 w-4 shrink-0 transition-colors duration-200 ${isFocused ? "text-primary" : "text-muted-foreground"}`} />
                <input
                  type="text"
                  placeholder="Search cleaner name, service, or location..."
                  className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground min-w-0"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => {
                    setIsFocused(true);
                    if (location.length >= 2) setShowDropdown(true);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    setTimeout(() => setShowDropdown(false), 200);
                  }}
                />
              </div>
              <Button type="submit" variant="secondary" size="sm" className="m-1.5 px-4 sm:px-5 rounded-lg font-semibold shrink-0">
                <Search className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline">Search</span>
              </Button>

              {showDropdown && (
                <LiveSearchDropdown
                  results={liveResults}
                  isLoading={isLoading}
                  query={location}
                  onSelect={() => setShowDropdown(false)}
                />
              )}
            </motion.form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex flex-wrap gap-1.5 sm:gap-2"
            >
              {categories.map((cat, i) => (
                <button
                  key={`${cat}-${i}`}
                  onClick={() => navigate(`/search?service=${encodeURIComponent(cat)}`)}
                  className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    i === 0
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "glass text-foreground hover:bg-primary/5 hover:border-primary/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          </div>

          <motion.div
            className="hidden lg:block"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <BlurImage
              src={heroCleaners}
              alt="Professional cleaning team"
              className="rounded-2xl aspect-[4/3]"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HomepageHero;
