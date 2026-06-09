import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { 
  Clock,
  MapPin
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format, isSameDay } from "date-fns";

interface Booking {
  id: string;
  service_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  service_price: number;
  duration_hours: number;
}

const CleanerSchedule = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("cleaner_id", user.id)
          .in("status", ["confirmed", "in_progress"])
          .order("scheduled_date", { ascending: true });

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

  const bookedDates = bookings.map(b => new Date(b.scheduled_date));

  const selectedDateBookings = bookings.filter(b => 
    isSameDay(new Date(b.scheduled_date), selectedDate)
  );

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      in_progress: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
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
        <h1 className="font-heading text-2xl font-bold text-foreground">My Schedule</h1>
        <p className="text-muted-foreground">View and manage your upcoming appointments.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[350px_1fr]">
        {/* Calendar */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              modifiers={{
                booked: bookedDates,
              }}
              modifiersStyles={{
                booked: {
                  fontWeight: "bold",
                  backgroundColor: "hsl(var(--primary) / 0.1)",
                  color: "hsl(var(--primary))",
                },
              }}
              className="rounded-md"
            />
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 rounded bg-primary/10" />
              <span>Days with bookings</span>
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDateBookings.length > 0 ? (
              <div className="space-y-4">
                {selectedDateBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 rounded-xl border border-border bg-muted/30"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {booking.service_type}
                          </h3>
                          <Badge className={getStatusBadge(booking.status)}>
                            {booking.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {booking.scheduled_time} ({booking.duration_hours} hours)
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-foreground">
                          ${Number(booking.service_price).toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold text-lg mb-2">No bookings</h3>
                <p className="text-muted-foreground">
                  You have no appointments scheduled for this day.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Jobs List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-lg">All Upcoming Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => setSelectedDate(new Date(booking.scheduled_date))}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {format(new Date(booking.scheduled_date), "d")}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{booking.service_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), "MMM d")} at {booking.scheduled_time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusBadge(booking.status)}>
                      {booking.status.replace("_", " ")}
                    </Badge>
                    <span className="font-semibold">${Number(booking.service_price).toFixed(0)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No upcoming jobs scheduled. Accept booking requests to see them here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CleanerSchedule;
