import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getOrCreateConversation } from "@/hooks/useChatConversations";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ChevronDown, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SERVICE_OPTIONS = [
  "Home Cleaning",
  "Deep Cleaning",
  "Office Cleaning",
  "Carpet Cleaning",
  "Window Cleaning",
  "Move-in/Move-out",
  "Post-Construction",
  "Eco-Friendly Cleaning",
  "Airbnb/Rental",
  "Commercial",
];

const QUOTE_TYPES = ["Residential", "Commercial", "Office", "Deep Clean", "Other"];

interface RequestQuoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cleanerProfileId: string;
  cleanerUserId: string;
  cleanerName: string;
}

const RequestQuoteDialog = ({
  open,
  onOpenChange,
  cleanerProfileId,
  cleanerUserId,
  cleanerName,
}: RequestQuoteDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quoteType, setQuoteType] = useState("Residential");
  const [services, setServices] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [preferredDate, setPreferredDate] = useState<Date | undefined>();
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
    setQuoteType("Residential");
    setServices([]);
    setAddress("");
    setPreferredDate(undefined);
    setNotes("");
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need to be logged in to request a quote.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    if (!address.trim()) {
      toast({ title: "Address required", description: "Please enter your address.", variant: "destructive" });
      return;
    }

    if (services.length === 0) {
      toast({ title: "Select services", description: "Please select at least one service.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the conversation (or get existing)
      const conversationId = await getOrCreateConversation(user.id, cleanerUserId);

      // 2. Build the quote request summary message
      const dateStr = preferredDate ? format(preferredDate, "MMM d, yyyy") : "Flexible";
      const summaryMessage = [
        `📋 **Quote Request**`,
        `🏷️ Type: ${quoteType}`,
        `🧹 Services: ${services.join(", ")}`,
        `📍 ${address}`,
        `📅 Preferred Date: ${dateStr}`,
        notes.trim() ? `📝 Notes: ${notes.trim()}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      // 3. Send the summary message
      const { error: msgError } = await supabase.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        text: summaryMessage,
      });

      if (msgError) throw msgError;

      // 4. Also insert a quote_request record for tracking
      await supabase.from("quote_requests").insert({
        customer_id: user.id,
        address: address.trim(),
        quote_type: quoteType,
        services: services,
        preferred_datetime: preferredDate ? preferredDate.toISOString() : null,
        notes: notes.trim() || null,
        assigned_provider_id: cleanerUserId,
        status: "assigned",
      });

      toast({ title: "Quote requested!", description: `Your request has been sent to ${cleanerName}.` });

      resetForm();
      onOpenChange(false);

      // 5. Navigate to messages with this conversation
      if (user) {
        // Determine which dashboard to use based on role
        navigate(`/dashboard/messages?conversation=${conversationId}`);
      }
    } catch (err: any) {
      console.error("Quote request error:", err);
      toast({ title: "Error", description: err.message || "Failed to send quote request.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">Request Quote from {cleanerName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Quote Type */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Quote Type</Label>
            <Select value={quoteType} onValueChange={setQuoteType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUOTE_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Services */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Services Needed</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-between text-left font-normal",
                    services.length === 0 && "text-muted-foreground"
                  )}
                >
                  {services.length === 0
                    ? "Select services"
                    : `${services.length} service${services.length > 1 ? "s" : ""} selected`}
                  <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <div className="max-h-60 overflow-y-auto p-1">
                  {SERVICE_OPTIONS.map((s) => (
                    <div
                      key={s}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent text-sm"
                      onClick={() => toggleService(s)}
                    >
                      <Checkbox checked={services.includes(s)} onCheckedChange={() => toggleService(s)} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            {services.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {services.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">
                    {s}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Address */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Your Address</Label>
            <Input
              placeholder="Enter your address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Preferred Date */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Preferred Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !preferredDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {preferredDate ? format(preferredDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={preferredDate}
                  onSelect={setPreferredDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Additional Notes</Label>
            <Textarea
              placeholder="Describe what you need..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending...
              </>
            ) : (
              "Send Quote Request"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RequestQuoteDialog;
