import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Save, 
  Plus,
  X,
  Loader2,
  Camera,
  Shield,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import ImageCropDialog from "@/components/ImageCropDialog";

const SERVICE_OPTIONS = [
  "Home Cleaning",
  "Deep Cleaning",
  "Office Cleaning",
  "Commercial",
  "Airbnb/Rental",
  "Move In/Out",
  "Post-Construction",
  "Eco-Friendly",
  "Window Cleaning",
  "Carpet Cleaning",
];

interface CleanerProfile {
  id: string;
  user_id: string;
  business_name: string;
  bio: string | null;
  hourly_rate: number;
  services: string[];
  service_areas: string[];
  years_experience: number | null;
  is_verified: boolean;
  instant_booking: boolean;
  is_active: boolean;
  response_time: string | null;
}

const CleanerProfile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [profile, setProfile] = useState<CleanerProfile | null>(null);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [newArea, setNewArea] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    business_name: "",
    bio: "",
    hourly_rate: 50,
    services: [] as string[],
    service_areas: [] as string[],
    years_experience: 0,
    instant_booking: false,
    is_active: true,
    response_time: "Responds in ~1 hour",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("cleaner_profiles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") throw error;

        if (data) {
          setProfile(data);
          setProfileImageUrl(data.profile_image || null);
          setFormData({
            business_name: data.business_name,
            bio: data.bio || "",
            hourly_rate: data.hourly_rate,
            services: data.services,
            service_areas: data.service_areas,
            years_experience: data.years_experience || 0,
            instant_booking: data.instant_booking,
            is_active: data.is_active,
            response_time: data.response_time || "Responds in ~1 hour",
          });
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setCropImageSrc(reader.result as string);
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCroppedImage = async (blob: Blob) => {
    if (!user) return;
    setCropImageSrc(null);
    setUploadingImage(true);
    try {
      const filePath = `${user.id}/profile.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("cleaner-profiles")
        .upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("cleaner-profiles")
        .getPublicUrl(filePath);

      const freshUrl = `${publicUrl}?t=${Date.now()}`;

      if (profile) {
        const { error: updateError } = await supabase
          .from("cleaner_profiles")
          .update({ profile_image: freshUrl })
          .eq("id", profile.id);
        if (updateError) throw updateError;
      }

      setProfileImageUrl(freshUrl);
      toast.success("Profile image updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleServiceToggle = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const handleAddArea = () => {
    if (newArea.trim() && !formData.service_areas.includes(newArea.trim())) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...prev.service_areas, newArea.trim()],
      }));
      setNewArea("");
    }
  };

  const handleRemoveArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas.filter(a => a !== area),
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    if (!formData.business_name.trim()) {
      toast.error("Business name is required");
      return;
    }

    if (formData.services.length === 0) {
      toast.error("Please select at least one service");
      return;
    }

    setSaving(true);
    try {
      if (profile) {
        const { error } = await supabase
          .from("cleaner_profiles")
          .update({
            business_name: formData.business_name,
            bio: formData.bio || null,
            hourly_rate: formData.hourly_rate,
            services: formData.services,
            service_areas: formData.service_areas,
            years_experience: formData.years_experience,
            instant_booking: formData.instant_booking,
            is_active: formData.is_active,
            response_time: formData.response_time,
          })
          .eq("id", profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cleaner_profiles")
          .insert({
            user_id: user.id,
            business_name: formData.business_name,
            bio: formData.bio || null,
            hourly_rate: formData.hourly_rate,
            services: formData.services,
            service_areas: formData.service_areas,
            years_experience: formData.years_experience,
            instant_booking: formData.instant_booking,
            is_active: formData.is_active,
            response_time: formData.response_time,
          });

        if (error) throw error;
      }

      toast.success("Profile saved successfully!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">My Business Profile</h1>
          <p className="text-muted-foreground">Manage how customers see your business on the platform.</p>
        </div>
        {profile?.is_verified && (
          <Badge className="bg-blue-600 text-white gap-1 ml-auto">
            <Shield className="h-3 w-3" /> VERIFIED
          </Badge>
        )}
      </div>

      <div className="space-y-6 mt-6">
          {/* Profile Image */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Profile Image</CardTitle>
              <CardDescription>Upload a photo that represents your business.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profileImageUrl || ""} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {formData.business_name ? formData.business_name[0]?.toUpperCase() : "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    {uploadingImage ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Uploading...</>
                    ) : (
                      <><Camera className="h-4 w-4 mr-2" />Change Photo</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP. Max 5MB.</p>
                </div>
              </div>

              <ImageCropDialog
                open={!!cropImageSrc}
                imageSrc={cropImageSrc || ""}
                title="Crop Profile Photo"
                onClose={() => setCropImageSrc(null)}
                onCropComplete={handleCroppedImage}
              />
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your business name and description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="business_name">Business Name *</Label>
                <Input
                  id="business_name"
                  value={formData.business_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="e.g., Sparkle Clean Services"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell customers about your cleaning business..."
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="hourly_rate">Hourly Rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    min={0}
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData(prev => ({ ...prev, hourly_rate: Number(e.target.value) }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="years_experience">Years of Experience</Label>
                  <Input
                    id="years_experience"
                    type="number"
                    min={0}
                    value={formData.years_experience}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_experience: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Services Offered</CardTitle>
              <CardDescription>Select all the services you provide.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SERVICE_OPTIONS.map((service) => (
                  <Badge
                    key={service}
                    variant={formData.services.includes(service) ? "default" : "outline"}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => handleServiceToggle(service)}
                  >
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Service Areas */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Service Areas</CardTitle>
              <CardDescription>Add cities or neighborhoods where you provide services.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newArea}
                  onChange={(e) => setNewArea(e.target.value)}
                  placeholder="e.g., Toronto, ON"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddArea())}
                />
                <Button type="button" onClick={handleAddArea}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
              {formData.service_areas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.service_areas.map((area) => (
                    <Badge key={area} variant="secondary" className="gap-1">
                      {area}
                      <button onClick={() => handleRemoveArea(area)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Control your availability and booking preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Active</Label>
                  <p className="text-sm text-muted-foreground">Show your profile in search results</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Instant Booking</Label>
                  <p className="text-sm text-muted-foreground">Allow customers to book without request approval</p>
                </div>
                <Switch
                  checked={formData.instant_booking}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, instant_booking: checked }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="response_time">Response Time</Label>
                <Input
                  id="response_time"
                  value={formData.response_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, response_time: e.target.value }))}
                  placeholder="e.g., Responds in ~1 hour"
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default CleanerProfile;
