import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { Check, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SubscriptionPlan } from "@/types/subscription";

const freePlan = {
  name: "Free",
  description: "Perfect for getting started",
  features: ["Browse & search cleaners", "Read reviews", "Basic booking", "Email support"],
  cta: "Get Started",
};

const PlanCard = ({ plan, formatCurrency, highlighted, navigate }: {
  plan: SubscriptionPlan;
  formatCurrency: (n: number) => string;
  highlighted: boolean;
  navigate: (path: string) => void;
}) => (
  <div
    className={`rounded-2xl border p-8 flex flex-col ${
      highlighted
        ? "border-primary bg-primary/5 shadow-lg scale-105"
        : "bg-card"
    }`}
  >
    {highlighted && (
      <Badge className="bg-primary self-start mb-3">Most Popular</Badge>
    )}
    {plan.tier === "premium" && (
      <Badge className="bg-yellow-500 text-yellow-950 self-start mb-3">Best Value</Badge>
    )}
    <h3 className="text-xl font-semibold text-foreground flex items-center gap-2">
      <Crown className={`h-5 w-5 ${plan.tier === "premium" ? "text-yellow-500" : "text-muted-foreground"}`} />
      {plan.name}
    </h3>
    <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.description}</p>
    <div className="mb-6">
      <span className="text-4xl font-bold text-foreground">{formatCurrency(plan.monthly_price)}</span>
      <span className="text-muted-foreground">/month</span>
    </div>
    <ul className="space-y-3 mb-4 flex-1">
      {plan.features.map((f, i) => (
        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
          <Check className="h-4 w-4 text-primary flex-shrink-0" />
          {f}
        </li>
      ))}
    </ul>
    {/* Dynamic benefits */}
    <div className="space-y-1 mb-6 text-sm">
      {plan.booking_discount_percent > 0 && (
        <p className="text-green-600 font-medium">Save {plan.booking_discount_percent}% on every booking</p>
      )}
      {plan.priority_listing_boost > 0 && (
        <p className="text-muted-foreground">+{plan.priority_listing_boost}% listing priority</p>
      )}
      {plan.commission_discount > 0 && (
        <p className="text-muted-foreground">{plan.commission_discount}% commission reduction</p>
      )}
      {plan.includes_verification_badge && (
        <p className="text-muted-foreground">✓ Verification badge</p>
      )}
      {plan.includes_analytics_access && (
        <p className="text-muted-foreground">✓ Analytics access</p>
      )}
    </div>
    <Button
      variant={highlighted ? "default" : "outline"}
      className="w-full"
      onClick={() => navigate("/auth")}
    >
      Subscribe
    </Button>
  </div>
);

const Pricing = () => {
  const navigate = useNavigate();
  const { plans: customerPlans, loading: customerLoading } = useSubscriptionPlans("customer");
  const { plans: cleanerPlans, loading: cleanerLoading } = useSubscriptionPlans("cleaner");
  const { formatCurrency, loading: settingsLoading } = usePlatformSettings();

  const loading = customerLoading || cleanerLoading || settingsLoading;

  const renderPlans = (plans: SubscriptionPlan[]) => {
    const activePlans = plans.filter((p) => p.is_active);

    if (activePlans.length === 0) {
      return (
        <div className="text-center py-12">
          <Crown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No Plans Available Yet</h3>
          <p className="text-muted-foreground">Membership plans will be available soon.</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Free plan */}
        <div className="rounded-2xl border bg-card p-8 flex flex-col">
          <h3 className="text-xl font-semibold text-foreground">{freePlan.name}</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">{freePlan.description}</p>
          <div className="mb-6">
            <span className="text-4xl font-bold text-foreground">{formatCurrency(0)}</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {freePlan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>
            {freePlan.cta}
          </Button>
        </div>

        {activePlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            formatCurrency={formatCurrency}
            highlighted={plan.tier === "pro"}
            navigate={navigate}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-16 max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="text-center mb-12">
            <h1 className="text-4xl font-heading font-bold text-foreground mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground">Choose the plan that's right for you</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="customer" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
                <TabsTrigger value="customer">For Customers</TabsTrigger>
                <TabsTrigger value="cleaner">For Cleaners</TabsTrigger>
              </TabsList>
              <TabsContent value="customer">
                {renderPlans(customerPlans)}
              </TabsContent>
              <TabsContent value="cleaner">
                {renderPlans(cleanerPlans)}
              </TabsContent>
            </Tabs>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Pricing;
