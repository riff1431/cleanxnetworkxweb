import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MessageSquare, ThumbsUp, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_id: string;
  cleaner_profile_id: string;
  booking_id: string | null;
  reviewer_name?: string | null;
  cleaner_name?: string | null;
}

const StarRating = ({ rating, onRate, interactive = false }: { rating: number; onRate?: (r: number) => void; interactive?: boolean }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-5 w-5 transition-colors ${
          star <= rating ? "fill-accent text-accent" : "text-muted-foreground/30"
        } ${interactive ? "cursor-pointer hover:text-accent" : ""}`}
        onClick={() => interactive && onRate?.(star)}
      />
    ))}
  </div>
);

const Reviews = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filterRating, setFilterRating] = useState<string>("all");
  const [writeDialogOpen, setWriteDialogOpen] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [selectedCleaner, setSelectedCleaner] = useState<string>("");
  const [selectedBooking, setSelectedBooking] = useState<string>("");

  // Fetch all reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", filterRating],
    queryFn: async () => {
      let query = supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (filterRating !== "all") {
        query = query.eq("rating", parseInt(filterRating));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch reviewer names and cleaner names
      const reviewerIds = [...new Set((data || []).map((r) => r.reviewer_id))];
      const cleanerProfileIds = [...new Set((data || []).map((r) => r.cleaner_profile_id))];

      const [profilesRes, cleanersRes] = await Promise.all([
        reviewerIds.length > 0
          ? supabase.from("profiles").select("id, full_name").in("id", reviewerIds)
          : { data: [] },
        cleanerProfileIds.length > 0
          ? supabase.from("cleaner_profiles").select("id, business_name").in("id", cleanerProfileIds)
          : { data: [] },
      ]);

      const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p.full_name]));
      const cleanerMap = new Map((cleanersRes.data || []).map((c) => [c.id, c.business_name]));

      return (data || []).map((r) => ({
        ...r,
        reviewer_name: profileMap.get(r.reviewer_id) || null,
        cleaner_name: cleanerMap.get(r.cleaner_profile_id) || null,
      })) as Review[];
    },
  });

  // Fetch user's completed bookings without reviews (for writing new reviews)
  const { data: eligibleBookings = [] } = useQuery({
    queryKey: ["eligible-bookings-for-review"],
    enabled: !!user,
    queryFn: async () => {
      // Get bookings that are completed
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("id, service_type, scheduled_date, cleaner_id, cleaner_name")
        .eq("customer_id", user!.id)
        .eq("status", "completed");

      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) return [];

      // Get existing reviews by this user
      const { data: existingReviews } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("reviewer_id", user!.id);

      const reviewedBookingIds = new Set((existingReviews || []).map((r) => r.booking_id));
      return bookings.filter((b) => !reviewedBookingIds.has(b.id));
    },
  });

  // Fetch cleaner profiles for the eligible bookings
  const { data: cleanerProfiles = [] } = useQuery({
    queryKey: ["cleaner-profiles-for-review", eligibleBookings],
    enabled: eligibleBookings.length > 0,
    queryFn: async () => {
      const cleanerIds = [...new Set(eligibleBookings.map((b) => b.cleaner_id).filter(Boolean))];
      if (cleanerIds.length === 0) return [];
      const { data, error } = await supabase
        .from("cleaner_profiles")
        .select("id, business_name, user_id")
        .in("user_id", cleanerIds as string[]);
      if (error) throw error;
      return data || [];
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const booking = eligibleBookings.find((b) => b.id === selectedBooking);
      const cleanerProfile = cleanerProfiles.find((c) => c.user_id === booking?.cleaner_id);
      if (!cleanerProfile) throw new Error("Cleaner profile not found");

      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user!.id,
        cleaner_profile_id: cleanerProfile.id,
        booking_id: selectedBooking || null,
        rating: newRating,
        comment: newComment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Review submitted!", description: "Thank you for your feedback." });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["eligible-bookings-for-review"] });
      setWriteDialogOpen(false);
      setNewRating(5);
      setNewComment("");
      setSelectedBooking("");
      setSelectedCleaner("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  // Stats
  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";
  const ratingCounts = [5, 4, 3, 2, 1].map((r) => ({
    rating: r,
    count: reviews.filter((rev) => rev.rating === r).length,
    pct: reviews.length > 0 ? (reviews.filter((rev) => rev.rating === r).length / reviews.length) * 100 : 0,
  }));

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              Customer Reviews
            </h1>
            <p className="text-muted-foreground mt-1">See what customers are saying about our cleaners</p>
          </div>
          {user && eligibleBookings.length > 0 && (
            <Dialog open={writeDialogOpen} onOpenChange={setWriteDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Star className="h-4 w-4 mr-2" />
                  Write a Review
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Write a Review</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label>Select Booking</Label>
                    <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a completed booking..." />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleBookings.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.service_type} — {b.scheduled_date} ({b.cleaner_name || "Cleaner"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <StarRating rating={newRating} onRate={setNewRating} interactive />
                  </div>
                  <div className="space-y-2">
                    <Label>Comment (optional)</Label>
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Tell us about your experience..."
                      rows={4}
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => submitReviewMutation.mutate()}
                    disabled={!selectedBooking || submitReviewMutation.isPending}
                  >
                    {submitReviewMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Submit Review
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="md:col-span-1">
            <CardContent className="pt-6 text-center">
              <div className="text-5xl font-bold text-foreground">{avgRating}</div>
              <StarRating rating={Math.round(parseFloat(avgRating))} />
              <p className="text-sm text-muted-foreground mt-2">{reviews.length} total reviews</p>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardContent className="pt-6 space-y-2">
              {ratingCounts.map((rc) => (
                <div key={rc.rating} className="flex items-center gap-3">
                  <span className="text-sm font-medium w-14 text-muted-foreground">{rc.rating} stars</span>
                  <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: `${rc.pct}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8 text-right">{rc.count}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-muted-foreground">Filter:</span>
          <Select value={filterRating} onValueChange={setFilterRating}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Ratings</SelectItem>
              <SelectItem value="5">5 Stars</SelectItem>
              <SelectItem value="4">4 Stars</SelectItem>
              <SelectItem value="3">3 Stars</SelectItem>
              <SelectItem value="2">2 Stars</SelectItem>
              <SelectItem value="1">1 Star</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Reviews List */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground">No reviews yet</h3>
              <p className="text-muted-foreground mt-1">Be the first to leave a review after your next booking!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {(review.reviewer_name || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                        <div>
                          <span className="font-semibold text-foreground">
                            {review.reviewer_name || "Anonymous"}
                          </span>
                          <span className="text-muted-foreground text-sm ml-2">
                            reviewed{" "}
                            <span className="font-medium text-primary">
                              {review.cleaner_name || "a cleaner"}
                            </span>
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{formatDate(review.created_at)}</span>
                      </div>
                      <StarRating rating={review.rating} />
                      {review.comment && (
                        <p className="text-sm text-foreground/80 mt-2 leading-relaxed">{review.comment}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Reviews;
