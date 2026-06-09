import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CalendarCheck, DollarSign, TrendingUp, Clock, Zap, Eye, MousePointerClick, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  Tooltip,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { format, eachDayOfInterval, startOfDay, startOfMonth, subMonths, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangeFilter } from "@/components/admin-dashboard/DateRangeFilter";

interface SponsoredStat {
  name: string;
  views: number;
  quotes: number;
  books: number;
}

interface DashboardStats {
  totalUsers: number;
  totalCleaners: number;
  totalBookings: number;
  pendingBookings: number;
}

interface BookingsByDate {
  date: string;
  bookings: number;
}

interface RevenueByDate {
  date: string;
  revenue: number;
}

interface BookingStatusData {
  name: string;
  value: number;
  color: string;
}

interface RoleDistribution {
  role: string;
  count: number;
}

interface RevenueSummary {
  thisMonth: number;
  lastMonth: number;
  total: number;
  filtered: number;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(var(--chart-1))",
  confirmed: "hsl(var(--chart-2))",
  in_progress: "hsl(var(--chart-3))",
  completed: "hsl(var(--chart-4))",
  cancelled: "hsl(var(--chart-5))",
};

const ROLE_COLORS: Record<string, string> = {
  customer: "hsl(var(--chart-1))",
  cleaner: "hsl(var(--chart-2))",
  company: "hsl(var(--chart-3))",
  admin: "hsl(var(--chart-4))",
};

