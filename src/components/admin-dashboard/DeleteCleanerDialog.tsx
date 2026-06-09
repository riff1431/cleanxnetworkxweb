import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CleanerProfile {
  id: string;
  user_id: string;
  business_name: string;
}

interface DeleteCleanerDialogProps {
  cleaner: CleanerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCleanerDeleted: (cleanerId: string) => void;
}

export function DeleteCleanerDialog({ cleaner, open, onOpenChange, onCleanerDeleted }: DeleteCleanerDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!cleaner) return;

    setIsDeleting(true);
    try {
      // Update bookings to remove cleaner reference (don't delete customer bookings)
      await supabase
        .from("bookings")
        .update({ cleaner_id: null, cleaner_name: null })
        .eq("cleaner_id", cleaner.user_id);

      // Delete the cleaner profile
      const { error } = await supabase
        .from("cleaner_profiles")
        .delete()
        .eq("id", cleaner.id);

      if (error) throw error;

      onCleanerDeleted(cleaner.id);
      toast.success("Cleaner profile deleted successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting cleaner:", error);
      toast.error("Failed to delete cleaner profile");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Cleaner Profile</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <strong>{cleaner?.business_name}</strong>'s cleaner profile? 
            This will remove their business profile but keep their user account. Existing bookings will be unassigned.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
