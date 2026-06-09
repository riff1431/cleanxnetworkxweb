import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Search,
  FileText,
  Loader2,
  Users,
  Scale,
  ArrowLeft,
  AlertCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { format, isValid } from "date-fns";

const safeFormat = (value: string | null | undefined, fmt: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return isValid(d) ? format(d, fmt) : "—";
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  insurance: "Company Insurance",
  employee_list: "Employee Names",
  criminal_check: "Criminal Background Check",
  articles_of_incorporation: "Articles of Incorporation",
};

const DOC_ICONS: Record<string, any> = {
  insurance: Shield,
  employee_list: Users,
  criminal_check: FileText,
  articles_of_incorporation: Scale,
};

interface ProviderRequest {
  user_id: string;
  provider_name: string;
  provider_email: string;
  is_verified: boolean;
  documents: any[];
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  latestSubmission: string;
}

const AdminVerificationDocuments = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<ProviderRequest | null>(null);
  const [reviewDialog, setReviewDialog] = useState<any | null>(null);
  const [approveDialog, setApproveDialog] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [approveAllDialog, setApproveAllDialog] = useState<ProviderRequest | null>(null);

  const { data: providerRequests = [], isLoading } = useQuery({
    queryKey: ["admin-verification-docs", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("provider_verification_documents" as any)
        .select("*")
        .order("submitted_at", { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data as any[]).map((d: any) => d.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const { data: cleanerProfiles } = await supabase
        .from("cleaner_profiles")
        .select("user_id, business_name, is_verified")
        .in("user_id", userIds);

      // Group documents by user_id
      const grouped: Record<string, ProviderRequest> = {};
      (data as any[]).forEach((doc: any) => {
        if (!grouped[doc.user_id]) {
          const cp = cleanerProfiles?.find((c) => c.user_id === doc.user_id);
          const profile = profiles?.find((p) => p.id === doc.user_id);
          grouped[doc.user_id] = {
            user_id: doc.user_id,
            provider_name: cp?.business_name || profile?.full_name || "Unknown",
            provider_email: profile?.email || "",
            is_verified: cp?.is_verified || false,
            documents: [],
            pendingCount: 0,
            approvedCount: 0,
            rejectedCount: 0,
            latestSubmission: doc.submitted_at,
          };
        }
        grouped[doc.user_id].documents.push(doc);
        if (doc.status === "pending") grouped[doc.user_id].pendingCount++;
        if (doc.status === "approved") grouped[doc.user_id].approvedCount++;
        if (doc.status === "rejected") grouped[doc.user_id].rejectedCount++;
        if (doc.submitted_at > grouped[doc.user_id].latestSubmission) {
          grouped[doc.user_id].latestSubmission = doc.submitted_at;
        }
      });

      let requests = Object.values(grouped);

      // Filter by status
      if (statusFilter === "pending") {
        requests = requests.filter((r) => r.pendingCount > 0);
      } else if (statusFilter === "approved") {
        requests = requests.filter((r) => r.approvedCount === r.documents.length);
      } else if (statusFilter === "rejected") {
        requests = requests.filter((r) => r.rejectedCount > 0);
      }

      // Sort by latest submission
      requests.sort((a, b) => new Date(b.latestSubmission).getTime() - new Date(a.latestSubmission).getTime());

      return requests;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes, userId, documentType }: { id: string; status: string; notes?: string; userId: string; documentType?: string }) => {
      const { error } = await supabase
        .from("provider_verification_documents" as any)
        .update({
          status,
          notes: notes || null,
          reviewed_at: new Date().toISOString(),
        } as any)
        .eq("id", id);
      if (error) throw error;

      // Check if all documents are approved → auto-verify the cleaner
      if (status === "approved") {
        const { data: allDocs } = await supabase
          .from("provider_verification_documents" as any)
          .select("status")
          .eq("user_id", userId);

        const allApproved = (allDocs as any[] || []).every((d: any) => d.status === "approved");
        if (allApproved && (allDocs as any[]).length >= 4) {
          await supabase
            .from("cleaner_profiles")
            .update({ is_verified: true })
            .eq("user_id", userId);
        }
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-verification-docs"] });
      setRejectionReason("");
      setReviewDialog(null);
      toast.success("Document status updated");

      // Send email notification to the cleaner
      if (variables.status === "approved" || variables.status === "rejected") {
        supabase.functions.invoke("send-verification-status-email", {
          body: {
            user_id: variables.userId,
            document_type: variables.documentType,
            status: variables.status,
            notes: variables.notes || null,
          },
        }).catch((err) => console.error("Failed to send verification status email:", err));
      }
      // Refresh selected provider data
      if (selectedProvider) {
        setTimeout(() => {
          const updated = providerRequests.find((r) => r.user_id === selectedProvider.user_id);
          if (updated) setSelectedProvider(updated);
        }, 500);
      }
    },
    onError: (err: any) => {
      toast.error("Failed to update: " + err.message);
    },
  });

  const handleApprove = () => {
    if (!approveDialog) return;
    updateStatusMutation.mutate({ id: approveDialog.id, status: "approved", userId: approveDialog.user_id, documentType: approveDialog.document_type });
    setApproveDialog(null);
  };

  const handleReject = () => {
    if (!reviewDialog) return;
    if (!rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    updateStatusMutation.mutate({
      id: reviewDialog.id,
      status: "rejected",
      notes: rejectionReason,
      userId: reviewDialog.user_id,
      documentType: reviewDialog.document_type,
    });
  };

  const handleApproveAll = (provider: ProviderRequest) => {
    const pendingDocs = provider.documents.filter((d) => d.status === "pending");
    pendingDocs.forEach((doc) => {
      updateStatusMutation.mutate({ id: doc.id, status: "approved", userId: provider.user_id, documentType: doc.document_type });
    });
  };

  const filteredRequests = providerRequests.filter((r) =>
    r.provider_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.provider_email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = providerRequests.reduce((sum, r) => sum + r.pendingCount, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Approved</Badge>;
      case "pending":
        return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRequestStatusBadge = (req: ProviderRequest) => {
    if (req.is_verified) return <Badge className="bg-blue-600 text-white gap-1"><CheckCircle className="h-3 w-3" /> Verified</Badge>;
    if (req.rejectedCount > 0) return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Has Rejections</Badge>;
    if (req.pendingCount > 0) return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Pending Review</Badge>;
    if (req.approvedCount === req.documents.length) return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> All Approved</Badge>;
    return <Badge variant="outline">In Progress</Badge>;
  };

  // ─── DETAIL VIEW ───
  if (selectedProvider) {
    const provider = providerRequests.find((r) => r.user_id === selectedProvider.user_id) || selectedProvider;
    const hasPending = provider.documents.some((d: any) => d.status === "pending");

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedProvider(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="font-heading text-2xl font-bold text-foreground">
              {provider.provider_name}
            </h1>
            <p className="text-muted-foreground text-sm">{provider.provider_email}</p>
          </div>
          <div className="flex items-center gap-2">
            {getRequestStatusBadge(provider)}
            {hasPending && (
              <Button size="sm" onClick={() => setApproveAllDialog(provider)} disabled={updateStatusMutation.isPending}>
                <CheckCircle className="h-4 w-4 mr-1" /> Approve All Pending
              </Button>
            )}
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">{provider.documents.length}</p>
                <p className="text-xs text-muted-foreground">Total Documents</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{provider.approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{provider.pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-destructive">{provider.rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Cards */}
        {provider.documents.map((doc: any) => {
          const Icon = DOC_ICONS[doc.document_type] || FileText;
          return (
            <Card key={doc.id} className={doc.status === "pending" ? "border-amber-300/50" : "border-border"}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {DOCUMENT_TYPE_LABELS[doc.document_type] || doc.document_type}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Submitted {safeFormat(doc.submitted_at, "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                {doc.insurance_expiry_date && (
                  <div className="mb-3 text-sm">
                    <span className="text-muted-foreground">Insurance Expiry:</span>{" "}
                    <span className="font-medium text-foreground">
                      {safeFormat(doc.insurance_expiry_date, "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {doc.notes && doc.status === "rejected" && (
                  <div className="p-3 mb-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                    <strong>Rejection reason:</strong> {doc.notes}
                  </div>
                )}

                {doc.reviewed_at && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Reviewed on {safeFormat(doc.reviewed_at, "MMM d, yyyy")}
                  </p>
                )}

                <div className="flex items-center gap-2">
                  {doc.file_url && (
                    <Button variant="outline" size="sm" onClick={() => window.open(doc.file_url, "_blank")}>
                      <ExternalLink className="h-3 w-3 mr-1" /> View Document
                    </Button>
                  )}
                  {doc.status !== "approved" && (
                    <Button
                      size="sm"
                      onClick={() => setApproveDialog(doc)}
                      disabled={updateStatusMutation.isPending}
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Approve
                    </Button>
                  )}
                  {doc.status !== "rejected" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setReviewDialog(doc);
                        setRejectionReason("");
                      }}
                    >
                      <XCircle className="h-3 w-3 mr-1" /> Reject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Rejection Dialog */}
        <Dialog open={!!reviewDialog} onOpenChange={(open) => !open && setReviewDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reject Document</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  Document: <strong>{DOCUMENT_TYPE_LABELS[reviewDialog?.document_type] || reviewDialog?.document_type}</strong>
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rejection Reason *</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this document was rejected..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialog(null)}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Rejecting...</>
                ) : (
                  "Reject Document"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approval Confirmation Dialog */}
        <Dialog open={!!approveDialog} onOpenChange={(open) => !open && setApproveDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve Document</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to approve <strong>{DOCUMENT_TYPE_LABELS[approveDialog?.document_type] || approveDialog?.document_type}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveDialog(null)}>Cancel</Button>
              <Button
                onClick={handleApprove}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Approve Document</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Approve All Confirmation Dialog */}
        <Dialog open={!!approveAllDialog} onOpenChange={(open) => !open && setApproveAllDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Approve All Pending Documents</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to approve all <strong>{approveAllDialog?.pendingCount}</strong> pending documents for <strong>{approveAllDialog?.provider_name}</strong>?
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setApproveAllDialog(null)}>Cancel</Button>
              <Button
                onClick={() => {
                  if (approveAllDialog) {
                    handleApproveAll(approveAllDialog);
                    setApproveAllDialog(null);
                  }
                }}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Approving...</>
                ) : (
                  <><CheckCircle className="h-4 w-4 mr-1" /> Approve All</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ─── LIST VIEW (grouped by provider) ───
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Provider Verification</h1>
          <p className="text-muted-foreground">Review and approve provider verification requests.</p>
        </div>
        {totalPending > 0 && (
          <Badge variant="warning" className="text-sm px-3 py-1">
            {totalPending} Documents Pending
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by provider name or email..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Has Pending</SelectItem>
                <SelectItem value="approved">All Approved</SelectItem>
                <SelectItem value="rejected">Has Rejections</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Request Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No verification requests found.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <Card
              key={req.user_id}
              className="cursor-pointer hover:shadow-md transition-shadow border-border"
              onClick={() => setSelectedProvider(req)}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                      req.is_verified ? "bg-blue-100 dark:bg-blue-900/30" : req.pendingCount > 0 ? "bg-amber-100 dark:bg-amber-900/30" : "bg-muted"
                    }`}>
                      <Shield className={`h-6 w-6 ${
                        req.is_verified ? "text-blue-600 dark:text-blue-400" : req.pendingCount > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                      }`} />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{req.provider_name}</p>
                      <p className="text-sm text-muted-foreground">{req.provider_email}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last submitted {safeFormat(req.latestSubmission, "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-sm">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3.5 w-3.5" /> {req.approvedCount}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="h-3.5 w-3.5" /> {req.pendingCount}
                      </span>
                      {req.rejectedCount > 0 && (
                        <span className="flex items-center gap-1 text-destructive">
                          <XCircle className="h-3.5 w-3.5" /> {req.rejectedCount}
                        </span>
                      )}
                    </div>
                    {getRequestStatusBadge(req)}
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminVerificationDocuments;
