import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { FileText, Download, Mail, Loader2, Search, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface InvoiceViewerProps {
  /** Which role is viewing: determines query filter */
  role: "customer" | "cleaner" | "admin";
}

const InvoiceList = ({ role }: InvoiceViewerProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = usePlatformSettings();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["invoices", role, user?.id],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from("invoices").select("*").order("created_at", { ascending: false });

      if (role === "customer") {
        query = query.eq("customer_id", user!.id);
      } else if (role === "cleaner") {
        query = query.eq("cleaner_id", user!.id);
      }
      // admin sees all

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = invoices.filter((inv) => {
    const matchesSearch =
      !search ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.service_type.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handlePreview = async (invoiceId: string) => {
    setLoadingId(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoiceId, sendEmail: false },
      });
      if (error) throw error;
      setPreviewHtml(data.html);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to generate invoice preview." });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (invoiceId: string, invoiceNumber: string) => {
    setLoadingId(invoiceId);
    try {
      const { data, error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoiceId, sendEmail: false },
      });
      if (error) throw error;

      const blob = new Blob([data.html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${invoiceNumber}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: "Downloaded", description: `Invoice ${invoiceNumber} downloaded.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to download invoice." });
    } finally {
      setLoadingId(null);
    }
  };

  const handleEmail = async (invoiceId: string, invoiceNumber: string) => {
    setLoadingId(invoiceId);
    try {
      const { error } = await supabase.functions.invoke("generate-invoice-pdf", {
        body: { invoiceId, sendEmail: true },
      });
      if (error) throw error;
      toast({ title: "Email Sent", description: `Invoice ${invoiceNumber} sent to customer.` });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to send invoice email." });
    } finally {
      setLoadingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "warning" | "outline"; label: string }> = {
      paid: { variant: "success", label: "Paid" },
      issued: { variant: "warning", label: "Issued" },
    };
    const s = map[status] || { variant: "outline" as const, label: status };
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <FileText className="h-7 w-7 text-primary" /> Invoices
        </h1>
        <p className="text-muted-foreground">
          {role === "admin" ? "Manage all platform invoices" : "View your invoices and payment history"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Total Invoices</p>
            <p className="text-2xl font-bold">{invoices.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">Paid</p>
            <p className="text-2xl font-bold text-secondary">{invoices.filter(i => i.status === "paid").length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground">
              {role === "cleaner" ? "Total Earnings" : "Total Amount"}
            </p>
            <p className="text-2xl font-bold">
              {formatCurrency(invoices.reduce((sum, i) => sum + Number(role === "cleaner" ? i.net_amount : i.amount), 0))}
            </p>
          </CardContent>
        </Card>
        {role === "admin" && (
          <Card>
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-muted-foreground">Commission Earned</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(invoices.reduce((sum, i) => sum + Number(i.commission_amount), 0))}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="issued">Issued</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                {role === "admin" && <TableHead className="text-right">Commission</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={role === "admin" ? 7 : 6} className="text-center py-12 text-muted-foreground">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono font-medium text-sm">{inv.invoice_number}</TableCell>
                    <TableCell>{inv.service_type}</TableCell>
                    <TableCell>{format(new Date(inv.service_date), "MMM d, yyyy")}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(role === "cleaner" ? inv.net_amount : inv.amount))}
                    </TableCell>
                    {role === "admin" && (
                      <TableCell className="text-right text-primary font-medium">
                        {formatCurrency(Number(inv.commission_amount))}
                      </TableCell>
                    )}
                    <TableCell>{getStatusBadge(inv.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={loadingId === inv.id}
                          onClick={() => handlePreview(inv.id)}
                          title="Preview"
                        >
                          {loadingId === inv.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          disabled={loadingId === inv.id}
                          onClick={() => handleDownload(inv.id, inv.invoice_number)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {role === "admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={loadingId === inv.id}
                            onClick={() => handleEmail(inv.id, inv.invoice_number)}
                            title="Email to customer"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewHtml} onOpenChange={() => setPreviewHtml(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
          </DialogHeader>
          {previewHtml && (
            <iframe
              srcDoc={previewHtml}
              className="w-full min-h-[600px] border rounded-lg"
              title="Invoice Preview"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceList;
