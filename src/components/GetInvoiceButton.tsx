import { useState, useCallback } from "react";
import { FileText, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface GetInvoiceButtonProps {
  bookingId: string;
  variant?: "outline" | "ghost" | "default";
  size?: "sm" | "default" | "icon";
  className?: string;
}

const GetInvoiceButton = ({ bookingId, variant = "outline", size = "sm", className }: GetInvoiceButtonProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  const handleGetInvoice = async () => {
    setLoading(true);
    try {
      // First check if an invoice exists for this booking
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (!invoice) {
        toast({ title: "No Invoice", description: "No invoice has been generated for this booking yet." });
        return;
      }

      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoiceId: invoice.id, sendEmail: false },
      });
      if (error) throw error;
      setPreviewHtml(data.html);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to retrieve invoice." });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = useCallback(() => {
    if (!previewHtml) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({ variant: "destructive", title: "Error", description: "Please allow popups to download the invoice." });
      return;
    }
    printWindow.document.write(previewHtml);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }, [previewHtml, toast]);

  return (
    <>
      <Button variant={variant} size={size} className={className} disabled={loading} onClick={handleGetInvoice}>
        {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <FileText className="h-4 w-4 mr-1" />}
        Invoice
      </Button>

      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Invoice
              <Button variant="outline" size="sm" onClick={handleDownloadPdf} className="mr-6">
                <Download className="h-4 w-4 mr-1" />
                Download / Print
              </Button>
            </DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe srcDoc={previewHtml} className="w-full min-h-[600px] border rounded-lg" title="Invoice" />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default GetInvoiceButton;
