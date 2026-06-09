import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  CalendarDays,
  History,
  CheckCircle,
  XCircle,
  Star,
  RotateCcw,
  MessageSquare,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import GetInvoiceButton from "@/components/GetInvoiceButton";

interface Booking {
  id: string;
  service_type: string;
  service_price: number;
  scheduled_date: string;
  scheduled_time: string;
  duration_hours: number;
  status: string;
  cleaner_name: string | null;
  cleaner_id: string | null;
  special_instructions: string | null;
  addresses: {
    label: string;
    street_address: string;
    city: string;
  } | null;
}

const BookingHistory = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { formatCurrency } = usePlatformSettings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [chattingBookingId, setChattingBookingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        let query = supabase
          .from("bookings")
          .select(`
            id,
            service_type,
            service_price,
            scheduled_date,
            scheduled_time,
            duration_hours,
            status,
            cleaner_name,
            cleaner_id,
            special_instructions,
            addresses (
              label,
              street_address,
              city
            )
          `)
          .eq("customer_id", user.id)
          .order("scheduled_date", { ascending: false });

        if (filter !== "all") {
          query = query.eq("status", filter as "pending" | "confirmed" | "in_progress" | "completed" | "cancelled");
        }

        const { data, error } = await query;

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, filter]);

  const handleStartChat = async (booking: Booking) => {
    if (!user || !booking.cleaner_id) {
      toast({ variant: "destructive", title: "Cannot start chat", description: "No cleaner assigned to this booking." });
      return;
    }

    setChattingBookingId(booking.id);
    try {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", user.id)
        .eq("provider_id", booking.cleaner_id)
        .maybeSingle();

      let conversationId: string;

      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: newConvo, error } = await supabase
          .from("conversations")
          .insert({ customer_id: user.id, provider_id: booking.cleaner_id })
          .select("id")
          .single();
        if (error) throw error;
        conversationId = newConvo.id;
      }

      // Send booking details as first message if conversation is empty
      const { data: msgs } = await supabase
        .from("messages")
        .select("id")
        .eq("conversation_id", conversationId)
        .limit(1);

      if (!msgs || msgs.length === 0) {
        const dateStr = format(new Date(booking.scheduled_date), "EEEE, MMMM d, yyyy");
        const addressStr = booking.addresses
          ? `📍 ${booking.addresses.label}: ${booking.addresses.street_address}, ${booking.addresses.city}`
          : "";

        const bookingMessage = [
          `📋 **Booking Details**`,
          `🧹 Service: ${booking.service_type}`,
          `📅 Date: ${dateStr}`,
          `🕐 Time: ${booking.scheduled_time} • ${booking.duration_hours} hours`,
          `💰 Total: ${formatCurrency(booking.service_price)}`,
          addressStr,
          booking.special_instructions ? `📝 Notes: ${booking.special_instructions}` : "",
        ].filter(Boolean).join("\n");

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          text: bookingMessage,
        });
      }

      navigate(`/dashboard/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to start chat." });
    } finally {
      setChattingBookingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success" className="gap-1"><CheckCircle className="h-3 w-3" /> Completed</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      case "confirmed":
        return <Badge variant="info" className="gap-1"><CheckCircle className="h-3 w-3" /> Confirmed</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
            Booking History
          </h1>
          <p className="text-muted-foreground">
            View all your past cleaning services
          </p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Bookings</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {bookings.length > 0 ? (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{booking.service_type}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-4 w-4" />
                        {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                      </span>
                      <span>{booking.scheduled_time}</span>
                      {booking.addresses && (
                        <span>{booking.addresses.city}</span>
                      )}
                      {booking.cleaner_name && (
                        <span>by {booking.cleaner_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-semibold text-lg">${booking.service_price}</div>
                    </div>
                    <div className="flex gap-2">
                      {booking.cleaner_id && booking.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-primary hover:text-primary"
                          disabled={chattingBookingId === booking.id}
                          onClick={() => handleStartChat(booking)}
                        >
                          {chattingBookingId === booking.id ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <MessageSquare className="h-4 w-4 mr-1" />
                          )}
                          Chat
                        </Button>
                      )}
                      {booking.status === "completed" && (
                        <Button variant="outline" size="sm">
                          <Star className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Book Again
                      </Button>
                      <GetInvoiceButton bookingId={booking.id} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-heading text-xl font-semibold mb-2">
              No Booking History
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {filter === "all"
                ? "You haven't booked any cleaning services yet."
                : `No ${filter} bookings found.`}
            </p>
            <Button asChild size="lg">
              <Link to="/search">Book Your First Cleaning</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BookingHistory;
