import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, Clock, MessageSquare, DollarSign } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  assigned: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  responded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  booked: "bg-primary/20 text-primary dark:bg-primary/30 dark:text-primary-foreground",
  closed: "bg-muted text-muted-foreground dark:bg-zinc-800 dark:text-zinc-400",
  rejected: "bg-destructive/20 text-destructive dark:bg-destructive/30 dark:text-destructive-foreground",
};

const MyQuotes = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ["my-quote-requests", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests" as any)
        .select("*")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  const { data: responses } = useQuery({
    queryKey: ["quote-responses", selectedQuoteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_responses" as any)
        .select("*")
        .eq("quote_request_id", selectedQuoteId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!selectedQuoteId,
  });

  const acceptMutation = useMutation({
    mutationFn: async ({ responseId, quoteRequestId }: { responseId: string; quoteRequestId: string }) => {
      // Accept the response
      await supabase
        .from("quote_responses" as any)
        .update({ status: "accepted" } as any)
        .eq("id", responseId);
      // Update quote request status to booked
      await supabase
        .from("quote_requests" as any)
        .update({ status: "booked" } as any)
        .eq("id", quoteRequestId);
    },
    onSuccess: () => {
      toast({ title: "Quote accepted!" });
      queryClient.invalidateQueries({ queryKey: ["my-quote-requests"] });
      queryClient.invalidateQueries({ queryKey: ["quote-responses"] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-heading font-bold text-foreground">My Quote Requests</h1>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold text-foreground">My Quote Requests</h1>

      {!quotes?.length ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No quote requests yet. Use the sidebar on the homepage to request a free quote.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {quotes.map((q: any) => (
            <Card key={q.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedQuoteId(q.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{q.quote_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[q.status] || ""}`}>
                        {q.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{q.address}</p>
                    <div className="flex gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {q.preferred_datetime ? format(new Date(q.preferred_datetime), "PPp") : "Flexible"}
                      </span>
                    </div>
                    {q.services && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(Array.isArray(q.services) ? q.services : []).map((s: string) => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(q.created_at), "MMM d")}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedQuoteId} onOpenChange={(open) => !open && setSelectedQuoteId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Provider Responses</DialogTitle>
          </DialogHeader>
          {!responses?.length ? (
            <p className="text-sm text-muted-foreground py-4">No responses yet. Providers will respond soon.</p>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {responses.map((r: any) => (
                <div key={r.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-secondary" />
                      <span className="font-semibold text-foreground">${r.price_amount}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.status === "accepted" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                      r.status === "declined" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                      "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    }`}>
                      {r.status}
                    </span>
                  </div>
                  {r.message && (
                    <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      {r.message}
                    </p>
                  )}
                  {r.status === "sent" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptMutation.mutate({ responseId: r.id, quoteRequestId: selectedQuoteId! });
                      }}
                    >
                      <CheckCircle className="h-3.5 w-3.5 mr-1" /> Accept
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyQuotes;
