import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Briefcase, Eye, Trash2, XCircle, CheckCircle, Users, Clock, Pencil } from "lucide-react";
import EditJobDialog from "@/components/EditJobDialog";
import { format } from "date-fns";
import logoDefault from "@/assets/logo.jpeg";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string;
  service_type: string;
  status: string;
  urgency: string;
  budget_min: number | null;
  budget_max: number | null;
  duration_hours: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  applications_count: number;
  user_id: string;
  image_url: string | null;
  created_at: string;
  poster_name?: string;
  poster_email?: string;
}

interface JobApplication {
  id: string;
  applicant_id: string;
  status: string;
  cover_message: string | null;
  proposed_rate: number | null;
  created_at: string;
  applicant_name?: string;
  applicant_email?: string;
}

const AdminJobs = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteJob, setDeleteJob] = useState<Job | null>(null);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["admin-jobs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set((data || []).map((j) => j.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      return (data || []).map((j) => ({
        ...j,
        poster_name: profileMap.get(j.user_id)?.full_name || "Unknown",
        poster_email: profileMap.get(j.user_id)?.email || "",
      })) as Job[];
    },
  });

  const closeJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "closed" })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast({ title: "Job closed successfully" });
    },
  });

  const reopenJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "open" })
        .eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      toast({ title: "Job reopened successfully" });
    },
  });

  const deleteJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      // Delete applications first
      await supabase.from("job_applications").delete().eq("job_id", jobId);
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-jobs"] });
      setDeleteJob(null);
      toast({ title: "Job deleted successfully" });
    },
  });

  const handleViewJob = async (job: Job) => {
    setViewJob(job);
    setLoadingApps(true);
    try {
      const { data: apps } = await supabase
        .from("job_applications")
        .select("*")
        .eq("job_id", job.id)
        .order("created_at", { ascending: false });

      const applicantIds = [...new Set((apps || []).map((a) => a.applicant_id))];
      const { data: profiles } = applicantIds.length
        ? await supabase.from("profiles").select("id, full_name, email").in("id", applicantIds)
        : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

      const profileMap = new Map((profiles || []).map((p) => [p.id, p] as const));
      setApplications(
        (apps || []).map((a) => ({
          ...a,
          applicant_name: profileMap.get(a.applicant_id)?.full_name || "Unknown",
          applicant_email: profileMap.get(a.applicant_id)?.email || "",
        }))
      );
    } finally {
      setLoadingApps(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !search ||
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.location.toLowerCase().includes(search.toLowerCase()) ||
      job.poster_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openCount = jobs.filter((j) => j.status === "open").length;
  const closedCount = jobs.filter((j) => j.status === "closed").length;
  const totalApps = jobs.reduce((sum, j) => sum + j.applications_count, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-primary/10 text-primary border-primary/20">Open</Badge>;
      case "closed":
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case "urgent":
        return <Badge variant="destructive">Urgent</Badge>;
      case "soon":
        return <Badge className="bg-secondary/10 text-secondary-foreground border-secondary/20">Soon</Badge>;
      default:
        return <Badge variant="outline">Flexible</Badge>;
    }
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) return `$${min} - $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return "Not specified";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Job Management</h1>
        <p className="text-muted-foreground mt-1">Moderate and manage all posted jobs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{jobs.length}</p>
              <p className="text-xs text-muted-foreground">Total Jobs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{openCount}</p>
              <p className="text-xs text-muted-foreground">Open</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{closedCount}</p>
              <p className="text-xs text-muted-foreground">Closed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-secondary" />
            <div>
              <p className="text-2xl font-bold">{totalApps}</p>
              <p className="text-xs text-muted-foreground">Applications</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">All Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, location, or poster..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <p className="text-center py-8 text-muted-foreground">Loading jobs...</p>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No jobs found</p>
          ) : (
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Posted By</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Urgency</TableHead>
                    <TableHead>Apps</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredJobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="flex items-center gap-2">
                          <img src={job.image_url || logoDefault} alt={job.title} className="h-8 w-8 rounded object-cover shrink-0" />
                          <span className="truncate">{job.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{job.poster_name}</p>
                          <p className="text-xs text-muted-foreground">{job.poster_email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{job.location}</TableCell>
                      <TableCell>{formatBudget(job.budget_min, job.budget_max)}</TableCell>
                      <TableCell>{getStatusBadge(job.status)}</TableCell>
                      <TableCell>{getUrgencyBadge(job.urgency)}</TableCell>
                      <TableCell>{job.applications_count}</TableCell>
                      <TableCell>{format(new Date(job.created_at), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleViewJob(job)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditJob(job)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {job.status === "open" ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => closeJobMutation.mutate(job.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => reopenJobMutation.mutate(job.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteJob(job)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Job Dialog */}
      <Dialog open={!!viewJob} onOpenChange={(open) => !open && setViewJob(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewJob?.title}</DialogTitle>
          </DialogHeader>
          {viewJob && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Posted By</p>
                  <p className="font-medium">{viewJob.poster_name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{viewJob.location}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service Type</p>
                  <p className="font-medium">{viewJob.service_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Budget</p>
                  <p className="font-medium">{formatBudget(viewJob.budget_min, viewJob.budget_max)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Duration</p>
                  <p className="font-medium">{viewJob.duration_hours || 2} hours</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  {getStatusBadge(viewJob.status)}
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-sm bg-muted p-3 rounded-lg">{viewJob.description}</p>
              </div>

              {/* Applications */}
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-3">
                  <Users className="h-4 w-4" />
                  Applications ({applications.length})
                </h3>
                {loadingApps ? (
                  <p className="text-sm text-muted-foreground">Loading...</p>
                ) : applications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No applications yet</p>
                ) : (
                  <div className="space-y-3">
                    {applications.map((app) => (
                      <div key={app.id} className="border rounded-lg p-3 space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">{app.applicant_name}</p>
                            <p className="text-xs text-muted-foreground">{app.applicant_email}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {app.proposed_rate && (
                              <span className="text-sm font-medium">${app.proposed_rate}/hr</span>
                            )}
                            <Badge variant={app.status === "accepted" ? "default" : app.status === "rejected" ? "destructive" : "outline"}>
                              {app.status}
                            </Badge>
                          </div>
                        </div>
                        {app.cover_message && (
                          <p className="text-sm text-muted-foreground">{app.cover_message}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(app.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteJob} onOpenChange={(open) => !open && setDeleteJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteJob?.title}" and all its applications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteJob && deleteJobMutation.mutate(deleteJob.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditJobDialog
        job={editJob}
        open={!!editJob}
        onOpenChange={(open) => !open && setEditJob(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["admin-jobs"] })}
      />
    </div>
  );
};

export default AdminJobs;