const AdminDashboardOverview = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCleaners: 0,
    totalBookings: 0,
    pendingBookings: 0,
  });
  const [bookingsTrend, setBookingsTrend] = useState<BookingsByDate[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<RevenueByDate[]>([]);
  const [bookingStatuses, setBookingStatuses] = useState<BookingStatusData[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [revenueSummary, setRevenueSummary] = useState<RevenueSummary>({ thisMonth: 0, lastMonth: 0, total: 0, filtered: 0 });
  const [sponsoredStats, setSponsoredStats] = useState<SponsoredStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        await Promise.all([
          fetchStats(),
          fetchBookingsTrend(),
          fetchRevenueTrend(),
          fetchBookingStatuses(),
          fetchRoleDistribution(),
          fetchSponsoredStats(),
        ]);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dateRange]);

  const fetchStats = async () => {
    const [userRes, cleanerRes, bookingRes, pendingRes] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("cleaner_profiles").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }),
      supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
    ]);

    setStats({
      totalUsers: userRes.count || 0,
      totalCleaners: cleanerRes.count || 0,
      totalBookings: bookingRes.count || 0,
      pendingBookings: pendingRes.count || 0,
    });
  };

  const fetchBookingsTrend = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("created_at")
      .gte("created_at", dateRange.from.toISOString())
      .lte("created_at", dateRange.to.toISOString());

    const dateRangeInterval = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    const bookingCounts = new Map<string, number>();
    bookings?.forEach((booking) => {
      const date = format(startOfDay(new Date(booking.created_at)), "yyyy-MM-dd");
      bookingCounts.set(date, (bookingCounts.get(date) || 0) + 1);
    });

    const trendData = dateRangeInterval.map((date) => ({
      date: format(date, "MMM dd"),
      bookings: bookingCounts.get(format(date, "yyyy-MM-dd")) || 0,
    }));

    setBookingsTrend(trendData);
  };

  const fetchRevenueTrend = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const thisMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = subDays(thisMonthStart, 1);

    const { data: bookings } = await supabase
      .from("bookings")
      .select("scheduled_date, service_price, status")
      .eq("status", "completed");

    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;
    let totalRevenue = 0;
    let filteredRevenue = 0;

    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.scheduled_date);
      const price = Number(booking.service_price);
      totalRevenue += price;

      if (bookingDate >= thisMonthStart) {
        thisMonthRevenue += price;
      } else if (bookingDate >= lastMonthStart && bookingDate <= lastMonthEnd) {
        lastMonthRevenue += price;
      }

      if (dateRange?.from && dateRange?.to && bookingDate >= dateRange.from && bookingDate <= dateRange.to) {
        filteredRevenue += price;
      }
    });

    setRevenueSummary({
      thisMonth: thisMonthRevenue,
      lastMonth: lastMonthRevenue,
      total: totalRevenue,
      filtered: filteredRevenue,
    });

    const dateRangeInterval = eachDayOfInterval({
      start: dateRange.from,
      end: dateRange.to,
    });

    const revenueCounts = new Map<string, number>();
    bookings?.forEach((booking) => {
      const bookingDate = new Date(booking.scheduled_date);
      if (dateRange?.from && dateRange?.to && bookingDate >= dateRange.from && bookingDate <= dateRange.to) {
        const date = format(bookingDate, "yyyy-MM-dd");
        revenueCounts.set(date, (revenueCounts.get(date) || 0) + Number(booking.service_price));
      }
    });

    const trendData = dateRangeInterval.map((date) => ({
      date: format(date, "MMM dd"),
      revenue: revenueCounts.get(format(date, "yyyy-MM-dd")) || 0,
    }));

    setRevenueTrend(trendData);
  };

  const fetchBookingStatuses = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    const { data: bookings } = await supabase
      .from("bookings")
      .select("status, created_at")
      .gte("created_at", dateRange.from.toISOString())
      .lte("created_at", dateRange.to.toISOString());

    const statusCounts = new Map<string, number>();
    bookings?.forEach((booking) => {
      statusCounts.set(booking.status, (statusCounts.get(booking.status) || 0) + 1);
    });

    const statusData: BookingStatusData[] = Array.from(statusCounts.entries()).map(([status, count]) => ({
      name: status.replace("_", " ").charAt(0).toUpperCase() + status.replace("_", " ").slice(1),
      value: count,
      color: STATUS_COLORS[status] || "hsl(var(--muted))",
    }));

    setBookingStatuses(statusData);
  };

  const fetchRoleDistribution = async () => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role");

    const roleCounts = new Map<string, number>();
    roles?.forEach((r) => {
      roleCounts.set(r.role, (roleCounts.get(r.role) || 0) + 1);
    });

    const roleData: RoleDistribution[] = Array.from(roleCounts.entries()).map(([role, count]) => ({
      role: role.charAt(0).toUpperCase() + role.slice(1),
      count,
    }));

    setRoleDistribution(roleData);
  };

  const fetchSponsoredStats = async () => {
    const { data } = await supabase
      .from("sponsored_listings")
      .select(`
        sponsored_views_count,
        sponsored_quote_clicks,
        sponsored_book_clicks,
        cleaner_profiles ( business_name )
      `)
      .order("sponsored_views_count", { ascending: false });

    const stats: SponsoredStat[] = (data ?? []).map((row: any) => ({
      name: row.cleaner_profiles?.business_name ?? "Unknown",
      views: row.sponsored_views_count,
      quotes: row.sponsored_quote_clicks,
      books: row.sponsored_book_clicks,
    }));
    setSponsoredStats(stats);
  };


  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Registered customers",
      icon: Users,
      color: "text-primary bg-primary/10",
    },
    {
      title: "Active Cleaners",
      value: stats.totalCleaners,
      description: "Service providers",
      icon: Briefcase,
      color: "text-secondary bg-secondary/10",
    },
    {
      title: "Total Bookings",
      value: stats.totalBookings,
      description: "All time bookings",
      icon: CalendarCheck,
      color: "text-primary bg-primary/10",
    },
    {
      title: "Pending Bookings",
      value: stats.pendingBookings,
      description: "Awaiting confirmation",
      icon: Clock,
      color: "text-destructive bg-destructive/10",
    },
  ];

  const chartConfig = {
    bookings: {
      label: "Bookings",
      color: "hsl(var(--primary))",
    },
    revenue: {
      label: "Revenue",
      color: "hsl(var(--chart-2))",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome to the admin panel. Monitor platform activity.</p>
        </div>
        <DateRangeFilter dateRange={dateRange} onDateRangeChange={setDateRange} />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <stat.icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? "..." : stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bookings Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Bookings Trend
          </CardTitle>
          <CardDescription>
            Daily booking activity {dateRange?.from && dateRange?.to && `from ${format(dateRange.from, "MMM dd")} to ${format(dateRange.to, "MMM dd, yyyy")}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookingsTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorBookings)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Revenue Analytics
          </CardTitle>
          <CardDescription>
            Daily earnings from completed bookings {dateRange?.from && dateRange?.to && `(${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd, yyyy")})`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  className="text-muted-foreground"
                  tickFormatter={(value) => `$${value}`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Two Column Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Booking Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Booking Status
            </CardTitle>
            <CardDescription>Distribution of booking statuses in selected range</CardDescription>
          </CardHeader>
          <CardContent>
            {bookingStatuses.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bookingStatuses}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {bookingStatuses.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [value, "Bookings"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => (
                        <span className="text-sm text-muted-foreground">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No booking data available for selected range
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Roles
            </CardTitle>
            <CardDescription>Distribution of user roles</CardDescription>
          </CardHeader>
          <CardContent>
            {roleDistribution.length > 0 ? (
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleDistribution} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="role"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [value, "Users"]}
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {roleDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={ROLE_COLORS[entry.role.toLowerCase()] || "hsl(var(--primary))"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No role data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sponsored Spotlight Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent" />
                Sponsored Spotlight Performance
              </CardTitle>
              <CardDescription>Cumulative views, quote requests &amp; bookings per sponsored listing</CardDescription>
            </div>
            {/* Totals strip */}
            {sponsoredStats.length > 0 && (
              <div className="flex gap-4 flex-wrap">
                {[
                  { icon: Eye, label: "Total Views", value: sponsoredStats.reduce((s, l) => s + l.views, 0) },
                  { icon: BookOpen, label: "Total Quotes", value: sponsoredStats.reduce((s, l) => s + l.quotes, 0) },
                  { icon: MousePointerClick, label: "Total Books", value: sponsoredStats.reduce((s, l) => s + l.books, 0) },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center gap-1.5 text-sm">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sponsoredStats.length === 0 ? (
            <div className="h-[280px] flex flex-col items-center justify-center text-muted-foreground gap-2">
              <Zap className="h-8 w-8 text-muted-foreground/30" />
              <p>No sponsored listings yet. Activate sponsorships to see analytics.</p>
            </div>
          ) : (
            <ChartContainer
              config={{
                views: { label: "Views", color: "hsl(var(--primary))" },
                quotes: { label: "Quotes", color: "hsl(var(--secondary))" },
                books: { label: "Bookings", color: "hsl(var(--accent))" },
              }}
              className="h-[280px] w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sponsoredStats} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    className="text-muted-foreground"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    className="text-muted-foreground"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend
                    verticalAlign="top"
                    height={32}
                    formatter={(value) => (
                      <span className="text-xs text-muted-foreground capitalize">{value}</span>
                    )}
                  />
                  <Bar dataKey="views" name="Views" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quotes" name="Quotes" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="books" name="Bookings" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      {/* Platform Health & Revenue */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Platform Health
            </CardTitle>
            <CardDescription>System status and metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Database Status</span>
                <span className="text-sm font-medium text-secondary">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Auth Service</span>
                <span className="text-sm font-medium text-secondary">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Storage</span>
                <span className="text-sm font-medium text-secondary">Operational</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Revenue Summary
            </CardTitle>
            <CardDescription>Platform earnings overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Selected Range</span>
                <span className="text-sm font-medium text-primary">${revenueSummary.filtered.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">This Month</span>
                <span className="text-sm font-medium">${revenueSummary.thisMonth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Last Month</span>
                <span className="text-sm font-medium">${revenueSummary.lastMonth.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Revenue</span>
                <span className="text-sm font-medium">${revenueSummary.total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardOverview;
