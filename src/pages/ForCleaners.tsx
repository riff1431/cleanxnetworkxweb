import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { 
  CheckCircle, 
  DollarSign, 
  Calendar, 
  Users, 
  Star,
  Shield,
  Clock,
  TrendingUp
} from "lucide-react";

const ForCleaners = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const benefits = [
    {
      icon: DollarSign,
      title: "Set Your Own Rates",
      description: "You're in control. Set competitive prices that reflect your skills and experience.",
    },
    {
      icon: Calendar,
      title: "Flexible Schedule",
      description: "Work when you want. Accept jobs that fit your availability.",
    },
    {
      icon: Users,
      title: "Grow Your Client Base",
      description: "Connect with thousands of customers looking for quality cleaning services.",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Get paid on time, every time through our secure payment system.",
    },
    {
      icon: Star,
      title: "Build Your Reputation",
      description: "Earn reviews and ratings to stand out from the competition.",
    },
    {
      icon: TrendingUp,
      title: "Business Tools",
      description: "Track earnings, manage bookings, and grow your business with our dashboard.",
    },
  ];

  const steps = [
    {
      number: "1",
      title: "Create Your Profile",
      description: "Sign up and tell us about your cleaning experience and services.",
    },
    {
      number: "2",
      title: "Set Your Availability",
      description: "Choose when you're available to take on cleaning jobs.",
    },
    {
      number: "3",
      title: "Start Getting Bookings",
      description: "Customers will find you and request your services.",
    },
    {
      number: "4",
      title: "Earn & Grow",
      description: "Complete jobs, get paid, and build your cleaning business.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/10 text-secondary-dark px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Star className="h-4 w-4" />
              Join 500+ Verified Cleaners
            </div>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Turn Your Cleaning Skills Into a{" "}
              <span className="text-primary">Thriving Business</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join The Cleaning Network and connect with customers who need your services. 
              Set your own schedule, rates, and build your reputation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Button size="lg" onClick={() => navigate("/cleaner/dashboard")}>
                  Go to Dashboard
                </Button>
              ) : (
                <Button size="lg" onClick={() => navigate("/auth")}>
                  Get Started Free
                </Button>
              )}
              <Button size="lg" variant="outline" onClick={() => navigate("/search")}>
                Browse Opportunities
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              Why Clean With Us?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to run and grow your cleaning business, all in one place.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-card rounded-2xl p-6 border border-border hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading text-xl font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started is easy. Follow these simple steps to begin earning.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {step.number}
                </div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-primary rounded-3xl p-8 md:p-12 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Start Earning?
            </h2>
            <p className="text-primary-foreground/90 max-w-2xl mx-auto mb-8">
              Join hundreds of cleaners who are growing their business with The Cleaning Network.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => navigate(user ? "/cleaner/dashboard" : "/auth")}
            >
              {user ? "Go to Dashboard" : "Sign Up Now - It's Free"}
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ForCleaners;
