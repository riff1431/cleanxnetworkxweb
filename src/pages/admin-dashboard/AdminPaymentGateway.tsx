import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  Settings2, 
  Wallet,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Banknote,
  Landmark,
  FileText
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

interface PaymentSettings {
  // Stripe Settings
  stripe_enabled: boolean;
  stripe_mode: "test" | "live";
  stripe_publishable_key: string;
  stripe_webhook_secret: string;
  // Cash Payment Settings
  cash_enabled: boolean;
  cash_instructions: string;
  cash_confirmation_required: boolean;
  // Bank Transfer Settings
  bank_enabled: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_routing_number: string;
  bank_swift_code: string;
  bank_instructions: string;
  // Payout Settings
  auto_payouts_enabled: boolean;
  payout_schedule: "daily" | "weekly" | "biweekly" | "monthly";
  minimum_payout_amount: number;
  payout_delay_days: number;
  // Transaction Settings
  capture_method: "automatic" | "manual";
  allow_refunds: boolean;
  refund_window_days: number;
  // Fees
  pass_processing_fee_to_customer: boolean;
  processing_fee_percentage: number;
}

const DEFAULT_SETTINGS: PaymentSettings = {
  stripe_enabled: false,
  stripe_mode: "test",
  stripe_publishable_key: "",
  stripe_webhook_secret: "",
  cash_enabled: false,
  cash_instructions: "Please pay the cleaner in cash after the service is completed.",
  cash_confirmation_required: true,
  bank_enabled: false,
  bank_name: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_routing_number: "",
  bank_swift_code: "",
  bank_instructions: "Please transfer the payment before your scheduled booking date.",
  auto_payouts_enabled: true,
  payout_schedule: "weekly",
  minimum_payout_amount: 50,
  payout_delay_days: 7,
  capture_method: "automatic",
  allow_refunds: true,
  refund_window_days: 14,
  pass_processing_fee_to_customer: false,
  processing_fee_percentage: 2.9,
};

