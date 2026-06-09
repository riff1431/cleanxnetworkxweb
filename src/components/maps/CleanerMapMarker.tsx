import { InfoWindowF, MarkerF } from "@react-google-maps/api";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, MapPin, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface MapCleaner {
  id: number | string;
  name: string;
  image: string;
  rating: number;
  reviews: number;
  location: string;
  priceFrom: number;
  verified: boolean;
  lat: number;
  lng: number;
  services: string[];
}

interface CleanerMapMarkerProps {
  cleaner: MapCleaner;
  isActive?: boolean;
  onSelect?: (id: number | string) => void;
}

const CleanerMapMarker = ({ cleaner, isActive, onSelect }: CleanerMapMarkerProps) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <MarkerF
      position={{ lat: cleaner.lat, lng: cleaner.lng }}
      onClick={() => {
        setShowInfo(true);
        onSelect?.(cleaner.id);
      }}
      icon={
        isActive
          ? {
              url: "data:image/svg+xml," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
                  <path d="M20 0C8.95 0 0 8.95 0 20c0 14 20 28 20 28s20-14 20-28C40 8.95 31.05 0 20 0z" fill="#16a34a"/>
                  <circle cx="20" cy="18" r="10" fill="white"/>
                  <text x="20" y="22" text-anchor="middle" font-size="12" font-weight="bold" fill="#16a34a">$${cleaner.priceFrom}</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(40, 48),
            }
          : {
              url: "data:image/svg+xml," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                  <path d="M16 0C7.16 0 0 7.16 0 16c0 11.2 16 24 16 24s16-12.8 16-24C32 7.16 24.84 0 16 0z" fill="#2563eb"/>
                  <circle cx="16" cy="14" r="8" fill="white"/>
                  <text x="16" y="18" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563eb">$${cleaner.priceFrom}</text>
                </svg>
              `),
              scaledSize: new google.maps.Size(32, 40),
            }
      }
    >
      {showInfo && (
        <InfoWindowF
          position={{ lat: cleaner.lat, lng: cleaner.lng }}
          onCloseClick={() => setShowInfo(false)}
        >
          <div className="p-1 max-w-[220px]">
            <div className="flex gap-2 items-start">
              <img
                src={cleaner.image}
                alt={cleaner.name}
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
              <div className="min-w-0">
                <h4 className="font-semibold text-sm text-gray-900 truncate">{cleaner.name}</h4>
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {cleaner.rating} ({cleaner.reviews})
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                  <MapPin className="h-3 w-3" />
                  {cleaner.location}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <span className="text-sm font-semibold text-gray-900">
                From ${cleaner.priceFrom}/hr
              </span>
              {cleaner.verified && (
                <Badge variant="secondary" className="text-xs gap-0.5 py-0 h-5">
                  <Shield className="h-2.5 w-2.5" /> Verified
                </Badge>
              )}
            </div>
            <Link to={`/cleaner/${cleaner.id}`}>
              <Button size="sm" className="w-full mt-2 h-7 text-xs">
                View Profile
              </Button>
            </Link>
          </div>
        </InfoWindowF>
      )}
    </MarkerF>
  );
};

export default CleanerMapMarker;
