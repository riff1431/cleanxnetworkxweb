import { useState, useCallback } from "react";
import { Star, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface WriteReviewDialogProps {
  cleanerProfileId: string;
  cleanerName: string;
  /** The user must have at least one completed booking to leave a review */
  hasCompletedBooking: boolean;
  onReviewSubmitted?: () => void;
  /** Whether user already reviewed this provider */
  hasExistingReview?: boolean;
}

const WriteReviewDialog = ({
  cleanerProfileId,
  cleanerName,
  hasCompletedBooking,
  onReviewSubmitted,
  hasExistingReview,
}: WriteReviewDialogProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setRating(0);
    setHoveredRating(0);
    setComment("");
  };

  const handleSubmit = useCallback(async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to leave a review.", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Rating required", description: "Please select a star rating.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      reviewer_id: user.id,
      cleaner_profile_id: cleanerProfileId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);

    if (error) {
      console.error("Review submit error:", error);
      toast({ title: "Failed to submit review", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Review Submitted!", description: "Thank you for your feedback." });
    resetForm();
    setOpen(false);
    onReviewSubmitted?.();
  }, [user, rating, comment, cleanerProfileId, onReviewSubmitted]);

  // Determine button state
  if (!user) {
    return (
      <Button variant="outline" size="sm" onClick={() => toast({ title: "Please sign in", description: "You need an account to write a review.", variant: "destructive" })}>
        <Star className="h-4 w-4 mr-1.5" /> Write a Review
      </Button>
    );
  }

  if (hasExistingReview) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Star className="h-4 w-4 mr-1.5 fill-accent text-accent" /> Already Reviewed
      </Button>
    );
  }

  if (!hasCompletedBooking) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => toast({ title: "Booking required", description: "You can only review after completing a booking with this provider.", variant: "destructive" })}
      >
        <Star className="h-4 w-4 mr-1.5" /> Write a Review
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Star className="h-4 w-4 mr-1.5" /> Write a Review
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Write a Review</DialogTitle>
          <DialogDescription>Share your experience with {cleanerName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Star Rating */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2 block">Your Rating *</Label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoveredRating(s)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform duration-150 hover:scale-110 focus:outline-none"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors duration-150",
                      s <= (hoveredRating || rating)
                        ? "fill-accent text-accent"
                        : "text-muted-foreground/25 hover:text-muted-foreground/40"
                    )}
                  />
                </button>
              ))}
            </div>
            {rating > 0 && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
              </p>
            )}
          </div>

          {/* Comment */}
          <div>
            <Label className="text-sm font-semibold text-foreground mb-2 block">Your Feedback (optional)</Label>
            <Textarea
              placeholder="Tell others about your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="min-h-[100px] resize-none text-sm"
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">{comment.length}/1000</p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="cta" onClick={handleSubmit} disabled={submitting || rating === 0}>
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default WriteReviewDialog;
