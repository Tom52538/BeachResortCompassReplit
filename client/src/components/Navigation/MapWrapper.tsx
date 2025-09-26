import React, { useState, useCallback, useEffect } from 'react';
import { MapContainer } from '@/components/Map/MapContainer';
import { POI, Coordinates, RouteResponse } from '@/types/navigation';

interface MapWrapperProps {
  currentPosition: Coordinates;
  displayPOIs: POI[];
  selectedPOI: POI | null;
  currentRoute: RouteResponse | null;
  isNavigating: boolean;
  destinationMarker: { lat: number; lng: number } | null;
  showNetworkDebug?: boolean;
  lastFailedRoute?: { start: Coordinates; end: Coordinates } | null;
  failedRoutingCoords?: { start: Coordinates; end: Coordinates } | null;
  onPOISelect: (poi: POI) => void;
  onMapDoubleClick: (coords: { lat: number; lng: number }) => void;
  onMapLongPress: (coords: { lat: number; lng: number }) => void;
  onMapSingleTap: () => void;
}

export const MapWrapper: React.FC<MapWrapperProps> = ({
  currentPosition,
  displayPOIs,
  selectedPOI,
  currentRoute,
  isNavigating,
  destinationMarker,
  showNetworkDebug = false,
  lastFailedRoute = null,
  failedRoutingCoords = null,
  onPOISelect,
  onMapDoubleClick,
  onMapLongPress,
  onMapSingleTap
}) => {
  // Map state - extracted from Navigation.tsx
  const [mapCenter, setMapCenter] = useState(currentPosition);
  const [mapZoom, setMapZoom] = useState(16);
  const [mapStyle, setMapStyle] = useState<'outdoors' | 'satellite' | 'streets' | 'navigation'>('outdoors');
  const [mapOrientation, setMapOrientation] = useState<'north' | 'driving'>('north');

  // Update map center when position changes
  useEffect(() => {
    setMapCenter(currentPosition);
  }, [currentPosition]);

  // Auto-switch to driving orientation for navigation style when navigating
  useEffect(() => {
    if (mapStyle === 'navigation' && isNavigating) {
      setMapOrientation('driving');
    }
  }, [mapStyle, isNavigating]);

  // Map style change handler - extracted from Navigation.tsx
  const handleMapStyleChange = useCallback((style: 'outdoors' | 'satellite' | 'streets' | 'navigation') => {
    console.log('🗺️ DEBUG - MapWrapper handleMapStyleChange:', {
      newStyle: style,
      currentStyle: mapStyle,
      isNavigating,
      timestamp: new Date().toISOString()
    });

    try {
      setMapStyle(style);
      console.log('🗺️ DEBUG - setMapStyle completed successfully');

      // Auto-switch to driving orientation for navigation style when active navigation
      if (style === 'navigation' && isNavigating) {
        console.log('🗺️ DEBUG - Auto-switching to driving orientation for navigation style');
        setMapOrientation('driving');
      }

      // Force re-render of map component
      setTimeout(() => {
        console.log('🗺️ DEBUG - Map style change should be visible now');
      }, 100);

    } catch (error) {
      console.error('🗺️ ERROR - handleMapStyleChange failed:', error);
      // Fallback to default style if something goes wrong
      setMapStyle('outdoors');
    }
  }, [isNavigating, mapStyle]);

  console.log('🗺️ MAP WRAPPER DEBUG:', {
    center: mapCenter,
    zoom: mapZoom,
    style: mapStyle,
    orientation: mapOrientation,
    poisCount: displayPOIs.length,
    selectedPOI: selectedPOI?.name,
    isNavigating,
    hasRoute: !!currentRoute
  });

  return (
    <div className="map-wrapper relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        style={mapStyle}
        orientation={mapOrientation}
        pois={displayPOIs}
        selectedPOI={selectedPOI}
        route={currentRoute}
        isNavigating={isNavigating}
        destinationMarker={destinationMarker}
        showNetworkDebug={showNetworkDebug}
        lastFailedRoute={lastFailedRoute}
        failedRoutingCoords={failedRoutingCoords}
        onPOISelect={onPOISelect}
        onDoubleClick={onMapDoubleClick}
        onLongPress={onMapLongPress}
        onSingleTap={onMapSingleTap}
      />

      {/* Map style controls - could be moved to a separate component */}
      {process.env.NODE_ENV === 'development' && (
        <div className="map-style-controls absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-sm rounded-lg p-2 space-y-1">
          {(['outdoors', 'satellite', 'streets', 'navigation'] as const).map(style => (
            <button
              key={style}
              onClick={() => handleMapStyleChange(style)}
              className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                mapStyle === style 
                  ? 'bg-blue-500 text-white' 
                  : 'hover:bg-gray-100'
              }`}
            >
              {style.charAt(0).toUpperCase() + style.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Export map state management hook for use in parent components
export const useMapState = (initialPosition: Coordinates) => {
  const [mapCenter, setMapCenter] = useState(initialPosition);
  const [mapZoom, setMapZoom] = useState(16);
  const [mapStyle, setMapStyle] = useState<'outdoors' | 'satellite' | 'streets' | 'navigation'>('outdoors');
  const [mapOrientation, setMapOrientation] = useState<'north' | 'driving'>('north');

  const updateMapStyle = useCallback((style: 'outdoors' | 'satellite' | 'streets' | 'navigation') => {
    setMapStyle(style);
  }, []);

  const updateMapOrientation = useCallback((orientation: 'north' | 'driving') => {
    setMapOrientation(orientation);
  }, []);

  const updateMapZoom = useCallback((zoom: number) => {
    setMapZoom(zoom);
  }, []);

  const updateMapCenter = useCallback((center: Coordinates) => {
    setMapCenter(center);
  }, []);

  return {
    mapCenter,
    mapZoom,
    mapStyle,
    mapOrientation,
    updateMapStyle,
    updateMapOrientation,
    updateMapZoom,
    updateMapCenter
  };
};