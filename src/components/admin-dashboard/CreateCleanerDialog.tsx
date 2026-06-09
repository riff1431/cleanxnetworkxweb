import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Search, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const createCleanerSchema = z.object({
  user_id: z.string().min(1, "Please select a user"),
  business_name: z.string().min(1, "Business name is required").max(100, "Business name too long"),
  hourly_rate: z.coerce.number().min(1, "Hourly rate must be at least $1").max(500, "Rate seems too high"),
  bio: z.string().max(1000, "Bio must be less than 1000 characters").optional(),
  years_experience: z.coerce.number().min(0).max(50).optional(),
  services: z.string().min(1, "At least one service is required"),
  service_areas: z.string().min(1, "At least one service area is required"),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  instant_booking: z.boolean(),
});

type CreateCleanerFormData = z.infer<typeof createCleanerSchema>;

interface AvailableUser {
  id: string;
  email: string | null;
  full_name: string | null;
}

interface CleanerProfile {
  id: string;
  user_id: string;
  business_name: string;
  hourly_rate: number;
  bio: string | null;
  years_experience: number | null;
  is_verified: boolean;
  is_active: boolean;
  instant_booking: boolean;
  services: string[];
  service_areas: string[];
  created_at: string;
  response_time: string | null;
}

interface CreateCleanerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanerCreated: (newCleaner: CleanerProfile) => void;
}

export function CreateCleanerDialog({ open, onOpenChange, onCleanerCreated }: CreateCleanerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const form = useForm<CreateCleanerFormData>({
    resolver: zodResolver(createCleanerSchema),
    defaultValues: {
      user_id: "",
      business_name: "",
      hourly_rate: 50,
      bio: "",
      years_experience: 0,
      services: "Home Cleaning",
      service_areas: "",
      is_verified: false,
      is_active: true,
      instant_booking: false,
    },
  });

  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
      form.reset();
      setSearchQuery("");
    }
  }, [open, form]);

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      // Get all users who don't have a cleaner profile yet
      const { data: existingCleaners, error: cleanerError } = await supabase
        .from("cleaner_profiles")
        .select("user_id");

      if (cleanerError) throw cleanerError;

      const existingUserIds = existingCleaners?.map((c) => c.user_id) || [];

      // Get all profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .order("full_name", { ascending: true });

      if (profileError) throw profileError;

      // Filter out users who already have cleaner profiles
      const available = (profiles || []).filter(
        (p) => !existingUserIds.includes(p.id)
      );

      setAvailableUsers(available);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load available users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const filteredUsers = availableUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      (user.full_name?.toLowerCase().includes(searchLower) || false) ||
      (user.email?.toLowerCase().includes(searchLower) || false)
    );
  });

  const onSubmit = async (data: CreateCleanerFormData) => {
    setIsSubmitting(true);
    try {
      const services = data.services.split(",").map((s) => s.trim()).filter(Boolean);
      const service_areas = data.service_areas.split(",").map((s) => s.trim()).filter(Boolean);

      // First, ensure the user has the cleaner role
      const { data: existingRole, error: roleCheckError } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", data.user_id)
        .eq("role", "cleaner")
        .maybeSingle();

      if (roleCheckError) throw roleCheckError;

      // If user doesn't have cleaner role, we need to add it via admin
      // Note: This requires the admin RLS policy to allow inserting roles
      if (!existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: data.user_id,
            role: "cleaner",
          });

        if (roleError) {
          console.error("Error adding cleaner role:", roleError);
          // Continue even if role assignment fails - admin can handle it separately
        }
      }

      // Create the cleaner profile
      const { data: newCleaner, error } = await supabase
        .from("cleaner_profiles")
        .insert({
          user_id: data.user_id,
          business_name: data.business_name,
          hourly_rate: data.hourly_rate,
          bio: data.bio || null,
          years_experience: data.years_experience || null,
          services,
          service_areas,
          is_verified: data.is_verified,
          is_active: data.is_active,
          instant_booking: data.instant_booking,
        })
        .select()
        .single();

      if (error) throw error;

      onCleanerCreated(newCleaner);
      toast.success("Cleaner profile created successfully");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating cleaner:", error);
      if (error.code === "23505") {
        toast.error("This user already has a cleaner profile");
      } else {
        toast.error("Failed to create cleaner profile");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedUser = availableUsers.find((u) => u.id === form.watch("user_id"));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Create Cleaner Profile
          </DialogTitle>
          <DialogDescription>
            Create a new cleaner profile for an existing user. The user will be assigned the cleaner role.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Selection */}
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select User *</FormLabel>
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select a user"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[200px]">
                        {loadingUsers ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="py-4 text-center text-sm text-muted-foreground">
                            {availableUsers.length === 0
                              ? "No users available (all have cleaner profiles)"
                              : "No users match your search"}
                          </div>
                        ) : (
                          filteredUsers.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex flex-col">
                                <span>{user.full_name || "Unnamed User"}</span>
                                <span className="text-xs text-muted-foreground">{user.email}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedUser && (
                    <FormDescription>
                      Selected: {selectedUser.full_name || "Unnamed"} ({selectedUser.email})
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Business Name */}
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Rate and Experience */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($) *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="500" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="years_experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years Experience</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Bio */}
            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter a description of the cleaner's services and experience" 
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Services */}
            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services (comma-separated) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Home Cleaning, Deep Cleaning, Office Cleaning" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter services separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Service Areas */}
            <FormField
              control={form.control}
              name="service_areas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Areas (comma-separated) *</FormLabel>
                  <FormControl>
                    <Input placeholder="Toronto, Mississauga, Brampton" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter service areas separated by commas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Settings */}
            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Status Settings</h4>
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Verified</FormLabel>
                  <p className="text-xs text-muted-foreground">Mark as verified cleaner</p>
                </div>
                <FormField
                  control={form.control}
                  name="is_verified"
                  render={({ field }) => (
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Active</FormLabel>
                  <p className="text-xs text-muted-foreground">Profile visible to customers</p>
                </div>
                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  )}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <FormLabel>Instant Booking</FormLabel>
                  <p className="text-xs text-muted-foreground">Allow bookings without approval</p>
                </div>
                <FormField
                  control={form.control}
                  name="instant_booking"
                  render={({ field }) => (
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  )}
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !form.watch("user_id")}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Cleaner
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
