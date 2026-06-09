import { useEffect, useState } from "react";
import logoDefault from "@/assets/logo.jpeg";
import { format } from "date-fns";
import {
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Users,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  MessageSquare,
  Trash2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import EditJobDialog from "@/components/EditJobDialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Job {
  id: string;
  title: string;
  description: string;
  service_type: string;
  location: string;
  budget_min: number | null;
  budget_max: number | null;
  duration_hours: number | null;
  urgency: string;
  status: string;
  applications_count: number;
  created_at: string;
  preferred_date: string | null;
  preferred_time: string | null;
  image_url: string | null;
}

interface Application {
  id: string;
  applicant_id: string;
  cover_message: string | null;
  proposed_rate: number | null;
  status: string;
  created_at: string;
  applicant_name?: string;
  applicant_email?: string;
}

const MyJobs = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [applications, setApplications] = useState<Record<string, Application[]>>({});
  const [loadingApps, setLoadingApps] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);

  const fetchJobs = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  const fetchApplications = async (jobId: string) => {
    if (applications[jobId]) return;
    setLoadingApps(jobId);
    try {
      const { data, error } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", jobId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch applicant profiles
      const applicantIds = (data || []).map((a) => a.applicant_id);
      let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
      if (applicantIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", applicantIds);
        profiles?.forEach((p) => {
          profileMap[p.id] = { full_name: p.full_name, email: p.email };
        });
      }

      const enriched = (data || []).map((app) => ({
        ...app,
        applicant_name: profileMap[app.applicant_id]?.full_name || "Unknown",
        applicant_email: profileMap[app.applicant_id]?.email || "",
      }));

      setApplications((prev) => ({ ...prev, [jobId]: enriched }));
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setLoadingApps(null);
    }
  };

  const toggleJob = (jobId: string) => {
    if (expandedJob === jobId) {
      setExpandedJob(null);
    } else {
      setExpandedJob(jobId);
      fetchApplications(jobId);
    }
  };

  const updateApplicationStatus = async (appId: string, jobId: string, status: string) => {
    try {
      const { error } = await supabase
        .from("job_applications")
        .update({ status })
        .eq("id", appId);

      if (error) throw error;

      setApplications((prev) => ({
        ...prev,
        [jobId]: prev[jobId].map((a) => (a.id === appId ? { ...a, status } : a)),
      }));

      toast({ title: `Application ${status}`, description: `The application has been ${status}.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update application.", variant: "destructive" });
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
      toast({ title: "Job Deleted", description: "Your job posting has been removed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    }
  };

  const closeJob = async (jobId: string) => {
    try {
      const { error } = await supabase.from("jobs").update({ status: "closed" }).eq("id", jobId);
      if (error) throw error;
      setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: "closed" } : j)));
      toast({ title: "Job Closed", description: "Your job is no longer accepting applications." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to close job.", variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/20">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      case "filled":
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/20">Filled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAppStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="border-amber-300 text-amber-600 dark:border-amber-800/30 dark:text-amber-400">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/20">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "this_week":
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/20">This Week</Badge>;
      default:
        return <Badge variant="outline">Flexible</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            My Posted Jobs
          </h1>
          <p className="text-muted-foreground">
            Manage your job postings and review applications
          </p>
        </div>
        <Button asChild>
          <a href="/jobs">
            <Briefcase className="h-4 w-4 mr-2" />
            Post New Job
          </a>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter((j) => j.status === "open").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Applications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.reduce((sum, j) => sum + j.applications_count, 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Closed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobs.filter((j) => j.status === "closed").length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      {jobs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No jobs posted yet</h3>
            <p className="text-muted-foreground mb-4">
              Post a cleaning job to find skilled professionals
            </p>
            <Button asChild>
              <a href="/jobs">Post Your First Job</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 md:p-6 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => toggleJob(job.id)}
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden ring-2 ring-primary/10">
                    <img
                      src={job.image_url || logoDefault}
                      alt={job.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-semibold text-lg truncate">{job.title}</h3>
                    {getStatusBadge(job.status)}
                    {getUrgencyBadge(job.urgency)}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3.5 w-3.5" />
                      {job.service_type}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {job.location}
                    </span>
                    {(job.budget_min || job.budget_max) && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        ${job.budget_min || 0} – ${job.budget_max || 0}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {job.applications_count} applied
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(job.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {expandedJob === job.id ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>

              {expandedJob === job.id && (
                <div className="border-t border-border">
                  {/* Job Description */}
                  <div className="px-4 md:px-6 py-4 bg-muted/20">
                    <p className="text-sm text-muted-foreground">{job.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {job.status === "open" && (
                        <Button variant="outline" size="sm" onClick={() => closeJob(job.id)}>
                          <XCircle className="h-4 w-4 mr-1" />
                          Close Job
                        </Button>
                      )}
                      <Button variant="outline" size="sm" onClick={() => setEditJob(job)}>
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this job?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently remove the job posting and all associated applications.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteJob(job.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Applications */}
                  <div className="px-4 md:px-6 py-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Applications ({job.applications_count})
                    </h4>

                    {loadingApps === job.id ? (
                      <div className="space-y-3">
                        {[1, 2].map((i) => (
                          <Skeleton key={i} className="h-20" />
                        ))}
                      </div>
                    ) : (applications[job.id] || []).length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No applications yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {(applications[job.id] || []).map((app) => (
                          <div
                            key={app.id}
                            className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-lg border border-border bg-background"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                  {app.applicant_name?.charAt(0)?.toUpperCase() || "?"}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{app.applicant_name}</p>
                                  <p className="text-xs text-muted-foreground">{app.applicant_email}</p>
                                </div>
                                {getAppStatusBadge(app.status)}
                              </div>
                              {app.cover_message && (
                                <p className="text-sm text-muted-foreground mt-2 flex items-start gap-1">
                                  <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                  {app.cover_message}
                                </p>
                              )}
                              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                                {app.proposed_rate && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    ${app.proposed_rate}/hr
                                  </span>
                                )}
                                <span>{format(new Date(app.created_at), "MMM d, yyyy")}</span>
                              </div>
                            </div>

                            {app.status === "pending" && (
                              <div className="flex gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => updateApplicationStatus(app.id, job.id, "accepted")}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateApplicationStatus(app.id, job.id, "rejected")}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      <EditJobDialog
        job={editJob}
        open={!!editJob}
        onOpenChange={(open) => !open && setEditJob(null)}
        onSuccess={() => fetchJobs()}
      />
    </div>
  );
};

export default MyJobs;
