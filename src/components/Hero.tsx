import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Star, Shield, Clock } from "lucide-react";
import LocationAutocomplete from "@/components/LocationAutocomplete";
import heroImage from "@/assets/hero-cleaning.jpg";

const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(location)}`);
  };

  const stats = [
    { icon: Star, value: "4.9", label: "Average Rating" },
    { icon: Shield, value: "500+", label: "Verified Cleaners" },
    { icon: Clock, value: "24h", label: "Quick Booking" },
  ];

  return (
    <section className="relative overflow-hidden gradient-hero">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-16 lg:py-24 relative">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary-dark px-4 py-2 rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Shield className="h-4 w-4" />
              Trusted by 10,000+ Canadians
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Find & Book{" "}
              <span className="text-primary">Trusted Local</span>{" "}
              Cleaners
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              Connect with verified cleaning professionals near you. Compare prices, read reviews, and book instantly — all in one place.
            </p>

            {/* Search Box */}
            <form onSubmit={handleSearch} className="bg-card rounded-2xl p-2 shadow-card-hover max-w-xl mx-auto lg:mx-0 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <div className="flex flex-col sm:flex-row gap-2">
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  onSelect={(city) => navigate(`/search?location=${encodeURIComponent(city)}`)}
                />
                <Button type="submit" variant="hero" size="lg" className="px-8">
                  <Search className="h-5 w-5 mr-2" />
                  Search
                </Button>
              </div>
            </form>

            {/* Quick Categories */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 mt-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {["Home Cleaning", "Office", "Deep Clean", "Move-in/out", "Airbnb"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => navigate(`/search?service=${encodeURIComponent(cat)}`)}
                  className="px-4 py-2 bg-card hover:bg-primary hover:text-primary-foreground rounded-full text-sm font-medium text-muted-foreground transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Stats & Image */}
          <div className="relative hidden lg:block">
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl transform rotate-3" />
              <div className="absolute inset-0 bg-card rounded-3xl shadow-xl overflow-hidden">
                <img 
                  src={heroImage} 
                  alt="Professional cleaning service" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>

              {/* Floating Stats Cards */}
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`absolute bg-card rounded-xl p-4 shadow-lg animate-fade-in ${
                    index === 0 ? "top-4 -left-8" :
                    index === 1 ? "top-1/2 -right-8 -translate-y-1/2" :
                    "bottom-4 left-1/4"
                  }`}
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <stat.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
