import { Coordinates, RouteResponse, RouteInstruction } from '../types/navigation';
import { calculateDistance } from './mapUtils';
import { SpeedTracker, ETAUpdate } from './speedTracker';
import { liveGpsLogger } from '@/utils/liveGpsLogger';

export interface RouteProgress {
  currentStep: number;
  distanceToNext: number;
  distanceRemaining: number;
  shouldAdvance: boolean;
  isOffRoute: boolean;
  percentComplete: number;
  estimatedTimeRemaining: number;
  currentSpeed: number;
  averageSpeed: number;
  dynamicETA: ETAUpdate;
  // Debugging fields
  rawGpsPosition?: Coordinates;
  snappedGpsPosition?: Coordinates;
  offRouteDistance?: number;
}

export class RouteTracker {
  private route: RouteResponse;
  private currentStepIndex: number = 0;
  private onStepChange: (step: number) => void;
  private onRouteComplete: () => void;
  private onOffRoute: (distance: number) => void;
  private totalDistance: number;
  private completedDistance: number = 0;
  private speedTracker: SpeedTracker;
  private timeBasedUpdateTimer: NodeJS.Timeout | null = null;
  private navigationStartTime: number = 0;
  
  // INSTRUCTION ANCHOR MAPPING: Maps instruction index to geometry index
  private instructionAnchorIndices: number[] = [];

  // GPS-TOLERANT Thresholds for navigation decisions in METERS
  private readonly STEP_ADVANCE_THRESHOLD = 15; // meters - bleibt bei 15m für Step-Advance
  private readonly OFF_ROUTE_THRESHOLD = 25; // GPS-TOLERANT: Erhöht von 8m auf 25m für GPS-Ungenauigkeit
  private readonly ROUTE_COMPLETE_THRESHOLD = 3; // meters - Bleibt bei 3m für präzise Ziel-Erkennung

  constructor(
    route: RouteResponse,
    onStepChange: (step: number) => void,
    onRouteComplete: () => void = () => {},
    onOffRoute: (distance: number) => void = () => {}
  ) {
    this.route = route;
    this.onStepChange = onStepChange;
    this.onRouteComplete = onRouteComplete;
    this.onOffRoute = onOffRoute;
    this.totalDistance = this.calculateTotalDistance();
    this.speedTracker = new SpeedTracker();
    this.navigationStartTime = Date.now();
    
    // INITIALIZE INSTRUCTION ANCHORS: Map each instruction to geometry index
    this.initializeInstructionAnchors();
  }

  /**
   * INSTRUCTION ANCHOR MAPPING: Initialize mapping from instructions to geometry indices
   * This fixes the bug where steps were advanced based on geometry vertices instead of actual maneuvers
   */
  private initializeInstructionAnchors(): void {
    if (!this.route.instructions || !this.route.geometry) {
      console.log('🗺️ ANCHOR MAPPING: No instructions or geometry available');
      return;
    }

    this.instructionAnchorIndices = [];
    
    for (let i = 0; i < this.route.instructions.length; i++) {
      // STRATEGY: Distribute instructions evenly across geometry
      // Since RouteInstruction doesn't have coordinates, we map them proportionally
      const distributedIndex = Math.floor((i / (this.route.instructions.length - 1)) * (this.route.geometry.length - 1));
      this.instructionAnchorIndices.push(Math.max(0, Math.min(distributedIndex, this.route.geometry.length - 1)));
    }
    
    console.log('🗺️ INSTRUCTION ANCHORS: Mapped instructions to geometry:', {
      instructionCount: this.route.instructions.length,
      geometryCount: this.route.geometry.length,
      anchors: this.instructionAnchorIndices
    });
  }
  

