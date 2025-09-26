import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { MapControls } from '@/components/Navigation/MapControls';
import { EnhancedMapControls } from '@/components/Navigation/EnhancedMapControls';
import { CampingWeatherWidget } from '@/components/Navigation/CampingWeatherWidget';
import { TransparentOverlay } from '@/components/UI/TransparentOverlay';
import { TransparentPOIOverlay } from '@/components/Navigation/TransparentPOIOverlay';
import { TopManeuverPanel } from '@/components/Navigation/TopManeuverPanel';
import { BottomSummaryPanel } from '@/components/Navigation/BottomSummaryPanel';
import { PermanentHeader } from '@/components/UI/PermanentHeader';
import { TravelModeSelector } from '@/components/Navigation/TravelModeSelector';
import { CampgroundRerouteDetector } from '@/lib/campgroundRerouting';
import { useLocation } from '@/hooks/useLocation';
import { usePOI, useSearchPOI } from '@/hooks/usePOI';
import { useRouting } from '@/hooks/useRouting';
import { useWeather } from '@/hooks/useWeather';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigationTracking } from '@/hooks/useNavigationTracking';
import { useSiteManager } from '@/lib/siteManager';
import { mobileLogger } from '@/utils/mobileLogger';
import { POI, RouteResponse, Coordinates } from '@/types/navigation';
import { calculateDistance, formatDistance, calculateBearing } from '@/lib/mapUtils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Settings } from 'lucide-react';
import { SecureTTSClient } from '@/services/secureTTSClient';
import { RouteTracker } from '@/lib/routeTracker';
import { EnhancedPOIDialog } from '@/components/Navigation/EnhancedPOIDialog';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import MobileMemoryMonitor from '@/components/UI/MobileMemoryMonitor';

// Import our new modular components
import { POIManager, usePOIFiltering } from '@/components/Navigation/POIManager';
import { MapWrapper, useMapState } from '@/components/Navigation/MapWrapper';
import { DebugSection } from '@/components/Navigation/DebugSection';

// Helper function to safely normalize POI strings for logging and display
const normalizePoiString = (value: any): string => {
  if (typeof value === 'string') return value.toLowerCase().trim();
  if (typeof value === 'number') return String(value).toLowerCase().trim();
  if (value === null || value === undefined) return '';
  return String(value).toLowerCase().trim();
};

const isDev = process.env.NODE_ENV === 'development';

