import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { SubscriptionPlan } from "@/types/subscription";
import { Crown, Check, Loader2, AlertCircle, CreditCard, Building } from "lucide-react";
import { format } from "date-fns";

const CleanerSubscription = () => {
  const { plans, loading: plansLoading } = useSubscriptionPlans('cleaner');
  const { subscription, loading: subLoading, subscribeToPlan, cancelSubscription, hasActiveSubscription } = useUserSubscription();
  const { formatCurrency } = usePlatformSettings();
  const { settings: paymentSettings, loading: paymentLoading } = usePaymentSettings();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleSelectPlan = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
  };

  const handleSubscribe = async (paymentMethod: 'bank_transfer' | 'stripe') => {
    if (!selectedPlan) return;
    setProcessing(true);
    try {
      await subscribeToPlan(selectedPlan.id, paymentMethod);
      setShowPaymentDialog(false);
      setSelectedPlan(null);
    } finally {
      setProcessing(false);
    }
  };


  const getTierStyles = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'border-muted';
      case 'pro':
        return 'border-primary ring-1 ring-primary';
      case 'premium':
        return 'border-yellow-500 ring-2 ring-yellow-500 bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-950/20';
    }
  };

  if (plansLoading || subLoading || paymentLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Crown className="h-6 w-6 text-yellow-500" />
          Membership Plans
        </h2>
        <p className="text-muted-foreground">Upgrade your membership to unlock premium features and grow your business</p>
      </div>

      {/* Current Subscription Status */}
      {subscription && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Current Subscription
                </CardTitle>
                <CardDescription>
                  {subscription.plan?.name}
                </CardDescription>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Start Date</p>
                <p className="font-medium">
                  {subscription.start_date ? format(new Date(subscription.start_date), 'MMM d, yyyy') : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Next Billing</p>
                <p className="font-medium">
                  {subscription.next_billing_date ? format(new Date(subscription.next_billing_date), 'MMM d, yyyy') : 'Pending'}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{subscription.payment_method.replace('_', ' ')}</p>
              </div>
            </div>
            {subscription.status === 'pending' && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">Payment Pending Verification</p>
                  <p className="text-yellow-700 dark:text-yellow-300">Your subscription will be activated once your payment is verified by an admin.</p>
                </div>
              </div>
            )}
            <div className="mt-4 p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              <p>To cancel your subscription, please send an email with at least <strong className="text-foreground">30 days' notice</strong>. Contact us at our support email to initiate the cancellation process.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.filter(p => p.is_active).map((plan) => {
          const isCurrentPlan = subscription?.plan_id === plan.id;
          return (
            <Card key={plan.id} className={`relative ${getTierStyles(plan.tier)}`}>
              {plan.tier === 'pro' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary">Most Popular</Badge>
                </div>
              )}
              {plan.tier === 'premium' && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-yellow-500 text-yellow-950">Best Value</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className={`h-5 w-5 ${plan.tier === 'premium' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold">{formatCurrency(plan.monthly_price)}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t space-y-2 text-sm">
                  {plan.priority_listing_boost > 0 && (
                    <p className="text-muted-foreground">+{plan.priority_listing_boost}% listing priority</p>
                  )}
                  {plan.commission_discount > 0 && (
                    <p className="text-muted-foreground">{plan.commission_discount}% commission reduction</p>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>Current Plan</Button>
                ) : hasActiveSubscription ? (
                  <Button className="w-full" variant="outline" disabled>
                    Cancel current to switch
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    variant={plan.tier === 'premium' ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                  >
                    Subscribe
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Choose Payment Method</DialogTitle>
            <DialogDescription>
              Subscribe to {selectedPlan?.name} for {formatCurrency(selectedPlan?.monthly_price || 0)}/month
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {paymentSettings?.bank_enabled && (
              <Button
                variant="outline"
                className="h-auto p-4 justify-start"
                onClick={() => handleSubscribe('bank_transfer')}
                disabled={processing}
              >
                <Building className="h-5 w-5 mr-3" />
                <div className="text-left">
                  <p className="font-medium">Bank Transfer</p>
                  <p className="text-sm text-muted-foreground">Pay via bank transfer (requires admin verification)</p>
                </div>
              </Button>
            )}
            <Button
              variant="outline"
              className="h-auto p-4 justify-start opacity-50 cursor-not-allowed"
              disabled
            >
              <CreditCard className="h-5 w-5 mr-3" />
              <div className="text-left">
                <p className="font-medium">Credit/Debit Card</p>
                <p className="text-sm text-muted-foreground">Coming soon - Stripe integration</p>
              </div>
            </Button>
          </div>
          {paymentSettings?.bank_enabled && paymentSettings?.bank_instructions && (
            <div className="p-4 bg-muted rounded-lg text-sm">
              <p className="font-medium mb-2">Bank Transfer Details:</p>
              <p className="text-muted-foreground">{paymentSettings.bank_name} - {paymentSettings.bank_account_name}</p>
              <p className="whitespace-pre-wrap text-muted-foreground mt-2">{paymentSettings.bank_instructions}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default CleanerSubscription;
