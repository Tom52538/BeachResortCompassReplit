import { Coordinates, RouteResponse } from '@/types/navigation';

export interface CampgroundReroutingConfig {
  // Distance threshold for considering "off-route" in campgrounds (much smaller than city)
  offRouteThreshold: number; // meters - default 8m for campgrounds vs 50m for cities
  
  // Minimum distance moved before checking for rerouting
  minimumMovementThreshold: number; // meters - default 3m for walking in campgrounds
  
  // Time threshold before considering rerouting
  rerouteConsiderationTime: number; // milliseconds - default 5 seconds
  
  // Distance threshold for automatic rerouting
  autoRerouteThreshold: number; // meters - default 15m off-route in campground
  
  // Maximum reroute attempts to prevent loops
  maxRerouteAttempts: number; // default 3
}

export const CAMPGROUND_REROUTING_CONFIG: CampgroundReroutingConfig = {
  offRouteThreshold: 35, // Erhöht für dichte Campingplatz-Bebauung
  minimumMovementThreshold: 12, // Mehr Toleranz zwischen Mobilheimen/Chalets
  rerouteConsiderationTime: 20000, // 20s - Zeit zum manuellen Navigieren um Hindernisse
  autoRerouteThreshold: 60, // Nur bei wirklich großer Abweichung neu routen
  maxRerouteAttempts: 2 // Verhindert Ping-Pong zwischen dicht stehenden Objekten
};

export class CampgroundRerouteDetector {
  private config: CampgroundReroutingConfig;
  private lastPosition: Coordinates | null = null;
  private offRouteStartTime: number | null = null;
  private rerouteAttempts: number = 0;
  private lastRerouteTime: number = 0;

  constructor(config: CampgroundReroutingConfig = CAMPGROUND_REROUTING_CONFIG) {
    this.config = config;
  }

  /**
   * Calculate distance from current position to nearest point on route
   */
  private distanceToRoute(position: Coordinates, route: RouteResponse): number {
    if (!route.geometry || route.geometry.length === 0) return 0;

    let minDistance = Infinity;
    
    for (const point of route.geometry) {
      if (Array.isArray(point) && point.length >= 2) {
        const routePoint = { lat: point[1], lng: point[0] };
        const distance = this.calculateDistance(position, routePoint);
        minDistance = Math.min(minDistance, distance);
      }
    }
    
    return minDistance;
  }

  /**
   * Haversine distance calculation optimized for short campground distances
   */
  private calculateDistance(pos1: Coordinates, pos2: Coordinates): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (pos2.lat - pos1.lat) * Math.PI / 180;
    const dLng = (pos2.lng - pos1.lng) * Math.PI / 180;
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(pos1.lat * Math.PI / 180) * Math.cos(pos2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Check if rerouting is needed based on campground-specific criteria
   */
  shouldReroute(
    currentPosition: Coordinates,
    route: RouteResponse,
    isNavigating: boolean
  ): { shouldReroute: boolean; reason?: string; distance?: number } {
    if (!isNavigating || !route) {
      return { shouldReroute: false };
    }

    // Check if we've moved enough to warrant position analysis
    if (this.lastPosition) {
      const movementDistance = this.calculateDistance(currentPosition, this.lastPosition);
      if (movementDistance < this.config.minimumMovementThreshold) {
        return { shouldReroute: false, reason: 'Insufficient movement' };
      }
    }

    this.lastPosition = currentPosition;
    
    // Calculate distance to route
    const distanceToRoute = this.distanceToRoute(currentPosition, route);
    
    console.log('🏕️ Campground reroute check:', {
      distanceToRoute: distanceToRoute.toFixed(1) + 'm',
      offRouteThreshold: this.config.offRouteThreshold + 'm',
      autoRerouteThreshold: this.config.autoRerouteThreshold + 'm',
      rerouteAttempts: this.rerouteAttempts,
      maxAttempts: this.config.maxRerouteAttempts
    });

    // Check if we're outside the off-route threshold
    if (distanceToRoute > this.config.offRouteThreshold) {
      const now = Date.now();
      
      // Start tracking off-route time
      if (!this.offRouteStartTime) {
        this.offRouteStartTime = now;
        console.log('🏕️ Started off-route tracking in campground');
        return { shouldReroute: false, reason: 'Started off-route timer', distance: distanceToRoute };
      }
      
      // Check if we've been off-route long enough
      const offRouteDuration = now - this.offRouteStartTime;
      
      // Immediate reroute if very far off-route (emergency reroute)
      if (distanceToRoute > this.config.autoRerouteThreshold) {
        if (this.rerouteAttempts < this.config.maxRerouteAttempts) {
          const timeSinceLastReroute = now - this.lastRerouteTime;
          if (timeSinceLastReroute > 30000) { // Wait 30 seconds between reroutes (increased from 10s)
            this.rerouteAttempts++;
            this.lastRerouteTime = now;
            this.offRouteStartTime = null;
            console.log('🏕️ Emergency campground reroute triggered');
            return { 
              shouldReroute: true, 
              reason: `Emergency reroute: ${distanceToRoute.toFixed(1)}m off-route`, 
              distance: distanceToRoute 
            };
          }
        }
      }
      
      // Normal reroute after consideration time
      if (offRouteDuration > this.config.rerouteConsiderationTime) {
        if (this.rerouteAttempts < this.config.maxRerouteAttempts) {
          this.rerouteAttempts++;
          this.lastRerouteTime = now;
          this.offRouteStartTime = null;
          console.log('🏕️ Campground reroute triggered after consideration time');
          return { 
            shouldReroute: true, 
            reason: `Off-route for ${(offRouteDuration/1000).toFixed(1)}s`, 
            distance: distanceToRoute 
          };
        } else {
          console.log('🏕️ Max reroute attempts reached, disabling rerouting');
          return { shouldReroute: false, reason: 'Max reroute attempts reached', distance: distanceToRoute };
        }
      }
      
      return { shouldReroute: false, reason: 'Waiting for consideration time', distance: distanceToRoute };
    } else {
      // Back on route - reset tracking
      if (this.offRouteStartTime) {
        this.offRouteStartTime = null;
        console.log('🏕️ Back on route in campground');
      }
      return { shouldReroute: false, reason: 'On route', distance: distanceToRoute };
    }
  }

  /**
   * Reset reroute state (call when starting new navigation)
   */
  reset(): void {
    this.lastPosition = null;
    this.offRouteStartTime = null;
    this.rerouteAttempts = 0;
    this.lastRerouteTime = 0;
    console.log('🏕️ Campground reroute detector reset');
  }

  /**
   * Get current reroute statistics
   */
  getStats(): {
    rerouteAttempts: number;
    maxAttempts: number;
    isOffRoute: boolean;
    offRouteDuration?: number;
  } {
    return {
      rerouteAttempts: this.rerouteAttempts,
      maxAttempts: this.config.maxRerouteAttempts,
      isOffRoute: this.offRouteStartTime !== null,
      offRouteDuration: this.offRouteStartTime ? Date.now() - this.offRouteStartTime : undefined
    };
  }
}