import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { format, addDays } from "date-fns";
import {
  Star,
  MapPin,
  Shield,
  Clock,
  Heart,
  Share2,
  CheckCircle,
  Phone,
  Calendar as CalendarIcon,
  ChevronLeft,
  MessageSquare,
  ThumbsUp,
  Award,
  Leaf,
  Info,
  Crown,
  Zap,
  BarChart2,
  Percent,
  Lock,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { PaymentMethod } from "@/hooks/usePaymentSettings";
import PaymentMethodSelector from "@/components/booking/PaymentMethodSelector";
import ServiceAreaMap from "@/components/maps/ServiceAreaMap";
import { useAuth } from "@/contexts/AuthContext";
import { getOrCreateConversation } from "@/hooks/useChatConversations";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import SubscriptionGate from "@/components/SubscriptionGate";
import { useFinderAccess } from "@/hooks/useFinderAccess";
const PROFILE_TIER_CONFIG = {
  premium: {
    label: "Premium Member",
    Icon: Crown,
    badgeClass: "bg-accent/15 text-accent-foreground border-accent/30",
    benefits: [
      { icon: Crown, text: "Top listing boost — appears first in search results" },
      { icon: Shield, text: "Verification badge — platform-vetted professional" },
      { icon: Percent, text: "Reduced commission — maximising your earnings" },
      { icon: BarChart2, text: "Analytics access — full platform insights" },
    ],
  },
  pro: {
    label: "Pro Member",
    Icon: Zap,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    benefits: [
      { icon: Zap, text: "Priority listing — higher visibility in search" },
      { icon: Shield, text: "Verification badge — platform-vetted professional" },
      { icon: Percent, text: "Reduced commission rate" },
      { icon: BarChart2, text: "Analytics access" },
    ],
  },
  basic: {
    label: "Member",
    Icon: Shield,
    badgeClass: "bg-muted text-muted-foreground border-border",
    benefits: [
      { icon: Shield, text: "Verified listing" },
      { icon: CheckCircle, text: "Priority support" },
    ],
  },
} as const;

// Mock cleaner data
const mockCleanerData = {
  id: 1,
  name: "SparklePro Cleaning",
  tagline: "Professional cleaning with a personal touch",
  image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&h=400&fit=crop",
  coverImage: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=400&fit=crop",
  rating: 4.9,
  reviewCount: 127,
  location: "Toronto, ON",
  address: "Serving Toronto & GTA",
  verified: true,
  featured: true,
  instantBooking: true,
  responseTime: "Usually responds within 1 hour",
  memberSince: "January 2022",
  completedJobs: 342,
  repeatClients: "89%",
  hourlyRate: 45,
  subscriptionTier: "premium" as "basic" | "pro" | "premium" | null,
  description: `SparklePro Cleaning is a professional cleaning service dedicated to making your home or office spotless. With over 5 years of experience, we pride ourselves on attention to detail, reliability, and eco-friendly practices.

Our team of trained professionals uses only the highest quality, environmentally safe products to ensure a clean that's safe for your family, pets, and the planet.

We offer flexible scheduling, competitive pricing, and a 100% satisfaction guarantee. If you're not happy with our service, we'll come back and make it right - no questions asked.`,
  services: [
    { name: "Standard Home Cleaning", pricePerHour: 45, description: "Complete cleaning of all rooms, kitchen, and bathrooms" },
    { name: "Deep Cleaning", pricePerHour: 55, description: "Thorough cleaning including inside appliances, baseboards, and hard-to-reach areas" },
    { name: "Move In/Out Cleaning", pricePerHour: 60, description: "Comprehensive cleaning for moving, including closets and cabinets" },
    { name: "Airbnb/Rental Turnover", pricePerHour: 50, description: "Quick turnaround cleaning between guests" },
    { name: "Office Cleaning", pricePerHour: 55, description: "Professional office and commercial space cleaning" },
    { name: "Post-Construction", pricePerHour: 65, description: "Heavy-duty cleaning after renovation or construction" },
  ],
  addOns: [
    { name: "Inside Fridge", price: 25 },
    { name: "Inside Oven", price: 25 },
    { name: "Interior Windows", price: 35 },
    { name: "Laundry (wash & fold)", price: 20 },
    { name: "Organize Closet", price: 40 },
  ],
  gallery: [
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=400&h=300&fit=crop",
    "https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=300&fit=crop",
  ],
  badges: [
    { icon: Shield, label: "Verified Pro", color: "text-secondary" },
    { icon: Award, label: "Top Rated", color: "text-accent" },
    { icon: Leaf, label: "Eco-Friendly", color: "text-secondary" },
  ],
  availability: {
    monday: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
    tuesday: ["9:00 AM", "11:00 AM", "2:00 PM"],
    wednesday: ["9:00 AM", "11:00 AM", "2:00 PM", "4:00 PM"],
    thursday: ["9:00 AM", "2:00 PM", "4:00 PM"],
    friday: ["9:00 AM", "11:00 AM", "2:00 PM"],
    saturday: ["10:00 AM", "1:00 PM"],
    sunday: [],
  },
  reviews: [
    {
      id: 1,
      author: "Sarah M.",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
      rating: 5,
      date: "2 weeks ago",
      service: "Deep Cleaning",
      comment: "Absolutely fantastic service! The team was professional, thorough, and left my home sparkling clean. They even cleaned areas I didn't expect. Highly recommend!",
      helpful: 12,
    },
    {
      id: 2,
      author: "Michael T.",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
      rating: 5,
      date: "1 month ago",
      service: "Standard Home Cleaning",
      comment: "Been using SparklePro for 6 months now on a bi-weekly basis. Consistently excellent service. They're always on time and do a great job.",
      helpful: 8,
    },
    {
      id: 3,
      author: "Jennifer L.",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
      rating: 4,
      date: "1 month ago",
      service: "Move In/Out Cleaning",
      comment: "Great job on our move-out cleaning. The apartment looked better than when we moved in! Only reason for 4 stars is they arrived 30 minutes late, but they communicated the delay.",
      helpful: 5,
    },
    {
      id: 4,
      author: "David K.",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop",
      rating: 5,
      date: "2 months ago",
      service: "Airbnb/Rental Turnover",
      comment: "Perfect for my Airbnb property. Quick turnaround, great attention to detail, and my guests always comment on how clean the place is. Worth every penny!",
      helpful: 15,
    },
  ],
};

const CleanerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const cleaner = mockCleanerData; // In real app, fetch by id
  const [startingChat, setStartingChat] = useState(false);
  const { canMessage, canViewContact, canAccessCalendar } = useFinderAccess();

  // Fetch the cleaner profile's user_id so we can start a conversation
  const { data: cleanerUserId } = useQuery({
    queryKey: ["cleaner-user-id", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("cleaner_profiles")
        .select("user_id")
        .eq("id", id!)
        .maybeSingle();
      return data?.user_id || null;
    },
  });

  // Fetch cleaner's service listings
  const { data: serviceListings, isLoading: loadingListings } = useQuery({
    queryKey: ["cleaner-service-listings", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_listings")
        .select("*")
        .eq("cleaner_profile_id", id!)
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleSendMessage = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to message a provider.", variant: "destructive" });
      navigate("/auth");
      return;
    }
    if (!cleanerUserId) {
      toast({ title: "Provider not found", variant: "destructive" });
      return;
    }
    if (user.id === cleanerUserId) {
      toast({ title: "Cannot message yourself", variant: "destructive" });
      return;
    }
    setStartingChat(true);
    try {
      const convId = await getOrCreateConversation(user.id, cleanerUserId);
      navigate("/dashboard/messages", { state: { conversationId: convId } });
    } catch (err: any) {
      toast({ title: "Failed to start chat", description: err.message, variant: "destructive" });
    } finally {
      setStartingChat(false);
    }
  };
  
  // Platform settings hook
  const { 
    settings, 
    loading: settingsLoading, 
    formatCurrency, 
    calculateCommission,
    currencySymbol 
  } = usePlatformSettings();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedHours, setSelectedHours] = useState(settings.min_booking_hours);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Update selectedHours when settings load
  if (!settingsLoading && selectedHours < settings.min_booking_hours) {
    setSelectedHours(settings.min_booking_hours);
  }

  const getDayOfWeek = (date: Date): keyof typeof cleaner.availability => {
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return days[date.getDay()] as keyof typeof cleaner.availability;
  };

  const availableSlots = selectedDate 
    ? cleaner.availability[getDayOfWeek(selectedDate)] 
    : [];

  const selectedServiceData = cleaner.services.find(s => s.name === selectedService);
  
  // Calculate pricing with platform settings
  const subtotal = selectedServiceData ? selectedServiceData.pricePerHour * selectedHours : 0;
  const platformFee = calculateCommission(subtotal);
  const total = subtotal + platformFee;

  // Date validation based on platform settings
  const today = new Date();
  const maxBookingDate = addDays(today, settings.advance_booking_days);

  const isDateDisabled = (date: Date) => {
    // Past dates
    if (date < today) return true;
    // Beyond advance booking limit
    if (date > maxBookingDate) return true;
    // Sundays (no availability)
    if (date.getDay() === 0) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Cover Image */}
      <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
        <img
          src={cleaner.coverImage}
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Back Button */}
        <Link
          to="/search"
          className="absolute top-4 left-4 flex items-center gap-2 px-3 py-2 bg-card/80 backdrop-blur-sm rounded-lg text-sm font-medium hover:bg-card transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Search
        </Link>
      </div>

      <div className="container mx-auto px-4 -mt-20 relative z-10 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card className="overflow-visible">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Avatar */}
                  <div className="relative -mt-20 md:-mt-16">
                    <img
                      src={cleaner.image}
                      alt={cleaner.name}
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-card shadow-lg"
                    />
                    {cleaner.verified && (
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                          {cleaner.name}
                        </h1>
                        <p className="text-muted-foreground">{cleaner.tagline}</p>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {cleaner.address}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsFavorited(!isFavorited)}
                        >
                          <Heart
                            className={cn(
                              "h-4 w-4",
                              isFavorited && "fill-destructive text-destructive"
                            )}
                          />
                        </Button>
                        <Button variant="outline" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap gap-4 mt-4">
                      <div className="flex items-center gap-1">
                        <Star className="h-5 w-5 fill-accent text-accent" />
                        <span className="font-semibold">{cleaner.rating}</span>
                        <span className="text-muted-foreground">({cleaner.reviewCount} reviews)</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {cleaner.responseTime}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {cleaner.badges.map((badge) => (
                        <Badge key={badge.label} variant="secondary" className="gap-1">
                          <badge.icon className={cn("h-3 w-3", badge.color)} />
                          {badge.label}
                        </Badge>
                      ))}
                      {cleaner.instantBooking && settings.allow_instant_booking && (
                        <Badge variant="default" className="gap-1 bg-primary">
                          <CheckCircle className="h-3 w-3" />
                          Instant Booking
                        </Badge>
                      )}
                    </div>

                    {/* Subscription Tier Banner */}
                    {cleaner.subscriptionTier && PROFILE_TIER_CONFIG[cleaner.subscriptionTier] && (() => {
                      const tierCfg = PROFILE_TIER_CONFIG[cleaner.subscriptionTier as keyof typeof PROFILE_TIER_CONFIG];
                      const TierIcon = tierCfg.Icon;
                      return (
                        <div className={cn(
                          "mt-4 rounded-xl border p-4",
                          tierCfg.badgeClass
                        )}>
                          <div className="flex items-center gap-2 mb-2">
                            <TierIcon className="h-4 w-4" />
                            <span className="font-semibold text-sm">{tierCfg.label}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {tierCfg.benefits.map((b) => (
                              <div key={b.text} className="flex items-start gap-1.5 text-xs">
                                <b.icon className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>{b.text}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-border">
                      <div className="text-center">
                        <div className="font-heading text-xl font-bold text-foreground">
                          {cleaner.completedJobs}
                        </div>
                        <div className="text-xs text-muted-foreground">Jobs Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-heading text-xl font-bold text-foreground">
                          {cleaner.repeatClients}
                        </div>
                        <div className="text-xs text-muted-foreground">Repeat Clients</div>
                      </div>
                      <div className="text-center">
                        <div className="font-heading text-xl font-bold text-foreground">
                          {cleaner.memberSince.split(" ")[1]}
                        </div>
                        <div className="text-xs text-muted-foreground">Member Since</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="w-full justify-start bg-card border border-border h-auto p-1 flex-wrap">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="gallery">Gallery</TabsTrigger>
                <TabsTrigger value="reviews">Reviews ({cleaner.reviewCount})</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {cleaner.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-line">
                      {cleaner.description}
                    </p>
                  </CardContent>
                </Card>

                {/* Service Area Map */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Service Area
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {cleaner.name} serves {cleaner.location} and surrounding areas
                    </p>
                  </CardHeader>
                  <CardContent>
                    <ServiceAreaMap
                      location={cleaner.location}
                      serviceAreas={["Mississauga, ON", "Brampton, ON", "Markham, ON"]}
                      cleanerName={cleaner.name}
                      className="h-[350px] rounded-xl overflow-hidden border border-border"
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-6">
                {loadingListings ? (
                  <div className="flex items-center justify-center h-40">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : serviceListings && serviceListings.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {serviceListings.map((listing) => (
                      <Link key={listing.id} to={`/services/${listing.id}`} className="group">
                        <Card className="overflow-hidden h-full hover:border-primary/50 transition-colors">
                          <div className="aspect-video overflow-hidden bg-muted">
                            {listing.image_url ? (
                              <img
                                src={listing.image_url}
                                alt={listing.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <span className="text-3xl text-muted-foreground/40">🧹</span>
                              </div>
                            )}
                          </div>
                          <CardContent className="space-y-2 p-4">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                {listing.title}
                              </h4>
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {listing.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {listing.description}
                            </p>
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <span className="font-heading text-lg font-bold text-primary">
                                {currencySymbol}{listing.price}
                                <span className="text-xs font-normal text-muted-foreground ml-1">
                                  {listing.price_type === "hourly" ? "/hr" : listing.price_type === "fixed" ? " fixed" : ""}
                                </span>
                              </span>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {listing.duration_hours && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {listing.duration_hours}h
                                  </span>
                                )}
                                {listing.location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {listing.location}
                                  </span>
                                )}
                              </div>
                            </div>
                            {listing.features && listing.features.length > 0 && (
                              <div className="flex flex-wrap gap-1 pt-1">
                                {listing.features.slice(0, 3).map((f) => (
                                  <Badge key={f} variant="outline" className="text-[10px] px-1.5 py-0">
                                    {f}
                                  </Badge>
                                ))}
                                {listing.features.length > 3 && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                    +{listing.features.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">No service listings available yet.</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Gallery Tab */}
              <TabsContent value="gallery" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Work Gallery</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {cleaner.gallery.map((image, index) => (
                        <img
                          key={index}
                          src={image}
                          alt={`Gallery ${index + 1}`}
                          className="w-full aspect-[4/3] object-cover rounded-xl hover:scale-105 transition-transform cursor-pointer"
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="mt-6 space-y-6">
                {/* Rating Summary */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="text-center">
                        <div className="font-heading text-5xl font-bold text-foreground">
                          {cleaner.rating}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                "h-5 w-5",
                                star <= Math.round(cleaner.rating)
                                  ? "fill-accent text-accent"
                                  : "text-muted"
                              )}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {cleaner.reviewCount} reviews
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews List */}
                <div className="space-y-4">
                  {cleaner.reviews.map((review) => (
                    <Card key={review.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <img
                            src={review.avatar}
                            alt={review.author}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <h4 className="font-semibold text-foreground">
                                  {review.author}
                                </h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span>{review.service}</span>
                                  <span>•</span>
                                  <span>{review.date}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={cn(
                                      "h-4 w-4",
                                      star <= review.rating
                                        ? "fill-accent text-accent"
                                        : "text-muted"
                                    )}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="mt-3 text-muted-foreground">{review.comment}</p>
                            <Button variant="ghost" size="sm" className="mt-3 gap-1">
                              <ThumbsUp className="h-4 w-4" />
                              Helpful ({review.helpful})
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center">
                  <Button variant="outline">Load More Reviews</Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar - Booking Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Booking Card */}
              <SubscriptionGate hasAccess={canAccessCalendar} message="Subscribe to book cleaners and access calendars">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Book This Cleaner</span>
                    {cleaner.instantBooking && settings.allow_instant_booking && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Instant
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Service Selection */}
                  <div className="space-y-2">
                    <Label>Select Service</Label>
                    <Select value={selectedService} onValueChange={setSelectedService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                      <SelectContent>
                        {cleaner.services.map((service) => (
                          <SelectItem key={service.name} value={service.name}>
                            {service.name} - {currencySymbol}{service.pricePerHour}/hr
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Hours Selection */}
                  {selectedService && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Duration</Label>
                        <span className="text-sm font-medium">{selectedHours} hours</span>
                      </div>
                      <Slider
                        value={[selectedHours]}
                        onValueChange={(value) => setSelectedHours(value[0])}
                        min={settings.min_booking_hours}
                        max={settings.max_booking_hours}
                        step={1}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Min: {settings.min_booking_hours}h • Max: {settings.max_booking_hours}h
                      </p>
                    </div>
                  )}

                  {/* Date Picker */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Select Date</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Book up to {settings.advance_booking_days} days in advance</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !selectedDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            setSelectedTime("");
                          }}
                          disabled={isDateDisabled}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="space-y-2">
                      <Label>Select Time</Label>
                      {availableSlots.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlots.map((slot) => (
                            <Button
                              key={slot}
                              variant={selectedTime === slot ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedTime(slot)}
                              className="w-full"
                            >
                              {slot}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground py-2">
                          No availability on this day. Please select another date.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Address */}
                  <div className="space-y-2">
                    <Label>Your Address</Label>
                    <Input placeholder="Enter your address" />
                  </div>

                  {/* Special Instructions */}
                  <div className="space-y-2">
                    <Label>Special Instructions (Optional)</Label>
                    <Textarea
                      placeholder="Any specific areas to focus on or access instructions..."
                      rows={3}
                    />
                  </div>

                  {/* Payment Method Selection */}
                  <PaymentMethodSelector
                    selectedMethod={selectedPaymentMethod}
                    onMethodChange={setSelectedPaymentMethod}
                  />

                  {/* Price Summary */}
                  {selectedServiceData && (
                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          {selectedServiceData.name} ({selectedHours}h × {currencySymbol}{selectedServiceData.pricePerHour})
                        </span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          Platform fee ({settings.platform_commission_rate}%)
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3 w-3 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This fee helps us maintain the platform and provide support</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span>{formatCurrency(platformFee)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t border-border">
                        <span>Total</span>
                        <span className="text-primary">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button
                    className="w-full"
                    size="lg"
                    variant="cta"
                    disabled={!selectedService || !selectedDate || !selectedTime || !selectedPaymentMethod}
                  >
                    {cleaner.instantBooking && settings.allow_instant_booking && selectedPaymentMethod === "stripe" 
                      ? "Book Now" 
                      : "Request Booking"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Free cancellation up to {settings.cancellation_window_hours} hours before the appointment
                  </p>
                </CardContent>
              </Card>
              </SubscriptionGate>

              {/* Contact Card */}
              <SubscriptionGate hasAccess={canViewContact} message="Subscribe to message providers and view contact info">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full gap-2"
                    disabled={startingChat || !canMessage}
                    onClick={handleSendMessage}
                  >
                    {startingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                    {startingChat ? "Starting Chat..." : "Send Message"}
                  </Button>
                  <Button variant="outline" className="w-full gap-2">
                    <Phone className="h-4 w-4" />
                    Request Call
                  </Button>
                </CardContent>
              </Card>
              </SubscriptionGate>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default CleanerProfile;
