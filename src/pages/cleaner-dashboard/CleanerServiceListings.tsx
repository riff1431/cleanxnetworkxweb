import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Pencil, Trash2, Eye, EyeOff, ShoppingBag, Loader2,
  ImagePlus, X, DollarSign, MapPin,
} from "lucide-react";
import logoDefault from "@/assets/logo.jpeg";

const SERVICE_CATEGORIES = [
  "Home Cleaning", "Office Cleaning", "Deep Cleaning", "Move-in/Move-out",
  "Carpet Cleaning", "Window Cleaning", "Post-Construction", "Eco-Friendly Cleaning", "Other",
];

const PRICE_TYPES = [
  { value: "fixed", label: "Fixed Price" },
  { value: "hourly", label: "Per Hour" },
  { value: "starting_at", label: "Starting At" },
];

interface ServiceForm {
  title: string;
  description: string;
  category: string;
  price_type: string;
  price: string;
  duration_hours: string;
  location: string;
  delivery_time: string;
  features: string;
}

const emptyForm: ServiceForm = {
  title: "", description: "", category: "Home Cleaning", price_type: "fixed",
  price: "50", duration_hours: "2", location: "", delivery_time: "Same day", features: "",
};

const CleanerServiceListings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const imageRef = useRef<HTMLInputElement>(null);

  // Fetch cleaner profile
  const { data: cleanerProfile } = useQuery({
    queryKey: ["my-cleaner-profile"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaner_profiles")
        .select("id")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch listings
  const { data: listings = [], isLoading } = useQuery({
    queryKey: ["my-service-listings", cleanerProfile?.id],
    enabled: !!cleanerProfile,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }
    setImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImage(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = (listing: any) => {
    setEditingId(listing.id);
    setForm({
      title: listing.title,
      description: listing.description,
      category: listing.category,
      price_type: listing.price_type,
      price: listing.price.toString(),
      duration_hours: (listing.duration_hours || 2).toString(),
      location: listing.location || "",
      delivery_time: listing.delivery_time || "Same day",
      features: (listing.features || []).join("\n"),
    });
    setImage(null);
    setImagePreview(listing.image_url);
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.description.trim()) {
        throw new Error("Title and description are required");
      }
      if (!cleanerProfile) throw new Error("Cleaner profile not found");

      setSaving(true);
      let imageUrl: string | null = imagePreview;

      if (image) {
        const ext = image.name.split(".").pop();
        const path = `${user!.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("job-images").upload(path, image);
        if (upErr) throw new Error("Image upload failed");
        const { data: urlData } = supabase.storage.from("job-images").getPublicUrl(path);
        imageUrl = urlData.publicUrl;
      }

      const featuresArr = form.features.split("\n").map((f) => f.trim()).filter(Boolean);

      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        price_type: form.price_type,
        price: parseFloat(form.price) || 50,
        duration_hours: parseFloat(form.duration_hours) || 2,
        location: form.location.trim() || null,
        delivery_time: form.delivery_time.trim() || "Same day",
        features: featuresArr,
        image_url: imageUrl,
      };

      if (editingId) {
        const { error } = await supabase.from("service_listings").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("service_listings").insert({
          ...payload,
          user_id: user!.id,
          cleaner_profile_id: cleanerProfile.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: editingId ? "Service Updated" : "Service Created" });
      queryClient.invalidateQueries({ queryKey: ["my-service-listings"] });
      setDialogOpen(false);
      setSaving(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSaving(false);
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from("service_listings")
        .update({ is_active: active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-service-listings"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("service_listings").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Service Deleted" });
      queryClient.invalidateQueries({ queryKey: ["my-service-listings"] });
      setDeleteId(null);
    },
  });

  const getPriceLabel = (type: string, price: number) => {
    switch (type) {
      case "hourly": return `$${price}/hr`;
      case "starting_at": return `From $${price}`;
      default: return `$${price}`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-48" /><Skeleton className="h-48" /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">My Services</h1>
          <p className="text-muted-foreground">Create and manage your service listings</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" /> Create Service
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{listings.length}</p>
              <p className="text-xs text-muted-foreground">Total Services</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{listings.filter((l) => l.is_active).length}</p>
              <p className="text-xs text-muted-foreground">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Eye className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{listings.reduce((s, l) => s + (l.views_count || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Total Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{listings.reduce((s, l) => s + (l.orders_count || 0), 0)}</p>
              <p className="text-xs text-muted-foreground">Total Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">No services yet</h3>
            <p className="text-muted-foreground mb-4">Create your first service listing to attract customers</p>
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4 mr-2" /> Create Your First Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-32 h-32 shrink-0">
                  <img
                    src={listing.image_url || logoDefault}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{listing.title}</h3>
                      <p className="text-xs text-muted-foreground">{listing.category}</p>
                    </div>
                    <Badge variant={listing.is_active ? "default" : "secondary"} className="shrink-0 text-[10px]">
                      {listing.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <p className="text-primary font-bold text-sm mt-1">
                    {getPriceLabel(listing.price_type, listing.price)}
                  </p>

                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Eye className="h-3 w-3" /> {listing.views_count}</span>
                    <span className="flex items-center gap-0.5"><ShoppingBag className="h-3 w-3" /> {listing.orders_count}</span>
                    {listing.location && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" /> {listing.location}</span>}
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    <Switch
                      checked={listing.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: listing.id, active: checked })}
                      className="scale-75"
                    />
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEdit(listing)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setDeleteId(listing.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service" : "Create Service"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Professional Deep Cleaning Package" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your service in detail..." rows={4} maxLength={2000} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Price Type</Label>
                <Select value={form.price_type} onValueChange={(v) => setForm({ ...form, price_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRICE_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>Price ($)</Label>
                <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} min="0" />
              </div>
              <div className="space-y-2">
                <Label>Duration (hrs)</Label>
                <Input type="number" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} min="0.5" step="0.5" />
              </div>
              <div className="space-y-2">
                <Label>Delivery</Label>
                <Input value={form.delivery_time} onChange={(e) => setForm({ ...form, delivery_time: e.target.value })} placeholder="Same day" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="City or area" />
            </div>
            <div className="space-y-2">
              <Label>Features (one per line)</Label>
              <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} placeholder={"Kitchen deep clean\nBathroom sanitization\nFloor mopping & vacuuming"} rows={4} />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <input ref={imageRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              {imagePreview ? (
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
                  <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={() => { setImage(null); setImagePreview(null); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imageRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-colors"
                >
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Add cover image</span>
                </button>
              )}
            </div>

            <Button className="w-full" size="lg" onClick={() => saveMutation.mutate()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editingId ? "Save Changes" : "Create Service"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Service</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove this service listing.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CleanerServiceListings;
