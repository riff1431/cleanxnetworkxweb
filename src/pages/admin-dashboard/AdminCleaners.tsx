import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Search, 
  Briefcase, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  MapPin, 
  DollarSign,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Zap,
  Plus,
  Download
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { EditCleanerDialog } from "@/components/admin-dashboard/EditCleanerDialog";
import { DeleteCleanerDialog } from "@/components/admin-dashboard/DeleteCleanerDialog";
import { ViewCleanerDialog } from "@/components/admin-dashboard/ViewCleanerDialog";
import { CreateCleanerDialog } from "@/components/admin-dashboard/CreateCleanerDialog";

interface CleanerProfile {
  id: string;
  user_id: string;
  business_name: string;
  hourly_rate: number;
  bio: string | null;
  years_experience: number | null;
  is_verified: boolean;
  is_active: boolean;
  instant_booking: boolean;
  services: string[];
  service_areas: string[];
  created_at: string;
  response_time: string | null;
}

type StatusFilter = "all" | "verified" | "unverified" | "active" | "inactive";
const PAGE_SIZE_OPTIONS = [10, 25, 50];

const AdminCleaners = () => {
  const [cleaners, setCleaners] = useState<CleanerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Dialog states
  const [selectedCleaner, setSelectedCleaner] = useState<CleanerProfile | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Loading states for inline actions
  const [updatingCleaners, setUpdatingCleaners] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchCleaners();
  }, [currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const fetchCleaners = async () => {
    setLoading(true);
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from("cleaner_profiles")
        .select("*", { count: "exact", head: true });

      if (countError) throw countError;
      setTotalCount(count || 0);

      // Fetch paginated data
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      const { data, error } = await supabase
        .from("cleaner_profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      setCleaners(data || []);
    } catch (error) {
      console.error("Error fetching cleaners:", error);
      toast.error("Failed to fetch cleaners");
    } finally {
      setLoading(false);
    }
  };

  const filteredCleaners = cleaners.filter((cleaner) => {
    const matchesSearch = cleaner.business_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesStatus = true;
    switch (statusFilter) {
      case "verified":
        matchesStatus = cleaner.is_verified;
        break;
      case "unverified":
        matchesStatus = !cleaner.is_verified;
        break;
      case "active":
        matchesStatus = cleaner.is_active;
        break;
      case "inactive":
        matchesStatus = !cleaner.is_active;
        break;
    }
    
    return matchesSearch && matchesStatus;
  });

  const handleToggleVerification = async (cleaner: CleanerProfile) => {
    setUpdatingCleaners((prev) => new Set(prev).add(cleaner.id));
    try {
      const { error } = await supabase
        .from("cleaner_profiles")
        .update({ is_verified: !cleaner.is_verified })
        .eq("id", cleaner.id);

      if (error) throw error;

      setCleaners((prev) =>
        prev.map((c) =>
          c.id === cleaner.id ? { ...c, is_verified: !cleaner.is_verified } : c
        )
      );
      toast.success(`Cleaner ${!cleaner.is_verified ? "verified" : "unverified"} successfully`);
    } catch (error) {
      console.error("Error updating cleaner:", error);
      toast.error("Failed to update cleaner status");
    } finally {
      setUpdatingCleaners((prev) => {
        const next = new Set(prev);
        next.delete(cleaner.id);
        return next;
      });
    }
  };

  const handleToggleActive = async (cleaner: CleanerProfile) => {
    setUpdatingCleaners((prev) => new Set(prev).add(cleaner.id));
    try {
      const { error } = await supabase
        .from("cleaner_profiles")
        .update({ is_active: !cleaner.is_active })
        .eq("id", cleaner.id);

      if (error) throw error;

      setCleaners((prev) =>
        prev.map((c) =>
          c.id === cleaner.id ? { ...c, is_active: !cleaner.is_active } : c
        )
      );
      toast.success(`Cleaner ${!cleaner.is_active ? "activated" : "deactivated"} successfully`);
    } catch (error) {
      console.error("Error updating cleaner:", error);
      toast.error("Failed to update cleaner status");
    } finally {
      setUpdatingCleaners((prev) => {
        const next = new Set(prev);
        next.delete(cleaner.id);
        return next;
      });
    }
  };

  const handleViewCleaner = (cleaner: CleanerProfile) => {
    setSelectedCleaner(cleaner);
    setIsViewDialogOpen(true);
  };

  const handleEditCleaner = (cleaner: CleanerProfile) => {
    setSelectedCleaner(cleaner);
    setIsEditDialogOpen(true);
  };

  const handleDeleteCleaner = (cleaner: CleanerProfile) => {
    setSelectedCleaner(cleaner);
    setIsDeleteDialogOpen(true);
  };

  const handleCleanerUpdated = (updatedCleaner: CleanerProfile) => {
    setCleaners((prev) =>
      prev.map((c) => (c.id === updatedCleaner.id ? updatedCleaner : c))
    );
  };

  const handleCleanerDeleted = (cleanerId: string) => {
    setCleaners((prev) => prev.filter((c) => c.id !== cleanerId));
    setTotalCount((prev) => prev - 1);
  };

  const handleCleanerCreated = (newCleaner: CleanerProfile) => {
    setCleaners((prev) => [newCleaner, ...prev]);
    setTotalCount((prev) => prev + 1);
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Fetch all cleaners for export (not just current page)
      const { data: allCleaners, error } = await supabase
        .from("cleaner_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!allCleaners || allCleaners.length === 0) {
        toast.error("No cleaner data to export");
        return;
      }

      // Define CSV headers
      const headers = [
        "ID",
        "Business Name",
        "Hourly Rate",
        "Years Experience",
        "Services",
        "Service Areas",
        "Verified",
        "Active",
        "Instant Booking",
        "Response Time",
        "Created At",
      ];

      // Convert data to CSV rows
      const rows = allCleaners.map((cleaner) => [
        cleaner.id,
        `"${(cleaner.business_name || "").replace(/"/g, '""')}"`,
        cleaner.hourly_rate,
        cleaner.years_experience || "",
        `"${(cleaner.services || []).join(", ").replace(/"/g, '""')}"`,
        `"${(cleaner.service_areas || []).join(", ").replace(/"/g, '""')}"`,
        cleaner.is_verified ? "Yes" : "No",
        cleaner.is_active ? "Yes" : "No",
        cleaner.instant_booking ? "Yes" : "No",
        cleaner.response_time || "",
        format(new Date(cleaner.created_at), "yyyy-MM-dd HH:mm:ss"),
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map((row) => row.join(",")),
      ].join("\n");

      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `cleaners-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${allCleaners.length} cleaners to CSV`);
    } catch (error) {
      console.error("Error exporting cleaners:", error);
      toast.error("Failed to export cleaner data");
    } finally {
      setIsExporting(false);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(Number(newSize));
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const verifiedCount = cleaners.filter((c) => c.is_verified).length;
  const activeCount = cleaners.filter((c) => c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Cleaner Management</h2>
          <p className="text-muted-foreground">View and manage service providers on the platform.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={isExporting || totalCount === 0}>
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Cleaner
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cleaners</p>
                <p className="text-2xl font-bold">{totalCount}</p>
              </div>
              <Briefcase className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Verified</p>
                <p className="text-2xl font-bold">{verifiedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{activeCount}</p>
              </div>
              <Zap className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>All Cleaners</CardTitle>
              <CardDescription>
                Manage cleaner profiles, verification, and status
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cleaners..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="All status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="unverified">Unverified</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCleaners.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No cleaners found.</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCleaners.map((cleaner) => (
                      <TableRow key={cleaner.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Briefcase className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{cleaner.business_name}</p>
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {cleaner.service_areas.slice(0, 2).join(", ") || "No areas"}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">${cleaner.hourly_rate}/hr</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {cleaner.services.slice(0, 2).map((service) => (
                              <Badge key={service} variant="outline" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                            {cleaner.services.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{cleaner.services.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant={cleaner.is_verified ? "default" : "secondary"} className="w-fit">
                              {cleaner.is_verified ? (
                                <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
                              ) : (
                                <><XCircle className="h-3 w-3 mr-1" /> Unverified</>
                              )}
                            </Badge>
                            <Badge variant={cleaner.is_active ? "outline" : "destructive"} className="w-fit">
                              {cleaner.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(cleaner.created_at), "MMM d, yyyy")}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={updatingCleaners.has(cleaner.id)}>
                                {updatingCleaners.has(cleaner.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewCleaner(cleaner)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditCleaner(cleaner)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleToggleVerification(cleaner)}>
                                {cleaner.is_verified ? (
                                  <><XCircle className="h-4 w-4 mr-2" /> Unverify</>
                                ) : (
                                  <><CheckCircle className="h-4 w-4 mr-2" /> Verify</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(cleaner)}>
                                {cleaner.is_active ? (
                                  <><XCircle className="h-4 w-4 mr-2" /> Deactivate</>
                                ) : (
                                  <><CheckCircle className="h-4 w-4 mr-2" /> Activate</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteCleaner(cleaner)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Profile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * pageSize + 1} to{" "}
                    {Math.min(currentPage * pageSize, totalCount)} of {totalCount} cleaners
                  </p>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {getPageNumbers().map((page, index) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <span className="px-3 py-2">...</span>
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => setCurrentPage(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      )}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <ViewCleanerDialog
        cleaner={selectedCleaner}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />
      <EditCleanerDialog
        cleaner={selectedCleaner}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onCleanerUpdated={handleCleanerUpdated}
      />
      <DeleteCleanerDialog
        cleaner={selectedCleaner}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onCleanerDeleted={handleCleanerDeleted}
      />
      <CreateCleanerDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCleanerCreated={handleCleanerCreated}
      />
    </div>
  );
};

export default AdminCleaners;
