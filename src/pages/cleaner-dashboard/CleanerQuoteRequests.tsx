import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { MapPin, Clock, Send, DollarSign } from "lucide-react";

const CleanerQuoteRequests = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [respondingTo, setRespondingTo] = useState<any>(null);
  const [priceAmount, setPriceAmount] = useState("");
  const [message, setMessage] = useState("");

  // Fetch quote requests: new ones + assigned to this provider
  const { data: quoteRequests, isLoading } = useQuery({
    queryKey: ["cleaner-quote-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  // Fetch this provider's existing responses
  const { data: myResponses } = useQuery({
    queryKey: ["my-quote-responses", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_responses" as any)
        .select("*")
        .eq("provider_id", user!.id);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const respondMutation = useMutation({
    mutationFn: async () => {
      if (!priceAmount || parseFloat(priceAmount) <= 0) throw new Error("Valid price required");

      // Insert response
      const { error: respError } = await supabase.from("quote_responses" as any).insert({
        quote_request_id: respondingTo.id,
        provider_id: user!.id,
        price_amount: parseFloat(priceAmount),
        message: message.trim() || null,
        status: "sent",
      } as any);
      if (respError) throw respError;

      // Update quote request status
      await supabase
        .from("quote_requests" as any)
        .update({ status: "responded" } as any)
        .eq("id", respondingTo.id);

      // Create notification for customer if they exist
      if (respondingTo.customer_id) {
        await supabase.from("notifications" as any).insert({
          user_id: respondingTo.customer_id,
          title: "New Quote Response",
          body: `A provider responded to your ${respondingTo.quote_type} quote with $${priceAmount}`,
          link: "/dashboard/quotes",
        } as any);
      }
    },
    onSuccess: () => {
      toast({ title: "Response sent!" });
      setRespondingTo(null);
      setPriceAmount("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["cleaner-quote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["my-quote-responses"] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const respondedIds = new Set(myResponses?.map((r: any) => r.quote_request_id) || []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">Quote Requests</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold text-foreground">Quote Requests</h1>
      <p className="text-sm text-muted-foreground">View incoming quote requests and respond with your pricing.</p>

      {!quoteRequests?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quote requests available at this time.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quoteRequests.map((q: any) => (
            <Card key={q.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{q.quote_type}</span>
                      <Badge variant="outline" className="text-xs">{q.status}</Badge>
                      {respondedIds.has(q.id) && (
                        <Badge variant="success" className="text-xs">Responded</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {q.address}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {q.preferred_datetime ? format(new Date(q.preferred_datetime), "PPp") : "Flexible"}
                    </p>
                    {q.services && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(q.services) ? q.services : []).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                    {q.notes && <p className="text-xs text-muted-foreground mt-1">Notes: {q.notes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(q.created_at), "MMM d")}
                    </span>
                    {!respondedIds.has(q.id) && q.status !== "booked" && q.status !== "closed" && (
                      <Button size="sm" onClick={() => setRespondingTo(q)}>
                        <Send className="h-3.5 w-3.5 mr-1" /> Respond
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Respond Dialog */}
      <Dialog open={!!respondingTo} onOpenChange={(open) => !open && setRespondingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respond to Quote Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
              <p><strong>Type:</strong> {respondingTo?.quote_type}</p>
              <p><strong>Address:</strong> {respondingTo?.address}</p>
              {respondingTo?.services && (
                <p><strong>Services:</strong> {(Array.isArray(respondingTo.services) ? respondingTo.services : []).join(", ")}</p>
              )}
            </div>
            <div>
              <Label>Your Price ($) *</Label>
              <div className="relative mt-1">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="0.00"
                  value={priceAmount}
                  onChange={(e) => setPriceAmount(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Message (optional)</Label>
              <Textarea
                placeholder="Add details about your quote..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1"
                maxLength={500}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>Cancel</Button>
            <Button onClick={() => respondMutation.mutate()} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? "Sending..." : "Send Response"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CleanerQuoteRequests;
