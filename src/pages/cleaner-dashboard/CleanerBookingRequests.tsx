import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Clock, 
  MapPin,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Loader2,
  DollarSign,
  Send
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import GetInvoiceButton from "@/components/GetInvoiceButton";
import { getOrCreateConversation } from "@/hooks/useChatConversations";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: BookingStatus;
  service_price: number;
  duration_hours: number;
  special_instructions: string | null;
  customer_id: string;
  address_id: string | null;
}

const CleanerBookingRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [chattingBookingId, setChattingBookingId] = useState<string | null>(null);
  const [offerBooking, setOfferBooking] = useState<Booking | null>(null);
  const [offerAmount, setOfferAmount] = useState("");
  const [offerMessage, setOfferMessage] = useState("");
  const [sendingOffer, setSendingOffer] = useState(false);

  const handleStartChat = async (booking: Booking) => {
    if (!user) return;
    setChattingBookingId(booking.id);
    try {
      // Check for existing conversation (cleaner is provider)
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("customer_id", booking.customer_id)
        .eq("provider_id", user.id)
        .maybeSingle();

      let conversationId = existing?.id;

      if (!conversationId) {
        const { data: newConvo, error: convoError } = await supabase
          .from("conversations")
          .insert({
            customer_id: booking.customer_id,
            provider_id: user.id,
          })
          .select("id")
          .single();

        if (convoError) throw convoError;
        conversationId = newConvo.id;

        // Send booking details as first message
        const bookingMessage = `📋 **Booking Details**\n\n🧹 Service: ${booking.service_type}\n📅 Date: ${format(new Date(booking.scheduled_date), "MMMM d, yyyy")}\n🕐 Time: ${booking.scheduled_time}\n⏱️ Duration: ${booking.duration_hours} hours${booking.special_instructions ? `\n📝 Notes: ${booking.special_instructions}` : ""}\n\n💰 Total: $${Number(booking.service_price).toFixed(0)}`;

        await supabase.from("messages").insert({
          conversation_id: conversationId,
          sender_id: user.id,
          text: bookingMessage,
        });
      }

      navigate(`/cleaner/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setChattingBookingId(null);
    }
  };

  const handleSendOffer = async () => {
    if (!user || !offerBooking || !offerAmount || parseFloat(offerAmount) <= 0) {
      toast.error("Please enter a valid offer amount");
      return;
    }
    setSendingOffer(true);
    try {
      const convId = await getOrCreateConversation(offerBooking.customer_id, user.id);

      const offerText = `💰 **Service Offer**\n\n🧹 Service: ${offerBooking.service_type}\n📅 Date: ${format(new Date(offerBooking.scheduled_date), "MMMM d, yyyy")}\n🕐 Time: ${offerBooking.scheduled_time}\n⏱️ Duration: ${offerBooking.duration_hours} hours\n\n💵 **Offered Price: $${parseFloat(offerAmount).toFixed(2)}**${offerMessage.trim() ? `\n\n📝 ${offerMessage.trim()}` : ""}\n\nPlease reply to accept or discuss this offer.`;

      await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        text: offerText,
      });

      // Also create a notification for the customer
      await supabase.from("notifications").insert({
        user_id: offerBooking.customer_id,
        title: "New Service Offer",
        body: `You received a $${parseFloat(offerAmount).toFixed(2)} offer for ${offerBooking.service_type}`,
        link: `/dashboard/messages?conversation=${convId}`,
        type: "booking",
      });

      toast.success("Offer sent to customer!");
      setOfferBooking(null);
      setOfferAmount("");
      setOfferMessage("");
      navigate(`/cleaner/messages?conversation=${convId}`);
    } catch (error) {
      console.error("Error sending offer:", error);
      toast.error("Failed to send offer");
    } finally {
      setSendingOffer(false);
    }
  };

  const fetchBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("cleaner_id", user.id)
        .order("scheduled_date", { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [user]);

  const handleAcceptBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "confirmed" as BookingStatus })
        .eq("id", bookingId);

      if (error) throw error;
      toast.success("Booking accepted!");
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error accepting booking:", error);
      toast.error("Failed to accept booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeclineBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" as BookingStatus })
        .eq("id", bookingId);

      if (error) throw error;
      toast.success("Booking declined");
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error declining booking:", error);
      toast.error("Failed to decline booking");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "completed" as BookingStatus })
        .eq("id", bookingId);

      if (error) throw error;
      toast.success("Booking marked as completed!");
      fetchBookings();
      setSelectedBooking(null);
    } catch (error) {
      console.error("Error completing booking:", error);
      toast.error("Failed to complete booking");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
      confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      cancelled: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return styles[status] || "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300";
  };

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const confirmedBookings = bookings.filter(b => b.status === "confirmed");
  const completedBookings = bookings.filter(b => b.status === "completed");

  const BookingCard = ({ booking }: { booking: Booking }) => (
    <Card className="border-border hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">{booking.service_type}</h3>
              <Badge className={getStatusBadge(booking.status)}>
                {booking.status.replace("_", " ")}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {booking.scheduled_time}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Duration: {booking.duration_hours} hours
            </p>
          </div>
          <div className="text-right space-y-2">
            <p className="text-xl font-bold text-foreground">
              ${Number(booking.service_price).toFixed(0)}
            </p>
            <div className="flex flex-col gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedBooking(booking)}
              >
                <Eye className="mr-1 h-4 w-4" />
                View Details
              </Button>
              {booking.status !== "cancelled" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartChat(booking)}
                  disabled={chattingBookingId === booking.id}
                >
                  {chattingBookingId === booking.id ? (
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageSquare className="mr-1 h-4 w-4" />
                  )}
                  Chat
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-foreground">Booking Requests</h1>
        <p className="text-muted-foreground">Manage your incoming booking requests and scheduled jobs.</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="pending" className="gap-2">
            Pending
            {pendingBookings.length > 0 && (
              <Badge variant="secondary" className="ml-1">{pendingBookings.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingBookings.length > 0 ? (
            <div className="grid gap-4">
              {pendingBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No pending requests</h3>
                <p className="text-muted-foreground">New booking requests will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="mt-6">
          {confirmedBookings.length > 0 ? (
            <div className="grid gap-4">
              {confirmedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No confirmed bookings</h3>
                <p className="text-muted-foreground">Accept pending requests to see them here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          {completedBookings.length > 0 ? (
            <div className="grid gap-4">
              {completedBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <Card className="border-border">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No completed bookings</h3>
                <p className="text-muted-foreground">Completed jobs will appear here.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Review the booking details and take action.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Service</span>
                <span className="font-medium">{selectedBooking.service_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">
                  {format(new Date(selectedBooking.scheduled_date), "MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{selectedBooking.scheduled_time}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{selectedBooking.duration_hours} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Price</span>
                <span className="font-bold text-lg">${Number(selectedBooking.service_price).toFixed(0)}</span>
              </div>
              {selectedBooking.special_instructions && (
                <div>
                  <span className="text-muted-foreground block mb-1">Special Instructions</span>
                  <p className="text-sm bg-muted p-3 rounded-lg">
                    {selectedBooking.special_instructions}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusBadge(selectedBooking.status)}>
                  {selectedBooking.status.replace("_", " ")}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
            {selectedBooking && (
              <GetInvoiceButton bookingId={selectedBooking.id} />
            )}
            {selectedBooking?.status !== "cancelled" && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedBooking(null);
                  handleStartChat(selectedBooking!);
                }}
                disabled={chattingBookingId === selectedBooking?.id}
              >
                {chattingBookingId === selectedBooking?.id ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <MessageSquare className="mr-2 h-4 w-4" />
                )}
                Chat
              </Button>
            )}
            {selectedBooking?.status === "pending" && (
              <>
                <Button
                  variant="secondary"
                  onClick={() => {
                    const b = selectedBooking;
                    setSelectedBooking(null);
                    setOfferBooking(b);
                  }}
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  Send Offer
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleDeclineBooking(selectedBooking.id)}
                  disabled={actionLoading}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Decline
                </Button>
                <Button
                  onClick={() => handleAcceptBooking(selectedBooking.id)}
                  disabled={actionLoading}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept
                </Button>
              </>
            )}
            {selectedBooking?.status === "confirmed" && (
              <Button
                onClick={() => handleCompleteBooking(selectedBooking.id)}
                disabled={actionLoading}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Mark Complete
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Dialog */}
      <Dialog open={!!offerBooking} onOpenChange={(open) => !open && setOfferBooking(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Offer to Customer</DialogTitle>
            <DialogDescription>
              Set your price and include a message. The customer will receive this in chat.
            </DialogDescription>
          </DialogHeader>
          {offerBooking && (
            <div className="space-y-4 py-2">
              <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                <p><strong>Service:</strong> {offerBooking.service_type}</p>
                <p><strong>Date:</strong> {format(new Date(offerBooking.scheduled_date), "MMMM d, yyyy")}</p>
                <p><strong>Duration:</strong> {offerBooking.duration_hours} hours</p>
                <p className="text-muted-foreground text-xs">Listed price: ${Number(offerBooking.service_price).toFixed(0)}</p>
              </div>
              <div>
                <Label>Your Offer Price ($) *</Label>
                <div className="relative mt-1">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder={Number(offerBooking.service_price).toFixed(0)}
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <div>
                <Label>Message (optional)</Label>
                <Textarea
                  placeholder="Add details about your offer, availability, etc."
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  className="mt-1"
                  maxLength={500}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOfferBooking(null)}>Cancel</Button>
            <Button onClick={handleSendOffer} disabled={sendingOffer || !offerAmount}>
              {sendingOffer ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              {sendingOffer ? "Sending..." : "Send Offer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CleanerBookingRequests;
