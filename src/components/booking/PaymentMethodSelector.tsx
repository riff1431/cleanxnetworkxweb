import { useState, useRef } from "react";
import { CreditCard, Banknote, Landmark, Check, Copy, AlertCircle, Wallet, Plus, Upload, X, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePaymentSettings, PaymentMethod, PaymentMethodOption } from "@/hooks/usePaymentSettings";
import { useToast } from "@/hooks/use-toast";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import BankTransferProofDialog from "./BankTransferProofDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentMethodSelectorProps {
  selectedMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  disabled?: boolean;
  servicePrice?: number;
  onBankProofChange?: (proofUrl: string | null) => void;
}

const iconMap = {
  "credit-card": CreditCard,
  "banknote": Banknote,
  "landmark": Landmark,
  "wallet": Wallet,
};

const PaymentMethodSelector = ({
  selectedMethod,
  onMethodChange,
  disabled = false,
  servicePrice,
  onBankProofChange,
}: PaymentMethodSelectorProps) => {
  const { getAvailablePaymentMethods, getBankDetails, loading, hasPaymentMethods } = usePaymentSettings();
  const { wallet, requestTopUp, refetch: refetchWallet } = useWallet();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [bookingProofFile, setBookingProofFile] = useState<File | null>(null);
  const [bookingProofPreview, setBookingProofPreview] = useState<string | null>(null);
  const [bookingProofUploading, setBookingProofUploading] = useState(false);
  const bookingProofInputRef = useRef<HTMLInputElement>(null);

  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpPaymentMethod, setTopUpPaymentMethod] = useState("bank_transfer");
  const [bankProofOpen, setBankProofOpen] = useState(false);
  const [bankProofAmount, setBankProofAmount] = useState(0);
  const [topUpSubmitting, setTopUpSubmitting] = useState(false);

  const paymentMethods = getAvailablePaymentMethods();
  const walletBalance = wallet?.balance ?? 0;
  const hasEnoughBalance = servicePrice ? walletBalance >= servicePrice : true;

  // Add wallet option to payment methods
  const allMethods: PaymentMethodOption[] = [
    ...(wallet ? [{
      id: "wallet" as PaymentMethod,
      name: "Wallet Balance",
      description: `Available: $${walletBalance.toFixed(2)}`,
      icon: "wallet",
    }] : []),
    ...paymentMethods,
  ];
  const bankDetails = getBankDetails();

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;

    // If bank transfer, open the bank proof dialog
    if (topUpPaymentMethod === "bank_transfer") {
      setBankProofAmount(amount);
      setTopUpOpen(false);
      setBankProofOpen(true);
      return;
    }

    await requestTopUp(amount, topUpPaymentMethod);
    setTopUpAmount("");
    setTopUpOpen(false);
  };

  const handleBankProofSubmit = async (proofImageUrl: string | null) => {
    setTopUpSubmitting(true);
    try {
      if (!user || !wallet) return;

      const { error } = await supabase
        .from("wallet_topup_requests")
        .insert({
          user_id: user.id,
          wallet_id: wallet.id,
          amount: bankProofAmount,
          payment_method: "bank_transfer",
          proof_image_url: proofImageUrl,
        });

      if (error) throw error;

      toast({ title: "Top-up request submitted", description: "Your request will be verified by admin." });
      setBankProofOpen(false);
      setTopUpAmount("");
      await refetchWallet();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setTopUpSubmitting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({
      title: "Copied!",
      description: `${field} copied to clipboard`,
    });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleBookingProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 5MB.", variant: "destructive" });
      return;
    }
    setBookingProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setBookingProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    // Upload immediately
    uploadBookingProof(file);
  };

  const uploadBookingProof = async (file: File) => {
    if (!user) return;
    setBookingProofUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("payment-proofs").upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("payment-proofs").getPublicUrl(filePath);
      onBankProofChange?.(urlData.publicUrl);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setBookingProofFile(null);
      setBookingProofPreview(null);
      onBankProofChange?.(null);
    } finally {
      setBookingProofUploading(false);
    }
  };

  const removeBookingProof = () => {
    setBookingProofFile(null);
    setBookingProofPreview(null);
    if (bookingProofInputRef.current) bookingProofInputRef.current.value = "";
    onBankProofChange?.(null);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <div className="animate-pulse space-y-2">
          <div className="h-16 bg-muted rounded-lg" />
          <div className="h-16 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!hasPaymentMethods) {
    return (
      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              No payment methods are currently available. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label>Payment Method</Label>
      <RadioGroup
        value={selectedMethod || ""}
        onValueChange={(value) => onMethodChange(value as PaymentMethod)}
        disabled={disabled}
        className="space-y-2"
      >
        {allMethods.map((method) => {
          const Icon = iconMap[method.icon as keyof typeof iconMap] || CreditCard;
          const isSelected = selectedMethod === method.id;

          return (
            <div key={method.id}>
              <label
                htmlFor={method.id}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/50 hover:bg-muted/50",
                  disabled && "opacity-50 cursor-not-allowed",
                  method.id === "wallet" && !hasEnoughBalance && "opacity-60"
                )}
              >
                <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    isSelected ? "bg-primary/10" : "bg-muted"
                  )}
                >
                  <Icon className={cn("h-5 w-5", isSelected ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{method.name}</span>
                    {method.id === "stripe" && (
                      <Badge variant="secondary" className="text-xs">Secure</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </div>
                {isSelected && (
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </label>

              {/* Wallet balance info */}
              {isSelected && method.id === "wallet" && (
                <Card className={cn("mt-2", !hasEnoughBalance ? "border-destructive/50 bg-destructive/5" : "border-muted bg-muted/30")}>
                  <CardContent className="py-3 px-4">
                    {hasEnoughBalance ? (
                      <p className="text-sm text-muted-foreground">
                        <strong>${walletBalance.toFixed(2)}</strong> will be used from your wallet.
                        {servicePrice && <> Remaining: <strong>${(walletBalance - servicePrice).toFixed(2)}</strong></>}
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                          <p className="text-sm text-destructive">
                            Insufficient balance. You need <strong>${servicePrice?.toFixed(2)}</strong> but only have <strong>${walletBalance.toFixed(2)}</strong>.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => {
                            if (servicePrice) {
                              setTopUpAmount(Math.ceil(servicePrice - walletBalance).toString());
                            }
                            setTopUpOpen(true);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Top Up Wallet
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Show instructions for selected non-Stripe methods */}
              {isSelected && method.id === "cash" && method.instructions && (
                <Card className="mt-2 border-muted bg-muted/30">
                  <CardContent className="py-3 px-4">
                    <p className="text-sm text-muted-foreground">
                      <strong>Note:</strong> {method.instructions}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Show bank details for bank transfer */}
              {isSelected && method.id === "bank" && bankDetails && (
                <Card className="mt-2 border-muted bg-muted/30">
                  <CardContent className="py-3 px-4 space-y-3">
                    {bankDetails.instructions && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Instructions:</strong> {bankDetails.instructions}
                      </p>
                    )}
                    
                    <div className="space-y-2 text-sm">
                      {bankDetails.bankName && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Bank Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bankDetails.bankName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(bankDetails.bankName, "Bank Name")}
                            >
                              {copiedField === "Bank Name" ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {bankDetails.accountName && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Account Name:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{bankDetails.accountName}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(bankDetails.accountName, "Account Name")}
                            >
                              {copiedField === "Account Name" ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {bankDetails.routingNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Routing #:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium font-mono">{bankDetails.routingNumber}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(bankDetails.routingNumber, "Routing Number")}
                            >
                              {copiedField === "Routing Number" ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {bankDetails.accountNumber && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Account #:</span>
                          <span className="font-medium font-mono">{bankDetails.accountNumber}</span>
                        </div>
                      )}

                      {bankDetails.swiftCode && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">SWIFT/BIC:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium font-mono">{bankDetails.swiftCode}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => copyToClipboard(bankDetails.swiftCode, "SWIFT Code")}
                            >
                              {copiedField === "SWIFT Code" ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Your booking will be confirmed once payment is verified by our team.
                    </p>

                    {/* Payment Proof Upload */}
                    <div className="pt-3 border-t border-border space-y-2">
                      <Label className="text-sm font-semibold">Payment Proof (Screenshot)</Label>
                      <input
                        ref={bookingProofInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleBookingProofSelect}
                      />
                      {bookingProofPreview ? (
                        <div className="relative rounded-lg border border-border overflow-hidden">
                          <img src={bookingProofPreview} alt="Payment proof" className="w-full max-h-32 object-contain bg-muted/30" />
                          {bookingProofUploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </div>
                          )}
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6"
                            onClick={removeBookingProof}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => bookingProofInputRef.current?.click()}
                          className={cn(
                            "w-full flex flex-col items-center justify-center gap-1 p-4 rounded-lg border-2 border-dashed",
                            "border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer",
                            "bg-muted/20 hover:bg-muted/40"
                          )}
                        >
                          <Upload className="h-6 w-6 text-muted-foreground" />
                          <p className="text-xs font-medium text-foreground">Upload Screenshot</p>
                          <p className="text-[10px] text-muted-foreground">PNG, JPG up to 5MB</p>
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          );
        })}
      </RadioGroup>

      {/* Top-up Dialog */}
      <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {servicePrice && (
              <p className="text-sm text-muted-foreground">
                You need at least <strong>${(servicePrice - walletBalance).toFixed(2)}</strong> more to complete this booking.
              </p>
            )}
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                min="1"
                step="0.01"
                placeholder={servicePrice ? (servicePrice - walletBalance).toFixed(2) : "50.00"}
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={topUpPaymentMethod} onValueChange={setTopUpPaymentMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleTopUp} className="w-full" disabled={!topUpAmount || parseFloat(topUpAmount) <= 0}>
              {topUpPaymentMethod === "bank_transfer" ? "Continue to Bank Details" : "Submit Top-Up Request"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Your top-up will be verified by admin before the balance is updated.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bank Transfer Proof Dialog */}
      <BankTransferProofDialog
        open={bankProofOpen}
        onOpenChange={setBankProofOpen}
        amount={bankProofAmount}
        onSubmit={handleBankProofSubmit}
        submitting={topUpSubmitting}
      />
    </div>
  );
};

export default PaymentMethodSelector;
