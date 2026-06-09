import { useState } from "react";
import { Zap, Eye, MousePointerClick, BookOpen, ToggleLeft, ToggleRight, Check, X, ChevronUp, ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useAdminSponsoredListings,
  useAdminUpdateSponsorship,
  useAdminApproveSponsorship,
  SponsoredListing,
} from "@/hooks/useSponsoredListings";
import { format } from "date-fns";

const statusConfig: Record<string, { label: string; className: string }> = {
  inactive: { label: "Inactive", className: "bg-muted text-muted-foreground" },
  requested: { label: "Requested", className: "bg-warning/20 text-warning border-warning/30" },
  active: { label: "Active", className: "bg-secondary/20 text-secondary border-secondary/30" },
  expired: { label: "Expired", className: "bg-muted text-muted-foreground" },
};

interface EditDialogProps {
  listing: SponsoredListing;
  open: boolean;
  onClose: () => void;
}

const EditSponsorshipDialog = ({ listing, open, onClose }: EditDialogProps) => {
  const updateMutation = useAdminUpdateSponsorship();
  const [isSponsored, setIsSponsored] = useState(listing.is_sponsored);
  const [priority, setPriority] = useState(String(listing.sponsored_priority));
  const [startDate, setStartDate] = useState(
    listing.sponsored_start ? listing.sponsored_start.slice(0, 16) : ""
  );
  const [endDate, setEndDate] = useState(
    listing.sponsored_end ? listing.sponsored_end.slice(0, 16) : ""
  );

  const handleSave = async () => {
    const newStatus = isSponsored ? "active" : "inactive";
    await updateMutation.mutateAsync({
      id: listing.id,
      updates: {
        is_sponsored: isSponsored,
        sponsored_priority: parseInt(priority) || 0,
        sponsored_start: startDate ? new Date(startDate).toISOString() : null,
        sponsored_end: endDate ? new Date(endDate).toISOString() : null,
        sponsored_status: newStatus as SponsoredListing["sponsored_status"],
      },
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Sponsorship — {listing.cleaner_profiles?.business_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Sponsored Active</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Toggle listing to appear in Sponsored Spotlight</p>
            </div>
            <Switch checked={isSponsored} onCheckedChange={setIsSponsored} />
          </div>

          <div>
            <Label htmlFor="priority" className="font-medium">Priority (higher = first)</Label>
            <Input
              id="priority"
              type="number"
              min={0}
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="startDate" className="font-medium">Sponsorship Start (optional)</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5"
            />
          </div>

          <div>
            <Label htmlFor="endDate" className="font-medium">Sponsorship End (optional)</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminSponsoredListings = () => {
  const { data: listings = [], isLoading } = useAdminSponsoredListings();
  const approveMutation = useAdminApproveSponsorship();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editListing, setEditListing] = useState<SponsoredListing | null>(null);

  const filtered = listings.filter((l) => {
    const matchName = l.cleaner_profiles?.business_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || l.sponsored_status === statusFilter;
    return matchName && matchStatus;
  });

  const totalViews = listings.reduce((s, l) => s + l.sponsored_views_count, 0);
  const totalQuotes = listings.reduce((s, l) => s + l.sponsored_quote_clicks, 0);
  const totalBooks = listings.reduce((s, l) => s + l.sponsored_book_clicks, 0);
  const activeCount = listings.filter((l) => l.sponsored_status === "active").length;
  const requestedCount = listings.filter((l) => l.sponsored_status === "requested").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-accent" />
          Sponsored Spotlight Management
        </h1>
        <p className="text-muted-foreground mt-1">Manage sponsored listings, approve requests, and track performance</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Listings", value: listings.length, icon: Zap },
          { label: "Active", value: activeCount, icon: ToggleRight },
          { label: "Pending Requests", value: requestedCount, icon: Calendar },
          { label: "Total Views", value: totalViews, icon: Eye },
          { label: "Total Clicks", value: totalQuotes + totalBooks, icon: MousePointerClick },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              placeholder="Search by business name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex gap-2 flex-wrap">
              {["all", "active", "requested", "inactive", "expired"].map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? "default" : "outline"}
                  onClick={() => setStatusFilter(s)}
                  className="capitalize"
                >
                  {s}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No sponsored listings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Business</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> Views
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" /> Quotes
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <MousePointerClick className="h-3.5 w-3.5" /> Books
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((listing) => {
                    const cp = listing.cleaner_profiles;
                    const cfg = statusConfig[listing.sponsored_status] ?? statusConfig.inactive;
                    return (
                      <TableRow key={listing.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-muted overflow-hidden shrink-0">
                              {cp?.profile_image ? (
                                <img src={cp.profile_image} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Zap className="h-4 w-4 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{cp?.business_name ?? "—"}</p>
                              <p className="text-xs text-muted-foreground">${cp?.hourly_rate}/hr</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={cfg.className}>
                            {cfg.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <ChevronUp className="h-3 w-3 text-muted-foreground" />
                            <span className="font-mono text-sm">{listing.sponsored_priority}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {listing.sponsored_start || listing.sponsored_end ? (
                            <div>
                              {listing.sponsored_start && (
                                <div>From: {format(new Date(listing.sponsored_start), "MMM d, yyyy")}</div>
                              )}
                              {listing.sponsored_end && (
                                <div>To: {format(new Date(listing.sponsored_end), "MMM d, yyyy")}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">No schedule</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center font-mono text-sm">{listing.sponsored_views_count}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{listing.sponsored_quote_clicks}</TableCell>
                        <TableCell className="text-center font-mono text-sm">{listing.sponsored_book_clicks}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {listing.sponsored_status === "requested" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-secondary border-secondary/30 hover:bg-secondary/10 gap-1"
                                  onClick={() => approveMutation.mutate({ id: listing.id, approve: true })}
                                  disabled={approveMutation.isPending}
                                >
                                  <Check className="h-3.5 w-3.5" /> Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-1"
                                  onClick={() => approveMutation.mutate({ id: listing.id, approve: false })}
                                  disabled={approveMutation.isPending}
                                >
                                  <X className="h-3.5 w-3.5" /> Reject
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditListing(listing)}
                            >
                              Edit
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {editListing && (
        <EditSponsorshipDialog
          listing={editListing}
          open={!!editListing}
          onClose={() => setEditListing(null)}
        />
      )}
    </div>
  );
};

export default AdminSponsoredListings;
