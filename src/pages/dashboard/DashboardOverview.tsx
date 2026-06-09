import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWallet } from "@/hooks/useWallet";
import { useUserSubscription } from "@/hooks/useUserSubscription";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AnimatedCalendar,
  AnimatedCheckCircle,
  AnimatedClock,
  AnimatedMapPin,
  AnimatedPlus,
  AnimatedBriefcase,
  AnimatedWallet,
  AnimatedCrown,
  AnimatedFileText,
  AnimatedFileQuestion,
  AnimatedTrendingUp,
  AnimatedArrowRight,
  AnimatedSparkles,
  AnimatedMessage,
  AnimatedHistory
} from "@/components/dashboard/AnimatedIcons";

interface Booking {
  id: string;
  service_type: string;
  service_price: number;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  cleaner_name: string | null;
  addresses: {
    street_address: string;
    city: string;
  } | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
}

const DashboardOverview = () => {
  const { user } = useAuth();
  const { wallet, loading: walletLoading } = useWallet();
  const { subscription, loading: subLoading } = useUserSubscription();
  const { formatCurrency } = usePlatformSettings();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    upcomingCount: 0,
    completedCount: 0,
    addressesCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    // Generate greeting based on local hour
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 17) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch profile details
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", user.id)
          .single();
        
        setProfile(profileData);

        const today = new Date().toISOString().split("T")[0];

        // Fetch limited upcoming bookings for lists
        const { data: upcoming } = await supabase
          .from("bookings")
          .select(`
            id, service_type, service_price, scheduled_date, scheduled_time, status, cleaner_name,
            addresses ( street_address, city )
          `)
          .eq("customer_id", user.id)
          .gte("scheduled_date", today)
          .in("status", ["pending", "confirmed"])
          .order("scheduled_date", { ascending: true })
          .limit(3);

        setUpcomingBookings(upcoming || []);

        // Fetch limited recent bookings for history
        const { data: recent } = await supabase
          .from("bookings")
          .select(`
            id, service_type, service_price, scheduled_date, scheduled_time, status, cleaner_name,
            addresses ( street_address, city )
          `)
          .eq("customer_id", user.id)
          .eq("status", "completed")
          .order("scheduled_date", { ascending: false })
          .limit(3);

        setRecentBookings(recent || []);

        // Fetch total counts for stats cards
        const { count: upcomingTotal } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user.id)
          .gte("scheduled_date", today)
          .in("status", ["pending", "confirmed"]);

        const { count: completedTotal } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .eq("customer_id", user.id)
          .eq("status", "completed");

        const { count: addressesTotal } = await supabase
          .from("addresses")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id);

        setStats({
          upcomingCount: upcomingTotal || 0,
          completedCount: completedTotal || 0,
          addressesCount: addressesTotal || 0
        });

      } catch (error) {
        console.error("Error fetching dashboard overview data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 gap-1 border-0 hover:bg-emerald-500/25">
            <AnimatedCheckCircle size={12} className="inline-block text-emerald-600 dark:text-emerald-400" /> Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 gap-1 border-0 hover:bg-amber-500/25">
            <AnimatedClock size={12} className="inline-block text-amber-600 dark:text-amber-400" /> Pending
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 gap-1 border-0 hover:bg-blue-500/25">
            <AnimatedCheckCircle size={12} className="inline-block text-blue-600 dark:text-blue-400" /> Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge variant="destructive" className="gap-1 border-0">
            <AlertCircle className="h-3 w-3" /> Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || walletLoading || subLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl animate-pulse" />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-72 rounded-2xl animate-pulse" />
            <Skeleton className="h-72 rounded-2xl animate-pulse" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 rounded-2xl animate-pulse" />
            <Skeleton className="h-72 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const userFirstName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "User";

  const statCards = [
    {
      label: "Upcoming Cleanings",
      value: stats.upcomingCount,
      subtitle: stats.upcomingCount === 1 ? "1 service scheduled" : `${stats.upcomingCount} services scheduled`,
      icon: AnimatedCalendar,
      gradient: "from-blue-500 to-indigo-600",
      bgLight: "bg-blue-50/70 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
      textColor: "text-blue-600 dark:text-blue-400"
    },
    {
      label: "Completed Services",
      value: stats.completedCount,
      subtitle: "Lifetime cleanings done",
      icon: AnimatedCheckCircle,
      gradient: "from-emerald-500 to-teal-600",
      bgLight: "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
      textColor: "text-emerald-600 dark:text-emerald-400"
    },
    {
      label: "Next Booking Date",
      value: upcomingBookings.length > 0
        ? format(new Date(upcomingBookings[0].scheduled_date), "MMM d")
        : "—",
      subtitle: upcomingBookings.length > 0
        ? upcomingBookings[0].scheduled_time
        : "No upcoming cleanings",
      icon: AnimatedClock,
      gradient: "from-amber-500 to-orange-600",
      bgLight: "bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
      textColor: "text-amber-600 dark:text-amber-400"
    },
    {
      label: "Saved Locations",
      value: stats.addressesCount,
      subtitle: stats.addressesCount === 1 ? "1 location saved" : `${stats.addressesCount} locations saved`,
      icon: AnimatedMapPin,
      gradient: "from-rose-500 to-pink-600",
      bgLight: "bg-rose-50/70 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
      textColor: "text-rose-600 dark:text-rose-400"
    }
  ];

  const quickActions = [
    {
      title: "Book Cleaning",
      desc: "Find and book local cleaners",
      href: "/search",
      icon: AnimatedSparkles,
      color: "from-emerald-500 to-teal-600",
      bg: "bg-emerald-500/10 text-emerald-600"
    },
    {
      title: "Post a Job",
      desc: "Post a custom request details",
      href: "/dashboard/my-jobs",
      icon: AnimatedBriefcase,
      color: "from-blue-500 to-indigo-600",
      bg: "bg-blue-500/10 text-blue-600"
    },
    {
      title: "Get a Quote",
      desc: "Ask pricing from top agencies",
      href: "/dashboard/quotes",
      icon: AnimatedFileQuestion,
      color: "from-amber-500 to-orange-600",
      bg: "bg-amber-500/10 text-amber-600"
    },
    {
      title: "Manage Invoices",
      desc: "View receipts & payments",
      href: "/dashboard/invoices",
      icon: AnimatedFileText,
      color: "from-rose-500 to-pink-600",
      bg: "bg-rose-500/10 text-rose-600"
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Personalized Glowing Greeting Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-primary-light to-secondary/90 text-primary-foreground p-6 md:p-8 shadow-xl border border-primary/20"
      >
        {/* Glow ambient background graphics */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full filter blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-secondary-light/20 rounded-full filter blur-3xl -ml-16 -mb-16 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight flex items-center gap-2">
              {greeting}, {userFirstName}!
              <motion.span
                animate={{ rotate: [0, 15, -15, 15, 0] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                className="inline-block"
              >
                👋
              </motion.span>
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base font-medium">
              {upcomingBookings.length > 0
                ? `You have a cleaning scheduled on ${format(new Date(upcomingBookings[0].scheduled_date), "MMMM d")} at ${upcomingBookings[0].scheduled_time}. Ready to refresh your space?`
                : "Keep your home pristine and sparkling. Browse rated local cleaner profiles and book instantly."
              }
            </p>
            {subscription && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm text-xs font-bold text-white border border-white/10">
                <AnimatedCrown size={12} className="text-yellow-400" />
                Active Premium Plan: <span className="underline">{subscription.plan?.name}</span>
              </div>
            )}
          </div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="shrink-0"
          >
            <Button asChild variant="cta" size="lg" className="shadow-lg hover:shadow-xl font-bold bg-white text-primary hover:bg-white/95 border-0 rounded-xl px-6">
              <Link to="/search">
                <AnimatedPlus size={16} className="mr-2" />
                Book a Cleaning
              </Link>
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Grid of Dynamic Stat Cards */}
      <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: idx * 0.05 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className={`group rounded-2xl border ${stat.bgLight} p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                <p className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md group-hover:shadow-lg transition-all`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between text-xs text-muted-foreground">
              <span>{stat.subtitle}</span>
              <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-[-4px] group-hover:translate-x-0 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout: Main Section vs Widget Sidebar */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        
        {/* Left main: Cleanings Trackers & History */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Upcoming Cleanings or Active Tracker */}
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card/65 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <AnimatedCalendar size={18} className="text-primary" />
                  Upcoming Cleanings
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Track your ongoing and scheduled cleaning bookings</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary hover:bg-primary/5 rounded-lg">
                <Link to="/dashboard/upcoming" className="flex items-center gap-1">
                  View All
                  <AnimatedArrowRight size={14} />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {upcomingBookings.length > 0 ? (
                <div className="space-y-6">
                  
                  {/* Clean step-by-step timeline tracker for the NEXT booking */}
                  <div className="bg-muted/30 dark:bg-muted/10 p-5 rounded-2xl border border-border/40 relative overflow-hidden">
                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active</span>
                    </div>

                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Next Cleaning Tracker</h4>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-4 mb-4">
                      <div>
                        <h3 className="font-extrabold text-base text-foreground">{upcomingBookings[0].service_type}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          <AnimatedMapPin size={12} />
                          {upcomingBookings[0].addresses?.street_address}, {upcomingBookings[0].addresses?.city}
                        </p>
                      </div>
                      <div className="text-left md:text-right">
                        <div className="text-lg font-black text-primary">{formatCurrency(upcomingBookings[0].service_price)}</div>
                        <p className="text-xs text-muted-foreground">
                          {upcomingBookings[0].cleaner_name ? `Cleaner: ${upcomingBookings[0].cleaner_name}` : "Cleaner pending assignment"}
                        </p>
                      </div>
                    </div>

                    {/* Progress Nodes Timeline */}
                    <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-2 mt-2">
                      {/* Connecting Line */}
                      <div className="hidden md:block absolute left-4 right-4 top-1/2 h-1 bg-border -translate-y-1/2 z-0" />
                      <div
                        className="hidden md:block absolute left-4 top-1/2 h-1 bg-gradient-to-r from-primary to-secondary -translate-y-1/2 z-0 transition-all duration-500"
                        style={{ width: upcomingBookings[0].status === "confirmed" ? "50%" : "10%" }}
                      />

                      {/* Node 1: Booked */}
                      <div className="relative z-10 flex items-center md:flex-col gap-3 md:gap-1.5 flex-1">
                        <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-md">
                          1
                        </div>
                        <div className="text-left md:text-center">
                          <p className="text-xs font-bold text-foreground leading-tight">Booking Created</p>
                          <p className="text-[10px] text-muted-foreground">Order submitted successfully</p>
                        </div>
                      </div>

                      {/* Node 2: Assigned / Confirmed */}
                      <div className="relative z-10 flex items-center md:flex-col gap-3 md:gap-1.5 flex-1">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs shadow-md transition-all ${
                          upcomingBookings[0].status === "confirmed"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}>
                          {upcomingBookings[0].status === "confirmed" ? "✓" : "2"}
                        </div>
                        <div className="text-left md:text-center">
                          <p className={`text-xs font-bold leading-tight ${upcomingBookings[0].status === "confirmed" ? "text-foreground" : "text-muted-foreground"}`}>
                            Confirmed
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {upcomingBookings[0].cleaner_name ? "Cleaner assigned" : "Reviewing cleaner match"}
                          </p>
                        </div>
                      </div>

                      {/* Node 3: Cleaning in Progress */}
                      <div className="relative z-10 flex items-center md:flex-col gap-3 md:gap-1.5 flex-1">
                        <div className="h-8 w-8 rounded-full bg-muted text-muted-foreground border border-border flex items-center justify-center font-bold text-xs shadow-md">
                          3
                        </div>
                        <div className="text-left md:text-center">
                          <p className="text-xs font-bold text-muted-foreground leading-tight">In Progress</p>
                          <p className="text-[10px] text-muted-foreground">Scheduled for {upcomingBookings[0].scheduled_time}</p>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* List of remaining bookings if any */}
                  {upcomingBookings.length > 1 && (
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Other Scheduled Cleanings</h4>
                      {upcomingBookings.slice(1).map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-bold text-sm text-foreground">{booking.service_type}</h4>
                              {getStatusBadge(booking.status)}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <AnimatedCalendar size={12} />
                                {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                              </span>
                              <span className="flex items-center gap-1">
                                <AnimatedClock size={12} />
                                {booking.scheduled_time}
                              </span>
                            </div>
                          </div>
                          <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center shrink-0">
                            <div className="font-extrabold text-primary text-sm">{formatCurrency(booking.service_price)}</div>
                            {booking.cleaner_name && (
                              <div className="text-[10px] text-muted-foreground">Cleaner: {booking.cleaner_name}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border/80">
                  <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/15 w-16 h-16 flex items-center justify-center mx-auto mb-4 text-primary shadow-sm">
                    <AnimatedSparkles size={24} />
                  </div>
                  <h3 className="font-bold text-base mb-1 text-foreground">No upcoming cleanings scheduled</h3>
                  <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">
                    Keep your house fresh and tidy. Book a professional cleaner in your area in seconds!
                  </p>
                  <Button asChild size="sm" className="rounded-xl shadow-md">
                    <Link to="/search">Find a Cleaner</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent History List */}
          <Card className="rounded-2xl border-0 shadow-sm overflow-hidden bg-card/65 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/10">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <AnimatedHistory size={18} className="text-primary" />
                  Recent History
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Browse cleanings completed in the past</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild className="gap-1 text-xs text-primary hover:bg-primary/5 rounded-lg">
                <Link to="/dashboard/history" className="flex items-center gap-1">
                  View All
                  <AnimatedArrowRight size={14} />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              {recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/40 bg-muted/10 hover:bg-muted/30 transition-all duration-200"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-foreground">{booking.service_type}</h4>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <AnimatedCalendar size={12} />
                            {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                          </span>
                          {booking.cleaner_name && (
                            <span className="flex items-center gap-1">
                              Cleaner: {booking.cleaner_name}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 gap-2">
                        <div className="font-bold text-foreground text-sm">{formatCurrency(booking.service_price)}</div>
                        <Button variant="outline" size="sm" asChild className="h-8 rounded-lg text-xs border-primary text-primary hover:bg-primary hover:text-white transition-colors">
                          <Link to="/search">Book Again</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/10 rounded-2xl border border-dashed border-border/80">
                  <div className="rounded-2xl bg-muted/50 w-16 h-16 flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                    <AnimatedHistory size={24} />
                  </div>
                  <h3 className="font-bold text-base mb-1 text-foreground">No cleaning history yet</h3>
                  <p className="text-xs text-muted-foreground">
                    Completed cleanings will be listed here with receipts.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* Right column: Wallet Card & Quick Actions */}
        <div className="space-y-6">

          {/* Virtual Wallet "TCN Premium Pass" Glass Card */}
          <motion.div
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 shadow-xl border border-slate-800"
          >
            {/* Embedded glowing circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full filter blur-2xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-secondary/10 rounded-full filter blur-xl pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-44">
              
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">TCN Digital Wallet</p>
                  <h3 className="font-heading text-sm font-extrabold text-white mt-0.5 tracking-tight">The Cleaning Network</h3>
                </div>
                <AnimatedWallet size={24} className="text-indigo-400" />
              </div>

              <div>
                <p className="text-[10px] text-slate-400 font-medium">Available Balance</p>
                <p className="text-3xl font-black tracking-tight mt-0.5 text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-indigo-200">
                  {formatCurrency(wallet?.balance || 0)}
                </p>
              </div>

              <div className="flex items-end justify-between border-t border-white/10 pt-3">
                <div className="text-[10px] text-slate-400">
                  <p className="leading-none">Member Account</p>
                  <p className="font-mono text-white mt-1">**** {user?.id.slice(-4) || "0000"}</p>
                </div>
                <Button size="sm" asChild className="h-8 rounded-lg text-xs bg-white text-slate-950 hover:bg-slate-100 font-bold px-3 shadow-md border-0">
                  <Link to="/dashboard/wallet">
                    <AnimatedPlus size={12} className="mr-1" />
                    Top Up
                  </Link>
                </Button>
              </div>

            </div>
          </motion.div>

          {/* Quick Actions Panel */}
          <Card className="rounded-2xl border-0 shadow-sm bg-card/65 backdrop-blur-sm">
            <CardHeader className="pb-3 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 px-4">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.title}
                    to={action.href}
                    className="group flex flex-col justify-between p-3.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/50 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
                  >
                    <div className={`p-2.5 rounded-lg w-fit ${action.bg} shadow-inner`}>
                      <action.icon size={16} />
                    </div>
                    <div className="mt-4">
                      <h4 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-0.5">
                        {action.title}
                        <ArrowUpRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-0.5 group-hover:translate-y-[-0.5px]" />
                      </h4>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{action.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Membership Status Info */}
          <Card className="rounded-2xl border-0 shadow-sm bg-card/65 backdrop-blur-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <AnimatedCrown size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Membership Benefits</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {subscription
                      ? `Enjoying ${subscription.plan?.booking_discount_percent || 0}% discount on bookings!`
                      : "Unlock priority matching & booking discounts"
                    }
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full mt-4 rounded-xl border-dashed border-2 hover:border-solid hover:bg-primary hover:text-white transition-all">
                <Link to="/dashboard/subscription" className="flex items-center justify-center gap-1.5 text-xs">
                  {subscription ? "View Subscription Plan" : "Upgrade to Premium Pass"}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
};

export default DashboardOverview;
