import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings, 
  Bell, 
  Shield, 
  Database, 
  Loader2, 
  CheckCircle, 
  XCircle,
  DollarSign,
  Calendar,
  FileText,
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PlatformSettings {
  id: string;
  platform_name: string;
  support_email: string | null;
  maintenance_mode: boolean;
  notify_new_users: boolean;
  notify_new_bookings: boolean;
  notify_cleaner_applications: boolean;
  require_email_verification: boolean;
  require_2fa_admins: boolean;
  updated_at: string;
  // New fields
  platform_commission_rate: number;
  min_booking_hours: number;
  max_booking_hours: number;
  cancellation_window_hours: number;
  advance_booking_days: number;
  min_hourly_rate: number;
  max_hourly_rate: number;
  default_currency: string;
  site_tagline: string | null;
  terms_url: string | null;
  privacy_url: string | null;
  allow_instant_booking: boolean;
  require_cleaner_verification: boolean;
  auto_approve_cleaners: boolean;
}

const AdminSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [dbStatus, setDbStatus] = useState<"connected" | "error" | "checking">("checking");
  const [authStatus, setAuthStatus] = useState<"active" | "error" | "checking">("checking");

  // Platform Settings
  const [platformName, setPlatformName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [siteTagline, setSiteTagline] = useState("");

  // Notification Settings
  const [notifyNewUsers, setNotifyNewUsers] = useState(true);
  const [notifyNewBookings, setNotifyNewBookings] = useState(true);
  const [notifyCleanerApps, setNotifyCleanerApps] = useState(true);

  // Security Settings
  const [requireEmailVerification, setRequireEmailVerification] = useState(true);
  const [require2faAdmins, setRequire2faAdmins] = useState(false);

  // Commission & Pricing Settings
  const [commissionRate, setCommissionRate] = useState(10);
  const [minHourlyRate, setMinHourlyRate] = useState(25);
  const [maxHourlyRate, setMaxHourlyRate] = useState(150);
  const [defaultCurrency, setDefaultCurrency] = useState("CAD");

  // Booking Settings
  const [minBookingHours, setMinBookingHours] = useState(2);
  const [maxBookingHours, setMaxBookingHours] = useState(8);
  const [cancellationWindow, setCancellationWindow] = useState(24);
  const [advanceBookingDays, setAdvanceBookingDays] = useState(30);
  const [allowInstantBooking, setAllowInstantBooking] = useState(true);

  // Cleaner Settings
  const [requireCleanerVerification, setRequireCleanerVerification] = useState(true);
  const [autoApproveCleaners, setAutoApproveCleaners] = useState(false);

  // Legal Links
  const [termsUrl, setTermsUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState("");

  useEffect(() => {
    fetchSettings();
    checkSystemStatus();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .single();

      if (error) throw error;

      if (data) {
        setSettings(data as PlatformSettings);
        // Platform
        setPlatformName(data.platform_name);
        setSupportEmail(data.support_email || "");
        setMaintenanceMode(data.maintenance_mode);
        setSiteTagline(data.site_tagline || "");
        // Notifications
        setNotifyNewUsers(data.notify_new_users);
        setNotifyNewBookings(data.notify_new_bookings);
        setNotifyCleanerApps(data.notify_cleaner_applications);
        // Security
        setRequireEmailVerification(data.require_email_verification);
        setRequire2faAdmins(data.require_2fa_admins);
        // Commission & Pricing
        setCommissionRate(data.platform_commission_rate);
        setMinHourlyRate(data.min_hourly_rate);
        setMaxHourlyRate(data.max_hourly_rate);
        setDefaultCurrency(data.default_currency);
        // Booking
        setMinBookingHours(data.min_booking_hours);
        setMaxBookingHours(data.max_booking_hours);
        setCancellationWindow(data.cancellation_window_hours);
        setAdvanceBookingDays(data.advance_booking_days);
        setAllowInstantBooking(data.allow_instant_booking);
        // Cleaner
        setRequireCleanerVerification(data.require_cleaner_verification);
        setAutoApproveCleaners(data.auto_approve_cleaners);
        // Legal
        setTermsUrl(data.terms_url || "");
        setPrivacyUrl(data.privacy_url || "");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    try {
      const { error } = await supabase.from("profiles").select("id").limit(1);
      setDbStatus(error ? "error" : "connected");
    } catch {
      setDbStatus("error");
    }

    try {
      const { data } = await supabase.auth.getSession();
      setAuthStatus(data.session ? "active" : "active");
    } catch {
      setAuthStatus("error");
    }
  };

  const handleSave = async () => {
    if (!settings?.id) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("platform_settings")
        .update({
          platform_name: platformName,
          support_email: supportEmail || null,
          maintenance_mode: maintenanceMode,
          site_tagline: siteTagline || null,
          notify_new_users: notifyNewUsers,
          notify_new_bookings: notifyNewBookings,
          notify_cleaner_applications: notifyCleanerApps,
          require_email_verification: requireEmailVerification,
          require_2fa_admins: require2faAdmins,
          platform_commission_rate: commissionRate,
          min_hourly_rate: minHourlyRate,
          max_hourly_rate: maxHourlyRate,
          default_currency: defaultCurrency,
          min_booking_hours: minBookingHours,
          max_booking_hours: maxBookingHours,
          cancellation_window_hours: cancellationWindow,
          advance_booking_days: advanceBookingDays,
          allow_instant_booking: allowInstantBooking,
          require_cleaner_verification: requireCleanerVerification,
          auto_approve_cleaners: autoApproveCleaners,
          terms_url: termsUrl || null,
          privacy_url: privacyUrl || null,
          updated_by: user?.id,
        })
        .eq("id", settings.id);

      if (error) throw error;

      toast.success("Settings saved successfully");
      fetchSettings();
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = settings && (
    platformName !== settings.platform_name ||
    supportEmail !== (settings.support_email || "") ||
    maintenanceMode !== settings.maintenance_mode ||
    siteTagline !== (settings.site_tagline || "") ||
    notifyNewUsers !== settings.notify_new_users ||
    notifyNewBookings !== settings.notify_new_bookings ||
    notifyCleanerApps !== settings.notify_cleaner_applications ||
    requireEmailVerification !== settings.require_email_verification ||
    require2faAdmins !== settings.require_2fa_admins ||
    commissionRate !== settings.platform_commission_rate ||
    minHourlyRate !== settings.min_hourly_rate ||
    maxHourlyRate !== settings.max_hourly_rate ||
    defaultCurrency !== settings.default_currency ||
    minBookingHours !== settings.min_booking_hours ||
    maxBookingHours !== settings.max_booking_hours ||
    cancellationWindow !== settings.cancellation_window_hours ||
    advanceBookingDays !== settings.advance_booking_days ||
    allowInstantBooking !== settings.allow_instant_booking ||
    requireCleanerVerification !== settings.require_cleaner_verification ||
    autoApproveCleaners !== settings.auto_approve_cleaners ||
    termsUrl !== (settings.terms_url || "") ||
    privacyUrl !== (settings.privacy_url || "")
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold text-foreground">Admin Settings</h2>
        <p className="text-muted-foreground">Configure platform settings and preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* Platform Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Settings
            </CardTitle>
            <CardDescription>General platform configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  placeholder="Enter platform name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  placeholder="support@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="site-tagline">Site Tagline</Label>
              <Input
                id="site-tagline"
                value={siteTagline}
                onChange={(e) => setSiteTagline(e.target.value)}
                placeholder="Your platform tagline"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Temporarily disable the platform for maintenance
                </p>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>
          </CardContent>
        </Card>

        {/* Commission & Pricing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Commission & Pricing
            </CardTitle>
            <CardDescription>Configure platform fees and pricing limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="commission-rate">Platform Commission (%)</Label>
                <Input
                  id="commission-rate"
                  type="number"
                  min="0"
                  max="50"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Percentage taken from each booking
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="default-currency">Default Currency</Label>
                <Select value={defaultCurrency} onValueChange={setDefaultCurrency}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="min-hourly-rate">Minimum Hourly Rate</Label>
                <Input
                  id="min-hourly-rate"
                  type="number"
                  min="0"
                  value={minHourlyRate}
                  onChange={(e) => setMinHourlyRate(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-hourly-rate">Maximum Hourly Rate</Label>
                <Input
                  id="max-hourly-rate"
                  type="number"
                  min="0"
                  value={maxHourlyRate}
                  onChange={(e) => setMaxHourlyRate(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Booking Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Booking Settings
            </CardTitle>
            <CardDescription>Configure booking policies and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="min-booking-hours">Minimum Booking Hours</Label>
                <Input
                  id="min-booking-hours"
                  type="number"
                  min="1"
                  max="12"
                  value={minBookingHours}
                  onChange={(e) => setMinBookingHours(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-booking-hours">Maximum Booking Hours</Label>
                <Input
                  id="max-booking-hours"
                  type="number"
                  min="1"
                  max="24"
                  value={maxBookingHours}
                  onChange={(e) => setMaxBookingHours(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cancellation-window">Cancellation Window (hours)</Label>
                <Input
                  id="cancellation-window"
                  type="number"
                  min="0"
                  value={cancellationWindow}
                  onChange={(e) => setCancellationWindow(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Hours before booking that cancellation is allowed
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance-booking-days">Advance Booking Limit (days)</Label>
                <Input
                  id="advance-booking-days"
                  type="number"
                  min="1"
                  max="365"
                  value={advanceBookingDays}
                  onChange={(e) => setAdvanceBookingDays(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  How far in advance customers can book
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Allow Instant Booking</Label>
                <p className="text-sm text-muted-foreground">
                  Let customers book without cleaner approval
                </p>
              </div>
              <Switch
                checked={allowInstantBooking}
                onCheckedChange={setAllowInstantBooking}
              />
            </div>
          </CardContent>
        </Card>

        {/* Cleaner Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Cleaner Settings
            </CardTitle>
            <CardDescription>Configure cleaner onboarding and verification</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Cleaner Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Cleaners must be verified before accepting bookings
                </p>
              </div>
              <Switch
                checked={requireCleanerVerification}
                onCheckedChange={setRequireCleanerVerification}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-Approve New Cleaners</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically approve cleaner registrations
                </p>
              </div>
              <Switch
                checked={autoApproveCleaners}
                onCheckedChange={setAutoApproveCleaners}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure admin notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New User Registrations</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when new users sign up
                </p>
              </div>
              <Switch
                checked={notifyNewUsers}
                onCheckedChange={setNotifyNewUsers}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>New Booking Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when bookings are created
                </p>
              </div>
              <Switch
                checked={notifyNewBookings}
                onCheckedChange={setNotifyNewBookings}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Cleaner Applications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when cleaners register
                </p>
              </div>
              <Switch
                checked={notifyCleanerApps}
                onCheckedChange={setNotifyCleanerApps}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage security and access controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Email Verification</Label>
                <p className="text-sm text-muted-foreground">
                  Users must verify email before accessing the platform
                </p>
              </div>
              <Switch
                checked={requireEmailVerification}
                onCheckedChange={setRequireEmailVerification}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Require 2FA for admin accounts
                </p>
              </div>
              <Switch
                checked={require2faAdmins}
                onCheckedChange={setRequire2faAdmins}
              />
            </div>
          </CardContent>
        </Card>

        {/* Legal Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Legal & Compliance
            </CardTitle>
            <CardDescription>Configure legal document links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="terms-url">Terms of Service URL</Label>
                <Input
                  id="terms-url"
                  type="url"
                  value={termsUrl}
                  onChange={(e) => setTermsUrl(e.target.value)}
                  placeholder="https://example.com/terms"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privacy-url">Privacy Policy URL</Label>
                <Input
                  id="privacy-url"
                  type="url"
                  value={privacyUrl}
                  onChange={(e) => setPrivacyUrl(e.target.value)}
                  placeholder="https://example.com/privacy"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Information
            </CardTitle>
            <CardDescription>Platform system status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Database Status</p>
                <div className="flex items-center gap-2 mt-1">
                  {dbStatus === "checking" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : dbStatus === "connected" ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <p className={`text-2xl font-bold ${
                    dbStatus === "connected" ? "text-primary" : 
                    dbStatus === "error" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {dbStatus === "checking" ? "Checking..." : 
                     dbStatus === "connected" ? "Connected" : "Error"}
                  </p>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm font-medium">Auth Service</p>
                <div className="flex items-center gap-2 mt-1">
                  {authStatus === "checking" ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  ) : authStatus === "active" ? (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <p className={`text-2xl font-bold ${
                    authStatus === "active" ? "text-primary" : 
                    authStatus === "error" ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {authStatus === "checking" ? "Checking..." : 
                     authStatus === "active" ? "Active" : "Error"}
                  </p>
                </div>
              </div>
            </div>
            {settings?.updated_at && (
              <p className="text-sm text-muted-foreground">
                Last updated: {new Date(settings.updated_at).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={fetchSettings}
            disabled={saving}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
