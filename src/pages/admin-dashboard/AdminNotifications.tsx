import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow, format } from "date-fns";
import {
  Send,
  Bell,
  Users,
  User,
  Loader2,
  Search,
  CheckCircle,
  Circle,
} from "lucide-react";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NOTIFICATION_TYPES = [
  { value: "general", label: "General" },
  { value: "booking", label: "Booking" },
  { value: "payment", label: "Payment" },
  { value: "message", label: "Message" },
  { value: "job", label: "Job" },
];

const ROLES = [
  { value: "customer", label: "All Customers" },
  { value: "cleaner", label: "All Cleaners" },
  { value: "admin", label: "All Admins" },
];

const AdminNotifications = () => {
  const [sendMode, setSendMode] = useState<"user" | "role">("role");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("customer");
  const [type, setType] = useState("general");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  // Fetch users for individual send
  const { data: users } = useQuery({
    queryKey: ["admin-users-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .order("full_name");
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch recent notifications (admin can see all)
  const { data: recentNotifications, refetch: refetchHistory } = useQuery({
    queryKey: ["admin-notifications-history"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
  });

  // Stats
  const { data: stats } = useQuery({
    queryKey: ["admin-notification-stats"],
    queryFn: async () => {
      const { count: total } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true });

      const { count: unread } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("is_read", false);

      return { total: total || 0, unread: unread || 0 };
    },
  });

  const filteredUsers = users?.filter(
    (u) =>
      !userSearch ||
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleSend = async () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    if (sendMode === "user" && !selectedUserId) {
      toast({ title: "Please select a user", variant: "destructive" });
      return;
    }

    setSending(true);
    try {
      const payload: Record<string, unknown> = {
        type,
        title: title.trim(),
        body: body.trim() || null,
        link: link.trim() || null,
        data: {},
      };

      if (sendMode === "user") {
        payload.action = "send_to_user";
        payload.user_id = selectedUserId;
      } else {
        payload.action = "broadcast_to_role";
        payload.role = selectedRole;
      }

      const { data, error } = await supabase.functions.invoke("send-notification", {
        body: payload,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Notification sent!",
        description:
          sendMode === "role"
            ? `Sent to ${data.sent} ${selectedRole}(s)`
            : "Sent to user",
      });

      // Reset form
      setTitle("");
      setBody("");
      setLink("");
      refetchHistory();
    } catch (err: any) {
      toast({ title: "Failed to send", description: err.message, variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-heading font-bold text-foreground">Notification Management</h1>
        <p className="text-sm text-muted-foreground">
          Compose and send notifications to users or broadcast to roles
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Sent</p>
                <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
              </div>
              <Bell className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-destructive">{stats?.unread ?? 0}</p>
              </div>
              <Circle className="h-8 w-8 text-destructive/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Read</p>
                <p className="text-2xl font-bold text-secondary">
                  {(stats?.total ?? 0) - (stats?.unread ?? 0)}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-secondary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Compose Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Send className="h-4 w-4" />
              Compose Notification
            </CardTitle>
            <CardDescription>Send to a specific user or broadcast to a role</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Send Mode */}
            <Tabs value={sendMode} onValueChange={(v) => setSendMode(v as "user" | "role")}>
              <TabsList className="w-full">
                <TabsTrigger value="role" className="flex-1 gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Broadcast
                </TabsTrigger>
                <TabsTrigger value="user" className="flex-1 gap-1">
                  <User className="h-3.5 w-3.5" />
                  Individual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="role" className="mt-3">
                <div className="space-y-1.5">
                  <Label>Target Role</Label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="user" className="mt-3 space-y-2">
                <Label>Search User</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {(filteredUsers || []).slice(0, 50).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.full_name || u.email || u.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>

            {/* Type */}
            <div className="space-y-1.5">
              <Label>Notification Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NOTIFICATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input
                placeholder="Notification title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label>Body</Label>
              <Textarea
                placeholder="Optional message body..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={3}
              />
            </div>

            {/* Link */}
            <div className="space-y-1.5">
              <Label>Link (optional)</Label>
              <Input
                placeholder="/dashboard/upcoming"
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
            </div>

            <Button
              className="w-full gap-2"
              onClick={handleSend}
              disabled={sending || !title.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {sending ? "Sending..." : "Send Notification"}
            </Button>
          </CardContent>
        </Card>

        {/* History Table */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Recent Notifications</CardTitle>
            <CardDescription>Last 50 notifications sent across the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-auto max-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentNotifications?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No notifications yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentNotifications?.map((n) => (
                      <TableRow key={n.id}>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="text-sm font-medium truncate">{n.title}</p>
                            {n.body && (
                              <p className="text-xs text-muted-foreground truncate">{n.body}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] capitalize">
                            {(n as any).type || "general"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {(n as any).is_read ? (
                            <Badge variant="success" className="text-[10px]">Read</Badge>
                          ) : (
                            <Badge variant="warning" className="text-[10px]">Unread</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminNotifications;
