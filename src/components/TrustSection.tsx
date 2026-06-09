import { Shield, BadgeCheck, Lock, HeadphonesIcon, RefreshCcw, Star } from "lucide-react";

const trustFeatures = [
  {
    icon: BadgeCheck,
    title: "Verified Professionals",
    description: "Every cleaner undergoes ID verification and background checks before joining our platform.",
  },
  {
    icon: Shield,
    title: "Insured Services",
    description: "All cleaning services are covered by comprehensive insurance for your peace of mind.",
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "Your payment information is protected with bank-level security through Stripe.",
  },
  {
    icon: Star,
    title: "Genuine Reviews",
    description: "Only verified customers can leave reviews, ensuring authentic feedback.",
  },
  {
    icon: HeadphonesIcon,
    title: "24/7 Support",
    description: "Our support team is always here to help resolve any issues quickly.",
  },
  {
    icon: RefreshCcw,
    title: "Satisfaction Guarantee",
    description: "Not happy? We'll send another cleaner or give you a full refund.",
  },
];

const TrustSection = () => {
  return (
    <section className="py-16 lg:py-24 bg-card">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-2 bg-secondary/10 text-secondary rounded-full text-sm font-medium mb-4">
            Your Safety Matters
          </span>
          <h2 className="font-heading text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Trust The Cleaning Network?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We've built a platform that prioritizes your safety, security, and satisfaction at every step.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trustFeatures.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 bg-background rounded-2xl border border-border hover:border-secondary/30 transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 flex items-center justify-center mb-4 transition-colors">
                <feature.icon className="h-6 w-6 text-secondary" />
              </div>
              <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
