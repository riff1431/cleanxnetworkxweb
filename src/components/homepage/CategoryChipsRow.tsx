import { Home, Building2, Paintbrush, HardHat, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const chips = [
  { icon: Home, label: "Airbnb" },
  { icon: Paintbrush, label: "Deep Clean" },
  { icon: Building2, label: "Office Cleaning" },
  { icon: HardHat, label: "Construction" },
  { icon: MapPin, label: "Full Home" },
  { icon: Users, label: "More" },
];

const CategoryChipsRow = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3 py-3 sm:py-4">
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => navigate(`/search?service=${encodeURIComponent(chip.label)}`)}
          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-card border border-border rounded-lg text-xs sm:text-sm font-medium text-foreground hover:bg-muted hover:shadow-sm transition-all"
        >
          <chip.icon className="h-4 w-4 text-primary" />
          {chip.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryChipsRow;
