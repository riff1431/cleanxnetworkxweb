import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import SearchResultsMap from "./SearchResultsMap";

// Sample nearby cleaners for the homepage
const NEARBY_CLEANERS = [
  {
    id: 1, name: "SparklePro Cleaning",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
    rating: 4.9, reviews: 127, location: "Toronto, ON",
    services: ["Home", "Deep Clean"], priceFrom: 85, verified: true,
  },
  {
    id: 3, name: "Eco Clean Solutions",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    rating: 5.0, reviews: 64, location: "Calgary, AB",
    services: ["Eco-Friendly", "Home"], priceFrom: 95, verified: true,
  },
  {
    id: 5, name: "Crystal Clear Cleaners",
    image: "https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=400&h=400&fit=crop",
    rating: 4.6, reviews: 203, location: "Toronto, ON",
    services: ["Home", "Office"], priceFrom: 90, verified: true,
  },
  {
    id: 6, name: "Fresh Start Cleaning Co.",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop",
    rating: 4.9, reviews: 78, location: "Ottawa, ON",
    services: ["Move In/Out", "Deep Clean"], priceFrom: 150, verified: true,
  },
  {
    id: 2, name: "CleanSweep Masters",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    rating: 4.8, reviews: 89, location: "Vancouver, BC",
    services: ["Office", "Commercial"], priceFrom: 120, verified: true,
  },
];

const NearbyCleanersMap = () => {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<number | string | null>(null);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <MapPin className="h-4 w-4" />
            Explore Nearby
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
            Cleaners Near You
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Browse cleaning professionals on the map. Click a marker to see their details and book directly.
          </p>
        </div>

        <SearchResultsMap
          cleaners={NEARBY_CLEANERS}
          activeCleanerId={activeId}
          onCleanerSelect={setActiveId}
          className="h-[450px] rounded-2xl overflow-hidden border border-border shadow-lg"
        />

        <div className="text-center mt-8">
          <Button
            size="lg"
            onClick={() => navigate("/search")}
            className="gap-2"
          >
            Browse All Cleaners
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default NearbyCleanersMap;
