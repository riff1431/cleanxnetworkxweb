import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Briefcase, 
  DollarSign, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle,
  Clock,
  Zap,
  FileText
} from "lucide-react";
import { format } from "date-fns";

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

interface ViewCleanerDialogProps {
  cleaner: CleanerProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewCleanerDialog({ cleaner, open, onOpenChange }: ViewCleanerDialogProps) {
  if (!cleaner) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-primary" />
            {cleaner.business_name}
          </DialogTitle>
          <DialogDescription>
            Cleaner profile details and business information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant={cleaner.is_verified ? "default" : "secondary"}>
              {cleaner.is_verified ? (
                <><CheckCircle className="h-3 w-3 mr-1" /> Verified</>
              ) : (
                <><XCircle className="h-3 w-3 mr-1" /> Unverified</>
              )}
            </Badge>
            <Badge variant={cleaner.is_active ? "outline" : "destructive"}>
              {cleaner.is_active ? "Active" : "Inactive"}
            </Badge>
            {cleaner.instant_booking && (
              <Badge variant="secondary">
                <Zap className="h-3 w-3 mr-1" /> Instant Booking
              </Badge>
            )}
          </div>

          <Separator />

          {/* Business Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <DollarSign className="h-4 w-4" /> Hourly Rate
              </p>
              <p className="font-semibold text-lg">${cleaner.hourly_rate}/hr</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Experience
              </p>
              <p className="font-semibold text-lg">
                {cleaner.years_experience ? `${cleaner.years_experience} years` : "Not specified"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" /> Response Time
              </p>
              <p className="font-medium">{cleaner.response_time || "Not specified"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> Joined
              </p>
              <p className="font-medium">{format(new Date(cleaner.created_at), "MMM d, yyyy")}</p>
            </div>
          </div>

          <Separator />

          {/* Bio */}
          {cleaner.bio && (
            <>
              <div className="space-y-2">
                <p className="text-sm font-medium flex items-center gap-1">
                  <FileText className="h-4 w-4" /> Bio
                </p>
                <p className="text-sm text-muted-foreground">{cleaner.bio}</p>
              </div>
              <Separator />
            </>
          )}

          {/* Services */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Services Offered</p>
            <div className="flex flex-wrap gap-2">
              {cleaner.services.length > 0 ? (
                cleaner.services.map((service) => (
                  <Badge key={service} variant="outline">
                    {service}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No services listed</p>
              )}
            </div>
          </div>

          {/* Service Areas */}
          <div className="space-y-2">
            <p className="text-sm font-medium flex items-center gap-1">
              <MapPin className="h-4 w-4" /> Service Areas
            </p>
            <div className="flex flex-wrap gap-2">
              {cleaner.service_areas.length > 0 ? (
                cleaner.service_areas.map((area) => (
                  <Badge key={area} variant="secondary">
                    {area}
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No service areas listed</p>
              )}
            </div>
          </div>

          {/* IDs for reference */}
          <Separator />
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Profile ID: {cleaner.id}</p>
            <p>User ID: {cleaner.user_id}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
