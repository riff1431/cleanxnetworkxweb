import { useState, useCallback } from "react";
import { ChevronDown, Phone, CalendarIcon, Clock, Send, Check } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const QUOTE_TYPES = [
  "Residential",
  "Office",
  "Deep Clean",
  "Airbnb",
  "Construction",
];

const SERVICE_OPTIONS = [
  "Home Cleaning",
  "Office Cleaning",
  "Deep Cleaning",
  "Move In/Out",
  "Post-Construction",
  "Carpet Cleaning",
  "Window Cleaning",
  "Laundry",
];

const TIME_SLOTS = [
  "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM",
  "12:00 PM", "01:00 PM", "02:00 PM", "03:00 PM",
  "04:00 PM", "05:00 PM",
];

const QuoteRequestSidebar = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const revealRef = useScrollReveal<HTMLDivElement>({ y: 30, delay: 0.2 });

  const [address, setAddress] = useState("");
  const [quoteType, setQuoteType] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [preferredDate, setPreferredDate] = useState<Date>();
  const [preferredTime, setPreferredTime] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleService = (service: string) => {
    setServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const resetForm = () => {
    setAddress("");
    setQuoteType("");
    setServices([]);
    setPreferredDate(undefined);
    setPreferredTime("");
    setNotes("");
  };

  const handleSubmit = useCallback(async () => {
    if (!address.trim()) {
      toast({ title: "Address is required", variant: "destructive" });
      return;
    }
    if (!quoteType) {
      toast({ title: "Please select a quote type", variant: "destructive" });
      return;
    }
    if (services.length === 0) {
      toast({ title: "Please select at least one service", variant: "destructive" });
      return;
    }
    if (!preferredDate) {
      toast({ title: "Please select a preferred date", variant: "destructive" });
      return;
    }

    setSubmitting(true);

    let preferredDatetime: string | null = null;
    if (preferredDate) {
      const dateStr = format(preferredDate, "yyyy-MM-dd");
      preferredDatetime = preferredTime
        ? `${dateStr}T${convertTo24h(preferredTime)}:00`
        : `${dateStr}T09:00:00`;
    }

    const { error } = await supabase.from("quote_requests" as any).insert({
      customer_id: user?.id || null,
      address: address.trim(),
      quote_type: quoteType,
      services: services,
      preferred_datetime: preferredDatetime,
      notes: notes.trim() || null,
      status: "new",
    } as any);

    setSubmitting(false);

    if (error) {
      console.error("Quote request error:", error);
      toast({ title: "Failed to submit quote request", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Quote Request Submitted!", description: "We'll match you with available providers shortly." });
    resetForm();
  }, [address, quoteType, services, preferredDate, preferredTime, notes, user, toast]);

  return (
    <div ref={revealRef}>
      <div className="glass-strong rounded-xl shadow-card p-5 transition-shadow duration-300 hover:shadow-card-hover">
        <h3 className="font-heading font-bold text-foreground text-lg mb-4">
          Request a Free Quote
        </h3>

        <div className="space-y-3">
          {/* Address */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Address *</Label>
            <Input
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="h-9 text-sm transition-all duration-200 focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {/* Quote Type */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Quote Type *</Label>
            <Select value={quoteType} onValueChange={setQuoteType}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services Multi-Select Dropdown */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Services *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-between text-left font-normal text-sm",
                    services.length === 0 && "text-muted-foreground"
                  )}
                >
                  {services.length === 0
                    ? "Select services"
                    : `${services.length} service${services.length > 1 ? "s" : ""} selected`}
                  <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="max-h-52 overflow-y-auto p-1">
                  {SERVICE_OPTIONS.map((service) => (
                    <div
                      key={service}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-sm"
                      onClick={() => toggleService(service)}
                    >
                      <Checkbox checked={services.includes(service)} onCheckedChange={() => toggleService(service)} />
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {services.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Preferred Date */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Preferred Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-9 justify-start text-left font-normal text-sm",
                    !preferredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                  {preferredDate ? format(preferredDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={preferredDate}
                  onSelect={setPreferredDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Preferred Time */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Preferred Time</Label>
            <Select value={preferredTime} onValueChange={setPreferredTime}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Notes (optional)</Label>
            <Textarea
              placeholder="Any special instructions or details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[60px] text-sm resize-none transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              maxLength={500}
            />
          </div>
        </div>

        {/* Submit Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4">
          <Button
            variant="secondary"
            className="w-full font-semibold"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              "Submitting..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-1" />
                Submit Quote Request
              </>
            )}
          </Button>
        </motion.div>

        {/* Phone */}
        <div className="flex items-center gap-2 justify-center mt-3 text-xs text-muted-foreground">
          <Phone className="h-3.5 w-3.5" />
          <span>Or call us: 1-800-CLEAN</span>
        </div>
      </div>
    </div>
  );
};

function convertTo24h(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") hours = "00";
  if (modifier === "PM") hours = String(parseInt(hours, 10) + 12);
  return `${hours.padStart(2, "0")}:${minutes}`;
}

export default QuoteRequestSidebar;
