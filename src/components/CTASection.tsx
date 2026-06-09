import { Button } from "@/components/ui/button";
import { ArrowRight, Briefcase, Users } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-16 lg:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-6">
          {/* For Customers */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-primary-dark p-8 lg:p-12 text-primary-foreground">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Users className="h-7 w-7" />
              </div>
              
              <h3 className="font-heading text-2xl lg:text-3xl font-bold mb-4">
                Need Cleaning Services?
              </h3>
              <p className="text-primary-foreground/80 mb-6 max-w-md">
                Find verified cleaners in your area, compare prices, and book instantly. Your clean home is just a few clicks away.
              </p>
              
              <Button variant="hero-outline" size="lg" className="group">
                Find a Cleaner
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>

          {/* For Cleaners */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary to-secondary-dark p-8 lg:p-12 text-secondary-foreground">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Briefcase className="h-7 w-7" />
              </div>
              
              <h3 className="font-heading text-2xl lg:text-3xl font-bold mb-4">
                Are You a Cleaning Pro?
              </h3>
              <p className="text-secondary-foreground/80 mb-6 max-w-md">
                Join our network of trusted cleaners. Get consistent leads, manage bookings, and grow your business with us.
              </p>
              
              <Button variant="hero-outline" size="lg" className="group">
                Join as a Cleaner
                <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
