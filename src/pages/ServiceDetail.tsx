import { useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { playBookingSound } from "@/lib/sounds";
import { useAuth } from "@/contexts/AuthContext";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowLeft, MapPin, Clock, DollarSign, Star, CheckCircle,
  Eye, ShoppingBag, AlertCircle, MessageSquare, Share2, Link, Loader2, Zap, CalendarIcon,
  Shield, Award, Timer, ChevronRight, CalendarCheck, Sparkles,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import WriteReviewDialog from "@/components/WriteReviewDialog";
import { getOrCreateConversation } from "@/hooks/useChatConversations";
const TIME_SLOTS = [
  "08:00", "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
];

const CATEGORY_IMAGES: Record<string, string> = {
  "Home Cleaning": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop",
  "Deep Cleaning": "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=800&h=500&fit=crop",
  "Office Cleaning": "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop",
  "Carpet Cleaning": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
  "Window Cleaning": "https://images.unsplash.com/photo-1596263373796-7e25e2c63f5a?w=800&h=500&fit=crop",
  "Eco-Friendly Cleaning": "https://images.unsplash.com/photo-1542728928-1413d1894ed1?w=800&h=500&fit=crop",
  "Post-Construction": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&h=500&fit=crop",
  "Move-in/Move-out": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",
};

const getServiceImage = (listing: any) =>
  listing.image_url || CATEGORY_IMAGES[listing.category] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop";

const ServiceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isBuying, setIsBuying] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(addDays(new Date(), 1));
  const [selectedTime, setSelectedTime] = useState("09:00");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [startingChat, setStartingChat] = useState(false);
  const [isInstantBooking, setIsInstantBooking] = useState(false);

  const { data: addresses = [] } = useQuery({
    queryKey: ["user-addresses", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user!.id)
        .order("is_default", { ascending: false });
      if (error) throw error;
      const defaultAddr = data?.find((a) => a.is_default) || data?.[0];
      if (defaultAddr && !selectedAddressId) {
        setSelectedAddressId(defaultAddr.id);
      }
      return data || [];
    },
  });

  const { data: listing, isLoading } = useQuery({
    queryKey: ["service-detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;

      supabase.from("service_listings")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", id!)
        .then();

      const { data: profile } = await supabase
        .from("cleaner_profiles")
        .select("id, business_name, profile_image, is_verified, bio, hourly_rate, years_experience, response_time, user_id")
        .eq("id", data.cleaner_profile_id)
        .single();

      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("cleaner_profile_id", data.cleaner_profile_id);

      const avgRating = reviews && reviews.length > 0
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

      return {
        ...data,
        cleaner_name: profile?.business_name || "Cleaning Pro",
        cleaner_image: profile?.profile_image,
        cleaner_verified: profile?.is_verified || false,
        cleaner_bio: profile?.bio,
        cleaner_experience: profile?.years_experience,
        cleaner_response_time: profile?.response_time,
        cleaner_user_id: profile?.user_id,
        cleaner_rating: avgRating,
        cleaner_reviews_count: reviews?.length || 0,
        cleaner_profile_id: data.cleaner_profile_id,
      };
    },
  });

  const { data: similarListings = [] } = useQuery({
    queryKey: ["similar-services", id, listing?.category],
    enabled: !!listing,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select("id, title, price, price_type, image_url, category, cleaner_profile_id")
        .eq("is_active", true)
        .eq("category", listing!.category)
        .neq("id", id!)
        .order("orders_count", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch reviews for this cleaner
  const { data: cleanerReviews = [] } = useQuery({
    queryKey: ["service-reviews", listing?.cleaner_profile_id],
    enabled: !!listing?.cleaner_profile_id,
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("cleaner_profile_id", listing!.cleaner_profile_id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;

      const reviewerIds = [...new Set((reviews || []).map((r) => r.reviewer_id))];
      if (reviewerIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", reviewerIds);

      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      return (reviews || []).map((r) => ({
        ...r,
        reviewer_name: profileMap.get(r.reviewer_id)?.full_name || null,
        reviewer_avatar: profileMap.get(r.reviewer_id)?.avatar_url || null,
      }));
    },
  });

  // Check if user has a completed booking with this cleaner (required to review)
  const { data: hasCompletedBooking = false } = useQuery({
    queryKey: ["has-completed-booking", user?.id, listing?.cleaner_user_id],
    enabled: !!user && !!listing?.cleaner_user_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("id")
        .eq("customer_id", user!.id)
        .eq("cleaner_id", listing!.cleaner_user_id)
        .eq("status", "completed")
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  // Check if user already reviewed this cleaner
  const { data: hasExistingReview = false } = useQuery({
    queryKey: ["has-existing-review", user?.id, listing?.cleaner_profile_id],
    enabled: !!user && !!listing?.cleaner_profile_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("reviews")
        .select("id")
        .eq("reviewer_id", user!.id)
        .eq("cleaner_profile_id", listing!.cleaner_profile_id)
        .limit(1);
      return (data?.length ?? 0) > 0;
    },
  });

  const getPriceLabel = (type: string, price: number) => {
    switch (type) {
      case "hourly": return `$${price}/hr`;
      case "starting_at": return `From $${price}`;
      default: return `$${price}`;
    }
  };

  const handleOpenConfirmDialog = useCallback(() => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to book a service.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!listing || !selectedDate) {
      toast({ title: "Select a date", description: "Please pick a date for your booking.", variant: "destructive" });
      return;
    }
    if (user.id === listing.cleaner_user_id) {
      toast({ title: "Cannot book", description: "You cannot book your own service.", variant: "destructive" });
      return;
    }
    setShowConfirmDialog(true);
  }, [user, listing, selectedDate, navigate]);

  const handleConfirmBooking = useCallback(async () => {
    if (!user || !listing || !selectedDate) return;

    setIsBuying(true);
    try {
      const scheduledDate = format(selectedDate, "yyyy-MM-dd");
      const { error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        cleaner_id: listing.cleaner_user_id,
        cleaner_name: listing.cleaner_name,
        service_type: listing.title,
        service_price: listing.price,
        duration_hours: listing.duration_hours || 2,
        scheduled_date: scheduledDate,
        scheduled_time: selectedTime,
        address_id: selectedAddressId || null,
        status: "pending",
        special_instructions: specialInstructions.trim() || null,
      });

      if (error) throw error;

      await supabase.from("service_listings")
        .update({ orders_count: (listing.orders_count || 0) + 1 })
        .eq("id", listing.id);

      setShowConfirmDialog(false);
      playBookingSound();
      toast({ title: "Booking Request Sent!", description: "The cleaner will review your request and send you an offer." });
      navigate("/dashboard/upcoming");
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsBuying(false);
    }
  }, [user, listing, selectedDate, selectedTime, selectedAddressId, specialInstructions, navigate]);

  const handleInstantBook = useCallback(async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to book.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!listing || !selectedDate) {
      toast({ title: "Select a date", description: "Please pick a date first.", variant: "destructive" });
      return;
    }
    if (user.id === listing.cleaner_user_id) {
      toast({ title: "Cannot book", description: "You cannot book your own service.", variant: "destructive" });
      return;
    }

    setIsInstantBooking(true);
    try {
      const scheduledDate = format(selectedDate, "yyyy-MM-dd");
      const { data: booking, error } = await supabase.from("bookings").insert({
        customer_id: user.id,
        cleaner_id: listing.cleaner_user_id,
        cleaner_name: listing.cleaner_name,
        service_type: listing.title,
        service_price: listing.price,
        duration_hours: listing.duration_hours || 2,
        scheduled_date: scheduledDate,
        scheduled_time: selectedTime,
        address_id: selectedAddressId || null,
        status: "confirmed",
        special_instructions: specialInstructions.trim() || null,
      }).select().single();

      if (error) throw error;

      // Start a chat conversation automatically
      const convId = await getOrCreateConversation(user.id, listing.cleaner_user_id);
      const bookingMsg = `⚡ **Instant Booking Confirmed**\n\n🧹 Service: ${listing.title}\n📅 Date: ${format(selectedDate, "MMMM d, yyyy")}\n🕐 Time: ${selectedTime}\n⏱️ Duration: ${listing.duration_hours || 2} hours\n💰 Price: $${listing.price}${specialInstructions.trim() ? `\n📝 Notes: ${specialInstructions.trim()}` : ""}\n\nThis booking has been instantly confirmed!`;

      await supabase.from("messages").insert({
        conversation_id: convId,
        sender_id: user.id,
        text: bookingMsg,
      });

      await supabase.from("service_listings")
        .update({ orders_count: (listing.orders_count || 0) + 1 })
        .eq("id", listing.id);

      playBookingSound();
      toast({ title: "Instantly Booked! ⚡", description: "Your booking is confirmed." });
      navigate("/booking-confirmation", {
        state: {
          bookingId: booking.id,
          conversationId: convId,
          serviceName: listing.title,
          cleanerName: listing.cleaner_name,
          scheduledDate: scheduledDate,
          scheduledTime: selectedTime,
          durationHours: listing.duration_hours || 2,
          price: listing.price,
        },
      });
    } catch (err: any) {
      toast({ title: "Booking failed", description: err.message || "Something went wrong.", variant: "destructive" });
    } finally {
      setIsInstantBooking(false);
    }
  }, [user, listing, selectedDate, selectedTime, selectedAddressId, specialInstructions, navigate]);

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  const allImages = listing
    ? [getServiceImage(listing), ...(listing.gallery_images || [])].filter(Boolean)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <Skeleton className="h-6 w-32 mb-6" />
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <div className="space-y-4">
              <Skeleton className="h-[420px] w-full rounded-2xl" />
              <div className="flex gap-2">
                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-24 rounded-xl" />)}
              </div>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-[500px] rounded-2xl" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center max-w-4xl">
          <div className="bg-muted/50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Not Found</h1>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">This service listing may have been removed or is no longer available.</p>
          <Button onClick={() => navigate("/services")} size="lg">
            <ArrowLeft className="h-4 w-4 mr-2" /> Browse Services
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 overflow-x-auto">
          <button onClick={() => navigate("/services")} className="hover:text-primary transition-colors shrink-0">Services</button>
          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="hover:text-primary transition-colors cursor-pointer shrink-0" onClick={() => navigate(`/services?category=${listing.category}`)}>{listing.category}</span>
          <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />
          <span className="text-foreground font-medium truncate max-w-[140px] sm:max-w-[200px]">{listing.title}</span>
        </nav>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1fr_400px]">
          {/* ============ LEFT COLUMN ============ */}
          <div className="space-y-8">
            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="rounded-2xl overflow-hidden bg-muted relative group shadow-lg">
                <img
                  src={allImages[activeImage] || getServiceImage(listing)}
                  alt={listing.title}
                  className="w-full aspect-[16/9] object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/5 to-transparent" />
                {/* Share button floating */}
                <div className="absolute top-4 right-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="secondary" size="icon" className="rounded-full bg-white/90 hover:bg-white dark:bg-zinc-800/90 dark:hover:bg-zinc-800 shadow-lg backdrop-blur-sm h-10 w-10">
                        <Share2 className="h-4 w-4 text-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        toast({ title: "Link Copied!" });
                      }}>
                        <Link className="h-4 w-4 mr-2" /> Copy Link
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {/* Category badge floating */}
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                  <Badge className="bg-white/90 text-foreground dark:bg-zinc-900/90 dark:text-foreground backdrop-blur-sm shadow-sm border-0 font-semibold">
                    {listing.category}
                  </Badge>
                  {listing.cleaner_verified && (
                    <Badge className="bg-primary text-primary-foreground border-0 shadow-sm">
                      <Shield className="h-3 w-3 mr-1" /> Verified Pro
                    </Badge>
                  )}
                </div>
              </div>

              {/* Gallery Thumbnails */}
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className={cn(
                        "h-16 w-24 rounded-xl overflow-hidden shrink-0 border-2 transition-all duration-200",
                        activeImage === i
                          ? "border-primary shadow-md ring-2 ring-primary/20"
                          : "border-transparent opacity-70 hover:opacity-100"
                      )}
                    >
                      <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Title & Stats */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-foreground leading-tight">
                {listing.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-2 mt-3 sm:mt-4">
                {listing.cleaner_rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5].map(s => (
                        <Star
                          key={s}
                          className={cn(
                            "h-4 w-4",
                            s <= Math.round(listing.cleaner_rating)
                              ? "fill-accent text-accent"
                              : "fill-muted text-muted"
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-foreground text-sm">{listing.cleaner_rating.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">({listing.cleaner_reviews_count} reviews)</span>
                  </div>
                )}
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" /> {listing.views_count} views
                </span>
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <ShoppingBag className="h-4 w-4" /> {listing.orders_count} orders
                </span>
              </div>
            </motion.div>

            <Separator />

            {/* About This Service */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <h2 className="font-heading font-bold text-lg text-foreground mb-3 flex items-center gap-2">
                About This Service
              </h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            </motion.div>

            {/* Service Details Cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3"
            >
              {listing.location && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Location</p>
                    <p className="font-bold text-foreground text-sm truncate">{listing.location}</p>
                  </div>
                </div>
              )}
              {listing.duration_hours && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-secondary/10 shrink-0">
                    <Clock className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Duration</p>
                    <p className="font-bold text-foreground text-sm">{listing.duration_hours} hours</p>
                  </div>
                </div>
              )}
              {listing.delivery_time && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-card to-muted/30 border border-border/40 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-accent/10 shrink-0">
                    <Timer className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Delivery</p>
                    <p className="font-bold text-foreground text-sm">{listing.delivery_time}</p>
                  </div>
                </div>
              )}
            </motion.div>

            {/* What's Included */}
            {listing.features && listing.features.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
              >
                <Separator className="mb-8" />
                <h2 className="font-heading font-bold text-lg text-foreground mb-4">What's Included</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {listing.features.map((feature: string, i: number) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-secondary/5 border border-secondary/10">
                      <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Cleaner Profile Section - Desktop visible below main content */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
            >
              <Separator className="mb-8" />
              <h2 className="font-heading font-bold text-lg text-foreground mb-4">About the Provider</h2>
              <div className="flex flex-col sm:flex-row items-start gap-4 p-4 sm:p-5 rounded-2xl bg-card border border-border/60">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 ring-2 ring-primary/10 shrink-0">
                  <AvatarImage src={listing.cleaner_image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {listing.cleaner_name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-heading font-bold text-foreground">{listing.cleaner_name}</h3>
                    {listing.cleaner_verified && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[11px]">
                        <Shield className="h-3 w-3 mr-1" /> Verified
                      </Badge>
                    )}
                  </div>
                  {listing.cleaner_rating > 0 && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                      <span className="font-semibold text-foreground">{listing.cleaner_rating.toFixed(1)}</span>
                      ({listing.cleaner_reviews_count} reviews)
                    </p>
                  )}
                  {listing.cleaner_bio && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{listing.cleaner_bio}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    {listing.cleaner_experience != null && listing.cleaner_experience > 0 && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        {listing.cleaner_experience}+ years experience
                      </span>
                    )}
                    {listing.cleaner_response_time && (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Timer className="h-3.5 w-3.5 text-primary" />
                        {listing.cleaner_response_time}
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 w-full sm:w-auto" onClick={() => navigate(`/cleaner/${listing.cleaner_profile_id}`)}>
                  View Profile
                </Button>
              </div>
            </motion.div>

            {/* Customer Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.35 }}
            >
              <Separator className="mb-8" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Customer Reviews
                  {listing.cleaner_reviews_count > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">({listing.cleaner_reviews_count})</span>
                  )}
                </h2>
                <div className="flex items-center gap-3">
                  {listing.cleaner_rating > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-bold text-foreground text-sm">{listing.cleaner_rating.toFixed(1)}</span>
                    </div>
                  )}
                  <WriteReviewDialog
                    cleanerProfileId={listing.cleaner_profile_id}
                    cleanerName={listing.cleaner_name}
                    hasCompletedBooking={hasCompletedBooking}
                    hasExistingReview={hasExistingReview}
                    onReviewSubmitted={() => {
                      queryClient.invalidateQueries({ queryKey: ["service-reviews"] });
                      queryClient.invalidateQueries({ queryKey: ["service-detail"] });
                      queryClient.invalidateQueries({ queryKey: ["has-existing-review"] });
                    }}
                  />
                </div>
              </div>

              {cleanerReviews.length === 0 ? (
                <div className="text-center py-10 rounded-2xl bg-muted/30 border border-border/40">
                  <Star className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm font-medium text-foreground">No reviews yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Be the first to review after booking!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cleanerReviews.map((review) => (
                    <div key={review.id} className="flex items-start gap-3 p-4 rounded-xl bg-card border border-border/60">
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarImage src={review.reviewer_avatar || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {(review.reviewer_name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-sm text-foreground">{review.reviewer_name || "Anonymous"}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "h-3.5 w-3.5",
                                s <= review.rating ? "fill-accent text-accent" : "text-muted-foreground/20"
                              )}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}

                  {listing.cleaner_reviews_count > cleanerReviews.length && (
                    <Button
                      variant="ghost"
                      className="w-full text-primary"
                      onClick={() => navigate("/reviews")}
                    >
                      View All Reviews <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* ============ RIGHT COLUMN - BOOKING SIDEBAR ============ */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <Card className="shadow-xl border-0 overflow-hidden ring-1 ring-border/40">
                {/* Price Header */}
                <div className="relative bg-gradient-to-br from-primary via-primary to-primary-dark p-8 text-center overflow-hidden">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary-light)/0.3),transparent_60%)]" />
                  <p className="relative text-4xl sm:text-5xl font-extrabold text-primary-foreground tracking-tight">
                    {getPriceLabel(listing.price_type, listing.price)}
                  </p>
                  <p className="relative text-sm text-primary-foreground/70 mt-2 font-medium">
                    {listing.price_type === "hourly" ? "per hour" : listing.price_type === "starting_at" ? "starting price" : "fixed price"}
                  </p>
                </div>

                <CardContent className="p-5 space-y-4">
                  {/* Date Picker */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Select Date</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-11",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Select Time</label>
                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                      <SelectTrigger className="w-full h-11">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {format(new Date(`2000-01-01T${time}`), "h:mm a")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Address Selector */}
                  {user && (
                    <div>
                      <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Service Address</label>
                      {addresses.length > 0 ? (
                        <Select value={selectedAddressId} onValueChange={setSelectedAddressId}>
                          <SelectTrigger className="w-full h-11">
                            <MapPin className="h-4 w-4 mr-2 text-primary" />
                            <SelectValue placeholder="Choose address" />
                          </SelectTrigger>
                          <SelectContent>
                            {addresses.map((addr) => (
                              <SelectItem key={addr.id} value={addr.id}>
                                {addr.label} – {addr.street_address}, {addr.city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Button variant="outline" size="sm" className="w-full h-11" onClick={() => navigate("/dashboard/addresses")}>
                          <MapPin className="h-4 w-4 mr-2" /> Add an Address
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Special Instructions */}
                  <div>
                    <label className="text-xs font-semibold text-foreground mb-1.5 block uppercase tracking-wider">Special Instructions</label>
                    <Textarea
                      placeholder="Parking info, access codes, pet details..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      className="resize-none text-sm"
                      rows={2}
                      maxLength={500}
                    />
                    <p className="text-[11px] text-muted-foreground text-right mt-1">{specialInstructions.length}/500</p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3 pt-3">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full h-14 text-base font-bold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 relative overflow-hidden group"
                        style={{ background: "linear-gradient(135deg, hsl(207 70% 35%), hsl(207 65% 45%), hsl(207 70% 50%))" }}
                        size="lg"
                        disabled={isBuying}
                        onClick={handleOpenConfirmDialog}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {isBuying ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin text-white" />
                        ) : (
                          <CalendarCheck className="h-5 w-5 mr-2 text-white" />
                        )}
                        <span className="text-white">{isBuying ? "Booking..." : "Book Now"}</span>
                      </Button>
                    </motion.div>

                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        className="w-full h-14 rounded-xl font-bold shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group"
                        style={{ background: "linear-gradient(135deg, hsl(207 80% 30%), hsl(207 70% 40%), hsl(207 65% 50%))" }}
                        size="lg"
                        disabled={isInstantBooking}
                        onClick={handleInstantBook}
                      >
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        {isInstantBooking ? (
                          <Loader2 className="h-5 w-5 mr-2 animate-spin text-white" />
                        ) : (
                          <Sparkles className="h-5 w-5 mr-2 text-white" />
                        )}
                        <span className="text-white">{isInstantBooking ? "Booking..." : "Instant Book"}</span>
                      </Button>
                    </motion.div>
                  </div>

                  {/* Trust badges */}
                  <div className="flex items-center justify-center gap-5 pt-4 border-t border-border/30">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Shield className="h-4 w-4 text-primary" /> Secure Booking
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <CheckCircle className="h-4 w-4 text-secondary" /> Satisfaction Guaranteed
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Similar Services */}
        {similarListings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            className="mt-16 mb-8"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-heading font-bold text-foreground">Similar Services</h2>
              <Button variant="ghost" size="sm" onClick={() => navigate(`/services?category=${listing.category}`)}>
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {similarListings.map((s) => (
                <Card
                  key={s.id}
                  className="overflow-hidden cursor-pointer group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50"
                  onClick={() => navigate(`/services/${s.id}`)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={s.image_url || CATEGORY_IMAGES[s.category] || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop"}
                      alt={s.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-semibold line-clamp-2 text-foreground">{s.title}</p>
                    <p className="text-primary font-bold text-sm mt-1.5">
                      {getPriceLabel(s.price_type, s.price)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}
      </main>
      <Footer />

      {/* Booking Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Confirm Your Booking</DialogTitle>
            <DialogDescription>Review your booking details before confirming.</DialogDescription>
          </DialogHeader>

          {listing && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                <img
                  src={getServiceImage(listing)}
                  alt={listing.title}
                  className="h-14 w-14 rounded-xl object-cover"
                />
                <div>
                  <p className="font-semibold text-sm">{listing.title}</p>
                  <p className="text-xs text-muted-foreground">{listing.cleaner_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                  <CalendarIcon className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground text-[11px]">Date</p>
                    <p className="font-medium text-sm">{selectedDate ? format(selectedDate, "PPP") : "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                  <Clock className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground text-[11px]">Time</p>
                    <p className="font-medium text-sm">{format(new Date(`2000-01-01T${selectedTime}`), "h:mm a")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                  <DollarSign className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-muted-foreground text-[11px]">Price</p>
                    <p className="font-medium text-sm">{getPriceLabel(listing.price_type, listing.price)}</p>
                  </div>
                </div>
                {listing.duration_hours && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30">
                    <Clock className="h-4 w-4 text-primary" />
                    <div>
                      <p className="text-muted-foreground text-[11px]">Duration</p>
                      <p className="font-medium text-sm">{listing.duration_hours} hrs</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm p-2.5 rounded-lg bg-muted/30">
                <MapPin className="h-4 w-4 text-primary mt-0.5" />
                <div>
                  <p className="text-muted-foreground text-[11px]">Address</p>
                  {selectedAddress ? (
                    <div>
                      <p className="font-medium">{selectedAddress.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedAddress.street_address}, {selectedAddress.city}, {selectedAddress.province} {selectedAddress.postal_code}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-amber-600 font-medium">No address selected</p>
                  )}
                </div>
              </div>

              {specialInstructions.trim() && (
                <div className="text-sm p-2.5 rounded-lg bg-muted/30">
                  <p className="text-muted-foreground text-[11px] mb-1">Special Instructions</p>
                  <p className="text-foreground text-xs">{specialInstructions}</p>
                </div>
              )}
              <Separator />
              <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <AlertCircle className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  No payment required now. The cleaner will review your request and send you an offer to discuss.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isBuying}>
              Cancel
            </Button>
            <Button
              variant="cta"
              onClick={handleConfirmBooking}
              disabled={isBuying}
            >
              {isBuying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
              {isBuying ? "Sending..." : "Send Booking Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sticky Mobile Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/98 backdrop-blur-xl border-t border-border/50 shadow-[0_-8px_30px_-4px_hsl(var(--foreground)/0.12)] px-4 py-3.5">
        <div className="flex items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex flex-col">
            <span className="text-xl font-extrabold text-foreground">
              {getPriceLabel(listing.price_type, listing.price)}
            </span>
            {listing.duration_hours && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {listing.duration_hours}h estimated
              </span>
            )}
          </div>
          <Button
            size="lg"
            className="shrink-0 rounded-xl font-bold shadow-lg bg-gradient-to-r from-secondary to-secondary-light text-secondary-foreground hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 px-6"
            onClick={handleOpenConfirmDialog}
          >
            <Zap className="h-4 w-4 mr-1" />
            Book Now
          </Button>
        </div>
      </div>

      {/* Bottom spacer for mobile sticky bar */}
      <div className="h-20 lg:hidden" />
    </div>
  );
};

export default ServiceDetail;