  /**
   * Calculate distance along route to next maneuver (not just next vertex)
   */
  private calculateDistanceToNextManeuver(currentPosition: Coordinates): number {
    if (this.currentStepIndex >= this.instructionAnchorIndices.length - 1) {
      // At final step, return distance to destination
      const destination = {
        lat: this.route.geometry[this.route.geometry.length - 1][1],
        lng: this.route.geometry[this.route.geometry.length - 1][0]
      };
      return calculateDistance(currentPosition, destination);
    }
    
    // Find current position on route
    const routeInfo = this.findClosestPointOnRoute(currentPosition);
    const nextAnchorIndex = this.instructionAnchorIndices[this.currentStepIndex + 1];
    
    // Calculate along-route distance from current position to next maneuver anchor
    let distanceToManeuver = 0;
    
    // Add distance from current position to end of current segment
    if (routeInfo.segmentIndex < this.route.geometry.length - 1) {
      const segmentEnd = {
        lat: this.route.geometry[routeInfo.segmentIndex + 1][1],
        lng: this.route.geometry[routeInfo.segmentIndex + 1][0]
      };
      distanceToManeuver += calculateDistance(routeInfo.point, segmentEnd);
    }
    
    // Add distance for segments between current and anchor
    for (let i = routeInfo.segmentIndex + 1; i < nextAnchorIndex; i++) {
      if (i < this.route.geometry.length - 1) {
        const segmentStart = {
          lat: this.route.geometry[i][1],
          lng: this.route.geometry[i][0]
        };
        const segmentEnd = {
          lat: this.route.geometry[i + 1][1],
          lng: this.route.geometry[i + 1][0]
        };
        distanceToManeuver += calculateDistance(segmentStart, segmentEnd);
      }
    }
    
    return distanceToManeuver;
  }

  /**
   * Updates the route and resets tracking state for new route
   */
  updateRoute(newRoute: RouteResponse): void {
    this.route = newRoute;
    this.currentStepIndex = 0;
    this.completedDistance = 0;
    this.totalDistance = this.calculateTotalDistance();
    this.speedTracker = new SpeedTracker();
    this.navigationStartTime = Date.now();
    
    // REINITIALIZE INSTRUCTION ANCHORS for new route
    this.initializeInstructionAnchors();
    
    console.log('🗺️ RouteTracker updated with new route');
  }

  private calculateTotalDistance(): number {
    if (!this.route.geometry || this.route.geometry.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < this.route.geometry.length; i++) {
      const prev = { lat: this.route.geometry[i-1][1], lng: this.route.geometry[i-1][0] };
      const curr = { lat: this.route.geometry[i][1], lng: this.route.geometry[i][0] };
      total += calculateDistance(prev, curr);
    }
    return total;
  }

  private findClosestPointOnRoute(position: Coordinates): {
    point: Coordinates;
    distance: number;
    segmentIndex: number;
  } {
    if (!this.route.geometry || this.route.geometry.length < 2) {
      return {
        point: position,
        distance: 0,
        segmentIndex: 0
      };
    }

    let minDistance = Infinity;
    let closestPoint = position;
    let closestSegmentIndex = 0;

    for (let i = 0; i < this.route.geometry.length - 1; i++) {
      const segmentStart = { 
        lat: this.route.geometry[i][1], 
        lng: this.route.geometry[i][0] 
      };
      const segmentEnd = { 
        lat: this.route.geometry[i + 1][1], 
        lng: this.route.geometry[i + 1][0] 
      };

      const closestOnSegment = this.getClosestPointOnSegment(
        position, 
        segmentStart, 
        segmentEnd
      );

      const distance = calculateDistance(position, closestOnSegment);

      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = closestOnSegment;
        closestSegmentIndex = i;
      }
    }

