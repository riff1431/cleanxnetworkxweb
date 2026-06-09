import { LoadScript } from "@react-google-maps/api";
import { useGoogleMapsKey } from "@/hooks/useGoogleMapsKey";
import { Skeleton } from "@/components/ui/skeleton";

const LIBRARIES: ("places")[] = ["places"];

interface GoogleMapsProviderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const GoogleMapsProvider = ({ children, fallback }: GoogleMapsProviderProps) => {
  const { apiKey, loading } = useGoogleMapsKey();

  if (loading) {
    return <>{fallback || <Skeleton className="w-full h-64 rounded-xl" />}</>;
  }

  if (!apiKey) {
    return (
      <div className="w-full h-64 rounded-xl bg-muted flex items-center justify-center text-muted-foreground text-sm">
        Map unavailable
      </div>
    );
  }

  return (
    <LoadScript googleMapsApiKey={apiKey} libraries={LIBRARIES}>
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;
