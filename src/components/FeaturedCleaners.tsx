import { Star, MapPin, Shield, Clock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const cleaners = [
  {
    id: 1,
    name: "SparklePro Cleaning",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    rating: 4.9,
    reviews: 127,
    location: "Toronto, ON",
    services: ["Home", "Deep Clean", "Airbnb"],
    price: "From $85",
    verified: true,
    featured: true,
    responseTime: "Usually responds within 1 hour",
  },
  {
    id: 2,
    name: "CleanSweep Masters",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    rating: 4.8,
    reviews: 89,
    location: "Vancouver, BC",
    services: ["Office", "Commercial", "Post-Construction"],
    price: "From $120",
    verified: true,
    featured: false,
    responseTime: "Usually responds within 2 hours",
  },
  {
    id: 3,
    name: "Eco Clean Solutions",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    rating: 5.0,
    reviews: 64,
    location: "Calgary, AB",
    services: ["Eco-Friendly", "Home", "Move In/Out"],
    price: "From $95",
    verified: true,
    featured: true,
    responseTime: "Usually responds within 30 min",
  },
  {
    id: 4,
    name: "Maid Masters",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&h=400&fit=crop",
    rating: 4.7,
    reviews: 156,
    location: "Montreal, QC",
    services: ["Home", "Regular", "Deep Clean"],
    price: "From $75",
    verified: true,
    featured: false,
    responseTime: "Usually responds within 3 hours",
  },
];

const FeaturedCleaners = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
          <div>
            <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Top-Rated Cleaners Near You
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Verified professionals with excellent reviews and instant booking availability.
            </p>
          </div>
          <Button variant="outline" className="mt-4 md:mt-0">
            View All Cleaners
          </Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {cleaners.map((cleaner, index) => (
            <div
              key={cleaner.id}
              className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={cleaner.image}
                  alt={cleaner.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {cleaner.featured && (
                  <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                    ⭐ Featured
                  </Badge>
                )}
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
                  <Heart className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cleaner.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {cleaner.location}
                    </div>
                  </div>
                  {cleaner.verified && (
                    <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center" title="Verified">
                      <Shield className="h-3 w-3 text-secondary" />
                    </div>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-accent text-accent" />
                    <span className="font-semibold text-foreground">{cleaner.rating}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">({cleaner.reviews} reviews)</span>
                </div>

                {/* Services */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {cleaner.services.slice(0, 3).map((service) => (
                    <span
                      key={service}
                      className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                {/* Response Time */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
                  <Clock className="h-3 w-3" />
                  {cleaner.responseTime}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-semibold text-primary">{cleaner.price}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Quote
                    </Button>
                    <Button variant="secondary" size="sm">
                      Book
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCleaners;
