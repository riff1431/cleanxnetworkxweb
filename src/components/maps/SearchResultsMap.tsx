import { GoogleMap } from "@react-google-maps/api";
import { useMemo, useCallback, useState } from "react";
import CleanerMapMarker, { MapCleaner } from "./CleanerMapMarker";
import GoogleMapsProvider from "./GoogleMapsProvider";
import { Skeleton } from "@/components/ui/skeleton";

// Map coordinates for Canadian cities used in mock data
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Toronto, ON": { lat: 43.6532, lng: -79.3832 },
  "Vancouver, BC": { lat: 49.2827, lng: -123.1207 },
  "Calgary, AB": { lat: 51.0447, lng: -114.0719 },
  "Montreal, QC": { lat: 45.5017, lng: -73.5673 },
  "Ottawa, ON": { lat: 45.4215, lng: -75.6972 },
  "Edmonton, AB": { lat: 53.5461, lng: -113.4938 },
};

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = { lat: 46.8, lng: -80.0 }; // Center of Canada

interface SearchResultsMapProps {
  cleaners: Array<{
    id: number | string;
    name: string;
    image: string;
    rating: number;
    reviews: number;
    location: string;
    priceFrom: number;
    verified: boolean;
    services: string[];
  }>;
  activeCleanerId?: number | string | null;
  onCleanerSelect?: (id: number | string) => void;
  className?: string;
}

const MapContent = ({ cleaners, activeCleanerId, onCleanerSelect }: SearchResultsMapProps) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const mapCleaners: MapCleaner[] = useMemo(() => {
    return cleaners.map((c, i) => {
      const coords = CITY_COORDS[c.location] || defaultCenter;
      // Add small offset so markers don't overlap
      return {
        ...c,
        lat: coords.lat + (Math.random() - 0.5) * 0.05,
        lng: coords.lng + (Math.random() - 0.5) * 0.05,
      };
    });
  }, [cleaners]);

  const bounds = useMemo(() => {
    if (mapCleaners.length === 0) return null;
    const b = new google.maps.LatLngBounds();
    mapCleaners.forEach((c) => b.extend({ lat: c.lat, lng: c.lng }));
    return b;
  }, [mapCleaners]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      if (bounds) {
        mapInstance.fitBounds(bounds, 50);
      }
    },
    [bounds]
  );

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={defaultCenter}
      zoom={5}
      onLoad={onLoad}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      }}
    >
      {mapCleaners.map((cleaner) => (
        <CleanerMapMarker
          key={cleaner.id}
          cleaner={cleaner}
          isActive={activeCleanerId === cleaner.id}
          onSelect={onCleanerSelect}
        />
      ))}
    </GoogleMap>
  );
};

const SearchResultsMap = (props: SearchResultsMapProps) => {
  return (
    <div className={props.className || "h-[500px] rounded-xl overflow-hidden border border-border"}>
      <GoogleMapsProvider fallback={<Skeleton className="w-full h-full" />}>
        <MapContent {...props} />
      </GoogleMapsProvider>
    </div>
  );
};

export default SearchResultsMap;
