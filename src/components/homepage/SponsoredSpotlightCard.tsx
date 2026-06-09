import { useState } from "react";
import { Star, MapPin, DollarSign, Shield, Clock, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { trackSponsoredClick } from "@/hooks/useSponsoredListings";
import { motion } from "framer-motion";
import bgSponsored from "@/assets/bg-sponsored.png";
import RequestQuoteDialog from "@/components/RequestQuoteDialog";
import BlurImage from "@/components/ui/blur-image";

interface SponsoredCleaner {
  id: string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  startingPrice: number;
  services: string[];
  isVerified: boolean;
  userId?: string;
}

const SponsoredSpotlightCard = ({ cleaner, listingId }: { cleaner: SponsoredCleaner; listingId: string }) => {
  const navigate = useNavigate();
  const [quoteOpen, setQuoteOpen] = useState(false);
  const handleQuoteClick = () => {
    trackSponsoredClick(listingId, "quote");
    if (cleaner.userId) {
      setQuoteOpen(true);
    } else {
      navigate(`/cleaner/${cleaner.id}?action=quote`);
    }
  };
  const handleBookClick = () => trackSponsoredClick(listingId, "book");

  return (
    <>
    <div
      className="rounded-2xl border border-border/50 shadow-lg overflow-hidden relative transition-shadow duration-300 hover:shadow-xl bg-card"
    >
      <img src={bgSponsored} alt="" className="absolute inset-0 w-full h-full object-cover dark:opacity-20" />
      <div className="absolute inset-0 bg-white/60 dark:bg-slate-900/60 backdrop-blur-[2px]" />
      <div className="p-4 sm:p-5 relative z-10">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
          {/* Image */}
          <motion.div
            className="shrink-0"
            whileHover={{ scale: 1.03 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-xl overflow-hidden shadow-md border-2 border-white/80 dark:border-zinc-800/80 ring-1 ring-border/30 transition-shadow duration-300 hover:shadow-xl">
              <BlurImage src={cleaner.image} alt={cleaner.name} className="w-full h-full" />
            </div>
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              <h4 className="font-heading font-bold text-foreground text-lg">{cleaner.name}</h4>
              {cleaner.isVerified && (
                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] px-1.5 py-0 font-semibold">
                  <Shield className="h-3 w-3 mr-0.5" /> Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-3.5 w-3.5 ${i < Math.round(cleaner.rating) ? "fill-amber-400 text-amber-400" : "text-muted"}`} />
                ))}
              </div>
              <span className="font-bold text-sm">{cleaner.rating}</span>
              <span className="flex items-center gap-1 text-sm text-secondary font-semibold">
                <DollarSign className="h-3.5 w-3.5" /> Starting ${cleaner.startingPrice}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              {cleaner.location}
              {cleaner.isVerified && (
                <span className="flex items-center gap-1 ml-3 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> Most responsive
                </span>
              )}
            </div>
          </div>

          {/* CTAs */}
          <div className="shrink-0 flex flex-row sm:flex-col gap-2 sm:gap-2.5 sm:justify-center sm:items-end">
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Button
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-bold px-6 py-2 rounded-lg shadow-sm hover:shadow-md text-sm transition-shadow w-full sm:w-auto"
                onClick={handleQuoteClick}
              >
                Request Quote
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
              <Button
                className="bg-primary hover:bg-primary-dark text-primary-foreground font-bold px-6 py-2 rounded-lg shadow-sm hover:shadow-md text-sm transition-shadow w-full sm:w-auto"
                asChild
                onClick={handleBookClick}
              >
                <Link to={`/cleaner/${cleaner.id}`}>Book Now</Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Bottom Stats Bar */}
        <div className="mt-3 sm:mt-4 pt-3 border-t border-border/40 flex items-center gap-2 sm:gap-4 flex-wrap">
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Clock className="h-3.5 w-3.5" />
            Starting at <span className="text-foreground font-bold">${cleaner.startingPrice}</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <DollarSign className="h-3.5 w-3.5" />
            Consults at <span className="text-foreground font-bold">${cleaner.startingPrice}</span>
          </span>
          <Link
            to={`/cleaner/${cleaner.id}`}
            className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium hover:text-primary transition-colors cursor-pointer"
          >
            <Eye className="h-3.5 w-3.5" />
            Visit
          </Link>
          <motion.div className="ml-auto" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}>
            <Button
              variant="outline"
              size="sm"
              className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground font-semibold text-xs px-4 rounded-lg transition-shadow hover:shadow-md"
              onClick={handleQuoteClick}
            >
              Request Quote <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
    {cleaner.userId && (
      <RequestQuoteDialog
        open={quoteOpen}
        onOpenChange={setQuoteOpen}
        cleanerProfileId={cleaner.id}
        cleanerUserId={cleaner.userId}
        cleanerName={cleaner.name}
      />
    )}
    </>
  );
};

export default SponsoredSpotlightCard;
