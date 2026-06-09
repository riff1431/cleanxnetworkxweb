import { useLocation, useNavigate, Link } from "react-router-dom";
import { format } from "date-fns";
import {
  CheckCircle2,
  MessageSquare,
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

interface BookingConfirmationState {
  bookingId: string;
  conversationId: string;
  serviceName: string;
  cleanerName: string;
  scheduledDate: string;
  scheduledTime: string;
  durationHours: number;
  price: number;
}

const BookingConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as BookingConfirmationState | null;

  if (!state) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center max-w-lg">
          <h1 className="text-2xl font-heading font-bold mb-4">No Booking Found</h1>
          <p className="text-muted-foreground mb-6">
            It looks like you navigated here directly. Please book a service first.
          </p>
          <Button asChild className="rounded-xl">
            <Link to="/services">Browse Services</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const {
    bookingId,
    conversationId,
    serviceName,
    cleanerName,
    scheduledDate,
    scheduledTime,
    durationHours,
    price,
  } = state;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12 max-w-xl">
        {/* Success header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, type: "spring" }}
          className="text-center mb-8"
        >
          <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-secondary/20 to-secondary/5 mb-6">
            <div className="absolute inset-0 rounded-full bg-secondary/10 animate-ping opacity-30" />
            <CheckCircle2 className="h-12 w-12 text-secondary relative" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold text-foreground mb-3">
            Booking Confirmed!
          </h1>
          <p className="text-muted-foreground text-base flex items-center justify-center gap-2">
            <PartyPopper className="h-4 w-4 text-accent" />
            Your cleaning service has been instantly booked.
          </p>
        </motion.div>

        {/* Booking summary card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <Card className="mb-6 shadow-lg border-0 ring-1 ring-border/30 overflow-hidden">
            <CardContent className="p-0">
              {/* Accent bar */}
              <div className="h-1.5 bg-gradient-to-r from-secondary via-secondary-light to-primary" />
              
              <div className="p-6 space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-secondary">
                  <Sparkles className="h-4 w-4" />
                  Instant Booking
                </div>

                <h2 className="text-xl font-heading font-bold text-foreground">{serviceName}</h2>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                      <CalendarDays className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{format(new Date(scheduledDate), "EEEE, MMMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{scheduledTime} · {durationHours} hours</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/40">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">Cleaner: {cleanerName}</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5">
                  <span className="text-muted-foreground font-medium">Total</span>
                  <span className="text-3xl font-extrabold text-primary">${price}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Primary CTA — Chat with Cleaner */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="space-y-4"
        >
          <Button
            size="lg"
            className="w-full h-14 text-base font-bold gap-2 rounded-xl shadow-lg hover:shadow-xl bg-gradient-to-r from-primary to-primary-light text-primary-foreground transform hover:-translate-y-0.5 transition-all duration-300"
            onClick={() => navigate(`/dashboard/messages?conversation=${conversationId}`)}
          >
            <MessageSquare className="h-5 w-5" />
            Chat with Cleaner
          </Button>

          {/* Secondary actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 rounded-xl font-semibold hover:bg-muted/50 transition-all duration-200"
              asChild
            >
              <Link to={`/dashboard/booking/${bookingId}`}>
                View Booking
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-xl font-semibold hover:bg-muted/50 transition-all duration-200"
              asChild
            >
              <Link to="/dashboard/upcoming">
                My Appointments
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default BookingConfirmation;
