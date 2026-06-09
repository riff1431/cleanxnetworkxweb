import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  User,
  MessageSquare,
  FileText,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import GetInvoiceButton from "@/components/GetInvoiceButton";

const BookingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { formatCurrency } = usePlatformSettings();
  const [chattingLoading, setChattingLoading] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-detail", id],
    enabled: !!user && !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          addresses (
            label,
            street_address,
            city,
            province,
            postal_code,
            country
          )
        `)
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const handleStartChat = async () => {
    if (!user || !booking?.cleaner_id) return;
    setChattingLoading(true);
    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("provider_id", booking.cleaner_id)
        .maybeSingle();

      const conversationId = existing
        ? existing.id
        : (await supabase.from("conversations").insert({ customer_id: user.id, provider_id: booking.cleaner_id }).select("id").single()).data!.id;

      navigate(`/dashboard/messages?conversation=${conversationId}`);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to start chat." });
    } finally {
      setChattingLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: "success" | "destructive" | "info" | "warning" | "outline"; label: string }> = {
      completed: { variant: "success", label: "Completed" },
      cancelled: { variant: "destructive", label: "Cancelled" },
      confirmed: { variant: "info", label: "Confirmed" },
      pending: { variant: "warning", label: "Pending" },
      in_progress: { variant: "info", label: "In Progress" },
    };
    const s = map[status] || { variant: "outline" as const, label: status };
    return <Badge variant={s.variant} className="text-sm px-3 py-1">{s.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold mb-2">Booking Not Found</h2>
        <p className="text-muted-foreground mb-4">This booking doesn't exist or you don't have access.</p>
        <Button asChild><Link to="/dashboard/history">Back to History</Link></Button>
      </div>
    );
  }

  const address = booking.addresses as { label: string; street_address: string; city: string; province: string; postal_code: string; country: string } | null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="font-heading text-2xl font-bold text-foreground">Booking Details</h1>
          <p className="text-sm text-muted-foreground">ID: {booking.id.slice(0, 8)}…</p>
        </div>
        {getStatusBadge(booking.status)}
      </div>

      {/* Service Info */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" /> Service
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Service Type</p>
            <p className="font-medium">{booking.service_type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="font-medium">{formatCurrency(booking.service_price)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duration</p>
            <p className="font-medium">{booking.duration_hours} hour{booking.duration_hours !== 1 ? "s" : ""}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            {getStatusBadge(booking.status)}
          </div>
        </CardContent>
      </Card>

      {/* Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" /> Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm text-muted-foreground">Date</p>
            <p className="font-medium">{format(new Date(booking.scheduled_date), "EEEE, MMMM d, yyyy")}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Time</p>
            <p className="font-medium flex items-center gap-1"><Clock className="h-4 w-4" /> {booking.scheduled_time}</p>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      {address && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{address.label}</p>
            <p className="font-medium">{address.street_address}</p>
            <p className="text-sm text-muted-foreground">{address.city}, {address.province} {address.postal_code}</p>
          </CardContent>
        </Card>
      )}

      {/* Cleaner */}
      {booking.cleaner_name && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" /> Cleaner
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <p className="font-medium">{booking.cleaner_name}</p>
            {booking.cleaner_id && booking.status !== "cancelled" && (
              <Button variant="outline" size="sm" disabled={chattingLoading} onClick={handleStartChat}>
                {chattingLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageSquare className="h-4 w-4 mr-1" />}
                Chat
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Special Instructions */}
      {booking.special_instructions && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Special Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{booking.special_instructions}</p>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <GetInvoiceButton bookingId={booking.id} size="default" />
      </div>

      {/* Timestamps */}
      <Card>
        <CardContent className="pt-6 text-xs text-muted-foreground flex flex-wrap gap-x-6 gap-y-1">
          <span>Created: {format(new Date(booking.created_at), "MMM d, yyyy h:mm a")}</span>
          <span>Updated: {format(new Date(booking.updated_at), "MMM d, yyyy h:mm a")}</span>
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingDetail;
