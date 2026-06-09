import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Users, Shield, Heart, Target } from "lucide-react";

const About = () => {
  const values = [
    { icon: Shield, title: "Trust & Safety", description: "Every cleaner is verified and reviewed. Your safety is our top priority." },
    { icon: Users, title: "Community First", description: "We empower local cleaning professionals to grow their businesses." },
    { icon: Heart, title: "Quality Service", description: "We maintain high standards so you always get the best cleaning experience." },
    { icon: Target, title: "Innovation", description: "We use technology to make booking and managing cleaning services effortless." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="text-4xl font-heading font-bold text-foreground mb-6">About The Cleaning Network</h1>
          <p className="text-lg text-muted-foreground mb-8">
            The Cleaning Network is Canada's trusted marketplace connecting homeowners and businesses with verified, professional cleaning services. Founded with a mission to simplify the way people find and book reliable cleaners, we've built a platform that benefits both customers and cleaning professionals.
          </p>

          <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">Our Mission</h2>
          <p className="text-muted-foreground mb-12">
            To create a transparent, trustworthy marketplace where quality cleaning professionals can thrive and customers can find the perfect cleaning service with confidence.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mb-12">
            {values.map((value) => (
              <div key={value.title} className="p-6 rounded-xl border bg-card">
                <value.icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-semibold text-foreground mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-heading font-semibold text-foreground mb-4">Our Story</h2>
          <p className="text-muted-foreground">
            Started in Toronto, The Cleaning Network was born from a simple frustration: finding a reliable, trustworthy cleaner shouldn't be hard. We built a platform that vets every professional, makes booking seamless, and ensures every customer gets a five-star experience. Today, we serve communities across Canada and continue to grow every day.
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
