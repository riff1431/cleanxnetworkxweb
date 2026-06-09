import { Star, MapPin, Info, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useActiveCleanerOfTheWeek } from "@/hooks/useCleanerOfTheWeek";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import bgCleanerWeek from "@/assets/bg-cleaner-week.png";
import bgGoldRibbon from "@/assets/bg-gold-ribbon.png";
import BlurImage from "@/components/ui/blur-image";

const CleanerOfTheWeekCard = () => {
  const { data, isLoading } = useActiveCleanerOfTheWeek();
  const revealRef = useScrollReveal<HTMLDivElement>({ y: 50 });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
        <Skeleton className="h-12 w-full" />
        <div className="p-5 flex gap-5">
          <Skeleton className="w-36 h-44 rounded-xl" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.cleaner_profiles) {
    return null;
  }

  const profile = data.cleaner_profiles;
  const reviewCount = 55;

  return (
    <div ref={revealRef}>
      <motion.div
        className="rounded-2xl border border-border/50 shadow-lg overflow-hidden relative transition-shadow duration-300 bg-card"
      >
        {/* Background Image */}
        <img src={bgCleanerWeek} alt="" className="absolute inset-0 w-full h-full object-cover dark:opacity-20" />
        <div className="relative">
          {/* Top Tab Banner */}
          <div className="flex flex-col sm:flex-row items-stretch">
            {/* Gold Tab */}
            <div className="relative flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 text-white font-bold text-xs sm:text-sm tracking-wide shadow-sm overflow-hidden">
              <img src={bgGoldRibbon} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <Crown className="h-4 w-4 fill-current relative z-10" />
              <span className="relative z-10">Cleaner of the Week</span>
            </div>
            {/* Info Strip */}
            <div className="hidden sm:flex items-center gap-3 px-4 py-2.5 glass-subtle text-muted-foreground text-sm flex-1 border-b border-border/30">
              <span className="font-semibold text-foreground/80">sponsored Spotlight✨</span>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-xs font-medium">139 · {reviewCount} reviews</span>
              <motion.div whileHover={{ x: 3 }} transition={{ type: "spring", stiffness: 400 }}>
                <Link
                  to={`/cleaner/${profile.id}`}
                  className="ml-auto flex items-center gap-0.5 text-xs font-medium text-primary hover:text-primary-dark transition-colors"
                >
                  View <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </motion.div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-5">
            {/* Cleaner Image */}
            <motion.div
              className="shrink-0"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-28 h-32 sm:w-36 sm:h-44 rounded-xl overflow-hidden shadow-md border-2 border-white/80 dark:border-zinc-800/80 ring-1 ring-border/30 transition-shadow duration-300 hover:shadow-xl">
                <BlurImage
                  src={profile.profile_image || "https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=300&h=400&fit=crop"}
                  alt={profile.business_name}
                  className="w-full h-full"
                />
              </div>
            </motion.div>

            {/* Details */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground mb-1.5">
                {profile.business_name}
              </h3>
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-sm text-foreground">5.0</span>
                <span className="text-muted-foreground text-sm">{reviewCount} reviews</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2.5">
                <MapPin className="h-4 w-4 text-primary" />
                <span>{profile.service_areas[0] || "Local Area"}</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
                <Info className="h-4 w-4" />
                <span>{profile.services.join(" · ")}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="shrink-0 flex flex-row sm:flex-col gap-2 sm:gap-2.5 justify-start sm:justify-center items-start sm:items-stretch">
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                <Button className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold px-4 sm:px-7 py-2 sm:py-2.5 rounded-lg shadow-sm hover:shadow-md text-xs sm:text-sm transition-shadow w-full">
                  Request Quote
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
                <Button className="bg-primary hover:bg-primary-dark text-primary-foreground font-bold px-4 sm:px-7 py-2 sm:py-2.5 rounded-lg shadow-sm hover:shadow-md text-xs sm:text-sm transition-shadow w-full" asChild>
                  <Link to={`/cleaner/${profile.id}`}>
                    Book Now <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </motion.div>
              <span className="text-xs sm:text-sm text-muted-foreground font-medium text-center sm:text-right">
                Quote · <span className="text-foreground font-bold">${profile.hourly_rate}</span>
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CleanerOfTheWeekCard;