    return {
      point: closestPoint,
      distance: minDistance,
      segmentIndex: closestSegmentIndex
    };
  }

  private getClosestPointOnSegment(
    point: Coordinates,
    segmentStart: Coordinates,
    segmentEnd: Coordinates
  ): Coordinates {
    const A = point.lat - segmentStart.lat;
    const B = point.lng - segmentStart.lng;
    const C = segmentEnd.lat - segmentStart.lat;
    const D = segmentEnd.lng - segmentStart.lng;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;

    if (lenSq === 0) return segmentStart;

    let param = dot / lenSq;

    if (param < 0) {
      return segmentStart;
    } else if (param > 1) {
      return segmentEnd;
    } else {
      return {
        lat: segmentStart.lat + param * C,
        lng: segmentStart.lng + param * D
      };
    }
  }

  updatePosition(position: Coordinates, travelMode?: 'car' | 'bike' | 'pedestrian'): RouteProgress {
    console.log('🗺️ ROUTE TRACKER: updatePosition called:', {
      position: position,
      travelMode: travelMode,
      currentStep: this.currentStepIndex,
      totalSteps: this.route.instructions?.length || 0,
      timestamp: new Date().toISOString()
    });

    if (!this.route.geometry || this.route.geometry.length === 0) {
      console.log('🗺️ ROUTE TRACKER: No route geometry, returning default progress');
      return this.createDefaultProgress();
    }

    // Add position to speed tracker
    this.speedTracker.addPosition(position);

    // Find closest point on route
    const routeInfo = this.findClosestPointOnRoute(position);
    const isOffRoute = routeInfo.distance > this.OFF_ROUTE_THRESHOLD;

    console.log('🗺️ ROUTE TRACKER: Position analysis:', {
      distanceFromRoute: routeInfo.distance,
      threshold: this.OFF_ROUTE_THRESHOLD,
      isOffRoute: isOffRoute,
      segmentIndex: routeInfo.segmentIndex
    });

    // LIVE GPS LOGGING: Log route analysis
    liveGpsLogger.log({
      type: 'ROUTE_ANALYSIS',
      gpsPosition: position,
      routeInfo: {
        currentRoute: this.route,
        currentStep: this.currentStepIndex,
        totalSteps: this.route.instructions.length,
        distanceToRoute: routeInfo.distance,
        isOffRoute: isOffRoute,
        offRouteThreshold: this.OFF_ROUTE_THRESHOLD
      },
      engineDecision: {
        action: isOffRoute ? 'REROUTE' : 'CONTINUE',
        details: `Position ${isOffRoute ? 'OFF' : 'ON'} route by ${routeInfo.distance.toFixed(1)}m`,
        conditions: {
          distanceFromRoute: routeInfo.distance,
          threshold: this.OFF_ROUTE_THRESHOLD,
          segmentIndex: routeInfo.segmentIndex
        }
      }
    });

    // FIXED: Use distance to next MANEUVER instead of next geometry vertex
    const distanceToNextManeuver = this.calculateDistanceToNextManeuver(position);
    const shouldAdvance = distanceToNextManeuver < this.STEP_ADVANCE_THRESHOLD;
    
    console.log('🗺️ STEP ADVANCE CHECK:', {
      currentStep: this.currentStepIndex,
      distanceToNextManeuver: distanceToNextManeuver.toFixed(1) + 'm',
      threshold: this.STEP_ADVANCE_THRESHOLD + 'm',
      shouldAdvance: shouldAdvance,
      nextInstructionAnchor: this.instructionAnchorIndices[this.currentStepIndex + 1] || 'final'
    });

    // Check if route is complete - More accurate destination detection
    const destination = {
      lat: this.route.geometry[this.route.geometry.length - 1][1],
      lng: this.route.geometry[this.route.geometry.length - 1][0]
    };
    const distanceToDestination = calculateDistance(position, destination);

    // FIXED: Complete only based on distance to destination, NOT step index
    // This prevents "Sie haben Ihr Ziel erreicht" at 96m when reaching final step
    const isComplete = distanceToDestination < this.ROUTE_COMPLETE_THRESHOLD;
    const isAtFinalStep = this.currentStepIndex >= this.route.instructions.length - 1;

    // Advance step if needed
    if (shouldAdvance && this.currentStepIndex < this.route.instructions.length - 1) {
      const previousStep = this.currentStepIndex;
      this.currentStepIndex++;
      console.log('🗺️ ROUTE TRACKER: STEP ADVANCED!', {
        previousStep: previousStep,
        newStep: this.currentStepIndex,
        distanceToNextManeuver: distanceToNextManeuver.toFixed(1) + 'm',
        threshold: this.STEP_ADVANCE_THRESHOLD + 'm',
        newInstruction: this.route.instructions[this.currentStepIndex]?.instruction || 'Unknown'
      });
      this.onStepChange(this.currentStepIndex);
    } else if (shouldAdvance) {
      console.log('🗺️ ROUTE TRACKER: Step advance blocked - at final step');
    }

    // Check for route completion
    if (isComplete) {
      console.log('🎯 DESTINATION ARRIVAL: Route completed!', {
        distanceToDestination: distanceToDestination.toFixed(1) + 'm',
        threshold: this.ROUTE_COMPLETE_THRESHOLD + 'm',
        isAtFinalStep: isAtFinalStep,
        finalStep: this.currentStepIndex + '/' + this.route.instructions.length
      });
      this.onRouteComplete();
    } else {
      // Debug: Log why completion is not triggered
      console.log('🎯 DESTINATION CHECK:', {
        distanceToDestination: distanceToDestination.toFixed(1) + 'm',
        threshold: this.ROUTE_COMPLETE_THRESHOLD + 'm',
        withinThreshold: distanceToDestination < this.ROUTE_COMPLETE_THRESHOLD,
        isAtFinalStep: isAtFinalStep,
        stepProgress: this.currentStepIndex + '/' + this.route.instructions.length,
        completionReady: isAtFinalStep && distanceToDestination < this.ROUTE_COMPLETE_THRESHOLD
      });
    }

    // Trigger off-route callback
    if (isOffRoute) {
      console.log('🗺️ ROUTE TRACKER: OFF-ROUTE DETECTED!', {
        distance: routeInfo.distance,
        threshold: this.OFF_ROUTE_THRESHOLD,
        position: position
      });

      // LIVE GPS LOGGING: Log off-route detection trigger
      liveGpsLogger.log({
        type: 'ROUTE_ENGINE',
        gpsPosition: position,
        routeInfo: {
          currentRoute: this.route,
          currentStep: this.currentStepIndex,
          totalSteps: this.route.instructions.length,
          distanceToRoute: routeInfo.distance,
          isOffRoute: true,
          offRouteThreshold: this.OFF_ROUTE_THRESHOLD
        },
        engineDecision: {
          action: 'REROUTE',
          details: `Triggering off-route callback - distance: ${routeInfo.distance.toFixed(1)}m exceeds threshold: ${this.OFF_ROUTE_THRESHOLD}m`,
          conditions: {
            callbackTriggered: true,
            distance: routeInfo.distance,
            threshold: this.OFF_ROUTE_THRESHOLD
          }
        }
      });

      this.onOffRoute(routeInfo.distance);
    }

    // Calculate remaining distance
    const distanceRemaining = this.calculateRemainingDistance(position);
    const percentComplete = Math.min(
      ((this.totalDistance - distanceRemaining) / this.totalDistance) * 100,
      100
    );

    // Get speed data and dynamic ETA
    const speedData = this.speedTracker.getSpeedData();
    const dynamicETA = this.speedTracker.calculateUpdatedETA(distanceRemaining, travelMode);

    // Estimate remaining time based on speed tracking
    const estimatedTimeRemaining = dynamicETA.estimatedTimeRemaining;

    const progress: RouteProgress = {
      currentStep: this.currentStepIndex,
      distanceToNext: distanceToNextManeuver, // FIXED: Use distance to maneuver
      distanceRemaining,
      shouldAdvance,
      isOffRoute,
      percentComplete,
      estimatedTimeRemaining,
      currentSpeed: speedData.currentSpeed,
      averageSpeed: speedData.averageSpeed,
      dynamicETA,
      // Add debug info
      rawGpsPosition: position,
      snappedGpsPosition: routeInfo.point,
      offRouteDistance: routeInfo.distance,
    };

    console.log('🗺️ ROUTE TRACKER: Progress calculated:', {
      currentStep: progress.currentStep,
      distanceToNextManeuver: Math.round(progress.distanceToNext) + 'm', // FIXED: Shows distance to maneuver
      distanceRemaining: Math.round(progress.distanceRemaining * 1000) + 'm',
      percentComplete: Math.round(progress.percentComplete) + '%',
      estimatedTimeRemaining: Math.round(progress.estimatedTimeRemaining / 60) + 'min',
      currentSpeed: Math.round(progress.currentSpeed) + 'km/h'
    });

    return progress;
  }

  private calculateRemainingDistance(currentPosition: Coordinates): number {
    if (!this.route.geometry || this.route.geometry.length === 0) return 0;

    // Find closest point on route
    const routeInfo = this.findClosestPointOnRoute(currentPosition);

    // Calculate distance from closest point to destination
    let remaining = 0;

    // Add distance from closest point to end of current segment
    if (routeInfo.segmentIndex < this.route.geometry.length - 1) {
      const segmentEnd = {
        lat: this.route.geometry[routeInfo.segmentIndex + 1][1],
        lng: this.route.geometry[routeInfo.segmentIndex + 1][0]
      };
      remaining += calculateDistance(routeInfo.point, segmentEnd);
    }

    // Add distance for all remaining segments
    for (let i = routeInfo.segmentIndex + 1; i < this.route.geometry.length - 1; i++) {
      const segmentStart = {
        lat: this.route.geometry[i][1],
        lng: this.route.geometry[i][0]
      };
      const segmentEnd = {
        lat: this.route.geometry[i + 1][1],
        lng: this.route.geometry[i + 1][0]
      };
      remaining += calculateDistance(segmentStart, segmentEnd);
    }

    return remaining;
  }

  private createDefaultProgress(): RouteProgress {
    const defaultETA: ETAUpdate = {
      estimatedTimeRemaining: 0,
      estimatedArrival: new Date(),
      speedBasedETA: 0,
      distanceRemaining: 0
    };

    return {
      currentStep: 0,
      distanceToNext: 0,
      distanceRemaining: 0,
      shouldAdvance: false,
      isOffRoute: false,
      percentComplete: 0,
      estimatedTimeRemaining: 0,
      currentSpeed: 0,
      averageSpeed: 0,
      dynamicETA: defaultETA
    };
  }

  getCurrentInstruction(): RouteInstruction | null {
    if (!this.route.instructions || this.currentStepIndex >= this.route.instructions.length) {
      return null;
    }
    // Convert string instruction to RouteInstruction object
    const instruction = this.route.instructions[this.currentStepIndex];
    if (typeof instruction === 'string') {
      return {
        instruction: instruction,
        distance: '0m', // Default distance
        duration: '0s', // Default duration
        maneuverType: 'straight' // Default maneuver
      };
    }
    return instruction; // Already a RouteInstruction object
  }

  getNextInstruction(): RouteInstruction | null {
    const nextIndex = this.currentStepIndex + 1;
    if (!this.route.instructions || nextIndex >= this.route.instructions.length) {
      return null;
    }
    // Convert string instruction to RouteInstruction object
    const instruction = this.route.instructions[nextIndex];
    if (typeof instruction === 'string') {
      return {
        instruction: instruction,
        distance: '0m', // Default distance
        duration: '0s', // Default duration
        maneuverType: 'straight' // Default maneuver
      };
    }
    return instruction; // Already a RouteInstruction object
  }

  reset(): void {
    this.currentStepIndex = 0;
    this.completedDistance = 0;
    this.speedTracker.reset();
  }

  // Get current step progress for UI
  getStepProgress(): {
    current: number;
    total: number;
    instruction: RouteInstruction | null;
    nextInstruction: RouteInstruction | null;
  } {
    return {
      current: this.currentStepIndex + 1,
      total: this.route.instructions.length,
      instruction: this.getCurrentInstruction(),
      nextInstruction: this.getNextInstruction()
    };
  }
}