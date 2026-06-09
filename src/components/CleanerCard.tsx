import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, MapPin, Shield, Clock, Heart, CheckCircle, Crown, Zap, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import RequestQuoteDialog from "@/components/RequestQuoteDialog";
import BlurImage from "@/components/ui/blur-image";

export interface Cleaner {
  id: number | string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  services: string[];
  priceFrom: number;
  verified: boolean;
  featured: boolean;
  instantBooking: boolean;
  responseTime: string;
  description: string;
  subscriptionTier?: "basic" | "pro" | "premium";
  userId?: string;
}

type SubscriptionTierConfig = {
  label: string;
  icon: React.ElementType;
  badgeClass: string;
  benefits: string[];
};

const SUBSCRIPTION_TIER_CONFIG: Record<string, SubscriptionTierConfig> = {
  basic: {
    label: "Member",
    icon: Shield,
    badgeClass: "bg-muted text-muted-foreground border-border",
    benefits: ["Verified listing", "Priority support"],
  },
  pro: {
    label: "Pro",
    icon: Zap,
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    benefits: ["Priority listing", "Verification badge", "Reduced commission", "Analytics access"],
  },
  premium: {
    label: "Premium",
    icon: Crown,
    badgeClass: "bg-accent/15 text-accent-foreground border-accent/30",
    benefits: ["Top listing boost", "Verification badge", "Max commission discount", "Full analytics"],
  },
};

interface CleanerCardProps {
  cleaner: Cleaner;
  variant?: "grid" | "list";
}

const SubscriptionTierBadge = ({ tier }: { tier: string }) => {
  const config = SUBSCRIPTION_TIER_CONFIG[tier];
  if (!config) return null;
  const Icon = config.icon;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border cursor-default",
            config.badgeClass
          )}>
            <Icon className="h-3 w-3" />
            {config.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-semibold mb-1 capitalize">{tier} Member Benefits:</p>
          <ul className="space-y-0.5">
            {config.benefits.map(b => (
              <li key={b} className="flex items-center gap-1 text-xs">
                <CheckCircle className="h-3 w-3 text-secondary shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const CleanerCard = ({ cleaner, variant = "grid" }: CleanerCardProps) => {
  const navigate = useNavigate();
  const [quoteOpen, setQuoteOpen] = useState(false);

  const handleQuote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cleaner.userId) {
      setQuoteOpen(true);
    } else {
      navigate(`/cleaner/${cleaner.id}?action=quote`);
    }
  };

  const handleBook = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/cleaner/${cleaner.id}`);
  };

  const quoteDialog = cleaner.userId ? (
    <RequestQuoteDialog
      open={quoteOpen}
      onOpenChange={setQuoteOpen}
      cleanerProfileId={String(cleaner.id)}
      cleanerUserId={cleaner.userId}
      cleanerName={cleaner.name}
    />
  ) : null;

  if (variant === "list") {
    return (
      <>
        <Link 
          to={`/cleaner/${cleaner.id}`}
          className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300 flex flex-col md:flex-row block"
        >
          {/* Image */}
          <div className="relative w-full md:w-64 aspect-[4/3] md:aspect-auto shrink-0 overflow-hidden">
            <BlurImage
              src={cleaner.image}
              alt={cleaner.name}
              className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            />
            {cleaner.featured && (
              <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
                ⭐ Featured
              </Badge>
            )}
            <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
              <Heart className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-5 flex flex-col">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                    {cleaner.name}
                  </h3>
                  {cleaner.verified && (
                    <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center" title="Verified">
                      <Shield className="h-3 w-3 text-blue-600" />
                    </div>
                  )}
                  {cleaner.subscriptionTier && (
                    <SubscriptionTierBadge tier={cleaner.subscriptionTier} />
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {cleaner.location}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="font-semibold text-foreground">{cleaner.rating}</span>
                </div>
                <span className="text-xs text-muted-foreground">({cleaner.reviews} reviews)</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {cleaner.description}
            </p>

            {/* Services */}
            <div className="flex flex-wrap gap-1 mb-3">
              {cleaner.services.map((service) => (
                <span
                  key={service}
                  className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
                >
                  {service}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {cleaner.responseTime}
              </div>
              {cleaner.instantBooking && (
                <div className="flex items-center gap-1 text-secondary">
                  <CheckCircle className="h-3 w-3" />
                  Instant Booking
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-border mt-auto">
              <div>
                <span className="text-sm text-muted-foreground">Starting from</span>
                <span className="font-semibold text-primary text-lg ml-2">${cleaner.priceFrom}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleQuote}>
                  Get Quote
                </Button>
                <Button variant="secondary" size="sm" onClick={handleBook}>
                  Book Now
                </Button>
              </div>
            </div>
          </div>
        </Link>
        {quoteDialog}
      </>
    );
  }

  return (
    <>
      <Link 
        to={`/cleaner/${cleaner.id}`}
        className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300 block"
      >
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <BlurImage
            src={cleaner.image}
            alt={cleaner.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          />
          {cleaner.featured && (
            <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground">
              ⭐ Featured
            </Badge>
          )}
          <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center hover:bg-card transition-colors">
            <Heart className="h-4 w-4 text-muted-foreground hover:text-destructive" />
          </button>
          {cleaner.instantBooking && (
            <Badge className="absolute bottom-3 left-3 bg-secondary/90 text-secondary-foreground">
              <CheckCircle className="h-3 w-3 mr-1" />
              Instant Booking
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors">
                {cleaner.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {cleaner.location}
              </div>
            </div>
            {cleaner.verified && (
              <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center" title="Verified">
                <Shield className="h-3 w-3 text-blue-600" />
              </div>
            )}
          </div>

          {/* Subscription tier badge */}
          {cleaner.subscriptionTier && (
            <div className="mb-2">
              <SubscriptionTierBadge tier={cleaner.subscriptionTier} />
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent text-accent" />
              <span className="font-semibold text-foreground">{cleaner.rating}</span>
            </div>
            <span className="text-sm text-muted-foreground">({cleaner.reviews} reviews)</span>
          </div>

          {/* Services */}
          <div className="flex flex-wrap gap-1 mb-3">
            {cleaner.services.slice(0, 3).map((service) => (
              <span
                key={service}
                className="px-2 py-1 bg-muted rounded-md text-xs text-muted-foreground"
              >
                {service}
              </span>
            ))}
          </div>

          {/* Response Time */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-4">
            <Clock className="h-3 w-3" />
            {cleaner.responseTime}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            <div>
              <span className="text-xs text-muted-foreground">From</span>
              <span className="font-semibold text-primary ml-1">${cleaner.priceFrom}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleQuote}>
                Quote
              </Button>
              <Button variant="secondary" size="sm" onClick={handleBook}>
                Book
              </Button>
            </div>
          </div>
        </div>
      </Link>
      {quoteDialog}
    </>
  );
};

export default CleanerCard;
