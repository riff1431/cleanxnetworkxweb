import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Paintbrush, Image, Upload, Loader2, RotateCcw, Save, Trash2, Type } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface ThemeSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  setting_type: string;
  category: string;
  label: string;
  description: string | null;
}

const AdminThemeManagement = () => {
  const [settings, setSettings] = useState<ThemeSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [changes, setChanges] = useState<Record<string, string | null>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("theme_settings")
      .select("*")
      .order("category", { ascending: true });

    if (error) {
      toast({ title: "Error", description: "Failed to load theme settings", variant: "destructive" });
    } else {
      setSettings(data || []);
    }
    setLoading(false);
  };

  const handleChange = (key: string, value: string | null) => {
    setChanges((prev) => ({ ...prev, [key]: value }));
  };

  const getCurrentValue = (setting: ThemeSetting) => {
    return changes[setting.setting_key] !== undefined
      ? changes[setting.setting_key]
      : setting.setting_value;
  };

  const handleImageUpload = async (settingKey: string, file: File) => {
    setUploading(settingKey);
    const ext = file.name.split(".").pop();
    const filePath = `${settingKey}-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("theme-assets")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(null);
      return;
    }

    const { data: urlData } = supabase.storage.from("theme-assets").getPublicUrl(filePath);
    handleChange(settingKey, urlData.publicUrl);
    setUploading(null);
    toast({ title: "Uploaded", description: "Image uploaded successfully" });
  };

  const handleRemoveImage = (settingKey: string) => {
    handleChange(settingKey, null);
  };

  const handleSave = async () => {
    setSaving(true);
    const updates = Object.entries(changes);

    for (const [key, value] of updates) {
      const { error } = await supabase
        .from("theme_settings")
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq("setting_key", key);

      if (error) {
        toast({ title: "Error", description: `Failed to save ${key}`, variant: "destructive" });
        setSaving(false);
        return;
      }
    }

    toast({ title: "Saved", description: "Theme settings updated successfully" });
    setChanges({});
    await fetchSettings();
    setSaving(false);
  };

  const handleReset = () => {
    setChanges({});
  };

  const hasChanges = Object.keys(changes).length > 0;

  const getSettingsByCategory = (category: string) =>
    settings.filter((s) => s.category === category);

  const renderColorInput = (setting: ThemeSetting) => {
    const value = getCurrentValue(setting) || "";
    // Convert HSL string to a hex-like preview
    const hslStyle = value ? `hsl(${value})` : "transparent";

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-lg border-2 border-border shadow-sm shrink-0"
            style={{ backgroundColor: hslStyle }}
          />
          <Input
            value={value}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            placeholder="e.g. 207 70% 35%"
            className="font-mono text-sm"
          />
        </div>
      </div>
    );
  };

  const renderImageInput = (setting: ThemeSetting) => {
    const value = getCurrentValue(setting);
    const isCurrentlyUploading = uploading === setting.setting_key;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        {value && (
          <div className="relative group rounded-lg border border-border overflow-hidden bg-muted">
            <img
              src={value}
              alt={setting.label}
              className="w-full max-h-40 object-contain p-2"
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveImage(setting.setting_key)}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Remove
            </Button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/*"
            disabled={isCurrentlyUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(setting.setting_key, file);
            }}
            className="text-sm"
          />
          {isCurrentlyUploading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Or paste URL:</span>
          <Input
            value={value || ""}
            onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            placeholder="https://example.com/image.png"
            className="text-sm"
          />
        </div>
      </div>
    );
  };

  const fontOptions = [
    { value: "Inter", label: "Inter" },
    { value: "Plus Jakarta Sans", label: "Plus Jakarta Sans" },
    { value: "Roboto", label: "Roboto" },
    { value: "Open Sans", label: "Open Sans" },
    { value: "Lato", label: "Lato" },
    { value: "Montserrat", label: "Montserrat" },
    { value: "Poppins", label: "Poppins" },
    { value: "Nunito", label: "Nunito" },
    { value: "Raleway", label: "Raleway" },
    { value: "Source Sans 3", label: "Source Sans 3" },
  ];

  const renderFontInput = (setting: ThemeSetting) => {
    const value = getCurrentValue(setting) || "Inter";

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <Select value={value} onValueChange={(v) => handleChange(setting.setting_key, v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select font..." />
          </SelectTrigger>
          <SelectContent>
            {fontOptions.map((font) => (
              <SelectItem key={font.value} value={font.value}>
                <span style={{ fontFamily: font.value }}>{font.label}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div
          className="p-4 rounded-lg border border-border bg-muted/50 mt-2"
          style={{ fontFamily: value }}
        >
          <p className="text-sm font-medium">Preview: {value}</p>
          <p className="text-sm">The quick brown fox jumps over the lazy dog.</p>
          <p className="text-xs text-muted-foreground mt-1">ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789</p>
        </div>
      </div>
    );
  };

  const renderSelectInput = (setting: ThemeSetting) => {
    const value = getCurrentValue(setting) || "";

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <Select value={value} onValueChange={(v) => handleChange(setting.setting_key, v)}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
          </SelectContent>
        </Select>
      </div>
    );
  };

  const renderRangeInput = (setting: ThemeSetting) => {
    const value = parseInt(getCurrentValue(setting) || "16", 10);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <div className="flex items-center gap-4">
          <Slider
            value={[value]}
            min={10}
            max={72}
            step={1}
            onValueChange={([v]) => handleChange(setting.setting_key, String(v))}
            className="flex-1"
          />
          <span className="text-sm font-mono w-12 text-right">{value}px</span>
        </div>
        <p
          className="p-3 rounded-lg border border-border bg-muted/50 mt-1"
          style={{ fontSize: `${value}px` }}
        >
          Preview text at {value}px
        </p>
      </div>
    );
  };

  const renderSetting = (setting: ThemeSetting) => {
    switch (setting.setting_type) {
      case "color":
        return renderColorInput(setting);
      case "image":
        return renderImageInput(setting);
      case "select":
        return renderSelectInput(setting);
      case "font":
        return renderFontInput(setting);
      case "range":
        return renderRangeInput(setting);
      default:
        return (
          <div className="space-y-2">
            <Label className="text-sm font-medium">{setting.label}</Label>
            <Input
              value={getCurrentValue(setting) || ""}
              onChange={(e) => handleChange(setting.setting_key, e.target.value)}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Paintbrush className="h-6 w-6 text-primary" />
            Theme Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Customize your website's appearance, colors, logo, and images
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset} disabled={!hasChanges || saving}>
            <RotateCcw className="h-4 w-4 mr-1" /> Reset
          </Button>
          <Button onClick={handleSave} disabled={!hasChanges || saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="branding" className="space-y-4">
        <TabsList>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="typography">Typography</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5 text-primary" />
                Branding
              </CardTitle>
              <CardDescription>Upload your logo, favicon, and set header style</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("branding").map((setting) => (
                <div key={setting.id}>{renderSetting(setting)}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="h-5 w-5 text-primary" />
                Typography
              </CardTitle>
              <CardDescription>
                Set fonts and sizes for headings, body text, and small text across the entire site
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getSettingsByCategory("typography").map((setting) => (
                  <div key={setting.id}>{renderSetting(setting)}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paintbrush className="h-5 w-5 text-primary" />
                Color Scheme
              </CardTitle>
              <CardDescription>
                Colors use HSL format (e.g. "207 70% 35%"). Changes here are saved to the database and will take effect site-wide.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {getSettingsByCategory("colors").map((setting) => (
                  <div key={setting.id}>{renderSetting(setting)}</div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-primary" />
                Site Images
              </CardTitle>
              <CardDescription>Upload hero backgrounds, footer images, and social share images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {getSettingsByCategory("images").map((setting) => (
                <div key={setting.id}>{renderSetting(setting)}</div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminThemeManagement;
