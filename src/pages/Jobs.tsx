import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase, MapPin, Clock, DollarSign, Calendar, Users, Plus,
  Search, Filter, Loader2, Send, ChevronDown, Sparkles, AlertCircle,
  ImagePlus, X, Pencil, Lock,
} from "lucide-react";
import EditJobDialog from "@/components/EditJobDialog";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import logoDefault from "@/assets/logo.jpeg";
import { useFinderAccess } from "@/hooks/useFinderAccess";

interface Job {
  id: string;
  user_id: string;
  title: string;
  description: string;
  service_type: string;
  location: string;
  budget_min: number | null;
  budget_max: number | null;
  duration_hours: number | null;
  preferred_date: string | null;
  preferred_time: string | null;
  urgency: string;
  status: string;
  applications_count: number;
  created_at: string;
  image_url: string | null;
  poster_name?: string;
}

const SERVICE_TYPES = [
  "Home Cleaning", "Office Cleaning", "Deep Cleaning", "Move-in/Move-out",
  "Carpet Cleaning", "Window Cleaning", "Post-Construction", "Eco-Friendly Cleaning", "Other",
];

const URGENCY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "bg-destructive/10 text-destructive border-destructive/20" },
  { value: "soon", label: "Within a Week", color: "bg-warning/10 text-warning border-warning/20" },
  { value: "flexible", label: "Flexible", color: "bg-secondary/10 text-secondary border-secondary/20" },
];

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { canPostJobs } = useFinderAccess();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [postDialogOpen, setPostDialogOpen] = useState(false);
  const [applyDialogOpen, setApplyDialogOpen] = useState<string | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [editJob, setEditJob] = useState<Job | null>(null);

  // Post job form state
  const [newJob, setNewJob] = useState({
    title: "", description: "", service_type: "Home Cleaning", location: "",
    budget_min: "", budget_max: "", duration_hours: "2",
    preferred_date: "", preferred_time: "", urgency: "flexible",
  });

  // Apply form state
  const [applyMessage, setApplyMessage] = useState("");
  const [applyRate, setApplyRate] = useState("");

  // Image upload state
  const [jobImage, setJobImage] = useState<File | null>(null);
  const [jobImagePreview, setJobImagePreview] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max image size is 5MB.", variant: "destructive" });
      return;
    }
    setJobImage(file);
    setJobImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setJobImage(null);
    setJobImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  // Fetch jobs
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobs", searchQuery, filterType],
    queryFn: async () => {
      let query = supabase
        .from("jobs")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (filterType !== "all") {
        query = query.eq("service_type", filterType);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch poster names
      const userIds = [...new Set((data || []).map((j) => j.user_id))];
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", userIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p.full_name]));
        return (data || []).map((j) => ({
          ...j,
          poster_name: profileMap.get(j.user_id) || "Anonymous",
        })) as Job[];
      }

      return (data || []) as Job[];
    },
  });

  // Check which jobs the current user already applied to
  const { data: myApplications = [] } = useQuery({
    queryKey: ["my-job-applications"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_applications")
        .select("job_id")
        .eq("applicant_id", user!.id);
      if (error) throw error;
      return (data || []).map((a) => a.job_id);
    },
  });

  const filteredJobs = jobs.filter((job) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(q) ||
      job.description.toLowerCase().includes(q) ||
      job.location.toLowerCase().includes(q)
    );
  });

  // Post job mutation
  const postJobMutation = useMutation({
    mutationFn: async () => {
      if (!newJob.title.trim() || !newJob.description.trim() || !newJob.location.trim()) {
        throw new Error("Please fill in title, description, and location");
      }

      let imageUrl: string | null = null;

      // Upload image if selected
      if (jobImage) {
        const fileExt = jobImage.name.split(".").pop();
        const filePath = `${user!.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("job-images")
          .upload(filePath, jobImage);
        if (uploadError) throw new Error("Failed to upload image");
        const { data: urlData } = supabase.storage
          .from("job-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from("jobs").insert({
        user_id: user!.id,
        title: newJob.title.trim(),
        description: newJob.description.trim(),
        service_type: newJob.service_type,
        location: newJob.location.trim(),
        budget_min: newJob.budget_min ? parseFloat(newJob.budget_min) : null,
        budget_max: newJob.budget_max ? parseFloat(newJob.budget_max) : null,
        duration_hours: parseInt(newJob.duration_hours) || 2,
        preferred_date: newJob.preferred_date || null,
        preferred_time: newJob.preferred_time || null,
        urgency: newJob.urgency,
        image_url: imageUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Job Posted!", description: "Your job is now live." });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setPostDialogOpen(false);
      clearImage();
      setNewJob({
        title: "", description: "", service_type: "Home Cleaning", location: "",
        budget_min: "", budget_max: "", duration_hours: "2",
        preferred_date: "", preferred_time: "", urgency: "flexible",
      });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const { error } = await supabase.from("job_applications").insert({
        job_id: jobId,
        applicant_id: user!.id,
        cover_message: applyMessage.trim() || null,
        proposed_rate: applyRate ? parseFloat(applyRate) : null,
      });
      if (error) throw error;

      // Send email notification to job poster (fire-and-forget)
      const applicantName = user?.user_metadata?.full_name || user?.email || "A cleaner";
      supabase.functions.invoke("send-job-application-notification", {
        body: {
          jobId,
          applicantName,
          coverMessage: applyMessage.trim() || null,
          proposedRate: applyRate ? parseFloat(applyRate) : null,
        },
      }).catch((err) => console.error("Failed to send application notification:", err));
    },
    onSuccess: () => {
      toast({ title: "Application Sent!", description: "The job poster will be notified." });
      queryClient.invalidateQueries({ queryKey: ["my-job-applications"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setApplyDialogOpen(null);
      setApplyMessage("");
      setApplyRate("");
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const getUrgencyBadge = (urgency: string) => {
    const opt = URGENCY_OPTIONS.find((o) => o.value === urgency) || URGENCY_OPTIONS[2];
    return <Badge variant="outline" className={`text-xs font-medium ${opt.color}`}>{opt.label}</Badge>;
  };

  const formatBudget = (min: number | null, max: number | null) => {
    if (min && max) return `$${min} – $${max}`;
    if (min) return `From $${min}`;
    if (max) return `Up to $${max}`;
    return "Open budget";
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return format(new Date(dateStr), "MMM d");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Banner */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5 border-b border-border/40">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              Find or Post Cleaning Jobs
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-foreground mb-4 tracking-tight">
              Cleaning Jobs <span className="text-primary">Board</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Post cleaning jobs and get matched with skilled professionals, or browse and apply to jobs near you.
            </p>

            {/* Search + Post */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by title, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
              {user ? (
                canPostJobs ? (
                <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="gap-2 shrink-0">
                      <Plus className="h-4 w-4" /> Post a Job
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" />
                        Post a Cleaning Job
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Job Title *</Label>
                        <Input
                          value={newJob.title}
                          onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                          placeholder="e.g. Deep Clean 3-Bedroom Apartment"
                          maxLength={100}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Description *</Label>
                        <Textarea
                          value={newJob.description}
                          onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                          placeholder="Describe the job requirements, special instructions..."
                          rows={4}
                          maxLength={1000}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Service Type</Label>
                          <Select value={newJob.service_type} onValueChange={(v) => setNewJob({ ...newJob, service_type: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Location *</Label>
                          <Input
                            value={newJob.location}
                            onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                            placeholder="City or area"
                            maxLength={100}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-2">
                          <Label>Min Budget ($)</Label>
                          <Input
                            type="number"
                            value={newJob.budget_min}
                            onChange={(e) => setNewJob({ ...newJob, budget_min: e.target.value })}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Max Budget ($)</Label>
                          <Input
                            type="number"
                            value={newJob.budget_max}
                            onChange={(e) => setNewJob({ ...newJob, budget_max: e.target.value })}
                            placeholder="0"
                            min="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Hours</Label>
                          <Input
                            type="number"
                            value={newJob.duration_hours}
                            onChange={(e) => setNewJob({ ...newJob, duration_hours: e.target.value })}
                            min="1" max="12"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Preferred Date</Label>
                          <Input
                            type="date"
                            value={newJob.preferred_date}
                            onChange={(e) => setNewJob({ ...newJob, preferred_date: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Urgency</Label>
                          <Select value={newJob.urgency} onValueChange={(v) => setNewJob({ ...newJob, urgency: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {URGENCY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      {/* Image Upload */}
                      <div className="space-y-2">
                        <Label>Photo (optional)</Label>
                        <input
                          ref={imageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        {jobImagePreview ? (
                          <div className="relative rounded-lg overflow-hidden border border-border">
                            <img src={jobImagePreview} alt="Preview" className="w-full h-40 object-cover" />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7"
                              onClick={clearImage}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => imageInputRef.current?.click()}
                            className="w-full h-28 rounded-lg border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-1.5 text-muted-foreground hover:text-foreground"
                          >
                            <ImagePlus className="h-6 w-6" />
                            <span className="text-xs">Click to add a photo</span>
                          </button>
                        )}
                      </div>
                      <Button
                        className="w-full"
                        size="lg"
                        onClick={() => postJobMutation.mutate()}
                        disabled={postJobMutation.isPending}
                      >
                        {postJobMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Post Job
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                ) : (
                  <Button size="lg" className="gap-2 shrink-0" onClick={() => navigate("/pricing")}>
                    <Lock className="h-4 w-4" /> Upgrade to Post Jobs
                  </Button>
                )
              ) : (
                <Button size="lg" className="gap-2 shrink-0" asChild>
                  <a href="/auth">
                    <Plus className="h-4 w-4" /> Sign in to Post
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-auto">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} found
          </span>
        </div>

        {/* Jobs List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No jobs found</h3>
              <p className="text-muted-foreground mt-1">Be the first to post a cleaning job!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => {
              const isExpanded = expandedJob === job.id;
              const isOwner = user?.id === job.user_id;
              const hasApplied = myApplications.includes(job.id);

              return (
                <Card
                  key={job.id}
                  className="group hover:shadow-lg transition-all duration-200 border-border/60 hover:border-primary/30 overflow-hidden"
                >
                  <CardContent className="p-0">
                    {/* Main row */}
                    <div
                      className="p-5 cursor-pointer"
                      onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Job Thumbnail */}
                        <div className="h-11 w-11 shrink-0 rounded-lg overflow-hidden ring-2 ring-primary/10">
                          <img
                            src={job.image_url || logoDefault}
                            alt={job.title}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                            <div>
                              <h3
                                className="font-semibold text-foreground text-base group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); navigate(`/jobs/${job.id}`); }}
                              >
                                {job.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-0.5">
                                Posted by {job.poster_name || "Anonymous"} · {timeAgo(job.created_at)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {getUrgencyBadge(job.urgency)}
                              <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </div>
                          </div>

                          {/* Meta chips */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <Briefcase className="h-3.5 w-3.5 text-primary/60" />
                              {job.service_type}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-primary/60" />
                              {job.location}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <DollarSign className="h-3.5 w-3.5 text-secondary/70" />
                              {formatBudget(job.budget_min, job.budget_max)}
                            </span>
                            {job.duration_hours && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-primary/60" />
                                {job.duration_hours}h
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5 text-primary/60" />
                              {job.applications_count} applied
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-0 animate-fade-in">
                        <Separator className="mb-4" />
                        <img
                          src={job.image_url || logoDefault}
                          alt={job.title}
                          className="w-full h-48 object-cover rounded-lg mb-4"
                        />
                        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap mb-4">
                          {job.description}
                        </p>

                        {job.preferred_date && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                            <Calendar className="h-4 w-4 text-primary/60" />
                            Preferred date: {format(new Date(job.preferred_date), "MMMM d, yyyy")}
                            {job.preferred_time && ` at ${job.preferred_time}`}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/jobs/${job.id}`)}>
                            View Details
                          </Button>
                          {!user ? (
                            <Button size="sm" asChild>
                              <a href="/auth">Sign in to Apply</a>
                            </Button>
                          ) : isOwner ? (
                            <>
                              <Button size="sm" variant="outline" className="gap-1.5" onClick={(e) => { e.stopPropagation(); setEditJob(job); }}>
                                <Pencil className="h-3.5 w-3.5" /> Edit
                              </Button>
                              <Badge variant="secondary" className="text-xs">Your Job</Badge>
                            </>
                          ) : hasApplied ? (
                            <Badge variant="outline" className="text-xs border-secondary/40 text-secondary">
                              ✓ Applied
                            </Badge>
                          ) : (
                            <Dialog open={applyDialogOpen === job.id} onOpenChange={(open) => setApplyDialogOpen(open ? job.id : null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" className="gap-1.5">
                                  <Send className="h-3.5 w-3.5" /> Apply Now
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Apply to: {job.title}</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-2">
                                  <div className="space-y-2">
                                    <Label>Message to job poster</Label>
                                    <Textarea
                                      value={applyMessage}
                                      onChange={(e) => setApplyMessage(e.target.value)}
                                      placeholder="Introduce yourself and explain why you're a great fit..."
                                      rows={4}
                                      maxLength={500}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Your Proposed Rate ($/hr, optional)</Label>
                                    <Input
                                      type="number"
                                      value={applyRate}
                                      onChange={(e) => setApplyRate(e.target.value)}
                                      placeholder="e.g. 40"
                                      min="0"
                                    />
                                  </div>
                                  <Button
                                    className="w-full"
                                    onClick={() => applyMutation.mutate(job.id)}
                                    disabled={applyMutation.isPending}
                                  >
                                    {applyMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <Send className="h-4 w-4 mr-2" />
                                    )}
                                    Submit Application
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
      <EditJobDialog
        job={editJob}
        open={!!editJob}
        onOpenChange={(open) => !open && setEditJob(null)}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["jobs"] })}
      />
    </div>
  );
};

export default Jobs;
