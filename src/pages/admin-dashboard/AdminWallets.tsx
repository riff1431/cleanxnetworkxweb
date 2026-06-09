import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, CheckCircle, XCircle, Plus, Minus, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WalletWithProfile {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  updated_at: string;
  profile?: { full_name: string | null; email: string | null };
}

interface TopUpRequestWithProfile {
  id: string;
  user_id: string;
  wallet_id: string;
  amount: number;
  payment_method: string;
  status: string;
  rejection_reason: string | null;
  proof_image_url: string | null;
  created_at: string;
  profile?: { full_name: string | null; email: string | null };
}

const AdminWallets = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { formatCurrency } = usePlatformSettings();
  const [wallets, setWallets] = useState<WalletWithProfile[]>([]);
  const [topUpRequests, setTopUpRequests] = useState<TopUpRequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [adjustDialog, setAdjustDialog] = useState<{ open: boolean; wallet: WalletWithProfile | null; type: "credit" | "debit" }>({
    open: false,
    wallet: null,
    type: "credit",
  });
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustDescription, setAdjustDescription] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [topUpFilter, setTopUpFilter] = useState("pending");
  const [proofImageUrl, setProofImageUrl] = useState<string | null>(null);

  const fetchWallets = async () => {
    const { data, error } = await supabase.from("wallets").select("*").order("updated_at", { ascending: false });
    if (error) { console.error(error); return; }

    // Fetch profiles for each wallet
    const userIds = (data || []).map((w: any) => w.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    setWallets((data || []).map((w: any) => ({ ...w, profile: profileMap.get(w.user_id) })));
  };

  const fetchTopUpRequests = async () => {
    let query = supabase.from("wallet_topup_requests").select("*").order("created_at", { ascending: false });
    if (topUpFilter !== "all") {
      query = query.eq("status", topUpFilter);
    }
    const { data, error } = await query;
    if (error) { console.error(error); return; }

    const userIds = (data || []).map((r: any) => r.user_id);
    const { data: profiles } = await supabase.from("profiles").select("id, full_name, email").in("id", userIds.length > 0 ? userIds : ["none"]);
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    setTopUpRequests((data || []).map((r: any) => ({ ...r, profile: profileMap.get(r.user_id) })));
  };

  useEffect(() => {
    Promise.all([fetchWallets(), fetchTopUpRequests()]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchTopUpRequests();
  }, [topUpFilter]);

  const handleAdjust = async () => {
    const amount = parseFloat(adjustAmount);
    if (!adjustDialog.wallet || isNaN(amount) || amount <= 0) return;

    try {
      const fn = adjustDialog.type === "credit" ? "credit_wallet" : "debit_wallet";
      const { error } = await supabase.rpc(fn, {
        p_user_id: adjustDialog.wallet.user_id,
        p_amount: amount,
        p_type: adjustDialog.type === "credit" ? "admin_credit" : "admin_debit",
        p_description: adjustDescription || `Admin ${adjustDialog.type}`,
      });
      if (error) throw error;
      toast({ title: `Wallet ${adjustDialog.type}ed`, description: `${formatCurrency(amount)} ${adjustDialog.type}ed successfully.` });
      setAdjustDialog({ open: false, wallet: null, type: "credit" });
      setAdjustAmount("");
      setAdjustDescription("");
      await fetchWallets();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleVerifyTopUp = async (request: TopUpRequestWithProfile) => {
    try {
      const { error: creditError } = await supabase.rpc("credit_wallet", {
        p_user_id: request.user_id,
        p_amount: request.amount,
        p_type: "top_up",
        p_description: `Top-up via ${request.payment_method}`,
        p_reference_id: request.id,
      });
      if (creditError) throw creditError;

      const { error: updateError } = await supabase
        .from("wallet_topup_requests")
        .update({ status: "verified", verified_by: user?.id, verified_at: new Date().toISOString() })
        .eq("id", request.id);
      if (updateError) throw updateError;

      toast({ title: "Top-up verified", description: `${formatCurrency(request.amount)} credited to wallet.` });
      await Promise.all([fetchWallets(), fetchTopUpRequests()]);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleRejectTopUp = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from("wallet_topup_requests")
        .update({ status: "rejected", rejection_reason: rejectReason || "Rejected by admin", verified_by: user?.id, verified_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;
      toast({ title: "Top-up rejected" });
      setRejectReason("");
      await fetchTopUpRequests();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const pendingTopUps = topUpRequests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold text-foreground">Wallet Management</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-primary/10"><Wallet className="h-6 w-6 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Wallets</p>
                <p className="text-2xl font-bold">{wallets.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-secondary/10"><Wallet className="h-6 w-6 text-secondary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Total Balance</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBalance)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-destructive/10"><Wallet className="h-6 w-6 text-destructive" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Top-Ups</p>
                <p className="text-2xl font-bold">{pendingTopUps}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="wallets">
        <TabsList>
          <TabsTrigger value="wallets">All Wallets</TabsTrigger>
          <TabsTrigger value="topups">
            Top-Up Requests
            {pendingTopUps > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">{pendingTopUps}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wallets">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallets.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.profile?.full_name || "Unknown"}</TableCell>
                      <TableCell className="text-muted-foreground">{w.profile?.email || "—"}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(w.balance)}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(w.updated_at), "MMM d, yyyy")}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="outline" onClick={() => setAdjustDialog({ open: true, wallet: w, type: "credit" })}>
                            <Plus className="h-3 w-3 mr-1" />Credit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setAdjustDialog({ open: true, wallet: w, type: "debit" })}>
                            <Minus className="h-3 w-3 mr-1" />Debit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {wallets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No wallets found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topups">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle className="text-lg">Top-Up Requests</CardTitle>
              <Select value={topUpFilter} onValueChange={setTopUpFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="all">All</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topUpRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.profile?.full_name || "Unknown"}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(req.amount)}</TableCell>
                      <TableCell className="capitalize">{req.payment_method.replace(/_/g, " ")}</TableCell>
                      <TableCell>
                        {req.proof_image_url ? (
                          <button
                            onClick={() => setProofImageUrl(req.proof_image_url)}
                            className="group relative h-10 w-10 rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                          >
                            <img src={req.proof_image_url} alt="Proof" className="h-full w-full object-cover" />
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(req.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {req.status === "verified" && <Badge className="bg-primary/10 text-primary">Verified</Badge>}
                        {req.status === "rejected" && <Badge variant="destructive">Rejected</Badge>}
                        {req.status === "pending" && <Badge variant="secondary">Pending</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === "pending" && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" onClick={() => handleVerifyTopUp(req)}>
                              <CheckCircle className="h-3 w-3 mr-1" />Verify
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleRejectTopUp(req.id)}>
                              <XCircle className="h-3 w-3 mr-1" />Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {topUpRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No top-up requests found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Proof Image Dialog */}
      <Dialog open={!!proofImageUrl} onOpenChange={(open) => !open && setProofImageUrl(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
          </DialogHeader>
          {proofImageUrl && (
            <img src={proofImageUrl} alt="Payment proof" className="w-full rounded-lg border border-border" />
          )}
        </DialogContent>
      </Dialog>

      {/* Credit/Debit Dialog */}
      <Dialog open={adjustDialog.open} onOpenChange={(open) => setAdjustDialog({ ...adjustDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{adjustDialog.type === "credit" ? "Credit" : "Debit"} Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              User: <strong>{adjustDialog.wallet?.profile?.full_name || "Unknown"}</strong>
              <br />Current balance: <strong>{formatCurrency(adjustDialog.wallet?.balance || 0)}</strong>
            </p>
            <div>
              <label className="text-sm font-medium">Amount</label>
              <Input type="number" min="0.01" step="0.01" placeholder="Enter amount" value={adjustAmount} onChange={(e) => setAdjustAmount(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Description (optional)</label>
              <Textarea placeholder="Reason for adjustment" value={adjustDescription} onChange={(e) => setAdjustDescription(e.target.value)} />
            </div>
            <Button onClick={handleAdjust} className="w-full" disabled={!adjustAmount || parseFloat(adjustAmount) <= 0}>
              {adjustDialog.type === "credit" ? "Credit" : "Debit"} {adjustAmount ? formatCurrency(parseFloat(adjustAmount)) : ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWallets;
