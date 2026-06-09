import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle,
  Star,
  TrendingUp,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  service_price: number;
  cleaner_name: string | null;
}

const CleanerDashboardOverview = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    pendingRequests: 0,
    upcomingJobs: 0,
    completedThisMonth: 0,
    monthlyEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data: bookingsData, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("cleaner_id", user.id)
          .order("scheduled_date", { ascending: true });

        if (error) throw error;

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const pending = bookingsData?.filter(b => b.status === "pending") || [];
        const upcoming = bookingsData?.filter(b => 
          b.status === "confirmed" && new Date(b.scheduled_date) >= now
        ) || [];
        const completedThisMonth = bookingsData?.filter(b => 
          b.status === "completed" && new Date(b.scheduled_date) >= startOfMonth
        ) || [];

        const monthlyEarnings = completedThisMonth.reduce(
          (sum, b) => sum + Number(b.service_price), 0
        );

        setBookings(bookingsData || []);
        setStats({
          pendingRequests: pending.length,
          upcomingJobs: upcoming.length,
          completedThisMonth: completedThisMonth.length,
          monthlyEarnings,
        });
      } catch (error) {
        console.error("Error fetching bookings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const upcomingBookings = bookings
    .filter(b => b.status === "confirmed" && new Date(b.scheduled_date) >= new Date())
    .slice(0, 5);

  const pendingRequests = bookings.filter(b => b.status === "pending").slice(0, 5);

  const statCards = [
    {
      title: "Pending Requests",
      value: stats.pendingRequests,
      icon: Clock,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      title: "Upcoming Jobs",
      value: stats.upcomingJobs,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Completed This Month",
      value: stats.completedThisMonth,
      icon: CheckCircle,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    {
      title: "Monthly Earnings",
      value: `$${stats.monthlyEarnings.toFixed(0)}`,
      icon: DollarSign,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

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
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business at a glance.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending Requests */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Pending Requests</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/cleaner/bookings")}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {pendingRequests.length > 0 ? (
              <div className="space-y-3">
                {pendingRequests.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{booking.service_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), "MMM d, yyyy")} at {booking.scheduled_time}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">${Number(booking.service_price).toFixed(0)}</p>
                      <Badge className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No pending requests</p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Jobs */}
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-heading text-lg">Upcoming Jobs</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate("/cleaner/schedule")}>
              View Schedule <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {upcomingBookings.length > 0 ? (
              <div className="space-y-3">
                {upcomingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{booking.service_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), "MMM d, yyyy")} at {booking.scheduled_time}
                      </p>
                    </div>
                    <Badge className={getStatusBadge(booking.status)}>
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No upcoming jobs scheduled</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate("/cleaner/profile")}>
              <Star className="mr-2 h-4 w-4" />
              Update Profile
            </Button>
            <Button variant="outline" onClick={() => navigate("/cleaner/bookings")}>
              <Clock className="mr-2 h-4 w-4" />
              View Requests
            </Button>
            <Button variant="outline" onClick={() => navigate("/cleaner/earnings")}>
              <TrendingUp className="mr-2 h-4 w-4" />
              View Earnings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerDashboardOverview;
