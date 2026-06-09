import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import logoDefault from "@/assets/logo.jpeg";

const SERVICE_TYPES = [
  "Home Cleaning", "Office Cleaning", "Deep Cleaning", "Move-in/Move-out",
  "Carpet Cleaning", "Window Cleaning", "Post-Construction", "Eco-Friendly Cleaning", "Other",
];

const URGENCY_OPTIONS = [
  { value: "urgent", label: "Urgent" },
  { value: "soon", label: "Within a Week" },
  { value: "flexible", label: "Flexible" },
];

interface EditJobDialogProps {
  job: {
    id: string;
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
    image_url: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditJobDialog = ({ job, open, onOpenChange, onSuccess }: EditJobDialogProps) => {
  const [form, setForm] = useState({
    title: "", description: "", service_type: "Home Cleaning", location: "",
    budget_min: "", budget_max: "", duration_hours: "2",
    preferred_date: "", preferred_time: "", urgency: "flexible",
  });
  const [saving, setSaving] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (job && open) {
      setForm({
        title: job.title,
        description: job.description,
        service_type: job.service_type,
        location: job.location,
        budget_min: job.budget_min?.toString() || "",
        budget_max: job.budget_max?.toString() || "",
        duration_hours: (job.duration_hours || 2).toString(),
        preferred_date: job.preferred_date || "",
        preferred_time: job.preferred_time || "",
        urgency: job.urgency,
      });
      setImagePreview(job.image_url);
      setNewImage(null);
      setRemoveImage(false);
    }
  }, [job, open]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max image size is 5MB.", variant: "destructive" });
      return;
    }
    setNewImage(file);
    setImagePreview(URL.createObjectURL(file));
    setRemoveImage(false);
  };

  const clearImage = () => {
    setNewImage(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!job) return;
    if (!form.title.trim() || !form.description.trim() || !form.location.trim()) {
      toast({ title: "Missing fields", description: "Title, description, and location are required.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      let imageUrl: string | null | undefined = undefined;

      // Upload new image
      if (newImage) {
        const { data: { user } } = await supabase.auth.getUser();
        const fileExt = newImage.name.split(".").pop();
        const filePath = `${user?.id || "admin"}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("job-images")
          .upload(filePath, newImage);
        if (uploadError) throw new Error("Failed to upload image");
        const { data: urlData } = supabase.storage
          .from("job-images")
          .getPublicUrl(filePath);
        imageUrl = urlData.publicUrl;
      } else if (removeImage) {
        imageUrl = null;
      }

      const updateData: Record<string, unknown> = {
        title: form.title.trim(),
        description: form.description.trim(),
        service_type: form.service_type,
        location: form.location.trim(),
        budget_min: form.budget_min ? parseFloat(form.budget_min) : null,
        budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
        duration_hours: parseInt(form.duration_hours) || 2,
        preferred_date: form.preferred_date || null,
        preferred_time: form.preferred_time || null,
        urgency: form.urgency,
      };

      if (imageUrl !== undefined) {
        updateData.image_url = imageUrl;
      }

      const { error } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", job.id);
      if (error) throw error;

      toast({ title: "Job Updated", description: "Your changes have been saved." });
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>Job Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              maxLength={1000}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={form.service_type} onValueChange={(v) => setForm({ ...form, service_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Location *</Label>
              <Input
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                maxLength={100}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Min Budget ($)</Label>
              <Input
                type="number"
                value={form.budget_min}
                onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Max Budget ($)</Label>
              <Input
                type="number"
                value={form.budget_max}
                onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Hours</Label>
              <Input
                type="number"
                value={form.duration_hours}
                onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
                min="1" max="12"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Preferred Date</Label>
              <Input
                type="date"
                value={form.preferred_date}
                onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Urgency</Label>
              <Select value={form.urgency} onValueChange={(v) => setForm({ ...form, urgency: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {URGENCY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Image */}
          <div className="space-y-2">
            <Label>Photo</Label>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
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
                className="w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/40 hover:bg-muted/30 transition-colors"
              >
                <ImagePlus className="h-6 w-6" />
                <span className="text-xs">Click to add a photo</span>
              </button>
            )}
          </div>

          <Button className="w-full" size="lg" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditJobDialog;
