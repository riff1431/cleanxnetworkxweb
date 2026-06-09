import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Users,
  Scale,
  Loader2,
  AlertCircle,
  Star,
  Briefcase,
  Send,
  File,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VerificationDocument {
  id: string;
  document_type: string;
  file_url: string | null;
  insurance_expiry_date: string | null;
  status: string;
  submitted_at: string;
  notes: string | null;
}

interface VerificationTabProps {
  isVerified: boolean;
  yearsExperience: number;
}

const DOCUMENT_TYPES = [
  {
    key: "insurance",
    label: "Company Insurance",
    description: "Upload your valid company insurance certificate with expiry date.",
    icon: Shield,
    hasExpiry: true,
  },
  {
    key: "employee_list",
    label: "Employee Names",
    description: "Upload a document listing all employees in your company.",
    icon: Users,
    hasExpiry: false,
  },
  {
    key: "criminal_check",
    label: "Criminal Background Checks",
    description: "Upload confirmation that criminal background checks have been completed.",
    icon: FileText,
    hasExpiry: false,
  },
  {
    key: "articles_of_incorporation",
    label: "Articles of Incorporation",
    description: "Upload your articles of incorporation or business registration.",
    icon: Scale,
    hasExpiry: false,
  },
];

const VerificationTab = ({ isVerified, yearsExperience }: VerificationTabProps) => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  // Local staged files not yet saved to DB
  const [stagedFiles, setStagedFiles] = useState<Record<string, { file: File; name: string }>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!user) return;
    fetchDocuments();
  }, [user]);

  const fetchDocuments = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("provider_verification_documents" as any)
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;
      setDocuments((data as any) || []);

      const expiries: Record<string, string> = {};
      ((data as any) || []).forEach((doc: VerificationDocument) => {
        if (doc.insurance_expiry_date) {
          expiries[doc.document_type] = doc.insurance_expiry_date;
        }
      });
      setExpiryDates(expiries);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDocStatus = (type: string) => {
    const doc = documents.find((d) => d.document_type === type);
    return doc ? doc.status : "not_submitted";
  };

  const hasExistingDoc = (type: string) => {
    return documents.some((d) => d.document_type === type && d.file_url);
  };

  const handleStageFile = (docType: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }
    setStagedFiles((prev) => ({ ...prev, [docType]: { file, name: file.name } }));
    toast.success(`${file.name} ready to submit`);
  };

  // Upload a single file to storage and save/update the DB record as draft
  const uploadSingleDoc = async (documentType: string, file: File): Promise<boolean> => {
    if (!user) return false;
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/${documentType}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-documents")
      .upload(filePath, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: signedData } = await supabase.storage
      .from("verification-documents")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    const fileUrl = signedData?.signedUrl || filePath;
    const existing = documents.find((d) => d.document_type === documentType);

    if (existing) {
      const { error } = await supabase
        .from("provider_verification_documents" as any)
        .update({
          file_url: fileUrl,
          status: "pending",
          submitted_at: new Date().toISOString(),
          insurance_expiry_date: documentType === "insurance" ? expiryDates[documentType] || null : null,
        } as any)
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("provider_verification_documents" as any)
        .insert({
          user_id: user.id,
          document_type: documentType,
          file_url: fileUrl,
          status: "pending",
          insurance_expiry_date: documentType === "insurance" ? expiryDates[documentType] || null : null,
        } as any);
      if (error) throw error;
    }

    return true;
  };

  const handleSubmitAll = async () => {
    if (!user) return;

    // Check that all documents have either a staged file or an existing upload
    const missingDocs = DOCUMENT_TYPES.filter(
      (dt) => !stagedFiles[dt.key] && !hasExistingDoc(dt.key)
    );

    if (missingDocs.length > 0) {
      toast.error(
        `Please upload: ${missingDocs.map((d) => d.label).join(", ")}`
      );
      return;
    }

    // Validate insurance expiry
    if (!expiryDates["insurance"] && !documents.find((d) => d.document_type === "insurance" && d.insurance_expiry_date)) {
      toast.error("Please enter the insurance expiry date");
      return;
    }

    setSubmitting(true);
    try {
      // Upload all staged files
      const staged = Object.entries(stagedFiles);
      for (const [docType, { file }] of staged) {
        await uploadSingleDoc(docType, file);
      }

      // For existing docs that weren't re-uploaded but need status reset (e.g. after rejection)
      for (const doc of documents) {
        if (doc.status === "rejected" && !stagedFiles[doc.document_type]) {
          // Keep as-is — they need to re-upload rejected docs
        }
      }

      // Notify admin
      await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, document_type: "all", file_url: "batch-submission" },
      });

      toast.success("All documents submitted for verification!");
      setStagedFiles({});
      fetchDocuments();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Failed to submit: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return (
          <Badge variant="success" className="gap-1">
            <CheckCircle className="h-3 w-3" /> Approved
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="warning" className="gap-1">
            <Clock className="h-3 w-3" /> Pending Review
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" /> Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" /> Not Submitted
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const totalRequired = DOCUMENT_TYPES.length;
  const allApproved = approvedCount === totalRequired;
  const hasPendingSubmission = documents.some((d) => d.status === "pending");
  const hasRejection = documents.some((d) => d.status === "rejected");

  // Determine if the form is ready to submit
  const allDocsReady = DOCUMENT_TYPES.every(
    (dt) => stagedFiles[dt.key] || hasExistingDoc(dt.key)
  );

  return (
    <div className="space-y-6">
      {/* Verification Status Header */}
      <Card className={isVerified ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20" : "border-border"}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-full flex items-center justify-center ${isVerified ? "bg-blue-100 dark:bg-blue-900" : "bg-muted"}`}>
              <Shield className={`h-7 w-7 ${isVerified ? "text-blue-600" : "text-muted-foreground"}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {isVerified
                    ? "Verified Provider ✓"
                    : hasPendingSubmission
                    ? "Under Review"
                    : hasRejection
                    ? "Action Required"
                    : "Get Verified"}
                </h2>
                {isVerified && (
                  <Badge className="bg-blue-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" /> VERIFIED
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground text-sm mt-1">
                {isVerified
                  ? "Your business has been verified. Customers will see a verified badge on your profile."
                  : hasPendingSubmission
                  ? `Your verification submission is under review. ${approvedCount}/${totalRequired} documents approved so far.`
                  : hasRejection
                  ? "Some documents were rejected. Please re-upload and resubmit."
                  : `Upload all ${totalRequired} required documents below, then submit for verification.`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Document Upload Cards */}
      {DOCUMENT_TYPES.map((docType) => {
        const status = getDocStatus(docType.key);
        const doc = documents.find((d) => d.document_type === docType.key);
        const staged = stagedFiles[docType.key];
        const Icon = docType.icon;

        return (
          <Card key={docType.key} className={`border-border ${staged ? "ring-2 ring-primary/30" : ""}`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{docType.label}</CardTitle>
                    <CardDescription>{docType.description}</CardDescription>
                  </div>
                </div>
                {staged ? (
                  <Badge className="gap-1 bg-primary/15 text-primary border-0">
                    <File className="h-3 w-3" /> Ready
                  </Badge>
                ) : (
                  getStatusBadge(status)
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {docType.hasExpiry && (
                <div className="space-y-2">
                  <Label>Insurance Expiry Date</Label>
                  <Input
                    type="date"
                    value={expiryDates[docType.key] || ""}
                    onChange={(e) =>
                      setExpiryDates((prev) => ({ ...prev, [docType.key]: e.target.value }))
                    }
                    disabled={status === "approved"}
                  />
                </div>
              )}

              {doc?.notes && status === "rejected" && (
                <div className="p-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                  <strong>Rejection reason:</strong> {doc.notes}
                </div>
              )}

              {staged && (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm">
                  <File className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate text-foreground">{staged.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setStagedFiles((prev) => {
                        const next = { ...prev };
                        delete next[docType.key];
                        return next;
                      })
                    }
                  >
                    Remove
                  </Button>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  className="hidden"
                  ref={(el) => { fileInputRefs.current[docType.key] = el; }}
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleStageFile(docType.key, file);
                    e.target.value = "";
                  }}
                />
                <Button
                  variant={status === "approved" && !staged ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => fileInputRefs.current[docType.key]?.click()}
                  disabled={submitting || status === "approved"}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {staged
                    ? "Change File"
                    : status === "not_submitted"
                    ? "Choose File"
                    : status === "rejected"
                    ? "Re-upload"
                    : status === "approved"
                    ? "Approved"
                    : "Replace File"}
                </Button>
                {doc?.submitted_at && !staged && (
                  <span className="text-xs text-muted-foreground">
                    Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Submit All Button */}
      {!allApproved && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-foreground">
                  {hasPendingSubmission ? "Submission Under Review" : "Ready to Submit?"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {hasPendingSubmission && Object.keys(stagedFiles).length === 0
                    ? "Your documents are being reviewed by our team. We'll notify you once complete."
                    : `${
                        DOCUMENT_TYPES.filter(
                          (dt) => stagedFiles[dt.key] || hasExistingDoc(dt.key)
                        ).length
                      }/${totalRequired} documents ready. Upload all required documents to submit.`}
                </p>
              </div>
              <Button
                size="lg"
                onClick={() => {
                  // Run validations before showing dialog
                  const missingDocs = DOCUMENT_TYPES.filter(
                    (dt) => !stagedFiles[dt.key] && !hasExistingDoc(dt.key)
                  );
                  if (missingDocs.length > 0) {
                    toast.error(`Please upload: ${missingDocs.map((d) => d.label).join(", ")}`);
                    return;
                  }
                  if (!expiryDates["insurance"] && !documents.find((d) => d.document_type === "insurance" && d.insurance_expiry_date)) {
                    toast.error("Please enter the insurance expiry date");
                    return;
                  }
                  setShowConfirmDialog(true);
                }}
                disabled={submitting || !allDocsReady || (hasPendingSubmission && Object.keys(stagedFiles).length === 0)}
                className="shrink-0"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Submit for Verification
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Read-only Info Cards */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Years in Business</CardTitle>
                <CardDescription>Captured from your business profile.</CardDescription>
              </div>
            </div>
            {yearsExperience > 0 ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3 w-3" /> {yearsExperience} years
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1">
                <AlertCircle className="h-3 w-3" /> Not set
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Star className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Reviews</CardTitle>
                <CardDescription>Customer reviews are publicly visible on your profile.</CardDescription>
              </div>
            </div>
            <Badge variant="info" className="gap-1">
              <CheckCircle className="h-3 w-3" /> Available
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit {Object.keys(stagedFiles).length > 0 ? Object.keys(stagedFiles).length : totalRequired} document{Object.keys(stagedFiles).length === 1 ? "" : "s"} for admin review. Once submitted, your documents will be reviewed and you'll be notified of the outcome. This process may take a few business days.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitAll}>
              <Send className="h-4 w-4 mr-2" /> Confirm & Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VerificationTab;
