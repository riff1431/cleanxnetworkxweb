import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Crown, Star, MapPin, Shield, CheckCircle, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useActiveCleanerOfTheWeek } from "@/hooks/useCleanerOfTheWeek";
import { Skeleton } from "@/components/ui/skeleton";
import RequestQuoteDialog from "@/components/RequestQuoteDialog";

const CleanerOfTheWeekSkeleton = () => (
  <section className="py-10 lg:py-14">
    <div className="container mx-auto px-4">
      <Skeleton className="h-8 w-64 mb-6" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  </section>
);

const CleanerOfTheWeek = () => {
  const { data: entry, isLoading } = useActiveCleanerOfTheWeek();
  const navigate = useNavigate();
  const [quoteOpen, setQuoteOpen] = useState(false);

  if (isLoading) return <CleanerOfTheWeekSkeleton />;
  if (!entry || !entry.cleaner_profiles) return null;

  const cp = entry.cleaner_profiles;
  const location = cp.service_areas?.[0] ?? "Canada";

  return (
    <section className="py-10 lg:py-14 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-primary">Cleaner of the Week</span>
          </div>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Card */}
        <Link
          to={`/cleaner/${cp.id}`}
          className="group block bg-card rounded-2xl border-2 border-primary/20 overflow-hidden hover:border-primary/40 hover:shadow-[0_8px_40px_-8px_hsl(207_70%_35%/0.2)] transition-all duration-300"
        >
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative w-full md:w-80 lg:w-96 aspect-[4/3] md:aspect-auto shrink-0 overflow-hidden">
              {cp.profile_image ? (
                <img
                  src={cp.profile_image}
                  alt={cp.business_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 min-h-[200px]">
                  <Crown className="h-20 w-20 text-primary/20" />
                </div>
              )}

              {/* Crown badge overlay */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm shadow-lg">
                <Crown className="h-4 w-4" />
                Cleaner of the Week
              </div>

              {cp.instant_booking && (
                <Badge className="absolute bottom-3 left-3 bg-secondary/90 text-secondary-foreground">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Instant Booking
                </Badge>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-6 lg:p-8 flex flex-col justify-between">
              <div>
                {/* Name & verification */}
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-heading font-bold text-2xl lg:text-3xl text-foreground group-hover:text-primary transition-colors">
                        {cp.business_name}
                      </h2>
                      {cp.is_verified && (
                        <div className="w-6 h-6 rounded-full bg-secondary/20 flex items-center justify-center" title="Verified">
                          <Shield className="h-4 w-4 text-secondary" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{location}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right shrink-0">
                    <div className="text-xs text-muted-foreground">Starting from</div>
                    <div className="font-bold text-2xl text-primary">${cp.hourly_rate}<span className="text-sm font-normal text-muted-foreground">/hr</span></div>
                  </div>
                </div>

                {/* Stars placeholder row */}
                <div className="flex items-center gap-1.5 mb-4">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">Top rated this week</span>
                </div>

                {/* Bio */}
                {cp.bio && (
                  <p className="text-muted-foreground text-sm leading-relaxed mb-4 line-clamp-3">
                    {cp.bio}
                  </p>
                )}

                {/* Services */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {cp.services.slice(0, 5).map((service) => (
                    <span
                      key={service}
                      className="px-2.5 py-1 bg-muted rounded-lg text-xs text-muted-foreground font-medium"
                    >
                      {service}
                    </span>
                  ))}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {cp.response_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {cp.response_time}
                    </div>
                  )}
                  {cp.years_experience != null && cp.years_experience > 0 && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3.5 w-3.5" />
                      {cp.years_experience} yrs experience
                    </div>
                  )}
                </div>

                {/* Week range */}
                <div className="mt-3 text-xs text-muted-foreground">
                  Featured: {new Date(entry.week_start).toLocaleDateString("en-CA", { month: "short", day: "numeric" })} – {new Date(entry.week_end).toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-border">
                <Button variant="outline" size="lg" className="flex-1 sm:flex-none" onClick={(e) => { e.preventDefault(); setQuoteOpen(true); }}>
                  Request Quote
                </Button>
                <Button variant="secondary" size="lg" className="flex-1 sm:flex-none" onClick={(e) => { e.preventDefault(); navigate(`/cleaner/${cp.id}?action=book`); }}>
                  Book Now
                </Button>
                <Button variant="ghost" size="lg" className="ml-auto gap-1 text-primary hover:text-primary" onClick={(e) => e.preventDefault()}>
                  View Profile
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </div>
      <RequestQuoteDialog
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        cleanerProfileId={cp.id}
        cleanerUserId={cp.user_id}
        cleanerName={cp.business_name}
      />
    </section>
  );
};

export default CleanerOfTheWeek;
