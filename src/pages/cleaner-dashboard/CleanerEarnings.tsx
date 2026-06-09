import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, 
  TrendingUp,
  Calendar,
  CheckCircle,
  Info
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string;
  status: string;
  service_price: number;
}

const CleanerEarnings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const { 
    settings, 
    formatCurrency, 
    calculateCleanerEarnings,
    currencySymbol 
  } = usePlatformSettings();

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("cleaner_id", user.id)
          .eq("status", "completed")
          .order("scheduled_date", { ascending: false });

        if (error) throw error;
        setBookings(data || []);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user]);

  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthBookings = bookings.filter(b => {
    const date = new Date(b.scheduled_date);
    return date >= thisMonthStart && date <= thisMonthEnd;
  });

  const lastMonthBookings = bookings.filter(b => {
    const date = new Date(b.scheduled_date);
    return date >= lastMonthStart && date <= lastMonthEnd;
  });

  // Calculate earnings after platform commission
  const calculateNetEarnings = (bookingsList: Booking[]) => {
    return bookingsList.reduce((sum, b) => {
      const grossAmount = Number(b.service_price);
      return sum + calculateCleanerEarnings(grossAmount);
    }, 0);
  };

  const thisMonthGross = thisMonthBookings.reduce((sum, b) => sum + Number(b.service_price), 0);
  const thisMonthNet = calculateNetEarnings(thisMonthBookings);
  const thisMonthCommission = thisMonthGross - thisMonthNet;

  const lastMonthGross = lastMonthBookings.reduce((sum, b) => sum + Number(b.service_price), 0);
  const lastMonthNet = calculateNetEarnings(lastMonthBookings);

  const totalGross = bookings.reduce((sum, b) => sum + Number(b.service_price), 0);
  const totalNet = calculateNetEarnings(bookings);

  const percentChange = lastMonthNet > 0 
    ? ((thisMonthNet - lastMonthNet) / lastMonthNet * 100).toFixed(1)
    : thisMonthNet > 0 ? "100" : "0";

  const statCards = [
    {
      title: "This Month (Net)",
      value: formatCurrency(thisMonthNet),
      subtitle: `${thisMonthBookings.length} jobs • ${currencySymbol}${thisMonthCommission.toFixed(0)} platform fee`,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Last Month (Net)",
      value: formatCurrency(lastMonthNet),
      subtitle: `${lastMonthBookings.length} jobs completed`,
      icon: DollarSign,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Total Earnings (Net)",
      value: formatCurrency(totalNet),
      subtitle: `${bookings.length} total jobs`,
      icon: CheckCircle,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Growth",
      value: `${Number(percentChange) >= 0 ? "+" : ""}${percentChange}%`,
      subtitle: "vs last month",
      icon: TrendingUp,
      color: Number(percentChange) >= 0 ? "text-primary" : "text-destructive",
      bgColor: Number(percentChange) >= 0 ? "bg-primary/10" : "bg-destructive/10",
    },
  ];

  // Group bookings by month for history
  const groupedByMonth = bookings.reduce((acc, booking) => {
    const month = format(new Date(booking.scheduled_date), "MMMM yyyy");
    if (!acc[month]) {
      acc[month] = { bookings: [], grossTotal: 0, netTotal: 0 };
    }
    const gross = Number(booking.service_price);
    acc[month].bookings.push(booking);
    acc[month].grossTotal += gross;
    acc[month].netTotal += calculateCleanerEarnings(gross);
    return acc;
  }, {} as Record<string, { bookings: Booking[]; grossTotal: number; netTotal: number }>);

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
        <h1 className="font-heading text-2xl font-bold text-foreground">Earnings</h1>
        <p className="text-muted-foreground">
          Track your income from completed cleaning jobs.
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 inline-block ml-2 cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Net earnings shown after {settings.platform_commission_rate}% platform fee</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </p>
      </div>

      {/* Commission Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Info className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Platform Commission: {settings.platform_commission_rate}%
              </p>
              <p className="text-sm text-muted-foreground">
                All earnings shown are net amounts after the platform fee is deducted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Earnings History */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">Earnings History</CardTitle>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedByMonth).length > 0 ? (
            <div className="space-y-6">
              {Object.entries(groupedByMonth).map(([month, data]) => (
                <div key={month}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-foreground">{month}</h3>
                    <div className="text-right">
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(data.netTotal)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        Gross: {formatCurrency(data.grossTotal)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {data.bookings.map((booking) => {
                      const gross = Number(booking.service_price);
                      const net = calculateCleanerEarnings(gross);
                      return (
                        <div
                          key={booking.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium text-foreground">{booking.service_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-foreground">
                              {formatCurrency(net)}
                            </span>
                            <p className="text-xs text-muted-foreground">
                              Gross: {formatCurrency(gross)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">No earnings yet</h3>
              <p className="text-muted-foreground">
                Complete jobs to start tracking your earnings here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerEarnings;