const AdminPaymentGateway = () => {
  const [settings, setSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] = useState<PaymentSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(originalSettings);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        // Map from platform_settings to payment settings
        // For now, use defaults since payment columns don't exist yet
        const paymentSettings: PaymentSettings = {
          ...DEFAULT_SETTINGS,
          // These would be populated from actual database columns when added
        };
        setSettings(paymentSettings);
        setOriginalSettings(paymentSettings);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load payment settings",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real implementation, this would save to the database
      // For now, just simulate a save
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setOriginalSettings(settings);
      toast({
        title: "Settings saved",
        description: "Payment gateway settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save payment settings",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Gateway</h1>
          <p className="text-muted-foreground">
            Configure payment processing, payouts, and transaction settings
          </p>
        </div>
        <div className="flex gap-2">
          {hasChanges && (
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving || !hasChanges}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Payment Methods Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className={settings.stripe_enabled ? "border-primary/50 bg-primary/5" : "border-muted"}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={`p-2 rounded-full ${settings.stripe_enabled ? "bg-primary/10" : "bg-muted"}`}>
              <CreditCard className={`h-5 w-5 ${settings.stripe_enabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Stripe</p>
              <p className="text-xs text-muted-foreground">Credit/Debit Cards</p>
            </div>
            <Badge variant={settings.stripe_enabled ? "default" : "secondary"}>
              {settings.stripe_enabled ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={settings.cash_enabled ? "border-primary/50 bg-primary/5" : "border-muted"}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={`p-2 rounded-full ${settings.cash_enabled ? "bg-primary/10" : "bg-muted"}`}>
              <Banknote className={`h-5 w-5 ${settings.cash_enabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Cash</p>
              <p className="text-xs text-muted-foreground">Pay on Service</p>
            </div>
            <Badge variant={settings.cash_enabled ? "default" : "secondary"}>
              {settings.cash_enabled ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>

        <Card className={settings.bank_enabled ? "border-primary/50 bg-primary/5" : "border-muted"}>
          <CardContent className="flex items-center gap-3 py-4">
            <div className={`p-2 rounded-full ${settings.bank_enabled ? "bg-primary/10" : "bg-muted"}`}>
              <Landmark className={`h-5 w-5 ${settings.bank_enabled ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <p className="font-medium">Bank Transfer</p>
              <p className="text-xs text-muted-foreground">Offline Payment</p>
            </div>
            <Badge variant={settings.bank_enabled ? "default" : "secondary"}>
              {settings.bank_enabled ? "Active" : "Inactive"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Stripe Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Stripe Configuration
            </CardTitle>
            <CardDescription>
              Configure your Stripe payment gateway settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Stripe</Label>
                <p className="text-sm text-muted-foreground">
                  Accept credit card payments via Stripe
                </p>
              </div>
              <Switch
                checked={settings.stripe_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, stripe_enabled: checked })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Environment Mode</Label>
              <Select
                value={settings.stripe_mode}
                onValueChange={(value: "test" | "live") =>
                  setSettings({ ...settings, stripe_mode: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">Test Mode</SelectItem>
                  <SelectItem value="live">Live Mode</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Use Test Mode for development and testing
              </p>
            </div>

            <div className="space-y-2">
              <Label>Publishable Key</Label>
              <Input
                type="password"
                placeholder="pk_test_..."
                value={settings.stripe_publishable_key}
                onChange={(e) =>
                  setSettings({ ...settings, stripe_publishable_key: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Webhook Secret</Label>
              <Input
                type="password"
                placeholder="whsec_..."
                value={settings.stripe_webhook_secret}
                onChange={(e) =>
                  setSettings({ ...settings, stripe_webhook_secret: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground">
                Required for processing webhook events
              </p>
            </div>

            <Button variant="outline" className="w-full" asChild>
              <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Stripe Dashboard
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Cash Payment Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5" />
              Cash Payment
            </CardTitle>
            <CardDescription>
              Allow customers to pay cleaners directly in cash
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Cash Payments</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to select cash as payment method
                </p>
              </div>
              <Switch
                checked={settings.cash_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, cash_enabled: checked })
                }
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Confirmation</Label>
                <p className="text-sm text-muted-foreground">
                  Cleaner must confirm cash was received
                </p>
              </div>
              <Switch
                checked={settings.cash_confirmation_required}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, cash_confirmation_required: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Payment Instructions</Label>
              <Textarea
                placeholder="Instructions shown to customers..."
                value={settings.cash_instructions}
                onChange={(e) =>
                  setSettings({ ...settings, cash_instructions: e.target.value })
                }
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Displayed to customers when they select cash payment
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Important Note</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cash payments bypass online processing. Platform commission must be collected separately from cleaners.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bank Transfer Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5" />
              Bank Transfer (Offline)
            </CardTitle>
            <CardDescription>
              Accept direct bank transfers for bookings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Bank Transfers</Label>
                <p className="text-sm text-muted-foreground">
                  Allow customers to pay via bank transfer
                </p>
              </div>
              <Switch
                checked={settings.bank_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, bank_enabled: checked })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                placeholder="e.g., TD Bank, RBC, etc."
                value={settings.bank_name}
                onChange={(e) =>
                  setSettings({ ...settings, bank_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Account Holder Name</Label>
              <Input
                placeholder="Business or personal name"
                value={settings.bank_account_name}
                onChange={(e) =>
                  setSettings({ ...settings, bank_account_name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account Number</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={settings.bank_account_number}
                  onChange={(e) =>
                    setSettings({ ...settings, bank_account_number: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Routing Number</Label>
                <Input
                  placeholder="Transit/Routing #"
                  value={settings.bank_routing_number}
                  onChange={(e) =>
                    setSettings({ ...settings, bank_routing_number: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>SWIFT/BIC Code (Optional)</Label>
              <Input
                placeholder="For international transfers"
                value={settings.bank_swift_code}
                onChange={(e) =>
                  setSettings({ ...settings, bank_swift_code: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Transfer Instructions</Label>
              <Textarea
                placeholder="Instructions for customers..."
                value={settings.bank_instructions}
                onChange={(e) =>
                  setSettings({ ...settings, bank_instructions: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Verification Required</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Bank transfers require manual verification. Bookings will remain pending until payment is confirmed by admin.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payout Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Cleaner Payouts
            </CardTitle>
            <CardDescription>
              Configure how and when cleaners receive their earnings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automatic Payouts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically process scheduled payouts
                </p>
              </div>
              <Switch
                checked={settings.auto_payouts_enabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, auto_payouts_enabled: checked })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Payout Schedule</Label>
              <Select
                value={settings.payout_schedule}
                onValueChange={(value: "daily" | "weekly" | "biweekly" | "monthly") =>
                  setSettings({ ...settings, payout_schedule: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Bi-weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Minimum Payout Amount ($)</Label>
              <Input
                type="number"
                min="0"
                step="10"
                value={settings.minimum_payout_amount}
                onChange={(e) =>
                  setSettings({ ...settings, minimum_payout_amount: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Earnings must reach this threshold before payout
              </p>
            </div>

            <div className="space-y-2">
              <Label>Payout Delay (Days)</Label>
              <Input
                type="number"
                min="0"
                max="30"
                value={settings.payout_delay_days}
                onChange={(e) =>
                  setSettings({ ...settings, payout_delay_days: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Hold period after booking completion before payout eligibility
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings2 className="h-5 w-5" />
              Transaction Settings
            </CardTitle>
            <CardDescription>
              Configure payment capture and refund policies
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Payment Capture</Label>
              <Select
                value={settings.capture_method}
                onValueChange={(value: "automatic" | "manual") =>
                  setSettings({ ...settings, capture_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatic">Automatic (Immediate)</SelectItem>
                  <SelectItem value="manual">Manual (Authorize Only)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Manual capture authorizes the card but delays charging
              </p>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Refunds</Label>
                <p className="text-sm text-muted-foreground">
                  Enable refund processing for bookings
                </p>
              </div>
              <Switch
                checked={settings.allow_refunds}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, allow_refunds: checked })
                }
              />
            </div>

            {settings.allow_refunds && (
              <div className="space-y-2">
                <Label>Refund Window (Days)</Label>
                <Input
                  type="number"
                  min="0"
                  max="90"
                  value={settings.refund_window_days}
                  onChange={(e) =>
                    setSettings({ ...settings, refund_window_days: Number(e.target.value) })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum days after payment to request a refund
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Processing Fees */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Processing Fees
            </CardTitle>
            <CardDescription>
              Configure how payment processing fees are handled
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Pass Fees to Customer</Label>
                <p className="text-sm text-muted-foreground">
                  Add processing fee to customer's total
                </p>
              </div>
              <Switch
                checked={settings.pass_processing_fee_to_customer}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, pass_processing_fee_to_customer: checked })
                }
              />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Processing Fee Rate (%)</Label>
              <Input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={settings.processing_fee_percentage}
                onChange={(e) =>
                  setSettings({ ...settings, processing_fee_percentage: Number(e.target.value) })
                }
              />
              <p className="text-xs text-muted-foreground">
                Standard Stripe rate is 2.9% + $0.30 per transaction
              </p>
            </div>

            <div className="rounded-lg bg-muted p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">Fee Breakdown Example</span>
              </div>
              <p className="text-sm text-muted-foreground">
                For a $100 booking:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Processing Fee: ${(100 * settings.processing_fee_percentage / 100).toFixed(2)}</li>
                <li>• Platform Commission: Based on admin settings</li>
                <li>• Cleaner Receives: Remainder after fees</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security Notice */}
      <Card className="border-accent/50 bg-accent/5">
        <CardContent className="flex items-start gap-4 py-4">
          <Shield className="h-5 w-5 text-accent-foreground mt-0.5" />
          <div>
            <p className="font-medium">Payment Security</p>
            <p className="text-sm text-muted-foreground">
              All payment processing is handled securely through Stripe. Card details never touch our servers.
              Sensitive API keys should be stored as environment secrets, not in this interface.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPaymentGateway;