export default function Navigation() {
  // Use SiteManager as single source of truth for site management
  const { config, setSite } = useSiteManager();
  const currentSite = config.site;
  const { currentPosition, useRealGPS, toggleGPS } = useLocation({ currentSite });
  const { data: allPOIs = [], isLoading: poisLoading } = usePOI(currentSite);

  // Debug: Log the site synchronization - now using SiteManager
  console.log(`🔍 SITE SYNC DEBUG: NavigationModular.tsx currentSite=${currentSite}, SiteManager config=${JSON.stringify(config)}`);
  const { data: weather } = useWeather(currentPosition.lat, currentPosition.lng);
  const { getRoute } = useRouting();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Core navigation state
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteResponse | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationMarker, setDestinationMarker] = useState<{ lat: number; lng: number } | null>(null);

  // UI state
  const [uiMode, setUIMode] = useState<'start' | 'search' | 'poi-info' | 'route-planning' | 'navigation'>('start');
  const [overlayStates, setOverlayStates] = useState({
    search: false,
    poiInfo: false,
    routePlanning: false,
    navigation: false
  });
  const [showPOIOverlay, setShowPOIOverlay] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  // Debug state
  const [isDebugMode, setIsDebugMode] = useState(false);
  const [showNetworkDebug, setShowNetworkDebug] = useState(false);
  const [showNetworkOverlay, setShowNetworkOverlay] = useState(false);
  const [lastFailedRoute, setLastFailedRoute] = useState<{start: Coordinates, end: Coordinates} | null>(null);
  const [failedRoutingCoords, setFailedRoutingCoords] = useState<{start: Coordinates, end: Coordinates} | null>(null);
  const [networkGeoJson, setNetworkGeoJson] = useState<any>(null);

  // Travel mode state for routing
  const [travelMode, setTravelMode] = useState<'car' | 'bike' | 'pedestrian'>('pedestrian');

  // Navigation tracking state
  const secureTTSRef = useRef<SecureTTSClient | null>(null);
  const routeTrackerRef = useRef<RouteTracker | null>(null);
  const reroutingRef = useRef(false);
  const rerouteDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const destinationRef = useRef<Coordinates | null>(null);
  const [currentInstruction, setCurrentInstruction] = useState<string>('');
  const [nextDistance, setNextDistance] = useState<number>(0);
  const [routeProgress, setRouteProgress] = useState<any>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Initialize navigation tracking - but only when using real GPS
  const { currentPosition: livePosition, error: navigationError, isTracking } = useNavigationTracking(isNavigating, useRealGPS, currentPosition, {
    enableHighAccuracy: true,
    updateInterval: 1000,
    adaptiveTracking: true
  });

  // Use live position when navigating with real GPS, otherwise use current position
  const trackingPosition = useMemo(() => {
    if (isNavigating) {
      if (useRealGPS && livePosition?.position) {
        console.log('🔍 TRACKING POSITION: Using live GPS position for navigation', livePosition.position);
        return livePosition.position;
      } else {
        console.log('🔍 TRACKING POSITION: Using mock position for navigation', currentPosition);
        return currentPosition;
      }
    }
    return null;
  }, [isNavigating, useRealGPS, livePosition?.position, currentPosition]);

  // Use our POI filtering hook
  const displayPOIs = usePOIFiltering(allPOIs, filteredCategories, currentSite);

  // Debug network loading effect
  useEffect(() => {
    if (isDebugMode) {
      const networkFile = currentSite === 'zuhause'
        ? '/zuhause_routing_network.geojson'
        : '/roompot_routing_network.geojson';

      fetch(networkFile)
        .then(res => res.json())
        .then(data => setNetworkGeoJson(data))
        .catch(err => console.error("Failed to load network GeoJSON:", err));
    } else {
      setNetworkGeoJson(null);
    }
  }, [isDebugMode, currentSite]);

  // Initialize TTS client
  useEffect(() => {
    try {
      if (!secureTTSRef.current) {
        secureTTSRef.current = new SecureTTSClient();
        console.log('🎤 TTS Client initialized');
      }
    } catch (error) {
      console.error('TTS initialization failed:', error);
      secureTTSRef.current = null;
    }
  }, []);

  // POI category toggle handler
  const handleCategoryToggle = useCallback((category: string) => {
    setFilteredCategories(prev => {
      const isActive = prev.includes(category);
      if (isActive) {
        return prev.filter(c => c !== category);
      } else {
        return [...prev, category];
      }
    });
  }, []);

  // POI selection handler
  const handlePOISelect = useCallback((poi: POI) => {
    console.log('🔍 POI selected:', normalizePoiString(poi.name));
    setSelectedPOI(poi);
    setUIMode('poi-info');
    setOverlayStates(prev => ({ ...prev, poiInfo: true }));
    setShowPOIOverlay(true);
  }, []);

  // Navigation to POI handler
  const handleNavigateToPOI = useCallback(async (poi: POI) => {
    console.log('🧭 Navigation to POI requested:', normalizePoiString(poi.name));

    if (!currentPosition) {
      console.error('❌ No position available for navigation');
      return;
    }

    if (!poi?.coordinates) {
      console.error('❌ Invalid POI coordinates:', poi);
      return;
    }

    const destination = { lat: poi.coordinates.lat, lng: poi.coordinates.lng };
    destinationRef.current = destination;

    const startTime = performance.now();
    mobileLogger.log('NAVIGATION', `Starting navigation to ${normalizePoiString(poi.name)} with mode: ${travelMode}`);

    try {
      // Hide POI info and clear states
      setSelectedPOI(null);
      setOverlayStates({ search: false, poiInfo: false, routePlanning: false, navigation: false });
      setCurrentRoute(null);
      setIsNavigating(false);

      // Calculate route
      const profile = travelMode === 'car' ? 'driving' : travelMode === 'bike' ? 'cycling' : 'walking';
      console.log('🚗 ROUTING WITH PROFILE:', profile, 'from travel mode:', travelMode);

      const route = await getRoute.mutateAsync({
        from: currentPosition,
        to: destination,
        mode: profile
      });

      if (!route) {
        console.warn('No route received from server');
        const failedCoords = {
          start: { lat: currentPosition.lat, lng: currentPosition.lng },
          end: { lat: destination.lat, lng: destination.lng }
        };
        setLastFailedRoute(failedCoords);
        setFailedRoutingCoords(failedCoords);
        setShowNetworkDebug(true);
        toast({
          title: "Routing fehlgeschlagen",
          description: "Keine Route gefunden - Netzwerk-Disconnect sichtbar auf Karte",
          variant: "destructive",
        });
        return;
      }

      // Start navigation
      setCurrentRoute(route);
      setDestinationMarker(destination);
      setIsNavigating(true);

      mobileLogger.logPerformance('Navigation setup', startTime);
      mobileLogger.log('NAVIGATION', `Navigation started successfully to ${normalizePoiString(poi.name)}`);
      setUIMode('navigation');
      setOverlayStates(prev => ({ ...prev, navigation: true }));

      console.log('✅ POI Navigation successfully started with voice:', voiceEnabled);
    } catch (error) {
      console.error('🗺️ ROUTING ERROR:', error);
      const failedCoords = {
        start: { lat: currentPosition.lat, lng: currentPosition.lng },
        end: { lat: destination.lat, lng: destination.lng }
      };
      setLastFailedRoute(failedCoords);
      setFailedRoutingCoords(failedCoords);
      setShowNetworkDebug(true);
      toast({
        title: "Routing fehlgeschlagen",
        description: "Keine Route gefunden - Netzwerk-Disconnect sichtbar auf Karte",
        variant: "destructive",
      });
    }
  }, [currentPosition, getRoute, toast, travelMode, voiceEnabled]);

  // End navigation handler
  const handleEndNavigation = useCallback(() => {
    console.log('🛑 Ending navigation');
    
    // Clean up route tracker
    if (routeTrackerRef.current) {
      routeTrackerRef.current = null;
    }

    // Clear debounce timer
    if (rerouteDebounceTimerRef.current) {
      clearTimeout(rerouteDebounceTimerRef.current);
      rerouteDebounceTimerRef.current = null;
    }

    // Reset state
    setIsNavigating(false);
    setCurrentRoute(null);
    setCurrentInstruction('');
    setNextDistance(0);
    setDestinationMarker(null);
    destinationRef.current = null;

    setUIMode('start');
    setOverlayStates({ search: false, poiInfo: false, routePlanning: false, navigation: false });

    mobileLogger.log('NAVIGATION', 'Navigation ended');
  }, []);

  // Map interaction handlers
  const handleMapDoubleClick = useCallback((coords: { lat: number; lng: number }) => {
    console.log('🗺️ DOUBLE CLICK DEBUG: Double click detected at:', coords);
    
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return; // Disable on mobile
    }

    const newDestination = { lat: coords.lat, lng: coords.lng };
    setDestinationMarker(newDestination);
    destinationRef.current = newDestination;

    toast({
      title: "Ziel gesetzt",
      description: `Navigation nach ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      action: (
        <Button 
          size="sm" 
          onClick={async () => {
            try {
              const profile = travelMode === 'car' ? 'driving' : travelMode === 'bike' ? 'cycling' : 'walking';
              const route = await getRoute.mutateAsync({
                from: currentPosition,
                to: newDestination,
                mode: profile
              });
              setCurrentRoute(route);
              setIsNavigating(true);
              setUIMode('navigation');
              setOverlayStates(prev => ({ ...prev, navigation: true, routePlanning: false }));
              toast({
                title: t('alerts.routeStarted'),
                description: "Follow the blue route on the map",
                duration: 3000
              });
            } catch (error) {
              console.error('🗺️ DOUBLE CLICK DEBUG: Route calculation failed', error);
              toast({
                title: "Routing fehlgeschlagen",
                description: "Keine Route gefunden",
                variant: "destructive",
              });
            }
          }}
        >
          Start Navigation
        </Button>
      ),
    });
  }, [toast, currentPosition, getRoute, travelMode, t]);

  const handleMapLongPress = useCallback((coords: { lat: number; lng: number }) => {
    console.log('🗺️ LONG PRESS DEBUG: Long press detected at:', coords);
    handleMapDoubleClick(coords); // Same behavior as double click
  }, [handleMapDoubleClick]);

  const handleMapSingleTap = useCallback(() => {
    console.log('🗺️ SINGLE TAP DEBUG: Single tap detected - handling map interaction');
    if (selectedPOI) {
      setSelectedPOI(null);
      setUIMode('start');
      setOverlayStates(prev => ({ ...prev, poiInfo: false }));
      setShowPOIOverlay(false);
    }
  }, [selectedPOI]);

  // Search and site change handlers
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    console.log('🔍 Search query:', query);
    // Simple search implementation - filter POIs by name
    if (query.trim()) {
      const matchingPOIs = allPOIs.filter(poi => 
        normalizePoiString(poi.name).includes(query.toLowerCase()) ||
        normalizePoiString(poi.description || '').includes(query.toLowerCase())
      );
      // For now, just log the results
      console.log(`🔍 Search results: ${matchingPOIs.length} POIs found`);
    }
  }, [allPOIs]);

  const handleSiteChange = useCallback((site: string) => {
    console.log('🌍 Site change requested:', site);
    setSite(site);
  }, [setSite]);

  const handleClearPOIs = useCallback(() => {
    setFilteredCategories([]);
    setSearchQuery('');
    setSelectedPOI(null);
    setShowPOIOverlay(false);
    console.log('🧹 Cleared all POI filters and selections');
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setShowPOIOverlay(false);
    setSelectedPOI(null);
    setUIMode('start');
    setOverlayStates(prev => ({ ...prev, poiInfo: false }));
  }, []);

  // Voice and debug handlers
  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled(prev => !prev);
    console.log('🎤 Voice toggled:', !voiceEnabled);
  }, [voiceEnabled]);

  const handleTravelModeChange = useCallback((mode: 'car' | 'bike' | 'pedestrian') => {
    setTravelMode(mode);
    console.log('🚗 Travel mode changed to:', mode);
  }, []);

  const toggleDebugMode = useCallback(() => {
    setIsDebugMode(prev => !prev);
  }, []);

  const toggleNetworkDebug = useCallback(() => {
    setShowNetworkDebug(prev => !prev);
  }, []);

  const toggleNetworkOverlay = useCallback(() => {
    setShowNetworkOverlay(prev => !prev);
  }, []);

  console.log('🔍 MODULAR NAVIGATION DEBUG:', {
    currentSite,
    totalPOIs: allPOIs.length,
    displayedPOIs: displayPOIs.length,
    filteredCategories,
    selectedPOI: selectedPOI?.name,
    isNavigating,
    hasRoute: !!currentRoute,
    voiceEnabled,
    isDebugMode
  });

  // Handle loading state
  if (poisLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('status.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="navigation-page h-screen w-screen overflow-hidden bg-gray-50">
        {/* Mobile Memory Monitor - only show in development */}
        {isDev && <MobileMemoryMonitor />}

        <div className="flex h-[calc(100vh-4rem)]">
          {/* Main Map Area - Using our new MapWrapper component */}
          <div className="flex-1 relative">
            <MapWrapper
              currentPosition={trackingPosition || currentPosition}
              displayPOIs={displayPOIs}
              selectedPOI={selectedPOI}
              currentRoute={currentRoute}
              isNavigating={isNavigating}
              destinationMarker={destinationMarker}
              showNetworkDebug={showNetworkDebug}
              lastFailedRoute={lastFailedRoute}
              failedRoutingCoords={failedRoutingCoords}
              onPOISelect={handlePOISelect}
              onMapDoubleClick={handleMapDoubleClick}
              onMapLongPress={handleMapLongPress}
              onMapSingleTap={handleMapSingleTap}
            />
          </div>
        </div>

        {/* EXPLORATION MODE - Only visible when NOT navigating */}
        {!isNavigating && (
          <>
            {/* Permanent Header - Search and Location Selection */}
            <div className="z-[1000]">
              <PermanentHeader
                searchQuery={searchQuery}
                onSearch={handleSearch}
                currentSite={currentSite}
                onSiteChange={handleSiteChange}
                showClearButton={displayPOIs.length > 0 || searchQuery.length > 0 || filteredCategories.length > 0}
                onClear={handleClearPOIs}
              />
            </div>

            {/* POI Manager Component */}
            <POIManager
              allPOIs={allPOIs}
              currentSite={currentSite}
              filteredCategories={filteredCategories}
              onCategoryToggle={handleCategoryToggle}
              onPOISelect={handlePOISelect}
            />

            {/* Camping Weather Widget */}
            <CampingWeatherWidget />
          </>
        )}

        {/* Enhanced Map Controls - Always Visible (Right Side) */}
        <EnhancedMapControls
          onToggleVoice={handleToggleVoice}
          onMapStyleChange={() => {}} // Handled by MapWrapper
          isVoiceEnabled={voiceEnabled}
          mapStyle="outdoors"
          useRealGPS={useRealGPS}
          onToggleGPS={toggleGPS}
          travelMode={travelMode}
          onTravelModeChange={handleTravelModeChange}
          onZoomIn={() => {}}
          onZoomOut={() => {}}
          onCenterOnLocation={() => {}}
          mapOrientation="north"
          onOrientationChange={() => {}}
        />

        {/* NAVIGATION MODE - Only visible when navigating */}
        {isNavigating && currentRoute && (
          <>
            {/* Top Maneuver Panel */}
            <TopManeuverPanel
              instruction={currentInstruction}
              distance={nextDistance}
              isVisible={isNavigating}
            />

            {/* Bottom Summary Panel */}
            <BottomSummaryPanel
              distance={routeProgress?.distanceRemaining
                ? formatDistance(routeProgress.distanceRemaining)
                : (typeof currentRoute.totalDistance === 'string' 
                   ? currentRoute.totalDistance 
                   : "396 m")}
              eta={routeProgress?.dynamicETA?.estimatedArrival
                ? routeProgress.dynamicETA.estimatedArrival.toLocaleTimeString('de-DE', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })
                : (typeof currentRoute.eta === 'string' 
                   ? currentRoute.eta 
                   : new Date(Date.now() + 240000).toLocaleTimeString('de-DE', { 
                       hour: '2-digit', 
                       minute: '2-digit' 
                     }))}
              onEndNavigation={handleEndNavigation}
            />
          </>
        )}

        {/* POI Detail Overlay */}
        {showPOIOverlay && selectedPOI && (
          <TransparentPOIOverlay
            poi={selectedPOI}
            onNavigate={handleNavigateToPOI}
            onClose={handleCloseOverlay}
          />
        )}

        {/* Debug Section Component */}
        <DebugSection
          isDebugMode={isDebugMode}
          isNavigating={isNavigating}
          showNetworkDebug={showNetworkDebug}
          showNetworkOverlay={showNetworkOverlay}
          voiceEnabled={voiceEnabled}
          currentSite={currentSite}
          networkOverlayUrl={networkGeoJson ? '/api/network-visualization' : undefined}
          debugInfo={debugInfo}
          onToggleDebugMode={toggleDebugMode}
          onToggleNetworkDebug={toggleNetworkDebug}
          onToggleNetworkOverlay={toggleNetworkOverlay}
          onVoiceToggle={handleToggleVoice}
        />
      </div>
    </ErrorBoundary>
  );
}