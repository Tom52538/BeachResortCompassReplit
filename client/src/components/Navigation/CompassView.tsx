import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Navigation } from 'lucide-react';
import { POI } from '@/types/poi-categories';
import { useLocation } from '@/hooks/useLocation';
import { useDeviceOrientation } from '@/hooks/useDeviceOrientation';
import { calculateBearing, calculateDistance, formatDistance } from '@/lib/mapUtils';
import { cn } from '@/lib/utils';

// Renders the Compass View UI
interface CompassViewProps {
  destination: POI;
  onClose: () => void;
}

export const CompassView = ({ destination, onClose }: CompassViewProps) => {
  const { location: currentLocation } = useLocation();
  const { heading, requestPermission, error } = useDeviceOrientation();
  const [permissionGranted, setPermissionGranted] = useState(false);

  const handlePermission = async () => {
    await requestPermission();
    // We assume permission is granted if the hook is active.
    // A more robust solution might check the actual permission state.
    setPermissionGranted(true);
  };

  const distance = useMemo(() => {
    if (!currentLocation) return null;
    // calculateDistance from mapUtils returns km, convert to meters for formatDistance
    const distanceInKm = calculateDistance(currentLocation, { lat: destination.latitude, lng: destination.longitude });
    return distanceInKm * 1000;
  }, [currentLocation, destination]);

  const bearing = useMemo(() => {
    if (!currentLocation) return null;
    return calculateBearing(currentLocation, { lat: destination.latitude, lng: destination.longitude });
  }, [currentLocation, destination]);

  const destinationPointerStyle = {
    transform: `rotate(${bearing - (heading || 0)}deg)`,
  };

  const compassRingStyle = {
    transform: `rotate(-${heading || 0}deg)`,
  };

  if (!permissionGranted) {
    return (
      <div className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-xl font-semibold mb-4">Kompass-Ansicht benötigt Zugriff auf die Gerätesensoren.</h2>
        <p className="mb-6 text-muted-foreground">Um Ihnen die Richtung zu weisen, benötigen wir Ihre Zustimmung.</p>
        <Button onClick={handlePermission}>Zugriff erlauben</Button>
        <Button variant="ghost" onClick={onClose} className="mt-4">
          Zurück zur Karte
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-4">
        <h2 className="text-xl font-semibold text-destructive mb-4">Fehler bei der Sensor-Abfrage</h2>
        <p className="mb-6 text-muted-foreground">{error}</p>
        <Button onClick={onClose}>Zurück zur Karte</Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-background z-50 flex flex-col items-center justify-between p-4">
      <div className="w-full">
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 left-4">
          <ArrowLeft />
        </Button>
        <div className="text-center mt-16">
          <h1 className="text-2xl font-bold">{destination.name}</h1>
          <p className="text-lg text-muted-foreground">{distance ? formatDistance(distance) : 'Berechne...'}</p>
        </div>
      </div>

      <div className="relative w-64 h-64 flex items-center justify-center">
        {/* User's heading arrow - always points up */}
        <Navigation className="w-10 h-10 text-primary absolute -top-12" />
        
        {/* Compass Ring */}
        <div className="absolute w-full h-full rounded-full border-4 border-foreground transition-transform duration-500 ease-in-out" style={compassRingStyle}>
          <div className="absolute top-1/2 left-1/2 -mt-2 -ml-2 w-4 h-4 rounded-full bg-primary" />
          <span className="absolute -top-4 left-1/2 -ml-2 font-bold text-xl">N</span>
          <span className="absolute -right-4 top-1/2 -mt-3 font-bold text-xl">E</span>
          <span className="absolute -bottom-4 left-1/2 -ml-2 font-bold text-xl">S</span>
          <span className="absolute -left-4 top-1/2 -mt-3 font-bold text-xl">W</span>
        </div>

        {/* Destination Pointer */}
        {bearing !== null && (
          <div className="absolute w-full h-full transition-transform duration-500 ease-in-out" style={destinationPointerStyle}>
            <Navigation className="w-12 h-12 text-accent absolute top-0 left-1/2 -ml-6" />
          </div>
        )}
      </div>

      <div className="h-16" /> {/* Spacer */}

      {/* Debug Info */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-2 rounded-md text-xs">
        <p>Heading: {heading?.toFixed(2) ?? 'N/A'}</p>
        <p>Bearing: {bearing?.toFixed(2) ?? 'N/A'}</p>
        <p>Distance: {distance?.toFixed(2) ?? 'N/A'} m</p>
      </div>
    </div>
  );
};
