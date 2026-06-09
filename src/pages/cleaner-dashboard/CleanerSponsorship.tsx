import { useState } from "react";
import { Zap, Eye, BookOpen, MousePointerClick, Clock, CheckCircle, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCleanerSponsorship, useRequestSponsorship } from "@/hooks/useSponsoredListings";

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string; description: string }> = {
  inactive: {
    label: "Not Sponsored",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
    description: "Your listing is not currently featured in the Sponsored Spotlight.",
  },
  requested: {
    label: "Request Pending",
    icon: Clock,
    className: "bg-warning/20 text-warning border-warning/30",
    description: "Your sponsorship request is under review. Admin will approve or reject it shortly.",
  },
  active: {
    label: "Sponsored & Active",
    icon: CheckCircle,
    className: "bg-secondary/20 text-secondary border-secondary/30",
    description: "Your listing is live in the Sponsored Spotlight! Customers can see you at the top of results.",
  },
  expired: {
    label: "Sponsorship Expired",
    icon: XCircle,
    className: "bg-muted text-muted-foreground",
    description: "Your sponsorship period has ended. Submit a new request to get featured again.",
  },
};

const CleanerSponsorship = () => {
  const { user } = useAuth();
  const [note, setNote] = useState("");

  // Get cleaner profile ID
  const { data: cleanerProfile } = useQuery({
    queryKey: ["cleaner-profile-id", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("cleaner_profiles")
        .select("id, business_name")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: sponsorship, isLoading } = useCleanerSponsorship(cleanerProfile?.id ?? null);
  const requestMutation = useRequestSponsorship();

  const handleRequest = () => {
    if (!cleanerProfile?.id || !user?.id) return;
    requestMutation.mutate({
      cleanerProfileId: cleanerProfile.id,
      userId: user.id,
      note: note.trim() || undefined,
    });
    setNote("");
  };

  const status = sponsorship?.sponsored_status ?? "inactive";
  const cfg = statusConfig[status] ?? statusConfig.inactive;
  const StatusIcon = cfg.icon;

  const canRequest = status === "inactive" || status === "expired";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="h-6 w-6 text-accent" />
          Sponsored Spotlight
        </h1>
        <p className="text-muted-foreground mt-1">
          Get featured at the top of search results and on the homepage for maximum visibility.
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your Sponsorship Status</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm">Loading…</div>
          ) : (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                <StatusIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <Badge variant="outline" className={cfg.className}>
                  {cfg.label}
                </Badge>
                <p className="text-sm text-muted-foreground mt-1.5">{cfg.description}</p>
                {sponsorship?.sponsored_note && (
                  <div className="mt-2 p-2.5 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground font-medium mb-0.5">Your note:</p>
                    <p className="text-sm">{sponsorship.sponsored_note}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats (only if ever been sponsored) */}
      {sponsorship && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Views", value: sponsorship.sponsored_views_count, icon: Eye },
            { label: "Quote Clicks", value: sponsorship.sponsored_quote_clicks, icon: BookOpen },
            { label: "Book Clicks", value: sponsorship.sponsored_book_clicks, icon: MousePointerClick },
          ].map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardContent className="p-4 text-center">
                <Icon className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Benefits */}
      <Card className="border-accent/30 bg-accent/5">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-accent" />
            Sponsorship Benefits
          </CardTitle>
          <CardDescription>Why get featured in the Sponsored Spotlight?</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2.5">
            {[
              "🏆 Pin to top of all search results — before non-sponsored cleaners",
              "🏠 Featured on the homepage Sponsored Spotlight carousel",
              "⚡ Prominent 'Sponsored' badge for instant trust",
              "📊 Track views, quote requests, and bookings from your spotlight",
              "📅 Optional scheduled start & end dates for campaigns",
            ].map((benefit) => (
              <li key={benefit} className="flex items-start gap-2 text-sm text-foreground">
                <CheckCircle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Request Form */}
      {canRequest && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Sponsorship</CardTitle>
            <CardDescription>
              Submit a request and our admin team will review it. You'll be notified once approved.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Add a note (optional)
              </label>
              <Textarea
                placeholder="Tell us about your business or why you'd like to be featured…"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={handleRequest}
              disabled={requestMutation.isPending || !cleanerProfile}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {requestMutation.isPending ? "Submitting…" : "Submit Sponsorship Request"}
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "requested" && (
        <Card className="border-warning/30 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm text-foreground">
              Your request is being reviewed. We'll notify you once a decision is made.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CleanerSponsorship;
