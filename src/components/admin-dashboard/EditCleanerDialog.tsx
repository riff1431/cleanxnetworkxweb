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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const editCleanerSchema = z.object({
  business_name: z.string().min(1, "Business name is required"),
  hourly_rate: z.coerce.number().min(1, "Hourly rate must be at least $1"),
  bio: z.string().optional(),
  years_experience: z.coerce.number().min(0).optional(),
  services: z.string().min(1, "At least one service is required"),
  service_areas: z.string().min(1, "At least one service area is required"),
  is_verified: z.boolean(),
  is_active: z.boolean(),
  instant_booking: z.boolean(),
});

type EditCleanerFormData = z.infer<typeof editCleanerSchema>;

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
}

interface EditCleanerDialogProps {
  cleaner: CleanerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanerUpdated: (updatedCleaner: CleanerProfile) => void;
}

export function EditCleanerDialog({ cleaner, open, onOpenChange, onCleanerUpdated }: EditCleanerDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditCleanerFormData>({
    resolver: zodResolver(editCleanerSchema),
    defaultValues: {
      business_name: "",
      hourly_rate: 50,
      bio: "",
      years_experience: 0,
      services: "",
      service_areas: "",
      is_verified: false,
      is_active: true,
      instant_booking: false,
    },
  });

  useEffect(() => {
    if (cleaner) {
      form.reset({
        business_name: cleaner.business_name,
        hourly_rate: cleaner.hourly_rate,
        bio: cleaner.bio || "",
        years_experience: cleaner.years_experience || 0,
        services: cleaner.services.join(", "),
        service_areas: cleaner.service_areas.join(", "),
        is_verified: cleaner.is_verified,
        is_active: cleaner.is_active,
        instant_booking: cleaner.instant_booking,
      });
    }
  }, [cleaner, form]);

  const onSubmit = async (data: EditCleanerFormData) => {
    if (!cleaner) return;

    setIsSubmitting(true);
    try {
      const services = data.services.split(",").map((s) => s.trim()).filter(Boolean);
      const service_areas = data.service_areas.split(",").map((s) => s.trim()).filter(Boolean);

      const { error } = await supabase
        .from("cleaner_profiles")
        .update({
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
        .eq("id", cleaner.id);

      if (error) throw error;

      onCleanerUpdated({
        ...cleaner,
        business_name: data.business_name,
        hourly_rate: data.hourly_rate,
        bio: data.bio || null,
        years_experience: data.years_experience || null,
        services,
        service_areas,
        is_verified: data.is_verified,
        is_active: data.is_active,
        instant_booking: data.instant_booking,
      });

      toast.success("Cleaner profile updated successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating cleaner:", error);
      toast.error("Failed to update cleaner profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Cleaner Profile</DialogTitle>
          <DialogDescription>
            Update the cleaner's business information and settings.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="business_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter business name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="hourly_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Rate ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
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
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter bio description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="services"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Services (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="Home Cleaning, Deep Cleaning, Office Cleaning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="service_areas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Areas (comma-separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="Toronto, Mississauga, Brampton" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4 rounded-lg border p-4">
              <h4 className="font-medium">Status Settings</h4>
              <div className="flex items-center justify-between">
                <FormLabel>Verified</FormLabel>
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
                <FormLabel>Active</FormLabel>
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
                <FormLabel>Instant Booking</FormLabel>
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
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
