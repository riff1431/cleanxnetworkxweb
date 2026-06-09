import { useState, useRef } from "react";
import { Upload, Check, Copy, Image, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { usePaymentSettings } from "@/hooks/usePaymentSettings";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BankTransferProofDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  onSubmit: (proofImageUrl: string | null) => void;
  submitting?: boolean;
}

const BankTransferProofDialog = ({
  open,
  onOpenChange,
  amount,
  onSubmit,
  submitting = false,
}: BankTransferProofDialogProps) => {
  const { getBankDetails } = usePaymentSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bankDetails = getBankDetails();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Copied!", description: `${field} copied to clipboard` });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setProofFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setProofPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async () => {
    let proofUrl: string | null = null;

    if (proofFile && user) {
      setUploading(true);
      try {
        const ext = proofFile.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("payment-proofs")
          .upload(filePath, proofFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("payment-proofs")
          .getPublicUrl(filePath);

        proofUrl = urlData.publicUrl;
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSubmit(proofUrl);
    // Reset state after submit
    setProofFile(null);
    setProofPreview(null);
  };

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-6 w-6"
      onClick={() => copyToClipboard(text, field)}
    >
      {copiedField === field ? (
        <Check className="h-3 w-3 text-primary" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bank Transfer Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Amount */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="py-3 px-4">
              <p className="text-sm text-muted-foreground">
                Transfer amount: <strong className="text-foreground text-lg">${amount.toFixed(2)}</strong>
              </p>
            </CardContent>
          </Card>

          {/* Bank Details */}
          {bankDetails && (
            <div className="space-y-1">
              <Label className="text-sm font-semibold">Bank Details</Label>
              <Card className="border-muted">
                <CardContent className="py-3 px-4 space-y-2 text-sm">
                  {bankDetails.instructions && (
                    <p className="text-muted-foreground pb-2 border-b border-border">
                      {bankDetails.instructions}
                    </p>
                  )}

                  {bankDetails.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Bank Name</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{bankDetails.bankName}</span>
                        <CopyButton text={bankDetails.bankName} field="Bank Name" />
                      </div>
                    </div>
                  )}

                  {bankDetails.accountName && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account Name</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{bankDetails.accountName}</span>
                        <CopyButton text={bankDetails.accountName} field="Account Name" />
                      </div>
                    </div>
                  )}

                  {bankDetails.routingNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Routing #</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium font-mono">{bankDetails.routingNumber}</span>
                        <CopyButton text={bankDetails.routingNumber} field="Routing #" />
                      </div>
                    </div>
                  )}

                  {bankDetails.accountNumber && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Account #</span>
                      <span className="font-medium font-mono">{bankDetails.accountNumber}</span>
                    </div>
                  )}

                  {bankDetails.swiftCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">SWIFT/BIC</span>
                      <div className="flex items-center gap-1">
                        <span className="font-medium font-mono">{bankDetails.swiftCode}</span>
                        <CopyButton text={bankDetails.swiftCode} field="SWIFT Code" />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Proof Upload */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold">Payment Proof (Screenshot)</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {proofPreview ? (
              <div className="relative rounded-lg border border-border overflow-hidden">
                <img
                  src={proofPreview}
                  alt="Payment proof"
                  className="w-full max-h-48 object-contain bg-muted/30"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7"
                  onClick={removeProof}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "w-full flex flex-col items-center justify-center gap-2 p-6 rounded-lg border-2 border-dashed",
                  "border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer",
                  "bg-muted/20 hover:bg-muted/40"
                )}
              >
                <Upload className="h-8 w-8 text-muted-foreground" />
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Upload Screenshot</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
                </div>
              </button>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            className="w-full"
            disabled={uploading || submitting}
          >
            {(uploading || submitting) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploading ? "Uploading..." : "Submit Top-Up Request"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Your top-up will be verified by admin before the balance is updated.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BankTransferProofDialog;
