import { useState } from "react";
import { Crown, Plus, ToggleLeft, ToggleRight, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllCleanerOfTheWeek,
  useSetCleanerOfTheWeek,
  useDeactivateCleanerOfTheWeek,
} from "@/hooks/useCleanerOfTheWeek";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek } from "date-fns";

const useAllCleanerProfiles = () =>
  useQuery({
    queryKey: ["cleaner-profiles", "all-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cleaner_profiles")
        .select("id, business_name, service_areas, hourly_rate, is_verified")
        .eq("is_active", true)
        .order("business_name");
      if (error) throw error;
      return data ?? [];
    },
  });

interface SetDialogProps {
  open: boolean;
  onClose: () => void;
}

const SetCleanerOfWeekDialog = ({ open, onClose }: SetDialogProps) => {
  const { data: cleaners = [] } = useAllCleanerProfiles();
  const setMutation = useSetCleanerOfTheWeek();

  const today = new Date();
  const mondayDefault = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const sundayDefault = format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [cleanerProfileId, setCleanerProfileId] = useState("");
  const [weekStart, setWeekStart] = useState(mondayDefault);
  const [weekEnd, setWeekEnd] = useState(sundayDefault);
  const [note, setNote] = useState("");

  const handleSave = async () => {
    if (!cleanerProfileId) return;
    await setMutation.mutateAsync({ cleanerProfileId, weekStart, weekEnd, note });
    onClose();
    setCleanerProfileId("");
    setNote("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Set Cleaner of the Week
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label>Select Cleaner *</Label>
            <Select value={cleanerProfileId} onValueChange={setCleanerProfileId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a cleaner..." />
              </SelectTrigger>
              <SelectContent>
                {cleaners.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="flex items-center gap-2">
                      {c.business_name}
                      <span className="text-xs text-muted-foreground">
                        — {c.service_areas?.[0] ?? "Canada"} · ${c.hourly_rate}/hr
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Week Start</Label>
              <Input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label>Week End</Label>
              <Input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div>
            <Label>Admin Note (optional)</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why this cleaner was selected this week…"
              className="mt-1 resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSave}
            disabled={!cleanerProfileId || setMutation.isPending}
            className="gap-2"
          >
            <Crown className="h-4 w-4" />
            {setMutation.isPending ? "Saving…" : "Set as Cleaner of the Week"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const AdminCleanerOfTheWeek = () => {
  const { data: entries = [], isLoading } = useAllCleanerOfTheWeek();
  const deactivateMutation = useDeactivateCleanerOfTheWeek();
  const [showDialog, setShowDialog] = useState(false);

  const activeEntry = entries.find((e) => e.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            Cleaner of the Week
          </h1>
          <p className="text-muted-foreground mt-1">Highlight a top cleaner on the homepage and search page</p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Set New
        </Button>
      </div>

      {/* Active spotlight card */}
      {activeEntry && activeEntry.cleaner_profiles && (
        <Card className="border-2 border-primary/20 bg-primary/3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Crown className="h-4 w-4 text-primary" />
                Currently Active
              </CardTitle>
              <Badge className="bg-secondary/20 text-secondary border-secondary/30">Live</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              {activeEntry.cleaner_profiles.profile_image ? (
                <img
                  src={activeEntry.cleaner_profiles.profile_image}
                  alt={activeEntry.cleaner_profiles.business_name}
                  className="w-20 h-20 rounded-xl object-cover border border-border shrink-0"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <User className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-lg text-foreground">{activeEntry.cleaner_profiles.business_name}</h3>
                  {activeEntry.cleaner_profiles.is_verified && (
                    <Badge variant="success" className="text-xs">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{activeEntry.cleaner_profiles.service_areas?.[0] ?? "Canada"} · ${activeEntry.cleaner_profiles.hourly_rate}/hr</p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {format(new Date(activeEntry.week_start), "MMM d")} – {format(new Date(activeEntry.week_end), "MMM d, yyyy")}
                </div>
                {activeEntry.note && (
                  <p className="text-xs text-muted-foreground mt-2 italic">"{activeEntry.note}"</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deactivateMutation.mutate(activeEntry.id)}
                disabled={deactivateMutation.isPending}
                className="gap-1.5 text-muted-foreground hover:text-destructive shrink-0"
              >
                <ToggleLeft className="h-4 w-4" />
                Deactivate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!activeEntry && !isLoading && (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Crown className="h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No active Cleaner of the Week</p>
            <p className="text-sm text-muted-foreground">Click "Set New" to feature a cleaner on the homepage and search page.</p>
            <Button onClick={() => setShowDialog(true)} className="mt-2 gap-2">
              <Plus className="h-4 w-4" />
              Set Cleaner of the Week
            </Button>
          </CardContent>
        </Card>
      )}

      {/* History table */}
      {entries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cleaner</TableHead>
                  <TableHead>Week</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.cleaner_profiles?.business_name ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(entry.week_start), "MMM d")} – {format(new Date(entry.week_end), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {entry.note ?? "—"}
                    </TableCell>
                    <TableCell>
                      {entry.is_active ? (
                        <Badge className="bg-secondary/20 text-secondary border-secondary/30">Active</Badge>
                      ) : (
                        <Badge className="bg-muted text-muted-foreground">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {entry.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deactivateMutation.mutate(entry.id)}
                          disabled={deactivateMutation.isPending}
                          className="text-muted-foreground hover:text-destructive gap-1"
                        >
                          <ToggleRight className="h-4 w-4" />
                          Deactivate
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <SetCleanerOfWeekDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </div>
  );
};

export default AdminCleanerOfTheWeek;
