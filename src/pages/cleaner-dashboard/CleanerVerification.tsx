import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
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

const CleanerVerification = () => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [yearsExperience, setYearsExperience] = useState(0);
  const [documents, setDocuments] = useState<VerificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expiryDates, setExpiryDates] = useState<Record<string, string>>({});
  const [stagedFiles, setStagedFiles] = useState<Record<string, { file: File; name: string }>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [profileRes, docsRes] = await Promise.all([
        supabase
          .from("cleaner_profiles")
          .select("is_verified, years_experience")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("provider_verification_documents")
          .select("*")
          .eq("user_id", user.id),
      ]);

      if (profileRes.data) {
        setIsVerified(profileRes.data.is_verified);
        setYearsExperience(profileRes.data.years_experience || 0);
      }

      const docs = (docsRes.data as any) || [];
      setDocuments(docs);

      const expiries: Record<string, string> = {};
      docs.forEach((doc: VerificationDocument) => {
        if (doc.insurance_expiry_date) {
          expiries[doc.document_type] = doc.insurance_expiry_date;
        }
      });
      setExpiryDates(expiries);
    } catch (error) {
      console.error("Error fetching data:", error);
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
    setSubmitting(true);
    try {
      const staged = Object.entries(stagedFiles);
      for (const [docType, { file }] of staged) {
        await uploadSingleDoc(docType, file);
      }

      await supabase.functions.invoke("send-verification-email", {
        body: { user_id: user.id, document_type: "all", file_url: "batch-submission" },
      });

      toast.success("All documents submitted for verification!");
      setStagedFiles({});
      setShowForm(false);
      fetchData();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error("Failed to submit: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const validateAndConfirm = () => {
    const missingDocs = DOCUMENT_TYPES.filter((dt) => {
      const status = getDocStatus(dt.key);
      if (status === "rejected") return !stagedFiles[dt.key];
      return !stagedFiles[dt.key] && !hasExistingDoc(dt.key);
    });
    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.map((d) => d.label).join(", ")}`);
      return;
    }
    if (!expiryDates["insurance"] && !documents.find((d) => d.document_type === "insurance" && d.insurance_expiry_date)) {
      toast.error("Please enter the insurance expiry date");
      return;
    }
    setShowConfirmDialog(true);
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
            <Clock className="h-3 w-3" /> Pending
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
  const pendingCount = documents.filter((d) => d.status === "pending").length;
  const rejectedCount = documents.filter((d) => d.status === "rejected").length;
  const totalRequired = DOCUMENT_TYPES.length;
  const hasPendingSubmission = pendingCount > 0;
  const hasRejection = rejectedCount > 0;
  const progressPercent = (approvedCount / totalRequired) * 100;

  // ─── STATUS OVERVIEW (default view) ───
  if (!showForm) {
    return (
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/cleaner/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Verification</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Verification</h1>
          <p className="text-muted-foreground">View your verification status and submit documents.</p>
        </div>

        {/* Overall Status Card */}
        <Card className={isVerified ? "border-blue-500/50 bg-blue-50/50 dark:bg-blue-950/20" : "border-border"}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${isVerified ? "bg-blue-100 dark:bg-blue-900" : hasPendingSubmission ? "bg-amber-100 dark:bg-amber-900/30" : hasRejection ? "bg-destructive/10" : "bg-muted"}`}>
                {isVerified ? (
                  <Shield className="h-8 w-8 text-blue-600" />
                ) : hasPendingSubmission ? (
                  <Clock className="h-8 w-8 text-amber-600" />
                ) : hasRejection ? (
                  <XCircle className="h-8 w-8 text-destructive" />
                ) : (
                  <Shield className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">
                    {isVerified
                      ? "Verified Provider"
                      : hasPendingSubmission
                      ? "Under Review"
                      : hasRejection
                      ? "Action Required"
                      : "Not Verified"}
                  </h2>
                  {isVerified && (
                    <Badge className="bg-blue-600 text-white">
                      <CheckCircle className="h-3 w-3 mr-1" /> VERIFIED
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  {isVerified
                    ? "Your business is verified. Customers see a verified badge on your profile."
                    : hasPendingSubmission
                    ? "Your documents are being reviewed by our team."
                    : hasRejection
                    ? "Some documents were rejected. Please resubmit."
                    : "Submit your documents to get verified and earn customer trust."}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {!isVerified && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Verification Progress</span>
                  <span className="font-medium text-foreground">{approvedCount}/{totalRequired} approved</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Document Status List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Status</CardTitle>
            <CardDescription>Status of each required verification document.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {DOCUMENT_TYPES.map((dt) => {
              const status = getDocStatus(dt.key);
              const doc = documents.find((d) => d.document_type === dt.key);
              const Icon = dt.icon;

              return (
                <div key={dt.key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{dt.label}</p>
                      {doc?.submitted_at && status !== "not_submitted" && (
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                        </p>
                      )}
                      {doc?.notes && status === "rejected" && (
                        <p className="text-xs text-destructive mt-0.5">Reason: {doc.notes}</p>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(status)}
                </div>
              );
            })}

            {/* Read-only info items */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Years in Business</p>
                  <p className="text-xs text-muted-foreground">From your business profile</p>
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

            <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm text-foreground">Reviews</p>
                  <p className="text-xs text-muted-foreground">Visible on your public profile</p>
                </div>
              </div>
              <Badge variant="info" className="gap-1">
                <CheckCircle className="h-3 w-3" /> Available
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        {!isVerified && (
          <Button
            size="lg"
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            {hasPendingSubmission && !hasRejection
              ? "Update Submission"
              : hasRejection
              ? "Resubmit Documents"
              : "Submit for Verification"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>
    );
  }

  // ─── SUBMISSION FORM ───
  // For rejected docs, require a new file; for others, existing doc is fine
  const allDocsReady = DOCUMENT_TYPES.every((dt) => {
    const status = getDocStatus(dt.key);
    if (status === "rejected") return !!stagedFiles[dt.key];
    return stagedFiles[dt.key] || hasExistingDoc(dt.key);
  });

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to="/cleaner/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink className="cursor-pointer" onClick={() => { setShowForm(false); setStagedFiles({}); }}>
              Verification
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Submit Documents</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => { setShowForm(false); setStagedFiles({}); }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Submit Verification Documents</h1>
          <p className="text-muted-foreground">Upload all required documents below, then submit.</p>
        </div>
      </div>

      {/* All document upload fields in one card */}
      <Card>
        <CardHeader>
          <CardTitle>Required Documents</CardTitle>
          <CardDescription>
            Upload all {totalRequired} documents. Accepted formats: PDF, JPG, PNG, DOC. Max 10MB each.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {DOCUMENT_TYPES.map((docType) => {
            const status = getDocStatus(docType.key);
            const doc = documents.find((d) => d.document_type === docType.key);
            const staged = stagedFiles[docType.key];
            const Icon = docType.icon;

            return (
              <div key={docType.key} className={`p-4 rounded-lg border ${staged ? "border-primary/40 bg-primary/5" : status === "rejected" ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{docType.label}</p>
                      <p className="text-sm text-muted-foreground">{docType.description}</p>
                    </div>
                  </div>
                  {staged ? (
                    <Badge className="gap-1 bg-primary/15 text-primary border-0 shrink-0">
                      <File className="h-3 w-3" /> Ready
                    </Badge>
                  ) : (
                    getStatusBadge(status)
                  )}
                </div>

                {doc?.notes && status === "rejected" && (
                  <div className="p-3 mb-3 bg-destructive/10 rounded-lg text-sm text-destructive">
                    <strong>Rejection reason:</strong> {doc.notes}
                  </div>
                )}

                {docType.hasExpiry && (
                  <div className="mb-3 space-y-1.5">
                    <Label className="text-sm">Insurance Expiry Date *</Label>
                    <Input
                      type="date"
                      value={expiryDates[docType.key] || ""}
                      onChange={(e) =>
                        setExpiryDates((prev) => ({ ...prev, [docType.key]: e.target.value }))
                      }
                      disabled={submitting}
                      className="max-w-xs"
                    />
                  </div>
                )}

                {staged && (
                  <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm mb-3">
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
                    disabled={submitting}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {staged ? "Change File" : status === "not_submitted" ? "Choose File" : status === "rejected" ? "Re-upload" : status === "approved" ? "Replace File" : "Replace File"}
                  </Button>
                  {doc?.submitted_at && !staged && status !== "not_submitted" && (
                    <span className="text-xs text-muted-foreground">
                      Submitted {new Date(doc.submitted_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button variant="outline" onClick={() => { setShowForm(false); setStagedFiles({}); }}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          onClick={validateAndConfirm}
          disabled={submitting || !allDocsReady}
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

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Verification?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to submit your documents for admin review. Once submitted, your documents will be reviewed and you'll be notified of the outcome. This process may take a few business days.
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

export default CleanerVerification;
