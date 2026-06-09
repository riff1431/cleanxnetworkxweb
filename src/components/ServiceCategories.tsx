import { Home, Building2, Sparkles, Truck, Hotel, HardHat, Leaf, Waves } from "lucide-react";

const categories = [
  { icon: Home, label: "Home Cleaning", description: "Regular & one-time" },
  { icon: Building2, label: "Office Cleaning", description: "Commercial spaces" },
  { icon: Sparkles, label: "Deep Cleaning", description: "Thorough & detailed" },
  { icon: Truck, label: "Move In/Out", description: "Pre & post move" },
  { icon: Hotel, label: "Airbnb Turnover", description: "Quick turnaround" },
  { icon: HardHat, label: "Post Construction", description: "Builder cleans" },
  { icon: Leaf, label: "Eco-Friendly", description: "Green products" },
  { icon: Waves, label: "Carpet Cleaning", description: "Deep extraction" },
];

const ServiceCategories = () => {
  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Cleaning Services for Every Need
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From regular home cleaning to specialized commercial services, find the perfect match for your requirements.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((category, index) => (
            <button
              key={category.label}
              className="group p-6 bg-background rounded-2xl border border-border hover:border-primary/30 hover:shadow-card-hover transition-all duration-300 text-left animate-fade-in"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center mb-4 transition-colors">
                <category.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-heading font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                {category.label}
              </h3>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServiceCategories;
