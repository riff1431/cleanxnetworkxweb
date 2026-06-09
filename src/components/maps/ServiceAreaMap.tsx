import { GoogleMap, CircleF, MarkerF } from "@react-google-maps/api";
import { useCallback, useState } from "react";
import GoogleMapsProvider from "./GoogleMapsProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin } from "lucide-react";

// City coordinates for service area rendering
const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  "Toronto, ON": { lat: 43.6532, lng: -79.3832 },
  "Vancouver, BC": { lat: 49.2827, lng: -123.1207 },
  "Calgary, AB": { lat: 51.0447, lng: -114.0719 },
  "Montreal, QC": { lat: 45.5017, lng: -73.5673 },
  "Ottawa, ON": { lat: 45.4215, lng: -75.6972 },
  "Edmonton, AB": { lat: 53.5461, lng: -113.4938 },
  "Mississauga, ON": { lat: 43.589, lng: -79.6441 },
  "Brampton, ON": { lat: 43.7315, lng: -79.7624 },
  "Hamilton, ON": { lat: 43.2557, lng: -79.8711 },
  "Markham, ON": { lat: 43.8561, lng: -79.3370 },
};

const mapContainerStyle = { width: "100%", height: "100%" };

interface ServiceAreaMapProps {
  location: string;
  serviceAreas?: string[];
  cleanerName: string;
  className?: string;
}

const MapContent = ({ location, serviceAreas, cleanerName }: ServiceAreaMapProps) => {
  const center = CITY_COORDS[location] || { lat: 43.6532, lng: -79.3832 };
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={11}
      onLoad={onLoad}
      options={{
        disableDefaultUI: true,
        zoomControl: true,
        streetViewControl: false,
        mapTypeControl: false,
        styles: [
          { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
        ],
      }}
    >
      {/* Main location marker */}
      <MarkerF
        position={center}
        icon={{
          url: "data:image/svg+xml," + encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44">
              <path d="M18 0C8.06 0 0 8.06 0 18c0 12.6 18 26 18 26s18-13.4 18-26C36 8.06 27.94 0 18 0z" fill="#16a34a"/>
              <circle cx="18" cy="16" r="8" fill="white"/>
              <circle cx="18" cy="16" r="4" fill="#16a34a"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(36, 44),
        }}
      />

      {/* Service area radius */}
      <CircleF
        center={center}
        radius={15000} // 15km radius
        options={{
          fillColor: "#16a34a",
          fillOpacity: 0.08,
          strokeColor: "#16a34a",
          strokeOpacity: 0.3,
          strokeWeight: 2,
        }}
      />

      {/* Additional service area markers */}
      {serviceAreas?.map((area) => {
        const coords = CITY_COORDS[area];
        if (!coords) return null;
        return (
          <MarkerF
            key={area}
            position={coords}
            icon={{
              url: "data:image/svg+xml," + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" fill="#2563eb" fill-opacity="0.2" stroke="#2563eb" stroke-width="2"/>
                  <circle cx="12" cy="12" r="4" fill="#2563eb"/>
                </svg>
              `),
              scaledSize: new google.maps.Size(24, 24),
            }}
            title={area}
          />
        );
      })}
    </GoogleMap>
  );
};

const ServiceAreaMap = (props: ServiceAreaMapProps) => {
  return (
    <div className={props.className || "h-[300px] rounded-xl overflow-hidden border border-border"}>
      <GoogleMapsProvider fallback={<Skeleton className="w-full h-full" />}>
        <MapContent {...props} />
      </GoogleMapsProvider>
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600" />
          <span>Home Base</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-600/20 border border-green-600/30" />
          <span>Service Area (~15km)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-600" />
          <span>Extended Areas</span>
        </div>
      </div>
    </div>
  );
};

export default ServiceAreaMap;
