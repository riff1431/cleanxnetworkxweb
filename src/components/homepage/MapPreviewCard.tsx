import { MapPin } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import bgMapSidebar from "@/assets/bg-map-sidebar.png";

const MapPreviewCard = () => {
  const revealRef = useScrollReveal<HTMLDivElement>({ y: 30, delay: 0.3 });

  return (
    <div ref={revealRef}>
      <div className="glass-strong rounded-xl shadow-card overflow-hidden transition-shadow duration-300 hover:shadow-card-hover">
        {/* Map Image */}
        <div className="relative h-48 overflow-hidden bg-card">
          <img src={bgMapSidebar} alt="Map preview" className="w-full h-full object-cover dark:opacity-60 dark:invert dark:hue-rotate-180" />
        </div>

        {/* Info */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h4 className="font-heading font-bold text-foreground">Your Cleancs Nε 9</h4>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Cartt your r anea · Cleaning Guote · State · cearn
          </p>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Coroiglet
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-secondary" />
              IMaaspens
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-accent" />
              Neove · 0 d.l39
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPreviewCard;
